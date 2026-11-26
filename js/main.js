/** Ovalis — boucle du jeu, dialogues, sauvegarde, branchement des écrans. */

import { createInput } from "./core/input.js";
import { createAudio } from "./core/audio.js";
import { freshState, createCreature, receiveCreature, giveItem, healParty, creatureName } from "./core/state.js";
import { loadSave, loadSettings, saveSettings, writeSave } from "./core/save.js";
import { rollEncounterTable } from "./core/encounters.js";
import { World } from "./scenes/world.js";
import { runBattle, drawBattle } from "./scenes/battle.js";
import {
  showTitle, showCreate, chooseStarter, openPause, openStorage, talkTo,
} from "./scenes/menus.js";
import { el, fitCanvas, toast } from "./ui.js";
import { drawCreature } from "./render/creature.js";
import { STARTERS } from "./data/creatures.js";

const CPS = { lent: 22, normal: 46, rapide: 85, instant: 100000 };
const AFTER = { lent: 1500, normal: 850, rapide: 420, instant: 240 };

class Game {
  constructor() {
    this.app = document.getElementById("app");
    this.ui = document.getElementById("ui");
    this.view = document.getElementById("view");
    this.audio = createAudio();
    this.input = createInput(() => this.mode === "world" && this.modals.length === 0 && !this.world?.locked);
    this.input.bind(
      document.getElementById("stick-zone"),
      document.getElementById("btn-a"),
      document.getElementById("btn-b"),
      document.getElementById("stick"),
    );
    this.world = new World(this);
    this.state = null;
    this.mode = "title";
    this.modals = [];
    this.watchers = [];
    this.battle = null;
    this.menuSettings = loadSettings();
    this.time = 0;
    this.saveTick = 0;
    this.leaving = false;
    this.forceEncounter = false;
    this.session = null;
    window.addEventListener("pointerdown", () => this.audio.resume());
    window.addEventListener("pagehide", () => this.save());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") this.save();
    });
  }

  get settings() {
    return this.state?.settings || this.menuSettings;
  }

  applyChrome() {
    const s = this.settings;
    this.app.dataset.text = s.textSize || "grand";
    this.app.dataset.cb = s.colorblind ? "1" : "0";
    this.app.dataset.mode = this.mode;
    const controls = document.getElementById("controls");
    controls.hidden = this.mode === "title" || this.mode === "create";
    const busy = this.modals.length > 0 || this.mode === "battle" || !!this.world?.locked;
    this.app.classList.toggle("menu-open", busy);
    this.audio.setEnabled(!!s.sound);
  }

  persistSettings() {
    const s = this.settings;
    saveSettings(s);
    if (this.state) this.state.settings = s;
  }

  save() {
    if (!this.state) return;
    try { writeSave(this.state); } catch { toast("La sauvegarde n'a pas pu s'écrire."); }
  }

  toast(text) { toast(text); }

  buzz(pattern) {
    if (!this.settings.vibration) return;
    try { navigator.vibrate?.(pattern); } catch { /* pas de vibreur */ }
  }

  pushModal(modal) {
    this.modals.push(modal);
    this.applyChrome();
  }

  removeModal(modal) {
    const i = this.modals.indexOf(modal);
    if (i >= 0) this.modals.splice(i, 1);
    this.applyChrome();
  }

  watch(canvas, fn) {
    const item = { canvas, fn };
    this.watchers.push(item);
    return () => {
      const i = this.watchers.indexOf(item);
      if (i >= 0) this.watchers.splice(i, 1);
    };
  }

  wait(seconds) {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }

  fade(opacity) {
    document.getElementById("fade").style.opacity = String(opacity);
    return this.wait(0.28);
  }

  async boot() {
    this.audio.play("title");
    this.applyChrome();
    while (!this.leaving) {
      this.mode = "title";
      this.ui.replaceChildren();
      this.applyChrome();
      if (location.hash === "#galerie") {
        await this.gallery();
        location.hash = "";
      }
      const choice = await showTitle(this);
      if (choice === "new") {
        this.mode = "create";
        this.applyChrome();
        const hero = await showCreate(this);
        this.mode = "title";
        if (!hero) continue;
        this.state = freshState(hero, this.menuSettings);
        this.menuSettings = this.state.settings;
        await this.enterWorld(true);
      } else if (choice === "continue") {
        const save = loadSave();
        if (!save) {
          await this.say(null, "Aucune partie à continuer.");
          continue;
        }
        this.state = save;
        this.menuSettings = save.settings;
        await this.enterWorld(false);
      }
    }
  }

  async enterWorld(isNew) {
    this.leaving = false;
    this.mode = "world";
    const pos = this.state.pos;
    this.world.enter(pos.map, pos.x, pos.y, pos.dir);
    this.audio.play(this.world.map.music);
    this.applyChrome();
    this.toast(this.world.map.name);
    if (isNew || !this.state.flags.introDone) {
      this.world.locked = true;
      this.applyChrome();
      await this.playIntro();
      this.world.locked = false;
      this.applyChrome();
    }
    await new Promise((resolve) => { this.session = resolve; });
    this.ui.replaceChildren();
    this.modals = [];
    this.audio.play("title");
    this.mode = "title";
    this.applyChrome();
  }

  exitToTitle() {
    if (this.state) this.save();
    if (this.session) {
      const done = this.session;
      this.session = null;
      done();
    }
  }

  async playIntro() {
    const name = this.state.hero.name;
    await this.say("Professeure Ardent", `Bonjour ${name}. Je suis Solène Ardent. Bienvenue dans mon laboratoire, à Valclair.`);
    await this.say("Professeure Ardent", "Ici, sur le continent Ovalis, des compagnons vivent à nos côtés. Chacun a un talent : le feu, l'eau, la plante, et beaucoup d'autres.");
    await this.say("Professeure Ardent", "Tu pars en voyage. Choisis d'abord un compagnon. Il va grandir avec toi.");
    if (!this.state.flags.gotStarter) {
      const id = await chooseStarter(this);
      const creature = createCreature(id, 5);
      receiveCreature(this.state, creature);
      this.state.flags.gotStarter = id;
      await this.say("Professeure Ardent", `${creatureName(creature)} a l'air ravi de te suivre !`);
      giveItem(this.state, "ovalune", 5);
      giveItem(this.state, "goutte", 3);
      await this.say("Professeure Ardent", "Prends ces Ovalunes. Pendant un combat, elles servent à inviter un compagnon sauvage dans ton équipe.");
      await this.say("Professeure Ardent", "Et ces Gouttes vives : elles rendent 30 PV.");
    }
    await this.say("Professeure Ardent", "Si ton équipe est fatiguée, va au Relais Vital, le bâtiment à l'ouest. La boutique est à l'est.");
    await this.say("Professeure Ardent", "Au sud, le Sentier des Roseaux mène à Portbrume. Des dresseurs y marchent : s'ils te voient, ils viennent vers toi.");
    await this.say("Professeure Ardent", "Le bouton A sert à parler et à confirmer. Le bouton B ouvre le menu. Ta partie s'enregistre toute seule sur ce téléphone.");
    await this.say("Professeure Ardent", `Bonne route, ${name}.`);
    this.state.flags.introDone = true;
    this.save();
  }

  async changeMap(warp) {
    if (this.transition) return;
    this.transition = true;
    this.world.locked = true;
    await this.fade(1);
    this.world.enter(warp.to, warp.tx, warp.ty, warp.dir);
    this.toast(this.world.map.name);
    if (this.settings.sound) this.audio.play(this.world.map.music);
    if (this.state.flags.introDone) this.save();
    await this.fade(0);
    this.world.locked = false;
    this.transition = false;
    this.applyChrome();
  }

  async startWild(forced) {
    if (this.inBattle) return;
    if (!this.state.party.some((c) => c.currentHp > 0)) return;
    const table = this.world.map.encounters?.table;
    if (!table && !forced) return;
    const foe = forced || rollEncounterTable(table);
    this.inBattle = true;
    this.world.locked = true;
    if (this.settings.sound) this.audio.play("battle");
    const result = await runBattle(this, { kind: "wild", foes: [foe] });
    this.inBattle = false;
    this.world.locked = false;
    if (this.settings.sound) this.audio.play(this.world.map.music);
    this.save();
    if (result.result === "lose") await this.whiteout();
  }

  async startTrainer(trainer) {
    if (this.inBattle) return;
    if (this.state.flags.trainers[trainer.id]) return;
    if (!this.state.party.some((c) => c.currentHp > 0)) {
      await this.say(null, "Tes compagnons sont K.O. Passe au Relais Vital.");
      return;
    }
    const foes = trainer.party.map((p) => createCreature(p.species, p.level));
    this.inBattle = true;
    this.world.locked = true;
    if (this.settings.sound) this.audio.play("battle");
    const result = await runBattle(this, { kind: "trainer", foes, trainer });
    this.inBattle = false;
    this.world.locked = false;
    if (result.result === "win" && this.settings.sound) {
      this.audio.play("win");
      await this.wait(1.2);
    }
    if (this.settings.sound) this.audio.play(this.world.map.music);
    this.save();
    if (result.result === "lose") await this.whiteout();
  }

  async whiteout() {
    const loss = Math.floor(this.state.money / 2);
    this.state.money -= loss;
    healParty(this.state);
    await this.say(null, "Tu n'as plus de compagnon en état de se battre…");
    await this.fade(1);
    this.world.enter("relais", 7, 7, "up");
    if (this.settings.sound) this.audio.play("town");
    await this.fade(0);
    await this.say("Maël", "Tu t'es évanoui. Je m'occupe de ton équipe. Les voilà en pleine forme.");
    if (loss > 0) await this.say("Maël", `Tu as perdu ${loss} Lunes en chemin.`);
    this.save();
  }

  openPause() { return openPause(this); }
  openStorage() { return openStorage(this); }
  talkTo(npc) { return talkTo(this, npc); }

  say(speaker, text) {
    const speed = this.settings.textSpeed || "normal";
    const host = this.mode === "battle" ? this.battle?.panel : null;
    const box = el("div", host ? "battle-text" : "dialogue");
    const who = speaker ? el("div", "who", speaker) : null;
    const body = el("p", "line", "");
    const hint = el("div", "hint", "A pour continuer");
    if (who) box.append(who);
    box.append(body, hint);
    let root = null;
    if (host) host.replaceChildren(box);
    else {
      root = el("div", "screen dialogue-screen");
      root.append(box);
      this.ui.append(root);
      root.addEventListener("pointerdown", () => this.input.tap());
    }
    box.addEventListener("pointerdown", () => this.input.tap());
    let shown = 0;
    let acc = 0;
    let finishedReveal = speed === "instant";
    if (finishedReveal) body.textContent = text;
    let auto = 0;
    let settled = false;
    return new Promise((resolve) => {
      const finish = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(auto);
        this.removeModal(modal);
        if (root) root.remove();
        resolve();
      };
      const arm = () => {
        finishedReveal = true;
        body.textContent = text;
        window.clearTimeout(auto);
        auto = window.setTimeout(finish, AFTER[speed] ?? 800);
      };
      const modal = {
        update: (dt) => {
          if (finishedReveal) return;
          acc += dt * (CPS[speed] ?? 46);
          const n = Math.floor(acc);
          acc -= n;
          shown = Math.min(text.length, shown + Math.max(0, n));
          body.textContent = text.slice(0, shown);
          if (shown >= text.length) arm();
        },
        handle: (input) => {
          if (!finishedReveal) {
            if (input.justA || input.justB) arm();
            return;
          }
          if (input.justA || input.justB) finish();
        },
      };
      this.pushModal(modal);
      if (finishedReveal) arm();
    });
  }

  menu(title, items, opts = {}) {
    const host = opts.host || null;
    const root = host ? null : el("div", "screen");
    const panel = host || el("div", "panel menu-panel");
    if (!host) root.append(panel);
    else panel.replaceChildren();
    if (title) panel.append(el("h2", null, title));
    const list = el("div", "menu-list" + (opts.columns === 2 ? " cols-2" : ""));
    panel.append(list);
    if (!host) this.ui.append(root);
    let focus = Math.max(0, items.findIndex((item) => !item.disabled));
    const buttons = items.map((item) => {
      const btn = el("button", "choice");
      btn.type = "button";
      if (item.fill) item.fill(btn);
      else {
        btn.append(document.createTextNode(item.label || ""));
        if (item.detail) btn.append(el("span", "detail", item.detail));
      }
      btn.disabled = !!item.disabled;
      list.append(btn);
      return btn;
    });
    const paint = () => {
      buttons.forEach((btn, i) => btn.classList.toggle("is-focus", i === focus && !items[i].disabled));
      buttons[focus]?.scrollIntoView({ block: "nearest" });
    };
    paint();
    return new Promise((resolve) => {
      let settled = false;
      const finish = (id) => {
        if (settled) return;
        settled = true;
        this.removeModal(modal);
        if (root) root.remove();
        resolve(id);
      };
      buttons.forEach((btn, i) => btn.addEventListener("click", () => {
        if (!items[i].disabled) finish(items[i].id);
      }));
      const move = (delta) => {
        if (!items.length) return;
        for (let n = 0; n < items.length; n++) {
          focus = (focus + delta + items.length) % items.length;
          if (!items[focus].disabled) break;
        }
        paint();
      };
      const modal = {
        handle: (input) => {
          if (input.dirEdge === "up" || input.dirEdge === "left") move(-1);
          if (input.dirEdge === "down" || input.dirEdge === "right") move(1);
          if (input.justA && items[focus] && !items[focus].disabled) finish(items[focus].id);
          if (input.justB && opts.cancel !== false) finish(null);
        },
      };
      this.pushModal(modal);
    });
  }

  askText(title, value) {
    const root = el("div", "screen");
    const panel = el("div", "panel menu-panel");
    panel.append(el("h2", null, title));
    const input = el("input");
    input.maxLength = 12;
    input.value = value || "";
    input.autocomplete = "off";
    panel.append(input);
    const row = el("div", "row-actions");
    const ok = el("button", "choice primary", "Valider");
    ok.type = "button";
    const cancel = el("button", "choice", "Passer");
    cancel.type = "button";
    row.append(cancel, ok);
    panel.append(row);
    root.append(panel);
    this.ui.append(root);
    return new Promise((resolve) => {
      const finish = (text) => {
        this.removeModal(modal);
        root.remove();
        resolve(text);
      };
      ok.addEventListener("click", () => finish(cleanText(input.value)));
      cancel.addEventListener("click", () => finish(null));
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") finish(cleanText(input.value));
      });
      const modal = { handle(ev) { if (ev.justB) finish(null); } };
      this.pushModal(modal);
      setTimeout(() => input.focus(), 40);
    });
  }

  update(dt) {
    this.time += dt;
    if (this.state && document.visibilityState === "visible" && this.mode === "world") {
      this.state.playMs += dt * 1000;
      this.saveTick += dt;
      if (this.saveTick > 30 && this.state.flags.introDone) {
        this.saveTick = 0;
        this.save();
      }
    }
    const modal = this.modals[this.modals.length - 1];
    if (modal?.update) modal.update(dt);
    if (this.mode === "world") this.world.update(dt);
    if (this.battle) this.battle.time += dt;
  }

  handleInput(input) {
    const modal = this.modals[this.modals.length - 1];
    if (modal?.handle) {
      modal.handle(input);
      return;
    }
    if (this.mode === "world") this.world.handleInput(input);
  }

  render() {
    const { ctx, w, h } = fitCanvas(this.view);
    if (this.mode === "battle") {
      drawArena(ctx, w, h, this.time);
      if (this.battle) drawBattle(this.battle, this.time);
    } else if (this.mode === "world" && this.world.map) {
      this.world.render(ctx, w, h);
    } else if (this.mode === "create") {
      drawArena(ctx, w, h, this.time);
    } else {
      drawArena(ctx, w, h, this.time);
      STARTERS.forEach((id, i) => {
        const x = w * (0.22 + i * 0.28);
        drawCreature(ctx, id, {
          x, y: h * 0.78, size: Math.min(180, h * 0.42),
          gender: i === 2 ? "herm" : i === 1 ? "male" : "female",
          bob: Math.sin(this.time * 2.4 + i) * 6,
          eyeOpen: (this.time + i) % 4 < 0.12 ? 0.2 : 1,
        });
      });
    }
    for (const item of this.watchers) {
      if (!item.canvas.isConnected) continue;
      const box = fitCanvas(item.canvas);
      item.fn(box.ctx, box.w, box.h, this.time);
    }
    this.input.paintStick();
  }

  gallery() {
    const root = el("div", "screen");
    const panel = el("div", "panel");
    panel.append(el("h2", null, "Galerie des compagnons"));
    const grid = el("div", "gallery");
    const species = ["solarix", "nimbleu", "verdelin", "grounin", "mouettine", "taupion", "lampyrin", "petaline", "rocadon", "nebulette", "piquorin"];
    const genders = ["male", "female", "herm"];
    const stops = [];
    for (const id of species) {
      for (const gender of genders) {
        const cell = el("div", "gallery-cell");
        const canvas = el("canvas", "mini-sprite");
        canvas.style.width = "120px";
        canvas.style.height = "110px";
        cell.append(canvas, el("span", null, `${id} · ${gender}`));
        grid.append(cell);
        stops.push(this.watch(canvas, (ctx, w, h, time) => {
          drawCreature(ctx, id, { x: w / 2, y: h * 0.9, size: w * 0.95, gender, bob: Math.sin(time * 2) * 2 });
        }));
      }
    }
    const close = el("button", "choice", "Fermer");
    close.type = "button";
    panel.append(grid, close);
    root.append(panel);
    this.ui.append(root);
    return new Promise((resolve) => {
      close.addEventListener("click", () => {
        stops.forEach((fn) => fn());
        root.remove();
        resolve();
      });
    });
  }
}

function cleanText(value) {
  const t = String(value || "").trim().replace(/\s+/g, " ");
  if (!t) return null;
  return t.slice(0, 12);
}

function drawArena(ctx, w, h, time) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#8FD0FF");
  sky.addColorStop(0.45, "#B7E3A1");
  sky.addColorStop(1, "#67A84A");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  for (let i = 0; i < 4; i++) {
    const x = ((time * 18 + i * 220) % (w + 160)) - 80;
    ctx.beginPath();
    ctx.ellipse(x, 48 + i * 14, 46, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#3E8E3A";
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.72, w * 0.42, h * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
}

const game = new Game();
game.boot();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.input.beginFrame();
  game.update(dt);
  game.handleInput(game.input.state);
  game.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.__ovalis = {
  game,
  /** Pour les essais : la prochaine herbe déclenche un combat. */
  encounter(species, level = 3) {
    game.forceEncounter = false;
    const foe = createCreature(species, level);
    game.startWild(foe);
  },
  grass() { game.forceEncounter = true; },
};
