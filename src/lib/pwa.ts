/** Helpers for the installable learner app (manifest: src/app/manifest.ts, worker: public/sw.js). */

/** True when SkillsAir was opened from the home-screen icon rather than a browser tab. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia?.("(display-mode: standalone)").matches || nav.standalone === true;
}

/** iPhone or iPad in Safari, where installing is "Share, then Add to Home Screen" (no install prompt). */
export function isIosSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && window.navigator.maxTouchPoints > 1);
  // Other iPhone browsers (Chrome, Firefox, in-app browsers) can't add a full-screen app.
  return ios && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|FBAN|FBAV|Instagram|Line\//.test(ua);
}

/** The Android/desktop Chrome install prompt event (not in TypeScript's DOM types yet). */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Chrome fires beforeinstallprompt once per page load, often before the dashboard has mounted,
 * so PwaRegister (in the root layout) keeps it here for InstallPrompt to use later.
 */
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

export function keepInstallPrompt(event: BeforeInstallPromptEvent | null): void {
  deferredPrompt = event;
  listeners.forEach((listener) => listener());
}

export function installPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

export function onInstallPromptChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
