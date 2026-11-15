import { setState, drawState, updateState } from "./states.js";

await Canvas(800, 450);
world.gravity.y = 5;

let score = 0;

let player = new Sprite(0, 0, 50, 50);
player.color = 'green'
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
