// enter/exit door

import { debugEnabled } from '../core/debug.js';

const doorImages = new Map();

export function createEscapeDoor(settings) {
  // keep sensor apart from collider so dan can be detected even if door is closed
  const door = Sprite.withSensor(
    settings.x,
    settings.y,
    settings.width,
    settings.height,
    'static'
  );

  door.w = settings.width;
  door.h = settings.height;
  door.color = 'red';
  door.openProgress = 1;
  door.animation = 'open';
  door.openImage = settings.openImage;
  door.closeImage = settings.closeImage;
  door.solid = null;
  door.isClosed = false;
  door.visible = false;
  door.debug = debugEnabled('colliders');
  door.ignoreRays = true;

  return door;
}

export function deleteDoor(door) {
  if (!door) {
    return;
  }

  door.solid?.delete();
  door.delete();
}

export function openDoor(door) {
  if (!door) {
    return;
  }

  door.solid?.delete();
  door.solid = null;
  door.isClosed = false;
  door.color = 'green';
  door.animation = 'open';
  door.openProgress = 1;
}

export function closeDoor(door, player) {
  if (door.isClosed) {
    return;
  }

  door.solid = new Sprite(door.x, door.y, door.w, door.h, 'static');
  door.solid.visible = false;
  door.solid.ignoreRays = false;
  door.isClosed = true;
  player.collides(door.solid);
}

export function drawDoor(door) {
  if (!door) {
    return;
  }

  const openProgress = door.openProgress ?? 0;
  const panelY = door.y - door.h * openProgress;
  const artPath = door.animation === 'close'
    ? door.closeImage
    : door.openImage;

  push();
  rectMode(CENTER);
  noStroke();
  fill('#080506');
  rect(door.x, door.y, door.w + 4, door.h + 4);

  if (artPath) {
    imageMode(CENTER);
    image(getDoorImage(artPath), door.x, panelY, door.w, door.h);
  } else if (openProgress < 1) {
    fill(door.color === 'green' ? '#2d080c' : '#55080c');
    rect(door.x, panelY, door.w, door.h);
    stroke('#96191e');
    strokeWeight(2);
    noFill();
    rect(door.x, panelY, door.w, door.h);
  }

  pop();
}

function getDoorImage(path) {
  if (!doorImages.has(path)) {
    doorImages.set(path, loadImage(path));
  }

  return doorImages.get(path);
}