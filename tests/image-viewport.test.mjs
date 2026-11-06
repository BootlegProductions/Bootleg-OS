import assert from 'node:assert/strict';
import {clampZoom,fitZoom,wheelZoom} from '../js/image-viewport.mjs';
assert.equal(clampZoom(.001),.05);assert.equal(clampZoom(99),8);assert.equal(clampZoom(NaN),1);
assert.equal(fitZoom(2000,1000,1024,824),.5);
assert.equal(fitZoom(100,100,1024,824),1);
assert(wheelZoom(1,-100)>1);assert(wheelZoom(1,100)<1);
assert.equal(wheelZoom(8,-200),8);assert.equal(wheelZoom(.05,200),.05);
assert(Math.abs(wheelZoom(wheelZoom(.7,100),-100)-.7)<1e-9);
console.log('Viewport checks passed: fit sizing, zoom bounds, wheel direction and reversible scaling.');
