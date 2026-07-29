"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AUTH_REQUIRED } from "@/lib/authFlags";

export default function LoginPage() {
  const { user, configured, loginWithGoogle, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!AUTH_REQUIRED) {
      router.replace("/");
      return;
    }
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  if (!AUTH_REQUIRED) {
    return (
      <main className="page">
        <section className="card" style={{ maxWidth: 480, margin: "40px auto" }}>
          <h1>Login desativado</h1>
          <p className="muted">
            O app está em modo local. Para reativar o Google Auth, altere{" "}
            <code>AUTH_REQUIRED</code> para <code>true</code> em{" "}
            <code>src/lib/authFlags.ts</code>.
          </p>
        </section>
      </main>
    );
  }

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
                .catch((e) => {
                  const msg = String(e?.message || e);
                  if (/unauthorized-domain/i.test(msg)) {
                    alert(
                      "Domínio não autorizado no Firebase.\n\n" +
                        "Abra Firebase → Authentication → Settings → Authorized domains\n" +
                        "e adicione: geradoranuncios.vercel.app"
                    );
                    return;
                  }
                  alert(msg);
                })
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
