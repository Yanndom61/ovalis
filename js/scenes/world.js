/** Déplacement case par case, discussions, herbes hautes, dresseurs. */

import { getMap, tileAt, isSolid } from "../data/maps.js";
import { TILE, drawMap, cameraFor } from "../render/world.js";
import { drawPerson } from "../render/actors.js";
import { heroAppearance } from "../core/state.js";
import { smooth, lerp } from "../core/util.js";

const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPP = { up: "down", down: "up", left: "right", right: "left" };

export class World {
  constructor(game) {
    this.game = game;
    this.map = null;
    this.x = 0;
    this.y = 0;
    this.dir = "down";
    this.move = null;
    this.locked = false;
    this.actors = {};
    this.exclaim = null;
    this.time = 0;
    this.walkFrame = 0;
  }

  enter(mapId, x, y, dir) {
    this.map = getMap(mapId);
    this.x = x;
    this.y = y;
    this.dir = dir || "down";
    this.move = null;
    this.actors = {};
    for (const n of [...this.map.npcs, ...this.map.trainers]) {
      this.actors[n.id] = { x: n.x, y: n.y, dir: n.dir || "down", moving: null, ref: n };
    }
    this.game.state.pos = { map: mapId, x, y, dir: this.dir };
  }

  update(dt) {
    this.time += dt;
    if (this.move) {
      this.walkFrame += dt * 10;
      this.move.t += dt / 0.18;
      if (this.move.t >= 1) {
        this.x = this.move.x1;
        this.y = this.move.y1;
        this.move = null;
        this.arrived();
      }
    }
    for (const a of Object.values(this.actors)) {
      if (a.moving) a.moving.t = Math.min(1, a.moving.t + dt / 0.16);
    }
  }

  handleInput(input) {
    if (this.locked || this.move) return;
    if (input.justA) {
      this.interact();
      return;
    }
    if (input.justB) {
      this.game.openPause();
      return;
    }
    const dir = input.direction;
    if (dir) this.tryStep(dir);
  }

  tryStep(dir) {
    this.dir = dir;
    const [dx, dy] = DIRS[dir];
    const nx = this.x + dx;
    const ny = this.y + dy;
    if (!this.canWalk(nx, ny)) return;
    const warp = this.map.warps.find((w) => w.x === nx && w.y === ny);
    if (warp && this.map.id === "lab" && !this.game.state.flags.gotStarter) {
      this.game.say("Professeure Ardent", "Attends. Choisis d'abord ton compagnon.");
      return;
    }
    this.move = { x0: this.x, y0: this.y, x1: nx, y1: ny, t: 0 };
  }

  canWalk(x, y) {
    if (x < 0 || y < 0 || x >= this.map.w || y >= this.map.h) return false;
    if (isSolid(this.map, x, y)) return false;
    if (this.actorAt(x, y)) return false;
    return true;
  }

  actorAt(x, y) {
    return Object.values(this.actors).find((a) => a.x === x && a.y === y && !a.moving);
  }

  arrived() {
    this.game.state.pos = { map: this.map.id, x: this.x, y: this.y, dir: this.dir };
    const warp = this.map.warps.find((w) => w.x === this.x && w.y === this.y);
    if (warp) {
      this.game.changeMap(warp);
      return;
    }
    if (tileAt(this.map, this.x, this.y) === "t" && this.map.encounters && this.living()) {
      const rate = this.game.forceEncounter ? 1 : this.map.encounters.rate;
      if (Math.random() < rate) {
        this.game.forceEncounter = false;
        this.game.startWild();
        return;
      }
    }
    if (this.scanTrainer()) return;
    const dir = this.game.input.direction();
    if (dir && !this.locked) this.tryStep(dir);
  }

  living() {
    return this.game.state.party.some((c) => c.currentHp > 0);
  }

  scanTrainer() {
    for (const t of this.map.trainers) {
      if (this.game.state.flags.trainers[t.id]) continue;
      const actor = this.actors[t.id];
      if (!this.inSight(actor)) continue;
      this.chase(t, actor);
      return true;
    }
    return false;
  }

  inSight(actor) {
    const [dx, dy] = DIRS[actor.dir] || [0, 1];
    const sight = actor.ref.sight || 3;
    for (let i = 1; i <= sight; i++) {
      const x = actor.x + dx * i;
      const y = actor.y + dy * i;
      if (isSolid(this.map, x, y)) return false;
      if (x === this.x && y === this.y) return true;
    }
    return false;
  }

  async chase(trainer, actor) {
    this.locked = true;
    this.exclaim = trainer.id;
    this.game.audio.sfx("ok");
    await this.game.wait(0.4);
    this.exclaim = null;
    let guard = 0;
    while (Math.abs(actor.x - this.x) + Math.abs(actor.y - this.y) > 1 && guard < 12) {
      guard += 1;
      let sx = Math.sign(this.x - actor.x);
      let sy = Math.sign(this.y - actor.y);
      if (sx && sy) {
        const [dx, dy] = DIRS[actor.dir] || [0, 0];
        if (dx && sx === dx) sy = 0;
        else sx = 0;
      }
      const nx = actor.x + sx;
      const ny = actor.y + sy;
      if ((nx === this.x && ny === this.y) || isSolid(this.map, nx, ny)) break;
      if (sx) actor.dir = sx > 0 ? "right" : "left";
      else if (sy) actor.dir = sy > 0 ? "down" : "up";
      await this.slide(actor, nx, ny);
    }
    this.face(actor);
    actor.dir = OPP[this.dir] || actor.dir;
    for (const line of trainer.before) await this.game.say(trainer.name, line);
    await this.game.startTrainer(trainer);
    this.locked = false;
  }

  slide(actor, nx, ny) {
    actor.moving = { x0: actor.x, y0: actor.y, x1: nx, y1: ny, t: 0 };
    return new Promise((resolve) => {
      const step = () => {
        if (!actor.moving || actor.moving.t >= 1) {
          actor.x = nx;
          actor.y = ny;
          actor.moving = null;
          resolve();
          return;
        }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  face(actor) {
    const dx = actor.x - this.x;
    const dy = actor.y - this.y;
    if (Math.abs(dx) > Math.abs(dy)) this.dir = dx > 0 ? "right" : "left";
    else if (dy) this.dir = dy > 0 ? "down" : "up";
  }

  async interact() {
    const [dx, dy] = DIRS[this.dir];
    const x = this.x + dx;
    const y = this.y + dy;
    const actor = Object.values(this.actors).find((a) => a.x === x && a.y === y);
    if (actor) {
      const ref = actor.ref;
      if (ref.before) {
        if (this.game.state.flags.trainers[ref.id]) {
          actor.dir = OPP[this.dir];
          for (const line of ref.after) await this.game.say(ref.name, line);
        } else {
          this.locked = true;
          this.face(actor);
          actor.dir = OPP[this.dir];
          for (const line of ref.before) await this.game.say(ref.name, line);
          await this.game.startTrainer(ref);
          this.locked = false;
        }
        return;
      }
      actor.dir = OPP[this.dir];
      await this.game.talkTo(ref);
      return;
    }
    const sign = this.map.signs.find((s) => s.x === x && s.y === y);
    if (sign) {
      await this.game.say(null, sign.text);
      return;
    }
    const inter = (this.map.interactables || []).find((s) => s.x === x && s.y === y);
    if (inter) {
      if (inter.kind === "pc") {
        await this.game.openStorage();
        return;
      }
      for (const line of inter.lines) await this.game.say(null, line);
      return;
    }
    const tile = tileAt(this.map, x, y);
    if (this.map.id === "portbrume" && (tile === "b" || tile === "r")) {
      await this.game.say(null, "C'est fermé pour le moment.");
    }
  }

  render(ctx, w, h) {
    if (!this.map) return;
    const pos = this.drawXY(this.x, this.y, this.move);
    const cam = cameraFor(pos.x, pos.y, this.map, w, h);
    drawMap(ctx, this.map, cam, this.time);
    const sprites = [];
    const hero = heroAppearance(this.game.state.hero, this.dir);
    hero.frame = this.move ? this.walkFrame : 0;
    sprites.push({ y: pos.y, draw: () => drawPerson(ctx, hero, pos.x - cam.x, pos.y - cam.y, 1) });
    for (const a of Object.values(this.actors)) {
      const p = this.drawXY(a.x, a.y, a.moving);
      const sprite = { ...a.ref.sprite, dir: a.dir, frame: a.moving ? this.time * 10 : 0 };
      sprites.push({
        y: p.y,
        draw: () => {
          drawPerson(ctx, sprite, p.x - cam.x, p.y - cam.y, 1);
          if (this.exclaim === a.ref.id) this.mark(ctx, p.x - cam.x, p.y - cam.y - 52);
        },
      });
    }
    sprites.sort((a, b) => a.y - b.y);
    for (const s of sprites) s.draw();
  }

  drawXY(x, y, move) {
    const t = move ? smooth(Math.min(1, move.t)) : 1;
    const gx = move ? lerp(move.x0, move.x1, t) : x;
    const gy = move ? lerp(move.y0, move.y1, t) : y;
    return { x: gx * TILE + TILE / 2, y: gy * TILE + TILE * 0.78 };
  }

  mark(ctx, x, y) {
    ctx.fillStyle = "#fff6e8";
    ctx.strokeStyle = "#1a1208";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#1a1208";
    ctx.font = "700 18px Atkinson Hyperlegible, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("!", x, y + 1);
  }
}
