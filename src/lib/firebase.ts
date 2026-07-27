import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth, type User } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

export function getFirebaseApp() {
  if (!isFirebaseConfigured()) return null;
  if (!app) {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth() {
  const current = getFirebaseApp();
  if (!current) return null;
  if (!auth) auth = getAuth(current);
  return auth;
}

export function getFirebaseDb() {
  const current = getFirebaseApp();
  if (!current) return null;
  if (!db) db = getFirestore(current);
  return db;
}

export function getFirebaseStorage() {
  const current = getFirebaseApp();
  if (!current) return null;
  if (!storage) storage = getStorage(current);
  return storage;
}

export async function requireAuthUser(): Promise<User> {
  const authInstance = getFirebaseAuth();
  if (!authInstance) {
    throw new Error("Firebase Auth não configurado.");
  }
  if (authInstance.currentUser) {
    await authInstance.currentUser.getIdToken(true);
    return authInstance.currentUser;
  }
  // Aguarda um pouco o estado hidratar
  const user = await new Promise<User | null>((resolve) => {
    const timeout = setTimeout(() => resolve(authInstance.currentUser), 2500);
    const unsub = authInstance.onAuthStateChanged((next) => {
      clearTimeout(timeout);
      unsub();
      resolve(next);
    });
  });
  if (!user) {
    throw new Error("Faça login com Google antes de sincronizar.");
  }
  await user.getIdToken(true);
  return user;
}

export function explainFirestoreError(err: unknown): string {
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code?: string }).code)
      : "";
  const message = err instanceof Error ? err.message : String(err);

  if (code === "permission-denied" || /permission/i.test(message)) {
    return (
      "Firestore bloqueou a escrita (permission-denied). " +
      "Abra Firebase → Firestore Database → Regras, cole o conteúdo de firestore.rules " +
      "do projeto (allow read, write: if request.auth != null;) e clique em Publicar."
    );
  }
  if (code === "not-found" || /not.?found|does not exist/i.test(message)) {
    return (
      "Banco Firestore não encontrado. No Firebase, crie o Firestore Database " +
      "(modo de produção ou teste) e tente de novo."
    );
  }
  if (code === "unavailable") {
    return "Firestore indisponível no momento. Verifique a internet e tente novamente.";
  }
  return message || "Erro desconhecido ao sincronizar.";
}

export const googleProvider = new GoogleAuthProvider();
