import type { Metadata } from "next";
import { CertificatesPage } from "@/components/dashboard/CertificatesPage";

export const metadata: Metadata = { title: "My Certificates" };

export default function DashboardCertificatesPage() {
  return <CertificatesPage />;
}
