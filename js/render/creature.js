/**
 * Dessin des créatures en parties (corps, tête, oreilles, queue, ailes, motif, extras)
 * et une palette. Une fusion future peut passer un mélange :
 *   drawCreature(ctx, { parts: {...}, palette: {...} }, options)
 * ou simplement l'identifiant d'une espèce.
 */

import { getSpecies } from "../data/creatures.js";

const ANCHORS = {
  fox:    { head: [22, 52], tail: [-48, 78] },
  otter:  { head: [26, 56], tail: [-52, 92] },
  fawn:   { head: [26, 60], tail: [-42, 96] },
  boar:   { head: [16, 62], tail: [-40, 96] },
  bird:   { head: [22, 48], tail: [-40, 78] },
  mole:   { head: [10, 70], tail: [-28, 108] },
  beetle: { head: [28, 62], tail: [-20, 90] },
  bloom:  { head: [0, 42], tail: [-8, 112] },
  golem:  { head: [4, 58], tail: [-36, 108] },
  wisp:   { head: [6, 48], tail: [-30, 100] },
  grub:   { head: [34, 72], tail: [-46, 90] },
};

export function resolveModel(source) {
  if (typeof source === "string") {
    const sp = getSpecies(source);
    return { parts: sp.render.parts, palette: sp.render.palette, id: sp.id };
  }
  if (source && source.render) {
    return { parts: source.render.parts, palette: source.render.palette, id: source.id };
  }
  return source;
}

export function drawCreature(ctx, source, opt = {}) {
  const model = resolveModel(source);
  if (!model || !model.parts) return;
  const {
    x = 0,
    y = 0,
    size = 160,
    gender = "male",
    facing = 1,
    bob = 0,
    fainted = false,
    eyeOpen = 1,
  } = opt;
  const parts = model.parts;
  const pal = model.palette;
  const anchors = ANCHORS[parts.body] || ANCHORS.fox;

  ctx.save();
  ctx.translate(x, y + bob);
  const sc = size / 160;
  ctx.scale(facing >= 0 ? sc : -sc, sc);
  ctx.translate(0, -124);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (fainted) ctx.filter = "grayscale(0.9) brightness(0.72)";

  blob(ctx, 6, 122, 40, 8, "rgba(10,16,28,0.28)", null);
  drawTail(ctx, parts.tail, pal, anchors);
  if (parts.wings === "feather") drawFeatherWings(ctx, pal, anchors);
  drawBackExtra(ctx, parts.extras, pal, anchors, gender);
  drawBody(ctx, parts.body, pal);
  if (parts.pattern && parts.pattern !== "none") drawPattern(ctx, parts.pattern, pal, parts.body);
  if (parts.wings === "shell") drawShell(ctx, pal);
  drawEars(ctx, parts.ears, pal, anchors);
  drawHead(ctx, parts.head || parts.body, pal, gender, eyeOpen, anchors);
  drawFrontExtra(ctx, parts.extras, pal, anchors, gender);
  drawSexMarkers(ctx, gender, pal, anchors);
  ctx.restore();
}

function blob(ctx, x, y, rx, ry, fill, stroke, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.5, Math.abs(rx)), Math.max(0.5, Math.abs(ry)), rot, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3.2;
    ctx.stroke();
  }
}

function poly(ctx, pts, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3.2;
    ctx.stroke();
  }
}

function flame(ctx, x, y, w, h, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x + w * 0.7, y - h * 0.2, x + w * 0.35, y - h * 0.72, x, y - h);
  ctx.bezierCurveTo(x - w * 0.45, y - h * 0.62, x - w * 0.7, y - h * 0.18, x, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

function eye(ctx, x, y, r, iris, open, gender) {
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = "#1a1208";
  if (open < 0.35) {
    ctx.beginPath();
    ctx.moveTo(x - r, y);
    ctx.quadraticCurveTo(x, y + r * 0.45, x + r, y);
    ctx.stroke();
    return;
  }
  blob(ctx, x, y, r, r * 1.05, "#fffdf8", "#1a1208");
  blob(ctx, x + r * 0.12, y + r * 0.08, r * 0.62, r * 0.66, iris, null);
  blob(ctx, x + r * 0.18, y + r * 0.12, r * 0.32, r * 0.36, "#1a1208", null);
  blob(ctx, x - r * 0.28, y - r * 0.32, r * 0.22, r * 0.22, "#ffffff", null);
  if (gender === "female" || gender === "herm") {
    ctx.beginPath();
    ctx.moveTo(x - r * 1.15, y - r * 0.15);
    ctx.quadraticCurveTo(x - r * 0.1, y - r * 1.45, x + r * 1.2, y - r * 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + r * 0.2, y - r * 1.15);
    ctx.lineTo(x + r * 0.55, y - r * 1.7);
    ctx.moveTo(x - r * 0.15, y - r * 1.25);
    ctx.lineTo(x - r * 0.35, y - r * 1.85);
    ctx.stroke();
  }
}

function drawBody(ctx, kind, pal) {
  const fn = {
    fox: bodyFox,
    otter: bodyOtter,
    fawn: bodyFawn,
    boar: bodyBoar,
    bird: bodyBird,
    mole: bodyMole,
    beetle: bodyBeetle,
    bloom: bodyBloom,
    golem: bodyGolem,
    wisp: bodyWisp,
    grub: bodyGrub,
  }[kind] || bodyFox;
  fn(ctx, pal);
}

function bodyFox(ctx, p) {
  blob(ctx, -18, 100, 14, 16, p.shade, p.dark);
  blob(ctx, 8, 96, 38, 26, p.main, p.dark);
  blob(ctx, 16, 104, 20, 14, p.belly, null);
  blob(ctx, 30, 112, 11, 14, p.main, p.dark);
  blob(ctx, 32, 124, 12, 6, p.shade, p.dark);
  blob(ctx, -8, 118, 11, 8, p.shade, p.dark);
}

function bodyOtter(ctx, p) {
  blob(ctx, -6, 102, 40, 20, p.main, p.dark, -0.15);
  blob(ctx, 10, 108, 22, 12, p.belly, null);
  blob(ctx, 34, 114, 10, 12, p.shade, p.dark);
  blob(ctx, 36, 124, 11, 5, p.dark, null);
  blob(ctx, -24, 116, 10, 7, p.shade, p.dark);
}

function bodyFawn(ctx, p) {
  blob(ctx, -2, 108, 7, 22, p.shade, p.dark);
  blob(ctx, 18, 110, 7, 22, p.main, p.dark);
  blob(ctx, 10, 90, 32, 20, p.main, p.dark);
  blob(ctx, 18, 94, 14, 11, p.belly, null);
  blob(ctx, 24, 70, 9, 16, p.main, p.dark);
  blob(ctx, -2, 128, 8, 5, p.dark, null);
  blob(ctx, 18, 130, 8, 5, p.dark, null);
}

function bodyBoar(ctx, p) {
  blob(ctx, 0, 100, 40, 30, p.main, p.dark);
  blob(ctx, 10, 108, 22, 16, p.belly, null);
  blob(ctx, -16, 122, 12, 8, p.shade, p.dark);
  blob(ctx, 18, 124, 12, 8, p.shade, p.dark);
}

function bodyBird(ctx, p) {
  blob(ctx, 4, 96, 32, 26, p.main, p.dark);
  blob(ctx, 12, 104, 16, 14, p.belly, null);
  blob(ctx, 0, 122, 6, 10, p.accent, p.dark);
  blob(ctx, 16, 122, 6, 10, p.accent, p.dark);
  blob(ctx, 0, 132, 8, 4, p.accent, p.dark);
  blob(ctx, 16, 132, 8, 4, p.accent, p.dark);
}

function bodyMole(ctx, p) {
  blob(ctx, 0, 100, 36, 28, p.main, p.dark);
  blob(ctx, 8, 108, 18, 14, p.belly, null);
}

function bodyBeetle(ctx, p) {
  blob(ctx, -4, 100, 34, 26, p.shade, p.dark);
  blob(ctx, 18, 118, 7, 8, p.dark, null);
  blob(ctx, 4, 120, 7, 8, p.dark, null);
  blob(ctx, -12, 118, 7, 8, p.dark, null);
}

function bodyBloom(ctx, p) {
  blob(ctx, 0, 96, 10, 28, p.shade, p.dark);
  blob(ctx, -16, 100, 16, 8, p.accent, p.dark, -0.6);
  blob(ctx, 16, 104, 16, 8, p.accent, p.dark, 0.5);
  blob(ctx, -8, 126, 8, 5, p.shade, p.dark);
  blob(ctx, 8, 128, 8, 5, p.shade, p.dark);
}

function bodyGolem(ctx, p) {
  blob(ctx, -2, 108, 34, 18, p.shade, p.dark);
  blob(ctx, 2, 86, 28, 18, p.main, p.dark);
  blob(ctx, -14, 124, 12, 8, p.shade, p.dark);
  blob(ctx, 16, 126, 12, 8, p.main, p.dark);
}

function bodyWisp(ctx, p) {
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.moveTo(-28, 70);
  ctx.bezierCurveTo(-40, 100, -24, 130, -6, 126);
  ctx.quadraticCurveTo(0, 138, 10, 124);
  ctx.quadraticCurveTo(22, 140, 30, 118);
  ctx.bezierCurveTo(48, 96, 36, 64, 18, 62);
  ctx.bezierCurveTo(4, 78, -8, 74, -28, 70);
  ctx.closePath();
  ctx.fillStyle = p.main;
  ctx.fill();
  ctx.strokeStyle = p.dark;
  ctx.lineWidth = 3.2;
  ctx.stroke();
  blob(ctx, 4, 96, 14, 16, p.belly, null);
  ctx.restore();
}

function bodyGrub(ctx, p) {
  blob(ctx, -28, 100, 20, 18, p.shade, p.dark);
  blob(ctx, 0, 96, 22, 20, p.main, p.dark);
  blob(ctx, 26, 100, 18, 16, p.belly, p.dark);
}

function drawHead(ctx, kind, pal, gender, open, anchors) {
  const [hx, hy] = anchors.head;
  ctx.save();
  ctx.translate(hx, hy);
  const fn = {
    fox: headFox,
    otter: headOtter,
    fawn: headFawn,
    boar: headBoar,
    bird: headBird,
    mole: headMole,
    beetle: headBeetle,
    bloom: headBloom,
    golem: headGolem,
    wisp: headWisp,
    grub: headGrub,
  }[kind] || headFox;
  fn(ctx, pal, gender, open);
  ctx.restore();
}

function headFox(ctx, p, gender, open) {
  blob(ctx, 0, 0, 26, 24, p.main, p.dark);
  blob(ctx, 16, 6, 14, 11, p.belly, p.dark);
  blob(ctx, 28, 6, 4, 3.4, p.dark, null);
  eye(ctx, -4, -4, 7.2, p.accent, open, gender);
  eye(ctx, 10, -2, 6.4, p.accent, open, gender);
  ctx.strokeStyle = p.dark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(20, 12);
  ctx.quadraticCurveTo(26, 16, 22, 18);
  ctx.stroke();
}

function headOtter(ctx, p, gender, open) {
  blob(ctx, 0, 2, 24, 22, p.main, p.dark);
  blob(ctx, 14, 8, 13, 10, p.belly, p.dark);
  blob(ctx, 26, 8, 4.2, 3.2, p.dark, null);
  eye(ctx, -2, -2, 7.4, p.eye, open, gender);
  eye(ctx, 12, 0, 6.2, p.eye, open, gender);
  ctx.strokeStyle = p.shade;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(18, 6); ctx.lineTo(34, 2);
  ctx.moveTo(18, 10); ctx.lineTo(34, 10);
  ctx.moveTo(16, 14); ctx.lineTo(30, 16);
  ctx.stroke();
}

function headFawn(ctx, p, gender, open) {
  blob(ctx, 0, 4, 22, 20, p.main, p.dark);
  blob(ctx, 12, 8, 12, 9, p.belly, p.dark);
  blob(ctx, 22, 8, 3.4, 2.6, p.dark, null);
  eye(ctx, -2, 0, 7.5, p.eye, open, gender);
  eye(ctx, 10, 2, 6.2, p.eye, open, gender);
}

function headBoar(ctx, p, gender, open) {
  blob(ctx, 2, 2, 26, 22, p.main, p.dark);
  blob(ctx, 20, 8, 14, 11, p.belly, p.dark);
  blob(ctx, 28, 4, 5, 3, "#fff", p.dark, -0.4);
  blob(ctx, 26, 14, 5, 3, "#fff", p.dark, 0.4);
  blob(ctx, 30, 8, 4, 3, p.accent, null);
  eye(ctx, -2, -2, 6.4, p.eye, open, gender);
  eye(ctx, 10, 0, 5.4, p.eye, open, gender);
}

function headBird(ctx, p, gender, open) {
  blob(ctx, 0, 2, 22, 20, p.main, p.dark);
  poly(ctx, [[8, 4], [34, 8], [10, 16]], p.accent, p.dark);
  eye(ctx, -2, -2, 7.2, p.eye, open, gender);
  eye(ctx, 8, 0, 5.6, p.eye, open, gender);
}

function headMole(ctx, p, gender, open) {
  blob(ctx, 8, 4, 26, 20, p.main, p.dark);
  blob(ctx, 24, 8, 12, 9, p.accent2, p.dark);
  blob(ctx, 32, 8, 5, 4, "#e8899a", p.dark);
  eye(ctx, 2, 0, 5.5, p.eye, open, gender);
  eye(ctx, 14, 2, 4.6, p.eye, open, gender);
}

function headBeetle(ctx, p, gender, open) {
  blob(ctx, 0, 4, 18, 16, p.shade, p.dark);
  eye(ctx, -2, 2, 7, p.eye, open, gender);
  eye(ctx, 10, 4, 5.5, p.eye, open, gender);
}

function headBloom(ctx, p, gender, open) {
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    blob(ctx, Math.cos(a) * 20, Math.sin(a) * 18, 12, 16, i % 2 ? p.accent : p.main, p.dark, a);
  }
  blob(ctx, 0, 2, 14, 13, p.accent2, p.dark);
  eye(ctx, -4, 0, 4.6, p.eye, open, gender);
  eye(ctx, 5, 1, 4, p.eye, open, gender);
  ctx.beginPath();
  ctx.strokeStyle = p.dark;
  ctx.lineWidth = 2;
  ctx.arc(1, 8, 3, 0.1, Math.PI - 0.1);
  ctx.stroke();
}

function headGolem(ctx, p, gender, open) {
  blob(ctx, 6, 2, 24, 20, p.main, p.dark);
  blob(ctx, 16, 8, 10, 8, p.belly, null);
  eye(ctx, 0, 0, 6, p.accent, open, gender);
  eye(ctx, 12, 2, 5, 5, p.accent, open, gender);
  ctx.beginPath();
  ctx.strokeStyle = p.dark;
  ctx.lineWidth = 2.4;
  ctx.arc(8, 12, 5, 0.15, Math.PI - 0.15);
  ctx.stroke();
}

function headWisp(ctx, p, gender, open) {
  ctx.save();
  ctx.globalAlpha = 0.95;
  blob(ctx, 4, 2, 24, 22, p.main, p.dark);
  eye(ctx, -2, 0, 8, p.accent2, open, gender);
  eye(ctx, 12, 2, 6.5, p.accent2, open, gender);
  ctx.restore();
}

function headGrub(ctx, p, gender, open) {
  blob(ctx, 0, 2, 16, 15, p.belly, p.dark);
  eye(ctx, -3, 0, 5.5, p.eye, open, gender);
  eye(ctx, 6, 1, 4.4, p.eye, open, gender);
  ctx.beginPath();
  ctx.strokeStyle = p.dark;
  ctx.lineWidth = 2;
  ctx.arc(2, 8, 3.2, 0.2, Math.PI - 0.2);
  ctx.stroke();
}

function drawEars(ctx, kind, pal, anchors) {
  if (!kind || kind === "none") return;
  const [hx, hy] = anchors.head;
  ctx.save();
  ctx.translate(hx, hy);
  const fn = {
    pointed: earsPointed,
    round: earsRound,
    leaf: earsLeaf,
    tuft: earsTuft,
    tiny: earsTiny,
    antenna: earsAntenna,
    petal: earsPetal,
    nub: earsNub,
  }[kind];
  if (fn) fn(ctx, pal);
  ctx.restore();
}

function earsPointed(ctx, p) {
  poly(ctx, [[-18, -6], [-28, -36], [-4, -16]], p.main, p.dark);
  poly(ctx, [[2, -14], [-4, -40], [16, -18]], p.main, p.dark);
  poly(ctx, [[-16, -10], [-22, -28], [-8, -16]], p.belly, null);
  poly(ctx, [[4, -16], [2, -32], [12, -18]], p.belly, null);
}

function earsRound(ctx, p) {
  blob(ctx, -16, -14, 10, 12, p.main, p.dark);
  blob(ctx, 6, -18, 9, 11, p.main, p.dark);
  blob(ctx, -16, -14, 5, 6, p.belly, null);
  blob(ctx, 6, -18, 4.5, 5.5, p.belly, null);
}

function earsLeaf(ctx, p) {
  poly(ctx, [[-8, -8], [-24, -38], [-2, -16]], p.accent, p.dark);
  poly(ctx, [[6, -12], [4, -46], [22, -14]], p.accent, p.dark);
  ctx.beginPath();
  ctx.strokeStyle = p.shade;
  ctx.lineWidth = 2;
  ctx.moveTo(-8, -12); ctx.lineTo(-16, -30);
  ctx.moveTo(8, -14); ctx.lineTo(10, -36);
  ctx.stroke();
}

function earsTuft(ctx, p) {
  poly(ctx, [[-4, -14], [-2, -36], [10, -12]], p.accent, p.dark);
  poly(ctx, [[-14, -6], [-20, -22], [-6, -10]], p.main, p.dark);
}

function earsTiny(ctx, p) {
  blob(ctx, -14, -10, 6, 5, p.shade, p.dark);
  blob(ctx, 4, -12, 5, 4, p.shade, p.dark);
}

function earsAntenna(ctx, p) {
  ctx.strokeStyle = p.dark;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(-6, -8);
  ctx.quadraticCurveTo(-18, -28, -10, -40);
  ctx.moveTo(6, -8);
  ctx.quadraticCurveTo(16, -30, 22, -38);
  ctx.stroke();
  blob(ctx, -10, -42, 4.5, 4.5, p.accent, p.dark);
  blob(ctx, 24, -40, 4.5, 4.5, p.accent, p.dark);
}

function earsPetal(ctx, p) {
  blob(ctx, -16, -8, 8, 12, p.accent, p.dark, -0.8);
  blob(ctx, 14, -10, 8, 12, p.main, p.dark, 0.7);
}

function earsNub(ctx, p) {
  blob(ctx, -12, -12, 8, 7, p.shade, p.dark);
  blob(ctx, 10, -14, 7, 6, p.main, p.dark);
}

function drawTail(ctx, kind, pal, anchors) {
  if (!kind || kind === "none") return;
  const [tx, ty] = anchors.tail;
  ctx.save();
  ctx.translate(tx, ty);
  const fn = {
    flame: tailFlame,
    paddle: tailPaddle,
    leaf: tailLeaf,
    curl: tailCurl,
    fan: tailFan,
    stub: tailStub,
    pebble: tailPebble,
    wisp: tailWisp,
  }[kind];
  if (fn) fn(ctx, pal);
  ctx.restore();
}

function tailFlame(ctx, p) {
  flame(ctx, 0, 10, 26, 48, p.accent, p.dark);
  flame(ctx, 2, 8, 14, 32, p.accent2, null);
  blob(ctx, 10, 16, 12, 10, p.main, p.dark);
}

function tailPaddle(ctx, p) {
  blob(ctx, -6, 0, 28, 12, p.main, p.dark, -0.4);
  blob(ctx, -8, 2, 16, 6, p.belly, null, -0.4);
}

function tailLeaf(ctx, p) {
  poly(ctx, [[10, 6], [-18, -16], [-8, 16], [12, 10]], p.accent, p.dark);
}

function tailCurl(ctx, p) {
  ctx.beginPath();
  ctx.strokeStyle = p.shade;
  ctx.lineWidth = 6;
  ctx.moveTo(10, 4);
  ctx.bezierCurveTo(-10, -8, -24, 10, -8, 16);
  ctx.stroke();
  ctx.strokeStyle = p.dark;
  ctx.lineWidth = 3;
  ctx.stroke();
}

function tailFan(ctx, p) {
  poly(ctx, [[8, 0], [-22, -16], [-14, 0]], p.shade, p.dark);
  poly(ctx, [[8, 2], [-26, 0], [-12, 12]], p.main, p.dark);
  poly(ctx, [[8, 4], [-18, 14], [-4, 14]], p.shade, p.dark);
}

function tailStub(ctx, p) {
  blob(ctx, 0, 0, 8, 6, p.shade, p.dark);
}

function tailPebble(ctx, p) {
  blob(ctx, 0, 4, 10, 8, p.shade, p.dark);
  blob(ctx, -10, 8, 6, 5, p.main, p.dark);
}

function tailWisp(ctx, p) {
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.bezierCurveTo(-10, -12, -36, 8, -18, 18);
  ctx.bezierCurveTo(-6, 14, 0, 10, 8, 4);
  ctx.closePath();
  ctx.fillStyle = p.accent;
  ctx.fill();
  ctx.strokeStyle = p.dark;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawFeatherWings(ctx, p, anchors) {
  const [hx, hy] = anchors.head;
  blob(ctx, hx - 36, hy + 36, 26, 12, p.shade, p.dark, -0.5);
  blob(ctx, hx + 10, hy + 34, 22, 11, p.main, p.dark, 0.4);
  ctx.beginPath();
  ctx.strokeStyle = p.accent2;
  ctx.lineWidth = 2;
  ctx.moveTo(hx - 48, hy + 30); ctx.lineTo(hx - 20, hy + 40);
  ctx.moveTo(hx + 8, hy + 30); ctx.lineTo(hx + 28, hy + 38);
  ctx.stroke();
}

function drawShell(ctx, p) {
  blob(ctx, -6, 92, 30, 22, p.main, p.dark);
  blob(ctx, -6, 90, 22, 14, p.accent, null);
  ctx.beginPath();
  ctx.strokeStyle = p.dark;
  ctx.lineWidth = 3;
  ctx.moveTo(-6, 74);
  ctx.lineTo(-6, 112);
  ctx.stroke();
  blob(ctx, -6, 90, 8, 6, p.accent2, null);
}

function drawPattern(ctx, kind, pal, body) {
  if (kind === "spots") {
    const pts = body === "fawn"
      ? [[-4, 78], [12, 84], [2, 96], [20, 90]]
      : [[-10, 90], [8, 100], [18, 88]];
    for (const [x, y] of pts) blob(ctx, x, y, 5, 4, pal.belly, null);
  } else if (kind === "stripes") {
    ctx.strokeStyle = pal.shade;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-20, 90); ctx.lineTo(-8, 112);
    ctx.moveTo(-4, 86); ctx.lineTo(8, 110);
    ctx.stroke();
  } else if (kind === "cracks") {
    ctx.strokeStyle = pal.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 78); ctx.lineTo(2, 96); ctx.lineTo(-6, 112);
    ctx.moveTo(8, 84); ctx.lineTo(16, 102);
    ctx.stroke();
  } else if (kind === "glow") {
    const g = ctx.createRadialGradient(-6, 90, 4, -6, 90, 28);
    g.addColorStop(0, pal.accent2);
    g.addColorStop(1, "rgba(255,255,255,0)");
    blob(ctx, -6, 90, 18, 14, g, null);
  }
}

function drawBackExtra(ctx, extras, pal, anchors, gender) {
  for (const id of extras || []) {
    if (id === "sunflames") extraSun(ctx, pal, anchors, gender, true);
    if (id === "petals") extraPetals(ctx, pal, anchors);
    if (id === "mist") extraMist(ctx, pal, anchors);
  }
}

function drawFrontExtra(ctx, extras, pal, anchors, gender) {
  for (const id of extras || []) {
    if (id === "sunflames") extraSun(ctx, pal, anchors, gender, false);
    if (id === "bubbles") extraBubbles(ctx, pal, anchors);
    if (id === "blossom") extraBlossom(ctx, pal, anchors);
    if (id === "tusks") { /* déjà dans la tête */ }
    if (id === "shovels") extraShovels(ctx, pal, anchors);
    if (id === "sparks") extraSparks(ctx, pal, anchors);
    if (id === "crystal") extraCrystal(ctx, pal, anchors);
    if (id === "spikes") extraSpikes(ctx, pal, anchors);
  }
}

function extraSun(ctx, p, anchors, gender, back) {
  const [hx, hy] = anchors.head;
  const s = gender === "male" ? 1.15 : gender === "female" ? 0.8 : 1;
  if (back) {
    flame(ctx, hx - 8, hy + 6, 18 * s, 36 * s, p.accent, p.dark);
    flame(ctx, hx + 18, hy + 2, 14 * s, 28 * s, p.main, p.dark);
    flame(ctx, hx + 4, hy - 6, 12 * s, 26 * s, p.accent2, null);
  }
}

function extraPetals(ctx, p, anchors) {
  const [hx, hy] = anchors.head;
  blob(ctx, hx - 26, hy + 6, 10, 14, p.main, p.dark, -0.4);
  blob(ctx, hx + 26, hy + 4, 10, 14, p.accent, p.dark, 0.5);
}

function extraMist(ctx, p, anchors) {
  ctx.globalAlpha = 0.35;
  blob(ctx, anchors.head[0] - 10, 100, 36, 16, p.accent2, null);
  ctx.globalAlpha = 1;
}

function extraBubbles(ctx, p, anchors) {
  const [hx, hy] = anchors.head;
  blob(ctx, hx + 30, hy - 8, 6, 6, "rgba(255,255,255,0.85)", p.shade);
  blob(ctx, hx + 40, hy + 6, 4, 4, "rgba(255,255,255,0.7)", p.shade);
  blob(ctx, hx + 24, hy + 14, 3, 3, "rgba(255,255,255,0.8)", p.shade);
}

function extraBlossom(ctx, p, anchors) {
  const [hx, hy] = anchors.head;
  blob(ctx, hx + 8, hy - 28, 6, 6, "#F2A3C7", p.dark);
  blob(ctx, hx + 8, hy - 28, 2.4, 2.4, p.accent2, null);
}

function extraShovels(ctx, p, anchors) {
  blob(ctx, anchors.head[0] + 18, anchors.head[1] + 28, 16, 10, p.shade, p.dark, 0.4);
  blob(ctx, anchors.head[0] - 6, anchors.head[1] + 34, 14, 9, p.main, p.dark, -0.3);
  ctx.strokeStyle = p.belly;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(anchors.head[0] + 10, anchors.head[1] + 24);
  ctx.lineTo(anchors.head[0] + 26, anchors.head[1] + 30);
  ctx.stroke();
}

function extraSparks(ctx, p) {
  spark(ctx, 24, 70, p.accent2, p.dark);
  spark(ctx, -20, 78, p.accent, p.dark);
  spark(ctx, 8, 60, p.accent2, p.dark);
}

function spark(ctx, x, y, fill, stroke) {
  poly(ctx, [[x, y - 8], [x + 3, y - 2], [x + 8, y], [x + 3, y + 2], [x, y + 8], [x - 3, y + 2], [x - 8, y], [x - 3, y - 2]], fill, stroke);
}

function extraCrystal(ctx, p, anchors) {
  const [hx, hy] = anchors.head;
  poly(ctx, [[hx - 4, hy - 18], [hx + 4, hy - 34], [hx + 12, hy - 16]], p.accent, p.dark);
  poly(ctx, [[hx + 10, hy - 8], [hx + 18, hy - 24], [hx + 22, hy - 8]], p.accent2, p.dark);
}

function extraSpikes(ctx, p) {
  const spots = [[-28, 82], [-10, 74], [8, 76], [24, 84], [-18, 96]];
  for (const [x, y] of spots) {
    poly(ctx, [[x, y], [x + 6, y - 16], [x + 12, y]], p.accent, p.dark);
  }
}

function drawSexMarkers(ctx, gender, pal, anchors) {
  const [hx, hy] = anchors.head;
  if (gender === "male") {
    poly(ctx, [[hx - 2, hy - 22], [hx + 4, hy - 40], [hx + 12, hy - 20]], pal.accent, pal.dark);
  } else if (gender === "female") {
    ctx.globalAlpha = 0.55;
    blob(ctx, hx - 14, hy + 8, 6, 4, "#f3a0b5", null);
    blob(ctx, hx + 6, hy + 10, 5, 3.4, "#f3a0b5", null);
    ctx.globalAlpha = 1;
  } else if (gender === "herm") {
    blob(ctx, hx - 10, hy - 30, 5, 7, pal.accent, pal.dark);
    blob(ctx, hx + 8, hy - 32, 5, 7, pal.accent2, pal.dark);
    ctx.strokeStyle = pal.accent;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(hx - 12, hy + 8, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = pal.accent2;
    ctx.beginPath();
    ctx.arc(hx + 8, hy + 10, 4.2, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/** Pour les fusions : mélange simple de deux palettes, partie par partie. */
export function mixParts(a, b, pick) {
  const keys = ["body", "head", "ears", "tail", "wings", "pattern"];
  const parts = {};
  for (const k of keys) parts[k] = pick[k] === "b" ? b.parts[k] : a.parts[k];
  const extras = [...new Set([...(a.parts.extras || []), ...(b.parts.extras || [])])].slice(0, 3);
  parts.extras = extras;
  const palette = {};
  for (const key of Object.keys(a.palette)) {
    palette[key] = pick.palette === "b" ? b.palette[key] : a.palette[key];
  }
  return { parts, palette };
}
