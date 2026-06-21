export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    setCors(res);
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    setCors(res);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    setCors(res);
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OPENAI_API_KEY is not set" });
    }

    const { sdp, instructions, voice = "marin" } = req.body || {};
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
      model: process.env.REALTIME_MODEL || "gpt-realtime-2",
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
        "OpenAI-Safety-Identifier": "traveltalk-vercel-user"
      },
      body: form
    });

    const answerSdp = await response.text();
    if (!response.ok) {
      return res.status(response.status).type("application/json").send(answerSdp);
    }

    return res.status(200).type("application/sdp").send(answerSdp);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
