import html2canvas from "html2canvas";

function withTimeout<T>(promise: Promise<T>, ms: number, label: string) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} demorou demais (${ms / 1000}s). Tente de novo.`));
    }, ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export async function canvasToJpeg(
  element: HTMLElement,
  maxWidth = 720,
  quality = 0.82,
  backgroundColor = "#000000"
) {
  const bg = backgroundColor || "#000000";
  const canvas = await withTimeout(
    html2canvas(element, {
      backgroundColor: bg,
      scale: 1.25,
      useCORS: true,
      allowTaint: true,
      logging: false,
      imageTimeout: 5000,
      removeContainer: true,
      onclone: (doc) => {
        // Evita travar em fontes externas (Google Fonts)
        const style = doc.createElement("style");
        style.textContent = `* { font-family: Arial, Helvetica, sans-serif !important; }`;
        doc.head.appendChild(style);
      },
    }),
    25000,
    "Geração da imagem"
  );

  const ratio = maxWidth / canvas.width;
  const out = document.createElement("canvas");
  out.width = maxWidth;
  out.height = Math.round(canvas.height * ratio);
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(canvas, 0, 0, out.width, out.height);
  return out.toDataURL("image/jpeg", quality);
}

/** Reduz data URL para upload mais rápido no Storage */
export async function compressDataUrl(
  dataUrl: string,
  maxSize = 512,
  quality = 0.75
) {
  if (!dataUrl.startsWith("data:image")) return dataUrl;

  const img = await withTimeout(
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Falha ao ler imagem para compressão"));
      image.src = dataUrl;
    }),
    10000,
    "Compressão da imagem"
  );

  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export async function shareWhatsApp(dataUrl: string, text: string) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], "anuncio.jpg", { type: "image/jpeg" });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], text, title: "Anúncio" });
    return;
  }

  downloadDataUrl(dataUrl, `anuncio-${Date.now()}.jpg`);
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
