"use client";

import { useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { InterviewQuestion, QuestionCategory } from "@/data/content";
import { normalize } from "@/lib/grader";
import { cn } from "@/lib/cn";
import { QuestionAccordion } from "./question-accordion";
import { MockSimulator } from "./mock-simulator";

type CategoryCount = { category: QuestionCategory; count: number };

export function InterviewWorkspace({
  questions,
  categories,
}: {
  questions: InterviewQuestion[];
  categories: CategoryCount[];
}) {
  const [category, setCategory] = useState<QuestionCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set([questions[0]?.id]));
  const [practiceId, setPracticeId] = useState(questions[0]?.id ?? "");
  const simulatorRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return questions.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (!q) return true;
      return normalize(`${item.question} ${item.keyPoints.join(" ")} ${item.category}`).includes(q);
    });
  }, [questions, category, query]);

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function practice(id: string) {
    setPracticeId(id);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    simulatorRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    // Đưa focus vào textarea để gõ ngay
    window.setTimeout(() => simulatorRef.current?.querySelector("textarea")?.focus({ preventScroll: true }), reduce ? 0 : 400);
  }

  const allOpen = filtered.length > 0 && filtered.every((q) => openIds.has(q.id));

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start">
      {/* ------------------------------------------------ Question list */}
      <section aria-labelledby="questions-title" className="min-w-0 space-y-4">
        <h2 id="questions-title" className="sr-only">
          Danh sách câu hỏi
        </h2>

        {/* Filters */}
        <div className="space-y-3">
          <div className="relative">
            <label htmlFor="q-search" className="sr-only">
              Tìm câu hỏi
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" aria-hidden />
            <input
              id="q-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm: flaky, self-healing, shard, STAR…"
              className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-10 text-sm text-ink placeholder:text-ink-faint focus:border-accent/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-ink-faint hover:bg-surface-raised hover:text-ink"
                aria-label="Xoá tìm kiếm"
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc theo chủ đề">
            <FilterChip active={category === "all"} onClick={() => setCategory("all")}>
              Tất cả <span className="text-ink-faint">{questions.length}</span>
            </FilterChip>
            {categories.map(({ category: c, count }) => (
              <FilterChip key={c} active={category === c} onClick={() => setCategory(c)}>
                {c} <span className="text-ink-faint">{count}</span>
              </FilterChip>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-ink-faint" aria-live="polite">
              {filtered.length} câu hỏi
            </p>
            {filtered.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setOpenIds((prev) => {
                    const next = new Set(prev);
                    filtered.forEach((q) => (allOpen ? next.delete(q.id) : next.add(q.id)));
                    return next;
                  })
                }
                className="min-h-9 rounded-md px-2 text-xs font-medium text-accent-soft hover:bg-surface-raised"
              >
                {allOpen ? "Thu gọn tất cả" : "Mở tất cả"}
              </button>
            )}
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line-strong p-8 text-center">
            <p className="text-ink">Không có câu hỏi phù hợp.</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("all");
              }}
              className="mt-3 min-h-10 rounded-lg px-3 text-sm font-medium text-accent-soft hover:bg-surface-raised"
            >
              Xoá bộ lọc
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((q) => (
              <li key={q.id}>
                <QuestionAccordion
                  index={questions.indexOf(q) + 1}
                  question={q}
                  open={openIds.has(q.id)}
                  onToggle={() => toggle(q.id)}
                  onPractice={() => practice(q.id)}
                  isPracticing={practiceId === q.id}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ------------------------------------------------ Simulator */}
      <div ref={simulatorRef} className="min-w-0 scroll-mt-24 lg:sticky lg:top-24">
        <MockSimulator questions={questions} selectedId={practiceId} onSelect={setPracticeId} />
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors duration-200",
        active
          ? "border-accent/50 bg-accent-wash text-ink"
          : "border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
