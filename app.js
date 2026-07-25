const TYPES = [
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
];

const NAME_COLORS = [
  "#ff3b3b",
  "#ff8a1f",
  "#ffd400",
  "#39ff14",
  "#1e90ff",
  "#b44dff",
  "#ff4fd8",
  "#00e5ff",
];

const CDN_ART =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork";

/** @type {Array<any>} */
let pokemon = [];
/** @type {Array<any>} */
let pokedex = [];
let editingId = null;
let photoDataUrl = "";
let activeSuggestion = -1;
let photoManual = false;

const els = {
  photoInput: document.getElementById("photoInput"),
  photoPreview: document.getElementById("photoPreview"),
  nameInput: document.getElementById("nameInput"),
  nameSuggestions: document.getElementById("nameSuggestions"),
  colorInput: document.getElementById("colorInput"),
  levelInput: document.getElementById("levelInput"),
  sizeInput: document.getElementById("sizeInput"),
  type1Input: document.getElementById("type1Input"),
  type2Input: document.getElementById("type2Input"),
  rarityInput: document.getElementById("rarityInput"),
  priceInput: document.getElementById("priceInput"),
  ivInput: document.getElementById("ivInput"),
  ivMaxInput: document.getElementById("ivMaxInput"),
  addBtn: document.getElementById("addBtn"),
  clearFormBtn: document.getElementById("clearFormBtn"),
  exportBtn: document.getElementById("exportBtn"),
  clearAllBtn: document.getElementById("clearAllBtn"),
  pokemonList: document.getElementById("pokemonList"),
  listCount: document.getElementById("listCount"),
  adRows: document.getElementById("adRows"),
  adCanvas: document.getElementById("adCanvas"),
  showPix: document.getElementById("showPix"),
  pixBadge: document.getElementById("pixBadge"),
  contactWhatsapp: document.getElementById("contactWhatsapp"),
  contactDiscord: document.getElementById("contactDiscord"),
  whatsappLabel: document.getElementById("whatsappLabel"),
  discordLabel: document.getElementById("discordLabel"),
};

function fillTypeSelects() {
  for (const select of [els.type1Input, els.type2Input]) {
    select.innerHTML = "";
    TYPES.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.label;
      select.appendChild(opt);
    });
  }
  els.type1Input.value = "";
  els.type2Input.value = "";
}

function getType(id) {
  return TYPES.find((t) => t.id === id) || TYPES[0];
}

function formatPrice(value) {
  const cleaned = String(value || "").trim();
  if (!cleaned) return "—";
  if (/^r\$/i.test(cleaned)) return cleaned.toUpperCase();
  return `R$ ${cleaned}`;
}

function normalize(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function imageUrlFor(entry) {
  if (entry?.image) return entry.image;
  if (entry?.id) return `${CDN_ART}/${entry.id}.png`;
  return "";
}

function thumbUrlFor(entry) {
  return imageUrlFor(entry);
}

function setPhotoPreview(dataUrl) {
  photoDataUrl = dataUrl || "";
  if (photoDataUrl) {
    els.photoPreview.style.backgroundImage = `url("${photoDataUrl}")`;
    els.photoPreview.classList.remove("empty");
    els.photoPreview.textContent = "";
  } else {
    els.photoPreview.style.backgroundImage = "";
    els.photoPreview.classList.add("empty");
    els.photoPreview.textContent = "Escolha um Pokémon ou envie uma foto";
  }
}

async function loadImageAsDataUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function applyPokedexEntry(entry) {
  if (!entry) return;
  els.nameInput.value = entry.name;
  photoManual = false;

  if (entry.types?.[0]) els.type1Input.value = entry.types[0];
  els.type2Input.value = entry.types?.[1] || "";

  els.photoPreview.textContent = "Carregando foto...";
  els.photoPreview.classList.remove("empty");

  const localUrl = entry.image || `pokemon/images/${entry.id}.webp`;
  const urls = [
    localUrl,
    `pokemon/images/${entry.id}.png`,
    `${CDN_ART}/${entry.id}.png`,
  ];

  let loaded = "";
  for (const url of urls) {
    try {
      loaded = await loadImageAsDataUrl(url);
      if (loaded) break;
    } catch {
      // try next source
    }
  }

  if (loaded) {
    setPhotoPreview(loaded);
  } else {
    setPhotoPreview("");
    alert("Não foi possível carregar a foto deste Pokémon. Você pode enviar manualmente.");
  }
}

function hideSuggestions() {
  els.nameSuggestions.hidden = true;
  els.nameSuggestions.innerHTML = "";
  activeSuggestion = -1;
}

function renderSuggestions(items) {
  if (!items.length) {
    hideSuggestions();
    return;
  }

  els.nameSuggestions.hidden = false;
  els.nameSuggestions.innerHTML = items
    .map(
      (p, index) => `
      <li data-index="${index}" data-id="${p.id}" class="${index === activeSuggestion ? "active" : ""}">
        <img src="${thumbUrlFor(p)}" alt="" loading="lazy" />
        <span class="poke-name">${escapeHtml(p.name)}${p.namePt && p.namePt !== p.name ? ` <small style="color:#9aa3b2">(${escapeHtml(p.namePt)})</small>` : ""}</span>
        <span class="poke-id">#${String(p.id).padStart(3, "0")}</span>
      </li>`
    )
    .join("");
}

function filterPokedex(query) {
  const q = normalize(query);
  if (q.length < 1) return [];
  return pokedex
    .filter((p) => {
      return (
        normalize(p.name).includes(q) ||
        normalize(p.namePt).includes(q) ||
        normalize(p.slug).includes(q) ||
        String(p.id) === q
      );
    })
    .slice(0, 12);
}

function readForm() {
  return {
    photo: photoDataUrl,
    name: els.nameInput.value.trim(),
    color: els.colorInput.value,
    level: els.levelInput.value.trim(),
    size: els.sizeInput.value.trim(),
    type1: els.type1Input.value,
    type2: els.type2Input.value,
    rarity: els.rarityInput.value,
    price: els.priceInput.value.trim(),
    iv: els.ivInput.value.trim(),
    ivMax: els.ivMaxInput.value.trim() || "192",
  };
}

function validate(data) {
  if (!data.photo) return "Escolha um Pokémon (foto) ou envie uma imagem.";
  if (!data.name) return "Informe o nome do Pokémon.";
  if (!data.level) return "Informe o level.";
  if (!data.size) return "Informe o multiplicador.";
  if (!data.type1) return "Selecione pelo menos o Tipo 1.";
  if (!data.rarity) return "Selecione a raridade.";
  if (!data.price) return "Informe o preço.";
  if (!data.iv) return "Informe o IV.";
  return "";
}

function clearForm() {
  editingId = null;
  photoManual = false;
  photoDataUrl = "";
  els.photoInput.value = "";
  setPhotoPreview("");
  els.nameInput.value = "";
  hideSuggestions();
  els.colorInput.value = NAME_COLORS[pokemon.length % NAME_COLORS.length];
  els.levelInput.value = "";
  els.sizeInput.value = "";
  els.type1Input.value = "";
  els.type2Input.value = "";
  els.rarityInput.value = "";
  els.priceInput.value = "";
  els.ivInput.value = "";
  els.ivMaxInput.value = "192";
  els.addBtn.textContent = "Adicionar à lista";
}

function setForm(item) {
  editingId = item.id;
  photoManual = true;
  setPhotoPreview(item.photo);
  els.nameInput.value = item.name;
  hideSuggestions();
  els.colorInput.value = item.color;
  els.levelInput.value = item.level;
  els.sizeInput.value = item.size;
  els.type1Input.value = item.type1;
  els.type2Input.value = item.type2 || "";
  els.rarityInput.value = item.rarity;
  els.priceInput.value = item.price;
  els.ivInput.value = item.iv;
  els.ivMaxInput.value = item.ivMax || "192";
  els.addBtn.textContent = "Salvar alterações";
}

function typeIconHtml(typeId) {
  const t = getType(typeId);
  if (!t.id) return "";
  return `<span class="type-icon" style="background:${t.color}" title="${t.label}">${t.short}</span>`;
}

function renderList() {
  els.listCount.textContent = String(pokemon.length);
  els.exportBtn.disabled = pokemon.length === 0;
  els.clearAllBtn.disabled = pokemon.length === 0;

  els.pokemonList.innerHTML = pokemon
    .map(
      (p, index) => `
      <li>
        <img src="${p.photo}" alt="${p.name}" />
        <div class="meta">
          <strong style="color:${p.color}">${p.name}</strong>
          <span>Lv.${p.level} · ${p.size} · ${formatPrice(p.price)} · IV ${p.iv}/${p.ivMax}</span>
        </div>
        <div class="row-actions">
          <button type="button" data-up="${p.id}" title="Subir" ${index === 0 ? "disabled" : ""}>↑</button>
          <button type="button" data-down="${p.id}" title="Descer" ${index === pokemon.length - 1 ? "disabled" : ""}>↓</button>
          <button type="button" data-edit="${p.id}" title="Editar">✎</button>
          <button type="button" data-del="${p.id}" title="Remover">✕</button>
        </div>
      </li>`
    )
    .join("");
}

function renderFooterContacts() {
  const wa = els.contactWhatsapp.value.trim();
  const discord = els.contactDiscord.value.trim();

  els.whatsappLabel.textContent = wa || "informe o número";
  els.whatsappLabel.style.opacity = wa ? "1" : "0.45";

  els.discordLabel.textContent = discord || "informe o discord";
  els.discordLabel.style.opacity = discord ? "1" : "0.45";

  els.pixBadge.textContent = "aceitamos pix";
  els.pixBadge.style.display = els.showPix.checked ? "inline-block" : "none";
}

function renderAd() {
  renderFooterContacts();

  if (!pokemon.length) {
    els.adRows.innerHTML = `<div class="ad-empty">Adicione Pokémon para montar o anúncio</div>`;
    return;
  }

  els.adRows.innerHTML = pokemon
    .map(
      (p) => `
      <div class="ad-row">
        <img src="${p.photo}" alt="${p.name}" />
        <div>
          <div class="ad-name" style="color:${p.color}">${escapeHtml(p.name)}</div>
          <div class="ad-level">Lv.${escapeHtml(String(p.level))}</div>
        </div>
        <div class="types">
          ${typeIconHtml(p.type1)}
          ${typeIconHtml(p.type2)}
        </div>
        <div class="vsep"></div>
        <div class="size-block">
          <div class="size">${escapeHtml(p.size)}</div>
          <div class="rarity">${escapeHtml(p.rarity)}</div>
        </div>
        <div class="vsep"></div>
        <div class="iv-block">IV ${escapeHtml(String(p.iv))}/${escapeHtml(String(p.ivMax))}</div>
        <div class="vsep"></div>
        <div class="price-block">
          <div class="label">PREÇO</div>
          <div class="value">${escapeHtml(formatPrice(p.price))}</div>
        </div>
      </div>`
    )
    .join("");
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function refresh() {
  renderList();
  renderAd();
  persist();
}

function persist() {
  const payload = {
    pokemon,
    contactWhatsapp: els.contactWhatsapp.value,
    contactDiscord: els.contactDiscord.value,
    showPix: els.showPix.checked,
  };
  localStorage.setItem("pokelist-ad", JSON.stringify(payload));
}

function restore() {
  try {
    const raw = localStorage.getItem("pokelist-ad");
    if (!raw) return;
    const data = JSON.parse(raw);
    pokemon = Array.isArray(data.pokemon) ? data.pokemon : [];
    els.contactWhatsapp.value = data.contactWhatsapp || "";
    els.contactDiscord.value = data.contactDiscord || "";
    els.showPix.checked = data.showPix !== false;
  } catch {
    pokemon = [];
  }
}

async function exportAd() {
  if (!pokemon.length) return;

  els.exportBtn.disabled = true;
  els.exportBtn.textContent = "Gerando...";

  try {
    const canvas = await html2canvas(els.adCanvas, {
      backgroundColor: "#000000",
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const maxWidth = 720;
    const ratio = maxWidth / canvas.width;
    const out = document.createElement("canvas");
    out.width = maxWidth;
    out.height = Math.round(canvas.height * ratio);
    const ctx = out.getContext("2d");
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(canvas, 0, 0, out.width, out.height);

    const link = document.createElement("a");
    link.download = `pokelist-venda-${Date.now()}.jpg`;
    link.href = out.toDataURL("image/jpeg", 0.82);
    link.click();
  } catch (err) {
    alert("Não foi possível gerar a imagem. Tente novamente.");
    console.error(err);
  } finally {
    els.exportBtn.disabled = pokemon.length === 0;
    els.exportBtn.textContent = "Baixar anúncio (JPG)";
  }
}

function moveItem(id, dir) {
  const i = pokemon.findIndex((p) => p.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= pokemon.length) return;
  [pokemon[i], pokemon[j]] = [pokemon[j], pokemon[i]];
  refresh();
}

async function loadPokedex() {
  try {
    const res = await fetch("data/pokemon.json");
    if (!res.ok) throw new Error("missing json");
    pokedex = await res.json();
  } catch {
    // Fallback mínimo se o JSON ainda não existir
    pokedex = [];
    console.warn("Pokédex local indisponível. Rode scripts/download_pokemon.py");
  }
}

els.photoInput.addEventListener("change", () => {
  const file = els.photoInput.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    photoManual = true;
    setPhotoPreview(String(reader.result || ""));
  };
  reader.readAsDataURL(file);
});

els.nameInput.addEventListener("input", () => {
  const matches = filterPokedex(els.nameInput.value);
  activeSuggestion = matches.length ? 0 : -1;
  renderSuggestions(matches);
});

els.nameInput.addEventListener("keydown", async (e) => {
  const items = [...els.nameSuggestions.querySelectorAll("li")];
  if (!items.length) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    activeSuggestion = (activeSuggestion + 1) % items.length;
    renderSuggestions(filterPokedex(els.nameInput.value));
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    activeSuggestion = (activeSuggestion - 1 + items.length) % items.length;
    renderSuggestions(filterPokedex(els.nameInput.value));
  } else if (e.key === "Enter") {
    e.preventDefault();
    const id = Number(items[Math.max(activeSuggestion, 0)]?.dataset.id);
    const entry = pokedex.find((p) => p.id === id);
    hideSuggestions();
    await applyPokedexEntry(entry);
  } else if (e.key === "Escape") {
    hideSuggestions();
  }
});

els.nameSuggestions.addEventListener("mousedown", async (e) => {
  const li = e.target.closest("li");
  if (!li) return;
  e.preventDefault();
  const entry = pokedex.find((p) => p.id === Number(li.dataset.id));
  hideSuggestions();
  await applyPokedexEntry(entry);
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".name-field")) hideSuggestions();
});

els.addBtn.addEventListener("click", () => {
  const data = readForm();
  const error = validate(data);
  if (error) {
    alert(error);
    return;
  }

  if (editingId) {
    const idx = pokemon.findIndex((p) => p.id === editingId);
    if (idx >= 0) pokemon[idx] = { ...data, id: editingId };
  } else {
    pokemon.push({ ...data, id: crypto.randomUUID() });
  }

  clearForm();
  refresh();
});

els.clearFormBtn.addEventListener("click", clearForm);

els.clearAllBtn.addEventListener("click", () => {
  if (!pokemon.length) return;
  if (confirm("Remover todos os Pokémon da lista?")) {
    pokemon = [];
    clearForm();
    refresh();
  }
});

els.exportBtn.addEventListener("click", exportAd);
els.showPix.addEventListener("change", refresh);
els.contactWhatsapp.addEventListener("input", refresh);
els.contactDiscord.addEventListener("input", refresh);

els.pokemonList.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const { up, down, edit, del } = btn.dataset;
  if (up) moveItem(up, -1);
  if (down) moveItem(down, 1);
  if (edit) {
    const item = pokemon.find((p) => p.id === edit);
    if (item) setForm(item);
  }
  if (del) {
    pokemon = pokemon.filter((p) => p.id !== del);
    if (editingId === del) clearForm();
    refresh();
  }
});

fillTypeSelects();
restore();
clearForm();
refresh();
loadPokedex();
