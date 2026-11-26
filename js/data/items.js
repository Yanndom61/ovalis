/**
 * Objets.
 * kind : "capture" | "heal" | plus tard "evolution", "stability", "fusion", "rod"…
 * Les nouvelles qualités d'Ovalune seront d'autres objets kind "capture" avec un ballMod différent.
 */

export const ITEMS = {
  ovalune: {
    id: "ovalune",
    name: "Ovalune",
    kind: "capture",
    price: 200,
    ballMod: 1,
    desc: "Une sphère à anneau ovale. Pendant un combat, elle invite un compagnon sauvage à te rejoindre.",
  },
  goutte: {
    id: "goutte",
    name: "Goutte vive",
    kind: "heal",
    price: 150,
    heal: 30,
    desc: "Eau claire des sources de Valclair. Rend 30 PV à un compagnon qui n'est pas K.O.",
  },
};

export const SHOP_STOCK = ["ovalune", "goutte"];

export function getItem(id) {
  return ITEMS[id];
}
