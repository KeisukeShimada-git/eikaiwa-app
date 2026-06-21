export type ScenarioCategory = "hotel" | "restaurant" | "airport" | "directions";

export type Scenario = {
  id: string;
  category: ScenarioCategory;
  title: string;
  location: string;
  role: string;
  openingLine: string;
  troubleSeeds: string[];
};

export type Speaker = "user" | "assistant" | "system";

export type TranscriptMessage = {
  id: string;
  speaker: Speaker;
  text: string;
  createdAt: string;
};

export type FeedbackReport = {
  grammar: string[];
  naturalExpressions: string[];
  vocabulary: string[];
  overallScore: number;
  summary: string;
};

export type ConnectionStatus = "idle" | "connecting" | "connected" | "feedback" | "failed";
