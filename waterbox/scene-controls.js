(() => {
  // Anything that goes wrong shows as a red bar at the top (tap it to hide), so a blank screen always says why.
  let bar=null,lines=[];
  window.waterReport=text=>{
    if(!document.body){addEventListener('DOMContentLoaded',()=>window.waterReport(text),{once:true});return;}
    if(lines.includes(text))return;lines.push(text);lines=lines.slice(-3);
    if(!bar){bar=document.createElement('div');bar.setAttribute('role','alert');bar.style.cssText='position:fixed;left:0;right:0;top:0;z-index:99999;background:#b00020;color:#fff;font:14px/1.4 system-ui,sans-serif;padding:10px 14px;white-space:pre-wrap;word-break:break-word';bar.onclick=()=>{bar.remove();bar=null;lines=[];};document.body.append(bar);}
    bar.textContent=lines.join(' | ');
  };
  addEventListener('error',e=>window.waterReport('Error: '+e.message+(e.filename?' ('+e.filename.split('/').pop()+':'+e.lineno+')':'')));
  addEventListener('unhandledrejection',e=>window.waterReport('Error: '+String((e.reason&&e.reason.message)||e.reason)));
})();
(() => {
  // The Pool tank starts once with visible water: ripples on and the tiled floor (settings saved from the other scenes could leave it blank).
  try{if(/\/pool\//.test(location.pathname)&&/[?&]motion/.test(location.search)&&!localStorage.getItem('water.poolTankInit')){localStorage.setItem('water.poolTankInit','1');localStorage.setItem('water.poolIntensity','70');localStorage.setItem('water.floorMode','tiled');}}catch{}
  const read=(key,fallback)=>{try{return localStorage.getItem(key)||fallback;}catch{return fallback;}};
  const name=read('water.graphics','low');
  const profiles={low:{ratio:1,surface:.8,simulation:192,caustic:768,segments:128,fps:30},medium:{ratio:1.25,surface:1,simulation:320,caustic:1024,segments:192,fps:45},high:{ratio:1.75,surface:1,simulation:512,caustic:1536,segments:256,fps:60}};
  window.WATER_GRAPHICS={...(profiles[name]||profiles.low),name:profiles[name]?name:'low'};
  try{localStorage.setItem('water.floorMode','tiled');}catch{}
  const bottom=read('water.bottomColor','#000000');
  window.WATER_FLOOR={color:/^#[0-9a-f]{6}$/i.test(bottom)?bottom:'#000000',solid:false};
  document.addEventListener('DOMContentLoaded',()=>{
    const motion=new URLSearchParams(location.search).has('motion');
    const page=location.pathname.includes('/pool/')?'pool':location.pathname.includes('/caustic/')||location.pathname.includes('/waterbox/')?'caustic':location.pathname.includes('/glass/')?'glass':location.pathname.includes('/ocean-app/')?'ocean':'surface';
    const tank=new URLSearchParams(location.search).has('tank');
    const current=tank?'glass':page==='ocean'?'ocean':page==='glass'?'bottle':motion?(page==='pool'?'pooltilt':'motion'):page;
    const bar=document.createElement('section');bar.className='field';bar.id='scenes';
    bar.innerHTML='<div class="field-label"><label for="sceneMode">Water scene</label></div><select id="sceneMode"><option value="motion">Motion water</option></select><div class="field-label" style="margin-top:14px"><label for="graphics">Graphics quality</label></div><select id="graphics"><option value="low">Low · tablet</option><option value="medium">Medium</option><option value="high">High</option></select>';
    const ui=document.getElementById('ui');ui.querySelector('.top').after(bar);
    if(page==='pool'||page==='caustic'||page==='glass'||page==='ocean'){
      if(page!=='glass'&&page!=='ocean'){
      const floor=document.createElement('section');floor.className='field';
      floor.innerHTML='<div class="field-label"><label for="bottomPattern">Bottom</label></div><select id="bottomPattern"><option value="tiled">Tiled</option><option value="solid">Solid colour</option></select><div class="colorrow" style="margin-top:12px"><input id="bottomColor" type="color" aria-label="Bottom colour"><span id="bottomHex"></span></div><div class="swatches">'+['#000000','#777777','#dedede','#176a79','#182738','#c4ae8d'].map(c=>'<button class="swatch" style="background:'+c+'" data-bottom="'+c+'" aria-label="Bottom colour '+c+'"></button>').join('')+'</div>';
      ui.querySelector('#modeFields').append(floor);floor.hidden=true;
      const pattern=document.getElementById('bottomPattern'),colour=document.getElementById('bottomColor'),hex=document.getElementById('bottomHex');
      pattern.value=WATER_FLOOR.solid?'solid':'tiled';colour.value=WATER_FLOOR.color;hex.textContent=WATER_FLOOR.color.toUpperCase();
      function applyFloor(){WATER_FLOOR.color=colour.value;WATER_FLOOR.solid=pattern.value==='solid';hex.textContent=colour.value.toUpperCase();try{localStorage.setItem('water.bottomColor',colour.value);localStorage.setItem('water.floorMode',pattern.value);}catch{}dispatchEvent(new Event('water-floor-change'));}
      pattern.onchange=applyFloor;colour.oninput=()=>{pattern.value='solid';applyFloor();};
      floor.querySelectorAll('[data-bottom]').forEach(button=>button.onclick=()=>{colour.value=button.dataset.bottom;pattern.value='solid';applyFloor();});
      }
      const open=document.getElementById('open');
      const show=on=>{ui.classList.toggle('off',!on);ui.inert=!on;open.classList.toggle('visible',!on);};
      document.getElementById('close').onclick=()=>{show(false);open.focus();};open.onclick=()=>{show(true);document.getElementById('sceneMode').focus();};
      addEventListener('keydown',e=>{if(!e.target.matches('input,select')&&e.key.toLowerCase()==='h'){e.stopImmediatePropagation();show(ui.classList.contains('off'));}});
      const full=document.createElement('button');full.id='full';full.className='btn primary';full.textContent='Fullscreen ↗';full.onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().then(()=>show(false)).catch(()=>{});};ui.append(full);
      if(page==='caustic'){const pause=document.createElement('button');pause.id='scenePause';pause.className='btn';pause.textContent='Pause water';pause.onclick=()=>{if(!window.lite)return;lite.state.paused=!lite.state.paused;pause.textContent=lite.state.paused?'Resume water':'Pause water';};ui.append(pause);}
      if(innerWidth<600)show(false);
    }
    document.getElementById('sceneMode').value=current;
    document.getElementById('sceneMode').onchange=e=>{location.href={surface:'/water_ripples_v2.html',pool:'/pool/',motion:'/waterbox/?motion=1'}[e.target.value];};
    document.getElementById('graphics').value=window.WATER_GRAPHICS.name;
    document.getElementById('graphics').onchange=e=>{try{localStorage.setItem('water.graphics',e.target.value);}catch{}location.reload();};
  });
})();
