"use client";

import { useCallback, useEffect, useState } from "react";

export type CaptionSize = "s" | "m" | "l";

export type CurriculumView = "week" | "chapter";

export interface PlayerPreferences {
  captions: boolean;
  captionSize: CaptionSize;
  playbackRate: number;
  /** Guided-plan learners: the sidebar grouped by plan week (default) or by chapter. */
  curriculumView: CurriculumView;
}

const STORAGE_KEY = "sa_player_prefs";
const DEFAULTS: PlayerPreferences = { captions: false, captionSize: "m", playbackRate: 1, curriculumView: "week" };

function readLocal(): Partial<PlayerPreferences> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<PlayerPreferences>) : {};
  } catch {
    return {};
  }
}

function clean(value: Partial<PlayerPreferences>): Partial<PlayerPreferences> {
  const out: Partial<PlayerPreferences> = {};
  if (typeof value.captions === "boolean") out.captions = value.captions;
  if (value.captionSize === "s" || value.captionSize === "m" || value.captionSize === "l") out.captionSize = value.captionSize;
  if (typeof value.playbackRate === "number" && value.playbackRate >= 0.5 && value.playbackRate <= 2) out.playbackRate = value.playbackRate;
  if (value.curriculumView === "week" || value.curriculumView === "chapter") out.curriculumView = value.curriculumView;
  return out;
}

/**
 * Captions on/off, caption size, speed and the sidebar view (by week or by chapter): remembered in this browser straight away and saved to
 * the learner's account (PATCH /api/profile/preferences) so they follow them to other devices.
 */
export function usePlayerPreferences() {
  const [preferences, setPreferences] = useState<PlayerPreferences>(DEFAULTS);

  useEffect(() => {
    setPreferences({ ...DEFAULTS, ...clean(readLocal()) });
    let cancelled = false;
    fetch("/api/profile/preferences", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { preferences?: Partial<PlayerPreferences> } | null) => {
        if (cancelled || !data?.preferences) return;
        const fromAccount = clean(data.preferences);
        if (Object.keys(fromAccount).length) setPreferences((current) => ({ ...current, ...fromAccount }));
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const update = useCallback((patch: Partial<PlayerPreferences>) => {
    setPreferences((current) => {
      const next = { ...current, ...clean(patch) };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // private mode: the account copy still saves
      }
      return next;
    });
    void fetch("/api/profile/preferences", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(clean(patch)) }).catch(() => undefined);
  }, []);

  return { preferences, update };
}

/** 125 -> "02:05"; 3725 -> "1:02:05" */
export function formatClock(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "00:00";
  const whole = Math.floor(value);
  const hours = Math.floor(whole / 3600);
  const minutes = String(Math.floor((whole % 3600) / 60)).padStart(2, "0");
  const seconds = String(whole % 60).padStart(2, "0");
  return hours ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
}
