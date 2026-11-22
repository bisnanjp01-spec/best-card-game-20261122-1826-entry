// Cinder Court — rules engine: turns, mana, combat and the Regent's mind.
// No DOM here: the engine owns state only, so the same code drives the live
// game and the screenshot presets in main.js.

import { buildDeck, findCardDef, HAND_LIMIT, MAX_MANA, STARTING_LIFE } from './cards.js';

// Small seeded RNG so a preset game always deals the same hands.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleDeck(deck, random) {
  const d = deck.slice();
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

export function makeSide(deck) {
  return { life: STARTING_LIFE, mana: 0, maxMana: 0, deck, hand: [], board: [] };
}

export function newGame(seed) {
  const random = mulberry32(seed);
  const game = {
    seed,
    random,
    turn: 1,
    phase: 'title', // title | play | ai | win | loss
    player: makeSide(shuffleDeck(buildDeck(), random)),
    enemy: makeSide(shuffleDeck(buildDeck(), random)),
    log: ['The court gathers. The Cinder Crown awaits.'],
    winner: null,
  };
  return game;
}

export function drawCards(side, count) {
  for (let i = 0; i < count; i++) {
    if (side.hand.length >= HAND_LIMIT) break;
    const id = side.deck.shift();
    if (id === undefined) break;
    side.hand.push({ uid: `${id}-${Math.floor(Math.random() * 1e9)}`, id, attack: findCardDef(id).attack ?? 0, health: findCardDef(id).health ?? 0 });
  }
}

export function startTurn(game, side) {
  side.maxMana = Math.min(MAX_MANA, side.maxMana + 1);
  side.mana = side.maxMana;
  drawCards(side, 1);
}

export function beginPlay(game) {
  game.phase = 'play';
  game.player.maxMana = 0;
  game.enemy.maxMana = 0;
  drawCards(game.player, 3);
  drawCards(game.enemy, 3);
  startTurn(game, game.player);
  game.log.push('Your turn: play a card, then end your turn.');
}

export function canPlayCard(game, card) {
  if (game.phase !== 'play') return false;
  const def = findCardDef(card.id);
  return game.player.mana >= def.cost;
}

export function playCard(game, uid) {
  const idx = game.player.hand.findIndex((c) => c.uid === uid);
  if (idx < 0) return false;
  const card = game.player.hand[idx];
  if (!canPlayCard(game, card)) return false;
  const def = findCardDef(card.id);
  game.player.mana -= def.cost;
  game.player.hand.splice(idx, 1);
  if (def.kind === 'spell') {
    resolveSpell(game, game.player, game.enemy, def);
    game.log.push(`You cast ${def.name}.`);
  } else {
    game.player.board.push(card);
    if (def.id === 'sporebloom') {
      game.player.life = Math.min(STARTING_LIFE, game.player.life + 3);
      game.log.push('Sporebloom mends you for 3.');
    }
    game.log.push(`You play ${def.name} (${def.attack}/${def.health}).`);
  }
  checkEnd(game);
  return true;
}

export function resolveSpell(game, caster, target, def) {
  if (def.id === 'ember-burst') target.life -= 3;
  else if (def.id === 'inferno') target.life -= 5;
  else if (def.id === 'deep-draw') drawCards(caster, 2);
  else if (def.id === 'hearth-mend') caster.life = Math.min(STARTING_LIFE, caster.life + 6);
  else if (def.id === 'tidal-wave' || def.id === 'thorn-lash') {
    for (const c of target.board) c.health -= 2;
    target.board = target.board.filter((c) => c.health > 0);
  }
}

export function livingGuards(side) {
  return side.board.filter((c) => findCardDef(c.id).guard);
}

export function strikePhase(game, attacker, defender, label) {
  // Each creature strikes once: Guards take the blow first, the rest hits life.
  for (const card of attacker.board.slice()) {
    if (card.health <= 0) continue;
    const guards = livingGuards(defender);
    if (guards.length > 0) {
      const guard = guards[0];
      const guardDef = findCardDef(guard.id);
      guard.health -= card.attack;
      card.health -= guardDef.attack;
      game.log.push(`${label} ${findCardDef(card.id).name} hits ${guardDef.name} for ${card.attack}.`);
    } else {
      defender.life -= card.attack;
      game.log.push(`${label} ${findCardDef(card.id).name} hits the Warden for ${card.attack}.`);
    }
    if (defender.life <= 0) break;
  }
  attacker.board = attacker.board.filter((c) => c.health > 0);
  defender.board = defender.board.filter((c) => c.health > 0);
  checkEnd(game);
}

export function endPlayerTurn(game) {
  if (game.phase !== 'play') return;
  game.phase = 'ai';
  strikePhase(game, game.player, game.enemy, 'Your');
  if (game.phase !== 'ai') return; // game already won
  aiTakeTurn(game);
}

export function aiTakeTurn(game) {
  // The Ashen Regent plays greedily: biggest affordable card first, then
  // smaller ones, holding nothing back. Readable, and easy to counter:
  // answer its board with a Guard, or race it with Flame.
  const enemy = game.enemy;
  startTurn(game, enemy);
  let played = true;
  while (played) {
    played = false;
    const affordable = enemy.hand
      .filter((c) => findCardDef(c.id).cost <= enemy.mana)
      .sort((a, b) => findCardDef(b.id).cost - findCardDef(a.id).cost);
    if (affordable.length === 0) break;
    const card = affordable[0];
    const def = findCardDef(card.id);
    enemy.mana -= def.cost;
    enemy.hand.splice(enemy.hand.indexOf(card), 1);
    if (def.kind === 'spell') {
      resolveSpell(game, enemy, game.player, def);
      game.log.push(`Regent casts ${def.name}.`);
    } else {
      enemy.board.push(card);
      if (def.id === 'sporebloom') {
        enemy.life = Math.min(STARTING_LIFE, enemy.life + 3);
      }
      game.log.push(`Regent plays ${def.name} (${def.attack}/${def.health}).`);
    }
    played = true;
    checkEnd(game);
    if (game.phase !== 'ai') return;
  }
  strikePhase(game, enemy, game.player, 'Regent');
  if (game.phase !== 'ai') return;
  game.turn += 1;
  game.phase = 'play';
  startTurn(game, game.player);
  game.log.push(`Turn ${game.turn}: your move.`);
}

export function checkEnd(game) {
  if (game.enemy.life <= 0 && game.player.life <= 0) {
    game.phase = game.player.life >= game.enemy.life ? 'win' : 'loss';
  } else if (game.enemy.life <= 0) {
    game.phase = 'win';
    game.winner = 'player';
    game.log.push('The Regent falls. The Cinder Crown is yours!');
  } else if (game.player.life <= 0) {
    game.phase = 'loss';
    game.winner = 'enemy';
    game.log.push('Your hearth gutters out. The court falls to ash.');
  }
}
