// Mask conversion and alpha checks shared by the automatic cutout and the editor.
export class InvalidMaskError extends Error {}
export function logitsToMask(prediction) {
  const dims = prediction?.dims;
  if (!dims || (dims.length !== 4 && dims.length !== 3)) throw new Error('The model did not return an image mask');
  const height = dims.at(-2), width = dims.at(-1);
  if (dims.slice(0, -2).some(n => n !== 1) || prediction.data.length !== width * height) throw new Error('The model returned an unexpected mask shape');
  const mask = new Uint8ClampedArray(width * height);
  for (let i = 0; i < mask.length; i++) {
    const value = prediction.data[i];
    // Check floating-point output before byte conversion; NaN would silently become zero.
    if (!Number.isFinite(value)) throw new InvalidMaskError('The cutout model returned invalid pixel values');
    mask[i] = Math.round(255 / (1 + Math.exp(-value)));
  }
  if (!mask.some(value => value > 8)) throw new InvalidMaskError('The cutout model returned an empty subject');
  return { data: mask, width, height };
}
export function checkRetainedSubject(mask, original) {
  if (mask.length * 4 !== original.length) throw new Error('The model returned an unexpected mask size');
  let visible = 0, retained = 0, solid = 0;
  for (let i = 0; i < mask.length; i++) {
    if (!Number.isFinite(mask[i]) || mask[i] < 0 || mask[i] > 255) throw new Error('The model returned invalid mask pixels');
    if (original[i * 4 + 3] > 8) {
      visible++;
      if (original[i * 4 + 3] * mask[i] / 255 > 8) retained++;
      if (mask[i] >= 192) solid++;
    }
  }
  if (!visible) throw new Error('This image is already fully transparent');
  if (retained < Math.max(1, Math.ceil(visible * 0.0001))) throw new Error('No visible subject was found; your image has been kept');
  if (solid < Math.max(1, Math.ceil(visible * 0.001), Math.ceil(retained * 0.05))) throw new InvalidMaskError('The model produced a faint subject instead of a usable cutout');
  return { visible, retained };
}
export async function chooseCutout(detailed, compact, validate, onRetry = () => {}) {
  try {
    const mask = await detailed();
    validate(mask);
    return mask;
  } catch (error) {
    await onRetry(error);
    const mask = await compact();
    validate(mask);
    return mask;
  }
}
