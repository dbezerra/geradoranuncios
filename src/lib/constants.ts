export const TYPES = [
  { id: "", label: "Nenhum", color: "#555", short: "" },
  { id: "normal", label: "Normal", color: "#A8A878", short: "★" },
  { id: "fire", label: "Fogo", color: "#F08030", short: "🔥" },
  { id: "water", label: "Água", color: "#6890F0", short: "💧" },
  { id: "electric", label: "Elétrico", color: "#F8D030", short: "⚡" },
  { id: "grass", label: "Planta", color: "#78C850", short: "🌿" },
  { id: "ice", label: "Gelo", color: "#98D8D8", short: "❄" },
  { id: "fighting", label: "Lutador", color: "#C03028", short: "✊" },
  { id: "poison", label: "Veneno", color: "#A040A0", short: "☠" },
  { id: "ground", label: "Terra", color: "#E0C068", short: "⛰" },
  { id: "flying", label: "Voador", color: "#A890F0", short: "🪽" },
  { id: "psychic", label: "Psíquico", color: "#F85888", short: "👁" },
  { id: "bug", label: "Inseto", color: "#A8B820", short: "🐛" },
  { id: "rock", label: "Pedra", color: "#B8A038", short: "🪨" },
  { id: "ghost", label: "Fantasma", color: "#705898", short: "👻" },
  { id: "dragon", label: "Dragão", color: "#7038F8", short: "🐉" },
  { id: "dark", label: "Sombrio", color: "#705848", short: "🌑" },
  { id: "steel", label: "Aço", color: "#B8B8D0", short: "⚙" },
  { id: "fairy", label: "Fada", color: "#EE99AC", short: "✦" },
] as const;

export const CDN_ART =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork";

export function getType(id: string) {
  return TYPES.find((t) => t.id === id) || TYPES[0];
}

export function formatPrice(value: string) {
  const cleaned = String(value || "").trim();
  if (!cleaned) return "—";
  if (/^r\$/i.test(cleaned)) return cleaned.toUpperCase();
  return `R$ ${cleaned}`;
}

export function normalize(text: string) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export async function loadImageAsDataUrl(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
