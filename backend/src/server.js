import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const port = Number(process.env.PORT || 8787);
const realtimeModel = process.env.REALTIME_MODEL || "gpt-realtime-2";
const feedbackModel = process.env.FEEDBACK_MODEL || "gpt-5.5";

function requireApiKey() {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error("OPENAI_API_KEY is not set");
    error.status = 500;
    throw error;
  }
  return process.env.OPENAI_API_KEY;
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/realtime/session", async (req, res, next) => {
  try {
    const apiKey = requireApiKey();
    const { sdp, instructions, voice = "marin" } = req.body;

    if (!sdp || typeof sdp !== "string") {
      return res.status(400).json({ error: "sdp is required" });
    }
    if (!instructions || typeof instructions !== "string") {
      return res.status(400).json({ error: "instructions is required" });
    }

    const form = new FormData();
    form.set("sdp", sdp);
    form.set("session", JSON.stringify({
      type: "realtime",
      model: realtimeModel,
      instructions,
      audio: {
        input: {
          transcription: { model: "gpt-4o-mini-transcribe" },
          turn_detection: {
            type: "semantic_vad",
            create_response: true,
            eagerness: "medium",
            interrupt_response: true
          }
        },
        output: { voice }
      }
    }));

    const response = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Safety-Identifier": "traveltalk-mvp-user"
      },
      body: form
    });

    const answerSdp = await response.text();
    if (!response.ok) {
      return res.status(response.status).type("application/json").send(answerSdp);
    }

    res.type("application/sdp").send(answerSdp);
  } catch (error) {
    next(error);
  }
});

app.post("/api/realtime/session", (req, res, next) => {
  req.url = "/realtime/session";
  app.handle(req, res, next);
});

app.post("/realtime/client-secret", async (req, res, next) => {
  try {
    const apiKey = requireApiKey();
    const { instructions, voice = "marin" } = req.body;

    if (!instructions || typeof instructions !== "string") {
      return res.status(400).json({ error: "instructions is required" });
    }

    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Safety-Identifier": "traveltalk-mvp-user"
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: realtimeModel,
          instructions,
          audio: {
            input: {
              transcription: { model: "gpt-4o-mini-transcribe" },
              turn_detection: {
                type: "semantic_vad",
                create_response: true,
                eagerness: "medium",
                interrupt_response: true
              }
            },
            output: { voice }
          }
        }
      })
    });

    const text = await response.text();
    if (!response.ok) {
      return res.status(response.status).type("application/json").send(text);
    }

    const data = JSON.parse(text);
    const value = data?.value || data?.client_secret?.value;
    res.json({ value, raw: data });
  } catch (error) {
    next(error);
  }
});

app.post("/feedback", async (req, res, next) => {
  try {
    const apiKey = requireApiKey();
    const { scenarioTitle, transcript } = req.body;

    if (!Array.isArray(transcript)) {
      return res.status(400).json({ error: "transcript must be an array" });
    }

    const conversation = transcript
      .map((turn) => `${turn.speaker}: ${turn.text}`)
      .join("\n");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: feedbackModel,
        input: [
          {
            role: "system",
            content:
              "You are an English coach for Japanese travelers. Return only strict JSON with keys grammar, naturalExpressions, vocabulary, overallScore, summary. Each array item must be concise Japanese feedback with the user's original phrase when available and a better English example."
          },
          {
            role: "user",
            content: `Scenario: ${scenarioTitle}\n\nTranscript:\n${conversation}`
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "travel_english_feedback",
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["grammar", "naturalExpressions", "vocabulary", "overallScore", "summary"],
              properties: {
                grammar: { type: "array", items: { type: "string" } },
                naturalExpressions: { type: "array", items: { type: "string" } },
                vocabulary: { type: "array", items: { type: "string" } },
                overallScore: { type: "integer", minimum: 1, maximum: 100 },
                summary: { type: "string" }
              }
            },
            strict: true
          }
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    const outputText = data.output_text || data.output?.flatMap((item) => item.content || [])
      .find((content) => content.type === "output_text")?.text;
    res.json(JSON.parse(outputText));
  } catch (error) {
    next(error);
  }
});

app.post("/api/feedback", (req, res, next) => {
  req.url = "/feedback";
  app.handle(req, res, next);
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({ error: error.message || "Internal Server Error" });
});

app.listen(port, () => {
  console.log(`TravelTalk backend listening on http://localhost:${port}`);
});
