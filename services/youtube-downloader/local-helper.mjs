import {existsSync} from 'node:fs';
import {delimiter, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createService} from './server.mjs';
import {collectYarn} from './yarn-sequence.mjs';

const bin = fileURLToPath(new URL('./bin/', import.meta.url));
const binary = join(bin, 'yt-dlp.exe');
if (process.platform === 'win32' && existsSync(binary)) {
  process.env.YTDLP = binary;
  process.env.PATH = [bin, process.env.PATH].filter(Boolean).join(delimiter);
}
const host = '127.0.0.1';
const port = 47832;
const origin = 'https://bootlegproductions.github.io';
process.env.ALLOWED_ORIGINS = origin;
let yarnBusy = false;
const server = createService({
  localHost: `${host}:${port}`,
  async localRoute({path, req, res, json}) {
    if (path !== '/yarn/sequence') return false;
    if (req.method !== 'POST') {
      json(405, {error: 'Use POST to collect a Yarn sequence.'});
      return true;
    }
    if (req.headers['content-type'] !== 'application/json') {
      json(415, {error: 'Expected JSON settings.'});
      return true;
    }
    if (yarnBusy) {
      json(409, {error: 'A Yarn sequence is already collecting.'});
      return true;
    }
    yarnBusy = true;
    const cancelled = new AbortController();
    const cancel = () => cancelled.abort();
    res.once('close', cancel);
    try {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 4096) {
          json(413, {error: 'The batch settings are too large.'});
          return true;
        }
      }
      const signal = AbortSignal.any([cancelled.signal, AbortSignal.timeout(90000)]);
      const archive = await collectYarn(JSON.parse(body), {signal});
      res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-Length': archive.length,
        'Content-Disposition': 'attachment; filename="bootleg-yarn-sequence.zip"'
      });
      res.end(archive);
    } catch (error) {
      if (!res.destroyed) json(400, {error: error.message});
    } finally {
      res.off('close', cancel);
      yarnBusy = false;
    }
    return true;
  }
});
server.on('error', error => {
  console.error(`Bootleg Helper could not start: ${error.message}`);
  process.exitCode = 1;
});
server.listen(port, host, () => console.log(`Bootleg Helper ready at http://${host}:${port}. Keep it open while downloading.`));
