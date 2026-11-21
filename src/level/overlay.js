// letterbox and iris wipe drawn for cutscenes

import { FRAME_SECONDS } from '../core/time.js';

const IRIS_OPEN_SECONDS = 0.6;
const LETTERBOX_SECONDS = 0.25;
const LETTERBOX_HEIGHT_FRACTION = 0.12;

function isExiting(exit) {
  return Boolean(exit && (exit.phase === 'iris' || exit.phase === 'done'));
}

export function updateOverlay(game) {
  if (game.irisOpenProgress > 0) {
    game.irisOpenProgress = Math.max(
      0,
      game.irisOpenProgress - FRAME_SECONDS / IRIS_OPEN_SECONDS
    );
  }

  const cutsceneActive =
    (game.entrance && game.entrance.phase !== 'done') ||
    Boolean(game.exit && game.exit.phase !== 'done');

  const step = FRAME_SECONDS / LETTERBOX_SECONDS;
  const current = game.letterboxProgress ?? 0;

  game.letterboxProgress = cutsceneActive
    ? Math.min(1, current + step)
    : Math.max(0, current - step);
}

export function resetOverlay(game) {
  game.irisOpenProgress = 0;
  game.letterboxProgress = 0;
}

export function drawCutsceneOverlay(game) {
  const exiting = isExiting(game.exit);
  const opening = !exiting && game.irisOpenProgress > 0;
  const letterbox = game.letterboxProgress ?? 0;

  if (!exiting && !opening && letterbox <= 0) {
    return;
  }

  const viewW = width / camera.zoom;
  const viewH = height / camera.zoom;
  const left = camera.x - viewW / 2;
  const top = camera.y - viewH / 2;

  push();
  camera.on();
  rectMode(CORNER);

  if (exiting || opening) {
    drawIris(game, exiting, left, top, viewW, viewH);
  }

  if (letterbox > 0) {
    const barHeight = viewH * LETTERBOX_HEIGHT_FRACTION * letterbox;
    noStroke();
    fill(0);
    rect(left, top, viewW, barHeight);
    rect(left, top + viewH - barHeight, viewW, barHeight);
  }

  camera.off();
  pop();
}

// loony toons circle
function drawIris(game, exiting, left, top, viewW, viewH) {
  const progress = exiting ? (game.exit.irisProgress ?? 0) : game.irisOpenProgress;
  const target = exiting
    ? (game.escapeDoor ?? game.player)
    : (game.player ?? game.escapeDoor);

  if (!target) {
    return;
  }

  const maxRadius = dist(
    target.x,
    target.y,
    target.x < camera.x ? left + viewW : left,
    target.y < camera.y ? top + viewH : top
  );

  const holeRadius = Math.max(0, maxRadius * (1 - progress));

  noFill();
  stroke(0);
  strokeWeight(maxRadius * 2);
  circle(target.x, target.y, holeRadius * 2 + maxRadius * 2);
}