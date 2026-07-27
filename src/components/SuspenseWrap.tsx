"use client";

import { Suspense, type ReactNode } from "react";

export function SuspenseWrap({ children }: { children: ReactNode }) {
  return <Suspense fallback={<main className="page">Carregando...</main>}>{children}</Suspense>;
}
