// Cinder Court — table rendering: title, hands, board, life and end screens.
// Pure DOM + CSS, no images, no network: every pixel comes from this file
// and styles.css, so the screenshots are renders of the game's own code.

import { HOUSES, findCardDef } from './cards.js';

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

export function cardElement(card, opts = {}) {
  const n = el('div', `card${opts.faceDown ? ' face-down' : ''}${opts.playable ? ' playable' : ''}`);
  if (opts.faceDown) {
    n.appendChild(el('div', 'card-back', '◆'));
    return n;
  }
  const def = findCardDef(card.id);
  const house = HOUSES[def.house];
  n.classList.add(`house-${def.house}`);
  const cost = el('div', 'card-cost', String(def.cost));
  n.appendChild(cost);
  n.appendChild(el('div', 'card-glyph', house.glyph));
  n.appendChild(el('div', 'card-name', def.name));
  n.appendChild(el('div', 'card-text', def.text));
  if (def.guard) n.appendChild(el('div', 'card-guard', 'GUARD'));
  if (def.kind === 'creature') {
    n.appendChild(el('div', 'card-attack', `⚔ ${card.attack}`));
    n.appendChild(el('div', 'card-health', `♥ ${card.health}`));
  } else {
    n.appendChild(el('div', 'card-spell', 'SPELL'));
  }
  n.title = `${def.name} — ${house.name} · cost ${def.cost}`;
  return n;
}

function lifeBar(side, label, isEnemy) {
  const wrap = el('div', `life-wrap${isEnemy ? ' enemy' : ''}`);
  wrap.appendChild(el('div', 'life-label', label));
  const bar = el('div', 'life-bar');
  const fill = el('div', 'life-fill');
  fill.style.width = `${Math.max(0, (side.life / 30) * 100)}%`;
  bar.appendChild(fill);
  wrap.appendChild(bar);
  wrap.appendChild(el('div', 'life-num', `${Math.max(0, side.life)} / 30`));
  return wrap;
}

function manaRow(side) {
  const row = el('div', 'mana-row');
  row.appendChild(el('span', 'mana-label', 'MANA'));
  for (let i = 0; i < 10; i++) {
    const gem = el('span', `mana-gem${i < side.mana ? ' full' : i < side.maxMana ? ' empty' : ' locked'}`);
    gem.textContent = '●';
    row.appendChild(gem);
  }
  row.appendChild(el('span', 'mana-num', `${side.mana}/${side.maxMana}`));
  return row;
}

export function renderTitle(app, onPlay) {
  app.innerHTML = '';
  const screen = el('div', 'screen title-screen');
  screen.appendChild(el('div', 'title-kicker', 'A DUEL OF FOUR EMBER HOUSES'));
  screen.appendChild(el('h1', 'title-name', 'CINDER COURT'));
  const sigils = el('div', 'title-sigils');
  for (const key of ['flame', 'tide', 'thorn', 'stone']) {
    const s = el('div', `sigil house-${key}`, HOUSES[key].glyph);
    s.appendChild(el('span', 'sigil-name', HOUSES[key].name));
    sigils.appendChild(s);
  }
  screen.appendChild(sigils);
  screen.appendChild(el('p', 'title-rules', 'Play creatures, guard your hearth, and bring the Ashen Regent’s life to 0. Each turn: +1 mana, draw a card, then strike. Guards take the blow first.'));
  const btn = el('button', 'play-btn', '▶  ENTER THE COURT');
  btn.addEventListener('click', onPlay);
  screen.appendChild(btn);
  screen.appendChild(el('p', 'title-keys', 'Mouse: click a card to play it · Keys: 1–7 play a card, Enter ends the turn'));
  app.appendChild(screen);
}

export function renderTable(app, game, handlers) {
  app.innerHTML = '';
  const table = el('div', 'screen table-screen');

  // Opponent row: life, face-down hand, board.
  const foe = el('div', 'side foe-side');
  foe.appendChild(lifeBar(game.enemy, 'ASHEN REGENT', true));
  const foeHand = el('div', 'mini-hand');
  for (let i = 0; i < game.enemy.hand.length; i++) foeHand.appendChild(cardElement(null, { faceDown: true }));
  foe.appendChild(foeHand);
  const foeBoard = el('div', 'board-row');
  for (const card of game.enemy.board) foeBoard.appendChild(cardElement(card));
  if (game.enemy.board.length === 0) foeBoard.appendChild(el('div', 'board-empty', '— no creatures —'));
  foe.appendChild(foeBoard);
  table.appendChild(foe);

  // Middle: turn banner, mana, end-turn.
  const mid = el('div', 'mid-row');
  mid.appendChild(el('div', 'turn-banner', `TURN ${game.turn}`));
  mid.appendChild(manaRow(game.player));
  const endBtn = el('button', 'end-btn', 'END TURN ⏎');
  endBtn.disabled = game.phase !== 'play';
  endBtn.addEventListener('click', handlers.onEndTurn);
  mid.appendChild(endBtn);
  table.appendChild(mid);

  // Player board + hand.
  const mine = el('div', 'side my-side');
  const myBoard = el('div', 'board-row');
  for (const card of game.player.board) myBoard.appendChild(cardElement(card));
  if (game.player.board.length === 0) myBoard.appendChild(el('div', 'board-empty', '— play a creature —'));
  mine.appendChild(myBoard);
  const myHand = el('div', 'hand-row');
  game.player.hand.forEach((card, i) => {
    const n = cardElement(card, { playable: game.phase === 'play' && game.player.mana >= findCardDef(card.id).cost });
    n.addEventListener('click', () => handlers.onPlayCard(card.uid));
    n.dataset.slot = String(i + 1);
    myHand.appendChild(n);
  });
  mine.appendChild(myHand);
  mine.appendChild(lifeBar(game.player, 'YOU — WARDEN OF THE HEARTH', false));
  table.appendChild(mine);

  const log = el('div', 'log-line', game.log[game.log.length - 1] || '');
  table.appendChild(log);
  app.appendChild(table);
}

export function renderEnd(app, game, onAgain) {
  app.innerHTML = '';
  const won = game.phase === 'win';
  const screen = el('div', `screen end-screen ${won ? 'win' : 'loss'}`);
  screen.appendChild(el('div', 'end-glyph', won ? '♛' : '🕯'));
  screen.appendChild(el('h1', 'end-title', won ? 'VICTORY' : 'DEFEAT'));
  screen.appendChild(el('p', 'end-text', won
    ? 'The Ashen Regent falls. The Cinder Crown is yours — the four houses bow to the Warden of the Hearth.'
    : 'Your hearth gutters out. The court falls to ash — but embers always return.'));
  screen.appendChild(el('div', 'end-score', `You ${game.player.life > 0 ? Math.max(0, game.player.life) : 0} ♥  ·  Regent ${game.enemy.life > 0 ? Math.max(0, game.enemy.life) : 0} ♥  ·  ${game.turn} turns`));
  const btn = el('button', 'play-btn', won ? '↻  PLAY AGAIN' : '↻  TRY AGAIN');
  btn.addEventListener('click', onAgain);
  screen.appendChild(btn);
  app.appendChild(screen);
}
