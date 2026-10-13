// Small U²-Net model fallback. Uses the browser's WASM runtime and a local model asset.
import * as ort from 'onnxruntime-web/wasm';
ort.env.wasm.numThreads = 1;
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0-dev.20250409-89f8206ba4/dist/';
let session;
export async function compactMask(blob, status = () => {}) {
  status('Loading the compact cutout engine…');
  if (!session) session = ort.InferenceSession.create(new URL('../assets/models/u2netp.onnx', import.meta.url).href, {
    executionProviders: ['wasm'], graphOptimizationLevel: 'all'
  }).catch(error => { session = null; throw error; });
  const runtime = await session;
  const image = await createImageBitmap(blob);
  try {
    const source = document.createElement('canvas'); source.width = 320; source.height = 320;
    const ctx = source.getContext('2d', {willReadFrequently: true});
    // Composite transparent pixels on white so RGB inference sees a complete image.
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,320,320); ctx.drawImage(image,0,0,320,320);
    const rgba = ctx.getImageData(0,0,320,320).data;
    let peak = 1; for(let i=0;i<rgba.length;i+=4) peak=Math.max(peak,rgba[i],rgba[i+1],rgba[i+2]);
    const plane=320*320, input=new Float32Array(plane*3), mean=[.485,.456,.406], std=[.229,.224,.225];
    for(let i=0;i<plane;i++) for(let c=0;c<3;c++) input[c*plane+i]=(rgba[i*4+c]/peak-mean[c])/std[c];
    status('Finding the subject with the compact model…');
    const outputs=await runtime.run({[runtime.inputNames[0]]:new ort.Tensor('float32',input,[1,3,320,320])});
    const prediction=outputs[runtime.outputNames[0]].data;
    let min=Infinity,max=-Infinity;for(const v of prediction){if(Number.isFinite(v)){min=Math.min(min,v);max=Math.max(max,v);}}
    if(!Number.isFinite(min)||max-min<1e-8)throw new Error('The model could not find a distinct subject in this image');
    const small=ctx.createImageData(320,320);
    for(let i=0;i<plane;i++){const value=Math.round(255*Math.max(0,Math.min(1,(prediction[i]-min)/(max-min))));small.data[i*4]=small.data[i*4+1]=small.data[i*4+2]=value;small.data[i*4+3]=255;}
    ctx.putImageData(small,0,0);
    const scaled=document.createElement('canvas');scaled.width=image.width;scaled.height=image.height;
    const target=scaled.getContext('2d',{willReadFrequently:true});target.drawImage(source,0,0,image.width,image.height);
    const data=target.getImageData(0,0,image.width,image.height).data, mask=new Uint8Array(image.width*image.height);
    for(let i=0;i<mask.length;i++)mask[i]=data[i*4];return mask;
  } finally { image.close(); }
}
