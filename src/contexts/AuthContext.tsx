"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import {
  getFirebaseAuth,
  googleProvider,
  isFirebaseConfigured,
} from "@/lib/firebase";
import { AUTH_REQUIRED } from "@/lib/authFlags";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  localUserId: string;
  effectiveUserId: string | null;
  loginWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const LOCAL_USER_KEY = "pokelist-local-user-id";

function getOrCreateLocalUserId() {
  if (typeof window === "undefined") return "local-user";
  let id = localStorage.getItem(LOCAL_USER_KEY);
  if (!id) {
    id = `local-${crypto.randomUUID()}`;
    localStorage.setItem(LOCAL_USER_KEY, id);
  }
  return id;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [localUserId, setLocalUserId] = useState("local-user");
  const configured = isFirebaseConfigured();

  useEffect(() => {
    setLocalUserId(getOrCreateLocalUserId());
    // Modo local: não depende do Firebase Auth
    if (!AUTH_REQUIRED) {
      setLoading(false);
      return;
    }
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (next) => {
      setUser(next);
      setLoading(false);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      configured,
      localUserId,
      effectiveUserId: AUTH_REQUIRED
        ? user?.uid || (configured ? null : localUserId)
        : localUserId,
      async loginWithGoogle() {
        if (!AUTH_REQUIRED) {
          throw new Error(
            "Login Google está desativado. Ative AUTH_REQUIRED em src/lib/authFlags.ts."
          );
        }
        const auth = getFirebaseAuth();
        if (!auth) {
          throw new Error(
            "Firebase não configurado. Copie .env.local.example para .env.local."
          );
        }
        try {
          const result = await signInWithPopup(auth, googleProvider);
          setUser(result.user);
          return result.user;
        } catch (err) {
          const code =
            err && typeof err === "object" && "code" in err
              ? String((err as { code?: string }).code)
              : "";
          if (code === "auth/popup-closed-by-user") {
            throw new Error(
              "Login cancelado. Clique de novo em Entrar com Google e conclua o login na janela."
            );
          }
          if (code === "auth/popup-blocked") {
            throw new Error(
              "O navegador bloqueou o popup. Permita popups para este site e tente de novo."
            );
          }
          throw err;
        }
      },
      async logout() {
        if (!AUTH_REQUIRED) return;
        const auth = getFirebaseAuth();
        if (!auth) return;
        await signOut(auth);
      },
    }),
    [user, loading, configured, localUserId]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
