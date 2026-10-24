"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { cn } from "@/lib/utils";
import { formatClock } from "./player-preferences";

interface TranscriptLine {
  start: number;
  text: string;
}

interface TranscriptPanelProps {
  lessonId: number;
  /** Current video position, to highlight the line being spoken. */
  position: number;
  onSeek: (seconds: number) => void;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Transcript unavailable");
  return (await response.json()) as { lines: TranscriptLine[] };
};

/** Searchable transcript; clicking a line jumps the video there, and the current line is highlighted. */
export function TranscriptPanel({ lessonId, position, onSeek }: TranscriptPanelProps) {
  const { data, error, isLoading } = useSWR(`/api/learning/lessons/${lessonId}/transcript`, fetcher, { revalidateOnFocus: false });
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLOListElement>(null);
  const lines = useMemo(() => data?.lines ?? [], [data]);
  const term = query.trim().toLowerCase();
  const visible = term ? lines.filter((line) => line.text.toLowerCase().includes(term)) : lines;
  const currentIndex = lines.findIndex((line, index) => position >= line.start && position < (lines[index + 1]?.start ?? Infinity));

  // Keep the current line in view while watching (not while searching).
  useEffect(() => {
    if (term || currentIndex < 0) return;
    const item = listRef.current?.querySelector<HTMLElement>(`[data-index="${currentIndex}"]`);
    item?.scrollIntoView({ block: "nearest" });
  }, [currentIndex, term]);

  if (isLoading) return <p className="text-sm text-neutral-500">Loading the transcript…</p>;
  if (error || !lines.length) return <p className="text-sm text-neutral-500">The transcript isn&apos;t available for this lesson.</p>;

  return (
    <div>
      <label htmlFor={`transcript-search-${lessonId}`} className="sr-only">Search the transcript</label>
      <input
        id={`transcript-search-${lessonId}`}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search the transcript"
        className="mb-3 min-h-11 w-full rounded-xl border border-neutral-300 px-3 text-sm focus:border-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-800/20"
      />
      {term && <p className="mb-2 text-xs text-neutral-500" aria-live="polite">{visible.length} {visible.length === 1 ? "match" : "matches"}</p>}
      <ol ref={listRef} className="max-h-96 space-y-1 overflow-y-auto pr-1" aria-label="Transcript">
        {visible.map((line) => {
          const index = lines.indexOf(line);
          const active = index === currentIndex;
          return (
            <li key={`${line.start}-${index}`} data-index={index}>
              <button
                type="button"
                onClick={() => onSeek(line.start)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex w-full gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-800",
                  active ? "bg-primary-50 text-neutral-900" : "text-neutral-700 hover:bg-neutral-50",
                )}
              >
                <span className="w-12 shrink-0 tabular-nums text-xs font-medium text-primary-800">{formatClock(line.start)}</span>
                <span>{highlight(line.text, term)}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function highlight(text: string, term: string) {
  if (!term) return text;
  const parts = text.split(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
  return parts.map((part, index) => (part.toLowerCase() === term ? <mark key={index} className="rounded bg-accent-100 px-0.5 text-neutral-900">{part}</mark> : part));
}
