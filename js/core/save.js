/** Sauvegarde sur le téléphone, plus un fichier pour changer d'appareil. */

import { defaultSettings } from "./state.js";

export const SAVE_KEY = "ovalis-save-v1";
export const SETTINGS_KEY = "ovalis-settings";

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings();
    return { ...defaultSettings(), ...JSON.parse(raw) };
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function normalizeSave(data) {
  if (!data || data.v !== 1) throw new Error("version");
  if (!data.hero || typeof data.hero.name !== "string") throw new Error("hero");
  if (!Array.isArray(data.party)) throw new Error("party");
  data.boxes = Array.isArray(data.boxes) && data.boxes.length
    ? data.boxes
    : [{ name: "Boîte 1", creatures: [] }];
  data.bag = data.bag || {};
  data.money = data.money || 0;
  data.flags = data.flags || {};
  data.flags.trainers = data.flags.trainers || {};
  data.dex = data.dex || { seen: {}, caught: {} };
  data.dex.seen = data.dex.seen || {};
  data.dex.caught = data.dex.caught || {};
  data.pos = data.pos || { map: "lab", x: 7, y: 7, dir: "up" };
  data.playMs = data.playMs || 0;
  data.settings = { ...defaultSettings(), ...(data.settings || {}) };
  return data;
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return normalizeSave(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeSave(state) {
  const json = JSON.stringify(state);
  localStorage.setItem(SAVE_KEY, json);
  if (state.settings) saveSettings(state.settings);
  return json;
}

export function hasSave() {
  return !!localStorage.getItem(SAVE_KEY);
}

export function exportSave(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "ovalis-sauvegarde.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

export function pickSaveFile() {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.addEventListener("change", () => {
      const file = input.files && input.files[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => {
        try {
          resolve(normalizeSave(JSON.parse(String(reader.result))));
        } catch {
          resolve({ error: "Ce fichier ne ressemble pas à une sauvegarde d'Ovalis." });
        }
      };
      reader.onerror = () => resolve({ error: "Impossible de lire le fichier." });
      reader.readAsText(file);
    });
    input.click();
  });
}
