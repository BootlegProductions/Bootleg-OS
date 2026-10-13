// Bootleg OS Image Tools. Edits are made on a real RGBA canvas; checkerboard is preview only.
(() => {
  const $ = id => document.getElementById(id);
  const canvas = $('bg-canvas');
  if (!canvas) return;
  canvas.hidden = true;
  const ctx = canvas.getContext('2d', {willReadFrequently:true});
  const input = $('bg-input'), status = $('image-status');
  let original = null, fileName = 'cutout', working = null, brush = 'erase';
  let picking = false, drawing = false, lastPoint = null, busy = false, generation = 0;
  const history = [];
  const setStatus = value => { status.textContent = value; };
  const controls = ['auto-remove','key-remove','download-png','reset-edit','clean-white-fringe'];
  function enable(loaded) { controls.forEach(id => $(id).disabled = !loaded); $('undo-edit').disabled = !history.length; }
  function render() { if (working) ctx.putImageData(working, 0, 0); }
  function snapshot() { if (working) { history.push(new ImageData(new Uint8ClampedArray(working.data), canvas.width, canvas.height)); if (history.length > 8) history.shift(); $('undo-edit').disabled = false; } }
  function coords(event) { const r = canvas.getBoundingClientRect(); return {x:(event.clientX-r.left)*canvas.width/r.width,y:(event.clientY-r.top)*canvas.height/r.height}; }
  async function openFile(file) {
    if (!file || !/^image\/(png|jpeg|webp)$/.test(file.type)) { setStatus('Choose a PNG, JPG or WebP image.'); return; }
    const id = ++generation;
    try {
      const image = await createImageBitmap(file);
      if (id !== generation) { image.close(); return; }
      canvas.width = image.width; canvas.height = image.height;
      canvas.hidden = false;
      ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(image,0,0); image.close();
      original = ctx.getImageData(0,0,canvas.width,canvas.height);
      working = ctx.getImageData(0,0,canvas.width,canvas.height);
      history.length = 0; fileName = file.name.replace(/\.[^.]+$/,'');
      $('image-dimensions').textContent = `${canvas.width} × ${canvas.height} px`;
      $('empty-stage').hidden = true; enable(true);
      setStatus('Image ready. Remove its background or use the brush to edit it.');
    } catch (error) { setStatus(`Could not open that image: ${error.message}`); }
  }
  input.addEventListener('change', () => openFile(input.files[0]));
  const wrap = $('image-canvas-wrap');
  const brushPreview = document.createElement('div');
  brushPreview.className = 'image-brush-preview'; brushPreview.hidden = true;
  brushPreview.setAttribute('aria-hidden', 'true'); wrap.append(brushPreview);
  let hoverPoint = null;
  function updateBrushPreview(event) {
    if (event) hoverPoint = { x:event.clientX, y:event.clientY, type:event.pointerType };
    if (!hoverPoint || hoverPoint.type === 'touch' || !working || busy || picking) { brushPreview.hidden = true; return; }
    const rect = canvas.getBoundingClientRect(), parent = wrap.getBoundingClientRect();
    if (hoverPoint.x < rect.left || hoverPoint.x >= rect.right || hoverPoint.y < rect.top || hoverPoint.y >= rect.bottom) { brushPreview.hidden = true; return; }
    brushPreview.hidden = false; brushPreview.dataset.mode = brush;
    brushPreview.style.width = (+$('brush-size').value * rect.width / canvas.width) + 'px';
    brushPreview.style.height = (+$('brush-size').value * rect.height / canvas.height) + 'px';
    brushPreview.style.left = (hoverPoint.x - parent.left - wrap.clientLeft + wrap.scrollLeft) + 'px';
    brushPreview.style.top = (hoverPoint.y - parent.top - wrap.clientTop + wrap.scrollTop) + 'px';
  }
  canvas.addEventListener('pointerenter', updateBrushPreview);
  canvas.addEventListener('pointerleave', () => { hoverPoint = null; brushPreview.hidden = true; });
  window.addEventListener('resize', () => updateBrushPreview());
  window.addEventListener('scroll', () => { hoverPoint = null; brushPreview.hidden = true; }, true);

  wrap.addEventListener('dragover', e => { e.preventDefault(); wrap.classList.add('dragging'); });
  wrap.addEventListener('dragleave', () => wrap.classList.remove('dragging'));
  wrap.addEventListener('drop', e => { e.preventDefault(); wrap.classList.remove('dragging'); openFile(e.dataTransfer.files[0]); });
  $('key-tolerance').addEventListener('input', e => $('key-tolerance-value').value = e.target.value);
  $('brush-size').addEventListener('input', e => { $('brush-size-value').value = e.target.value; updateBrushPreview(); });
  document.querySelectorAll('[data-brush]').forEach(button => button.addEventListener('click', () => {
    brush = button.dataset.brush; updateBrushPreview();
    document.querySelectorAll('[data-brush]').forEach(b => b.classList.toggle('is-active', b === button));
  }));
  document.querySelectorAll('[data-preview]').forEach(button => button.addEventListener('click', () => {
    wrap.dataset.preview = button.dataset.preview;
    document.querySelectorAll('[data-preview]').forEach(b => b.classList.toggle('is-active', b === button));
  }));
  $('pick-colour').addEventListener('click', () => { if (!working) return; picking = true; updateBrushPreview(); setStatus('Click the background colour in the image.'); });
  $('key-remove').addEventListener('click', () => {
    if (!working) return;
    snapshot(); const target = $('key-colour').value.match(/[0-9a-f]{2}/gi).map(n=>parseInt(n,16));
    const tolerance = +$('key-tolerance').value, pixels = working.data;
    for (let i=0;i<pixels.length;i+=4) {
      const distance = Math.hypot(pixels[i]-target[0],pixels[i+1]-target[1],pixels[i+2]-target[2]);
      const keep = Math.max(0, Math.min(1,(distance-tolerance+12)/24));
      pixels[i+3] = Math.round(pixels[i+3]*keep);
    }
    render(); setStatus('Colour removed. Use Erase or Restore to touch up the result.');
  });
  $('fringe-tolerance').addEventListener('input', e => $('fringe-tolerance-value').value = e.target.value);
  $('clean-white-fringe').addEventListener('click', async () => {
    if (!working || busy) return;
    busy = true; updateBrushPreview(); $('clean-white-fringe').disabled = true;
    const id = generation;
    try {
      const { cleanWhiteFringe } = await import('./edge-cleanup.js?v=1');
      if (id !== generation) return;
      const cleaned = cleanWhiteFringe(working.data, canvas.width, canvas.height, +$('fringe-tolerance').value);
      if (!cleaned.removed) { setStatus('No connected white fringe found. Try a slightly higher tolerance or use the brush.'); return; }
      snapshot(); working = new ImageData(cleaned.data, canvas.width, canvas.height); render();
      setStatus('White fringe cleaned. Check with the Dark preview; Undo restores the previous result.');
    } catch (error) { setStatus(`Edge cleanup failed: ${error.message}`); }
    finally { busy = false; $('clean-white-fringe').disabled = !working; }
  });
  $('auto-remove').addEventListener('click', async () => {
    if (!working || busy) return;
    busy = true; updateBrushPreview(); $('auto-remove').disabled = true;
    const id = generation, sourceOriginal = original;
    setStatus('Loading the cutout model. The first download may take several minutes...');
    try {
      const [{ cutoutMask }, { checkRetainedSubject }] = await Promise.all([
        import('./auto-matte.bundle.js?v=6'), import('./matte-utils.js?v=2')
      ]);
      // Always segment the original, even if the current preview has been edited.
      const sourceCanvas = document.createElement('canvas'); sourceCanvas.width=canvas.width;sourceCanvas.height=canvas.height;
      sourceCanvas.getContext('2d').putImageData(sourceOriginal,0,0);
      const sourceBlob = await new Promise(resolve=>sourceCanvas.toBlob(resolve,'image/png'));
      const mask = await cutoutMask(sourceBlob, message => { if (id === generation) setStatus(message); }, mask => checkRetainedSubject(mask, sourceOriginal.data));
      if (id !== generation) return;
      checkRetainedSubject(mask, sourceOriginal.data); // Validate before taking a snapshot or changing a pixel.
      snapshot(); const pixels = working.data;
      for (let i=0;i<mask.length;i++) {
        const offset=i*4;
        pixels[offset]=sourceOriginal.data[offset]; pixels[offset+1]=sourceOriginal.data[offset+1]; pixels[offset+2]=sourceOriginal.data[offset+2];
        pixels[offset+3]=Math.round(sourceOriginal.data[offset+3]*mask[i]/255);
      }
      render(); setStatus('Cutout ready. Check the edges, touch up with the brush, then download PNG.');
    } catch (error) { const message = typeof error?.message === 'string' && error.message ? error.message : typeof error === 'string' ? error : typeof error === 'number' ? `Runtime stopped with code ${error}` : 'The cutout engine stopped unexpectedly'; console.error('Automatic cutout failed', error); setStatus(`Automatic cutout failed: ${message}. Colour key and brush remain available.`); }
    finally { busy=false; if (working) $('auto-remove').disabled=false; }
  });
  function dab(from,to) {
    const radius=+$('brush-size').value/2, pixels=working.data, source=original.data;
    const length=Math.hypot(to.x-from.x,to.y-from.y), steps=Math.max(1,Math.ceil(length/(radius*.4)));
    for(let s=0;s<=steps;s++) {
      const x=from.x+(to.x-from.x)*s/steps, y=from.y+(to.y-from.y)*s/steps;
      for(let py=Math.max(0,Math.floor(y-radius));py<Math.min(canvas.height,Math.ceil(y+radius));py++)
        for(let px=Math.max(0,Math.floor(x-radius));px<Math.min(canvas.width,Math.ceil(x+radius));px++) {
          if((px-x)**2+(py-y)**2>radius*radius)continue;
          const i=(py*canvas.width+px)*4;
          if(brush==='erase') pixels[i+3]=0;
          else { pixels[i]=source[i];pixels[i+1]=source[i+1];pixels[i+2]=source[i+2];pixels[i+3]=source[i+3]; }
        }
    }
    render();
  }
  canvas.addEventListener('pointerdown', e => {
    if(!working || busy)return;
    updateBrushPreview(e); e.preventDefault(); const p=coords(e);
    if(picking){ const i=(Math.min(canvas.height-1,Math.floor(p.y))*canvas.width+Math.min(canvas.width-1,Math.floor(p.x)))*4; $('key-colour').value='#'+Array.from(working.data.slice(i,i+3),n=>n.toString(16).padStart(2,'0')).join(''); picking=false;setStatus('Background colour selected. Adjust tolerance, then remove colour.');return; }
    snapshot(); drawing=true;lastPoint=p;canvas.setPointerCapture(e.pointerId);dab(p,p);
  });
  canvas.addEventListener('pointermove',e=>{updateBrushPreview(e);if(!drawing)return;const p=coords(e);dab(lastPoint,p);lastPoint=p;});
  function stop(){drawing=false;lastPoint=null;}
  canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);
  $('undo-edit').addEventListener('click',()=>{if(!history.length)return;working=history.pop();render();$('undo-edit').disabled=!history.length;setStatus('Last edit undone.');});
  $('reset-edit').addEventListener('click',()=>{if(!original)return;snapshot();working=new ImageData(new Uint8ClampedArray(original.data),canvas.width,canvas.height);render();setStatus('Original image restored.');});
  $('download-png').addEventListener('click',()=>{if(!working)return;canvas.toBlob(blob=>{if(!blob){setStatus('Could not create a PNG.');return;}const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=fileName+'-transparent.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);},'image/png');});
})();
