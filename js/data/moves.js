/**
 * Attaques d'Ovalis.
 * category : "physical" | "special" | "status"
 * effect (optionnel) :
 *   { status, chance }              — empoisonne ou brûle
 *   { stat, target: "foe"|"self", stages }
 *
 * Pour en ajouter : une entrée ici, puis un renvoi dans le learnset d'une créature.
 */

export const MOVES = {
  elan:       { id: "elan",       name: "Élan",            type: "normal",   category: "physical", power: 40, accuracy: 100, pp: 30, desc: "Le compagnon fonce de tout son poids." },
  griffes:    { id: "griffes",    name: "Griffes vives",   type: "normal",   category: "physical", power: 40, accuracy: 100, pp: 30, desc: "Un coup de griffes rapide." },
  boutoir:    { id: "boutoir",    name: "Coup de boutoir", type: "normal",   category: "physical", power: 40, accuracy: 100, pp: 30, desc: "Un choc frontal." },
  ruade:      { id: "ruade",      name: "Ruade",           type: "normal",   category: "physical", power: 55, accuracy: 95,  pp: 20, desc: "Une ruade puissante." },
  cri:        { id: "cri",        name: "Cri perçant",     type: "normal",   category: "status",   power: 0,  accuracy: 100, pp: 30, desc: "Un cri qui baisse la défense de l'adversaire.", effect: { stat: "def", target: "foe", stages: -1 } },
  regard:     { id: "regard",     name: "Regard ferme",    type: "normal",   category: "status",   power: 0,  accuracy: 100, pp: 25, desc: "Un regard qui baisse l'attaque de l'adversaire.", effect: { stat: "atk", target: "foe", stages: -1 } },
  carapace:   { id: "carapace",   name: "Carapace",        type: "normal",   category: "status",   power: 0,  accuracy: 100, pp: 25, desc: "Le compagnon se protège. Sa défense augmente.", effect: { stat: "def", target: "self", stages: 1 } },
  danse:      { id: "danse",      name: "Danse vive",      type: "normal",   category: "status",   power: 0,  accuracy: 100, pp: 20, desc: "Une danse qui augmente la vitesse.", effect: { stat: "spe", target: "self", stages: 1 } },

  etincelle:  { id: "etincelle",  name: "Étincelle vive",  type: "feu",      category: "special",  power: 40, accuracy: 100, pp: 25, desc: "Une gerbe d'étincelles. Peut brûler.", effect: { status: "burn", chance: 0.1 } },
  souffle:    { id: "souffle",    name: "Souffle ardent",  type: "feu",      category: "special",  power: 65, accuracy: 100, pp: 15, desc: "Un souffle de chaleur. Peut brûler.", effect: { status: "burn", chance: 0.1 } },

  jetSource:  { id: "jetSource",  name: "Jet de source",   type: "eau",      category: "special",  power: 40, accuracy: 100, pp: 25, desc: "Un jet d'eau claire." },
  vague:      { id: "vague",      name: "Vague courte",    type: "eau",      category: "special",  power: 60, accuracy: 100, pp: 15, desc: "Une vague qui clapote fort." },

  claque:     { id: "claque",     name: "Claque feuillue", type: "plante",   category: "physical", power: 45, accuracy: 100, pp: 25, desc: "Une feuille claque comme un fouet." },
  seve:       { id: "seve",       name: "Sève vive",       type: "plante",   category: "special",  power: 55, accuracy: 100, pp: 15, desc: "Une sève brillante gicle vers l'adversaire." },

  eclat:      { id: "eclat",      name: "Éclat court",     type: "electrik", category: "special",  power: 40, accuracy: 100, pp: 25, desc: "Une petite décharge." },
  choc:       { id: "choc",       name: "Choc brillant",   type: "electrik", category: "special",  power: 60, accuracy: 100, pp: 15, desc: "Un éclair sec et lumineux." },

  bec:        { id: "bec",        name: "Bec vif",         type: "vol",      category: "physical", power: 40, accuracy: 100, pp: 30, desc: "Un coup de bec." },
  bourrasque: { id: "bourrasque", name: "Bourrasque",      type: "vol",      category: "special",  power: 50, accuracy: 100, pp: 20, desc: "Un coup de vent." },

  terre:      { id: "terre",      name: "Jet de terre",    type: "sol",      category: "special",  power: 40, accuracy: 100, pp: 25, desc: "Une poignée de terre lancée au visage." },
  pietine:    { id: "pietine",    name: "Piétinement",     type: "sol",      category: "physical", power: 55, accuracy: 95,  pp: 20, desc: "Le sol tremble sous les pattes." },

  dard:       { id: "dard",       name: "Dard net",        type: "insecte",  category: "physical", power: 40, accuracy: 100, pp: 25, desc: "Un dard précis." },
  cisailles:  { id: "cisailles",  name: "Cisailles",       type: "insecte",  category: "physical", power: 55, accuracy: 95,  pp: 15, desc: "De grosses pinces se referment." },

  caillou:    { id: "caillou",    name: "Jet de caillou",  type: "roche",    category: "physical", power: 45, accuracy: 95,  pp: 20, desc: "Un caillou lancé vite." },
  roulade:    { id: "roulade",    name: "Roulade pierre",  type: "roche",    category: "physical", power: 60, accuracy: 90,  pp: 15, desc: "Le compagnon roule comme un rocher." },

  ombre:      { id: "ombre",      name: "Ombre lente",     type: "spectre",  category: "special",  power: 40, accuracy: 100, pp: 25, desc: "Une ombre froide effleure l'adversaire." },
  frisson:    { id: "frisson",    name: "Frisson",         type: "spectre",  category: "special",  power: 55, accuracy: 100, pp: 15, desc: "Un frisson qui traverse le corps." },

  amer:       { id: "amer",       name: "Dard amer",       type: "poison",   category: "physical", power: 35, accuracy: 100, pp: 25, desc: "Un dard qui peut empoisonner.", effect: { status: "poison", chance: 0.3 } },
  nuage:      { id: "nuage",      name: "Nuage âcre",      type: "poison",   category: "special",  power: 50, accuracy: 100, pp: 15, desc: "Un nuage piquant. Peut empoisonner.", effect: { status: "poison", chance: 0.2 } },

  poussiere:  { id: "poussiere",  name: "Poussière tendre", type: "fee",     category: "special",  power: 40, accuracy: 100, pp: 25, desc: "Une poussière douce et brillante." },
  eclatTendre:{ id: "eclatTendre",name: "Éclat tendre",   type: "fee",      category: "special",  power: 55, accuracy: 100, pp: 15, desc: "Une lumière douce mais vive." },

  ultime:     { id: "ultime",     name: "Ultime effort",   type: "normal",   category: "physical", power: 35, accuracy: 100, pp: 99, desc: "Un dernier effort, quand plus aucune attaque n'a d'usages.", recoil: 0.25 },
};

export function getMove(id) {
  return MOVES[id];
}
