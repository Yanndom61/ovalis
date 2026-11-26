/**
 * Créatures d'Ovalis.
 *
 * Le champ `render` est volontairement découpé en parties
 * (body, head, ears, tail, wings, pattern, extras) + une palette.
 * Une fusion future pourra mélanger les parties de deux créatures
 * et les passer telles quelles au dessinateur, sans changer le combat.
 *
 * genderRatio : [mâle, femelle, hermaphrodite], la somme vaut 1.
 * evolve : null pour l'instant. Plus tard { at: "level", level: 16, into: "id" }.
 */

export const SPECIES_ORDER = [
  "solarix", "nimbleu", "verdelin",
  "grounin", "mouettine", "taupion",
  "lampyrin", "petaline", "rocadon",
  "nebulette", "piquorin",
];

const pal = (main, shade, belly, accent, accent2, eye, dark) =>
  ({ main, shade, belly, accent, accent2, eye, dark });

export const SPECIES = {
  solarix: {
    id: "solarix",
    name: "Solarix",
    types: ["feu"],
    role: "starter",
    baseStats: { hp: 45, atk: 52, def: 43, spa: 60, spd: 50, spe: 65 },
    catchRate: 45,
    baseExp: 64,
    genderRatio: [0.5, 0.45, 0.05],
    evolve: null,
    height: "0,6 m",
    weight: "8 kg",
    areas: ["Laboratoire Ardent"],
    description: "Un petit renard solaire. Sa crinière crépite quand il est content.",
    learnset: [
      { level: 1, move: "griffes" },
      { level: 1, move: "etincelle" },
      { level: 2, move: "cri" },
      { level: 2, move: "souffle" },
      { level: 9, move: "danse" },
    ],
    render: {
      parts: { body: "fox", head: "fox", ears: "pointed", tail: "flame", wings: "none", pattern: "none", extras: ["sunflames"] },
      palette: pal("#F27B2C", "#C45012", "#FFE0B8", "#FFD15A", "#FFF4C8", "#5A2A12", "#3A1A0C"),
    },
  },
  nimbleu: {
    id: "nimbleu",
    name: "Nimbleu",
    types: ["eau"],
    role: "starter",
    baseStats: { hp: 50, atk: 48, def: 55, spa: 58, spd: 55, spe: 52 },
    catchRate: 45,
    baseExp: 64,
    genderRatio: [0.5, 0.5, 0],
    evolve: null,
    height: "0,5 m",
    weight: "9 kg",
    areas: ["Laboratoire Ardent"],
    description: "Une loutre des courants. Elle garde toujours une bulle près du museau.",
    learnset: [
      { level: 1, move: "boutoir" },
      { level: 1, move: "jetSource" },
      { level: 2, move: "carapace" },
      { level: 2, move: "vague" },
      { level: 10, move: "danse" },
    ],
    render: {
      parts: { body: "otter", head: "otter", ears: "round", tail: "paddle", wings: "none", pattern: "none", extras: ["bubbles"] },
      palette: pal("#2E8FD6", "#1667A8", "#E7F6FF", "#7FD3F2", "#FFFFFF", "#0E3A66", "#0C2C4A"),
    },
  },
  verdelin: {
    id: "verdelin",
    name: "Verdelin",
    types: ["plante"],
    role: "starter",
    baseStats: { hp: 48, atk: 55, def: 50, spa: 52, spd: 55, spe: 50 },
    catchRate: 45,
    baseExp: 64,
    genderRatio: [0.4, 0.4, 0.2],
    evolve: null,
    height: "0,7 m",
    weight: "12 kg",
    areas: ["Laboratoire Ardent"],
    description: "Un faon des sous-bois. Des feuilles poussent à la place des bois.",
    learnset: [
      { level: 1, move: "elan" },
      { level: 1, move: "claque" },
      { level: 2, move: "regard" },
      { level: 2, move: "seve" },
      { level: 10, move: "poussiere" },
    ],
    render: {
      parts: { body: "fawn", head: "fawn", ears: "leaf", tail: "leaf", wings: "none", pattern: "spots", extras: ["blossom"] },
      palette: pal("#3E9B4F", "#1F6B32", "#F3E2C2", "#A6D96A", "#FFF8E8", "#204028", "#143018"),
    },
  },
  grounin: {
    id: "grounin",
    name: "Grounin",
    types: ["normal"],
    role: "wild",
    baseStats: { hp: 52, atk: 55, def: 42, spa: 30, spd: 36, spe: 40 },
    catchRate: 255,
    baseExp: 48,
    genderRatio: [0.5, 0.5, 0],
    evolve: null,
    height: "0,4 m",
    weight: "14 kg",
    areas: ["Valclair", "Sentier des Roseaux"],
    description: "Un petit sanglier rond et têtu. Il charge avant de réfléchir.",
    learnset: [
      { level: 1, move: "boutoir" },
      { level: 1, move: "elan" },
      { level: 2, move: "ruade" },
      { level: 2, move: "cri" },
    ],
    render: {
      parts: { body: "boar", head: "boar", ears: "round", tail: "curl", wings: "none", pattern: "none", extras: ["tusks"] },
      palette: pal("#D3926A", "#A86B45", "#F6D2B5", "#8C4A32", "#FFE8D2", "#3A2418", "#2A160E"),
    },
  },
  mouettine: {
    id: "mouettine",
    name: "Mouettine",
    types: ["vol", "normal"],
    role: "wild",
    baseStats: { hp: 40, atk: 48, def: 35, spa: 36, spd: 35, spe: 62 },
    catchRate: 255,
    baseExp: 50,
    genderRatio: [0.5, 0.5, 0],
    evolve: null,
    height: "0,3 m",
    weight: "2 kg",
    areas: ["Valclair", "Sentier des Roseaux"],
    description: "Un poussin des rivages. Il court plus vite qu'il ne vole.",
    learnset: [
      { level: 1, move: "elan" },
      { level: 1, move: "bec" },
      { level: 2, move: "bourrasque" },
      { level: 2, move: "danse" },
    ],
    render: {
      parts: { body: "bird", head: "bird", ears: "tuft", tail: "fan", wings: "feather", pattern: "none", extras: [] },
      palette: pal("#F4F7FB", "#7BA7C9", "#FFFFFF", "#F2C14E", "#E8EEF5", "#2C3E50", "#243040"),
    },
  },
  taupion: {
    id: "taupion",
    name: "Taupion",
    types: ["sol"],
    role: "wild",
    baseStats: { hp: 48, atk: 52, def: 58, spa: 30, spd: 42, spe: 28 },
    catchRate: 220,
    baseExp: 50,
    genderRatio: [0.5, 0.5, 0],
    evolve: null,
    height: "0,3 m",
    weight: "6 kg",
    areas: ["Sentier des Roseaux"],
    description: "Une taupe aux larges pattes. Elle creuse pour se calmer.",
    learnset: [
      { level: 1, move: "griffes" },
      { level: 1, move: "terre" },
      { level: 2, move: "pietine" },
      { level: 2, move: "carapace" },
    ],
    render: {
      parts: { body: "mole", head: "mole", ears: "tiny", tail: "stub", wings: "none", pattern: "none", extras: ["shovels"] },
      palette: pal("#8D6A4A", "#5C4030", "#E7C8A8", "#C9845A", "#F8E6D4", "#2A1C14", "#24160E"),
    },
  },
  lampyrin: {
    id: "lampyrin",
    name: "Lampyrin",
    types: ["insecte", "electrik"],
    role: "wild",
    baseStats: { hp: 38, atk: 42, def: 38, spa: 58, spd: 42, spe: 60 },
    catchRate: 150,
    baseExp: 58,
    genderRatio: [0.25, 0.25, 0.5],
    evolve: null,
    height: "0,3 m",
    weight: "3 kg",
    areas: ["Sentier des Roseaux"],
    description: "Un scarabée lanterne. Son dos s'allume la nuit, et parfois le jour.",
    learnset: [
      { level: 1, move: "dard" },
      { level: 1, move: "eclat" },
      { level: 2, move: "choc" },
      { level: 2, move: "cisailles" },
    ],
    render: {
      parts: { body: "beetle", head: "beetle", ears: "antenna", tail: "none", wings: "shell", pattern: "glow", extras: ["sparks"] },
      palette: pal("#C6D63A", "#6E8F16", "#F7F7C8", "#F6E34A", "#FFFDE0", "#243010", "#1A240C"),
    },
  },
  petaline: {
    id: "petaline",
    name: "Pétaline",
    types: ["plante", "fee"],
    role: "wild",
    baseStats: { hp: 46, atk: 40, def: 42, spa: 58, spd: 52, spe: 44 },
    catchRate: 140,
    baseExp: 58,
    genderRatio: [0.2, 0.6, 0.2],
    evolve: null,
    height: "0,4 m",
    weight: "3 kg",
    areas: ["Valclair", "Sentier des Roseaux"],
    description: "Une petite fleur qui marche. Son visage est au cœur des pétales.",
    learnset: [
      { level: 1, move: "claque" },
      { level: 1, move: "poussiere" },
      { level: 2, move: "seve" },
      { level: 2, move: "eclatTendre" },
    ],
    render: {
      parts: { body: "bloom", head: "bloom", ears: "petal", tail: "leaf", wings: "none", pattern: "none", extras: ["petals"] },
      palette: pal("#F2A3C7", "#3E9B62", "#FFF0F6", "#FFD1E4", "#FFFFFF", "#5A2040", "#3A1830"),
    },
  },
  rocadon: {
    id: "rocadon",
    name: "Rocadon",
    types: ["roche"],
    role: "wild",
    baseStats: { hp: 50, atk: 58, def: 72, spa: 30, spd: 42, spe: 24 },
    catchRate: 140,
    baseExp: 60,
    genderRatio: [0.5, 0.5, 0],
    evolve: null,
    height: "0,5 m",
    weight: "22 kg",
    areas: ["Sentier des Roseaux"],
    description: "Un chiot de pierre. Les cristaux sur son dos tintent quand il marche.",
    learnset: [
      { level: 1, move: "caillou" },
      { level: 1, move: "carapace" },
      { level: 2, move: "roulade" },
      { level: 2, move: "pietine" },
    ],
    render: {
      parts: { body: "golem", head: "golem", ears: "nub", tail: "pebble", wings: "none", pattern: "cracks", extras: ["crystal"] },
      palette: pal("#8E8E96", "#5C5C66", "#C8C8D0", "#6EC8D6", "#EEEFF4", "#2A2A32", "#1E1E24"),
    },
  },
  nebulette: {
    id: "nebulette",
    name: "Nébulette",
    types: ["spectre"],
    role: "wild",
    baseStats: { hp: 42, atk: 36, def: 36, spa: 62, spd: 48, spe: 58 },
    catchRate: 80,
    baseExp: 70,
    genderRatio: [0.3, 0.3, 0.4],
    evolve: null,
    height: "0,5 m",
    weight: "0,4 kg",
    areas: ["Sentier des Roseaux"],
    description: "Un chat de brume. On voit le décor à travers le bas de son corps.",
    learnset: [
      { level: 1, move: "ombre" },
      { level: 1, move: "regard" },
      { level: 2, move: "frisson" },
      { level: 2, move: "danse" },
    ],
    render: {
      parts: { body: "wisp", head: "wisp", ears: "pointed", tail: "wisp", wings: "none", pattern: "none", extras: ["mist"] },
      palette: pal("#C9B6E8", "#8E74C4", "#F4EEFF", "#EDE4FF", "#FFFFFF", "#3A2858", "#241838"),
    },
  },
  piquorin: {
    id: "piquorin",
    name: "Piquorin",
    types: ["poison"],
    role: "wild",
    baseStats: { hp: 44, atk: 52, def: 42, spa: 42, spd: 36, spe: 46 },
    catchRate: 190,
    baseExp: 52,
    genderRatio: [0.5, 0.45, 0.05],
    evolve: null,
    height: "0,3 m",
    weight: "4 kg",
    areas: ["Sentier des Roseaux"],
    description: "Une chenille ronde couverte de piquants. Ils piquent, mais son regard est doux.",
    learnset: [
      { level: 1, move: "amer" },
      { level: 1, move: "dard" },
      { level: 2, move: "nuage" },
      { level: 2, move: "cri" },
    ],
    render: {
      parts: { body: "grub", head: "grub", ears: "antenna", tail: "none", wings: "none", pattern: "stripes", extras: ["spikes"] },
      palette: pal("#7B5BD6", "#4A2E8C", "#D7C8F5", "#A6D94A", "#F3EEFF", "#241838", "#1A1028"),
    },
  },
};

export function getSpecies(id) {
  return SPECIES[id];
}

export function speciesList() {
  return SPECIES_ORDER.map((id) => SPECIES[id]);
}

export const STARTERS = ["solarix", "nimbleu", "verdelin"];
