// Import locally: ZIP packs stay in the browser and images keep their pixels.
import { unzipSync } from 'fflate';
import { parseGIF, decompressFrames } from 'gifuct-js';

export const IMPORT_LIMITS = { bytes: 25 * 1024 * 1024, dimension: 512, frames: 256, pixels: 16000000 };
const imageName = /\.(png|jpe?g|webp|gif)$/i;
const natural = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
export function validateImport(width, height, count = 1) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > IMPORT_LIMITS.dimension || height > IMPORT_LIMITS.dimension)
    throw Error('Use artwork from 1 to 512 pixels on each side.');
  if (count > IMPORT_LIMITS.frames || width * height * count > IMPORT_LIMITS.pixels)
    throw Error('This animation is too large. Use up to 256 frames and 16 million pixels in total.');
}
export function rgbaToPixels(bytes) {
  const out = new Uint32Array(bytes.length / 4);
  for (let i = 0; i < out.length; i++) out[i] = ((bytes[i*4] << 24) | (bytes[i*4+1] << 16) | (bytes[i*4+2] << 8) | bytes[i*4+3]) >>> 0;
  return out;
}
export function groupEntries(entries) {
  const images = entries.filter(e => imageName.test(e.name) && !/(^|\/)(?:__MACOSX|\._)/.test(e.name));
  const animations = images.filter(e => /(^|\/)animations\//i.test(e.name));
  // Animation exports also contain rotation poses/previews. Keep them out of
  // the timeline whenever the pack includes actual animation directories.
  const selected = animations.length ? animations : images;
  const groups = new Map();
  for (const entry of selected) {
    const directory = entry.name.includes('/') ? entry.name.slice(0, entry.name.lastIndexOf('/')) : '';
    if (!groups.has(directory)) groups.set(directory, []);
    groups.get(directory).push(entry);
  }
  return [...groups].sort(([a], [b]) => natural.compare(a,b)).map(([path, files]) => ({
    name: (path.split('/').slice(-2).join(' / ') || 'Imported images').replace(/[_-]/g,' '),
    entries: files.sort((a,b) => natural.compare(a.name,b.name))
  }));
}
export async function readImportGroups(files) {
  if (files.reduce((sum,f) => sum + f.size,0) > IMPORT_LIMITS.bytes) throw Error('Choose up to 25 MB of sprite files at a time.');
  const entries = [];
  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (/\.zip$/i.test(file.name)) {
      let total = 0;
      const archive = unzipSync(bytes, { filter: item => {
        if (!imageName.test(item.name) || /(^|\/)(?:__MACOSX|\._)/.test(item.name)) return false;
        total += item.originalSize;
        if (total > 64 * 1024 * 1024) throw Error('The extracted images exceed 64 MB. Import a smaller pack.');
        return true;
      }});
      for (const [name, data] of Object.entries(archive)) entries.push({ name, bytes: data });
    } else if (imageName.test(file.name)) entries.push({ name: file.name, bytes });
  }
  const groups = groupEntries(entries);
  if (!groups.length) throw Error('No PNG, JPEG, WebP or GIF images found in those files.');
  return groups;
}
export function decodeGif(bytes) {
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const parsed = parseGIF(buffer), width = parsed.lsd.width, height = parsed.lsd.height;
  validateImport(width,height,parsed.frames.filter(f => f.image).length);
  const decoded = decompressFrames(parsed,true), canvas = new Uint8ClampedArray(width * height * 4), frames = [];
  let previous, restore;
  for (const frame of decoded) {
    if (previous?.disposalType === 2) {
      const d = previous.dims;
      for (let y = d.top; y < Math.min(height,d.top+d.height); y++)
        for (let x = d.left; x < Math.min(width,d.left+d.width); x++) canvas.fill(0,(y*width+x)*4,(y*width+x+1)*4);
    } else if (previous?.disposalType === 3 && restore) canvas.set(restore);
    restore = frame.disposalType === 3 ? canvas.slice() : null;
    const d = frame.dims;
    for (let y = 0; y < d.height; y++) for (let x = 0; x < d.width; x++) {
      const from = (y*d.width+x)*4, tx = d.left+x, ty = d.top+y;
      if (tx >= width || ty >= height || !frame.patch[from+3]) continue;
      canvas.set(frame.patch.subarray(from,from+4),(ty*width+tx)*4);
    }
    frames.push({ width, height, pixels: rgbaToPixels(canvas), duration: Math.max(20,frame.delay || 100) });
    previous = frame;
  }
  if (!frames.length) throw Error('This GIF has no readable image frames.');
  return frames;
}
async function decodeStill(entry) {
  const blob = new Blob([entry.bytes]);
  let image, url;
  try {
    if (typeof createImageBitmap === 'function') image = await createImageBitmap(blob);
    else {
      url = URL.createObjectURL(blob);
      image = await new Promise((resolve,reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(Error('Unsupported image: '+entry.name)); img.src=url; });
    }
    validateImport(image.width,image.height);
    const canvas = document.createElement('canvas'); canvas.width=image.width; canvas.height=image.height;
    const ctx=canvas.getContext('2d'); ctx.drawImage(image,0,0);
    return [{ width:image.width,height:image.height,pixels:rgbaToPixels(ctx.getImageData(0,0,image.width,image.height).data),duration:125 }];
  } finally { image?.close?.(); if(url)URL.revokeObjectURL(url); }
}
export async function decodeGroup(group) {
  if (group.entries.length > IMPORT_LIMITS.frames) throw Error('Choose an animation with up to 256 images.');
  const decoded = [];
  for (const entry of group.entries) {
    const result = /\.gif$/i.test(entry.name) ? decodeGif(entry.bytes) : await decodeStill(entry);
    decoded.push(...result);
    validateImport(Math.max(...decoded.map(f=>f.width)),Math.max(...decoded.map(f=>f.height)),decoded.length);
  }
  return assembleFrames(decoded);
}
export function assembleFrames(decoded) {
  if(!decoded.length)throw Error('No readable frames found.');
  const width=Math.max(...decoded.map(f=>f.width)),height=Math.max(...decoded.map(f=>f.height));
  validateImport(width,height,decoded.length);
  return { width,height,frames:decoded.map(frame=>{
    const pixels=new Uint32Array(width*height),left=Math.floor((width-frame.width)/2),top=Math.floor((height-frame.height)/2);
    for(let y=0;y<frame.height;y++)pixels.set(frame.pixels.subarray(y*frame.width,(y+1)*frame.width),(y+top)*width+left);
    return {pixels,duration:frame.duration};
  }) };
}
