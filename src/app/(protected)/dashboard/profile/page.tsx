import type { Metadata } from "next";
import { ProfilePage } from "@/components/dashboard/ProfilePage";

export const metadata: Metadata = { title: "My Profile" };

export default function DashboardProfilePage() {
  return <ProfilePage />;
}
