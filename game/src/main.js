// Cinder Court — bootstrap, input and screenshot presets.
// The presets replay REAL games through the engine (same code paths as a
// human playing), so every screenshot is a render of the game's own code:
//   ?shot=title            the title screen
//   ?shot=table&seed=7     a mid-game table (turn 4 of a scripted game)
//   ?shot=win&seed=7       the win screen of that scripted game
//   ?shot=loss&seed=21     the loss screen of a scripted game
// No shot parameter: the real game, title screen first.

import { newGame, beginPlay, playCard, endPlayerTurn, strikePhase, aiTakeTurn } from './engine.js';
import { findCardDef } from './cards.js';
import { renderTitle, renderTable, renderEnd } from './render.js';

export const WIN_SEED = 7;
export const LOSS_SEED = 21;

export function scriptedPlay(game) {
  // One scripted player turn: play affordable cards, biggest first, then end.
  let played = true;
  while (played && game.phase === 'play') {
    played = false;
    const affordable = game.player.hand
      .filter((c) => findCardDef(c.id).cost <= game.player.mana)
      .sort((a, b) => findCardDef(b.id).cost - findCardDef(a.id).cost);
    if (affordable.length > 0 && game.player.board.length < 5) {
      playCard(game, affordable[0].uid);
      played = true;
    }
  }
  if (game.phase === 'play') endPlayerTurn(game);
}

export function playScriptedGame(seed, untilTurn) {
  const game = newGame(seed);
  beginPlay(game);
  let guard = 0;
  while ((game.phase === 'play' || game.phase === 'ai') && guard < 200) {
    if (untilTurn !== undefined && game.turn >= untilTurn && game.phase === 'play') break;
    if (game.phase === 'play') scriptedPlay(game);
    guard++;
  }
  return game;
}

export function presetGame(shot, seed) {
  if (shot === 'table') return playScriptedGame(seed, 4);
  if (shot === 'win') return playScriptedGame(seed === undefined ? WIN_SEED : seed);
  if (shot === 'loss') return playScriptedGame(seed === undefined ? LOSS_SEED : seed);
  return newGame(seed === undefined ? 7 : seed);
}

export function mount(app) {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seed = params.get('seed') === null ? undefined : Number(params.get('seed'));
  let game = presetGame(shot, seed);

  function draw() {
    if (game.phase === 'title') {
      renderTitle(app, () => {
        beginPlay(game);
        draw();
      });
    } else if (game.phase === 'win' || game.phase === 'loss') {
      renderEnd(app, game, () => {
        game = newGame(Date.now() % 100000);
        beginPlay(game);
        draw();
      });
    } else {
      renderTable(app, game, {
        onPlayCard(uid) {
          if (playCard(game, uid)) draw();
        },
        onEndTurn() {
          // Your creatures strike at once; the Regent answers after a beat,
          // so its moves read as moves instead of a blur.
          if (game.phase !== 'play') return;
          game.phase = 'ai';
          strikePhase(game, game.player, game.enemy, 'Your');
          draw();
          if (game.phase !== 'ai') return; // game already won
          setTimeout(() => {
            if (game.phase !== 'ai') return;
            aiTakeTurn(game);
            draw();
          }, 450);
        },
      });
    }
  }

  // Keyboard: 1-7 plays a hand card, Enter ends the turn, Esc restarts.
  document.addEventListener('keydown', (ev) => {
    if (game.phase === 'title' && (ev.key === 'Enter' || ev.key === ' ')) {
      beginPlay(game);
      draw();
      return;
    }
    if (game.phase === 'play') {
      if (ev.key >= '1' && ev.key <= '7') {
        const card = game.player.hand[Number(ev.key) - 1];
        if (card && playCard(game, card.uid)) draw();
      } else if (ev.key === 'Enter') {
        endPlayerTurn(game);
        draw();
      }
    }
    if ((game.phase === 'win' || game.phase === 'loss') && ev.key === 'Enter') {
      game = newGame(Date.now() % 100000);
      beginPlay(game);
      draw();
    }
  });

  draw();
}

if (typeof document !== 'undefined') {
  mount(document.getElementById('app'));
}
