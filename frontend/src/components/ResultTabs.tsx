import { useEffect, useMemo, useState } from "react";
import type { Problem, SolveResponse } from "../types";
import ChatBox from "./ChatBox";
import ConceptReview from "./ConceptReview";
import PracticeList from "./PracticeList";
import SolutionView from "./SolutionView";

type Props = {
  result: SolveResponse | null;
  conceptReview: string[];
  practice: Problem[];
  topicTitle: string | null;
  canGenerateMore: boolean;
  onGenerateMore: () => void;
  generating: boolean;
};

type TabId = "concept" | "worked" | "solutions" | "practice";

function problemContext(p: Problem): string {
  const steps = p.steps.length ? `\nSteps:\n${p.steps.join("\n")}` : "";
  return `Problem: ${p.prompt}\nAnswer: ${p.answer}${steps}`;
}

export default function ResultTabs({
  result,
  conceptReview,
  practice,
  topicTitle,
  canGenerateMore,
  onGenerateMore,
  generating,
}: Props) {
  const asked = result?.asked_solution ?? null;
  const original = result?.original ?? null;
  // For AI/photo/analysis flows the worked example IS the asked question, so we
  // avoid showing a duplicate "Worked example" tab (same problem id).
  const workedIsDistinct =
    original !== null && (asked === null || original.id !== asked.id);

  const tabs = useMemo(() => {
    const list: { id: TabId; label: string }[] = [];
    if (conceptReview.length > 0) list.push({ id: "concept", label: "Concept review" });
    if (workedIsDistinct) list.push({ id: "worked", label: "Worked example" });
    if (asked) list.push({ id: "solutions", label: "Solutions" });
    if (practice.length > 0)
      list.push({ id: "practice", label: "Extra practice problems" });
    return list;
  }, [conceptReview.length, workedIsDistinct, asked, practice.length]);

  const [active, setActive] = useState<TabId | null>(null);

  // Keep the active tab valid as content changes; default to the first tab.
  useEffect(() => {
    if (tabs.length === 0) {
      setActive(null);
      return;
    }
    if (!active || !tabs.some((t) => t.id === active)) {
      setActive(tabs[0].id);
    }
  }, [tabs, active]);

  if (tabs.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white/80 shadow-lg shadow-brand-900/5 ring-1 ring-white/60 backdrop-blur-sm">
      <div
        role="tablist"
        className="flex flex-wrap gap-1 border-b border-slate-200/70 p-2"
      >
        {tabs.map((t) => {
          const isActive = t.id === active;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(t.id)}
              className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-brand-50 hover:text-brand-700"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="p-2 sm:p-4">
        {active === "concept" && (
          <div>
            <ConceptReview items={conceptReview} embedded />
            <ChatBox
              key="chat-concept"
              subject="this concept"
              context={`Concept review:\n${conceptReview.join("\n")}`}
            />
          </div>
        )}

        {active === "worked" && original && (
          <div>
            <SolutionView
              problem={original}
              source={result!.source}
              embedded
              heading="Worked example"
              note="A similar problem, solved step by step, to learn the method."
            />
            <ChatBox
              key="chat-worked"
              subject="this worked example"
              context={problemContext(original)}
            />
          </div>
        )}

        {active === "solutions" && asked && (
          <div>
            <SolutionView
              problem={asked}
              source={result!.source}
              embedded
              heading="Solution to your problem"
              note="Step-by-step solution to the exact question you asked."
            />
            <ChatBox
              key="chat-solutions"
              subject="your problem"
              context={problemContext(asked)}
            />
          </div>
        )}

        {active === "practice" && (
          <div className="space-y-3">
            {topicTitle && (
              <p className="text-sm text-slate-500">
                Practice problems{topicTitle ? ` for ${topicTitle}` : ""}. Check
                your answers and reveal steps as needed.
              </p>
            )}
            <PracticeList
              problems={practice}
              canGenerateMore={canGenerateMore}
              onGenerateMore={onGenerateMore}
              generating={generating}
              embedded
            />
            <ChatBox
              key="chat-practice"
              subject="these practice problems"
              context={`Practice problems:\n${practice
                .map((p, i) => `${i + 1}. ${p.prompt} (answer: ${p.answer})`)
                .join("\n")}`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
