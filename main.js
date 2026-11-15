import { setState, drawState, updateState } from "./states.js";
import * as level from "./level.js";

await Canvas(800, 450);
world.gravity.y = 5;

let score = 0;

let activeLevel = null;
let activeLevelId = null;
let tileGroups = [];
let player = new Sprite(0, 0, 50, 50);
player.color = 'green';
player.rotationLock = true;
player.friction = 5;

player.img = '🦉';
player.debug = true;


function collect(p, coin) {
	coin.delete();
	score++;
}

setState('setup');

//runs before each physics step
q5.update = updateState;
//runs after each physics step, 60x a second
q5.draw = drawState;

function setup() {
  new Canvas(640, 360);

  showLevel('menu/mainmenu');
}

function update() {
  clear();

  updatePlayer();

  // Example level switching:
  if (activeLevelId === 'menu/mainmenu' && kb.presses('enter')) {
    showLevel('campaign1/one');
  }

  if (activeLevelId === 'campaign1/one' && kb.presses('escape')) {
    showLevel('menu/mainmenu');
  }
}


