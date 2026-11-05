import {selectLineRegion} from './line-erase.mjs?v=1';
self.onmessage = ({data}) => {
  try {
    const result = selectLineRegion(data.rgba, data.width, data.height, data.x, data.y, data.options);
    self.postMessage(result, [result.mask.buffer]);
  } catch (error) { self.postMessage({error:error.message || 'Could not select this area.'}); }
};
