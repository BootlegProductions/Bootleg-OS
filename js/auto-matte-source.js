// Browser-only matte generation. Model files are fetched on first use and cached by the browser.
import { logitsToMask, chooseCutout } from './matte-utils.js';
import { AutoModel, AutoProcessor, RawImage, env } from '@huggingface/transformers';

env.allowLocalModels = false;
env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/';
env.backends.onnx.wasm.numThreads = 1;
let engine;
// Full-precision CPU processing avoids hardware-dependent graphics mattes.
const modelId = 'studioludens/birefnet-lite-512';
const revision = '4a3c40c36c94093cc1e724d9ea428b8fa4b57dc7';
export function describeCutoutError(error) {
  if (typeof error?.message === 'string' && error.message.trim()) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  if (typeof error === 'number') return `Cutout runtime stopped with code ${error}`;
  try { const text = JSON.stringify(error); if (text && text !== '{}') return text; } catch {}
  return 'The cutout runtime could not process this image';
}
export async function cutoutMask(blob, status = () => {}, validate = () => {}) {
  const compact = async () => {
    status('Trying the compact cutout model…');
    const { compactMask } = await import('./compact-matte.bundle.js?v=1');
    return compactMask(blob, status);
  };
  return chooseCutout(() => detailedMask(blob, status), compact, validate, async error => {
    console.warn('Detailed cutout rejected:', describeCutoutError(error));
    try { const runtime = await engine; await runtime?.model?.dispose(); } catch {}
    engine = null;
  });
}
const progress = status => event => {
  if (event.status === 'progress' && event.progress != null) status(`Downloading model: ${Math.round(event.progress)}%`);
};
async function detailedMask(blob, status = () => {}) {
  if (!engine) {
    engine = (async () => {
      status('Downloading the background-removal model…');
      const progress_callback = progress(status);
      // Prefer the software backend: GPU inference can return a plausible but wrong
      // matte without throwing. The same full-precision model runs reliably in WASM.
      const model = await AutoModel.from_pretrained(modelId, { revision, dtype: 'fp32', device: 'wasm', progress_callback });
      const processor = await AutoProcessor.from_pretrained(modelId, { revision });
      return { model, processor };
    })().catch(error => { engine = null; throw error; });
  }
  const runtime = await engine;
  status('Finding the subject in your image…');
  const url = URL.createObjectURL(blob);
  try {
    // Transparent PNG pixels must be composited before inference; dropping alpha
    // otherwise turns empty areas black and can confuse illustrated subjects.
    const decoded = (await RawImage.fromURL(url)).rgba();
    const rgb = new Uint8ClampedArray(decoded.width * decoded.height * 3);
    for (let i = 0; i < decoded.width * decoded.height; i++) {
      const alpha = decoded.data[i * 4 + 3] / 255;
      for (let c = 0; c < 3; c++) rgb[i * 3 + c] = Math.round(decoded.data[i * 4 + c] * alpha + 255 * (1 - alpha));
    }
    const image = new RawImage(rgb, decoded.width, decoded.height, 3);
    const { pixel_values } = await runtime.processor(image);
    async function predictMask() {
      const output = await runtime.model({ input_image: pixel_values });
      const prediction = output.output_image || output.logits || Object.values(output)[0];
      if (!prediction?.dims) throw new Error('The cutout model did not return an image mask');
      const matte = logitsToMask(prediction);
      return await new RawImage(matte.data, matte.width, matte.height, 1).resize(image.width, image.height);
    }
    const mask = await predictMask();
    // RawImage may represent a single channel as grey or as RGBA, depending on library release.
    if (mask.data.length === image.width * image.height) return mask.data;
    const alpha = new Uint8Array(image.width * image.height);
    for (let i = 0; i < alpha.length; i++) alpha[i] = mask.data[i * mask.channels];
    return alpha;
  } finally { URL.revokeObjectURL(url); }
}
