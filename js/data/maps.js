/**
 * Cartes de l'étape 1.
 * Les tuiles sont des lettres. Les collisions, les portes et les rencontres
 * sont des données à côté : on pourra ajouter des villes sans réécrire le moteur.
 *
 * Tuiles :
 *   # arbre (mur)   . herbe   , fleurs   p chemin   t hautes herbes
 *   w eau (mur)     r toit     b mur      d porte    f sol intérieur
 *   c comptoir (mur) s pancarte (mur)  k terminal (mur)  m meuble (mur)
 */

import { SPECIES } from "./creatures.js";

export const SOLID = new Set(["#", "r", "b", "w", "c", "s", "k", "m", "="]);

function grid(w, h, fill) {
  return Array.from({ length: h }, () => Array.from({ length: w }, () => fill));
}
function rect(g, x, y, w, h, ch) {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) g[j][i] = ch;
  }
}
function vline(g, x, y0, y1, ch) {
  for (let y = y0; y <= y1; y++) g[y][x] = ch;
}
function hline(g, x0, x1, y, ch) {
  for (let x = x0; x <= x1; x++) g[y][x] = ch;
}
function border(g, ch) {
  const h = g.length;
  const w = g[0].length;
  for (let x = 0; x < w; x++) {
    g[0][x] = ch;
    g[h - 1][x] = ch;
  }
  for (let y = 0; y < h; y++) {
    g[y][0] = ch;
    g[y][w - 1] = ch;
  }
}

const person = (look, hairStyle, hair, skin, eyes, outfit) =>
  ({ look, hairStyle, hair, skin, eyes, outfit });

function buildValclair() {
  const g = grid(24, 20, ".");
  border(g, "#");
  // Étang
  rect(g, 16, 2, 6, 3, "w");
  // Laboratoire
  rect(g, 8, 1, 6, 2, "r");
  rect(g, 8, 3, 6, 2, "b");
  g[4][11] = "d";
  // Rue
  vline(g, 11, 5, 17, "p");
  // Relais Vital
  rect(g, 2, 6, 5, 2, "r");
  rect(g, 2, 8, 5, 1, "b");
  g[8][4] = "d";
  hline(g, 4, 11, 9, "p");
  // Échoppe
  rect(g, 16, 6, 6, 2, "r");
  rect(g, 16, 8, 6, 1, "b");
  g[8][18] = "d";
  hline(g, 11, 18, 9, "p");
  // Maison
  rect(g, 2, 12, 5, 2, "r");
  rect(g, 2, 14, 5, 1, "b");
  g[14][4] = "d";
  hline(g, 4, 11, 15, "p");
  // Place et sortie sud
  hline(g, 2, 21, 16, "p");
  g[17][11] = "p";
  g[18][11] = "p";
  g[19][11] = "p";
  // Herbes hautes (pour s'entraîner avant le sentier)
  rect(g, 14, 11, 3, 3, "t");
  // Fleurs
  g[15][15] = ",";
  g[6][9] = ",";
  g[10][12] = ",";
  g[13][20] = ",";
  g[15][5] = ",";
  // Pancartes (ligne = y, colonne = x)
  g[6][12] = "s";
  g[10][13] = "s";
  g[16][12] = "s";

  return {
    id: "valclair",
    name: "Valclair",
    music: "town",
    indoors: false,
    tiles: g.map((row) => row.join("")),
    encounters: {
      rate: 0.14,
      table: [
        { species: "grounin", min: 2, max: 3, weight: 50 },
        { species: "mouettine", min: 2, max: 3, weight: 32 },
        { species: "petaline", min: 2, max: 3, weight: 18 },
      ],
    },
    warps: [
      { x: 11, y: 4, to: "lab", tx: 7, ty: 7, dir: "up" },
      { x: 4, y: 8, to: "relais", tx: 7, ty: 7, dir: "up" },
      { x: 18, y: 8, to: "echoppe", tx: 7, ty: 7, dir: "up" },
      { x: 4, y: 14, to: "maison", tx: 7, ty: 7, dir: "up" },
      { x: 11, y: 18, to: "sentier", tx: 8, ty: 1, dir: "down" },
    ],
    signs: [
      { x: 12, y: 6, text: "Laboratoire Ardent. Ici, on étudie les compagnons d'Ovalis." },
      { x: 13, y: 10, text: "Herbes hautes. Avance doucement : un compagnon sauvage peut apparaître." },
      { x: 12, y: 16, text: "Sentier des Roseaux. Portbrume est tout au sud." },
    ],
    interactables: [],
    npcs: [
      {
        id: "lina",
        name: "Lina",
        x: 9, y: 16, dir: "down",
        sprite: person("fille", "long", "#C4473A", "#E8B48A", "#2F5F8A", "jupe"),
        lines: [
          "Les herbes hautes bougent toutes seules. Quelqu'un s'y cache.",
          "Si tu te perds, le Relais Vital est le bâtiment à l'ouest. On y soigne les compagnons.",
        ],
      },
      {
        id: "tom",
        name: "Tom",
        x: 15, y: 5, dir: "left",
        sprite: person("garcon", "court", "#4A3428", "#C68642", "#3E7A3A", "tunic"),
        lines: [
          "J'ai vu un petit renard de feu près du labo. Sa crinière brillait !",
          "L'étang est trop froid pour nager. Un jour, peut-être.",
        ],
      },
    ],
    trainers: [],
  };
}

function buildLab() {
  const g = grid(15, 11, "f");
  border(g, "b");
  rect(g, 4, 3, 7, 1, "c");
  g[5][12] = "k";
  g[9][7] = "d";
  g[0][7] = "b";
  return {
    id: "lab",
    name: "Laboratoire Ardent",
    music: "town",
    indoors: true,
    tiles: g.map((r) => r.join("")),
    encounters: null,
    warps: [{ x: 7, y: 9, to: "valclair", tx: 11, ty: 5, dir: "down" }],
    signs: [],
    interactables: [
      {
        id: "socle",
        x: 12, y: 5,
        lines: [
          "Un socle vide, gravé d'un ovale.",
          "Nils dit qu'un jour on y fusionnera deux compagnons. Pour l'instant, il se repose.",
        ],
      },
    ],
    npcs: [
      {
        id: "ardent",
        name: "Professeure Ardent",
        x: 7, y: 4, dir: "down",
        sprite: person("fille", "chignon", "#E8E8EA", "#E8B48A", "#6B4423", "blouse"),
        role: "professor",
        lines: [
          "Le voyage te va bien. Reviens me voir quand tu veux : j'adore les histoires de route.",
        ],
      },
      {
        id: "nils",
        name: "Nils",
        x: 3, y: 6, dir: "right",
        sprite: person("garcon", "court", "#6B4C9A", "#F6D3B0", "#2F5F8A", "blouse"),
        lines: [
          "Je range des notes sur les œufs et les fusions. Ce n'est pas encore prêt à te montrer.",
          "Choisis bien tes combats, et passe au Relais Vital avant d'être trop fatigué.",
        ],
      },
    ],
    trainers: [],
  };
}

function buildRelais() {
  const g = grid(15, 11, "f");
  border(g, "b");
  rect(g, 4, 3, 7, 1, "c");
  g[5][12] = "k";
  g[9][7] = "d";
  return {
    id: "relais",
    name: "Relais Vital",
    music: "town",
    indoors: true,
    tiles: g.map((r) => r.join("")),
    encounters: null,
    warps: [{ x: 7, y: 9, to: "valclair", tx: 4, ty: 9, dir: "down" }],
    signs: [],
    interactables: [
      {
        id: "terminal",
        x: 12, y: 5,
        kind: "pc",
        lines: [],
      },
    ],
    npcs: [
      {
        id: "mael",
        name: "Maël",
        x: 7, y: 4, dir: "down",
        sprite: person("autre", "court", "#1A1A1A", "#C68642", "#2F5F8A", "soin"),
        role: "healer",
        lines: [],
      },
    ],
    trainers: [],
  };
}

function buildShop() {
  const g = grid(15, 11, "f");
  border(g, "b");
  rect(g, 4, 3, 7, 1, "c");
  g[9][7] = "d";
  return {
    id: "echoppe",
    name: "Échoppe de Noé",
    music: "town",
    indoors: true,
    tiles: g.map((r) => r.join("")),
    encounters: null,
    warps: [{ x: 7, y: 9, to: "valclair", tx: 18, ty: 9, dir: "down" }],
    signs: [],
    interactables: [],
    npcs: [
      {
        id: "noe",
        name: "Noé",
        x: 7, y: 4, dir: "down",
        sprite: person("autre", "moyen", "#8B5A2B", "#8D5524", "#1A1A1A", "tablier"),
        role: "shop",
        lines: [],
      },
    ],
    trainers: [],
  };
}

function buildHouse() {
  const g = grid(15, 11, "f");
  border(g, "b");
  rect(g, 2, 2, 3, 2, "m");
  g[9][7] = "d";
  g[6][4] = ",";
  return {
    id: "maison",
    name: "Maison",
    music: "town",
    indoors: true,
    tiles: g.map((r) => r.join("")),
    encounters: null,
    warps: [{ x: 7, y: 9, to: "valclair", tx: 4, ty: 15, dir: "down" }],
    signs: [],
    interactables: [
      {
        id: "lit",
        x: 3, y: 3,
        lines: ["Ton lit. La partie s'enregistre toute seule, tu peux te reposer l'esprit tranquille."],
      },
    ],
    npcs: [
      {
        id: "camille",
        name: "Camille",
        x: 10, y: 5, dir: "left",
        sprite: person("autre", "moyen", "#D4A017", "#F6D3B0", "#3E7A3A", "cape"),
        role: "parent",
        lines: [
          "Je suis là si tu as besoin d'une pause. Cette maison reste la tienne.",
        ],
      },
    ],
    trainers: [],
  };
}

function buildSentier() {
  const g = grid(17, 32, ".");
  border(g, "#");
  vline(g, 8, 0, 31, "p");
  rect(g, 2, 4, 5, 24, "t");
  rect(g, 10, 4, 5, 24, "t");
  vline(g, 8, 4, 28, "p");
  g[0][8] = "p";
  g[31][8] = "p";
  g[3][9] = "s";
  g[16][6] = "s";
  for (let i = 0; i < 6; i++) {
    g[6 + i * 4][1] = "#";
    g[8 + i * 3][15] = "#";
  }
  g[3][9] = "s";
  return {
    id: "sentier",
    name: "Sentier des Roseaux",
    music: "route",
    indoors: false,
    tiles: g.map((r) => r.join("")),
    encounters: {
      rate: 0.17,
      table: [
        { species: "grounin", min: 2, max: 4, weight: 30 },
        { species: "mouettine", min: 2, max: 4, weight: 24 },
        { species: "taupion", min: 2, max: 4, weight: 18 },
        { species: "piquorin", min: 3, max: 4, weight: 12 },
        { species: "lampyrin", min: 3, max: 5, weight: 8 },
        { species: "petaline", min: 3, max: 5, weight: 6 },
        { species: "nebulette", min: 4, max: 5, weight: 2 },
      ],
    },
    warps: [
      { x: 8, y: 0, to: "valclair", tx: 11, ty: 17, dir: "up" },
      { x: 8, y: 31, to: "portbrume", tx: 8, ty: 2, dir: "down" },
    ],
    signs: [
      { x: 9, y: 3, text: "Sentier des Roseaux. Valclair est au nord, Portbrume au sud." },
      { x: 6, y: 16, text: "Les dresseurs viennent vers toi s'ils te voient. Tu peux aussi leur parler." },
    ],
    interactables: [],
    npcs: [],
    trainers: [
      {
        id: "jules",
        name: "Jules",
        title: "Jeune dresseur",
        x: 8, y: 12, dir: "up", sight: 4,
        sprite: person("garcon", "court", "#1C1C1C", "#E8B48A", "#6A3E96", "casquette"),
        before: ["Je m'entraîne ici tous les jours.", "Montre-moi ton compagnon !"],
        after: ["Belle victoire. Je reste ici pour m'entraîner encore."],
        reward: 160,
        party: [
          { species: "rocadon", level: 4 },
          { species: "piquorin", level: 4 },
        ],
      },
      {
        id: "ines",
        name: "Inès",
        title: "Promeneuse",
        x: 12, y: 22, dir: "left", sight: 4,
        sprite: person("fille", "long", "#E0B15A", "#F6D3B0", "#2F5F8A", "jupe"),
        before: ["Tu traverses les herbes, toi aussi ?", "Alors en garde !"],
        after: ["Tu te débrouilles bien. Continue vers le sud, et fais attention."],
        reward: 200,
        party: [
          { species: "mouettine", level: 5 },
          { species: "lampyrin", level: 5 },
        ],
      },
    ],
  };
}

function buildPortbrume() {
  const g = grid(18, 16, ".");
  border(g, "#");
  vline(g, 8, 0, 8, "p");
  hline(g, 3, 14, 8, "p");
  g[0][8] = "p";
  rect(g, 2, 4, 5, 3, "b");
  rect(g, 2, 4, 5, 1, "r");
  g[6][4] = "b";
  rect(g, 11, 4, 5, 3, "b");
  rect(g, 11, 4, 5, 1, "r");
  g[6][13] = "b";
  rect(g, 13, 10, 4, 4, "w");
  g[3][9] = "s";
  g[15][8] = "#";
  return {
    id: "portbrume",
    name: "Portbrume",
    music: "town",
    indoors: false,
    tiles: g.map((r) => r.join("")),
    encounters: null,
    warps: [{ x: 8, y: 0, to: "sentier", tx: 8, ty: 30, dir: "up" }],
    signs: [
      { x: 9, y: 3, text: "Portbrume. Le port, les maisons et les routes au-delà ouvriront plus tard." },
    ],
    interactables: [
      { id: "porte-ouest", x: 4, y: 6, lines: ["C'est fermé pour le moment."] },
      { id: "porte-est", x: 13, y: 6, lines: ["Une maison encore vide. Personne n'habite ici pour l'instant."] },
    ],
    npcs: [
      {
        id: "omar",
        name: "Omar",
        x: 6, y: 8, dir: "right",
        sprite: person("garcon", "moyen", "#4A3428", "#6B3E26", "#6A4424", "cape"),
        lines: [
          "Les bateaux sont à quai. Reviens quand le chemin sera ouvert.",
          "En attendant, Valclair et le sentier ont déjà de quoi t'occuper.",
        ],
      },
    ],
    trainers: [],
  };
}

function finalize(map) {
  map.w = map.tiles[0].length;
  map.h = map.tiles.length;
  map.tiles = map.tiles.map((row) => row.split(""));
  return map;
}

export const MAPS = {};
for (const build of [buildValclair, buildLab, buildRelais, buildShop, buildHouse, buildSentier, buildPortbrume]) {
  const map = finalize(build());
  MAPS[map.id] = map;
}

export function getMap(id) {
  return MAPS[id];
}

export function tileAt(map, x, y) {
  if (!map || y < 0 || x < 0 || y >= map.h || x >= map.w) return "#";
  return map.tiles[y][x];
}

export function isSolid(map, x, y) {
  return SOLID.has(tileAt(map, x, y));
}

/** Vérifie que les cartes restent jouables. Utilisé par les tests. */
export function validateMaps() {
  const errors = [];
  for (const map of Object.values(MAPS)) {
    if (map.tiles.length !== map.h) errors.push(`${map.id} hauteur`);
    for (const row of map.tiles) {
      if (row.length !== map.w) errors.push(`${map.id} largeur inégale`);
    }
    const walk = (x, y) => y >= 0 && x >= 0 && y < map.h && x < map.w && !isSolid(map, x, y);
    for (const w of map.warps) {
      if (!walk(w.x, w.y)) errors.push(`${map.id} porte ${w.x},${w.y} impraticable`);
      const dest = MAPS[w.to];
      if (!dest) errors.push(`${map.id} porte vers ${w.to} inconnue`);
      else if (yIn(dest, w.tx, w.ty) === false) errors.push(`${map.id} arrivée ${w.to} ${w.tx},${w.ty} impraticable`);
      else if (dest.warps.some((d) => d.x === w.tx && d.y === w.ty)) {
        errors.push(`${map.id} arrivée ${w.to} ${w.tx},${w.ty} est elle-même une porte`);
      }
    }
    for (const n of [...map.npcs, ...map.trainers]) {
      if (!walk(n.x, n.y)) errors.push(`${map.id} ${n.id} sur une case bloquée ${n.x},${n.y}`);
      if (map.warps.some((w) => w.x === n.x && w.y === n.y)) errors.push(`${map.id} ${n.id} sur une porte`);
    }
    for (const s of map.signs) {
      if (tileAt(map, s.x, s.y) !== "s") errors.push(`${map.id} pancarte ${s.x},${s.y} pas sur s`);
    }
    if (map.encounters) {
      for (const e of map.encounters.table) {
        if (!SPECIES[e.species]) errors.push(`${map.id} rencontre ${e.species} inconnue`);
      }
    }
    for (const t of map.trainers) {
      for (const p of t.party) {
        if (!SPECIES[p.species]) errors.push(`${map.id} dresseur ${t.id} ${p.species} inconnu`);
      }
    }
  }
  return errors;
}

function yIn(map, x, y) {
  if (y < 0 || x < 0 || y >= map.h || x >= map.w) return false;
  return !isSolid(map, x, y);
}
