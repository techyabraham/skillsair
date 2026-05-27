import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e3a8a",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://skillsair.com"),
  title: {
    default: "SkillsAir — Learn Without Limits",
    template: "%s | SkillsAir",
  },
  description:
    "Advance your career with world-class online courses. Learn from expert instructors, earn certificates, and join a community of 50,000+ learners.",
  keywords: ["online learning", "courses", "e-learning", "certificates", "skills"],
  authors: [{ name: "SkillsAir" }],
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "SkillsAir",
    title: "SkillsAir — Learn Without Limits",
    description: "Advance your career with world-class online courses.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "SkillsAir" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SkillsAir — Learn Without Limits",
    description: "Advance your career with world-class online courses.",
    images: ["/og-image.jpg"],
    creator: "@skillsair",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable}`}>
      <body className="font-sans antialiased bg-white text-neutral-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
