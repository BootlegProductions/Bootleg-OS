import assert from 'node:assert/strict';
import {selectLineRegion, eraseSelected} from '../js/line-erase.mjs';
const W=31,H=31,skin=[250,204,180,255],ink=[25,24,32,255],green=[80,210,125,255];
const image=()=>new Uint8ClampedArray(W*H*4);
function put(a,x,y,c){a.set(c,(y*W+x)*4);}
function at(a,x,y){return [...a.slice((y*W+x)*4,(y*W+x+1)*4)];}
function fixture(gap=false){const a=image();for(let y=3;y<=27;y++)for(let x=3;x<=27;x++)put(a,x,y,skin);
 for(let y=8;y<=22;y++)for(let x=10;x<=20;x++)if(x===10||x===20||y===8||y===22)put(a,x,y,ink);
 if(gap)put(a,15,22,skin);
 // A differently coloured hair patch touches the skin outside the line enclosure.
 for(let y=3;y<8;y++)for(let x=12;x<=18;x++)put(a,x,y,green);
 return a;}
let rgba=fixture(),original=rgba.slice();
let result=selectLineRegion(rgba,W,H,4,15);
assert(result.selected>0);
assert.equal(result.mask[15*W+15],0,'skin inside closed outline remains protected');
assert.equal(result.mask[4*W+15],0,'different-colour hair is not erased');
assert.equal(result.mask[8*W+10],0,'linework stays protected');
assert.deepEqual(rgba,original,'preview must not mutate artwork');
let output=eraseSelected(rgba,result.mask);
assert.equal(at(output,4,15)[3],0,'outside spill becomes transparent');
assert.deepEqual(at(output,15,15),skin,'inside colour remains byte-identical');
assert.deepEqual(at(output,10,15),ink,'dark linework remains byte-identical');
assert.deepEqual(at(output,15,4),green,'hair remains byte-identical');
assert.deepEqual(at(output,4,15).slice(0,3),skin.slice(0,3),'erasing changes alpha only');
rgba=fixture(true);
assert.equal(selectLineRegion(rgba,W,H,4,15,{gap:0}).mask[15*W+15],1,'a real gap can connect inside and outside');
assert.equal(selectLineRegion(rgba,W,H,4,15,{gap:1}).mask[15*W+15],0,'closing a tiny gap stops that leak');
// An anti-aliased grey outline is only protected above its luminance.
rgba=fixture();for(let x=10;x<=20;x++)put(rgba,x,22,[150,150,150,255]);
assert.equal(selectLineRegion(rgba,W,H,4,15,{lineThreshold:170,tolerance:180,gap:0}).mask[15*W+15],0);
assert.equal(selectLineRegion(rgba,W,H,4,15,{lineThreshold:100,tolerance:180,gap:0}).mask[15*W+15],1);
assert.equal(selectLineRegion(fixture(),W,H,10,15).reason,'line');
assert.equal(selectLineRegion(fixture(),W,H,0,0).reason,'transparent');
assert.equal(selectLineRegion(fixture(),W,H,-1,0).reason,'outside');
assert.equal(selectLineRegion(fixture(),W,H,NaN,0).reason,'outside');
assert.throws(()=>selectLineRegion(new Uint8Array(3),2,2,0,0),/dimensions/);
assert.throws(()=>eraseSelected(new Uint8Array(4),new Uint8Array(2)),/match/);
// Four-connected fill cannot jump diagonally across a one-pixel boundary.
rgba=image();put(rgba,2,2,skin);put(rgba,3,3,skin);
assert.equal(selectLineRegion(rgba,W,H,2,2,{gap:0}).selected,1);
// A large plain area is deliberately previewed, not silently rejected or committed.
rgba=new Uint8ClampedArray(512*512*4);for(let i=0;i<512*512;i++)rgba.set(skin,i*4);
result=selectLineRegion(rgba,512,512,0,0);assert.equal(result.selected,512*512);
console.log('Line erase: closed/gapped outlines, colour boundaries, antialias threshold, alpha-only erase, input validation and preview immutability passed.');
