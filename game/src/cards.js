// Cinder Court — card catalogue.
// Four ember houses, each told apart by colour AND glyph, never by text alone:
// Flame ▲ red, Tide ≈ blue, Thorn ✦ green, Stone ◆ amber.
// Every card carries a mana cost, an attack and a health (creatures), or a
// one-shot effect (spells). Nothing here names a commercial game.

export const HOUSES = {
  flame: { name: 'Flame', glyph: '▲', color: '#e5484d', dark: '#7a1f22' },
  tide: { name: 'Tide', glyph: '≈', color: '#3e8fd9', dark: '#174a75' },
  thorn: { name: 'Thorn', glyph: '✦', color: '#46a35e', dark: '#1e4d2b' },
  stone: { name: 'Stone', glyph: '◆', color: '#d9a03e', dark: '#6e4d14' },
};

// id, house, kind, cost, attack, health, text, guard?, heal?
export const CARD_DEFS = [
  // Flame — fast, direct, fragile.
  { id: 'ember-imp', house: 'flame', kind: 'creature', cost: 1, attack: 2, health: 1, name: 'Ember Imp', text: 'Quick spark.' },
  { id: 'cinder-hound', house: 'flame', kind: 'creature', cost: 2, attack: 3, health: 2, name: 'Cinder Hound', text: 'Runs hot.' },
  { id: 'pyre-knight', house: 'flame', kind: 'creature', cost: 3, attack: 4, health: 3, name: 'Pyre Knight', text: 'Oath of ash.' },
  { id: 'flame-warden', house: 'flame', kind: 'creature', cost: 4, attack: 5, health: 5, name: 'Flame Warden', text: 'Keeps the hearth.' },
  { id: 'ember-burst', house: 'flame', kind: 'spell', cost: 2, name: 'Ember Burst', text: 'Deal 3 to the Regent.' },
  { id: 'inferno', house: 'flame', kind: 'spell', cost: 5, name: 'Inferno', text: 'Deal 5 to the Regent.' },
  // Tide — draws, guards, sweeps.
  { id: 'tide-sprite', house: 'tide', kind: 'creature', cost: 1, attack: 1, health: 2, name: 'Tide Sprite', text: 'Rides the swell.' },
  { id: 'mist-serpent', house: 'tide', kind: 'creature', cost: 2, attack: 2, health: 3, name: 'Mist Serpent', text: 'Coils in fog.' },
  { id: 'deep-draw', house: 'tide', kind: 'spell', cost: 2, name: 'Deep Draw', text: 'Draw 2 cards.' },
  { id: 'coral-guard', house: 'tide', kind: 'creature', cost: 3, attack: 2, health: 5, name: 'Coral Guard', text: 'Guard.', guard: true },
  { id: 'stormcaller', house: 'tide', kind: 'creature', cost: 4, attack: 4, health: 4, name: 'Stormcaller', text: 'Calls the rain.' },
  { id: 'tidal-wave', house: 'tide', kind: 'spell', cost: 4, name: 'Tidal Wave', text: 'Deal 2 to every enemy creature.' },
  // Thorn — tough, wide, healing.
  { id: 'briar-sprout', house: 'thorn', kind: 'creature', cost: 1, attack: 1, health: 3, name: 'Briar Sprout', text: 'Small, stubborn.' },
  { id: 'vine-stalker', house: 'thorn', kind: 'creature', cost: 2, attack: 3, health: 3, name: 'Vine Stalker', text: 'Strikes from cover.' },
  { id: 'thorn-lash', house: 'thorn', kind: 'spell', cost: 2, name: 'Thorn Lash', text: 'Deal 2 to every enemy creature.' },
  { id: 'sporebloom', house: 'thorn', kind: 'creature', cost: 3, attack: 3, health: 4, name: 'Sporebloom', text: 'Heal 3 when played.' },
  { id: 'bramble-hulk', house: 'thorn', kind: 'creature', cost: 4, attack: 4, health: 6, name: 'Bramble Hulk', text: 'A walking hedge.' },
  { id: 'rootmother', house: 'thorn', kind: 'creature', cost: 5, attack: 6, health: 6, name: 'Rootmother', text: 'Mother of thorns.' },
  // Stone — guards and giants.
  { id: 'pebble-guard', house: 'stone', kind: 'creature', cost: 1, attack: 1, health: 4, name: 'Pebble Guard', text: 'Guard.', guard: true },
  { id: 'stone-sentinel', house: 'stone', kind: 'creature', cost: 2, attack: 2, health: 4, name: 'Stone Sentinel', text: 'Guard.', guard: true },
  { id: 'bulwark', house: 'stone', kind: 'creature', cost: 3, attack: 3, health: 6, name: 'Bulwark', text: 'Guard.', guard: true },
  { id: 'hearth-mend', house: 'stone', kind: 'spell', cost: 2, name: 'Hearth Mend', text: 'Heal 6 life.' },
  { id: 'granite-golem', house: 'stone', kind: 'creature', cost: 4, attack: 5, health: 5, name: 'Granite Golem', text: 'Slow, certain.' },
  { id: 'mountain-king', house: 'stone', kind: 'creature', cost: 5, attack: 7, health: 7, name: 'Mountain King', text: 'The court bows.' },
];

export const DECK_SIZE = 24;
export const STARTING_LIFE = 30;
export const MAX_MANA = 10;
export const HAND_LIMIT = 7;

export function findCardDef(id) {
  return CARD_DEFS.find((c) => c.id === id);
}

export function buildDeck() {
  // One copy of each of the 24 cards: a tight deck where every draw matters.
  return CARD_DEFS.map((c) => c.id);
}
