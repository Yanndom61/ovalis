/** Clavier, joystick du pouce gauche, boutons A et B. */

export function createInput(allowStick) {
  const keys = new Set();
  const state = {
    joy: { on: false, x: 0, y: 0, ox: 0, oy: 0, kx: 0, ky: 0, id: null },
    a: false,
    b: false,
    justA: false,
    justB: false,
    dirEdge: null,
    direction: null,
  };
  let wasA = false;
  let wasB = false;
  let lastDir = null;
  let axis = "y";

  function readDir() {
    let x = 0;
    let y = 0;
    if (keys.has("up")) y -= 1;
    if (keys.has("down")) y += 1;
    if (keys.has("left")) x -= 1;
    if (keys.has("right")) x += 1;
    if (x || y) {
      if (x && y) {
        if (axis === "x") return x > 0 ? "right" : "left";
        return y > 0 ? "down" : "up";
      }
      if (x) return x > 0 ? "right" : "left";
      return y > 0 ? "down" : "up";
    }
    const j = state.joy;
    if (j.on && Math.hypot(j.x, j.y) > 0.42) {
      if (Math.abs(j.x) > Math.abs(j.y)) return j.x > 0 ? "right" : "left";
      return j.y > 0 ? "down" : "up";
    }
    return null;
  }

  function beginFrame() {
    const a = state.a || keys.has("confirm");
    const b = state.b || keys.has("cancel");
    state.justA = (a && !wasA) || state._tap;
    state.justB = b && !wasB;
    wasA = a;
    wasB = b;
    state._tap = false;
    const d = readDir();
    state.dirEdge = d && d !== lastDir ? d : null;
    lastDir = d;
    state.direction = d;
  }

  window.addEventListener("keydown", (e) => {
    if (e.target && e.target.matches("input, textarea")) return;
    if (e.target && e.target.matches("button") && (e.key === "Enter" || e.key === " ")) return;
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    const map = {
      arrowup: "up", arrowdown: "down", arrowleft: "left", arrowright: "right",
      w: "up", s: "down", a: "left", d: "right",
    };
    if (map[k]) {
      keys.add(map[k]);
      axis = map[k] === "left" || map[k] === "right" ? "x" : "y";
      e.preventDefault();
    }
    if (k === "z" || k === "enter" || k === " ") {
      keys.add("confirm");
      e.preventDefault();
    }
    if (k === "x" || k === "escape" || k === "backspace") {
      keys.add("cancel");
      e.preventDefault();
    }
  });
  window.addEventListener("keyup", (e) => {
    const k = e.key.toLowerCase();
    const map = {
      arrowup: "up", arrowdown: "down", arrowleft: "left", arrowright: "right",
      w: "up", s: "down", a: "left", d: "right",
    };
    if (map[k]) keys.delete(map[k]);
    if (k === "z" || k === "enter" || k === " ") keys.delete("confirm");
    if (k === "x" || k === "escape" || k === "backspace") keys.delete("cancel");
  });
  window.addEventListener("blur", () => {
    keys.clear();
    state.a = false;
    state.b = false;
    state.joy.on = false;
  });

  function bind(zone, btnA, btnB, stick) {
    const joy = state.joy;
    zone.addEventListener("pointerdown", (e) => {
      if (!allowStick()) return;
      joy.on = true;
      joy.id = e.pointerId;
      joy.ox = e.clientX;
      joy.oy = e.clientY;
      joy.x = 0;
      joy.y = 0;
      joy.kx = 0;
      joy.ky = 0;
      zone.setPointerCapture(e.pointerId);
    });
    zone.addEventListener("pointermove", (e) => {
      if (!joy.on || e.pointerId !== joy.id) return;
      const dx = e.clientX - joy.ox;
      const dy = e.clientY - joy.oy;
      const max = 56;
      const dist = Math.hypot(dx, dy) || 1;
      const c = dist > max ? max / dist : 1;
      joy.kx = dx * c;
      joy.ky = dy * c;
      joy.x = joy.kx / max;
      joy.y = joy.ky / max;
    });
    const endJoy = (e) => {
      if (e.pointerId !== joy.id) return;
      joy.on = false;
      joy.id = null;
    };
    zone.addEventListener("pointerup", endJoy);
    zone.addEventListener("pointercancel", endJoy);

    const hold = (btn, key) => {
      btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        state[key] = true;
        btn.setPointerCapture(e.pointerId);
      });
      const up = () => { state[key] = false; };
      btn.addEventListener("pointerup", up);
      btn.addEventListener("pointercancel", up);
    };
    hold(btnA, "a");
    hold(btnB, "b");

    state._stick = stick;
  }

  function paintStick() {
    const stick = state._stick;
    if (!stick) return;
    const knob = stick.querySelector("div");
    if (!state.joy.on) {
      stick.hidden = true;
      return;
    }
    stick.hidden = false;
    stick.style.left = `${state.joy.ox}px`;
    stick.style.top = `${state.joy.oy}px`;
    knob.style.transform = `translate(${state.joy.kx}px, ${state.joy.ky}px)`;
  }

  function tap() { state._tap = true; }

  return { state, beginFrame, bind, paintStick, tap, direction: () => state.direction };
}
