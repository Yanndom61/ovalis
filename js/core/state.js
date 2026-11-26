/** État d'une partie : héros, équipe, boîtes, sac. Les créatures sont des données, pas des classes. */

import { getSpecies } from "../data/creatures.js";
import { getMove } from "../data/moves.js";
import { calcStats } from "./formulas.js";
import { randInt, uid } from "./util.js";

export const SKINS = ["#F8D3B0", "#E8B48A", "#C68642", "#A86B3C", "#6B3E26", "#3F2918"];
export const HAIRS = ["#1C1C1C", "#4A3428", "#8D5A2B", "#E0B15A", "#F0D7A0", "#C4473A", "#6C4C9A", "#E8E8EA"];
export const EYES = ["#2F5F8A", "#2F7D4A", "#6A4424", "#7E8794", "#6A3E96", "#1A1A1A"];

export const LOOKS = [
  { id: "garcon", label: "Garçon", outfit: "tunic" },
  { id: "fille", label: "Fille", outfit: "jupe" },
  { id: "autre", label: "Autre", outfit: "cape" },
];
export const HAIR_STYLES = [
  { id: "court", label: "Courts" },
  { id: "moyen", label: "Mi-longs" },
  { id: "long", label: "Longs" },
  { id: "boucle", label: "Bouclés" },
];

export const GENDER_LABEL = {
  male: "Mâle",
  female: "Femelle",
  herm: "Hermaphrodite",
};

export const STAT_LABEL = {
  hp: "PV",
  atk: "Attaque",
  def: "Défense",
  spa: "Attaque spéciale",
  spd: "Défense spéciale",
  spe: "Vitesse",
};

export function defaultSettings() {
  return {
    textSize: "grand",
    textSpeed: "normal",
    sound: true,
    vibration: true,
    colorblind: true,
  };
}

export function rollGender(ratio) {
  const r = Math.random();
  if (r < ratio[0]) return "male";
  if (r < ratio[0] + ratio[1]) return "female";
  return "herm";
}

function rollIvs() {
  const iv = {};
  for (const k of ["hp", "atk", "def", "spa", "spd", "spe"]) iv[k] = randInt(0, 31);
  return iv;
}

export function statsOf(creature) {
  const sp = getSpecies(creature.species);
  return calcStats(sp.baseStats, creature.level, creature.iv);
}

export function creatureName(creature) {
  if (!creature) return "";
  return creature.nickname || getSpecies(creature.species).name;
}

export function knownMoveIds(speciesId, level) {
  const sp = getSpecies(speciesId);
  const ids = [];
  for (const row of sp.learnset) {
    if (row.level <= level && !ids.includes(row.move)) ids.push(row.move);
  }
  return ids.slice(-4);
}

export function createCreature(speciesId, level, opts = {}) {
  const sp = getSpecies(speciesId);
  const gender = opts.gender || rollGender(sp.genderRatio);
  const iv = opts.iv || rollIvs();
  const moves = knownMoveIds(speciesId, level).map((id) => {
    const def = getMove(id);
    return { id, pp: def.pp, maxPp: def.pp };
  });
  const stats = calcStats(sp.baseStats, level, iv);
  return {
    uid: opts.uid || uid(),
    species: speciesId,
    nickname: opts.nickname || null,
    level,
    xp: 0,
    gender,
    iv,
    ev: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    nature: "neutre",
    moves,
    currentHp: stats.hp,
    status: null,
    heldItem: null,
    fusion: null,
    egg: null,
  };
}

export function healCreature(creature) {
  const stats = statsOf(creature);
  creature.currentHp = stats.hp;
  creature.status = null;
  for (const m of creature.moves) {
    const def = getMove(m.id);
    m.maxPp = m.maxPp || def.pp;
    m.pp = m.maxPp;
  }
}

export function healParty(state) {
  for (const c of state.party) healCreature(c);
}

export function seeSpecies(state, id) {
  state.dex.seen[id] = true;
}

export function markCaught(state, id) {
  state.dex.seen[id] = true;
  state.dex.caught[id] = true;
}

/** Met le compagnon dans l'équipe, ou dans une boîte s'il n'y a plus de place. */
export function receiveCreature(state, creature) {
  markCaught(state, creature.species);
  if (state.party.length < 6) {
    state.party.push(creature);
    return { where: "equipe" };
  }
  let box = state.boxes[state.boxes.length - 1];
  if (!box || box.creatures.length >= 30) {
    box = { name: `Boîte ${state.boxes.length + 1}`, creatures: [] };
    state.boxes.push(box);
  }
  box.creatures.push(creature);
  return { where: "boite", box: box.name };
}

export function giveItem(state, itemId, count = 1) {
  state.bag[itemId] = (state.bag[itemId] || 0) + count;
}

export function countItem(state, itemId) {
  return state.bag[itemId] || 0;
}

export function takeItem(state, itemId, count = 1) {
  const have = countItem(state, itemId);
  if (have < count) return false;
  const left = have - count;
  if (left <= 0) delete state.bag[itemId];
  else state.bag[itemId] = left;
  return true;
}

export function heroAppearance(hero, dir = "down") {
  const look = LOOKS.find((l) => l.id === hero.look) || LOOKS[0];
  return {
    look: look.id,
    outfit: hero.outfit || look.outfit,
    hairStyle: hero.hairStyle || "court",
    hair: HAIRS[hero.hairColor] || hero.hair || HAIRS[0],
    skin: SKINS[hero.skin] || hero.skin || SKINS[1],
    eyes: EYES[hero.eyeColor] || hero.eyes || EYES[0],
    dir,
  };
}

export function freshState(hero, settings) {
  return {
    v: 1,
    hero: {
      name: hero.name,
      look: hero.look,
      skin: hero.skin,
      hairStyle: hero.hairStyle,
      hairColor: hero.hairColor,
      eyeColor: hero.eyeColor,
    },
    party: [],
    boxes: [{ name: "Boîte 1", creatures: [] }],
    bag: {},
    money: 0,
    flags: {
      introDone: false,
      gotStarter: null,
      camilleGift: false,
      trainers: {},
    },
    dex: { seen: {}, caught: {} },
    pos: { map: "lab", x: 7, y: 7, dir: "up" },
    playMs: 0,
    settings: { ...defaultSettings(), ...(settings || {}) },
  };
}

export function movesAtLevel(speciesId, level) {
  return getSpecies(speciesId).learnset.filter((row) => row.level === level).map((row) => row.move);
}
