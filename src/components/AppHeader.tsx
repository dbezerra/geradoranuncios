"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function AppHeader() {
  const router = useRouter();
  const { user, loading, configured, logout } = useAuth();
  const loggedIn = Boolean(user) || (!configured && !loading);

  return (
    <header className="site-header">
      <Link href={loggedIn ? "/" : "/login"} className="brand">
        Gerador de Anúncios
      </Link>
      <nav className="site-nav">
        {loggedIn && (
          <>
            <Link href="/criar/multi">Multi</Link>
            <Link href="/criar/individual">Individual</Link>
            <Link href="/criar/misto">Misto</Link>
            <Link href="/anuncios">Meus anúncios</Link>
          </>
        )}
        {!loading && (
          <>
            {user ? (
              <button
                type="button"
                className="btn ghost"
                onClick={async () => {
                  await logout();
                  router.replace("/login");
                }}
              >
                Sair ({user.displayName?.split(" ")[0] || "conta"})
              </button>
            ) : configured ? (
              <Link href="/login" className="btn primary">
                Entrar com Google
              </Link>
            ) : (
              <span className="muted small">Modo local</span>
            )}
          </>
        )}
      </nav>
    </header>
  );
}
