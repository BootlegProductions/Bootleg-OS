// Bootleg OS Pixel Studio. The editable source is here; the small GIF encoder is bundled for browsers.
import { GIFEncoder } from 'gifenc';
import { pixelBrushBounds } from './brush-geometry.js';
(() => {
  const $=id=>document.getElementById(id), canvas=$('pixel-canvas'), ctx=canvas.getContext('2d');
  if(!canvas)return;
  let size=32, frames=[], current=0, layer=0, tool='pencil', grid=true, playing=null, drawing=false;
  let history=[], colour=0xff0000ff;
  const shell=$('pixel-canvas-shell'), brushPreview=document.createElement('div');
  brushPreview.className='pixel-brush-preview';brushPreview.hidden=true;
  brushPreview.setAttribute('aria-hidden','true');shell.append(brushPreview);
  let hoverPoint=null;
  function updateBrushPreview(event){
    if(event)hoverPoint={clientX:event.clientX,clientY:event.clientY,pointerType:event.pointerType};
    if(!hoverPoint || hoverPoint.pointerType==='touch' || playing || !['pencil','eraser'].includes(tool) || +$('pixel-brush').value===1){brushPreview.hidden=true;return;}
    const rect=canvas.getBoundingClientRect(),parent=shell.getBoundingClientRect();
    if(hoverPoint.clientX<rect.left || hoverPoint.clientX>=rect.right || hoverPoint.clientY<rect.top || hoverPoint.clientY>=rect.bottom){brushPreview.hidden=true;return;}
    const p=point(hoverPoint),bounds=pixelBrushBounds(p.x,p.y,size,+$('pixel-brush').value);
    brushPreview.hidden=false;brushPreview.dataset.mode=tool;
    brushPreview.style.left=(rect.left-parent.left-shell.clientLeft+shell.scrollLeft+bounds.left*rect.width/size)+'px';
    brushPreview.style.top=(rect.top-parent.top-shell.clientTop+shell.scrollTop+bounds.top*rect.height/size)+'px';
    brushPreview.style.width=((bounds.right-bounds.left)*rect.width/size)+'px';
    brushPreview.style.height=((bounds.bottom-bounds.top)*rect.height/size)+'px';
  }
  canvas.addEventListener('pointerenter',updateBrushPreview);
  canvas.addEventListener('pointerleave',()=>{hoverPoint=null;brushPreview.hidden=true;});
  window.addEventListener('resize',()=>updateBrushPreview());
  window.addEventListener('scroll',()=>{hoverPoint=null;brushPreview.hidden=true;},true);

  const palettes={
    classic:['#000000','#ffffff','#ff0000','#00ff00','#0000ff','#ffff00','#00ffff','#ff00ff','#ff8000','#8000ff','#008000','#800000','#000080','#808080','#c0c0c0','#804000'],
    pastel:['#ffffff','#ffd1dc','#ffb7b2','#ffdac1','#fff1ad','#e2f0cb','#b5ead7','#b7e5ff','#c7ceea','#d7bde2','#f8c8dc','#cdb4db','#a2d2ff','#bde0fe','#a8d5ba','#77758b'],
    retro:['#000000','#0000aa','#00aa00','#00aaaa','#aa0000','#aa00aa','#aa5500','#aaaaaa','#555555','#5555ff','#55ff55','#55ffff','#ff5555','#ff55ff','#ffff55','#ffffff'],
    grey:['#000000','#111111','#222222','#333333','#444444','#555555','#666666','#777777','#888888','#999999','#aaaaaa','#bbbbbb','#cccccc','#dddddd','#eeeeee','#ffffff']
  };
  function setColour(hex){
    if(!/^#[0-9a-f]{6}$/i.test(hex))return;
    hex=hex.toLowerCase();colour=(parseInt(hex.slice(1),16)*256+255)>>>0;
    $('pixel-colour').value=hex;$('pixel-hex').value=hex;
    ['red','green','blue'].forEach((name,i)=>{const value=parseInt(hex.slice(1+i*2,3+i*2),16);$('pixel-'+name).value=value;$('pixel-'+name+'-value').value=value;});
  }
  function backgroundColour(){const mode=$('pixel-background').value;return mode==='transparent'?null:mode==='white'?'#ffffff':$('pixel-background-colour').value;}
  function exportComposite(frame){
    const pixels=composite(frame),bg=backgroundColour();
    if(bg){const rgb=parseInt(bg.slice(1),16),back=[rgb>>>16,(rgb>>>8)&255,rgb&255];
      for(let i=0;i<pixels.length;i++){const front=rgba(pixels[i]),alpha=front[3]/255;
        const mix=back.map((v,c)=>Math.round(front[c]*alpha+v*(1-alpha)));
        pixels[i]=((mix[0]<<24)|(mix[1]<<16)|(mix[2]<<8)|255)>>>0;
      }
    }return pixels;
  }
  function renderPalette(){
    $('pixel-palette').replaceChildren();palettes[$('pixel-palette-set').value].forEach(hex=>{const button=document.createElement('button');button.type='button';button.style.background=hex;button.title=hex;button.setAttribute('aria-label',`Choose ${hex}`);button.addEventListener('click',()=>setColour(hex));$('pixel-palette').append(button);});
  }
  function freshLayer(name='Layer 1'){return {name,visible:true,pixels:new Uint32Array(size*size)};}
  function freshFrame(){return {layers:frames[0]?.layers.map(x=>freshLayer(x.name)) || [freshLayer()]};}
  function copyFrame(frame){return {layers:frame.layers.map(x=>({name:x.name,visible:x.visible,pixels:new Uint32Array(x.pixels)}))};}
  function init(n=32){stop();size=n;frames=[{layers:[freshLayer()]}];current=0;layer=0;history=[];update();}
  function rgba(n){return [(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255];}
  function composite(frame){const out=new Uint32Array(size*size);for(const item of frame.layers)if(item.visible)for(let i=0;i<out.length;i++)if(item.pixels[i]&255)out[i]=item.pixels[i];return out;}
  function draw(){
    const cell=512/size;ctx.clearRect(0,0,512,512);const bg=backgroundColour();$('pixel-canvas-shell').style.backgroundColor=bg||'#cbd3e0';if(bg){ctx.fillStyle=bg;ctx.fillRect(0,0,512,512);}
    if($('pixel-onion').checked && current>0 && !playing){const back=composite(frames[current-1]);for(let i=0;i<back.length;i++)if(back[i]&255){const c=rgba(back[i]);ctx.fillStyle=`rgba(${c[0]},${c[1]},${c[2]},0.22)`;ctx.fillRect(i%size*cell,Math.floor(i/size)*cell,cell,cell);}}
    const data=composite(frames[current]);for(let i=0;i<data.length;i++)if(data[i]&255){const c=rgba(data[i]);ctx.fillStyle=`rgba(${c[0]},${c[1]},${c[2]},${c[3]/255})`;ctx.fillRect(i%size*cell,Math.floor(i/size)*cell,cell,cell);}
    if(grid && !playing){ctx.beginPath();for(let i=0;i<=size;i++){const p=i*cell+.5;ctx.moveTo(p,0);ctx.lineTo(p,512);ctx.moveTo(0,p);ctx.lineTo(512,p);}ctx.strokeStyle=`rgba(0,0,0,${+$('pixel-grid-opacity').value/100})`;ctx.lineWidth=1;ctx.stroke();}
    updateBrushPreview();
    $('pixel-info').textContent=`${size} × ${size} · frame ${current+1}/${frames.length} · ${frames[current].layers[layer].name}`;
  }
  function renderLists(){
    $('pixel-layers').replaceChildren();frames[current].layers.forEach((item,i)=>{
      const row=document.createElement('div');row.className='pixel-list-row'+(i===layer?' is-active':'');
      const select=document.createElement('button');select.type='button';select.textContent=item.name;select.addEventListener('click',()=>{layer=i;update();});
      const visible=document.createElement('button');visible.type='button';visible.textContent=item.visible?'◉':'○';visible.title=item.visible?'Hide layer':'Show layer';visible.setAttribute('aria-label',visible.title);visible.addEventListener('click',()=>{item.visible=!item.visible;update();});
      row.append(select,visible);$('pixel-layers').append(row);
    });
    $('pixel-frames').replaceChildren();frames.forEach((frame,i)=>{const b=document.createElement('button');b.type='button';b.className=i===current?'is-active':'';b.textContent=String(i+1).padStart(2,'0');b.setAttribute('aria-label',`Frame ${i+1}`);b.addEventListener('click',()=>{stop();current=i;layer=Math.min(layer,frames[i].layers.length-1);update();});$('pixel-frames').append(b);});
    $('pixel-undo').disabled=!history.length;
  }
  function update(){renderLists();draw();}
  function checkpoint(){history.push({frame:current,data:copyFrame(frames[current])});if(history.length>25)history.shift();$('pixel-undo').disabled=false;}
  function point(e){const rect=canvas.getBoundingClientRect();return {x:Math.min(size-1,Math.max(0,Math.floor((e.clientX-rect.left)/rect.width*size))),y:Math.min(size-1,Math.max(0,Math.floor((e.clientY-rect.top)/rect.height*size)))};}
  function paint(x,y){
    const arr=frames[current].layers[layer].pixels,bounds=pixelBrushBounds(x,y,size,+$('pixel-brush').value);
    for(let py=bounds.top;py<bounds.bottom;py++)for(let px=bounds.left;px<bounds.right;px++)arr[py*size+px]=tool==='eraser'?0:colour;
    draw();
  }
  function line(a,b){const steps=Math.max(Math.abs(b.x-a.x),Math.abs(b.y-a.y),1);for(let i=0;i<=steps;i++)paint(Math.round(a.x+(b.x-a.x)*i/steps),Math.round(a.y+(b.y-a.y)*i/steps));}
  function flood(x,y){const arr=frames[current].layers[layer].pixels,old=arr[y*size+x],value=colour;if(old===value)return;checkpoint();const stack=[y*size+x];while(stack.length){const i=stack.pop();if(arr[i]!==old)continue;arr[i]=value;const px=i%size,py=Math.floor(i/size);if(px>0)stack.push(i-1);if(px<size-1)stack.push(i+1);if(py>0)stack.push(i-size);if(py<size-1)stack.push(i+size);}draw();}
  function pick(x,y){const val=composite(frames[current])[y*size+x];if(!(val&255))return;setColour('#'+(val>>>8).toString(16).padStart(6,'0'));}
  let previous;
  canvas.addEventListener('pointerdown',e=>{if(playing)return;e.preventDefault();const p=point(e);if(tool==='picker'){pick(p.x,p.y);return;}if(tool==='fill'){flood(p.x,p.y);return;}checkpoint();drawing=true;previous=p;canvas.setPointerCapture(e.pointerId);paint(p.x,p.y);});
  canvas.addEventListener('pointermove',e=>{updateBrushPreview(e);if(!drawing)return;const p=point(e);line(previous,p);previous=p;});
  canvas.addEventListener('pointerup',()=>drawing=false);canvas.addEventListener('pointercancel',()=>drawing=false);
  document.querySelectorAll('[data-pixel-tool]').forEach(b=>b.addEventListener('click',()=>{tool=b.dataset.pixelTool;updateBrushPreview();document.querySelectorAll('[data-pixel-tool]').forEach(x=>x.classList.toggle('is-active',x===b));}));
  renderPalette();setColour('#ff0000');
  $('pixel-palette-set').addEventListener('change',renderPalette);
  $('pixel-colour').addEventListener('input',e=>setColour(e.target.value));
  $('pixel-hex').addEventListener('change',e=>{let hex=e.target.value;if(!hex.startsWith('#'))hex='#'+hex;setColour(hex);});
  ['red','green','blue'].forEach(name=>$('pixel-'+name).addEventListener('input',()=>setColour('#'+['red','green','blue'].map(n=>(+$('pixel-'+n).value).toString(16).padStart(2,'0')).join(''))));
  $('pixel-grid-opacity').addEventListener('input',e=>{$('pixel-grid-opacity-value').value=e.target.value+'%';draw();});
  $('pixel-background').addEventListener('change',()=>{$('pixel-background-colour').hidden=$('pixel-background').value!=='colour';draw();});
  $('pixel-background-colour').addEventListener('input',draw);
  $('pixel-brush').addEventListener('input',e=>{ $('pixel-brush-value').value=e.target.value;updateBrushPreview(); });
  $('pixel-fps').addEventListener('input',e=>{$('pixel-fps-value').value=e.target.value;if(playing){stop();play();}});
  $('pixel-onion').addEventListener('change',draw);
  $('pixel-grid').addEventListener('click',()=>{grid=!grid;$('pixel-grid').textContent=grid?'Hide grid':'Show grid';$('pixel-grid').setAttribute('aria-pressed',String(grid));draw();});
  $('pixel-undo').addEventListener('click',()=>{const last=history.pop();if(!last)return;current=last.frame;frames[current]=last.data;layer=Math.min(layer,frames[current].layers.length-1);update();});
  $('pixel-new').addEventListener('click',()=>{if(frames.some(f=>f.layers.some(l=>l.pixels.some(Boolean))) && !confirm('Start a new blank canvas? Your current drawing will be cleared.'))return;init(+$('pixel-size').value);});
  $('pixel-size').addEventListener('change',()=>{$('pixel-status').textContent='Press New blank canvas to apply this size.';});
  $('pixel-add-layer').addEventListener('click',()=>{const name=`Layer ${frames[current].layers.length+1}`;frames.forEach(f=>f.layers.push(freshLayer(name)));layer=frames[current].layers.length-1;update();});
  $('pixel-add-frame').addEventListener('click',()=>{stop();frames.splice(current+1,0,freshFrame());current++;update();});
  $('pixel-duplicate-frame').addEventListener('click',()=>{stop();frames.splice(current+1,0,copyFrame(frames[current]));current++;update();});
  $('pixel-delete-frame').addEventListener('click',()=>{if(frames.length===1)return;stop();frames.splice(current,1);current=Math.min(current,frames.length-1);layer=Math.min(layer,frames[current].layers.length-1);update();});
  function stop(){if(playing){clearInterval(playing);playing=null;$('pixel-play').textContent='Play';}if(frames.length)draw();}
  function play(){if(frames.length<2){$('pixel-status').textContent='Add another frame to preview an animation.';return;}const interval=1000/(+$('pixel-fps').value);playing=setInterval(()=>{current=(current+1)%frames.length;renderLists();draw();},interval);$('pixel-play').textContent='Stop';}
  $('pixel-play').addEventListener('click',()=>playing?stop():play());
  function pixelsToRGBA(pixels){const out=new Uint8ClampedArray(size*size*4);for(let i=0;i<pixels.length;i++){const c=rgba(pixels[i]);out.set(c,i*4);}return out;}
  function save(blob,filename){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
  $('pixel-download-png').addEventListener('click',()=>{const temp=document.createElement('canvas');temp.width=size;temp.height=size;temp.getContext('2d').putImageData(new ImageData(pixelsToRGBA(exportComposite(frames[current])),size,size),0,0);temp.toBlob(blob=>save(blob,'bootleg-pixel-art.png'),'image/png');});
  $('pixel-download-gif').addEventListener('click',()=>{
    const colors=new Map(), palette=[[0,0,0]];
    for(const frame of frames)for(const c of exportComposite(frame)){if(!(c&255))continue;const rgb=c>>>8;if(!colors.has(rgb)&&palette.length<256){colors.set(rgb,palette.length);palette.push([(rgb>>16)&255,(rgb>>8)&255,rgb&255]);}}
    const gif=GIFEncoder();for(const frame of frames){const merged=exportComposite(frame),indexed=new Uint8Array(size*size);for(let i=0;i<merged.length;i++){const c=merged[i];if(!(c&255))continue;const rgb=c>>>8;let index=colors.get(rgb);if(index===undefined){let best=Infinity;for(let j=1;j<palette.length;j++){const p=palette[j],d=(p[0]-(rgb>>16))**2+(p[1]-((rgb>>8)&255))**2+(p[2]-(rgb&255))**2;if(d<best){best=d;index=j;}}}indexed[i]=index;}gif.writeFrame(indexed,size,size,{palette,transparent:true,transparentIndex:0,delay:Math.round(1000/(+$('pixel-fps').value)),repeat:0,dispose:2});}
    gif.finish();save(new Blob([gif.bytes()],{type:'image/gif'}),'bootleg-pixel-animation.gif');$('pixel-status').textContent=`Exported ${frames.length} frame${frames.length===1?'':'s'} as GIF.`;
  });
  $('pixel-import').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const image=await createImageBitmap(file),temp=document.createElement('canvas');temp.width=size;temp.height=size;const t=temp.getContext('2d');t.imageSmoothingEnabled=false;const scale=Math.min(size/image.width,size/image.height),w=Math.max(1,Math.round(image.width*scale)),h=Math.max(1,Math.round(image.height*scale));t.drawImage(image,Math.floor((size-w)/2),Math.floor((size-h)/2),w,h);image.close();checkpoint();const data=t.getImageData(0,0,size,size).data,layerData=frames[current].layers[layer].pixels;for(let i=0;i<layerData.length;i++)layerData[i]=((data[i*4]<<24)|(data[i*4+1]<<16)|(data[i*4+2]<<8)|data[i*4+3])>>>0;update();$('pixel-status').textContent='Image imported into the selected layer.';}catch(err){$('pixel-status').textContent='Could not import image: '+err.message;}});
  init();
})();
