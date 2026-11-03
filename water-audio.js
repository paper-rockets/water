(()=>{
  let context=null,bus=null,buffers={},sources=[],played=0,smallPlayed=0,dragPlayed=0,lastTouch=0,lastBig=0,dragging=false;
  const slices=[];
  function unlock(){
    if(!context){try{
      context=new(window.AudioContext||window.webkitAudioContext)();const master=context.createGain();master.gain.value=.6;
      const limiter=context.createDynamicsCompressor();limiter.threshold.value=-8;limiter.knee.value=8;limiter.ratio.value=8;master.connect(limiter);limiter.connect(context.destination);
      bus=context.createBiquadFilter();bus.type='lowpass';bus.frequency.value=2600;bus.Q.value=.4;bus.connect(master);
      for(const name of ['big1','small1','small2','small3','swirl'])fetch('../sounds/'+name+'.ogg').then(r=>r.arrayBuffer()).then(b=>context.decodeAudioData(b)).then(b=>{buffers[name]=b;if(name==='swirl'){const d=b.getChannelData(0),win=Math.floor(b.sampleRate*.25),levels=[];for(let i=0;i+win<d.length;i+=win){let energy=0;for(let j=i;j<i+win;j++)energy+=d[j]*d[j];levels.push([i/b.sampleRate,energy/win]);}const top=Math.max(...levels.map(p=>p[1]));for(const [t,e]of levels)if(e>top*.09)slices.push(t);}}).catch(()=>{});
    }catch{return;}}
    if(context.state==='suspended')context.resume().catch(()=>{});
  }
  function play(buffer,gain=.4,offset=0,length=1.7,attack=.012,release=.3){
    if(!context||!buffer||context.state!=='running'||document.hidden)return;
    if(sources.length>=6){const old=sources.shift();try{old.stop();}catch{}}
    const source=context.createBufferSource(),g=context.createGain(),now=context.currentTime,rate=.97+Math.random()*.06,duration=Math.min(length,(buffer.duration-offset)/rate);
    source.buffer=buffer;source.playbackRate.value=rate;g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(gain,now+attack);g.gain.setValueAtTime(gain,now+Math.max(attack,duration-release));g.gain.linearRampToValueAtTime(0,now+duration);source.connect(g);g.connect(bus);sources.push(source);played++;
    source.onended=()=>{sources=sources.filter(s=>s!==source);source.disconnect();g.disconnect();};source.start(now,offset);source.stop(now+duration+.02);
  }
  document.addEventListener('pointerdown',e=>{unlock();dragging=false;},{capture:true});
  document.addEventListener('pointermove',e=>{if(e.buttons&&['view','canvas'].includes(e.target.id))dragging=true;},{capture:true});
  document.addEventListener('pointerup',()=>{dragging=false;},{capture:true});
  document.addEventListener('keydown',unlock,{capture:true,once:true});
  function bigSplash(){const now=performance.now();if(now-lastBig<90)return;lastBig=now;play(buffers.big1,.55,0,2.2,.008,.6);}
  addEventListener('water-duck-impact',bigSplash);addEventListener('water-splash-sound',bigSplash);
  addEventListener('water-touch-sound',()=>{const now=performance.now();if(now-lastTouch<(dragging?190:110))return;lastTouch=now;if(dragging&&slices.length){play(buffers.swirl,.2,slices[Math.random()*slices.length|0],.65,.08,.25);dragPlayed++;}else{const b=buffers['small'+(1+(Math.random()*3|0))];if(b){play(b,.3);smallPlayed++;}}});
  window.waterAudio={unlock,get decoded(){return Object.keys(buffers).length;},get played(){return played;},get active(){return sources.length;},get taps(){return smallPlayed;},get drags(){return dragPlayed;}};window.duckDropAudio=window.waterAudio;
  addEventListener('pagehide',()=>{for(const s of sources)try{s.stop();}catch{}context?.close();});
})();
