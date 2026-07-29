/**
 * Controle central de autenticação Google / sync na nuvem.
 *
 * - `false` (atual): app 100% local no navegador (IndexedDB). Sem login.
 * - `true`: exige Google nas rotas protegidas e habilita sync Firebase.
 *
 * Para reativar: mude para `true`, publique, e autorize o domínio
 * em Firebase → Authentication → Authorized domains.
 */
export const AUTH_REQUIRED = false;

/** Sync Firestore só faz sentido com autenticação ligada. */
export const CLOUD_SYNC_ENABLED = AUTH_REQUIRED;
