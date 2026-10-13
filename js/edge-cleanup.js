// Remove white backdrop remnants connected to existing transparency.
// Work from the cutout's edges so enclosed white highlights and clothing stay intact.
export function cleanWhiteFringe(rgba, width, height, tolerance = 18) {
  if (rgba.length !== width * height * 4) throw new Error('Unexpected image dimensions');
  tolerance = Math.max(0, Math.min(60, Number(tolerance) || 0));
  const count = width * height, state = new Uint8Array(count), queue = new Int32Array(count);
  const result = new Uint8ClampedArray(rgba);
  let head = 0, tail = 0, removed = 0;
  for (let i = 0; i < count; i++) {
    const p = i * 4;
    const low = Math.min(rgba[p], rgba[p + 1], rgba[p + 2]);
    const high = Math.max(rgba[p], rgba[p + 1], rgba[p + 2]);
    if (low >= 255 - tolerance && high - low <= tolerance) state[i] = 1;
  }
  function visit(i) {
    if (state[i] !== 1) return;
    state[i] = 2; queue[tail++] = i;
  }
  for (let i = 0; i < count; i++) {
    if (state[i] !== 1) continue;
    const x = i % width, y = Math.floor(i / width);
    if (x === 0 || x === width - 1 || y === 0 || y === height - 1 || rgba[i * 4 + 3] <= 8 ||
        (x > 0 && rgba[(i - 1) * 4 + 3] <= 8) || (x + 1 < width && rgba[(i + 1) * 4 + 3] <= 8) ||
        (y > 0 && rgba[(i - width) * 4 + 3] <= 8) || (y + 1 < height && rgba[(i + width) * 4 + 3] <= 8)) visit(i);
  }
  while (head < tail) {
    const i = queue[head++], x = i % width;
    if (result[i * 4 + 3] > 0) { result[i * 4 + 3] = 0; removed++; }
    if (x > 0) visit(i - 1);
    if (x + 1 < width) visit(i + 1);
    if (i >= width) visit(i - width);
    if (i + width < count) visit(i + width);
  }
  return { data: result, removed };
}
