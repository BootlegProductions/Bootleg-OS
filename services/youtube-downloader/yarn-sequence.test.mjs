import test from 'node:test';
import assert from 'node:assert/strict';
import {collectYarn} from './yarn-sequence.mjs';

const ids = ['11111111', '22222222', '33333333'].map(prefix => prefix + '-1234-1234-1234-123412341234');
const url = 'https://getyarn.io/yarn-clip/' + ids[1];
const settings = {url, before: 1, after: 1};

test('collects one ZIP with clips in scene order and stops loops', async () => {
  const fetcher = async input => {
    const id = new URL(input).pathname.split('/').at(-1);
    const index = ids.indexOf(id.replace('.mp4', ''));
    assert.notEqual(index, -1);
    if (input.endsWith('.mp4')) {
      return new Response('clip-' + index, {headers: {'content-type': 'video/mp4'}});
    }
    const html = [
      `<meta property="og:video:url" content="https://y.yarn.co/${id}.mp4">`,
      `<a title="Previous Clip" href="/yarn-clip/${ids[Math.max(0, index - 1)]}">`,
      `<a title="Next Clip" href="/yarn-clip/${ids[Math.min(2, index + 1)]}">`
    ].join('');
    return new Response(html, {headers: {'content-type': 'text/html'}});
  };
  const archive = await collectYarn({...settings, before: 2, after: 2}, {fetcher});
  const entries = [];
  let offset = 0;
  while (archive.readUInt32LE(offset) === 0x04034b50) {
    const length = archive.readUInt32LE(offset + 18);
    const pathLength = archive.readUInt16LE(offset + 26);
    const data = offset + 30 + pathLength;
    entries.push([archive.toString('utf8', offset + 30, data), archive.toString('utf8', data, data + length)]);
    offset = data + length;
  }
  assert.deepEqual(entries, ids.map((id, i) => [`00${i + 1}${i === 1 ? '_START' : ''}_${id}.mp4`, `clip-${i}`]));
  assert.equal(archive.readUInt32LE(-22 + archive.length), 0x06054b50);
});

test('stops if Yarn denies access or a URL is outside Yarn', async () => {
  await assert.rejects(collectYarn(settings, {fetcher: async () => new Response(null, {status: 403})}), /403/);
  await assert.rejects(collectYarn({...settings, url: 'https://example.com'}, {fetcher: () => assert.fail()}), /getyarn.io/);
});
