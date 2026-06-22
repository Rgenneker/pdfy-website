import { useEffect, useState } from "react";

const STORAGE_PREFIX = "pdfshuffl:learning-prompt:";

function buildKey(topic) {
  const safeTopic = (topic || "general")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${STORAGE_PREFIX}${safeTopic}`;
}

export default function LearningPrompt({ topic = "general" }) {
  const storageKey = buildKey(topic);
  const [answers, setAnswers] = useState({ knew: null, helpful: null });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setAnswers({
          knew: parsed.knew ?? null,
          helpful: parsed.helpful ?? null,
        });
      } else {
        setAnswers({ knew: null, helpful: null });
      }
    } catch {
      setAnswers({ knew: null, helpful: null });
    }
    setHydrated(true);
  }, [storageKey]);

  function record(question, value) {
    setAnswers((prev) => {
      const next = { ...prev, [question]: value };
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(storageKey, JSON.stringify(next));
        }
      } catch {
        // Ignore storage write failures (private mode, quota, etc.)
      }
      return next;
    });
  }

  if (!hydrated) return null;

  const completed = answers.knew !== null && answers.helpful !== null;

  return (
    <section className="mt-12 rounded-[2rem] border border-rose-100 bg-rose-50 p-6 shadow-sm md:p-8">
      {completed ? (
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-500">
            Thank you
          </p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            Your feedback is noted
          </h3>
          <p className="mt-3 text-lg leading-8 text-slate-700">
            We use answers like yours to make every lesson clearer and more
            useful. Keep exploring the tools whenever you are ready.
          </p>
        </div>
      ) : (
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-500">
            Quick check
          </p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            Help us teach this better
          </h3>
          <p className="mt-3 text-lg leading-8 text-slate-700">
            Two short questions, no sign in needed. Your answers stay on this
            device.
          </p>

          <div className="mt-6 space-y-6">
            <fieldset>
              <legend className="text-base font-black text-slate-900">
                Did you already know this?
              </legend>
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => record("knew", "yes")}
                  aria-pressed={answers.knew === "yes"}
                  className={`rounded-full px-5 py-2.5 text-sm font-bold transition hover:-translate-y-0.5 ${
                    answers.knew === "yes"
                      ? "bg-rose-500 text-white"
                      : "border border-rose-200 bg-white text-rose-600 hover:bg-rose-100"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => record("knew", "no")}
                  aria-pressed={answers.knew === "no"}
                  className={`rounded-full px-5 py-2.5 text-sm font-bold transition hover:-translate-y-0.5 ${
                    answers.knew === "no"
                      ? "bg-rose-500 text-white"
                      : "border border-rose-200 bg-white text-rose-600 hover:bg-rose-100"
                  }`}
                >
                  No
                </button>
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-base font-black text-slate-900">
                Was this helpful to you?
              </legend>
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => record("helpful", "yes")}
                  aria-pressed={answers.helpful === "yes"}
                  className={`rounded-full px-5 py-2.5 text-sm font-bold transition hover:-translate-y-0.5 ${
                    answers.helpful === "yes"
                      ? "bg-rose-500 text-white"
                      : "border border-rose-200 bg-white text-rose-600 hover:bg-rose-100"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => record("helpful", "no")}
                  aria-pressed={answers.helpful === "no"}
                  className={`rounded-full px-5 py-2.5 text-sm font-bold transition hover:-translate-y-0.5 ${
                    answers.helpful === "no"
                      ? "bg-rose-500 text-white"
                      : "border border-rose-200 bg-white text-rose-600 hover:bg-rose-100"
                  }`}
                >
                  No
                </button>
              </div>
            </fieldset>
          </div>
        </div>
      )}
    </section>
  );
}
