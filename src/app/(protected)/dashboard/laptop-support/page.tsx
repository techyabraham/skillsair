import type { Metadata } from "next";
import { LaptopSupport } from "@/components/dashboard/LaptopSupport";

export const metadata: Metadata = {
  title: "Laptop support",
  robots: { index: false, follow: false },
};

export default function LaptopSupportPage() {
  return <LaptopSupport />;
}
