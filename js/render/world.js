/** Tuiles dessinées en formes nettes, pas en pixels. */

import { hash2 } from "../core/util.js";

export const TILE = 48;

export function drawMap(ctx, map, cam, time) {
  const viewW = ctx.canvas.clientWidth || 800;
  const viewH = ctx.canvas.clientHeight || 400;
  const x0 = Math.max(0, Math.floor(cam.x / TILE) - 1);
  const y0 = Math.max(0, Math.floor(cam.y / TILE) - 1);
  const x1 = Math.min(map.w - 1, Math.ceil((cam.x + viewW) / TILE) + 1);
  const y1 = Math.min(map.h - 1, Math.ceil((cam.y + viewH) / TILE) + 1);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      drawTile(ctx, map.tiles[y][x], x * TILE - cam.x, y * TILE - cam.y, x, y, time, map.indoors);
    }
  }
}

function drawTile(ctx, tile, x, y, tx, ty, time, indoors) {
  const h = hash2(tx, ty);
  if (indoors && tile !== "b" && tile !== "d" && tile !== "c" && tile !== "k" && tile !== "m") {
    ctx.fillStyle = (tx + ty) % 2 === 0 ? "#E7D3B0" : "#F3E6CC";
    ctx.fillRect(x, y, TILE, TILE);
  } else if (!indoors) {
    ctx.fillStyle = h > 0.5 ? "#73B84E" : "#68AD45";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.beginPath();
    ctx.ellipse(x + 12 + h * 18, y + 28, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  switch (tile) {
    case "p":
      ctx.fillStyle = "#E4C48A";
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = "#D2AE70";
      ctx.fillRect(x + 6, y + 8, 14, 10);
      ctx.fillRect(x + 26, y + 28, 16, 10);
      break;
    case ",":
      flower(ctx, x + 16, y + 28, "#F2A3C7");
      flower(ctx, x + 32, y + 18, "#F2D48A");
      flower(ctx, x + 22, y + 14, "#fff");
      break;
    case "t": {
      ctx.fillStyle = "#3E8E3A";
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = "#1E5A28";
      ctx.lineWidth = 2;
      const sway = Math.sin(time * 2 + tx) * 2;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(x + 6 + i * 8, y + TILE);
        ctx.quadraticCurveTo(x + 4 + i * 8 + sway, y + 16, x + 8 + i * 8, y + 6);
        ctx.stroke();
      }
      break;
    }
    case "w":
      ctx.fillStyle = "#2F86D6";
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = "rgba(255,255,255,0.65)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 6, y + 16 + Math.sin(time * 2 + ty) * 2);
      ctx.quadraticCurveTo(x + 24, y + 10, x + 42, y + 18);
      ctx.moveTo(x + 8, y + 32);
      ctx.quadraticCurveTo(x + 26, y + 26, x + 40, y + 34);
      ctx.stroke();
      break;
    case "r":
      ctx.fillStyle = "#D4654A";
      ctx.fillRect(x, y, TILE, TILE + 2);
      ctx.fillStyle = "#A84832";
      ctx.fillRect(x, y + TILE * 0.45, TILE, 4);
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(x + 4, y + 6, 10, 6);
      break;
    case "b":
      ctx.fillStyle = "#F3E6CF";
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = "#CDB892";
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 4, y + 8, TILE - 8, TILE - 16);
      ctx.fillStyle = "#9FD0E8";
      ctx.fillRect(x + 10, y + 12, 12, 10);
      break;
    case "d":
      ctx.fillStyle = indoors ? "#E7D3B0" : "#E4C48A";
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = "#8C5A32";
      ctx.fillRect(x + 10, y + 6, 28, 40);
      ctx.fillStyle = "#F2D48A";
      ctx.beginPath();
      ctx.arc(x + 30, y + 28, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "c":
      ctx.fillStyle = "#C4A574";
      ctx.fillRect(x, y + 8, TILE, TILE - 8);
      ctx.fillStyle = "#8C5A32";
      ctx.fillRect(x, y + 8, TILE, 6);
      break;
    case "s":
      ctx.fillStyle = indoors ? "#E7D3B0" : "#73B84E";
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = "#8C5A32";
      ctx.fillRect(x + 20, y + 18, 8, 26);
      ctx.fillStyle = "#F7F1E4";
      ctx.fillRect(x + 8, y + 8, 32, 18);
      ctx.strokeStyle = "#1a1208";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 8, y + 8, 32, 18);
      break;
    case "k":
      ctx.fillStyle = indoors ? "#E7D3B0" : "#73B84E";
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = "#24344A";
      ctx.fillRect(x + 8, y + 10, 32, 24);
      ctx.fillStyle = "#8FDBFF";
      ctx.fillRect(x + 12, y + 14, 24, 12);
      break;
    case "m":
      ctx.fillStyle = "#E7D3B0";
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = "#F2D0DC";
      ctx.fillRect(x + 6, y + 14, 36, 22);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(x + 8, y + 16, 16, 10);
      break;
    case "#":
      ctx.fillStyle = "#67A844";
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = "#8B5A32";
      ctx.fillRect(x + 20, y + 28, 8, 18);
      ctx.fillStyle = "#2F7A34";
      ctx.beginPath();
      ctx.arc(x + 24, y + 22, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3E9444";
      ctx.beginPath();
      ctx.arc(x + 18, y + 18, 8, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "=":
      ctx.fillStyle = "#C4A574";
      ctx.fillRect(x, y + 16, TILE, 8);
      ctx.fillRect(x, y + 30, TILE, 8);
      break;
    default:
      break;
  }
}

function flower(ctx, x, y, color) {
  ctx.fillStyle = "#3E8E3A";
  ctx.fillRect(x - 1, y, 2, 8);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#F2D48A";
  ctx.beginPath();
  ctx.arc(x, y, 1.6, 0, Math.PI * 2);
  ctx.fill();
}

export function cameraFor(px, py, map, viewW, viewH) {
  let x = px - viewW / 2;
  let y = py - viewH / 2;
  const maxX = map.w * TILE - viewW;
  const maxY = map.h * TILE - viewH;
  if (maxX <= 0) x = maxX / 2;
  else x = Math.max(0, Math.min(maxX, x));
  if (maxY <= 0) y = maxY / 2;
  else y = Math.max(0, Math.min(maxY, y));
  return { x, y };
}
