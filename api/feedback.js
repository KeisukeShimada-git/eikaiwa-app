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

    const { scenarioTitle, transcript } = req.body || {};
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
        model: process.env.FEEDBACK_MODEL || "gpt-5.5",
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

    return res.status(200).json(JSON.parse(outputText));
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
