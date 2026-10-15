import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Analytics } from "@/components/analytics/Analytics";
import { AttributionCapture } from "@/components/analytics/AttributionCapture";

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

const TITLE = "SkillsAir: Affordable, job-ready tech training for young Africans";
const DESCRIPTION =
  "Learn AI, data, design, engineering, security or marketing at your own pace. Earn a verifiable certificate in 3 months and unlock internship opportunities. Apply in 60 seconds.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://skillsair.com"),
  title: {
    default: TITLE,
    template: "%s | SkillsAir",
  },
  description: DESCRIPTION,
  keywords: ["tech courses in Nigeria", "affordable tech training", "data analysis course Nigeria", "UI/UX design course Nigeria", "cybersecurity course Nigeria", "AI course Nigeria"],
  authors: [{ name: "SkillsAir" }],
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/icon.png", type: "image/png" }],
    shortcut: "/icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    siteName: "SkillsAir",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
    creator: "@skillsair",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG" className={`${inter.variable} ${plusJakarta.variable}`}>
      <body className="font-sans antialiased bg-white text-neutral-900">
        <Providers>{children}</Providers>
        <AttributionCapture />
        <Analytics />
      </body>
    </html>
  );
}
