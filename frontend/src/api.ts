import type {
  AiStatus,
  AnalysisMoreResponse,
  ChatResponse,
  ChatTurn,
  CheckResponse,
  GenerateMoreResponse,
  GroupedTopicsResponse,
  SolveResponse,
} from "./types";

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.detail) detail = data.detail;
    } catch {
      // ignore parse errors
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

export function solve(question: string, count = 4): Promise<SolveResponse> {
  return post<SolveResponse>("/api/solve", { question, count });
}

export async function solveImage(
  file: File,
  count = 4,
): Promise<SolveResponse> {
  const form = new FormData();
  form.append("image", file);
  form.append("count", String(count));
  const res = await fetch("/api/solve-image", { method: "POST", body: form });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.detail) detail = data.detail;
    } catch {
      // ignore parse errors
    }
    throw new Error(detail);
  }
  return res.json() as Promise<SolveResponse>;
}

export function generateMore(
  topic: string,
  count = 4,
): Promise<GenerateMoreResponse> {
  return post<GenerateMoreResponse>("/api/generate-more", { topic, count });
}

export function check(
  expected: string,
  submitted: string,
): Promise<CheckResponse> {
  return post<CheckResponse>("/api/check", { expected, submitted });
}

export function chat(
  question: string,
  context?: string,
  history: ChatTurn[] = [],
): Promise<ChatResponse> {
  return post<ChatResponse>("/api/chat", { question, context, history });
}

export function fetchAiStatus(): Promise<AiStatus> {
  return get<AiStatus>("/api/ai-status");
}

export function fetchGroupedTopics(): Promise<GroupedTopicsResponse> {
  return get<GroupedTopicsResponse>("/api/topics-grouped");
}

export function fetchAnalysisTopics(): Promise<GroupedTopicsResponse> {
  return get<GroupedTopicsResponse>("/api/analysis-topics");
}

export function solveAnalysis(
  question: string,
  count = 4,
): Promise<SolveResponse> {
  return post<SolveResponse>("/api/analysis/solve", { question, count });
}

export function analysisPractice(
  topic: string,
  count = 5,
): Promise<SolveResponse> {
  return post<SolveResponse>("/api/analysis/practice", { topic, count });
}

export function analysisMorePractice(
  topic: string,
  have: number,
  count = 4,
): Promise<AnalysisMoreResponse> {
  return post<AnalysisMoreResponse>("/api/analysis/more-practice", {
    topic,
    have,
    count,
  });
}

export async function analysisSolveImage(
  file: File,
  count = 4,
): Promise<SolveResponse> {
  const form = new FormData();
  form.append("image", file);
  form.append("count", String(count));
  const res = await fetch("/api/analysis/solve-image", {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.detail) detail = data.detail;
    } catch {
      // ignore parse errors
    }
    throw new Error(detail);
  }
  return res.json() as Promise<SolveResponse>;
}
