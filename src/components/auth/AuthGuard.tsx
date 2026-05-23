"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui/Spinner";

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function AuthGuard({ children, redirectTo = "/login" }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const current = typeof window !== "undefined" ? window.location.pathname : "";
      router.replace(`${redirectTo}?next=${encodeURIComponent(current)}`);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return null;
  return <>{children}</>;
}
