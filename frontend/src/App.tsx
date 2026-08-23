import { useCallback, useState } from "react";
import {
  analysisPractice,
  analysisSolveImage,
  fetchAnalysisTopics,
  fetchGroupedTopics,
  generateMore,
  solve,
  solveAnalysis,
  solveImage,
} from "./api";
import GeometryBackground from "./components/GeometryBackground";
import AiStatusBanner from "./components/AiStatusBanner";
import ImageUpload from "./components/ImageUpload";
import LoadingPanel from "./components/LoadingPanel";
import QuestionInput from "./components/QuestionInput";
import ResultTabs from "./components/ResultTabs";
import TopicBrowser from "./components/TopicBrowser";
import type { Problem, SolveResponse } from "./types";

type Subject = "geometry" | "analysis";

export default function App() {
  const [subject, setSubject] = useState<Subject>("geometry");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SolveResponse | null>(null);
  const [practice, setPractice] = useState<Problem[]>([]);
  const [conceptReview, setConceptReview] = useState<string[]>([]);
  // When a topic is picked from the browser we track it here (no worked example).
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [topicTitle, setTopicTitle] = useState<string | null>(null);

  const isAnalysis = subject === "analysis";

  function resetView() {
    setError(null);
    setResult(null);
    setPractice([]);
    setConceptReview([]);
    setActiveTopic(null);
    setTopicTitle(null);
  }

  function switchSubject(next: Subject) {
    if (next === subject) return;
    setSubject(next);
    resetView();
  }

  async function handleSubmit(question: string) {
    setLoading(true);
    setError(null);
    setActiveTopic(null);
    setTopicTitle(null);
    try {
      const res = isAnalysis
        ? await solveAnalysis(question, 4)
        : await solve(question, 4);
      setResult(res);
      setPractice(res.practice);
      setConceptReview(res.concept_review ?? []);
    } catch (e) {
      setResult(null);
      setPractice([]);
      setConceptReview([]);
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleImageSubmit(file: File) {
    setLoading(true);
    setError(null);
    setActiveTopic(null);
    setTopicTitle(null);
    try {
      const res = isAnalysis
        ? await analysisSolveImage(file, 4)
        : await solveImage(file, 4);
      setResult(res);
      setPractice(res.practice);
      setConceptReview(res.concept_review ?? []);
    } catch (e) {
      setResult(null);
      setPractice([]);
      setConceptReview([]);
      setError(e instanceof Error ? e.message : "Could not solve from photo.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePickTopic(topicId: string, title: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    setConceptReview([]);
    setActiveTopic(topicId);
    setTopicTitle(title);
    try {
      if (isAnalysis) {
        const res = await analysisPractice(topicId, 5);
        // Show the AI worked example plus its practice set.
        setResult(res);
        setPractice(res.practice);
        setConceptReview(res.concept_review ?? []);
      } else {
        const res = await generateMore(topicId, 5);
        setPractice(res.practice);
        setConceptReview(res.concept_review ?? []);
      }
    } catch (e) {
      setPractice([]);
      setConceptReview([]);
      setError(e instanceof Error ? e.message : "Could not load practice.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateMore() {
    // Only template-backed geometry solves and topic browsing support "more".
    const topic =
      activeTopic ?? (result?.source === "template" ? result.topic : null);
    if (!topic) return;
    setGenerating(true);
    try {
      const res = await generateMore(topic, 4);
      setPractice((prev) => [...prev, ...res.practice]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate more.");
    } finally {
      setGenerating(false);
    }
  }

  // Analysis practice comes as a fixed batch from the AI, so no incremental "more".
  const canGenerateMore =
    !isAnalysis && (activeTopic !== null || result?.source === "template");

  const fetchTopics = useCallback(
    () => (isAnalysis ? fetchAnalysisTopics() : fetchGroupedTopics()),
    [isAnalysis],
  );

  return (
    <div className="min-h-full">
      <GeometryBackground />

      <header className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-500 text-white shadow-lg">
        {/* Decorative shapes inside the hero */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 text-white/10"
          viewBox="0 0 100 100"
        >
          <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="4" />
          <polygon points="50,10 90,80 10,80" fill="none" stroke="currentColor" strokeWidth="3" />
        </svg>
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-12 left-1/3 h-48 w-48 text-white/10"
          viewBox="0 0 100 100"
        >
          <rect x="10" y="10" width="80" height="80" rx="10" fill="none" stroke="currentColor" strokeWidth="4" transform="rotate(18 50 50)" />
        </svg>

        <div className="relative mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8">
          <div className="flex items-center gap-3">
            {/* Compass / protractor style badge */}
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 3 L20 19 L4 19 Z" />
                <circle cx="12" cy="3" r="1.4" fill="currentColor" stroke="none" />
              </svg>
            </span>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {isAnalysis ? "Analysis Helper" : "Geometry Helper"}
              </h1>
              <p className="mt-1 text-sm text-brand-50/90">
                {isAnalysis
                  ? "Ask an Analysis (Honors) question or pick a topic, and the AI tutor walks you through the steps and gives you practice."
                  : "Ask a geometry question or pick an Honors topic, learn the steps, then practice with similar problems."}
              </p>
            </div>
          </div>

          {/* Subject switcher */}
          <div className="inline-flex w-fit rounded-xl bg-white/15 p-1 ring-1 ring-white/25 backdrop-blur">
            {(["geometry", "analysis"] as const).map((s) => {
              const active = s === subject;
              return (
                <button
                  key={s}
                  onClick={() => switchSubject(s)}
                  className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                    active
                      ? "bg-white text-brand-700 shadow"
                      : "text-white/90 hover:bg-white/10"
                  }`}
                >
                  {s === "geometry" ? "Geometry" : "Analysis Honors"}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-8 md:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <AiStatusBanner />
          <QuestionInput
            onSubmit={handleSubmit}
            loading={loading}
            subject={subject}
            key={subject}
          />

          {/* Photo solving works for both subjects via the vision model. */}
          <ImageUpload onSubmit={handleImageSubmit} loading={loading} />

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          )}

          {loading && (
            <LoadingPanel
              label={isAnalysis ? "Solving your Analysis question" : "Solving"}
            />
          )}

          <ResultTabs
            result={result}
            conceptReview={conceptReview}
            practice={practice}
            topicTitle={topicTitle}
            canGenerateMore={canGenerateMore}
            onGenerateMore={handleGenerateMore}
            generating={generating}
          />
        </div>

        <TopicBrowser
          activeTopic={activeTopic}
          onPickTopic={handlePickTopic}
          title={isAnalysis ? "Analysis Topics" : "Geometry Topics"}
          subtitle={
            isAnalysis
              ? "Pick a topic for an AI-guided example."
              : "Pick a topic for instant practice."
          }
          fetchTopics={fetchTopics}
        />
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-slate-400">
        {isAnalysis
          ? "Covers the Analysis Honors syllabus (induction, series, polar, probability, matrices, vectors, groups, limits, and derivatives). Every question is guided by the AI tutor."
          : "Covers the Honors Geometry syllabus. Numeric topics get instant step-by-step practice; proofs and other conceptual questions are handled by the AI tutor."}
      </footer>
    </div>
  );
}
