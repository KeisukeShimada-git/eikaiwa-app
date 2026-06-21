import { createRealtimeSession } from "./api";
import { buildInstructions } from "./prompts";
import type { Scenario, TranscriptMessage } from "./types";

type RealtimeCallbacks = {
  onStatus: (status: "connecting" | "connected" | "failed") => void;
  onTranscript: (message: TranscriptMessage) => void;
  onFeedbackRequested: () => void;
  onError: (message: string) => void;
};

export class RealtimeConversation {
  private peerConnection?: RTCPeerConnection;
  private dataChannel?: RTCDataChannel;
  private localStream?: MediaStream;
  private remoteAudio?: HTMLAudioElement;
  private assistantBuffer = "";
  private callbacks: RealtimeCallbacks;

  constructor(callbacks: RealtimeCallbacks) {
    this.callbacks = callbacks;
  }

  async start(scenario: Scenario) {
    this.callbacks.onStatus("connecting");
    const instructions = buildInstructions(scenario);

    this.peerConnection = new RTCPeerConnection();
    this.dataChannel = this.peerConnection.createDataChannel("oai-events");
    this.dataChannel.onmessage = (event) => this.handleEvent(event.data);
    this.dataChannel.onopen = () => {
      this.callbacks.onStatus("connected");
      this.send({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: "Please start the roleplay now." }]
        }
      });
      this.send({ type: "response.create" });
    };

    this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    for (const track of this.localStream.getTracks()) {
      this.peerConnection.addTrack(track, this.localStream);
    }

    this.remoteAudio = new Audio();
    this.remoteAudio.autoplay = true;
    this.peerConnection.ontrack = (event) => {
      if (!this.remoteAudio) return;
      this.remoteAudio.srcObject = event.streams[0];
      void this.remoteAudio.play();
    };

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    const answerSdp = await createRealtimeSession(offer.sdp || "", instructions);
    await this.peerConnection.setRemoteDescription({ type: "answer", sdp: answerSdp });
  }

  stop() {
    this.flushAssistantBuffer();
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.dataChannel?.close();
    this.peerConnection?.close();
    this.remoteAudio?.pause();
    this.localStream = undefined;
    this.dataChannel = undefined;
    this.peerConnection = undefined;
    this.remoteAudio = undefined;
  }

  private send(payload: unknown) {
    if (this.dataChannel?.readyState === "open") {
      this.dataChannel.send(JSON.stringify(payload));
    }
  }

  private handleEvent(raw: string) {
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(raw);
    } catch {
      return;
    }

    const type = String(event.type || "");
    if (type === "response.output_audio_transcript.delta" || type === "response.output_text.delta") {
      this.assistantBuffer += String(event.delta || "");
      return;
    }

    if (type === "response.output_audio_transcript.done" || type === "response.output_text.done" || type === "response.done") {
      this.flushAssistantBuffer();
      return;
    }

    if (type === "conversation.item.input_audio_transcription.completed") {
      const text = String(event.transcript || "").trim();
      if (!text) return;
      this.callbacks.onTranscript(toMessage("user", text));
      if (text.toLowerCase().includes("feedback")) {
        this.callbacks.onFeedbackRequested();
      }
      return;
    }

    if (type === "error") {
      const error = event.error as { message?: string } | undefined;
      const message = error?.message || "Realtime API error";
      this.callbacks.onStatus("failed");
      this.callbacks.onError(message);
    }
  }

  private flushAssistantBuffer() {
    const text = this.assistantBuffer.trim();
    if (!text) return;
    this.assistantBuffer = "";
    this.callbacks.onTranscript(toMessage("assistant", text));
  }
}

function toMessage(speaker: "user" | "assistant", text: string): TranscriptMessage {
  return {
    id: crypto.randomUUID(),
    speaker,
    text,
    createdAt: new Date().toISOString()
  };
}
