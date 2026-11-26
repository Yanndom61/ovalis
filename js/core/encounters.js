/** Tirage des compagnons sauvages, à partir de la table de la carte. */

import { createCreature } from "./state.js";
import { randInt } from "./util.js";

export function rollEncounterTable(table) {
  const total = table.reduce((sum, row) => sum + row.weight, 0);
  let roll = Math.random() * total;
  let pick = table[0];
  for (const row of table) {
    roll -= row.weight;
    if (roll <= 0) {
      pick = row;
      break;
    }
  }
  return createCreature(pick.species, randInt(pick.min, pick.max));
}
