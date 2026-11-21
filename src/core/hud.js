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
  noStroke();
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
  noStroke();

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

let pulses = [];
let lastSpawn = 0;

export function drawHealth(player) {
  if (!player) return;

  const hp = constrain(player.health / player.maxHealth, 0, 1);
  const ani = getHeart();
  if (ani.length < HEART_FRAMES) return;

  ani.frame = Math.round(hp * (HEART_FRAMES - 1));

  const urgency = hp > 0 && hp <= 0.75 ? constrain((0.75 - hp) / 0.5, 0, 1) : 0;
  const duration = lerp(1400, 600, urgency);
  const now = millis();

  if (urgency > 0 && now - lastSpawn >= duration * 0.5) {
    pulses.push({ born: now, duration, urgency });
    lastSpawn = now;
  }

  push();
  colorMode(RGB, 255);
  imageMode(CENTER);
  translate(-width / 2 + 54, -height / 2 + 54);

  pulses = pulses.filter(p => now - p.born < p.duration);

  for (const p of pulses) {
    const t = (now - p.born) / p.duration;
    const fade = (1 - t) * (1 - t);
    const radius = 14 + (1 - Math.pow(1 - t, 2)) * lerp(28, 52, p.urgency);

    fill(255, 25, 25, fade * max(0, p.urgency - 0.25) * 100);
    stroke(255, 30, 30, fade * lerp(130, 255, p.urgency));
    strokeWeight(lerp(2.5, 5, p.urgency));
    circle(0, 0, radius * 2);
  }

  const latest = pulses[pulses.length - 1];
  const beat = latest ? Math.sin(((now - latest.born) / latest.duration) * Math.PI) * latest.urgency * 0.22 : 0;

  scale(HEART_SCALE * (1 + beat));
  animation(ani, 0, 0);
  pop();
}
