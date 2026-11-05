import type { MetadataRoute } from "next";

/**
 * The installable learner app (served at /manifest.webmanifest). It opens on the learner's
 * "Today" screen; someone signed out is sent to sign in and brought back. The service worker is
 * public/sw.js, registered by src/components/pwa/PwaRegister.tsx.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/dashboard",
    name: "SkillsAir",
    short_name: "SkillsAir",
    description: "Your SkillsAir programmes: today's lessons, quizzes and certificates.",
    start_url: "/dashboard?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#1e3a8a",
    lang: "en-NG",
    categories: ["education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Continue learning", short_name: "Continue", url: "/dashboard?source=pwa-shortcut", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "My programmes", short_name: "Programmes", url: "/dashboard/courses?source=pwa-shortcut", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
