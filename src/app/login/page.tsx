"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { user, configured, loginWithGoogle, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  return (
    <main className="page">
      <section className="card" style={{ maxWidth: 480, margin: "40px auto" }}>
        <h1>Entrar</h1>
        <p className="muted">
          Faça login com Google para criar, editar e ver seus anúncios.
        </p>
        {configured ? (
          <button
            type="button"
            className="btn primary"
            onClick={() =>
              loginWithGoogle()
                .then(() => router.push("/"))
                .catch((e) => alert(e.message))
            }
          >
            Entrar com Google
          </button>
        ) : (
          <p className="muted">
            Firebase ainda não está configurado. Configure o{" "}
            <code>.env.local</code> para liberar o login.
          </p>
        )}
      </section>
    </main>
  );
}
