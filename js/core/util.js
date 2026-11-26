/** Petites fonctions partagées. Aucune dépendance, pour rester réutilisable. */

export const STAT_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"];

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);

export function randInt(a, b) {
  return a + Math.floor(Math.random() * (b - a + 1));
}

export function uid() {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36);
}

export function hash2(x, y) {
  let n = (x * 374761393 + y * 668265263) | 0;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 4294967295;
}

export function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
