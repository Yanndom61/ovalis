/** Musique et bruitages simples, générés sur l'appareil. Rien à télécharger. */

const SONGS = {
  title: { bpm: 86, loop: ["E4 G4 A4 G4 E4 D4 C4 E4", "C3 . G3 . A3 . E3 ."] },
  town: { bpm: 100, loop: ["E4 G4 A4 C5 A4 G4 E4 D4", "C3 G3 A3 E3 F3 C3 G3 C3"] },
  route: { bpm: 118, loop: ["G4 A4 B4 D5 B4 A4 G4 E4", "G3 D3 A3 E3 G3 D3 C3 G3"] },
  battle: { bpm: 138, loop: ["A3 C4 E4 A4 G3 B3 D4 G4", "A2 . E3 . G2 . D3 ."] },
  win: { bpm: 120, loop: ["C5 E5 G5 C6", "C4 E4 G4 C5"], once: true },
  heal: { bpm: 110, loop: ["C5 E5 G5 E5 C5", "C4 G4 C5"], once: true },
};

const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function freq(token) {
  if (!token || token === ".") return 0;
  const m = token.match(/^([A-G])(\d)$/);
  if (!m) return 0;
  const semi = NOTE[m[1]] + (Number(m[2]) - 4) * 12;
  return 261.63 * Math.pow(2, semi / 12);
}

export function createAudio() {
  let ctx = null;
  let master = null;
  let musicGain = null;
  let timer = null;
  let current = null;
  let enabled = true;

  function ensure() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.18;
    musicGain.connect(master);
  }

  function resume() {
    ensure();
    if (ctx && ctx.state === "suspended") ctx.resume();
  }

  function setEnabled(on) {
    enabled = on;
    if (master) master.gain.value = on ? 0.9 : 0;
    if (!on) stopMusic();
  }

  function tone(frequency, dur, type, gain, when, dest) {
    if (!ctx || !frequency) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = frequency;
    g.gain.setValueAtTime(gain, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    o.connect(g);
    g.connect(dest);
    o.start(when);
    o.stop(when + dur + 0.02);
  }

  function play(name) {
    if (!enabled) return;
    ensure();
    if (!ctx) return;
    if (current === name && timer) return;
    stopMusic();
    const song = SONGS[name];
    if (!song) return;
    current = name;
    const beat = 60 / song.bpm;
    const lines = song.loop.map((row) => row.split(/\s+/));
    const steps = lines[0].length;
    const loopDur = steps * beat;
    const start = ctx.currentTime + 0.05;
    const schedule = (origin) => {
      lines.forEach((line, li) => {
        line.forEach((token, i) => {
          const f = freq(token);
          if (!f) return;
          tone(f, beat * 0.9, li === 0 ? "triangle" : "sine", li === 0 ? 0.2 : 0.12, origin + i * beat, musicGain);
        });
      });
    };
    schedule(start);
    if (!song.once) {
      timer = window.setInterval(() => {
        if (!ctx || current !== name) return;
        schedule(ctx.currentTime + 0.05);
      }, loopDur * 1000);
    }
  }

  function stopMusic() {
    if (timer) window.clearInterval(timer);
    timer = null;
    current = null;
  }

  function sfx(kind) {
    if (!enabled) return;
    ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    const blip = (f, d, type = "square", g = 0.12) => tone(f, d, type, g, t, master);
    if (kind === "ok") { blip(523, 0.08); tone(659, 0.1, "square", 0.1, t + 0.07, master); }
    else if (kind === "cancel") { blip(392, 0.08); tone(262, 0.1, "square", 0.08, t + 0.06, master); }
    else if (kind === "hit") { blip(180, 0.09, "sawtooth", 0.08); }
    else if (kind === "super") { blip(520, 0.08, "square", 0.1); tone(780, 0.12, "square", 0.08, t + 0.06, master); }
    else if (kind === "faint") { blip(440, 0.12, "triangle", 0.12); tone(220, 0.2, "triangle", 0.1, t + 0.1, master); }
    else if (kind === "catch") {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.12, "triangle", 0.12, t + i * 0.09, master));
    } else if (kind === "heal") {
      [523, 659, 784].forEach((f, i) => tone(f, 0.14, "sine", 0.12, t + i * 0.08, master));
    } else if (kind === "miss") { blip(140, 0.1, "square", 0.05); }
  }

  return { resume, setEnabled, play, stopMusic, sfx };
}
