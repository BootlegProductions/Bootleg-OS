import {checkRom,romTitle} from './arcade-model.mjs';
const status=document.getElementById('status');let loaded=false,objectUrl,timer;
function fail(message){clearTimeout(timer);status.hidden=false;status.textContent=message+' Use Back to library to retry.';}
window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='g4tch-load-rom'||loaded)return;
  const file=event.data.file;if(!(file instanceof File))return;
  const error=checkRom(file);if(error){fail(error);return;}
  loaded=true;objectUrl=URL.createObjectURL(file);
  status.textContent='Loading the Mega Drive player… The first launch downloads the emulator core.';
  Object.assign(window,{
    EJS_player:'#game',EJS_core:'segaMD',EJS_gameUrl:objectUrl,EJS_gameName:romTitle(file.name).replace(/[<>&"']/g, ''),
    EJS_pathtodata:'https://cdn.emulatorjs.org/4.2.3/data/',EJS_color:'#69d7f3',EJS_backgroundColor:'#070d1c',
    EJS_startOnLoaded:false,EJS_threads:false,EJS_AdUrl:'',EJS_volume:.5,EJS_startButtonName:'Start cartridge',
    EJS_ready(){clearTimeout(timer);status.hidden=true;},
    EJS_onGameStart(){clearTimeout(timer);status.hidden=true;},
    EJS_onExit(){status.hidden=false;status.textContent='Cartridge stopped. Use Back to library to choose another game.';}
  });
  timer=setTimeout(()=>fail('The player is taking too long to load. Check your connection or try a different browser.'),60000);
  const loader=document.createElement('script');loader.src=window.EJS_pathtodata+'loader.js';loader.onerror=()=>fail('The emulator could not be downloaded.');document.body.append(loader);
});
window.addEventListener('error',()=>{if(loaded)fail('The player hit an error. This cartridge or browser may not be compatible.');});
window.addEventListener('unhandledrejection',()=>{if(loaded)fail('The player could not start this cartridge.');});
window.addEventListener('pagehide',()=>{clearTimeout(timer);if(objectUrl)URL.revokeObjectURL(objectUrl);});
