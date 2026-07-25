"""Baixa lista + artes oficiais dos Pokémon (1–1025)."""

from __future__ import annotations

import json
import re
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "pokemon" / "images"
DATA_FILE = ROOT / "data" / "pokemon.json"
MAX_ID = 1025
ART_URL = (
    "https://raw.githubusercontent.com/PokeAPI/sprites/master/"
    "sprites/pokemon/other/official-artwork/{id}.png"
)
FALLBACK_ART = (
    "https://raw.githubusercontent.com/PokeAPI/sprites/master/"
    "sprites/pokemon/{id}.png"
)
TYPE_MAP = {
    "normal",
    "fire",
    "water",
    "electric",
    "grass",
    "ice",
    "fighting",
    "poison",
    "ground",
    "flying",
    "psychic",
    "bug",
    "rock",
    "ghost",
    "dragon",
    "dark",
    "steel",
    "fairy",
}


def fetch_json(url: str, retries: int = 4):
    last_err = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(
                url, headers={"User-Agent": "geradoranuncios/1.0"}
            )
            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as err:  # noqa: BLE001
            last_err = err
            time.sleep(0.8 * (attempt + 1))
    raise RuntimeError(f"Falha ao buscar {url}: {last_err}")


def download_file(url: str, dest: Path) -> bool:
    if dest.exists() and dest.stat().st_size > 500:
        return True
    try:
        req = urllib.request.Request(
            url, headers={"User-Agent": "geradoranuncios/1.0"}
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = resp.read()
        if not data or len(data) < 200:
            return False
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
        return True
    except urllib.error.HTTPError as err:
        if err.code == 404:
            return False
        return False
    except Exception:
        return False


def title_name(slug: str) -> str:
    parts = [p.capitalize() for p in re.split(r"[-_]", slug) if p]
    return " ".join(parts)


def process_id(poke_id: int) -> dict | None:
    detail = fetch_json(f"https://pokeapi.co/api/v2/pokemon/{poke_id}")
    species = fetch_json(detail["species"]["url"])

    name_en = next(
        (n["name"] for n in species["names"] if n["language"]["name"] == "en"),
        title_name(detail["name"]),
    )
    name_pt = next(
        (
            n["name"]
            for n in species["names"]
            if n["language"]["name"] in ("pt-BR", "pt")
        ),
        name_en,
    )

    types = []
    for slot in sorted(detail["types"], key=lambda t: t["slot"]):
        key = slot["type"]["name"]
        if key in TYPE_MAP:
            types.append(key)

    image_name = f"{poke_id}.png"
    dest = OUT_DIR / image_name
    ok = download_file(ART_URL.format(id=poke_id), dest)
    if not ok:
        ok = download_file(FALLBACK_ART.format(id=poke_id), dest)

    return {
        "id": poke_id,
        "name": name_en,
        "namePt": name_pt,
        "slug": detail["name"],
        "types": types,
        "image": f"pokemon/images/{image_name}",
        "hasImage": bool(ok and dest.exists()),
    }


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)

    ids = list(range(1, MAX_ID + 1))
    print(f"Baixando {len(ids)} Pokémon...")

    entries: list[dict] = []
    with ThreadPoolExecutor(max_workers=10) as pool:
        futures = {pool.submit(process_id, i): i for i in ids}
        done = 0
        for fut in as_completed(futures):
            done += 1
            poke_id = futures[fut]
            try:
                entry = fut.result()
                if entry:
                    entries.append(entry)
            except Exception as err:  # noqa: BLE001
                print(f"Erro #{poke_id}: {err}")
            if done % 50 == 0 or done == len(ids):
                print(f"Progresso: {done}/{len(ids)} | ok: {len(entries)}")

    entries.sort(key=lambda e: e["id"])
    DATA_FILE.write_text(
        json.dumps(entries, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Salvo: {DATA_FILE} ({len(entries)} itens)")


if __name__ == "__main__":
    main()
