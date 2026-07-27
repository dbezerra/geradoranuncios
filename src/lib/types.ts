export type AdType = "multi" | "individual" | "mixed";
export type MixedLayout = "grid" | "cards";
export type StoreMode = "text" | "image";

export type PokemonTypeId =
  | ""
  | "normal"
  | "fire"
  | "water"
  | "electric"
  | "grass"
  | "ice"
  | "fighting"
  | "poison"
  | "ground"
  | "flying"
  | "psychic"
  | "bug"
  | "rock"
  | "ghost"
  | "dragon"
  | "dark"
  | "steel"
  | "fairy";

export interface TitleStyle {
  text: string;
  color: string;
  size: number;
  font: string;
}

export interface StoreBrand {
  mode: StoreMode;
  name: string;
  color: string;
  size: number;
  font: string;
  imageDataUrl: string;
}

export interface ContactInfo {
  whatsapp: string;
  discord: string;
  showPix: boolean;
}

export interface PokemonEntry {
  kind: "pokemon";
  id: string;
  name: string;
  color: string;
  level: string;
  multiplier: string;
  type1: PokemonTypeId;
  type2: PokemonTypeId;
  rarity: string;
  price: string;
  iv: string;
  ivMax: string;
  photo: string;
  sold?: boolean;
}

export interface ItemEntry {
  kind: "item";
  id: string;
  name: string;
  color: string;
  price: string;
  rarity: string;
  notes: string;
  photo: string;
  sold?: boolean;
}

export type AdEntry = PokemonEntry | ItemEntry;

export type SyncStatus = "pending" | "synced" | "error";

export interface AdDocument {
  id: string;
  userId: string;
  type: AdType;
  title: TitleStyle;
  store: StoreBrand;
  contact: ContactInfo;
  /** Cor de fundo do canvas do anúncio */
  backgroundColor?: string;
  layout: "list" | MixedLayout;
  entries: AdEntry[];
  previewUrl?: string;
  createdAt: number;
  updatedAt: number;
  /** Estado da sincronização com a nuvem */
  syncStatus?: SyncStatus;
  syncedAt?: number;
  /** Último erro de sync (para debug na UI) */
  lastSyncError?: string;
}

export interface PokedexEntry {
  id: number;
  name: string;
  namePt: string;
  slug: string;
  types: string[];
  image: string;
  hasImage?: boolean;
}

export const DEFAULT_TITLE = "POKELIST A VENDA !!!";
export const DEFAULT_AD_BACKGROUND = "#000000";

export const DEFAULT_TITLE_STYLE: TitleStyle = {
  text: DEFAULT_TITLE,
  color: "#39ff14",
  size: 34,
  font: "'Rubik', Arial, sans-serif",
};

export const DEFAULT_STORE: StoreBrand = {
  mode: "text",
  name: "Pokémon",
  color: "#ffcb05",
  size: 28,
  font: "'Rubik', Arial, sans-serif",
  imageDataUrl: "",
};

export const DEFAULT_CONTACT: ContactInfo = {
  whatsapp: "",
  discord: "",
  showPix: true,
};

export const RARITIES = [
  "Comum",
  "Rara",
  "Épico",
  "Lendária",
  "Mítico",
  "Ancião",
  "Divino",
] as const;

export const NAME_COLORS = [
  "#ff3b3b",
  "#ff8a1f",
  "#ffd400",
  "#39ff14",
  "#1e90ff",
  "#b44dff",
  "#ff4fd8",
  "#00e5ff",
];

export const FONT_OPTIONS = [
  { label: "Rubik", value: "'Rubik', Arial, sans-serif" },
  { label: "Bebas Neue", value: "'Bebas Neue', Impact, sans-serif" },
  { label: "Oswald", value: "'Oswald', Arial, sans-serif" },
  { label: "Press Start", value: "'Press Start 2P', monospace" },
  { label: "Impact", value: "Impact, Haettenschweiler, sans-serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
];
