/** Héros et personnages, vus de trois quarts pour que le visage reste lisible. */

const OUTFITS = {
  tunic: { body: "#2E6FBE", leg: "#1C3E72", trim: "#F4E4C4" },
  jupe: { body: "#C44973", leg: "#F6D5E2", trim: "#FFF8F2", skirt: true },
  cape: { body: "#14867F", leg: "#0E4E4A", trim: "#F2D48A", cape: true },
  blouse: { body: "#F4F7FB", leg: "#3D6E98", trim: "#2E6FBE", coat: true },
  soin: { body: "#E7FFFB", leg: "#146E68", trim: "#E24B6A" },
  tablier: { body: "#F3E2C0", leg: "#5C4030", trim: "#8C5A32", apron: true },
  casquette: { body: "#D23B3B", leg: "#2A3A50", trim: "#FFFFFF", cap: true },
};

export function drawPerson(ctx, p, x, y, scale = 1) {
  const dir = p.dir || "down";
  const frame = p.frame || 0;
  const step = Math.sin(frame) * 3.2;
  const outfit = OUTFITS[p.outfit] || OUTFITS.tunic;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.fillStyle = "rgba(10,16,28,0.28)";
  ctx.beginPath();
  ctx.ellipse(0, 1, 13, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  if (dir === "left") ctx.scale(-1, 1);

  if (p.hairStyle === "long" || p.hairStyle === "chignon") {
    ctx.fillStyle = p.hair;
    round(ctx, -8, -40, 16, 28, 6);
    ctx.fill();
  }
  if (p.hairStyle === "boucle") {
    ctx.fillStyle = p.hair;
    circle(ctx, -12, -30, 7);
    circle(ctx, 12, -30, 7);
  }

  fillRound(ctx, -8, -16 + (dir === "up" ? 0 : step), 6, 14, 3, outfit.leg);
  fillRound(ctx, 2, -16 - (dir === "up" ? 0 : step), 6, 14, 3, outfit.leg);

  if (outfit.skirt) {
    fillRound(ctx, -11, -32, 22, 14, 6, outfit.body);
    ctx.fillStyle = outfit.leg;
    ctx.beginPath();
    ctx.moveTo(-10, -20);
    ctx.lineTo(10, -20);
    ctx.lineTo(16, -4);
    ctx.lineTo(-16, -4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#1a1208";
    ctx.lineWidth = 2;
    ctx.stroke();
    fillRound(ctx, -9, -6, 6, 8, 3, "#6a3048");
    fillRound(ctx, 3, -6, 6, 8, 3, "#6a3048");
  } else {
    fillRound(ctx, -11, -32, 22, 18, 6, outfit.body);
  }

  if (outfit.cape) fillRound(ctx, -13, -34, 8, 22, 4, "#0E5C58");
  if (outfit.coat) {
    fillRound(ctx, -12, -33, 24, 20, 6, "#FFFFFF");
    ctx.fillStyle = outfit.trim;
    ctx.fillRect(-2, -30, 4, 16);
  }
  if (outfit.apron) fillRound(ctx, -8, -28, 16, 14, 4, "#F7F1E4");
  if (outfit === OUTFITS.soin) {
    ctx.fillStyle = outfit.trim;
    circle(ctx, 6, -22, 3.2);
  }

  ctx.fillStyle = outfit.trim;
  ctx.fillRect(-12, -24, 5, 4);
  ctx.fillRect(7, -24, 5, 4);

  // Tête
  ctx.fillStyle = p.skin;
  circle(ctx, 0, -40, 12);
  ctx.strokeStyle = "#1a1208";
  ctx.lineWidth = 2.2;
  ctx.stroke();

  if (dir !== "up") {
    const eyes = p.eyes || "#2F5F8A";
    if (dir === "down") {
      eye(ctx, -4.2, -41, eyes);
      eye(ctx, 4.2, -41, eyes);
      ctx.fillStyle = "#c47a74";
      ctx.fillRect(-2, -35.5, 4, 1.6);
    } else {
      eye(ctx, 4.5, -41, eyes);
      ctx.fillStyle = "#c47a74";
      ctx.fillRect(3, -36, 3, 1.4);
    }
  }

  drawHair(ctx, p, dir);

  if ((p.hairStyle === "long" || p.hairStyle === "moyen") && dir !== "up") {
    const drop = p.hairStyle === "long" ? 34 : 18;
    fillRound(ctx, -16, -48, 6, drop, 3, p.hair);
    fillRound(ctx, 10, -48, 6, drop, 3, p.hair);
  }

  if (outfit.cap || p.outfit === "casquette") {
    ctx.fillStyle = outfit.body;
    ctx.beginPath();
    ctx.ellipse(0, -46, 13, 6, 0, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = "#1a1208";
    ctx.lineWidth = 2;
    ctx.stroke();
    if (dir !== "up") {
      ctx.fillStyle = outfit.body;
      round(ctx, -2, -44, 14, 4, 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawHair(ctx, p, dir) {
  ctx.fillStyle = p.hair;
  ctx.strokeStyle = "#1a1208";
  ctx.lineWidth = 2;
  if (dir === "up") {
    circle(ctx, 0, -42, 12.4);
    if (p.hairStyle === "chignon") circle(ctx, 0, -54, 6);
    if (p.hairStyle === "boucle") {
      circle(ctx, -11, -40, 6);
      circle(ctx, 11, -40, 6);
    }
    return;
  }
  if (p.hairStyle === "chignon") {
    ctx.beginPath();
    ctx.arc(0, -44, 12, Math.PI, 0);
    ctx.fill();
    circle(ctx, 0, -56, 5.5);
    return;
  }
  if (p.hairStyle === "court") {
    ctx.beginPath();
    ctx.arc(0, -42, 12.2, Math.PI * 1.05, -0.05);
    ctx.fill();
    return;
  }
  if (p.hairStyle === "moyen") {
    ctx.beginPath();
    ctx.arc(0, -42, 12.4, Math.PI * 1.02, -0.02);
    ctx.fill();
    fillRound(ctx, -13, -44, 5, 12, 3, p.hair);
    fillRound(ctx, 8, -44, 5, 12, 3, p.hair);
    return;
  }
  if (p.hairStyle === "long") {
    ctx.beginPath();
    ctx.arc(0, -42, 12.4, Math.PI, 0);
    ctx.fill();
    return;
  }
  if (p.hairStyle === "boucle") {
    ctx.beginPath();
    ctx.arc(0, -44, 12, Math.PI, 0);
    ctx.fill();
    circle(ctx, -11, -38, 5.5);
    circle(ctx, 11, -38, 5.5);
  }
}

function eye(ctx, x, y, color) {
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.ellipse(x, y, 2.5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y + 0.4, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(x - 0.6, y - 0.6, 0.6, 0, Math.PI * 2);
  ctx.fill();
}

function fillRound(ctx, x, y, w, h, r, color) {
  ctx.fillStyle = color;
  round(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.strokeStyle = "#1a1208";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function round(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
