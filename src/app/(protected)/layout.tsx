import React from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { Header } from "@/components/layout/Header";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <Header />
        <div className="flex flex-1 pt-20">
          <div className="hidden lg:flex">
            <DashboardSidebar />
          </div>
          <main className="flex-1 min-w-0 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
