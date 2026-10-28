"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import type { CodeSample } from "@/data/content";

export function CodeBlock({ sample }: { sample: CodeSample }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(sample.code);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <figure className="overflow-hidden rounded-xl border border-line bg-code">
      <figcaption className="flex items-center justify-between gap-3 border-b border-line px-4 py-2">
        <span className="min-w-0 truncate font-mono text-xs text-ink-muted">{sample.title}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md px-2 font-mono text-xs text-ink-muted transition-colors duration-150 hover:bg-surface-raised hover:text-ink"
          aria-label={copied ? "Đã copy code" : "Copy code"}
        >
          {copied ? <Check className="size-3.5 text-ok" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
          <span aria-live="polite">{copied ? "Copied" : sample.language}</span>
        </button>
      </figcaption>
      <pre className="max-h-[28rem] overflow-auto p-4 font-mono text-[13px] leading-6 text-slate-300">
        <code>{sample.code}</code>
      </pre>
    </figure>
  );
}
