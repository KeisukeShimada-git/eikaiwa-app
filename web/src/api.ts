import type { FeedbackReport, Scenario, TranscriptMessage } from "./types";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:8787" : "");

async function ensureOk(response: Response) {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }
}

export async function createRealtimeSession(sdp: string, instructions: string) {
  const response = await fetch(`${apiBaseUrl}/api/realtime/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sdp, instructions, voice: "marin" })
  });
  await ensureOk(response);
  return response.text();
}

export async function createFeedback(scenario: Scenario, transcript: TranscriptMessage[]): Promise<FeedbackReport> {
  const response = await fetch(`${apiBaseUrl}/api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenarioTitle: scenario.title, transcript })
  });
  await ensureOk(response);
  return response.json();
}
