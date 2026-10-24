"use client";

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatClock, usePlayerPreferences, type CaptionSize } from "./player-preferences";

export interface LessonVideoPlayerHandle {
  seek: (seconds: number) => void;
  play: () => void;
}

interface LessonVideoPlayerProps {
  lessonId: number;
  src: string;
  title: string;
  /** Captions URL when the lesson has captions (WebVTT). */
  captionsSrc?: string;
  onTimeUpdate?: (event: React.SyntheticEvent<HTMLVideoElement>) => void;
  onSeeking?: () => void;
  onEnded?: () => void;
  /** Current position, for the transcript highlight. */
  onPosition?: (seconds: number) => void;
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];
const SIZE_LABELS: Record<CaptionSize, string> = { s: "Small", m: "Medium", l: "Large" };
const resumeKey = (lessonId: number) => `sa_resume_${lessonId}`;

function readResume(lessonId: number): number {
  try {
    return Number(window.localStorage.getItem(resumeKey(lessonId)) || 0);
  } catch {
    return 0;
  }
}

function writeResume(lessonId: number, seconds: number | null) {
  try {
    if (seconds === null) window.localStorage.removeItem(resumeKey(lessonId));
    else window.localStorage.setItem(resumeKey(lessonId), String(Math.floor(seconds)));
  } catch {
    // storage unavailable: resume just won't be offered
  }
}

/**
 * The lesson video (streamed from Google Drive, unchanged) with SkillsAir controls: play/pause,
 * ±10 s, speed, captions with sizes, picture-in-picture, fullscreen and "Resume from". Keyboard:
 * K or Space play/pause, J/L back/forward 10 s, C captions, F fullscreen.
 */
export const LessonVideoPlayer = forwardRef<LessonVideoPlayerHandle, LessonVideoPlayerProps>(function LessonVideoPlayer(
  { lessonId, src, title, captionsSrc, onTimeUpdate, onSeeking, onEnded, onPosition },
  ref,
) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSaved = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [resumeAt, setResumeAt] = useState(0);
  const [menu, setMenu] = useState<"speed" | "captions" | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [canPip, setCanPip] = useState(false);
  const { preferences, update } = usePlayerPreferences();
  const captionsOn = Boolean(captionsSrc) && preferences.captions;

  useImperativeHandle(ref, () => ({
    seek: (seconds: number) => {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = Math.max(0, seconds);
      void video.play().catch(() => undefined);
    },
    play: () => void videoRef.current?.play().catch(() => undefined),
  }));

  useEffect(() => {
    setCanPip(typeof document !== "undefined" && "pictureInPictureEnabled" in document && Boolean(document.pictureInPictureEnabled));
    const onFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);

  // A new lesson starts at 0 and offers its own saved position.
  useEffect(() => {
    setCurrent(0);
    setDuration(0);
    setPlaying(false);
    setResumeAt(readResume(lessonId));
  }, [lessonId]);

  // Captions on/off follows the preference.
  const applyCaptionMode = useCallback(() => {
    const track = videoRef.current?.textTracks?.[0];
    if (track) track.mode = captionsOn ? "showing" : "hidden";
  }, [captionsOn]);
  useEffect(applyCaptionMode, [applyCaptionMode]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = preferences.playbackRate;
  }, [preferences.playbackRate, lessonId]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => undefined);
    else video.pause();
  }, []);

  const skip = useCallback((delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(Math.max(0, video.currentTime + delta), video.duration || video.currentTime + delta);
  }, []);

  const toggleCaptions = useCallback(() => {
    if (captionsSrc) update({ captions: !preferences.captions });
  }, [captionsSrc, preferences.captions, update]);

  const toggleFullscreen = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    else void wrapper.requestFullscreen?.().catch(() => undefined);
  }, []);

  const togglePip = useCallback(() => {
    const video = videoRef.current as (HTMLVideoElement & { requestPictureInPicture?: () => Promise<unknown> }) | null;
    if (!video) return;
    if (document.pictureInPictureElement) void document.exitPictureInPicture().catch(() => undefined);
    else void video.requestPictureInPicture?.().catch(() => undefined);
  }, []);

  const onKeyDown = (event: React.KeyboardEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest("input, textarea, select, [role='menu']")) return;
    const key = event.key.toLowerCase();
    if (key === "k" || (key === " " && target === wrapperRef.current)) { event.preventDefault(); togglePlay(); }
    else if (key === "j") { event.preventDefault(); skip(-10); }
    else if (key === "l") { event.preventDefault(); skip(10); }
    else if (key === "c") { event.preventDefault(); toggleCaptions(); }
    else if (key === "f") { event.preventDefault(); toggleFullscreen(); }
  };

  const handleTimeUpdate = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    setCurrent(video.currentTime);
    onPosition?.(video.currentTime);
    onTimeUpdate?.(event);
    if (Math.abs(video.currentTime - lastSaved.current) >= 5) {
      lastSaved.current = video.currentTime;
      // Resume points near the start or the end aren't worth offering.
      const nearEnd = video.duration && video.currentTime > video.duration - 15;
      writeResume(lessonId, video.currentTime < 10 || nearEnd ? null : video.currentTime);
    }
  };

  const showResume = resumeAt > 10 && current < 5 && !playing && (!duration || resumeAt < duration - 10);

  return (
    <div
      ref={wrapperRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="group relative flex h-full w-full flex-col bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
      aria-label={`Video player: ${title}. Keyboard: K play or pause, J and L skip 10 seconds, C captions, F full screen.`}
    >
      <video
        key={lessonId}
        ref={videoRef}
        src={src}
        playsInline
        preload="metadata"
        crossOrigin="anonymous"
        className={cn("min-h-0 w-full flex-1 bg-black", `cue-size-${preferences.captionSize}`)}
        aria-label={`Video: ${title}`}
        onClick={togglePlay}
        onPlay={() => setPlaying(true)}
        onPause={() => {
          setPlaying(false);
          const video = videoRef.current;
          if (video && video.currentTime >= 10) writeResume(lessonId, video.currentTime);
        }}
        onEnded={() => { setPlaying(false); writeResume(lessonId, null); onEnded?.(); }}
        onTimeUpdate={handleTimeUpdate}
        onSeeking={onSeeking}
        onLoadedMetadata={(event) => {
          setDuration(event.currentTarget.duration || 0);
          event.currentTarget.playbackRate = preferences.playbackRate;
          applyCaptionMode();
        }}
      >
        {captionsSrc && <track kind="captions" srcLang="en" label="English" src={captionsSrc} default={captionsOn} />}
      </video>

      {showResume && (
        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-xl bg-black/75 p-2 text-sm text-white">
          <button
            type="button"
            onClick={() => { const video = videoRef.current; if (video) { video.currentTime = resumeAt; void video.play().catch(() => undefined); } setResumeAt(0); }}
            className="min-h-10 rounded-lg bg-accent-700 px-3 font-semibold hover:bg-accent-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Resume from {formatClock(resumeAt)}
          </button>
          <button type="button" onClick={() => setResumeAt(0)} className="min-h-10 rounded-lg px-2 text-white/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            Start over
          </button>
        </div>
      )}

      <div className="flex flex-col gap-1 bg-neutral-950/95 px-2 pb-2 pt-1 text-white">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={1}
          value={Math.min(current, duration || current)}
          onChange={(event) => { const video = videoRef.current; if (video) video.currentTime = Number(event.target.value); }}
          aria-label="Seek"
          aria-valuetext={`${formatClock(current)} of ${formatClock(duration)}`}
          className="h-2 w-full cursor-pointer accent-accent-500"
        />
        <div className="flex items-center gap-1">
          <ControlButton label={playing ? "Pause (K)" : "Play (K)"} onClick={togglePlay}>
            {playing ? <path d="M6 5h4v14H6zM14 5h4v14h-4z" /> : <path d="M7 5v14l12-7z" />}
          </ControlButton>
          <ControlButton label="Back 10 seconds (J)" onClick={() => skip(-10)}>
            <path d="M12 5V2L7 6l5 4V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z" /><text x="9" y="16" fontSize="6" fill="currentColor" stroke="none">10</text>
          </ControlButton>
          <ControlButton label="Forward 10 seconds (L)" onClick={() => skip(10)}>
            <path d="M12 5V2l5 4-5 4V7a6 6 0 1 0 6 6h2a8 8 0 1 1-8-8z" /><text x="9" y="16" fontSize="6" fill="currentColor" stroke="none">10</text>
          </ControlButton>
          <span className="ml-1 whitespace-nowrap text-xs tabular-nums text-white/80" aria-hidden="true">
            {formatClock(current)} / {formatClock(duration)}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenu(menu === "speed" ? null : "speed")}
                aria-haspopup="menu"
                aria-expanded={menu === "speed"}
                aria-label={`Playback speed ${preferences.playbackRate}×`}
                className="min-h-10 min-w-10 rounded-lg px-2 text-xs font-semibold hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                {preferences.playbackRate}×
              </button>
              {menu === "speed" && (
                <div role="menu" className="absolute bottom-12 right-0 z-10 w-28 rounded-xl bg-neutral-900 p-1 shadow-lg ring-1 ring-white/10">
                  {SPEEDS.map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      role="menuitemradio"
                      aria-checked={preferences.playbackRate === speed}
                      onClick={() => { update({ playbackRate: speed }); setMenu(null); }}
                      className={cn("block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10", preferences.playbackRate === speed && "text-accent-400 font-semibold")}
                    >
                      {speed}×
                    </button>
                  ))}
                </div>
              )}
            </div>
            {captionsSrc && (
              <div className="relative flex items-center">
                <button
                  type="button"
                  onClick={toggleCaptions}
                  aria-pressed={captionsOn}
                  aria-label={captionsOn ? "Turn captions off (C)" : "Turn captions on (C)"}
                  className={cn("min-h-10 min-w-10 rounded-lg px-2 text-xs font-bold hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500", captionsOn ? "text-accent-400" : "text-white/80")}
                >
                  <span className={cn("rounded border px-1", captionsOn ? "border-accent-400" : "border-white/60")}>CC</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMenu(menu === "captions" ? null : "captions")}
                  aria-haspopup="menu"
                  aria-expanded={menu === "captions"}
                  aria-label={`Caption size: ${SIZE_LABELS[preferences.captionSize]}`}
                  className="min-h-10 rounded-lg px-1 text-xs hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                >
                  Aa
                </button>
                {menu === "captions" && (
                  <div role="menu" className="absolute bottom-12 right-0 z-10 w-32 rounded-xl bg-neutral-900 p-1 shadow-lg ring-1 ring-white/10">
                    {(Object.keys(SIZE_LABELS) as CaptionSize[]).map((size) => (
                      <button
                        key={size}
                        type="button"
                        role="menuitemradio"
                        aria-checked={preferences.captionSize === size}
                        onClick={() => { update({ captionSize: size, captions: true }); setMenu(null); }}
                        className={cn("block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10", preferences.captionSize === size && "text-accent-400 font-semibold")}
                      >
                        {SIZE_LABELS[size]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {canPip && (
              <ControlButton label="Picture in picture" onClick={togglePip}>
                <path d="M3 5h18v14H3z" fill="none" /><path d="M12 11h7v6h-7z" />
              </ControlButton>
            )}
            <ControlButton label={fullscreen ? "Exit full screen (F)" : "Full screen (F)"} onClick={toggleFullscreen}>
              {fullscreen ? <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" fill="none" /> : <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" />}
            </ControlButton>
          </div>
        </div>
      </div>
    </div>
  );
});

function ControlButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex min-h-10 min-w-10 items-center justify-center rounded-lg hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </button>
  );
}
