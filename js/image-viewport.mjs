// Canvas zoom changes display geometry only; image pixels retain their original size.
export function clampZoom(value) { return Math.max(.05, Math.min(8, Number(value) || 1)); }
export function fitZoom(width, height, availableWidth, availableHeight) {
  return clampZoom(Math.min(1, Math.max(1, availableWidth - 24) / width, Math.max(1, availableHeight - 24) / height));
}
export function wheelZoom(scale, delta) { return clampZoom(scale * Math.exp(-Math.max(-200, Math.min(200, delta)) * .002)); }
