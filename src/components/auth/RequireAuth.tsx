"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AUTH_REQUIRED } from "@/lib/authFlags";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!AUTH_REQUIRED) return;
    if (!loading && configured && !user) {
      router.replace("/login");
    }
  }, [loading, configured, user, router]);

  if (!AUTH_REQUIRED) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <main className="page">
        <p className="muted">Verificando login...</p>
      </main>
    );
  }

  if (configured && !user) {
    return (
      <main className="page">
        <p className="muted">Redirecionando para o login...</p>
      </main>
    );
  }

  return <>{children}</>;
}
