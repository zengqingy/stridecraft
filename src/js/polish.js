// Enhancement-only layer: data and admin persistence remain owned by Store.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const states = new Map();
const CDN = 'https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web@0.44.0/';
let library;
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    const state = states.get(entry.target); if (!state) continue;
    state.near = entry.isIntersecting;
    if (state.near && !reduced.matches) start(state);
    else { state.player?.pause(); state.art.dataset.playing = 'false'; }
  }
}, {rootMargin: '200px'});
async function start(state) {
  if (state.player) { state.player.play(); return; }
  if (state.loading || reduced.matches) return;
  state.loading = true;
  try {
    library ||= import(CDN + 'dist/index.js');
    const {DotLottie} = await library;
    if (reduced.matches || !state.near || !state.art.isConnected) return;
    DotLottie.setWasmUrl(CDN + 'dist/dotlottie-player.wasm');
    const player = new DotLottie({canvas:state.art.querySelector('canvas'),src:new URL(`../../assets/lottie/${state.type}.json`,import.meta.url).href,autoplay:false,loop:false});
    state.player=player;
    player.addEventListener('load',()=>{
      if (!reduced.matches && state.near && state.art.isConnected) player.play();
    });
    player.addEventListener('frame',()=>{state.art.dataset.playing=String(!reduced.matches && state.near);});
    player.addEventListener('loadError',()=>{player.destroy();state.player=null;state.art.dataset.playing='false';});
  } catch { state.art.dataset.playing='false'; }
  finally {state.loading=false;}
}
function cue(type, text) {
  const wrap=document.createElement('span');wrap.className='lottie-cue';wrap.dataset.cue=type;
  const art=document.createElement('span');art.className='lottie-art';art.setAttribute('aria-hidden','true');
  art.innerHTML=`<img src="assets/lottie/${type}.svg" loading="lazy" alt=""><canvas width="96" height="96"></canvas>`;
  wrap.append(art,document.createTextNode(text));const state={type,art,near:false,player:null,loading:false};states.set(art,state);observer.observe(art);return wrap;
}
function enhance() {
  document.querySelector('header')?.classList.add('liquid-glass');
  document.querySelector('#enquiry')?.classList.add('liquid-glass');
  document.querySelectorAll('.grid .card').forEach(card=>{
    card.classList.add('product-card');
    // Service cards are not products.
    if (!card.querySelector('a[href^="product-detail"]')) {card.classList.remove('product-card');return;}
    if (!card.querySelector('.card-hover-overlay')) {
      const overlay=document.createElement('span');overlay.className='card-hover-overlay liquid-glass';overlay.setAttribute('aria-hidden','true');card.append(overlay);
      card.querySelector('a').append(cue('fold','折叠设计示意 · 实际功能待确认'));
    }
  });
  const success=document.querySelector('#enquiry .status');
  if (success?.textContent.includes('咨询已保存在此浏览器')&&!success.querySelector('[data-cue]')) success.append(cue('success','已保存'));
  const panel=document.querySelector('#panel');
  if(panel?.textContent.includes('暂无咨询。')&&!panel.querySelector('[data-cue]')) panel.append(cue('empty','还没有咨询记录'));
  // Complete the existing admin tabs' ARIA relationships and keyboard pattern.
  const tabs=[...document.querySelectorAll('[role=tab]')];
  tabs.forEach((tab,i)=>{
    tab.id='admin-tab-'+i;tab.setAttribute('aria-controls','panel');tab.tabIndex=tab.getAttribute('aria-selected')==='true'?0:-1;
    if(tab.dataset.keys)return;tab.dataset.keys='yes';
    tab.addEventListener('keydown',ev=>{
      const keys={ArrowRight:(i+1)%tabs.length,ArrowLeft:(i+tabs.length-1)%tabs.length,Home:0,End:tabs.length-1};
      if(!(ev.key in keys))return;ev.preventDefault();const index=keys[ev.key];tabs[index].click();queueMicrotask(()=>document.querySelector('#admin-tab-'+index)?.focus());
    });
  });
  if(panel){panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',tabs.find(t=>t.getAttribute('aria-selected')==='true')?.id||'admin-tab-0');}
  for(const [art,state]of states)if(!art.isConnected){observer.unobserve(art);state.player?.destroy();states.delete(art);}
}
let queued=false;
new MutationObserver(()=>{if(!queued){queued=true;queueMicrotask(()=>{queued=false;enhance()});}}).observe(document.querySelector('main'),{childList:true,subtree:true});
reduced.addEventListener('change',()=>{
  for(const state of states.values()){
    if(reduced.matches){state.player?.destroy();state.player=null;state.art.dataset.playing='false';}
    else if(state.near)start(state);
  }
});
window.addEventListener('pagehide',()=>{for(const state of states.values())state.player?.destroy();observer.disconnect();},{once:true});
enhance();
