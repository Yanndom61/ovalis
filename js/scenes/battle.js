/** Combat au tour par tour : attaques, sac, équipe, fuite, capture. */

import { getSpecies } from "../data/creatures.js";
import { getMove, MOVES } from "../data/moves.js";
import { ITEMS } from "../data/items.js";
import { effectPhrase, effectiveness } from "../data/types.js";
import { calcDamage, captureCheck, fleeOdds, stageMultiplier, xpFromFaint, xpToNext } from "../core/formulas.js";
import { creatureName, receiveCreature, seeSpecies, statsOf, takeItem, countItem, movesAtLevel, GENDER_LABEL } from "../core/state.js";
import { drawCreature } from "../render/creature.js";
import { el, fitCanvas, hideToast, typePill, typeRow } from "../ui.js";

const STAT_FR = {
  atk: "attaque", def: "défense", spa: "attaque spéciale", spd: "défense spéciale", spe: "vitesse",
};
const CAT_FR = { physical: "Physique", special: "Spéciale", status: "Statut" };

function stages() {
  return { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
}

function wrap(creature) {
  return { ref: creature, stages: stages(), participated: false };
}

export async function runBattle(game, config) {
  const b = {
    game,
    kind: config.kind,
    trainer: config.trainer || null,
    mine: game.state.party.map(wrap),
    foes: config.foes.map(wrap),
    pi: game.state.party.findIndex((c) => c.currentHp > 0),
    fi: 0,
    time: 0,
    caught: false,
  };
  b.mine[b.pi].participated = true;
  for (const f of config.foes) seeSpecies(game.state, f.species);

  const root = el("div", "battle-ui");
  const field = el("div", "battle-field");
  b.foeCanvas = el("canvas", "battle-sprite foe");
  b.myCanvas = el("canvas", "battle-sprite mine");
  b.foePlate = el("div", "plate foe");
  b.myPlate = el("div", "plate mine");
  b.panel = el("div", "battle-panel");
  field.append(b.foeCanvas, b.myCanvas, b.foePlate, b.myPlate);
  root.append(field, b.panel);
  game.ui.append(root);
  hideToast();
  b.root = root;
  game.battle = b;
  game.mode = "battle";
  game.applyChrome();
  refresh(b);

  try {
    if (b.kind === "wild") {
      const sp = getSpecies(b.foes[0].ref.species);
      await game.say(null, `${sp.name} sauvage apparaît !`);
    } else {
      await game.say(null, `${b.trainer.name} veut se battre !`);
    }
    game.buzz([50, 40, 120]);

    while (true) {
      if (b.caught) return { result: "catch" };
      if (b.mine[b.pi].ref.currentHp <= 0) {
        const next = await pickSwitch(b, true);
        if (next == null) return { result: "lose" };
        b.pi = next;
        sendOut(b, b.pi);
        await game.say(null, `${creatureName(b.mine[b.pi].ref)}, à toi !`);
        refresh(b);
        continue;
      }
      if (b.foes[b.fi].ref.currentHp <= 0) {
        const nxt = b.foes.findIndex((f, i) => i > b.fi && f.ref.currentHp > 0);
        if (nxt < 0) {
          if (b.kind === "trainer") {
            await game.say(null, `${b.trainer.name} n'a plus de compagnon en forme.`);
            game.state.money += b.trainer.reward;
            game.state.flags.trainers[b.trainer.id] = true;
            await game.say(null, `Tu remportes ${b.trainer.reward} Lunes.`);
            game.audio.sfx("heal");
          }
          return { result: "win" };
        }
        b.fi = nxt;
        const foe = b.foes[b.fi].ref;
        await game.say(null, `${b.trainer.name} envoie ${creatureName(foe)} !`);
        refresh(b);
        continue;
      }

      const action = await playerCommand(b);
      if (action.type === "flee") {
        if (b.kind !== "wild") {
          await game.say(null, "On ne s'enfuit pas d'un combat de dresseur !");
          continue;
        }
        const me = statsOf(b.mine[b.pi].ref).spe;
        const them = statsOf(b.foes[b.fi].ref).spe;
        if (Math.random() < fleeOdds(me, them)) {
          await game.say(null, "Tu prends la fuite.");
          return { result: "flee" };
        }
        await game.say(null, "Impossible de fuir !");
        await enemyStrike(b);
        await statusPhase(b);
        continue;
      }
      if (action.type === "switch") {
        b.pi = action.index;
        sendOut(b, b.pi);
        await game.say(null, `${creatureName(b.mine[b.pi].ref)}, à toi !`);
        refresh(b);
        await enemyStrike(b);
        await statusPhase(b);
        continue;
      }
      if (action.type === "item") {
        const end = await useItem(b, action);
        if (end === "caught") return { result: "catch" };
        if (end === "used") {
          await enemyStrike(b);
          await statusPhase(b);
        }
        continue;
      }
      if (action.type === "move") {
        await bothStrike(b, action.move);
        await statusPhase(b);
      }
    }
  } finally {
    root.remove();
    game.battle = null;
    if (game.mode === "battle") game.mode = "world";
    game.applyChrome();
  }
}

function sendOut(b, index) {
  b.mine[index].participated = true;
  b.mine[index].stages = stages();
}

function player(b) { return b.mine[b.pi]; }
function foe(b) { return b.foes[b.fi]; }

function refresh(b) {
  fillPlate(b.myPlate, player(b).ref, true);
  fillPlate(b.foePlate, foe(b).ref, false);
}

function fillPlate(node, creature, mine) {
  const sp = getSpecies(creature.species);
  const stats = statsOf(creature);
  const shownHp = Math.min(creature.currentHp, stats.hp);
  const ratio = stats.hp ? shownHp / stats.hp : 0;
  node.replaceChildren();
  const head = el("div", "plate-head");
  head.append(el("strong", null, creatureName(creature)), el("span", "lv", `Niveau ${creature.level}`));
  node.append(head);
  const sub = el("div", "plate-sub");
  sub.append(el("span", "gender", GENDER_LABEL[creature.gender] || ""), typeRow(sp.types));
  node.append(sub);
  const hp = el("div", "hp");
  const fill = el("div", "hp-fill " + (ratio <= 0.2 ? "low" : ratio <= 0.5 ? "mid" : "ok"));
  fill.style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
  hp.append(fill);
  node.append(hp);
  node.append(el("div", "hp-num", `PV ${shownHp} / ${stats.hp}`));
  if (creature.status) {
    node.append(el("div", "status", creature.status === "burn" ? "Brûlure" : "Empoisonné"));
  }
  if (!mine && creature.currentHp <= 0) node.append(el("div", "status", "K.O."));
}

export function drawBattle(b, time) {
  if (!b?.root?.isConnected) return;
  const bob = Math.sin(time * 3) * 3;
  const open = (time % 4) < 0.12 ? 0.2 : 1;
  paintSprite(b.foeCanvas, foe(b).ref, -1, bob, open);
  paintSprite(b.myCanvas, player(b).ref, 1, -bob, open);
}

function paintSprite(canvas, creature, facing, bob, eyeOpen) {
  const { ctx, w, h } = fitCanvas(canvas);
  drawCreature(ctx, creature.species, {
    x: w / 2,
    y: h * 0.9,
    size: Math.min(w, h) * 0.92,
    gender: creature.gender,
    facing,
    bob,
    eyeOpen,
    fainted: creature.currentHp <= 0,
  });
}

async function playerCommand(b) {
  const game = b.game;
  while (true) {
    refresh(b);
    const cmd = await game.menu("Que faire ?", [
      { id: "fight", label: "Attaque" },
      { id: "bag", label: "Sac" },
      { id: "party", label: "Équipe" },
      { id: "run", label: "Fuite" },
    ], { cancel: false, host: b.panel, columns: 2 });
    if (cmd === "fight") {
      const move = await chooseMove(b);
      if (move) return { type: "move", move };
    } else if (cmd === "bag") {
      const action = await chooseBag(b);
      if (action) return action;
    } else if (cmd === "party") {
      const index = await pickSwitch(b, false);
      if (index != null) return { type: "switch", index };
    } else if (cmd === "run") {
      return { type: "flee" };
    }
  }
}

async function chooseMove(b) {
  const c = player(b).ref;
  if (c.moves.every((m) => m.pp <= 0)) {
    await b.game.say(null, `${creatureName(c)} n'a plus d'usages. Ultime effort !`);
    return "ultime";
  }
  const items = c.moves.map((m) => {
    const def = getMove(m.id);
    return {
      id: m.id,
      disabled: m.pp <= 0,
      fill(btn) {
        btn.append(el("span", "move-name", def.name));
        const meta = el("span", "move-meta");
        meta.append(typePill(def.type), el("span", null, `${CAT_FR[def.category]} · Usages ${m.pp}/${m.maxPp}`));
        btn.append(meta);
      },
    };
  });
  items.push({ id: "back", label: "Retour" });
  const pick = await b.game.menu("Choisis une attaque", items, { host: b.panel });
  if (!pick || pick === "back") return null;
  return pick;
}

async function chooseBag(b) {
  const game = b.game;
  const items = [];
  if (countItem(game.state, "goutte") > 0) {
    items.push({ id: "goutte", label: `Goutte vive × ${countItem(game.state, "goutte")}`, detail: ITEMS.goutte.desc });
  }
  if (countItem(game.state, "ovalune") > 0) {
    items.push({ id: "ovalune", label: `Ovalune × ${countItem(game.state, "ovalune")}`, detail: ITEMS.ovalune.desc });
  }
  if (!items.length) {
    await game.say(null, "Ton sac est vide.");
    return null;
  }
  items.push({ id: "back", label: "Retour" });
  const pick = await game.menu("Sac", items, { host: b.panel });
  if (!pick || pick === "back") return null;
  if (pick === "goutte") {
    const index = await pickSwitch(b, false, true);
    if (index == null) return null;
    return { type: "item", item: "goutte", index };
  }
  return { type: "item", item: "ovalune" };
}

async function pickSwitch(b, forced, forItem = false) {
  const party = b.game.state.party;
  if (forced && party.every((c) => c.currentHp <= 0)) return null;
  const items = party.map((c, i) => {
    const stats = statsOf(c);
    const here = i === b.pi && !forItem;
    return {
      id: String(i),
      disabled: forItem ? c.currentHp <= 0 : (c.currentHp <= 0 || here),
      label: `${creatureName(c)} · ${GENDER_LABEL[c.gender]} · Niveau ${c.level}`,
      detail: `PV ${c.currentHp}/${stats.hp}` + (c.currentHp <= 0 ? " · K.O." : here ? " · au combat" : ""),
    };
  });
  if (!forced) items.push({ id: "back", label: "Retour" });
  const title = forced ? "Choisis un compagnon" : forItem ? "Qui soigner ?" : "Équipe";
  while (true) {
    const pick = await b.game.menu(title, items, { cancel: !forced, host: b.panel });
    if (pick == null || pick === "back") return forced ? null : null;
    const index = Number(pick);
    if (forced && party[index].currentHp <= 0) continue;
    return index;
  }
}

async function useItem(b, action) {
  const game = b.game;
  if (action.item === "ovalune") {
    if (b.kind !== "wild") {
      await game.say(null, "On n'invite pas le compagnon d'un dresseur.");
      return "no";
    }
    if (!takeItem(game.state, "ovalune", 1)) {
      await game.say(null, "Tu n'as plus d'Ovalune.");
      return "no";
    }
    await game.say(null, "Tu lances une Ovalune !");
    await toss(b);
    const foeC = foe(b).ref;
    const sp = getSpecies(foeC.species);
    const check = captureCheck({
      maxHp: statsOf(foeC).hp,
      hp: foeC.currentHp,
      catchRate: sp.catchRate,
      ballMod: ITEMS.ovalune.ballMod,
      status: foeC.status,
    });
    await shakes(b, check.shakes);
    if (!check.ok) {
      await game.say(null, "Oh non ! Le compagnon s'est libéré.");
      return "used";
    }
    game.audio.sfx("catch");
    await game.say(null, `${sp.name} te rejoint !`);
    const nick = await game.askText("Un surnom ? Laisse vide pour garder le nom.", "");
    if (nick) foeC.nickname = nick;
    const place = receiveCreature(game.state, foeC);
    if (place.where === "boite") {
      await game.say(null, `Ton équipe est complète. ${creatureName(foeC)} va dans ${place.box}.`);
    }
    b.caught = true;
    return "caught";
  }
  const c = game.state.party[action.index];
  const max = statsOf(c).hp;
  if (c.currentHp <= 0) {
    await game.say(null, "Une Goutte vive ne suffit pas : ce compagnon est K.O.");
    return "no";
  }
  if (c.currentHp >= max) {
    await game.say(null, "Ses PV sont déjà au maximum.");
    return "no";
  }
  if (!takeItem(game.state, "goutte", 1)) return "no";
  c.currentHp = Math.min(max, c.currentHp + ITEMS.goutte.heal);
  game.audio.sfx("heal");
  refresh(b);
  await game.say(null, `${creatureName(c)} retrouve des forces.`);
  return "used";
}

function toss(b) {
  const ball = el("div", "ovalune-ball");
  b.root.querySelector(".battle-field").append(ball);
  return b.game.wait(0.75).then(() => ball.remove());
}

async function shakes(b, n) {
  const ball = el("div", "ovalune-ball stay");
  b.root.querySelector(".battle-field").append(ball);
  for (let i = 0; i < n; i++) {
    ball.classList.remove("shake");
    void ball.offsetWidth;
    ball.classList.add("shake");
    await b.game.wait(0.45);
  }
  ball.remove();
}

async function bothStrike(b, moveId) {
  const ai = chooseAi(b);
  const firstPlayer = speedOf(player(b)) > speedOf(foe(b))
    || (speedOf(player(b)) === speedOf(foe(b)) && Math.random() < 0.5);
  const order = firstPlayer ? ["player", "foe"] : ["foe", "player"];
  for (const who of order) {
    if (player(b).ref.currentHp <= 0 || foe(b).ref.currentHp <= 0) break;
    if (who === "player") await perform(b, player(b), foe(b), moveId, true);
    else await perform(b, foe(b), player(b), ai, false);
  }
}

async function enemyStrike(b) {
  if (player(b).ref.currentHp <= 0 || foe(b).ref.currentHp <= 0) return;
  await perform(b, foe(b), player(b), chooseAi(b), false);
}

function speedOf(wrap) {
  return Math.floor(statsOf(wrap.ref).spe * stageMultiplier(wrap.stages.spe));
}

function chooseAi(b) {
  const attacker = foe(b);
  const defender = player(b);
  const types = getSpecies(defender.ref.species).types;
  const usable = attacker.ref.moves.filter((m) => m.pp > 0);
  if (!usable.length) return "ultime";
  let best = usable[0];
  let bestScore = -999;
  for (const m of usable) {
    const def = getMove(m.id);
    const eff = def.power ? effectiveness(def.type, types) : 1;
    let score = (def.power || 28) * (eff === 0 ? 0 : eff);
    if (def.category === "status") score = 26;
    if (score > bestScore) { bestScore = score; best = m; }
  }
  const good = usable.filter((m) => {
    const def = getMove(m.id);
    return def.power > 0 && effectiveness(def.type, types) > 0;
  });
  if (Math.random() < 0.28 && good.length) return good[Math.floor(Math.random() * good.length)].id;
  return best.id;
}

async function perform(b, attacker, defender, moveId, attackerIsPlayer) {
  const move = getMove(moveId) || MOVES.ultime;
  const slot = attacker.ref.moves.find((m) => m.id === moveId);
  if (slot) slot.pp = Math.max(0, slot.pp - 1);
  const an = creatureName(attacker.ref);
  const dn = creatureName(defender.ref);
  await b.game.say(null, `${an} utilise ${move.name} !`);
  if (move.accuracy < 100 && Math.random() * 100 > move.accuracy) {
    b.game.audio.sfx("miss");
    await b.game.say(null, "L'attaque a raté !");
    return;
  }
  if (!move.power || move.category === "status") {
    await applyEffect(b, attacker, defender, move, true);
    return;
  }
  const aStats = statsOf(attacker.ref);
  const dStats = statsOf(defender.ref);
  const atkKey = move.category === "physical" ? "atk" : "spa";
  const defKey = move.category === "physical" ? "def" : "spd";
  const atk = Math.max(1, Math.floor(aStats[atkKey] * stageMultiplier(attacker.stages[atkKey])));
  const defn = Math.max(1, Math.floor(dStats[defKey] * stageMultiplier(defender.stages[defKey])));
  const dTypes = getSpecies(defender.ref.species).types;
  const eff = effectiveness(move.type, dTypes);
  const stab = getSpecies(attacker.ref.species).types.includes(move.type);
  const crit = eff > 0 && Math.random() < 1 / 16;
  const random = (85 + Math.floor(Math.random() * 16)) / 100;
  const burn = attacker.ref.status === "burn" && move.category === "physical";
  const dmg = eff === 0 ? 0 : calcDamage({
    level: attacker.ref.level, power: move.power, atk, def: defn, stab, eff, crit, burn, random,
  });
  defender.ref.currentHp = Math.max(0, defender.ref.currentHp - dmg);
  refresh(b);
  b.game.audio.sfx(eff > 1 ? "super" : "hit");
  if (crit) await b.game.say(null, "Coup critique !");
  const phrase = effectPhrase(eff);
  if (phrase) await b.game.say(null, phrase);
  if (move.effect && eff > 0 && defender.ref.currentHp > 0) await applyEffect(b, attacker, defender, move, false);
  if (move.recoil && dmg > 0 && attacker.ref.currentHp > 0) {
    const rec = Math.max(1, Math.floor(dmg * move.recoil));
    attacker.ref.currentHp = Math.max(0, attacker.ref.currentHp - rec);
    refresh(b);
    await b.game.say(null, `${an} se blesse en forçant.`);
  }
  if (defender.ref.currentHp <= 0) {
    b.game.audio.sfx("faint");
    await b.game.say(null, `${dn} est K.O. !`);
    if (attackerIsPlayer) await awardXp(b, defender.ref);
  }
}

async function applyEffect(b, attacker, defender, move, always) {
  const effect = move.effect;
  if (!effect) return;
  if (effect.chance != null && Math.random() >= effect.chance) return;
  if (effect.status) {
    const target = defender.ref;
    if (target.status) {
      await b.game.say(null, "Ça n'a pas marché.");
      return;
    }
    target.status = effect.status;
    refresh(b);
    const word = effect.status === "burn" ? "brûlé" : "empoisonné";
    await b.game.say(null, `${creatureName(target)} est ${word} !`);
    return;
  }
  if (effect.stat) {
    const target = effect.target === "self" ? attacker : defender;
    const before = target.stages[effect.stat];
    target.stages[effect.stat] = Math.max(-6, Math.min(6, before + effect.stages));
    const name = creatureName(target.ref);
    const label = STAT_FR[effect.stat];
    const article = label.startsWith("a") ? "L'" : "La ";
    if (target.stages[effect.stat] === before) {
      await b.game.say(null, `${article}${label} de ${name} ne peut pas changer davantage.`);
      return;
    }
    const verb = effect.stages > 0 ? "augmente" : "baisse";
    await b.game.say(null, `${article}${label} de ${name} ${verb} !`);
  }
  if (always && !effect.status && !effect.stat) {
    await b.game.say(null, "Rien ne se passe.");
  }
}

async function statusPhase(b) {
  for (const wrap of [foe(b), player(b)]) {
    if (wrap.ref.currentHp <= 0 || !wrap.ref.status) continue;
    const max = statsOf(wrap.ref).hp;
    const div = wrap.ref.status === "burn" ? 16 : 8;
    const dmg = Math.max(1, Math.floor(max / div));
    wrap.ref.currentHp = Math.max(0, wrap.ref.currentHp - dmg);
    refresh(b);
    const how = wrap.ref.status === "burn" ? "de sa brûlure" : "du poison";
    await b.game.say(null, `${creatureName(wrap.ref)} souffre ${how} !`);
    if (wrap.ref.currentHp <= 0) {
      b.game.audio.sfx("faint");
      await b.game.say(null, `${creatureName(wrap.ref)} est K.O. !`);
      if (wrap === foe(b)) await awardXp(b, wrap.ref);
    }
  }
}

async function awardXp(b, defeated) {
  const sp = getSpecies(defeated.species);
  const base = xpFromFaint(sp.baseExp, defeated.level);
  for (const c of b.game.state.party) {
    const mine = b.mine.find((w) => w.ref === c);
    const gain = mine?.participated ? base : Math.floor(base / 2);
    if (gain <= 0) continue;
    await gainXp(b, c, gain);
  }
}

async function gainXp(b, creature, gain) {
  creature.xp += gain;
  await b.game.say(null, `${creatureName(creature)} gagne ${gain} points d'expérience.`);
  while (creature.level < 100 && creature.xp >= xpToNext(creature.level)) {
    const before = statsOf(creature);
    creature.xp -= xpToNext(creature.level);
    creature.level += 1;
    const after = statsOf(creature);
    if (creature.currentHp > 0) {
      creature.currentHp = Math.min(after.hp, creature.currentHp + (after.hp - before.hp));
    }
    refresh(b);
    b.game.audio.sfx("ok");
    await b.game.say(null, `${creatureName(creature)} monte au niveau ${creature.level} !`);
    await b.game.say(null, `PV ${after.hp}, Attaque ${after.atk}, Défense ${after.def}.`);
    await b.game.say(null, `Attaque spéciale ${after.spa}, Défense spéciale ${after.spd}, Vitesse ${after.spe}.`);
    for (const id of movesAtLevel(creature.species, creature.level)) {
      await learnMove(b, creature, id);
    }
  }
}

async function learnMove(b, creature, moveId) {
  if (creature.moves.some((m) => m.id === moveId)) return;
  const move = getMove(moveId);
  if (creature.moves.length < 4) {
    creature.moves.push({ id: moveId, pp: move.pp, maxPp: move.pp });
    await b.game.say(null, `${creatureName(creature)} apprend ${move.name} !`);
    return;
  }
  await b.game.say(null, `${creatureName(creature)} veut apprendre ${move.name}.`);
  const items = creature.moves.map((m) => ({ id: m.id, label: `Oublier ${getMove(m.id).name}` }));
  items.push({ id: "non", label: "Ne pas apprendre" });
  const pick = await b.game.menu(`${move.name} — ${move.desc}`, items, { host: b.panel });
  if (!pick || pick === "non") {
    await b.game.say(null, `${creatureName(creature)} n'apprend pas ${move.name}.`);
    return;
  }
  const idx = creature.moves.findIndex((m) => m.id === pick);
  const old = getMove(pick).name;
  creature.moves[idx] = { id: moveId, pp: move.pp, maxPp: move.pp };
  await b.game.say(null, `${creatureName(creature)} oublie ${old} et apprend ${move.name}.`);
}

