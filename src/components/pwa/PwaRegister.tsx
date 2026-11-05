"use client";

/**
 * Registers the service worker (public/sw.js) in production, offers "Refresh" when a new
 * version is ready, and counts launches of the installed app. Mounted once in the root layout.
 */
import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { isStandalone, keepInstallPrompt, type BeforeInstallPromptEvent } from "@/lib/pwa";

export function PwaRegister() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (isStandalone() && new URLSearchParams(window.location.search).get("source")?.startsWith("pwa")) {
      track("pwa_launch", { from: new URLSearchParams(window.location.search).get("source") ?? "pwa" });
    }
    const installed = () => {
      keepInstallPrompt(null);
      track("pwa_installed");
    };
    // Chrome's own mini-infobar is held back; InstallPrompt offers the install at a better moment.
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      keepInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("appinstalled", installed);
    window.addEventListener("beforeinstallprompt", beforeInstall);
    const removeInstallListeners = () => {
      window.removeEventListener("appinstalled", installed);
      window.removeEventListener("beforeinstallprompt", beforeInstall);
    };

    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return removeInstallListeners;
    let reloading = false;
    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        // Only offer a refresh when an older version is already running this page.
        const offer = (worker: ServiceWorker | null) => {
          if (worker && navigator.serviceWorker.controller) setWaiting(worker);
        };
        offer(registration.waiting);
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed") offer(worker);
          });
        });
      })
      .catch(() => undefined);

    return () => {
      removeInstallListeners();
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  if (!waiting) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-3 z-[60] mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl bg-navy px-4 py-3 text-sm text-white shadow-lg"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 5rem)" }}
    >
      <span>A new version of SkillsAir is ready.</span>
      <button
        type="button"
        onClick={() => waiting.postMessage("SKIP_WAITING")}
        className="min-h-11 shrink-0 rounded-xl bg-white px-4 font-semibold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        Refresh
      </button>
    </div>
  );
}
