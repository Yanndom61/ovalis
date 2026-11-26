/** Écrans : titre, création du héros, menus, sac, boîtes, bestiaire. */

import { STARTERS, getSpecies, speciesList } from "../data/creatures.js";
import { ITEMS, SHOP_STOCK } from "../data/items.js";
import { getMove } from "../data/moves.js";
import { drawCreature } from "../render/creature.js";
import { drawPerson } from "../render/actors.js";
import { el, hideToast, typeRow, cleanName } from "../ui.js";
import {
  GENDER_LABEL, HAIR_STYLES, LOOKS, SKINS, HAIRS, EYES,
  creatureName, giveItem, healParty, heroAppearance, statsOf, countItem, takeItem,
} from "../core/state.js";
import { xpToNext } from "../core/formulas.js";
import { exportSave, loadSave, pickSaveFile, writeSave, SAVE_KEY } from "../core/save.js";
import { getMap } from "../data/maps.js";

const TEXT_SIZES = ["normal", "grand", "tres"];
const TEXT_LABEL = { normal: "Normale", grand: "Grande", tres: "Très grande" };
const SPEEDS = ["lent", "normal", "rapide", "instant"];
const SPEED_LABEL = { lent: "Lente", normal: "Normale", rapide: "Rapide", instant: "Instantanée" };

export function showTitle(game) {
  return new Promise((resolve) => {
    const save = loadSave();
    const root = el("div", "screen title-screen");
    const box = el("div", "title-box");
    box.append(el("p", "eyebrow", "Le continent des compagnons"));
    box.append(el("h1", "logo", "Ovalis"));
    box.append(el("p", "lead", "Tu te fais des amis créatures, et tu pars à l'aventure."));
    const list = el("div", "menu-list");
    const add = (label, id, disabled, detail) => {
      const btn = el("button", "choice", label);
      btn.type = "button";
      if (detail) btn.append(el("span", "detail", detail));
      btn.disabled = !!disabled;
      btn.addEventListener("click", () => { root.remove(); resolve(id); });
      list.append(btn);
    };
    add("Nouvelle partie", "new", false, null);
    add("Continuer", "continue", !save, save ? `${save.hero.name} — ${placeName(save.pos.map)}` : "Pas encore de partie");
    const settings = el("button", "choice", "Réglages");
    settings.type = "button";
    settings.addEventListener("click", () => openSettings(game));
    list.append(settings);
    box.append(list);
    const help = el("p", "help");
    help.append("Pouce gauche : marcher. A confirme. B ouvre le menu.");
    box.append(help);
    root.append(box);
    game.ui.append(root);
  });
}

function placeName(id) {
  return getMap(id)?.name || "Valclair";
}

export function showCreate(game) {
  return new Promise((resolve) => {
    const hero = { name: "", look: "autre", skin: 1, hairStyle: "court", hairColor: 1, eyeColor: 0 };
    const root = el("div", "screen create-screen");
    const preview = el("canvas", "preview");
    const stage = el("div", "panel create-stage");
    root.append(preview, stage);
    game.ui.append(root);
    const stop = game.watch(preview, (ctx, w, h, time) => {
      const look = heroAppearance(hero, "down");
      look.frame = time * 2;
      drawPerson(ctx, look, w / 2, h * 0.86, Math.min(w, h) / 70);
    });
    let step = 0;
    const renderers = [stepName, stepLook, stepBody, stepColors, stepDone];

    function cleanup(value) {
      stop();
      root.remove();
      resolve(value);
    }
    function show() {
      stage.replaceChildren();
      stage.append(el("p", "step", `Étape ${step + 1} sur ${renderers.length}`));
      renderers[step]();
    }
    function back() {
      if (step === 0) cleanup(null);
      else { step -= 1; show(); }
    }
    function next() {
      step += 1;
      show();
    }

    function stepName() {
      stage.append(el("h2", null, "Comment tu t'appelles ?"));
      const input = el("input");
      input.maxLength = 12;
      input.autocomplete = "off";
      input.placeholder = "Ton prénom";
      input.value = hero.name;
      input.addEventListener("input", () => { hero.name = input.value; });
      stage.append(input);
      stage.append(el("p", "help", "Douze lettres maximum. Les accents sont les bienvenus."));
      const row = el("div", "row-actions");
      const cancel = el("button", "choice", "Retour");
      cancel.type = "button";
      cancel.addEventListener("click", back);
      const ok = el("button", "choice primary", "Continuer");
      ok.type = "button";
      ok.addEventListener("click", () => {
        const name = cleanName(input.value);
        if (!name) {
          game.toast("Écris un prénom, avec des lettres.");
          input.focus();
          return;
        }
        hero.name = name;
        next();
      });
      row.append(cancel, ok);
      stage.append(row);
      setTimeout(() => input.focus(), 50);
    }

    function stepLook() {
      stage.append(el("h2", null, "Quelle allure ?"));
      const list = el("div", "menu-list");
      for (const look of LOOKS) {
        const btn = el("button", "choice" + (hero.look === look.id ? " is-focus" : ""), look.label);
        btn.type = "button";
        btn.addEventListener("click", () => { hero.look = look.id; next(); });
        list.append(btn);
      }
      stage.append(list, backBtn());
    }

    function stepBody() {
      stage.append(el("h2", null, "Peau et coiffure"));
      stage.append(el("p", "help", "Couleur de peau"));
      stage.append(swatches(SKINS, hero.skin, (i) => { hero.skin = i; show(); }));
      stage.append(el("p", "help", "Coiffure"));
      const list = el("div", "menu-list cols-2");
      for (const style of HAIR_STYLES) {
        const btn = el("button", "choice" + (hero.hairStyle === style.id ? " is-focus" : ""), style.label);
        btn.type = "button";
        btn.addEventListener("click", () => { hero.hairStyle = style.id; show(); });
        list.append(btn);
      }
      stage.append(list);
      const row = el("div", "row-actions");
      const ok = el("button", "choice primary", "Continuer");
      ok.type = "button";
      ok.addEventListener("click", next);
      row.append(backBtn(), ok);
      stage.append(row);
    }

    function stepColors() {
      stage.append(el("h2", null, "Cheveux et yeux"));
      stage.append(el("p", "help", "Couleur des cheveux"));
      stage.append(swatches(HAIRS, hero.hairColor, (i) => { hero.hairColor = i; show(); }));
      stage.append(el("p", "help", "Couleur des yeux"));
      stage.append(swatches(EYES, hero.eyeColor, (i) => { hero.eyeColor = i; show(); }));
      const row = el("div", "row-actions");
      const ok = el("button", "choice primary", "Continuer");
      ok.type = "button";
      ok.addEventListener("click", next);
      row.append(backBtn(), ok);
      stage.append(row);
    }

    function stepDone() {
      const look = LOOKS.find((l) => l.id === hero.look);
      stage.append(el("h2", null, `C'est bien toi, ${hero.name} ?`));
      stage.append(el("p", null, `${look.label}, cheveux ${HAIR_STYLES.find((s) => s.id === hero.hairStyle).label.toLowerCase()}.`));
      const row = el("div", "row-actions");
      const edit = el("button", "choice", "Modifier");
      edit.type = "button";
      edit.addEventListener("click", () => { step = 0; show(); });
      const ok = el("button", "choice primary", "C'est parti");
      ok.type = "button";
      ok.addEventListener("click", () => cleanup(hero));
      row.append(edit, ok);
      stage.append(row);
    }

    function backBtn() {
      const btn = el("button", "choice", "Retour");
      btn.type = "button";
      btn.addEventListener("click", back);
      return btn;
    }
    show();
  });
}

function swatches(colors, selected, onPick) {
  const row = el("div", "swatches");
  colors.forEach((color, i) => {
    const btn = el("button", "swatch" + (i === selected ? " is-focus" : ""));
    btn.type = "button";
    btn.style.background = color;
    btn.setAttribute("aria-label", `Couleur ${i + 1}`);
    btn.addEventListener("click", () => onPick(i));
    row.append(btn);
  });
  return row;
}

export function chooseStarter(game) {
  return new Promise((resolve) => {
    hideToast();
    const root = el("div", "screen");
    const box = el("div", "panel starter-wrap");
    box.append(el("h2", null, "Choisis ton compagnon"));
    box.append(el("p", "help", "Il grandira avec toi. Les deux autres, tu pourras les rencontrer plus tard."));
    const row = el("div", "starter-row");
    const stops = [];
    for (const id of STARTERS) {
      const sp = getSpecies(id);
      const card = el("button", "starter-card");
      card.type = "button";
      const canvas = el("canvas", "starter-canvas");
      const title = el("strong", null, sp.name);
      const short = sp.description.split(". ")[0] + ".";
      card.append(canvas, title, typeRow(sp.types), el("span", "detail", short));
      card.addEventListener("click", async () => {
        const yes = await game.menu(`Choisir ${sp.name} ?`, [
          { id: "oui", label: `Oui, ${sp.name}` },
          { id: "non", label: "Je regarde encore" },
        ]);
        if (yes === "oui") {
          stops.forEach((fn) => fn());
          root.remove();
          resolve(id);
        }
      });
      row.append(card);
      stops.push(game.watch(canvas, (ctx, w, h, time) => {
        drawCreature(ctx, id, {
          x: w / 2,
          y: h * 0.9,
          size: Math.min(w, h) * 0.95,
          gender: id === "verdelin" ? "herm" : id === "nimbleu" ? "male" : "female",
          bob: Math.sin(time * 3 + id.length) * 3,
          eyeOpen: (time % 3.8) < 0.12 ? 0.2 : 1,
        });
      }));
    }
    box.append(row);
    root.append(box);
    game.ui.append(root);
  });
}

export async function openPause(game) {
  const pick = await game.menu("Menu", [
    { id: "party", label: "Équipe" },
    { id: "bag", label: "Sac" },
    { id: "dex", label: "Bestiaire" },
    { id: "card", label: "Carte de dresseur" },
    { id: "settings", label: "Réglages" },
    { id: "save", label: "Enregistrer maintenant" },
    { id: "title", label: "Retour à l'écran titre" },
    { id: "close", label: "Fermer" },
  ]);
  if (pick === "party") await openParty(game);
  else if (pick === "bag") await openBag(game);
  else if (pick === "dex") await openDex(game);
  else if (pick === "card") await openCard(game);
  else if (pick === "settings") await openSettings(game);
  else if (pick === "save") {
    game.save();
    await game.say(null, "C'est enregistré sur cet appareil.");
  } else if (pick === "title") {
    game.exitToTitle();
  }
}

export async function openParty(game) {
  while (true) {
    const party = game.state.party;
    if (!party.length) {
      await game.say(null, "Tu n'as pas encore de compagnon.");
      return;
    }
    const items = party.map((c, i) => {
      const st = statsOf(c);
      return {
        id: String(i),
        label: `${creatureName(c)} · ${GENDER_LABEL[c.gender]} · Niveau ${c.level}`,
        detail: `PV ${c.currentHp}/${st.hp}` + (c.currentHp <= 0 ? " · K.O." : ""),
      };
    });
    items.push({ id: "close", label: "Fermer" });
    const pick = await game.menu("Équipe", items);
    if (pick == null || pick === "close") return;
    const index = Number(pick);
    const action = await game.menu(creatureName(party[index]), [
      { id: "info", label: "Résumé" },
      { id: "up", label: "Monter dans l'équipe", disabled: index === 0 },
      { id: "down", label: "Descendre dans l'équipe", disabled: index === party.length - 1 },
      { id: "close", label: "Retour" },
    ]);
    if (action === "info") await openSummary(game, party[index]);
    else if (action === "up") swap(party, index, index - 1);
    else if (action === "down") swap(party, index, index + 1);
    if (action === "up" || action === "down") game.save();
  }
}

function swap(list, a, b) {
  const tmp = list[a];
  list[a] = list[b];
  list[b] = tmp;
}

export function openSummary(game, creature) {
  return new Promise((resolve) => {
    const sp = getSpecies(creature.species);
    const stats = statsOf(creature);
    const root = el("div", "screen");
    const panel = el("div", "panel summary");
    const canvas = el("canvas", "summary-canvas");
    const text = el("div", "summary-text");
    text.append(el("h2", null, creatureName(creature)));
    text.append(el("p", null, `${GENDER_LABEL[creature.gender]} · Niveau ${creature.level}`));
    text.append(typeRow(sp.types));
    text.append(el("p", null, sp.description));
    const need = xpToNext(creature.level);
    text.append(el("p", null, creature.level >= 100
      ? "Niveau maximum pour l'instant."
      : `Expérience : ${creature.xp} / ${need}`));
    const bars = el("ul", "stat-list");
    const rows = [
      ["PV", `${creature.currentHp} / ${stats.hp}`],
      ["Attaque", stats.atk],
      ["Défense", stats.def],
      ["Attaque spéciale", stats.spa],
      ["Défense spéciale", stats.spd],
      ["Vitesse", stats.spe],
    ];
    for (const [k, v] of rows) {
      const li = el("li");
      li.append(el("span", null, k), el("strong", null, String(v)));
      bars.append(li);
    }
    text.append(bars);
    text.append(el("h3", null, "Attaques"));
    for (const m of creature.moves) {
      const mv = getMove(m.id);
      const line = el("p", "move-line");
      line.append(typeRow([mv.type]), document.createTextNode(` ${mv.name} · Usages ${m.pp}/${m.maxPp}`));
      text.append(line, el("p", "help", mv.desc));
    }
    if (creature.status) {
      text.append(el("p", null, creature.status === "burn" ? "Brûlure en cours." : "Empoisonné."));
    }
    const close = el("button", "choice primary", "Fermer");
    close.type = "button";
    close.addEventListener("click", finish);
    text.append(close);
    panel.append(canvas, text);
    root.append(panel);
    game.ui.append(root);
    const stop = game.watch(canvas, (ctx, w, h, time) => {
      drawCreature(ctx, creature.species, {
        x: w / 2, y: h * 0.88, size: Math.min(w, h) * 0.9,
        gender: creature.gender,
        bob: Math.sin(time * 3) * 3,
        eyeOpen: (time % 4) < 0.12 ? 0.2 : 1,
        fainted: creature.currentHp <= 0,
      });
    });
    const modal = { handle(input) { if (input.justB || input.justA) finish(); } };
    game.pushModal(modal);
    function finish() {
      game.removeModal(modal);
      stop();
      root.remove();
      resolve();
    }
  });
}

export async function openBag(game) {
  while (true) {
    const ids = Object.keys(game.state.bag).filter((id) => game.state.bag[id] > 0 && ITEMS[id]);
    if (!ids.length) {
      await game.say(null, "Ton sac est vide.");
      return;
    }
    const items = ids.map((id) => ({
      id,
      label: `${ITEMS[id].name} × ${countItem(game.state, id)}`,
      detail: ITEMS[id].desc,
    }));
    items.push({ id: "close", label: "Fermer" });
    const pick = await game.menu("Sac", items);
    if (!pick || pick === "close") return;
    const item = ITEMS[pick];
    if (item.kind === "capture") {
      await game.say(null, "L'Ovalune s'utilise pendant un combat, face à un compagnon sauvage.");
    } else if (item.kind === "heal") {
      const index = await choosePartyMember(game, "Qui soigner ?");
      if (index == null) continue;
      const c = game.state.party[index];
      const max = statsOf(c).hp;
      if (c.currentHp <= 0) {
        await game.say(null, "Une Goutte vive ne suffit pas : ce compagnon est K.O. Le Relais Vital peut le soigner.");
        continue;
      }
      if (c.currentHp >= max) {
        await game.say(null, "Ses PV sont déjà au maximum.");
        continue;
      }
      takeItem(game.state, pick, 1);
      c.currentHp = Math.min(max, c.currentHp + item.heal);
      game.audio.sfx("heal");
      game.save();
      await game.say(null, `${creatureName(c)} retrouve des forces.`);
    }
  }
}

async function choosePartyMember(game, title) {
  const items = game.state.party.map((c, i) => {
    const st = statsOf(c);
    return { id: String(i), label: `${creatureName(c)} · PV ${c.currentHp}/${st.hp}` };
  });
  items.push({ id: "back", label: "Retour" });
  const pick = await game.menu(title, items);
  if (pick == null || pick === "back") return null;
  return Number(pick);
}

export async function openDex(game) {
  const list = speciesList();
  const seen = list.filter((sp) => game.state.dex.seen[sp.id]).length;
  const caught = list.filter((sp) => game.state.dex.caught[sp.id]).length;
  while (true) {
    const items = list.map((sp) => {
      const got = game.state.dex.caught[sp.id];
      const know = game.state.dex.seen[sp.id];
      return {
        id: sp.id,
        label: know ? sp.name : "???",
        detail: got ? "Rencontré et avec toi" : know ? "Vu" : "Pas encore vu",
      };
    });
    items.unshift({ id: "_info", label: `Vus ${seen} · Avec toi ${caught}`, disabled: true });
    items.push({ id: "close", label: "Fermer" });
    const pick = await game.menu("Bestiaire", items);
    if (!pick || pick === "close") return;
    if (!game.state.dex.seen[pick]) {
      await game.say(null, "Tu n'as pas encore rencontré ce compagnon.");
      continue;
    }
    await showDexEntry(game, pick);
  }
}

function showDexEntry(game, id) {
  return new Promise((resolve) => {
    const sp = getSpecies(id);
    const caught = !!game.state.dex.caught[id];
    const root = el("div", "screen");
    const panel = el("div", "panel summary");
    const canvas = el("canvas", "summary-canvas");
    const text = el("div", "summary-text");
    text.append(el("h2", null, sp.name));
    text.append(typeRow(sp.types));
    text.append(el("p", null, sp.description));
    if (caught) {
      text.append(el("p", null, `Taille ${sp.height} · Poids ${sp.weight}`));
      text.append(el("p", null, `On en voit vers : ${sp.areas.join(", ")}.`));
    } else {
      text.append(el("p", null, "Tu l'as vu, mais il ne t'a pas encore rejoint."));
    }
    const close = el("button", "choice primary", "Fermer");
    close.type = "button";
    close.addEventListener("click", finish);
    text.append(close);
    panel.append(canvas, text);
    root.append(panel);
    game.ui.append(root);
    const stop = game.watch(canvas, (ctx, w, h, time) => {
      drawCreature(ctx, id, {
        x: w / 2, y: h * 0.9, size: Math.min(w, h) * 0.9,
        gender: "none",
        bob: Math.sin(time * 2) * 2,
        fainted: !caught,
      });
    });
    const modal = { handle(input) { if (input.justA || input.justB) finish(); } };
    game.pushModal(modal);
    function finish() {
      game.removeModal(modal);
      stop();
      root.remove();
      resolve();
    }
  });
}

export async function openCard(game) {
  const s = game.state;
  const seen = speciesList().filter((sp) => s.dex.seen[sp.id]).length;
  const caught = speciesList().filter((sp) => s.dex.caught[sp.id]).length;
  const total = speciesList().length;
  const minutes = Math.floor((s.playMs || 0) / 60000);
  const hours = Math.floor(minutes / 60);
  const time = hours > 0 ? `${hours} h ${minutes % 60} min` : `${minutes} min`;
  await game.menu("Carte de dresseur", [
    { id: "n", label: s.hero.name, detail: placeName(s.pos.map), disabled: true },
    { id: "t", label: `Temps de jeu : ${time}`, disabled: true },
    { id: "m", label: `Lunes : ${s.money}`, disabled: true },
    { id: "d", label: `Bestiaire : ${seen} vus, ${caught} avec toi, sur ${total}`, disabled: true },
    { id: "b", label: "Badges : aucun pour l'instant", detail: "Les arènes ouvriront plus tard.", disabled: true },
    { id: "close", label: "Fermer" },
  ]);
}

export async function openSettings(game) {
  const cycle = (list, value) => list[(list.indexOf(value) + 1) % list.length];
  while (true) {
    const s = game.settings;
    const pick = await game.menu("Réglages", [
      { id: "text", label: `Taille du texte : ${TEXT_LABEL[s.textSize]}` },
      { id: "speed", label: `Vitesse du texte : ${SPEED_LABEL[s.textSpeed]}` },
      { id: "sound", label: `Son : ${s.sound ? "oui" : "coupé"}` },
      { id: "vib", label: `Vibrations : ${s.vibration ? "oui" : "non"}` },
      { id: "cb", label: `Repères de couleurs : ${s.colorblind ? "oui" : "non"}` },
      { id: "export", label: "Copier la sauvegarde dans un fichier" },
      { id: "import", label: "Lire un fichier de sauvegarde" },
      { id: "wipe", label: "Effacer la partie sur cet appareil" },
      { id: "close", label: "Fermer" },
    ]);
    if (!pick || pick === "close") {
      game.persistSettings();
      return;
    }
    if (pick === "text") s.textSize = cycle(TEXT_SIZES, s.textSize);
    else if (pick === "speed") s.textSpeed = cycle(SPEEDS, s.textSpeed);
    else if (pick === "sound") {
      s.sound = !s.sound;
      game.audio.setEnabled(s.sound);
      if (s.sound) game.audio.play(game.mode === "world" && game.world.map ? game.world.map.music : "title");
    }
    else if (pick === "vib") s.vibration = !s.vibration;
    else if (pick === "cb") s.colorblind = !s.colorblind;
    else if (pick === "export") {
      if (!game.state && !loadSave()) {
        await game.say(null, "Aucune partie à copier pour l'instant.");
      } else {
        exportSave(game.state || loadSave());
        await game.say(null, "Le fichier ovalis-sauvegarde.json va se télécharger. Garde-le pour le passer sur un autre téléphone.");
      }
    } else if (pick === "import") {
      const data = await pickSaveFile();
      if (!data) continue;
      if (data.error) {
        await game.say(null, data.error);
        continue;
      }
      const ok = await game.menu("Remplacer la partie de cet appareil ?", [
        { id: "oui", label: "Oui, lire ce fichier" },
        { id: "non", label: "Annuler" },
      ]);
      if (ok === "oui") {
        writeSave(data);
        game.menuSettings = data.settings;
        if (game.state) {
          game.state = data;
          game.world.enter(data.pos.map, data.pos.x, data.pos.y, data.pos.dir);
          game.audio.play(game.world.map.music);
        }
        game.applyChrome();
        await game.say(null, `Partie de ${data.hero.name} chargée.`);
      }
    } else if (pick === "wipe") {
      const ok = await game.menu("Effacer la partie sur cet appareil ?", [
        { id: "oui", label: "Oui, tout effacer" },
        { id: "non", label: "Non, garder" },
      ]);
      if (ok === "oui") {
        localStorage.removeItem(SAVE_KEY);
        game.state = null;
        await game.say(null, "C'est effacé sur cet appareil. Le fichier que tu as copié, lui, est toujours là.");
        game.exitToTitle();
        return;
      }
    }
    game.applyChrome();
    game.persistSettings();
  }
}

export async function openShop(game) {
  while (true) {
    const items = SHOP_STOCK.map((id) => {
      const it = ITEMS[id];
      return { id, label: `${it.name} — ${it.price} Lunes`, detail: it.desc };
    });
    items.push({ id: "leave", label: "Au revoir" });
    const pick = await game.menu(`Échoppe — ${game.state.money} Lunes`, items);
    if (!pick || pick === "leave") return;
    const it = ITEMS[pick];
    if (game.state.money < it.price) {
      await game.say("Noé", "Tu n'as pas assez de Lunes.");
      continue;
    }
    game.state.money -= it.price;
    giveItem(game.state, pick, 1);
    game.save();
    game.audio.sfx("ok");
    await game.say("Noé", `Voilà, une ${it.name}. Il t'en reste ${game.state.money} Lunes.`);
  }
}

export function openStorage(game) {
  let boxIndex = 0;
  let selected = null;
  let done = () => {};
  let closed = false;
  const root = el("div", "screen");
  const panel = el("div", "panel storage");
  root.append(panel);
  game.ui.append(root);
  const stops = [];
  const modal = {
    handle(input) {
      if (input.justB) finish();
    },
  };
  game.pushModal(modal);

  function finish() {
    if (closed) return;
    closed = true;
    stops.forEach((fn) => fn());
    game.removeModal(modal);
    root.remove();
    game.save();
    done();
  }

  function paint() {
    stops.forEach((fn) => fn());
    stops.length = 0;
    const box = game.state.boxes[boxIndex];
    panel.replaceChildren();
    panel.append(el("h2", null, "Boîtes des compagnons"));
    const cols = el("div", "storage-cols");
    cols.append(column("Équipe", game.state.party, "party"));
    cols.append(column(box.name, box.creatures, "box"));
    panel.append(cols);
    const actions = el("div", "row-actions");
    const deposit = el("button", "choice", "Déposer");
    deposit.type = "button";
    deposit.disabled = !selected || selected.side !== "party";
    deposit.addEventListener("click", () => {
      if (game.state.party.length <= 1) {
        game.toast("Garde au moins un compagnon avec toi.");
        return;
      }
      const [c] = game.state.party.splice(selected.index, 1);
      putInBox(game, boxIndex, c);
      selected = null;
      paint();
    });
    const withdraw = el("button", "choice", "Retirer");
    withdraw.type = "button";
    withdraw.disabled = !selected || selected.side !== "box";
    withdraw.addEventListener("click", () => {
      if (game.state.party.length >= 6) {
        game.toast("Ton équipe est déjà au complet (6).");
        return;
      }
      const [c] = game.state.boxes[boxIndex].creatures.splice(selected.index, 1);
      game.state.party.push(c);
      selected = null;
      paint();
    });
    const info = el("button", "choice", "Résumé");
    info.type = "button";
    info.disabled = !selected;
    info.addEventListener("click", async () => {
      const list = selected.side === "party" ? game.state.party : game.state.boxes[boxIndex].creatures;
      game.removeModal(modal);
      await openSummary(game, list[selected.index]);
      game.pushModal(modal);
    });
    const prev = el("button", "choice", "Boîte précédente");
    prev.type = "button";
    prev.disabled = boxIndex === 0;
    prev.addEventListener("click", () => { boxIndex -= 1; selected = null; paint(); });
    const next = el("button", "choice", "Boîte suivante");
    next.type = "button";
    next.addEventListener("click", () => {
      if (boxIndex >= game.state.boxes.length - 1) {
        game.state.boxes.push({ name: `Boîte ${game.state.boxes.length + 1}`, creatures: [] });
      }
      boxIndex += 1;
      selected = null;
      paint();
    });
    const close = el("button", "choice primary", "Fermer");
    close.type = "button";
    close.addEventListener("click", finish);
    actions.append(deposit, withdraw, info, prev, next, close);
    panel.append(actions);
    panel.append(el("p", "help", "Les boîtes n'ont pas de limite : une nouvelle s'ouvre quand celle-ci est pleine (30 places)."));
  }

  function column(title, list, side) {
    const col = el("section", "storage-col");
    col.append(el("h3", null, title));
    if (!list.length) col.append(el("p", "help", "Personne ici."));
    list.forEach((c, index) => {
      const btn = el("button", "choice mini" + (selected && selected.side === side && selected.index === index ? " is-focus" : ""));
      btn.type = "button";
      const canvas = el("canvas", "mini-sprite");
      const label = el("span", null, `${creatureName(c)} · ${GENDER_LABEL[c.gender]} · Niv. ${c.level}`);
      btn.append(canvas, label);
      btn.addEventListener("click", () => { selected = { side, index }; paint(); });
      col.append(btn);
      stops.push(game.watch(canvas, (ctx, w, h) => {
        drawCreature(ctx, c.species, {
          x: w / 2, y: h * 0.92, size: Math.min(w, h) * 0.95, gender: c.gender,
        });
      }));
    });
    return col;
  }

  paint();
  return new Promise((resolve) => { done = resolve; });
}

function putInBox(game, boxIndex, creature) {
  let box = game.state.boxes[boxIndex];
  if (!box || box.creatures.length >= 30) {
    box = { name: `Boîte ${game.state.boxes.length + 1}`, creatures: [] };
    game.state.boxes.push(box);
  }
  box.creatures.push(creature);
}

export async function talkTo(game, npc) {
  if (npc.role === "healer") {
    const ok = await game.menu("Maël", [
      { id: "oui", label: "Soigner l'équipe" },
      { id: "non", label: "Pas maintenant" },
    ]);
    if (ok === "oui") {
      if (!game.state.party.length) {
        await game.say("Maël", "Tu n'as encore personne à soigner.");
        return;
      }
      healParty(game.state);
      game.audio.sfx("heal");
      game.save();
      await game.say("Maël", "Les voilà en pleine forme. Le poison et les brûlures sont partis, et leurs attaques sont rechargées.");
    }
    return;
  }
  if (npc.role === "shop") {
    await game.say("Noé", "Bienvenue. Une Ovalune coûte 200 Lunes. Une Goutte vive, 150 Lunes.");
    await openShop(game);
    return;
  }
  if (npc.role === "parent" && !game.state.flags.camilleGift) {
    game.state.flags.camilleGift = true;
    game.state.money += 1000;
    game.save();
    await game.say("Camille", `${game.state.hero.name}, tu pars déjà ? Prends ces 1000 Lunes pour la boutique.`);
    await game.say("Camille", "Si l'équipe est fatiguée, le Relais Vital est juste à côté. Et ta partie s'enregistre toute seule.");
    return;
  }
  for (const line of npc.lines || []) await game.say(npc.name, line);
}

