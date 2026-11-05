"use client";

/**
 * "Install the SkillsAir app", on Today only, once the learner has finished their first lesson.
 * Android (Chrome, Edge, Samsung Internet): an Install button that opens the browser's own
 * install dialog. iPhone Safari: how to add it (Share, then Add to Home Screen). Never shown in the
 * installed app, in lessons or at checkout. "Not now" is remembered on this device.
 */
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Share, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEnrolledCourses } from "@/hooks/useStudent";
import { track } from "@/lib/analytics";
import { installPrompt, isIosSafari, isStandalone, keepInstallPrompt, onInstallPromptChange } from "@/lib/pwa";

const DISMISSED_KEY = "sa_pwa_install_dismissed";

function wasDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function InstallPrompt() {
  const pathname = usePathname();
  const { user } = useAuth();
  const onToday = pathname === "/dashboard";
  // Same request as the dashboard's programme list (shared cache), and only on Today.
  const { enrolledCourses } = useEnrolledCourses(onToday ? user?.id ?? null : null);
  const [kind, setKind] = useState<"android" | "ios" | null>(null);
  const [hidden, setHidden] = useState(true);

  const learnedOnce = enrolledCourses.some((course) => course.completedLessons.length > 0);

  useEffect(() => {
    if (isStandalone() || wasDismissed()) return;
    const update = () => setKind(installPrompt() ? "android" : isIosSafari() ? "ios" : null);
    update();
    setHidden(false);
    return onInstallPromptChange(update);
  }, []);

  const show = !hidden && onToday && learnedOnce && kind !== null;

  useEffect(() => {
    if (show) track("pwa_install_prompt_shown", { kind: kind ?? "" });
  }, [show, kind]);

  if (!show) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // storage unavailable: it just shows again next visit
    }
    track("pwa_install_dismissed", { kind: kind ?? "" });
    setHidden(true);
  };

  const install = async () => {
    const event = installPrompt();
    if (!event) return;
    track("pwa_install_clicked", { kind: "android" });
    await event.prompt();
    const choice = await event.userChoice.catch(() => null);
    // A prompt can only be used once.
    keepInstallPrompt(null);
    if (choice?.outcome !== "accepted") dismiss();
  };

  return (
    <aside
      aria-label="Install the SkillsAir app"
      className="fixed inset-x-3 z-50 mx-auto max-w-md rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl lg:hidden"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 4.5rem)" }}
    >
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- a 48px app icon, already cached by the service worker */}
        <img src="/icons/icon-192.png" alt="" width={48} height={48} className="size-12 shrink-0 rounded-xl border border-neutral-100" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-neutral-900">Learn from your home screen</p>
          {kind === "android" ? (
            <p className="mt-0.5 text-sm text-neutral-600">Install the SkillsAir app to open today&apos;s lesson in one tap. It uses little storage.</p>
          ) : (
            <p className="mt-0.5 text-sm text-neutral-600">
              Tap <Share aria-label="Share" className="inline size-4 align-text-bottom text-navy" /> <strong>Share</strong> below, then <strong>Add to Home Screen</strong>. SkillsAir opens like an app.
            </p>
          )}
        </div>
        <button type="button" onClick={dismiss} aria-label="Not now" className="-m-2 inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-neutral-500 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy">
          <X aria-hidden="true" className="size-5" />
        </button>
      </div>
      {kind === "android" && (
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => void install()} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-accent-700 px-4 font-semibold text-white hover:bg-accent-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">
            Install
          </button>
          <button type="button" onClick={dismiss} className="inline-flex min-h-11 items-center justify-center rounded-xl border-[1.5px] border-neutral-300 px-4 font-semibold text-navy hover:border-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy">
            Not now
          </button>
        </div>
      )}
    </aside>
  );
}
