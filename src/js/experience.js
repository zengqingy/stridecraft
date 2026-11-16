let viewerModule;
function lazyViewer(canvas, path, options) {
  let viewer, disposed=false; const pending={angle:options.angle,color:null};
  const watch=new IntersectionObserver(async entries=>{
    if(!entries.some(e=>e.isIntersecting))return; watch.disconnect();
    try {viewerModule ||= import('./viewer.js');const {createViewer}=await viewerModule;if(disposed)return;viewer=createViewer(canvas,path,{...options,angle:pending.angle});if(pending.color)viewer.setColor(pending.color);}catch{canvas.parentElement.dataset.viewerState='fallback';}
  },{rootMargin:'200px'});watch.observe(canvas);
  return {rotateTo(a){pending.angle=a;viewer?.rotateTo(a)},setColor(c){pending.color=c;viewer?.setColor(c)},reset(){pending.angle=options.angle;viewer?.reset()},dispose(){disposed=true;watch.disconnect();viewer?.dispose()}};
}
const viewers = [], S = window.Store, page = document.body.dataset.page;
function mount(container, product, interactive = true) {
  const stage = document.createElement('div'); stage.className = 'viewer-stage';
  stage.innerHTML = S.img(product.imageSlots.main, `${product.name} · 概念示意`) + '<canvas aria-label="可拖动的产品三维示意" tabindex="0"></canvas>';
  // Poster remains underneath the transparent canvas, including every failure path.
  container.replaceChildren(stage);
  const canvas = stage.querySelector('canvas');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label',interactive?'可拖动的产品三维示意':'产品三维概念示意');
  canvas.tabIndex = interactive ? 0 : -1;
  const description = document.createElement('p'); description.className = 'viewer-description sr-only';
  description.id = 'viewer-description-' + document.querySelectorAll('.viewer-description').length;
  description.textContent = interactive ? '概念三维示意：拖动旋转，双指缩放，双击或双触重置。也可使用下方按钮观察与重置；不代表实物规格。' : '概念助行器三维示意；不可交互，不代表实物规格。无法显示三维时保留产品线稿。';
  canvas.setAttribute('aria-describedby', description.id); container.append(description);
  const viewer = lazyViewer(canvas, product.model, {angle: Math.PI / 4, interactive});
  viewers.push(viewer); S.hydrate(stage);
  return viewer;
}
function setup() {
  if (!S) return;
  let featured;
  if (page === 'index' && S.data.products[0]) featured = mount(document.querySelector('#featured-viewer'), S.data.products[0], false);
  // The catalogue stays a consistent set of SVG illustrations, not ten live stages.
  document.querySelectorAll('.grid .card').forEach((card,index)=>{
    const p=S.data.products[index];if(!p)return;
    const row=document.createElement('span');row.className='swatches';row.setAttribute('role','img');row.setAttribute('aria-label','概念配色：'+p.colors.join('、'));
    for(const name of p.colors){const dot=document.createElement('span');dot.className='swatch-dot';dot.style.setProperty('--swatch',S.swatches[name]||'var(--chip)');dot.title=name;dot.setAttribute('aria-hidden','true');row.append(dot);}card.querySelector('a').append(row);
  });
  if (page === 'product-detail') {
    const p = S.data.products.find(p => p.id === new URLSearchParams(location.search).get('id'));
    if (p) { const image = document.querySelector('.detail img'), target = document.createElement('div'); image.replaceWith(target); const v = mount(target, p);
      const label = document.createElement('label'); label.textContent = '模型配色（仅预览）';
      const select = document.createElement('select');select.className='swatch-select';
      for (const [name, value] of Object.entries(S.swatches)) { const option = new Option(name, value); select.add(option); }
      select.value=S.swatches[p.colors.includes('豆绿')?'豆绿':p.colors[0]]||Object.values(S.swatches)[0];v.setColor(select.value);select.onchange = () => v.setColor(select.value); label.append(select); (document.querySelector('#product-options')||target).append(label);
      const turn = document.createElement('button'); turn.type = 'button'; turn.textContent = '切换观察角度'; let angle = Math.PI / 4;
      turn.onclick = () => { angle = (angle + Math.PI / 4) % (Math.PI * 2); v.rotateTo(angle); }; target.append(turn);
      const reset = document.createElement('button'); reset.type='button'; reset.textContent='重置视角';
      reset.onclick=()=>{angle=Math.PI/4;v.reset();}; target.append(reset);target.classList.add('detail-viewer');
    }
  }
  document.querySelectorAll('.collection .card').forEach(card => card.classList.add('product-card'));
  const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)', () => {
    if (page === 'index') {
      gsap.timeline({defaults: {ease: 'power2.out'}})
        .from('#hero-heading', {opacity: 0, y: 14, duration: .8}, .2)
        .from('.hero-subtext', {opacity: 0, y: 14, duration: .8}, .6)
        .from('.hero-cta', {opacity: 0, y: 14, duration: 1.1}, .9);
    }
    ScrollTrigger.batch('.product-card', {once: true, onEnter: batch => gsap.from(batch, {opacity: 0, y: 20, stagger: .08, duration: .6, ease: 'power2.out', clearProps: 'opacity,transform'})});
  });
  if (featured) {
    media.add('(min-width: 801px) and (prefers-reduced-motion: no-preference)', () => {
      const rotation = {angle: 0}; featured.rotateTo(0);
      const distance = () => innerHeight * 1.8;
      ScrollTrigger.create({trigger: '.featured', start: () => 'top '+(document.querySelector('header').offsetHeight+16)+'px', end: () => '+=' + distance(), pin: '.featured-visual', pinSpacing: false, invalidateOnRefresh: true});
      const steps = gsap.timeline({scrollTrigger: {trigger: '.featured', start: () => 'top '+(document.querySelector('header').offsetHeight+16)+'px', end: () => '+=' + distance(), scrub: 1, invalidateOnRefresh: true}});
      // Three equal 60vh steps: front, 3/4, side. Timeline tweens retain one-second durations.
      for (const angle of [0, Math.PI / 4, Math.PI / 2]) steps.to(rotation, {angle, duration: 1, ease: 'none', onUpdate: () => featured.rotateTo(rotation.angle)});
      return () => featured.rotateTo(Math.PI / 4);
    });
    media.add('(max-width: 800px), (prefers-reduced-motion: reduce)', () => { featured.rotateTo(Math.PI / 4); });
  }
  window.addEventListener('pagehide', () => { media.revert(); viewers.forEach(v => v.dispose()); }, {once: true});
  window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
  ScrollTrigger.refresh();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, {once: true}); else setup();
