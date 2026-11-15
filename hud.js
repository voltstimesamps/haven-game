// Screen-space HUD helpers. Call these from a state's hud(), which runs
// after sprites are drawn with the camera off: (0, 0) is the screen centre.

// HealthRegen.png: 14 frames of a heart filling from empty (0) to full (13).
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
  fill('white');
  stroke('black');
  strokeWeight(4);
  textSize(size);
  textAlign(CENTER, CENTER);
  text(message, x, y);
  pop();
}

// Bottom-left item bar: the selected item is highlighted.
export function drawItems(selected, pogo) {
  const left = -width / 2 + 24;
  const bottom = height / 2 - 28;
  const charges = pogo?.charges ?? 0;

  const items = [
    { key: '1', name: 'DYNAMITE', id: 'dynamite', usable: true },
    { key: '2', name: `POGO x${charges}`, id: 'pogo', usable: charges > 0 }
  ];

  push();
  textSize(18);
  textAlign(LEFT, CENTER);
  strokeWeight(4);
  stroke('#000000');

  let x = left;

  for (const item of items) {
    const label = `[${item.key}] ${item.name}`;

    if (item.id === selected) {
      fill('#ffd23c');
    } else if (item.usable) {
      fill('#d8d0c0');
    } else {
      fill('#6a6258');
    }

    text(label, x, bottom);
    x += textWidth(label) + 28;
  }

  fill('#a89c88');
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

  // Bar next to the heart
  const barX = left + 66;
  const barY = top + 22;
  const barW = 160;
  const barH = 16;

  push();
  noStroke();
  // Hex colours: numeric ranges differ between q5's WebGPU and 2D renderers.
  fill('#00000099');
  rect(barX - 3, barY - 3, barW + 6, barH + 6);
  fill('#3a0d0d');
  rect(barX, barY, barW, barH);
  fill('#c0281e');
  rect(barX, barY, barW * fraction, barH);
  pop();
}
