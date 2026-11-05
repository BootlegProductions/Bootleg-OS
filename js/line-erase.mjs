// Connected colour selection constrained by dark linework. No pixels are edited here.
// The returned mask is a preview until the editor explicitly applies it.
const clamp = (value, low, high, fallback) => Number.isFinite(Number(value)) ? Math.max(low, Math.min(high, Number(value))) : fallback;

// Separable square max/min filter; linear time even on large artwork.
function filterMask(input, width, height, radius, dilate) {
  const temp = new Uint8Array(input.length), output = new Uint8Array(input.length);
  for (let y = 0; y < height; y++) {
    const base = y * width; let sum = 0;
    for (let x = 0; x <= Math.min(radius, width - 1); x++) sum += input[base + x];
    for (let x = 0; x < width; x++) {
      const length = Math.min(width - 1, x + radius) - Math.max(0, x - radius) + 1;
      temp[base + x] = dilate ? +(sum > 0) : +(sum === length);
      if (x - radius >= 0) sum -= input[base + x - radius];
      if (x + radius + 1 < width) sum += input[base + x + radius + 1];
    }
  }
  for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let y = 0; y <= Math.min(radius, height - 1); y++) sum += temp[y * width + x];
    for (let y = 0; y < height; y++) {
      const length = Math.min(height - 1, y + radius) - Math.max(0, y - radius) + 1;
      output[y * width + x] = dilate ? +(sum > 0) : +(sum === length);
      if (y - radius >= 0) sum -= temp[(y - radius) * width + x];
      if (y + radius + 1 < height) sum += temp[(y + radius + 1) * width + x];
    }
  }
  return output;
}

export function selectLineRegion(rgba, width, height, seedX, seedY, options = {}) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || rgba.length !== width * height * 4) throw new Error('Unexpected image dimensions.');
  const count = width * height, mask = new Uint8Array(count);
  const x = Math.floor(seedX), y = Math.floor(seedY);
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x >= width || y >= height) return {mask, selected:0, visible:0, reason:'outside'};
  const seed = y * width + x, offset = seed * 4;
  if (rgba[offset + 3] <= 8) return {mask, selected:0, visible:0, reason:'transparent'};
  const lineThreshold = clamp(options.lineThreshold, 20, 230, 120);
  const tolerance = clamp(options.tolerance, 0, 180, 55);
  const gap = Math.round(clamp(options.gap, 0, 4, 1));
  const lines = new Uint8Array(count); let visible = 0;
  for (let i = 0; i < count; i++) {
    const p = i * 4;
    if (rgba[p + 3] <= 8) continue;
    visible++;
    // Luminance, not hue, detects black/dark outlines without a separate line layer.
    lines[i] = +(rgba[p] * .2126 + rgba[p + 1] * .7152 + rgba[p + 2] * .0722 <= lineThreshold);
  }
  let barrier = lines;
  if (gap) {
    barrier = filterMask(filterMask(lines, width, height, gap, true), width, height, gap, false);
    // Closing may add virtual bridges but must never remove an existing line pixel.
    for (let i = 0; i < count; i++) barrier[i] |= lines[i];
  }
  if (barrier[seed]) return {mask, selected:0, visible, reason:'line'};
  const queue = new Int32Array(count), seen = new Uint8Array(count);
  const red = rgba[offset], green = rgba[offset + 1], blue = rgba[offset + 2], limit = tolerance * tolerance;
  let head = 0, tail = 0;
  function visit(i) {
    if (seen[i]) return;
    seen[i] = 1;
    const p = i * 4;
    if (barrier[i] || rgba[p + 3] <= 8) return;
    const distance = (rgba[p] - red) ** 2 + (rgba[p + 1] - green) ** 2 + (rgba[p + 2] - blue) ** 2;
    if (distance > limit) return;
    mask[i] = 1; queue[tail++] = i;
  }
  visit(seed);
  while (head < tail) {
    const i = queue[head++], column = i % width;
    if (column) visit(i - 1);
    if (column + 1 < width) visit(i + 1);
    if (i >= width) visit(i - width);
    if (i + width < count) visit(i + width);
  }
  return {mask, selected:tail, visible, reason:tail ? 'selected' : 'empty'};
}

export function eraseSelected(rgba, mask) {
  if (rgba.length !== mask.length * 4) throw new Error('Selection does not match the image.');
  const output = new Uint8ClampedArray(rgba);
  for (let i = 0; i < mask.length; i++) if (mask[i]) output[i * 4 + 3] = 0;
  return output;
}
