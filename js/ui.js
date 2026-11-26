/** Éléments d'écran : gros texte, fort contraste, boutons larges. */

import { TYPES } from "./data/types.js";

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

export function clear(node) {
  node.replaceChildren();
}

const SHAPES = {
  rond: "M8 2a6 6 0 1 0 0 12a6 6 0 1 0 0-12",
  triangle: "M8 1.5 L14.5 14 H1.5 Z",
  goutte: "M8 1 C5 6 2 8 2 11a6 6 0 0 0 12 0c0-3-3-5-6-10z",
  feuille: "M8 1 C3 6 2 12 8 15 C14 12 13 6 8 1z",
  eclair: "M9 1 L4 9 H8 L6 15 L13 7 H9 Z",
  losange: "M8 1 L14 8 L8 15 L2 8 Z",
  poing: "M3 8 h10 v5 h-3 v2 H6 v-2 H3 Z",
  bulle: "M5 8a3 3 0 1 0 0.1 0 M11 6a2 2 0 1 0 0.1 0 M12 11a2.2 2.2 0 1 0 0.1 0",
  carre: "M3 3 H13 V13 H3 Z",
  aile: "M2 10 Q8 2 14 8 Q8 9 2 14 Z",
  oeil: "M1 8 Q8 2 15 8 Q8 14 1 8 M8 5.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5",
  hex: "M8 1 L14 4.5 V11.5 L8 15 L2 11.5 V4.5 Z",
  roche: "M3 12 L5 5 H11 L14 9 L12 14 H5 Z",
  flamme: "M8 1 C6 6 2 7 3 11a5 5 0 0 0 10 0c1-4-2-5-2-8 C10 6 9 4 8 1z",
  croc: "M2 3 L6 13 L8 7 L10 13 L14 3 L11 3 L8 9 L5 3 Z",
  lune: "M10 2 A6 6 0 1 0 10 14 A5 5 0 1 1 10 2z",
  ecu: "M8 1 L14 4 V8 C14 12 8 15 8 15 C8 15 2 12 2 8 V4 Z",
  etoile: "M8 1 L10 6 H15 L11 9 L12.5 14 L8 11 L3.5 14 L5 9 L1 6 H6 Z",
};

export function typePill(typeId) {
  const t = TYPES[typeId];
  const span = el("span", "type-pill");
  span.style.backgroundColor = t.color;
  span.style.color = t.text;
  span.dataset.pattern = t.pattern;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("class", "type-shape");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", SHAPES[t.shape] || SHAPES.rond);
  path.setAttribute("fill", t.text);
  svg.append(path);
  span.append(svg, document.createTextNode(t.name));
  return span;
}

export function typeRow(types) {
  const row = el("span", "type-row");
  for (const id of types) row.append(typePill(id));
  return row;
}

export function fitCanvas(canvas) {
  const r = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth || 1;
  const h = canvas.clientHeight || 1;
  const pw = Math.max(1, Math.round(w * r));
  const ph = Math.max(1, Math.round(h * r));
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(r, 0, 0, r, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

let toastTimer = 0;
export function toast(text) {
  const node = document.getElementById("toast");
  node.hidden = false;
  node.textContent = text;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { node.hidden = true; }, 1700);
}
export function hideToast() {
  const node = document.getElementById("toast");
  if (node) node.hidden = true;
}

export function cleanName(value) {
  const t = String(value || "").trim().replace(/\s+/g, " ");
  if (!t || t.length > 12) return null;
  if (!/^[\p{L}][\p{L}'’ \-]{0,11}$/u.test(t)) return null;
  return t;
}
