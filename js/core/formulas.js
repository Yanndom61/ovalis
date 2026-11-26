/**
 * Formules de combat, d'expérience et de capture.
 * Elles restent pures (pas d'affichage) pour pouvoir les tester
 * et les réutiliser quand les fusions et les nouveaux objets arriveront.
 */

import { effectiveness } from "../data/types.js";

export function stageMultiplier(stage) {
  const s = Math.max(-6, Math.min(6, stage | 0));
  if (s >= 0) return (2 + s) / 2;
  return 2 / (2 - s);
}

export function calcStats(base, level, iv = {}) {
  const hp = Math.floor(((2 * base.hp + (iv.hp || 0)) * level) / 100) + level + 10;
  const one = (k) => Math.floor(((2 * base[k] + (iv[k] || 0)) * level) / 100) + 5;
  return {
    hp,
    atk: one("atk"),
    def: one("def"),
    spa: one("spa"),
    spd: one("spd"),
    spe: one("spe"),
  };
}

/** Expérience encore nécessaire pour passer au niveau suivant (courbe moyenne). */
export function xpToNext(level) {
  return 3 * level * level + 3 * level + 1;
}

export function xpFromFaint(baseExp, enemyLevel) {
  return Math.max(1, Math.floor((baseExp * enemyLevel) / 7));
}

/**
 * Dégâts d'une attaque.
 * random : 0.85 à 1. burn : true si l'attaquant est brûlé et que l'attaque est physique.
 */
export function calcDamage({ level, power, atk, def, stab, eff, crit = false, burn = false, random = 1 }) {
  if (!power || eff === 0) return 0;
  const safeDef = Math.max(1, def);
  let dmg = Math.floor(Math.floor(Math.floor((2 * level) / 5 + 2) * power * atk / safeDef) / 50) + 2;
  if (stab) dmg = Math.floor(dmg * 1.5);
  dmg = Math.floor(dmg * eff);
  if (crit) dmg = Math.floor(dmg * 1.5);
  if (burn) dmg = Math.floor(dmg * 0.5);
  dmg = Math.floor(dmg * random);
  return Math.max(1, dmg);
}

export function typeMultiplier(moveType, defendTypes) {
  return effectiveness(moveType, defendTypes);
}

/**
 * Quatre « secousses ». Réussite si les quatre passent.
 * Plus les PV sont bas, plus c'est facile. catchRate façon classique (3 à 255).
 */
export function captureCheck({ maxHp, hp, catchRate, ballMod = 1, status = null, rng = Math.random }) {
  const statusBonus = status === "sleep" || status === "freeze" ? 2 : status ? 1.5 : 1;
  const a = ((3 * maxHp - 2 * Math.max(0, hp)) * catchRate * ballMod * statusBonus) / (3 * Math.max(1, maxHp));
  if (a >= 255) return { ok: true, shakes: 4 };
  const p = Math.max(0, Math.min(1, a / 255));
  const shakeP = Math.pow(p, 0.25);
  let shakes = 0;
  for (let i = 0; i < 4; i++) {
    if (rng() < shakeP) shakes += 1;
    else break;
  }
  return { ok: shakes === 4, shakes };
}

export function fleeOdds(mySpeed, theirSpeed) {
  const b = Math.max(1, theirSpeed);
  return Math.max(0.25, Math.min(0.95, 0.35 + (mySpeed / b) * 0.35));
}
