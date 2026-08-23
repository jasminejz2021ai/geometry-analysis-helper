import { useEffect, useState } from "react";
import type { GroupedTopicsResponse, HonorsUnit } from "../types";

type Props = {
  activeTopic: string | null;
  onPickTopic: (topicId: string, title: string) => void;
  title: string;
  subtitle: string;
  fetchTopics: () => Promise<GroupedTopicsResponse>;
};

export default function TopicBrowser({
  activeTopic,
  onPickTopic,
  title,
  subtitle,
  fetchTopics,
}: Props) {
  const [units, setUnits] = useState<HonorsUnit[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUnits([]);
    setError(null);
    fetchTopics()
      .then((res) => setUnits(res.units))
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Could not load topics."),
      );
  }, [fetchTopics]);

  return (
    <aside className="rounded-2xl bg-white/80 p-5 shadow-lg shadow-brand-900/5 ring-1 ring-white/60 backdrop-blur-sm md:sticky md:top-6 md:self-start">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      <p className="mt-1 text-xs text-slate-400">{subtitle}</p>

      {error && <p className="mt-3 text-xs text-rose-600">{error}</p>}

      <nav className="mt-4 space-y-4">
        {units.map((unit) => (
          <div key={unit.unit}>
            <p className="text-xs font-semibold text-slate-700">{unit.unit}</p>
            <div className="mt-1.5 flex flex-col gap-1">
              {unit.topics.map((t) => {
                const active = t.id === activeTopic;
                return (
                  <button
                    key={t.id}
                    onClick={() => onPickTopic(t.id, t.title)}
                    className={`rounded-lg px-3 py-1.5 text-left text-sm transition ${
                      active
                        ? "bg-brand-600 text-white"
                        : "text-slate-600 hover:bg-brand-50 hover:text-brand-700"
                    }`}
                  >
                    {t.title}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
