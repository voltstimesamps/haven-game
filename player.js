function createPlayer(playerSettings) {
  const sprite = new Sprite(
    playerSettings.x,
    playerSettings.y,
    32,
    48
  );

  sprite.addAni('idle', ...playerSettings.idleFrames);
  sprite.changeAni('idle');
  sprite.ani.frameDelay = 12;

  sprite.inputEnabled = playerSettings.inputEnabled;

  return sprite;
}

function updatePlayer() {
  if (!player || !player.inputEnabled) {
    return;
  }

  const speed = 3;

  if (kb.pressing('left')) {
    player.vel.x = -speed;
  } else if (kb.pressing('right')) {
    player.vel.x = speed;
  } else {
    player.vel.x = 0;
  }

  if (kb.presses('space') && player.vel.y === 0) {
    player.vel.y = -8;
  }
}