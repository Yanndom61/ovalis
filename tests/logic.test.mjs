import test from "node:test";
import assert from "node:assert/strict";
import { effectiveness, TYPE_ORDER } from "../js/data/types.js";
import { SPECIES, SPECIES_ORDER, STARTERS } from "../js/data/creatures.js";
import { MOVES } from "../js/data/moves.js";
import { validateMaps } from "../js/data/maps.js";
import { createCreature, knownMoveIds, receiveCreature, freshState } from "../js/core/state.js";
import { calcDamage, captureCheck, xpFromFaint, xpToNext } from "../js/core/formulas.js";

test("les 18 types et le tableau classique", () => {
  assert.equal(TYPE_ORDER.length, 18);
  const pairs = [
    ["feu", "plante", 2], ["eau", "feu", 2], ["plante", "eau", 2],
    ["electrik", "sol", 0], ["normal", "spectre", 0], ["spectre", "normal", 0],
    ["combat", "spectre", 0], ["poison", "acier", 0], ["sol", "vol", 0],
    ["psy", "tenebres", 0], ["dragon", "fee", 0], ["fee", "dragon", 2],
    ["glace", "dragon", 2], ["insecte", "plante", 2], ["roche", "vol", 2],
    ["tenebres", "psy", 2], ["acier", "fee", 2], ["vol", "plante", 2],
  ];
  for (const [a, d, expected] of pairs) {
    assert.equal(effectiveness(a, [d]), expected, `${a} vs ${d}`);
  }
  assert.equal(effectiveness("feu", ["plante", "fee"]), 2);
  assert.equal(effectiveness("sol", ["insecte", "electrik"]), 1);
});

test("chaque créature a 4 attaques connues et des parties dessinables", () => {
  for (const id of SPECIES_ORDER) {
    const sp = SPECIES[id];
    assert.equal(sp.genderRatio.reduce((s, n) => s + n, 0), 1);
    for (const row of sp.learnset) assert.ok(MOVES[row.move], row.move);
    const moves = knownMoveIds(id, 5);
    assert.equal(moves.length, 4, id);
    assert.ok(sp.render.parts.body);
    assert.ok(sp.render.palette.main);
  }
  for (const id of STARTERS) assert.equal(SPECIES[id].role, "starter");
});

test("les cartes sont praticables", () => {
  assert.deepEqual(validateMaps(), []);
});

test("expérience, dégâts et capture", () => {
  assert.equal(xpToNext(5), 91);
  assert.ok(xpFromFaint(64, 5) > 0);
  const dmg = calcDamage({ level: 5, power: 40, atk: 14, def: 12, stab: true, eff: 2, random: 1 });
  assert.ok(dmg > 1);
  assert.equal(calcDamage({ level: 5, power: 40, atk: 14, def: 12, stab: true, eff: 0 }), 0);
  const sure = captureCheck({ maxHp: 20, hp: 1, catchRate: 255, rng: () => 0 });
  assert.equal(sure.ok, true);
  const hero = freshState({ name: "Léa", look: "fille", skin: 1, hairStyle: "court", hairColor: 1, eyeColor: 0 });
  const mon = createCreature("solarix", 5, { gender: "female" });
  assert.equal(mon.moves.length, 4);
  assert.equal(mon.gender, "female");
  receiveCreature(hero, mon);
  assert.equal(hero.party.length, 1);
  for (let i = 0; i < 6; i++) receiveCreature(hero, createCreature("grounin", 2));
  assert.equal(hero.party.length, 6);
  assert.equal(hero.boxes[0].creatures.length, 1);
});
