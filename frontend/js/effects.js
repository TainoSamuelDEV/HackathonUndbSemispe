// Efeitos visuais (sem dependências): árvore de partículas no hero, revelação ao rolar, sombra do header.
// Para desligar tudo, remova o import de './effects.js' em main.js.
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const COLORS=['#3a9bd5','#92bf71','#ffdf00','#ffffff','#1f71b7'];

function buildTree(){ // pontos 3D: tronco + galhos recursivos + copa
  const P=[],rnd=Math.random;
  const branch=(x,y,z,ax,az,len,depth)=>{
    const n=Math.round(len*1.6);
    for(let i=0;i<n;i++){const t=i/n;P.push([x+ax*len*t+(rnd()-.5)*.03,y+len*t*Math.cos(ax*.6),z+az*len*t,depth>1?2:rnd()<.5?1:0])}
    const ex=x+ax*len,ey=y+len,ez=z+az*len;
    if(depth>0)for(let k=0;k<3;k++)branch(ex,ey,ez,ax*.5+(rnd()-.5)*1.1,az*.5+(rnd()-.5)*1.1,len*.68,depth-1);
    else for(let k=0;k<26;k++)P.push([ex+(rnd()-.5)*.5,ey+(rnd()-.5)*.5,ez+(rnd()-.5)*.5,rnd()<.15?2:rnd()<.6?1:0]);
  };
  branch(0,-1.1,0,0,0,1.0,3);return P;
}
function mountTree(box){
  const c=document.createElement('canvas');c.className='hero-tree';c.setAttribute('aria-hidden','true');box.prepend(c);
  const ctx=c.getContext('2d'),pts=buildTree();let w,h,ang=0,mx=0,run=true;
  const size=()=>{const d=devicePixelRatio||1;w=c.width=box.clientWidth*d;h=c.height=box.clientHeight*d};size();
  addEventListener('resize',size);box.addEventListener('pointermove',e=>{mx=(e.offsetX/box.clientWidth-.5)*.8});
  new IntersectionObserver(e=>run=e[0].isIntersecting).observe(box);
  (function frame(){
    if(!c.isConnected)return;
    if(run){ctx.clearRect(0,0,w,h);const s=Math.min(w,h)*.3,cs=Math.cos(ang+mx),sn=Math.sin(ang+mx);
      for(const [x,y,z,k] of pts){const X=x*cs-z*sn,Z=x*sn+z*cs,f=1/(1.8-Z*.4);
        ctx.globalAlpha=.35+.65*f/.7;ctx.fillStyle=COLORS[k===0?4:k===1?0:(Z>0?2:1)];
        ctx.fillRect(w/2+X*s*f*1.6,h*.55-y*s*f*1.6,(k===2?2.6:1.7)*f*(devicePixelRatio||1),(k===2?2.6:1.7)*f*(devicePixelRatio||1))}
      if(!reduce)ang+=.004}
    reduce?0:requestAnimationFrame(frame)})();
  if(reduce)setTimeout(()=>{},0);
}
function scan(root){
  root.querySelectorAll('.hero-visual:not([data-tree])').forEach(b=>{b.dataset.tree=1;mountTree(b)});
  root.querySelectorAll('.card:not(.reveal),.section h2:not(.reveal)').forEach(el=>{el.classList.add('reveal');io.observe(el)});
}
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.08});
const start=()=>{const app=document.getElementById('app');if(!app)return;scan(app);
  new MutationObserver(()=>scan(app)).observe(app,{childList:true,subtree:true});
  addEventListener('scroll',()=>document.querySelector('.site-header')?.classList.toggle('scrolled',scrollY>8),{passive:true})};
document.readyState==='loading'?addEventListener('DOMContentLoaded',start):start();
