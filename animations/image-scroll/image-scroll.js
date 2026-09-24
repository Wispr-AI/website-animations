/* Image scrollytelling for Webflow. One authored image/copy pair per item. */
(function () {
  'use strict';

  const SELECTOR = '[data-image-scroll="section"]';
  const DESKTOP = '(min-width: 992px)';
  // Match the original languages.js outer scroll effect. Webflow owns the design.
  const FADE_MS = 220;
  const DIM = 0.35;
  const EXTRA_GAP = 24;
  const LEAD = 0.15;
  const LIFT = 0.72;
  const ACTIVE_DELAY = 0.08;

  function rememberStyles(element, properties) {
    const original = properties.map((name) => [name,
      element.style.getPropertyValue(name), element.style.getPropertyPriority(name)]);
    return () => original.forEach(([name, value, priority]) => {
      if (value) element.style.setProperty(name, value, priority);
      else element.style.removeProperty(name);
    });
  }

  function initialize(section) {
    if (section.hasAttribute('data-image-scroll-ready')) return;
    const find = (role) => section.querySelector('[data-image-scroll="' + role + '"]');
    const stage = find('stage');
    const list = find('list');
    if (!stage || !list) return;
    const items = Array.from(list.children).filter((el) => el.matches('[data-image-scroll="item"]'));
    const pairs = items.map((item) => ({
      item,
      image: item.querySelector('[data-image-scroll="image"]'),
      copy: item.querySelector('[data-image-scroll="copy"]')
    }));
    if (!pairs.length) return;
    if (pairs.some((pair) => !pair.image || !pair.copy)) {
      console.warn('[image-scroll] Each item needs an image wrapper and copy wrapper.', section);
      return;
    }
    section.setAttribute('data-image-scroll-ready', '');
    const desktop = window.matchMedia(DESKTOP);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let teardown = null;

    function enterDesktop() {
      let alive = true;
      let frame = 0;
      let needsLayout = true;
      let active = -1;
      let pop = null;
      const restoreList = rememberStyles(list, ['padding-top', 'padding-bottom', 'margin-bottom', 'transform']);
      const restoreStage = rememberStyles(stage, ['transform', 'transform-origin']);
      const restores = [];
      const markers = [];
      const initialImages = pairs.map(({ image }) => image.getAttribute('aria-hidden'));

      pairs.forEach(({ item, image, copy }, index) => {
        const marker = document.createComment('image-scroll image location');
        image.before(marker);
        markers.push(marker);
        restores.push(rememberStyles(image, ['opacity', 'transition', 'pointer-events']));
        restores.push(rememberStyles(copy, ['opacity', 'visibility']));
        restores.push(rememberStyles(item, ['margin-bottom']));
        image.style.transition = reduced.matches ? 'none' : 'opacity ' + FADE_MS + 'ms ease';
        image.style.opacity = index === 0 ? '1' : '0';
        image.style.pointerEvents = index === 0 ? '' : 'none';
        stage.appendChild(image);
      });

      function layout() {
        const vh = window.innerHeight;
        // Preserve the original lead-in, lift and additional 24px item spacing.
        // Reset the computed trim first so repeated refreshes never accumulate it.
        list.style.paddingTop = vh * LEAD + 'px';
        list.style.paddingBottom = vh * 0.02 + 'px';
        list.style.marginBottom = '0px';
        list.style.transform = 'translateY(' + (-vh * LIFT) + 'px)';
        pairs.forEach(({ item }, index) => {
          if (index < pairs.length - 1) item.style.marginBottom = EXTRA_GAP + 'px';
        });
        const sec = section.getBoundingClientRect();
        const last = pairs[pairs.length - 1].copy.getBoundingClientRect();
        const relativeCenter = last.top + last.height / 2 - sec.top;
        const padding = relativeCenter - vh * 0.5 + vh - sec.height + vh * 0.02;
        list.style.paddingBottom = Math.max(0, padding) + 'px';
        list.style.marginBottom = Math.min(0, padding) + 'px';
      }

      function update() {
        const box = pairs[active < 0 ? 0 : active].image.getBoundingClientRect();
        const line = box.top + box.height / 2 - window.innerHeight * ACTIVE_DELAY;
        let closest = 0;
        let distance = Infinity;
        pairs.forEach(({ copy }, index) => {
          const rect = copy.getBoundingClientRect();
          const delta = Math.abs(rect.top + rect.height / 2 - line);
          if (delta < distance) { closest = index; distance = delta; }
        });
        if (closest === active) return;
        pairs.forEach(({ image, copy }, index) => {
          const selected = index === closest;
          image.style.opacity = selected ? '1' : '0';
          image.style.pointerEvents = selected ? '' : 'none';
          image.setAttribute('aria-hidden', selected ? 'false' : 'true');
          copy.style.opacity = selected ? '1' : String(DIM);
          copy.style.visibility = 'visible';
        });
        if (pop) pop.kill();
        // GSAP is already supplied by Webflow. Keep the original spring easing.
        // Selection and stacking still work if GSAP is unavailable.
        if (!reduced.matches && window.gsap) {
          pop = window.gsap.fromTo(stage, { scale: 1.04 }, {
            scale: 1, duration: 0.3, ease: 'back.out(2)',
            onUpdate: scheduleUpdate
          });
        }
        active = closest;
      }

      function flush() {
        frame = 0;
        if (!alive) return;
        if (needsLayout) { needsLayout = false; layout(); }
        update();
      }
      function scheduleUpdate() {
        if (alive && !frame) frame = window.requestAnimationFrame(flush);
      }
      function refresh() { needsLayout = true; scheduleUpdate(); }

      window.addEventListener('scroll', scheduleUpdate, { passive: true });
      window.addEventListener('resize', refresh);
      window.addEventListener('pageshow', refresh);
      window.addEventListener('load', refresh);
      const images = pairs.flatMap(({ image }) => Array.from(image.querySelectorAll('img')));
      images.forEach((image) => image.addEventListener('load', refresh));
      const observer = window.ResizeObserver ? new ResizeObserver(refresh) : null;
      if (observer) {
        pairs.forEach(({ copy, image }) => { observer.observe(copy); observer.observe(image); });
      }
      const triggers = window.ScrollTrigger;
      if (triggers) triggers.addEventListener('refresh', refresh);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (alive) refresh(); });
      flush();

      return () => {
        alive = false;
        window.cancelAnimationFrame(frame);
        if (pop) pop.kill();
        if (observer) observer.disconnect();
        window.removeEventListener('scroll', scheduleUpdate);
        window.removeEventListener('resize', refresh);
        window.removeEventListener('pageshow', refresh);
        window.removeEventListener('load', refresh);
        images.forEach((image) => image.removeEventListener('load', refresh));
        if (triggers) triggers.removeEventListener('refresh', refresh);
        pairs.forEach(({ image }, index) => {
          markers[index].replaceWith(image);
          if (initialImages[index] === null) image.removeAttribute('aria-hidden');
          else image.setAttribute('aria-hidden', initialImages[index]);
        });
        restores.forEach((restore) => restore());
        restoreList();
        restoreStage();
      };
    }

    function changeMode() {
      if (teardown) teardown();
      teardown = desktop.matches ? enterDesktop() : null;
    }
    desktop.addEventListener('change', changeMode);
    reduced.addEventListener('change', changeMode);
    changeMode();
  }

  function start() { document.querySelectorAll(SELECTOR).forEach(initialize); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
