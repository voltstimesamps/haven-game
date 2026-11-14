await Canvas(800, 450);
world.gravity.y = 5;

let score = 0;

let player = new Sprite(0, 0, 50, 50);
player.color = 'green'
player.rotationLock = true;
player.friction = 5;

player.img = '🦉';
player.debug = true;

let ground = new Group();
ground.physics = STATIC;
ground.color = 'orange';
ground.tile = '=';
ground.w = 40;
ground.h = 40;

let coins = new Group();
coins.physics = STATIC;
coins.diameter = 16;
coins.color = 'gold';
coins.tile = 'c';

let level = new Group();
level.addTiles([
	'......ccc......',
	'.....=====..cc.',
	'.c.........===.',
	'====......=====',
], -300, 0, 40, 40);

player.overlaps(coins, collect)

function collect(p, coin) {
	coin.delete();
	score++;
}
//runs before each physics step
q5.update = function () {
	if(kb.pressing('left')) {
		player.vel.x = -4
	} else if (kb.pressing('right')) {
		player.vel.x = 4
	} else {
		player.vel.x = 0
	}
	let onGround = player.colliding(ground)
	if(kb.presses('up') && onGround) {
		player.vel.y = -5
	} else if (kb.presses('down') && onGround) {
		player.vel.y = 5
	} 
};
//runs after each physics step, 60x a second

q5.draw = function () {
	background('skyblue');
}
