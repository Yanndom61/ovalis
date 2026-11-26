/**
 * Les 18 types classiques, noms en français.
 * Le tableau des forces est celui habituel (avec la Fée).
 * Une case absente vaut ×1. 0 = aucun effet.
 *
 * Les formes et les motifs servent aux joueurs qui distinguent mal les couleurs :
 * la couleur n'est jamais la seule information.
 */

export const TYPE_ORDER = [
  "normal", "feu", "eau", "plante", "electrik", "glace",
  "combat", "poison", "sol", "vol", "psy", "insecte",
  "roche", "spectre", "dragon", "tenebres", "acier", "fee",
];

export const TYPES = {
  normal:   { id: "normal",   name: "Normal",   color: "#8A8A5C", text: "#fffaf0", shape: "rond",     pattern: "uni" },
  feu:      { id: "feu",      name: "Feu",      color: "#E86A17", text: "#1a1208", shape: "triangle", pattern: "bandes" },
  eau:      { id: "eau",      name: "Eau",      color: "#2F6FD0", text: "#fffaf0", shape: "goutte",   pattern: "vagues" },
  plante:   { id: "plante",   name: "Plante",   color: "#3E9A3A", text: "#fffaf0", shape: "feuille",  pattern: "points" },
  electrik: { id: "electrik", name: "Électrik", color: "#E2B400", text: "#1a1208", shape: "eclair",   pattern: "bandes" },
  glace:    { id: "glace",    name: "Glace",    color: "#5BB8C4", text: "#1a1208", shape: "losange",  pattern: "uni" },
  combat:   { id: "combat",   name: "Combat",   color: "#C0392B", text: "#fffaf0", shape: "poing",    pattern: "bandes" },
  poison:   { id: "poison",   name: "Poison",   color: "#8E3A9B", text: "#fffaf0", shape: "bulle",    pattern: "points" },
  sol:      { id: "sol",      name: "Sol",      color: "#C4963A", text: "#1a1208", shape: "carre",    pattern: "points" },
  vol:      { id: "vol",      name: "Vol",      color: "#7B6AD6", text: "#fffaf0", shape: "aile",     pattern: "vagues" },
  psy:      { id: "psy",      name: "Psy",      color: "#E24B86", text: "#fffaf0", shape: "oeil",     pattern: "uni" },
  insecte:  { id: "insecte",  name: "Insecte",  color: "#7A8F14", text: "#fffaf0", shape: "hex",      pattern: "points" },
  roche:    { id: "roche",    name: "Roche",    color: "#8A7530", text: "#fffaf0", shape: "roche",    pattern: "bandes" },
  spectre:  { id: "spectre",  name: "Spectre",  color: "#5C4A86", text: "#fffaf0", shape: "flamme",   pattern: "vagues" },
  dragon:   { id: "dragon",   name: "Dragon",   color: "#5B2ED0", text: "#fffaf0", shape: "croc",     pattern: "bandes" },
  tenebres: { id: "tenebres", name: "Ténèbres", color: "#4E3B32", text: "#fffaf0", shape: "lune",     pattern: "uni" },
  acier:    { id: "acier",    name: "Acier",    color: "#6E7890", text: "#fffaf0", shape: "ecu",      pattern: "bandes" },
  fee:      { id: "fee",      name: "Fée",      color: "#D56AA2", text: "#1a1208", shape: "etoile",   pattern: "points" },
};

/** attackType -> defendType -> multiplicateur (seulement si différent de 1). */
export const CHART = {
  normal:   { roche: 0.5, spectre: 0, acier: 0.5 },
  feu:      { insecte: 2, acier: 2, plante: 2, glace: 2, feu: 0.5, eau: 0.5, roche: 0.5, dragon: 0.5 },
  eau:      { feu: 2, sol: 2, roche: 2, eau: 0.5, plante: 0.5, dragon: 0.5 },
  plante:   { eau: 2, sol: 2, roche: 2, feu: 0.5, plante: 0.5, poison: 0.5, vol: 0.5, insecte: 0.5, dragon: 0.5, acier: 0.5 },
  electrik: { eau: 2, vol: 2, plante: 0.5, electrik: 0.5, dragon: 0.5, sol: 0 },
  glace:    { plante: 2, sol: 2, vol: 2, dragon: 2, feu: 0.5, eau: 0.5, glace: 0.5, acier: 0.5 },
  combat:   { normal: 2, glace: 2, roche: 2, tenebres: 2, acier: 2, poison: 0.5, vol: 0.5, psy: 0.5, insecte: 0.5, fee: 0.5, spectre: 0 },
  poison:   { plante: 2, fee: 2, poison: 0.5, sol: 0.5, roche: 0.5, spectre: 0.5, acier: 0 },
  sol:      { feu: 2, electrik: 2, poison: 2, roche: 2, acier: 2, plante: 0.5, insecte: 0.5, vol: 0 },
  vol:      { plante: 2, combat: 2, insecte: 2, electrik: 0.5, roche: 0.5, acier: 0.5 },
  psy:      { combat: 2, poison: 2, psy: 0.5, acier: 0.5, tenebres: 0 },
  insecte:  { plante: 2, psy: 2, tenebres: 2, feu: 0.5, combat: 0.5, poison: 0.5, vol: 0.5, spectre: 0.5, acier: 0.5, fee: 0.5 },
  roche:    { feu: 2, glace: 2, vol: 2, insecte: 2, combat: 0.5, sol: 0.5, acier: 0.5 },
  spectre:  { psy: 2, spectre: 2, tenebres: 0.5, normal: 0 },
  dragon:   { dragon: 2, acier: 0.5, fee: 0 },
  tenebres: { psy: 2, spectre: 2, combat: 0.5, tenebres: 0.5, fee: 0.5 },
  acier:    { glace: 2, roche: 2, fee: 2, feu: 0.5, eau: 0.5, electrik: 0.5, acier: 0.5 },
  fee:      { combat: 2, dragon: 2, tenebres: 2, feu: 0.5, poison: 0.5, acier: 0.5 },
};

export function getType(id) {
  return TYPES[id];
}

/** Multiplicateur final d'une attaque contre un ou deux types. */
export function effectiveness(attackType, defendTypes) {
  const row = CHART[attackType] || {};
  let m = 1;
  for (const d of defendTypes) {
    if (row[d] !== undefined) m *= row[d];
  }
  return m;
}

export function effectPhrase(mult) {
  if (mult === 0) return "Ça n'a aucun effet…";
  if (mult < 1) return "Ce n'est pas très efficace…";
  if (mult > 2) return "C'est extrêmement efficace !";
  if (mult > 1) return "C'est super efficace !";
  return null;
}
