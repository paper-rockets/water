(() => {
  document.addEventListener('DOMContentLoaded',()=>{
    const ui=document.getElementById('ui');if(!ui)return;
    const style=document.createElement('style');style.textContent=`
      #ui{width:300px;max-width:calc(100vw - 24px);padding:16px;font-size:14px}
      #ui .top{margin-bottom:20px;align-items:center}#ui h1{font-size:17px;letter-spacing:.07em}
      #ui .muted{font-size:12px;line-height:1.5}#ui .close{min-width:44px;min-height:44px;margin:-8px -8px -8px 0;font-size:28px}
      #ui .field-label,#modeFields label{font-size:14px;margin-bottom:8px;font-weight:600}
      #ui .field-label label{display:flex;justify-content:space-between;align-items:center;gap:8px;flex:1}
      #ui select{min-height:44px;font-size:14px}#ui input[type=range]{height:32px}#ui .field{margin-bottom:20px}
      #ui .swatches{gap:4px;flex-wrap:wrap}#ui .swatch{width:40px;height:40px;position:relative}#ui .swatch:after{content:'';position:absolute;inset:-2px}
      #ui .btn,#modeFields button{min-height:44px;font-size:14px}#ui output{font-size:12px}
      #ui .buttons{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:8px 0 16px}
      #moreSettings{position:static;width:auto;padding:0;background:none;border:0;backdrop-filter:none;margin-top:12px}
      #moreSettings:after{display:none}#moreSettings>summary{font:600 14px system-ui;letter-spacing:0;list-style:revert;cursor:pointer;min-height:44px;padding:12px 0;color:#c7e1e9}
      #moreSettings .field{margin-top:16px}#moreSettings p{font-size:11px;line-height:1.6;color:#9ab0b9}
      #open{min-height:44px;font-size:14px}#hex,#bottomHex{display:none}
    `;document.head.append(style);const polish=document.createElement("link");polish.rel="stylesheet";polish.href="/play-menu.css";document.head.append(polish);
    ui.querySelector('h1').textContent='WATER PLAY';ui.querySelector('.top .muted').textContent='Tap or draw on the water.';
    const open=document.getElementById('open');open.textContent='Play menu';open.setAttribute('aria-label','Open play menu');
    const advanced=document.createElement('details');advanced.id='moreSettings';advanced.innerHTML='<summary>Extra settings</summary>';
    const basic=document.createElement('div');basic.id='playSettings';
    ui.append(basic,advanced);
    function field(id,dest){
      const input=document.getElementById(id);if(!input)return;
      const label=ui.querySelector('label[for="'+id+'"]');
      const existing=input.closest('section.field');
      if(existing&&existing.id!=='scenes'&&id!=='bottomPattern'&&id!=='motionOrientation'){dest.append(existing);return;}
      const wrapper=document.createElement('section');wrapper.className='field';
      if(label){if(label.parentElement.classList.contains('field-label'))wrapper.append(label.parentElement);else{const row=document.createElement('div');row.className='field-label';row.append(label);wrapper.append(row);}}
      wrapper.append(input);dest.append(wrapper);
    }
    for(const id of ['sceneMode','material','poolMaterial','causticMaterial','poolView','floor','poolIntensity','viscosity','ripple','waves','glassFill','oceanFill','tankFill','boxTiles'])field(id,basic);
    // Floor colour remains part of play; the texture choice goes under More settings.
    const colour=null; // Water box always has pool tiles; no floor-colour controls.
    if(colour){field('bottomPattern',advanced);const block=colour.closest('section.field');const label=document.createElement('div');label.className='field-label';label.textContent='Floor colour';block.prepend(label);basic.append(block);}
    field('duck',basic);const bg=document.getElementById('tankBgRow');if(bg){bg.classList.add('field');basic.append(bg);}
    const motion=document.getElementById('enableMotion');if(motion){const block=motion.closest('section');basic.prepend(block);motion.textContent='Turn on tilt play';document.getElementById('neutralMotion').textContent='Use this position';field('motionOrientation',advanced);}
    for(const id of ['graphics','coating','causticCoating','chop','light','snd','quality','turb'])field(id,advanced);
    for(const id of ['sunCtl','lampCtl']){const group=document.getElementById(id);if(group)advanced.append(group);}
    const segments=ui.querySelector('#modeFields .seg');if(segments)advanced.prepend(segments);
    ui.querySelectorAll('p.hint,#modeFields p,#stats').forEach(node=>{if(node.id!=='motionStatus')advanced.append(node);});
    const buttons=document.createElement('div');buttons.className='buttons';
    for(const id of ['pause','poolPause','scenePause','full']){const button=document.getElementById(id);if(button){button.classList.add('btn');button.textContent=id==='full'?'Big screen':'Pause';button.hidden=true;button.inert=true;button.style.display="none";}}
    ui.querySelector('.top').after(basic);basic.after(buttons);buttons.after(advanced);
    for(const id of ['scenes','modeFields']){const node=document.getElementById(id);if(node&&!node.children.length)node.remove();}
    const labels={sceneMode:'Play with',material:'Water look',poolMaterial:'Water look',causticMaterial:'Water look',poolView:'Look from',floor:'Colour',poolIntensity:'Big ripples',viscosity:'Thick water',ripple:'Big ripples',waves:'Big waves',graphics:'Picture quality',coating:'Shiny colour',causticCoating:'Shiny colour',chop:'Wave speed',light:'Shine',snd:'Sound',quality:'Picture detail',turb:'Extra movement',motionOrientation:'How you hold it',bottomPattern:'Floor pattern',duck:'Rubber ducks'};
    for(const [id,text] of Object.entries(labels)){const label=ui.querySelector('label[for="'+id+'"]');if(label){for(const node of [...label.childNodes])if(node.nodeType===Node.TEXT_NODE)node.remove();label.prepend(document.createTextNode(text+' '));}}
    const hint=document.getElementById('viscosityHint');if(hint)hint.textContent='Water ← → Honey';
    const names={holographic:'Rainbow',soap:'Bubble', 'candy-chrome':'Shiny candy','cyber-opal':'Pearl',bubblegum:'Pink','electric-lime':'Lime','blue-raspberry':'Ocean blue',honey:'Honey','amethyst-crystal':'Purple','cosmic-violet':'Space',solid:'Plain water',clear:'Clear water'};
    function renameOptions(){
      for(const id of ['material','poolMaterial','causticMaterial'])document.getElementById(id)?.querySelectorAll('option').forEach(option=>{const text=names[option.value];if(text&&option.textContent!==text)option.textContent=text;});
    }
    renameOptions();for(const id of ['material','poolMaterial','causticMaterial']){const select=document.getElementById(id);if(select)new MutationObserver(renameOptions).observe(select,{childList:true,subtree:true});}
    const sceneNames={surface:'Shiny water',pool:'Deep water',motion:'Water box (tilt and shake)',bottle:'Water bottle (pour and splash)'};
    document.getElementById('sceneMode').querySelectorAll('option').forEach(option=>option.textContent=sceneNames[option.value]);
    const view=document.getElementById('poolView');if(view)view.querySelector('[value="top"]').textContent='From above';

    addEventListener('keydown',e=>{if(e.code==='Space'){e.stopImmediatePropagation();if(!e.target.closest('button,input,select,summary'))e.preventDefault();}},true);
    // Visual choices retain the native controls as the renderer's state bridge.
    // They never receive focus or appear in the child's menu.
    const drawIcon=(value)=>'<svg viewBox="0 0 40 28" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">'+(value==='motion'?'<path d="M8 6 32 2 35 23 11 27Z"/><path d="M12 16c4-7 10 7 18-2"/>':value==='caustic'?'<path d="m20 2 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z"/>':'<path d="M3 9c6-8 10 8 17 0s11 8 17 0M3 20c6-8 10 8 17 0s11 8 17 0"/>')+'</svg>';
    function visualPicker(select,material){
      select.hidden=true;select.tabIndex=-1;select.setAttribute('aria-hidden','true');
      const group=document.createElement('div');group.className=material?'look-picker':'scene-picker';group.setAttribute('role','group');group.setAttribute('aria-label',material?'Water look':'Play with');select.after(group);
      let signature='';
      function sync(){
        const options=[...select.options],next=options.map(o=>o.value+o.textContent).join('|');
        if(signature!==next){signature=next;group.replaceChildren();
          for(const option of options){
            const button=document.createElement('button');button.type='button';button.className=material?'look-choice':'scene-choice';button.dataset.value=option.value;button.setAttribute('aria-label',option.textContent);
            if(material){const img=document.createElement('img');img.src='../matcaps/'+(option.value==='solid'?'clear':option.value)+'.png';img.alt='';img.width=64;img.height=64;button.append(img);}
            else button.innerHTML=drawIcon(option.value);
            const label=document.createElement('span');label.textContent=option.textContent.replace(' (tilt and shake)','');button.append(label);
            button.onclick=()=>{select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));sync();};group.append(button);
          }
        }
        for(const button of group.children)button.setAttribute('aria-pressed',String(button.dataset.value===select.value));
      }
      select.addEventListener('change',sync);new MutationObserver(sync).observe(select,{childList:true,subtree:true,characterData:true});sync();
      const oldLabel=ui.querySelector('label[for="'+select.id+'"]');if(oldLabel){oldLabel.removeAttribute('for');oldLabel.id=select.id+'-heading';group.setAttribute('aria-labelledby',oldLabel.id);}
    }
    for(const id of ['material','poolMaterial','causticMaterial']){const select=document.getElementById(id);if(select)visualPicker(select,true);}
    const scenes=document.getElementById('sceneMode');scenes.closest('section.field').hidden=true;
    ui.querySelector('h1').textContent='Duck pond';ui.querySelector('.top .muted').textContent='Pick a look. Make a splash.';
    document.getElementById('close').setAttribute('aria-label','Back to water');
    const play=document.createElement('button');play.type='button';play.className='back-to-water';play.textContent="Let's play";play.onclick=()=>document.getElementById('close').click();ui.append(play);
    open.addEventListener('click',()=>requestAnimationFrame(()=>ui.querySelector('.look-choice[aria-pressed="true"]')?.focus()));
    const floor=document.getElementById('floor');if(floor){const section=floor.closest('section.field');if(section){advanced.prepend(section);section.querySelector('label').textContent='Plain water colour';}}
    // Keep the child's menu about play. The outside camera is a technical view.
    const outside=document.getElementById('outsideRow');if(outside)advanced.append(outside);
    for(const id of ['boxTiles','poolView']){const input=document.getElementById(id);if(input){const section=input.closest('section.field');if(section)advanced.append(section);}}
    for(const p of advanced.querySelectorAll('p'))if(/Space|fullscreen|H =/.test(p.textContent))p.hidden=true;
    // All controls keep their original IDs and handlers; only the menu grouping and words change.
  });
})();

