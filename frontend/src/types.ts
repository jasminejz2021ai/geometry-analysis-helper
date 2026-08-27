export type TriangleDiagram = {
  kind: "triangle";
  a: number | null;
  b: number | null;
  c: number | null;
  right_angle: boolean;
  labels: Record<string, string>;
};

export type CircleDiagram = {
  kind: "circle";
  radius: number | null;
  diameter: number | null;
  labels: Record<string, string>;
};

export type RectangleDiagram = {
  kind: "rectangle";
  width: number | null;
  height: number | null;
  labels: Record<string, string>;
};

export type CoordinateDiagram = {
  kind: "coordinate";
  points: [number, number][];
  labels: string[];
};

export type Diagram =
  | TriangleDiagram
  | CircleDiagram
  | RectangleDiagram
  | CoordinateDiagram;

export type Problem = {
  id: string;
  prompt: string;
  answer: string;
  steps: string[];
  unit: string | null;
  diagram: Diagram | null;
};

export type SolveResponse = {
  source: "template" | "llm" | "dify" | "gunn";
  topic: string;
  original: Problem;
  practice: Problem[];
  concept_review?: string[];
  asked_solution?: Problem | null;
};

export type GenerateMoreResponse = {
  source: "template" | "llm" | "dify" | "gunn";
  topic: string;
  practice: Problem[];
  concept_review?: string[];
};

export type CheckResponse = {
  correct: boolean;
  feedback: string;
};

export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

export type ChatResponse = {
  answer: string;
};

export type AiStatus = {
  configured: boolean;
  online: boolean;
  provider: string;
};

export type TopicRef = {
  id: string;
  title: string;
};

export type HonorsUnit = {
  unit: string;
  topics: TopicRef[];
};

export type GroupedTopicsResponse = {
  units: HonorsUnit[];
};
