import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { build } from '../tools/pixel-studio/node_modules/esbuild/lib/main.js';
const require = createRequire(new URL('../tools/pixel-studio/package.json', import.meta.url));
const { GIFEncoder } = require('gifenc');
const { zipSync, strToU8 } = require('fflate');
const result = await build({entryPoints:[fileURLToPath(new URL('../js/pixel-import.js',import.meta.url))],bundle:true,platform:'node',format:'esm',write:false,nodePaths:[fileURLToPath(new URL('../tools/pixel-studio/node_modules',import.meta.url))]});
const imports = await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const {groupEntries,readImportGroups,decodeGif,assembleFrames,validateImport}=imports;

const groups=groupEntries([
 {name:'boots/rotations/south.png'},
 {name:'boots/animations/jump/south/frame_10.png'},
 {name:'boots/animations/jump/south/frame_2.png'},
 {name:'boots/animations/talk/south/frame_0.png'},
 {name:'__MACOSX/._preview.png'}
]);
assert.equal(groups.length,2);
assert.match(groups[0].entries[0].name,/frame_2/);
assert.equal(groups.flatMap(g=>g.entries).length,3);

const archive=zipSync({'art/frame_02.png':strToU8('fixture'),'art/frame_01.png':strToU8('fixture'),'metadata.json':strToU8('{}')});
const zipped=await readImportGroups([{name:'sprites.zip',size:archive.length,arrayBuffer:async()=>archive.buffer}]);
assert.equal(zipped[0].entries.length,2);
assert.equal(zipped[0].entries[0].name,'art/frame_01.png');

const gif=GIFEncoder();
const palette=[[0,0,0],[255,0,0],[0,0,255]];
gif.writeFrame(new Uint8Array([1,0,0,0,0,0]),3,2,{palette,transparent:true,transparentIndex:0,delay:80,dispose:2});
gif.writeFrame(new Uint8Array([0,0,0,0,0,2]),3,2,{palette,transparent:true,transparentIndex:0,delay:160,dispose:2});
gif.finish();
const frames=decodeGif(gif.bytes());
assert.equal(frames.length,2);
assert.equal(frames[0].width,3);assert.equal(frames[0].height,2);
assert.equal(frames[0].duration,80);assert.equal(frames[1].duration,160);
assert.equal(frames[0].pixels[0],0xff0000ff);
assert.equal(frames[1].pixels[0],0); // previous frame cleared by disposal 2
assert.equal(frames[1].pixels[5],0x0000ffff);

const native=assembleFrames([{width:2,height:1,pixels:new Uint32Array([0xff0000ff,0x00ff00ff]),duration:100},{width:4,height:3,pixels:new Uint32Array(12),duration:200}]);
assert.equal(native.width,4);assert.equal(native.height,3);
assert.deepEqual([...native.frames[0].pixels].slice(5,7),[0xff0000ff,0x00ff00ff]);
assert.throws(()=>validateImport(513,32));
assert.throws(()=>validateImport(32,32,257));
console.log('Pixel import: natural frame order, animation grouping, ZIP filtering, GIF transparency/disposal/timing, native rectangular dimensions and limits passed.');
