// The same clipped footprint is used for pixel painting and its hover preview.
export function pixelBrushBounds(x, y, size, width) {
  const offset = Math.floor((width - 1) / 2);
  return {
    left: Math.max(0, x - offset), top: Math.max(0, y - offset),
    right: Math.min(size, x - offset + width), bottom: Math.min(size, y - offset + width)
  };
}
