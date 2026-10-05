#!/usr/bin/env python3
"""
Gera os dados da apostila digital a partir do PDF original.

  python3 tools/build_data.py "Apostila - Cultivando Culturas.pdf"

Saídas (em assets/):
  pages/pagina-NN.jpg        -> cada página rasterizada (via pdftoppm, 170 dpi)
  data/text-layer.js         -> texto de cada página com coordenadas (camada selecionável / acessível)

ATENÇÃO: assets/data/pages.js (títulos, seções, campos editáveis) é mantido À MÃO.
Este script NÃO o sobrescreve — é nele que você corrige uma página, move um campo
ou inclui uma atividade.

Requisitos: poppler-utils (pdftoppm) e pdfplumber.
"""
import json, subprocess, sys, os
import pdfplumber

pdf_path = sys.argv[1] if len(sys.argv) > 1 else "Apostila - Cultivando Culturas.pdf"
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pages_dir = os.path.join(root, "assets", "pages")
data_dir = os.path.join(root, "assets", "data")
os.makedirs(pages_dir, exist_ok=True)
os.makedirs(data_dir, exist_ok=True)

if "--sem-imagens" not in sys.argv:
    subprocess.run(["pdftoppm", "-jpeg", "-jpegopt", "quality=88,optimize=y", "-r", "170",
                    pdf_path, os.path.join(pages_dir, "pagina")], check=True)

# páginas cujo texto é rotacionado: ficam só com texto alternativo (sem camada posicionada)
ROTATED = {77, 78}

out = {}
alt = {}
with pdfplumber.open(pdf_path) as pdf:
    for i, page in enumerate(pdf.pages, 1):
        up = page.filter(lambda o: o.get("object_type") != "char" or o.get("upright", True))
        lines = up.extract_text_lines(return_chars=False)
        full = " ".join(l["text"] for l in lines).strip()
        alt[i] = full
        if i in ROTATED:
            out[i] = []
            continue
        out[i] = [[round(l["x0"], 1), round(l["top"], 1), round(l["x1"], 1),
                   round(l["bottom"], 1), l["text"]] for l in lines if l["text"].strip()]
        W, H = page.width, page.height

with open(os.path.join(data_dir, "text-layer.js"), "w", encoding="utf-8") as f:
    f.write("/* Gerado por tools/build_data.py — camada de texto (x0, topo, x1, base, texto) em pontos PDF (A4 = 595,276 x 841,89). */\n")
    f.write("window.TEXT_LAYER = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")
    f.write("window.PAGE_TEXT = " + json.dumps(alt, ensure_ascii=False, separators=(",", ":")) + ";\n")
print("ok:", len(out), "páginas")
