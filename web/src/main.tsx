import React, { useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowLeft, CheckCircle2, Hotel, Map, Mic, Plane, RefreshCcw, Utensils } from "lucide-react";
import { createFeedback } from "./api";
import { RealtimeConversation } from "./realtime";
import { categoryLabels, scenarios } from "./scenarios";
import type { ConnectionStatus, FeedbackReport, Scenario, ScenarioCategory, TranscriptMessage } from "./types";
import "./styles.css";

function App() {
  const [selectedCategory, setSelectedCategory] = useState<ScenarioCategory | "all">("all");
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [feedback, setFeedback] = useState<FeedbackReport | null>(null);
  const [error, setError] = useState("");
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const conversationRef = useRef<RealtimeConversation | null>(null);
  const scenarioRef = useRef<Scenario | null>(null);
  const transcriptRef = useRef<TranscriptMessage[]>([]);

  const filteredScenarios = useMemo(() => {
    return selectedCategory === "all" ? scenarios : scenarios.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  async function startScenario(nextScenario: Scenario) {
    scenarioRef.current = nextScenario;
    transcriptRef.current = [];
    setScenario(nextScenario);
    setTranscript([]);
    setFeedback(null);
    setError("");

    const conversation = new RealtimeConversation({
      onStatus: (nextStatus) => setStatus(nextStatus),
      onTranscript: (message) => {
        transcriptRef.current = [...transcriptRef.current, message];
        setTranscript(transcriptRef.current);
      },
      onFeedbackRequested: () => void endAndFeedback(),
      onError: setError
    });
    conversationRef.current = conversation;

    try {
      await conversation.start(nextScenario);
    } catch (startError) {
      setStatus("failed");
      setError(startError instanceof Error ? startError.message : "会話を開始できませんでした。");
    }
  }

  async function endAndFeedback() {
    const currentScenario = scenarioRef.current;
    if (!currentScenario) return;
    conversationRef.current?.stop();
    conversationRef.current = null;
    setStatus("feedback");
    setIsFeedbackLoading(true);
    setError("");
    try {
      const report = await createFeedback(currentScenario, transcriptRef.current);
      setFeedback(report);
    } catch (feedbackError) {
      setError(feedbackError instanceof Error ? feedbackError.message : "添削を作成できませんでした。");
    } finally {
      setIsFeedbackLoading(false);
    }
  }

  function reset() {
    conversationRef.current?.stop();
    conversationRef.current = null;
    scenarioRef.current = null;
    transcriptRef.current = [];
    setScenario(null);
    setStatus("idle");
    setTranscript([]);
    setFeedback(null);
    setError("");
  }

  if (status === "feedback") {
    return (
      <FeedbackScreen
        scenario={scenario}
        feedback={feedback}
        isLoading={isFeedbackLoading}
        error={error}
        onReset={reset}
      />
    );
  }

  if (scenario) {
    return (
      <ConversationScreen
        scenario={scenario}
        status={status}
        transcript={transcript}
        error={error}
        onBack={reset}
        onFinish={() => void endAndFeedback()}
      />
    );
  }

  return (
    <main className="shell">
      <section className="top-panel">
        <p className="eyebrow">Travel English for Japanese travelers</p>
        <h1>TravelTalk</h1>
        <p className="lead">旅先スタッフを相手に、英語だけでリアルタイム会話。</p>
      </section>

      <div className="segment" role="tablist" aria-label="Scenario category">
        <button className={selectedCategory === "all" ? "active" : ""} onClick={() => setSelectedCategory("all")}>すべて</button>
        {(Object.keys(categoryLabels) as ScenarioCategory[]).map((category) => (
          <button
            key={category}
            className={selectedCategory === category ? "active" : ""}
            onClick={() => setSelectedCategory(category)}
          >
            {categoryLabels[category]}
          </button>
        ))}
      </div>

      <section className="scenario-list">
        {filteredScenarios.map((item) => (
          <button className="scenario-card" key={item.id} onClick={() => void startScenario(item)}>
            <span className="card-icon">{iconFor(item.category)}</span>
            <span>
              <strong>{item.title}</strong>
              <small>{item.location}</small>
              <em>{item.troubleSeeds[0]}</em>
            </span>
          </button>
        ))}
      </section>
    </main>
  );
}

function ConversationScreen(props: {
  scenario: Scenario;
  status: ConnectionStatus;
  transcript: TranscriptMessage[];
  error: string;
  onBack: () => void;
  onFinish: () => void;
}) {
  return (
    <main className="conversation">
      <header className="conversation-header">
        <button className="icon-button" onClick={props.onBack} aria-label="Back"><ArrowLeft size={22} /></button>
        <div>
          <h1>{props.scenario.title}</h1>
          <p>{statusLabel(props.status)}</p>
        </div>
      </header>

      <section className="voice-stage">
        <div className={`pulse ${props.status === "connected" ? "live" : ""}`}><Mic size={34} /></div>
        <p>{props.status === "connected" ? "Speak in English" : "Preparing microphone"}</p>
      </section>

      <section className="transcript">
        {props.transcript.map((message) => (
          <article key={message.id} className={`bubble ${message.speaker}`}>
            {message.text}
          </article>
        ))}
      </section>

      <footer className="action-bar">
        {props.error && <p className="error">{props.error}</p>}
        <button className="primary" onClick={props.onFinish}>
          <CheckCircle2 size={20} />
          終了して添削
        </button>
        <small>会話中に feedback と言っても添削へ進みます。</small>
      </footer>
    </main>
  );
}

function FeedbackScreen(props: {
  scenario: Scenario | null;
  feedback: FeedbackReport | null;
  isLoading: boolean;
  error: string;
  onReset: () => void;
}) {
  return (
    <main className="shell">
      <section className="top-panel compact">
        <p className="eyebrow">{props.scenario?.title || "Feedback"}</p>
        <h1>Feedback</h1>
      </section>

      {props.isLoading && <div className="loading">添削を作成中...</div>}
      {props.error && <p className="error">{props.error}</p>}
      {props.feedback && (
        <section className="feedback-grid">
          <div className="score"><strong>{props.feedback.overallScore}</strong><span>/100</span></div>
          <FeedbackSection title="文法" items={props.feedback.grammar} />
          <FeedbackSection title="より自然な表現" items={props.feedback.naturalExpressions} />
          <FeedbackSection title="語彙" items={props.feedback.vocabulary} />
          <FeedbackSection title="総合評価" items={[props.feedback.summary]} />
        </section>
      )}

      <button className="primary" onClick={props.onReset}>
        <RefreshCcw size={20} />
        シナリオ選択へ
      </button>
    </main>
  );
}

function FeedbackSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="feedback-section">
      <h2>{title}</h2>
      {(items.length ? items : ["今回の会話では大きな指摘はありません。"]).map((item) => (
        <p key={item}>{item}</p>
      ))}
    </section>
  );
}

function iconFor(category: ScenarioCategory) {
  const props = { size: 22 };
  if (category === "hotel") return <Hotel {...props} />;
  if (category === "restaurant") return <Utensils {...props} />;
  if (category === "airport") return <Plane {...props} />;
  return <Map {...props} />;
}

function statusLabel(status: ConnectionStatus) {
  if (status === "connecting") return "接続中";
  if (status === "connected") return "会話中";
  if (status === "failed") return "接続エラー";
  return "待機中";
}

createRoot(document.getElementById("root")!).render(<App />);
