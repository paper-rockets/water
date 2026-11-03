(() => {
  const waterGame=()=>window.poolDucks?.bridge||window.lite;
  const unlock=()=>window.waterAudio?.unlock();
  const spray=document.createElement('canvas');spray.id='duckSpray';spray.setAttribute('aria-hidden','true');spray.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2';let ctx=null;
  addEventListener('water-rendered',()=>{
    const G=waterGame();if(!G?.R.name.startsWith('CPU'))return;
    if(!spray.isConnected){document.body.append(spray);ctx=spray.getContext('2d');}if(spray.width!==innerWidth||spray.height!==innerHeight){spray.width=innerWidth;spray.height=innerHeight;}ctx.clearRect(0,0,spray.width,spray.height);
    const fluid=G.splashFluid,points=fluid.positions,normals=fluid.normals;
    for(let i=0;i<fluid.vertices;i+=3){const triangle=[];for(let j=0;j<3;j++){const k=(i+j)*3;triangle.push(G.R.project({x:points[k],y:points[k+1],z:points[k+2]}));}if(triangle.some(p=>!p))continue;const k=i*3,lit=Math.max(0,normals[k]*-.4+normals[k+1]*.8+normals[k+2]*.4);ctx.fillStyle='rgba('+Math.round(30+lit*140)+','+Math.round(130+lit*110)+','+Math.round(150+lit*100)+',.8)';ctx.beginPath();triangle.forEach((p,j)=>j?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fill();}
  });
  document.addEventListener('DOMContentLoaded',()=>{
    const button=document.createElement('button');button.id='dropDuck';button.className='btn primary';button.textContent='Drop a duck';
    button.style.cssText='position:fixed;left:50%;bottom:calc(20px + env(safe-area-inset-bottom));transform:translateX(8px);z-index:9;min-width:140px;min-height:48px;font-size:16px;border-radius:24px';
    button.onclick=()=>{unlock();waterGame()?.dropDuck();};document.body.append(button);
    const style=document.createElement('style');style.textContent='#tankSplash{transform:translateX(calc(-100% - 8px))!important}#dropDuck:disabled{opacity:.6;cursor:default}@media(max-width:359px){#dropDuck,#tankSplash{min-width:128px!important;font-size:14px!important}}';document.head.append(style);
    if(location.pathname.includes('/pool/')){const splash=document.createElement('button');splash.id='tankSplash';splash.textContent='Splash';splash.className='btn primary';splash.style.cssText=button.style.cssText;splash.onclick=()=>{unlock();waterGame()?.splash();};document.body.append(splash);}
    const select=document.getElementById('duck');select.hidden=true;select.tabIndex=-1;
    const section=select.closest('section')||select.parentElement;
    const count=document.createElement('p');count.id='duckCount';count.setAttribute('role','status');count.style.cssText='margin:0 0 12px;color:#b1cbc9';section.append(count);
    const clear=document.createElement('button');clear.type='button';clear.className='btn';clear.textContent='Clear ducks';clear.style.width='100%';clear.onclick=()=>{waterGame()?.setDuckCount(0);if(waterGame())waterGame().splashFluid.clear();};section.append(clear);
    function update(){const n=Number(select.value)||0;count.textContent=n+' / 50 ducks';button.disabled=n>=50;button.textContent=n>=50?'50 ducks!':'Drop a duck';clear.disabled=n===0;}
    addEventListener('water-duck-count',update);update();setTimeout(()=>{(select.closest('section')||select.parentElement).append(count,clear);update();},0);

  });
})();
