(() => {
  if(!new URLSearchParams(location.search).has('motion'))return;
  const GRAVITY=9.81;
  const ui=document.getElementById('ui');
  const section=document.createElement('section');section.className='field';
  section.innerHTML='<div class="field-label">Device movement</div><button class="btn primary" id="enableMotion" style="width:100%">Enable movement</button><label for="motionOrientation" class="field-label" style="margin-top:12px">Device orientation</label><select id="motionOrientation"><option value="auto">Follow screen</option><option value="0">Portrait</option><option value="90">Landscape left</option><option value="-90">Landscape right</option><option value="180">Upside down</option></select><button class="btn" id="neutralMotion" style="margin-top:10px;width:100%">Set neutral position</button><button class="btn" id="flatMotion" style="margin-top:10px;width:100%">Flat is level</button><p class="hint" id="motionStatus" role="status">The water is level when the phone lies flat. To play another way, hold it how you like and tap Use this position.</p>';
  ui.insertBefore(section,ui.querySelector('.field'));
  let enabled=false,previous=null,latest=null,last=0,timer=null,level=[0,0,GRAVITY];
  const status=document.getElementById('motionStatus'),button=document.getElementById('enableMotion'),orientation=document.getElementById('motionOrientation');
  try{orientation.value=localStorage.getItem('water.motionOrientation')||'auto';}catch{}
  const tell=detail=>window.dispatchEvent(new CustomEvent('water-tilt',{detail}));
  function neutral(){
    if(!latest){status.textContent='Waiting for a movement sensor reading…';return;}
    level=latest.slice();status.textContent='That position is now level. Tilt or shake the device.';
  }
  function flat(){level=[0,0,GRAVITY];status.textContent='Level is now when the device lies flat.';}
  orientation.onchange=()=>{try{localStorage.setItem('water.motionOrientation',orientation.value);}catch{}previous=null;latest=null;};
  document.getElementById('neutralMotion').onclick=neutral;
  document.getElementById('flatMotion').onclick=flat;
  function sample(g){
    if(!enabled||document.hidden||!g||![g.x,g.y,g.z].every(Number.isFinite))return;
    const now=performance.now();if(now-last<20)return;last=now;
    const degrees=orientation.value==='auto'?(screen.orientation?.angle??window.orientation??0):Number(orientation.value);
    const a=degrees*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
    const point=[g.x*c-g.y*s,g.x*s+g.y*c,g.z];
    // A light smoothing of the held position, so the neutral position is not a shaky reading.
    latest=latest?latest.map((v,i)=>v*.7+point[i]*.3):point.slice();
    tell({x:point[0],y:point[1],z:point[2],level});
    // The older flat water page still reacts to a push with ripples at the near edge.
    const canvas=document.getElementById('water');if(!canvas)return;
    if(!previous){previous=point.slice();return;}
    const dx=point[0]-previous[0],dy=point[1]-previous[1],dz=point[2]-previous[2];
    previous=previous.map((v,i)=>v*.65+point[i]*.35);
    const force=Math.hypot(dx,dy,dz*.5);if(force<.16)return;
    const rect=canvas.getBoundingClientRect();
    const send=(x,y,strength)=>window.dispatchEvent(new CustomEvent('water-motion-impulse',{detail:{x:rect.left+x*rect.width,y:rect.top+y*rect.height,strength}}));
    const strength=Math.min(.65,force*.09);
    if(Math.abs(dx)>=Math.abs(dy))for(const y of [.3,.5,.7])send(dx>0?.90:.10,y,strength);
    else for(const x of [.3,.5,.7])send(x,dy>0?.12:.88,strength);
    if(Math.abs(dz)>2)send(.5,.5,Math.min(.6,Math.abs(dz)*.05));
  }
  window.addEventListener('devicemotion',e=>sample(e.accelerationIncludingGravity));
  window.addEventListener('water-native-motion',e=>sample(e.detail));
  button.onclick=async()=>{
    if(enabled){enabled=false;previous=null;latest=null;window.AndroidMotion?.stop();tell({off:true});button.textContent='Turn on tilt play';status.textContent='Movement is off.';clearTimeout(timer);return;}
    try{
      if(window.AndroidMotion){if(!window.AndroidMotion.start()){status.textContent='No accelerometer is available on this device.';return;}}
      else{
        if(!isSecureContext){status.textContent='Open the secure HTTPS link to use tilt play on iPhone or Android. Touch and duck drops still work here.';return;}
        if(!window.DeviceMotionEvent){status.textContent='This browser has no motion sensor support.';return;}
        if(typeof DeviceMotionEvent.requestPermission==='function'&&await DeviceMotionEvent.requestPermission()!=='granted'){status.textContent='Motion access is off. Allow Motion & Orientation for this website in Safari, then tap Turn on tilt play again.';return;}
      }
      enabled=true;previous=null;latest=null;button.textContent='Turn off tilt play';status.textContent='Tilt or shake the device. The water is level when it lies flat.';
      timer=setTimeout(()=>{if(enabled&&!latest)status.textContent='No movement readings yet. On iPhone, open this HTTPS link in Safari and allow Motion & Orientation.';},5000);
    }catch(error){status.textContent='Could not enable movement: '+error.message;}
  };
  document.addEventListener('visibilitychange',()=>{previous=null;});
  addEventListener('pagehide',()=>{enabled=false;window.AndroidMotion?.stop();clearTimeout(timer);});
})();
