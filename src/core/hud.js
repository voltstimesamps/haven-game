// write text, icons, graphics that are locked to screen (don't exist in worldspace)

const HEART_SHEET = 'assets/animations/HealthRegen.png';
const HEART_FRAMES = 14;
const HEART_SCALE = 1.25;

let heart = null;

function getHeart() {
  if (!heart) {
    const visuals = new Visuals();
    visuals.addAni('heart', HEART_SHEET, HEART_FRAMES);
    visuals.ani.playing = false;
    heart = visuals.ani;
  }

  return heart;
}

export function hudText(message, x, y, size = 24) {
  push();
  fill(255);
  stroke(0);
  strokeWeight(2);
  textSize(size);
  textAlign(CENTER, CENTER);
  text(message, x, y);
  pop();
}

// item bar: the selected item is highlighted.
export function drawItems(selected) {
  const left = -width / 2 + 24;
  const bottom = height / 2 - 28;
  const items = [
    { key: '1', name: 'DYNAMITE', id: 'dynamite', usable: true },
    { key: '2', name: 'POGO', id: 'pogo', usable: true }
  ];

  push();
  textSize(18);
  textAlign(LEFT, CENTER);
  strokeWeight(2);
  stroke(0);

  let x = left;

  for (const item of items) {
    const label = `[${item.key}] ${item.name}`;

    if (item.id === selected) {
      fill('#FFD700');
    } else if (item.usable) {
      fill(255);
    } else {
      fill(150);
    }

    text(label, x, bottom);
    x += textWidth(label) + 28;
  }

  fill(200);
  textSize(14);
  text('Q to swap', x, bottom);
  pop();
}

export function drawHealth(player) {
  if (!player) {
    return;
  }

  const fraction = player.health / player.maxHealth;
  const left = -width / 2 + 24;
  const top = -height / 2 + 24;

  const ani = getHeart();

  if (ani.length < HEART_FRAMES) {
    return; // sheet still loading
  }

  ani.frame = Math.round(fraction * (HEART_FRAMES - 1));

  push();
  imageMode(CENTER);
  translate(left + 30, top + 30);
  scale(HEART_SCALE);
  animation(ani, 0, 0);
  pop();

  // bar next to heart (might want to keep this?? idk)
  const barX = left + 66;
  const barY = top + 22;
  const barW = 160;
  const barH = 16;

  push();
  noStroke();
  fill('#00000099');
  rect(barX - 3, barY - 3, barW + 6, barH + 6);
  fill('#3a0d0d');
  rect(barX, barY, barW, barH);
  fill('#c0281e');
  rect(barX, barY, barW * fraction, barH);
  pop();
}
