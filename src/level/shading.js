// random color tint and darkening but the random is the same every time

// how many different shades each tint colour gets
const SHADES_PER_COLOR = 6;

// tinting was making q5 rerender stuff every time its drawn so it kills fps, avoid that by doing this
const shadedImages = new Map();

export function shadedImage(path, shade) {
  const key = path + '|' + shade;

  if (!shadedImages.has(key)) {
    shadedImages.set(key, loadImage(path));
  }

  return shadedImages.get(key);
}

// is it random if it is the same every time?
export function hash(x, y, seed = 0) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function tileCell(position, origin, size) {
  return Math.round((position - origin) / size);
}

export function pickShade(hex, col, row, range) {
  const variant = Math.floor(hash(col, row, 1) * SHADES_PER_COLOR);
  return varyColor(hex, variant, range);
}

// give tiles variance by changing their colors a bit
function varyColor(hex, variant, [min, max]) {
  const brightness = min + (variant / (SHADES_PER_COLOR - 1)) * (max - min);
  const value = parseInt(hex.slice(1), 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255];

  const varied = channels.map((channel, i) => {
    const jitter = 0.92 + hash(variant, i, 2) * 0.16;
    const result = Math.round(channel * brightness * jitter);
    return Math.max(0, Math.min(255, result));
  });

  return '#' + varied.map((c) => c.toString(16).padStart(2, '0')).join('');
}