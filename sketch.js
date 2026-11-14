await Canvas(800, 450);
world.gravity.y = 10;

let player = new Sprite(0, -100, 50, 50);
player.color = 'green'
player.rotationLock = true;
player.friction = 5;

player.img = '🦉';
player.debug = true;
//runs before each physics step
q5.update = function () {
	
};

q5.draw = function () {
	background('skyblue');
}
