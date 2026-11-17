import {crc32} from 'node:zlib';
import {clipId, parseClip, filename, boundedCount} from './yarn-core.mjs';

const MAX_ZIP_BYTES = 64 * 1024 * 1024;
const MAX_PAGE_BYTES = 1024 * 1024;

async function read(fetcher, url, limit, signal, mime) {
  const response = await fetcher(url, {redirect: 'error', signal});
  if (!response.ok) throw new Error(`Yarn returned HTTP ${response.status}.`);
  if (!response.body || !mime.test(response.headers.get('content-type') || '') ||
      Number(response.headers.get('content-length')) > limit) {
    await response.body?.cancel();
    throw new Error('Yarn did not return the expected file, or it exceeded the size limit.');
  }
  const chunks = [];
  let length = 0;
  for await (const chunk of response.body) {
    length += chunk.byteLength;
    if (length > limit) throw new Error('The sequence exceeds the 64 MB ZIP limit.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, length);
}

function zip(entries) {
  const files = [], directory = [];
  let offset = 0, directorySize = 0;
  for (const {name, data} of entries) {
    const path = Buffer.from(name);
    const checksum = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(33, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(path.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(33, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(path.length, 28);
    central.writeUInt32LE(offset, 42);
    files.push(local, path, data);
    directory.push(central, path);
    offset += local.length + path.length + data.length;
    directorySize += central.length + path.length;
  }
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directorySize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...files, ...directory, end]);
}

export async function collectYarn({url, before, after}, {fetcher = fetch, signal = AbortSignal.timeout(90000)} = {}) {
  const start = clipId(url);
  const counts = [boundedCount(before), boundedCount(after)];
  async function readClip(id) {
    const page = await read(fetcher, `https://getyarn.io/yarn-clip/${id}`, MAX_PAGE_BYTES, signal, /^text\/html\b/i);
    return parseClip(page.toString('utf8'), id);
  }
  const center = await readClip(start);
  const clips = [center], seen = new Set([start]);
  for (const [index, direction] of ['previous', 'next'].entries()) {
    let current = center;
    for (let i = 0; i < counts[index]; i++) {
      const id = current[direction];
      if (!id || seen.has(id)) break;
      seen.add(id);
      current = await readClip(id);
      if (direction === 'previous') clips.unshift(current);
      else clips.push(current);
    }
  }
  let remaining = MAX_ZIP_BYTES;
  const entries = [];
  for (const [index, clip] of clips.entries()) {
    const data = await read(fetcher, clip.video, remaining, signal, /^(?:video\/mp4|application\/octet-stream)\b/i);
    if (!data.length) throw new Error('Yarn returned an empty MP4.');
    remaining -= data.length;
    entries.push({name: filename(index, clip, start), data});
  }
  return zip(entries);
}
