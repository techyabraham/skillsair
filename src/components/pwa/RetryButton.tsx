"use client";

/** "Try again" on the offline screen: back to the page that couldn't load, or Today. */
export function RetryButton() {
  return (
    <button
      type="button"
      onClick={() => (window.location.pathname === "/offline" ? window.location.assign("/dashboard") : window.location.reload())}
      className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent-700 px-6 font-semibold text-white hover:bg-accent-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
    >
      Try again
    </button>
  );
}
