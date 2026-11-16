import {createViewer} from './viewer.js';
const viewers = [], S = window.Store, page = document.body.dataset.page;
function mount(container, product, interactive = true) {
  const stage = document.createElement('div'); stage.className = 'viewer-stage';
  stage.innerHTML = S.img(product.imageSlots.main, `${product.name} · 概念示意`) + '<canvas aria-label="可拖动的产品三维示意" tabindex="0"></canvas>';
  // Poster remains underneath the transparent canvas, including every failure path.
  container.replaceChildren(stage);
  const canvas = stage.querySelector('canvas');
  canvas.setAttribute('role', 'img');
  const viewer = createViewer(canvas, product.model, {angle: Math.PI / 4, interactive});
  viewers.push(viewer); S.hydrate(stage);
  return viewer;
}
function setup() {
  if (!S) return;
  let featured;
  if (page === 'index' && S.data.products[0]) featured = mount(document.querySelector('#featured-viewer'), S.data.products[0], false);
  if (page === 'products') document.querySelectorAll('.card').forEach((card, i) => {
    card.classList.add('product-card');
    const image = card.querySelector('img'), target = document.createElement('div');
    image.replaceWith(target); mount(target, S.data.products[i], false);
  });
  if (page === 'product-detail') {
    const p = S.data.products.find(p => p.id === new URLSearchParams(location.search).get('id'));
    if (p) { const image = document.querySelector('.detail img'), target = document.createElement('div'); image.replaceWith(target); const v = mount(target, p);
      const label = document.createElement('label'); label.textContent = '模型配色（仅预览）';
      const select = document.createElement('select');
      for (const [name, value] of [['苔绿', '#5A6B4E'], ['暖砂', '#B08968']]) { const option = new Option(name, value); select.add(option); }
      select.onchange = () => v.setColor(select.value); label.append(select); target.append(label);
      const turn = document.createElement('button'); turn.type = 'button'; turn.textContent = '切换观察角度'; let angle = Math.PI / 4;
      turn.onclick = () => { angle = (angle + Math.PI / 4) % (Math.PI * 2); v.rotateTo(angle); }; target.append(turn);
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
      ScrollTrigger.create({trigger: '.featured', start: 'top 40px', end: () => '+=' + distance(), pin: '.featured-visual', pinSpacing: false, invalidateOnRefresh: true});
      const steps = gsap.timeline({scrollTrigger: {trigger: '.featured', start: 'top 40px', end: () => '+=' + distance(), scrub: 1, invalidateOnRefresh: true}});
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
