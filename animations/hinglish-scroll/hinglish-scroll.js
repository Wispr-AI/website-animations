/* Diwali Hinglish variant of image-scroll.js. Load instead of the original script. */
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
    let stopCards = null;
    let selected = 0;

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
        selected = closest;
        section.dispatchEvent(new Event('image-scroll-select'));
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
      if (stopCards) stopCards();
      if (teardown) teardown();
      teardown = desktop.matches ? enterDesktop() : null;
      stopCards = playCards(pairs, desktop, reduced, () => selected);
    }
    desktop.addEventListener('change', changeMode);
    reduced.addEventListener('change', changeMode);
    changeMode();
  }


  let cardId = 0;
  // Ported card motion from aquaNeon/wispr languages.js c35d10c.
  // Each card owns a virtual clock: no background timers continue offscreen.
  function createCard(root, desktopMode) {
    const type = root.getAttribute('data-scroll-card');
    const index = ['languages', 'vocabulary', 'snippets', 'tone'].indexOf(type);
    if (index < 0) return null;
    const originalHTML = root.innerHTML;
    let now = 1, serial = 0;
    const jobs = new Map();
    const motion = {
      request(fn) { const id = ++serial; jobs.set(id, { at: now, fn }); return id; },
      after(fn, ms) { const id = ++serial; jobs.set(id, { at: now + ms, fn }); return id; },
      cancel(id) { jobs.delete(id); },
      step(dt) {
        now += dt;
        Array.from(jobs).forEach(([id, job]) => {
          if (job.at <= now && jobs.has(id)) { jobs.delete(id); job.fn(now); }
        });
      }
    };
    var FLAG_URL = 'https://flagcdn.com/w80/{code}.png';   // {code} → country code
    var SEP      = '\u00a0'; // preserved spacing between sentence repeats
    var SEGS = [{
      text: 'Flow ke saath likho. Kal milte hain. Phir ideas par baat karte hain. Hindi ho ya English, baat apni rakho.',
      name: 'Hinglish', code: 'in', flag: '🇮🇳'
    }];

    // Measure the original four-language sweep in the same font so this shorter
    // sentence travels at the same speed, rather than taking 16 seconds by itself.
    var SPEED_REFERENCE = ["I’m getting started with the project. Here are a few options.", "Wie möchten Sie die Datei einrichten? Hier sind ein paar Optionen für Sie.", "Estoy empezando con el proyecto. Aquí van algunas opciones.", "प्रोजेक्ट पर काम शुरू हो गया। आप इसे कैसे सेट करना चाहेंगे? यहाँ कुछ विकल्प हैं।"];
    var referenceLine = SPEED_REFERENCE[3] + '   ' + SPEED_REFERENCE.join('   ') + '   ' + SPEED_REFERENCE[0];
    var firstCenter = SPEED_REFERENCE[3].length + 3 + SPEED_REFERENCE[0].length / 2;
    var lastCenter = referenceLine.length - 3 - SPEED_REFERENCE[0].length - SPEED_REFERENCE[3].length / 2;
    var referenceSweep = (lastCenter - firstCenter) / referenceLine.length * 4 / 3;

    // ---- config ----
    var ANCHOR     = 0.5;     // point along the curve (0..1) each language parks at
    // fix the language wrap to its widest content so it stops resizing per word
    var LABEL_FIXED_W = true;
    var LABEL_W_PAD   = 0;    // px added to the measured widest width
    var LANG_PATH_FONT = '36px';   // switcher curved-text size ('' = leave to CSS)

    // ---- cards (desktop stacking) ----

    // ---- card 1 (Add to vocabulary) ----
    var VOCAB_WORD = 'Wispr Flow';   // the word typed into the input (JS owns it)
    var TOG_OFF    = '#d8d6cc';      // toggle track colour OFF
    var TOG_ON     = '#1a1a1a';      // toggle track colour ON
    var C1_SCROLL_EXTRA = 20;        // px the inner track lifts BEYOND the form's own overflow, so the
                                     // toggle + Add button sit clear of the bottom edge

    // ---- card 2 (snippets) ----
    var SNIP_RISE = 46;              // px the pills sit above/below the line while outside it

    // ---- card 3 (tone) ----
    var TONES = [
      { key: 'formal', text: 'Hey, are you free for lunch tomorrow?\nLet’s do 12 if that works for you.' },
      { key: 'casual', text: 'Hey are you free for lunch tomorrow?\nLet’s do 12 if that works for you' },
      { key: 'very',   text: 'hey are you free for lunch tomorrow?\nlet’s do 12 if that works for you' }
    ];

    // ---- triggered beats: each fires when progress crosses its threshold, then plays over TRIG_MS ----
    var TRIG_MS  = 300;                          // beat play duration (ms)
    var TYPE_MS  = 650;                          // card 1 typewriter duration
    var CHIP_MS  = 220;                          // new-word chip pop
    // beat 1 must stay held long enough for the form's full ~2600ms TIMED sequence (type → toggle → move →
    // Add click) to finish before beat 2 flips to done — else the Add gets cut. Hence the wide window here
    // plus the long LANG_AUTOPLAY_MS[1].
    var C1_BEATS = [0.1, 0.55, 0.85];            // chips · form plays · done(+new word) · animate out
    var C2_LIFT  = 0.30;                         // card 2: trigger lifts out, slot makes room, URL below
    var C2_RISE  = 0.58;                         // card 2: URL rises into the slot
    var C2_OUT   = 0.82;                         // card 2: the whole row — side text and URL — fades out
                                                 // where it stands, then the card restarts from empty
    var C2_FADE_MS = 420;                        // that fade
    var ACTIVE_CLASS = 'is-active';              // marks the active tone button (card 3)
    var WAVE_STAGGER = 45;                       // card 3: ms delay per word, incoming message only
    var TONE_OUT_MS  = 150;                      // card 3: the old message clears in one go, no wave —
                                                 // staggering it too is what made the two texts overlap
    var TONE_IN_LAG  = 60;                       // card 3: gap after it's gone before the new one starts
    var TONE_IN_MS   = 320;                      // card 3: per-word fade of the incoming message
    var EASE     = 'cubic-bezier(.4,0,.2,1)';
    var BACK     = 'cubic-bezier(.34,1.56,.64,1)';

    // ---- playback (both modes) ----
    // The original language sweep takes 16 seconds; measure() scales the shorter loop to match its speed.
    var LANG_AUTOPLAY_MS = [16000, 9000, 4500, 5000];
    var LANG_START = { 0: 0 };


    var ATTR = 'data-lang';
    // how many thresholds tp has crossed (ascending array)
    function beatOf(tp, ths) {
      var b = 0;
      for (var i = 0; i < ths.length; i++) { if (tp >= ths[i]) { b++; } }
      return b;
    }

    // rAF typewriter — real time, so speed is independent of scroll
    function makeTyper(el) {
      var raf = 0, startT = 0, full = '', dur = 600, done = false;
      function step(now) {
        if (!startT) { startT = now; }
        var k = Math.min(1, (now - startT) / dur);
        el.textContent = full.slice(0, Math.round(k * full.length)) + (k < 1 ? '|' : '');
        if (k < 1) { raf = motion.request(step); } else { done = true; }
      }
      return {
        play: function (text, ms) {
          if (done && full === text) { return; }     // already typed — don't restart
          motion.cancel(raf);
          full = text; dur = ms || 600; startT = 0; done = false;
          raf = motion.request(step);
        },
        reset: function () { motion.cancel(raf); startT = 0; done = false; el.textContent = ''; }
      };
    }

    // per-word spans with staggered transition-delay → left-to-right wave. whitespace (incl. newlines under
    // white-space:pre-line) stays as text nodes.
    function waveWrap(el, staggerMs) {
      var parts = el.textContent.split(/(\s+)/);
      el.textContent = '';
      var spans = [], wi = 0;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (p === '') { continue; }
        if (/^\s+$/.test(p)) { el.appendChild(document.createTextNode(p)); continue; }
        var s = document.createElement('span');
        s.textContent = p;
        s.style.display = 'inline-block';
        s.style.willChange = 'opacity, transform';
        s.style.transition = 'opacity 320ms ease, transform 320ms cubic-bezier(.4,0,.2,1)';
        s.style.transitionDelay = (wi * staggerMs) + 'ms';
        el.appendChild(s);
        spans.push(s); wi++;
      }
      return spans;
    }

    // Repeated cards need unique SVG IDs and matching references within each embed.
    function uniqIds(root, sfx) {
      var map = {}, all = [root];
      if (root.id) { map[root.id] = root.id + '-' + sfx; root.id = map[root.id]; }
      Array.prototype.forEach.call(root.querySelectorAll('[id]'), function (el) {
        map[el.id] = el.id + '-' + sfx; el.id = map[el.id];
      });
      Array.prototype.push.apply(all, root.querySelectorAll('*'));
      var keys = Object.keys(map);
      if (!keys.length) { return; }
      var XL = 'http://www.w3.org/1999/xlink';
      var REFS = ['href', 'fill', 'stroke', 'clip-path', 'mask', 'filter', 'marker-start', 'marker-mid', 'marker-end'];
      var res = keys.map(function (k) {
        return { re: new RegExp('#' + k.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&') + '(?![\\w-])', 'g'), to: '#' + map[k] };
      });
      function swap(v) {
        for (var i = 0; i < res.length; i++) { v = v.replace(res[i].re, res[i].to); }
        return v;
      }
      Array.prototype.forEach.call(all, function (el) {
        if (!el.getAttribute) { return; }
        // the embed ships its own <style> keyed off #svg-trail / #marquee-text-lang — rewrite those
        // selectors too, else the embed loses fill:transparent (black blob) + the text styling
        if (el.tagName && el.tagName.toLowerCase() === 'style') {
          if (el.textContent && el.textContent.indexOf('#') !== -1) { el.textContent = swap(el.textContent); }
          return;
        }
        for (var a = 0; a < REFS.length; a++) {
          var v = el.getAttribute(REFS[a]);
          if (v && v.indexOf('#') !== -1) { el.setAttribute(REFS[a], swap(v)); }
        }
        var xv = el.getAttributeNS ? el.getAttributeNS(XL, 'href') : null;
        if (xv && xv.indexOf('#') !== -1) { el.setAttributeNS(XL, 'href', swap(xv)); }
      });
    }

    // Width of the line as the font actually sets it, with no SVG involved — so it is the same number
    // in every engine, and it works whether or not the card is currently rendered. Cached per
    // string+font: it is only called from measure(), but that runs on every resize and webfont load.
    var canvasCtx = null, canvasCache = {};
    function measureOnCanvas(textEl, tp, content) {
      var src = tp || textEl;
      if (!src) { return 0; }
      var str = content === undefined ? (src.textContent || '') : content;
      if (!str) { return 0; }
      try {
        var cs  = window.getComputedStyle(src);
        var key = str + '|' + cs.fontSize + '|' + cs.fontFamily + '|' + cs.fontWeight;
        if (canvasCache[key] !== undefined) { return canvasCache[key]; }
        if (!canvasCtx) {
          var c = document.createElement('canvas');
          canvasCtx = c.getContext ? c.getContext('2d') : null;
        }
        if (!canvasCtx) { return 0; }
        canvasCtx.font = [cs.fontStyle, cs.fontWeight, cs.fontSize, cs.fontFamily].join(' ');
        var w = canvasCtx.measureText(str).width || 0;
        canvasCache[key] = w;
        return w;
      } catch (e) { return 0; }
    }

    // Identical copies let the text wrap by exactly one measured sentence width.
    // Leading/trailing copies keep the curve filled at the loop boundary.
    var PERIOD = SEGS[0].text + SEP;
    var LINE = PERIOD.repeat(5);

    // ==========================================================================
    // card factories — each takes the card ROOT and returns { render(tp), measure(), destroy() }.
    // Each authored card gets its own instance at the current breakpoint.
    // ==========================================================================

    // ---- card 0: repeating Hinglish text with a fixed label and Indian flag ----
    function buildCard0(root, fontSize, hardFont) {
      if (!root) { return null; }
      var nameEl  = root.querySelector('[' + ATTR + '-name]');    // the <textPath>
      var labelEl = root.querySelector('[' + ATTR + '-label]');
      var flagEls = root.querySelectorAll('[' + ATTR + '-flag]');

      // only a NON-EMPTY code counts as a per-language flag, so a wrapper with a bare data-lang-flag is
      // ignored rather than hidden. >1 coded flag = MULTI mode (show active, hide rest).
      var coded = [];
      Array.prototype.forEach.call(flagEls, function (el) {
        if (el.getAttribute(ATTR + '-flag')) { coded.push(el); }
      });
      var flagMulti   = coded.length > 1;
      var singleFlag  = coded[0] || (flagEls.length ? flagEls[0] : null);
      var singleIsImg = singleFlag && singleFlag.tagName && singleFlag.tagName.toLowerCase() === 'img';

      function setActive(seg) {
        if (labelEl && labelEl.textContent !== seg.name) { labelEl.textContent = seg.name || ''; }
        if (flagMulti) {
          for (var g = 0; g < coded.length; g++) {
            coded[g].style.display = (coded[g].getAttribute(ATTR + '-flag') === seg.code) ? '' : 'none';
          }
        } else if (singleIsImg) {
          var src = FLAG_URL.replace('{code}', seg.code || '');
          if (singleFlag.getAttribute('src') !== src) { singleFlag.setAttribute('src', src); }
        } else if (singleFlag && singleFlag.textContent !== seg.flag) {
          singleFlag.textContent = seg.flag || '';
        }
      }

      // the <text> owns the x attr we move; nameEl is its <textPath> child (holds the string)
      var textEl = null, tpEl = null;
      if (nameEl) {
        var isTp = !!(nameEl.tagName && nameEl.tagName.toLowerCase() === 'textpath');
        textEl = isTp ? nameEl.parentNode : nameEl;
        // the embed sizes the <textPath> by id, so its computed font is the one that actually renders
        tpEl   = isTp ? nameEl : (textEl.querySelector ? textEl.querySelector('textPath') : null);
      }
      var fs = (fontSize === undefined) ? LANG_PATH_FONT : fontSize;
      if (textEl && fs) { textEl.style.fontSize = fs; }
      // the embed's #marquee-text-lang rule outranks the <text> inline size, so a hard override must go on
      // the <textPath> itself
      if (hardFont && fs && nameEl && nameEl !== textEl) { nameEl.style.fontSize = fs; }
      // take the svg that OWNS the text — card 0 also holds the flag svgs
      var svgEl  = nameEl ? (nameEl.closest && nameEl.closest('svg')) : null;
      if (!svgEl) { svgEl = root.querySelector('svg'); }
      var pathEl = svgEl && (svgEl.querySelector('[id^="curve"]') || svgEl.querySelector('path'));

      if (nameEl && nameEl.textContent !== LINE) { nameEl.textContent = LINE; }

      // lock the wrap to the widest language so it stops resizing as the word changes. measured by
      // swapping each name in and reading the box — offsetWidth, not a rect, so a transformed card
      // still reports layout px.
      var labelWrap = labelEl ? (labelEl.parentElement || labelEl) : null;
      function fitLabelWrap() {
        if (!LABEL_FIXED_W || !labelEl || !labelWrap) { return; }
        var prevText = labelEl.textContent;
        labelWrap.style.width = 'auto';
        var widest = 0;
        for (var i = 0; i < SEGS.length; i++) {
          labelEl.textContent = SEGS[i].name || '';
          if (labelWrap.offsetWidth > widest) { widest = labelWrap.offsetWidth; }
        }
        labelEl.textContent = prevText;
        labelWrap.style.width = (Math.ceil(widest) + LABEL_W_PAD) + 'px';
      }

      // Re-measure the repeat width and curve anchor after webfonts load and on resize.
      var anchorArc = 0, periodWidth = 0, lastProgress = 0;
      setActive(SEGS[0]);
      function measure() {
        try { fitLabelWrap(); } catch (eW) {}     // must never abort the text measurement below
        // Canvas is reliable even when an SVG is offscreen or clipped in WebKit.
        // Measure the repeat unit itself, including its trailing separator.
        periodWidth = measureOnCanvas(textEl, tpEl, PERIOD);
        var originalDistance = measureOnCanvas(textEl, tpEl, referenceLine) * referenceSweep;
        if (periodWidth > 0 && originalDistance > 0) {
          LANG_AUTOPLAY_MS[0] = 16000 * periodWidth / originalDistance;
        }
        var pathLen = 0;
        try { pathLen = pathEl && pathEl.getTotalLength ? pathEl.getTotalLength() : 0; } catch (e2) {}
        if (!pathLen && svgEl && svgEl.viewBox && svgEl.viewBox.baseVal) { pathLen = svgEl.viewBox.baseVal.width; }
        anchorArc = ANCHOR * pathLen;
        render(lastProgress); // Also update after font loads when reduced motion is enabled.
      }
      measure();

      function render(progress) {
        var p = Math.max(0, Math.min(1, progress));
        lastProgress = p;
        if (textEl && periodWidth > 0) {
          textEl.setAttribute('x', String(anchorArc - (1 + p) * periodWidth));
        }
      }

      return { render: render, measure: measure, destroy: function () {} };
    }

    // ---- card 1: chips → form in → word types → scrolls to the toggles + Add word → form out → chips +1 ----
    function buildCard1(root) {
      if (!root) { return null; }
      var oneV = function (v) { return root.querySelector('[data-vocab="' + v + '"]'); };
      var formEl    = oneV('form');
      var trackEl   = (oneV('track') || (formEl && formEl.querySelector('.lang_inner-card-wrap'))) || null;
      var inputEl   = oneV('input');
      var inputTxt  = inputEl ? (inputEl.querySelector('.lang_input-text') || inputEl) : null;
      var togSpell  = oneV('toggle-spell');
      var knobSpell = togSpell && togSpell.querySelector('[data-vocab-knob]');
      var addBtn    = oneV('add-word');
      // authored in Webflow as a bare add-btn="add-btn", so accept that too — else the click pulse is a
      // silent no-op
      var addNewBtn = oneV('add-btn') || root.querySelector('[add-btn]');
      var listEl    = oneV('list');
      var newChip   = oneV('new-chip');

      // CSS transitions = the "play" of each beat
      if (formEl)  { formEl.style.transformOrigin = 'center bottom'; formEl.style.willChange = 'opacity, transform';
                     formEl.style.transition = 'opacity ' + TRIG_MS + 'ms ease, transform ' + TRIG_MS + 'ms ' + EASE; }
      if (trackEl)   { trackEl.style.transition = 'transform ' + TRIG_MS + 'ms ' + EASE; }
      if (togSpell)  { togSpell.style.transition = 'color ' + TRIG_MS + 'ms ease'; }
      if (knobSpell) { knobSpell.style.transition = 'transform ' + TRIG_MS + 'ms ' + EASE; }
      if (listEl)    { listEl.style.transition = 'opacity ' + TRIG_MS + 'ms ease'; }
      if (newChip)   { newChip.style.transformOrigin = 'center';
                       newChip.style.transition = 'opacity ' + CHIP_MS + 'ms ease, transform ' + CHIP_MS + 'ms ' + BACK; }
      if (addBtn)    { addBtn.style.transition = 'transform 180ms ' + EASE; }
      if (addNewBtn) { addNewBtn.style.transition = 'transform 180ms ' + EASE; }

      var typer = inputTxt ? makeTyper(inputTxt) : null;

      // how far the inner track scrolls — 0 if the form is auto-height instead of a clip window
      var maxScroll = 0;
      function measure() {
          // The form can have an authored min-height larger than a short mobile card.
        // Scroll against its actually visible window so the Add button clears the edge.
        var visibleH = formEl ? Math.min(formEl.clientHeight,
          Math.max(0, root.clientHeight - formEl.offsetTop)) : 0;
        maxScroll = formEl ? Math.max(0, formEl.scrollHeight - visibleH) : 0;
      }
      measure();

      // ---- state setters ----
      function setForm(shown, y) {
        if (!formEl) { return; }
        formEl.style.opacity = shown ? '1' : '0';
        formEl.style.transform = 'translateY(' + y + 'px) scale(' + (shown ? 1 : 0.98) + ')';
        formEl.style.pointerEvents = shown ? '' : 'none';
      }
      function setTrack(scrolled) {
        // maxScroll only covers the form's own overflow — C1_SCROLL_EXTRA pushes past it so the toggle
        // row and the Add button clear the bottom edge properly
        var lift = maxScroll + C1_SCROLL_EXTRA;
        if (trackEl && lift > 0) { trackEl.style.transform = 'translateY(' + (scrolled ? -lift : 0) + 'px)'; }
      }
      function setToggle(on) {
        if (!togSpell) { return; }
        togSpell.style.color = on ? TOG_ON : TOG_OFF;
        if (knobSpell) { knobSpell.style.transform = on ? 'translateX(16px)' : 'translateX(0px)'; }
      }
      function setList(vis) { if (listEl) { listEl.style.opacity = vis ? '1' : '0'; } }
      function pulse(el, s) {
        if (!el) { return; }
        el.style.transform = 'scale(' + s + ')';
        motion.request(function () { el.style.transform = 'scale(1)'; });
      }
      // fast press down, springy release — reads as a real click
      function clickBtn(el) {
        if (!el) { return; }
        el.style.transition = 'transform 90ms ' + EASE;
        el.style.transform = 'scale(0.85)';
        at(120, function () {
          el.style.transition = 'transform 340ms ' + BACK;
          el.style.transform = 'scale(1)';
        });
      }
      function setNewChip(inN) {
        if (!newChip) { return; }
        if (inN) {
          if (!newChip.style.display || newChip.style.display === 'none') {
            newChip.style.display = ''; newChip.style.opacity = '0'; newChip.style.transform = 'scale(0.4) translateY(-6px)';
            motion.request(function () { newChip.style.opacity = '1'; newChip.style.transform = 'scale(1) translateY(0px)'; });
          } else { newChip.style.opacity = '1'; newChip.style.transform = 'scale(1) translateY(0px)'; }
        } else {
          newChip.style.display = 'none'; newChip.style.opacity = '0'; newChip.style.transform = 'scale(0.6)';
        }
      }

      // ---- timeline: at beat 1 the form SELF-PLAYS on timers, not on scroll ----
      var timers = [];
      function clearSeq() { for (var i = 0; i < timers.length; i++) { motion.cancel(timers[i]); } timers = []; }
      function at(ms, fn) { timers.push(motion.after(fn, ms)); }
      function exitY() { return -((formEl ? formEl.offsetHeight : 400) * 1.25 + 60); }

      function toRest() {          // beat 0: chips
        clearSeq();
        setList(true); setForm(false, 40); setToggle(false); setTrack(false); setNewChip(false);
        if (typer) { typer.reset(); }
      }
      function playForm() {        // beat 1: plays itself
        clearSeq();
        setNewChip(false); setList(true); setForm(false, 40); setToggle(false); setTrack(false);
        pulse(addNewBtn, 0.92);                                                   // "Add a new word" click
        at(300,                     function () { setList(false); setForm(true, 0); });    // chips out, form in
        at(650,                     function () { if (typer) { typer.play(VOCAB_WORD, TYPE_MS); } });
        at(650 + TYPE_MS + 250,     function () { setToggle(true); });
        at(650 + TYPE_MS + 800,     function () { setTrack(true); });             // scroll down to the buttons
        at(650 + TYPE_MS + 1300,    function () { clickBtn(addBtn); });
      }
      function toDone() {          // beat 2: form out, chips return with the new word
        clearSeq();
        if (typer) { typer.play(VOCAB_WORD, 1); }
        setToggle(true); setTrack(true);
        setForm(false, exitY());
        setList(true); setNewChip(true);
      }
      function toExit() {          // beat 3: everything out before the loop restarts
        clearSeq();
        setList(false);
        if (newChip) { newChip.style.opacity = '0'; newChip.style.transform = 'scale(0.4) translateY(-6px)'; }
      }

      var lastBeat = -1;
      function render(tp) {
        var beat = beatOf(tp, C1_BEATS);
        if (beat === lastBeat) { return; }
        lastBeat = beat;
        if (beat <= 0) { toRest(); }
        else if (beat === 1) { playForm(); }
        else if (beat === 2) { toDone(); }
        else { toExit(); }
      }

      return { render: render, measure: measure, destroy: function () { clearSeq(); if (typer) typer.reset(); } };
    }

    // ---- card 2: the trigger pill lifts out, the URL rises into its slot, the sentence reflows ----
    function buildCard2(root, clampW) {
      if (!root) { return null; }
      var oneS = function (v) { return root.querySelector('[data-snip="' + v + '"]'); };
      var lineEl = oneS('line');
      var slot = oneS('slot');
      var trig = oneS('trigger');
      var exp  = oneS('expand');
      if (!slot) { return null; }

      // centre the line so the growing slot pushes both sides out equally. NOT text-align centre — the
      // URL inside the pill stays left-aligned.
      if (lineEl) {
        lineEl.style.justifyContent = 'center';
        lineEl.style.flexWrap = 'nowrap';
        // side text gets pushed OUT past the card edge, never shrunk or re-wrapped — else the widening
        // pill lands on top of it
        Array.prototype.forEach.call(lineEl.children, function (ch) {
          if (ch === slot) { return; }
          ch.style.flex = '0 0 auto';
          ch.style.whiteSpace = 'nowrap';
        });
      }

      // the fade overlay must be absolute — in flow it pushes the URL text off-centre
      var grad = exp && exp.querySelector('.lang_gradient');
      if (grad) {
        grad.style.position = 'absolute'; grad.style.top = '0'; grad.style.right = '0'; grad.style.bottom = '0';
        grad.style.pointerEvents = 'none';
      }

      slot.style.position = 'relative';
      slot.style.display = 'inline-block';
      slot.style.verticalAlign = 'middle';
      // GOTCHA: as a flex item the slot shrinks back below the width we set, but the pill inside is
      // absolute and can't shrink with it → the pill overflows the squashed slot and covers the side text.
      slot.style.flex = '0 0 auto';
      slot.style.transition = 'width ' + TRIG_MS + 'ms ' + EASE;   // slot grows → reflow plays
      // both pills centred, so the swap is a straight vertical rise with no diagonal drift
      [trig, exp].forEach(function (el) {
        if (!el) { return; }
        el.style.position = 'absolute';
        el.style.top = '50%'; el.style.left = '50%';
        el.style.whiteSpace = 'nowrap';
        el.style.willChange = 'opacity, transform';
        el.style.transition = 'opacity ' + TRIG_MS + 'ms ease, transform ' + TRIG_MS + 'ms ' + EASE;
      });

      // the whole row fades at the end — side text included, not just the pill. NOT root: the desktop
      // stack owns root's opacity for the card crossfade, and the two would fight.
      var fadeEl = lineEl || slot;
      if (fadeEl) { fadeEl.style.transition = 'opacity ' + C2_FADE_MS + 'ms ease'; }

      // coming back from the fade, the pills have to be put back WITHOUT animating — otherwise the
      // trigger visibly slides down and the slot visibly narrows while the row is fading back in
      var trigTrans = trig ? trig.style.transition : '';
      var expTrans  = exp  ? exp.style.transition  : '';
      var slotTrans = slot ? slot.style.transition : '';
      function resetInstant() {
        if (trig) { trig.style.transition = 'none'; }
        if (exp)  { exp.style.transition  = 'none'; }
        if (slot) { slot.style.transition = 'none'; }
        if (trig) { trig.style.transform = 'translate(-50%,-50%) translateY(0px)'; trig.style.opacity = '1'; }
        if (exp)  { exp.style.transform = 'translate(-50%,-50%) translateY(' + SNIP_RISE + 'px)'; exp.style.opacity = '0'; }
        if (slot && trigW) { slot.style.width = trigW + 'px'; }
        if (slot) { void slot.offsetWidth; }                       // flush, then hand the transitions back
        if (trig) { trig.style.transition = trigTrans; }
        if (exp)  { exp.style.transition  = expTrans; }
        if (slot) { slot.style.transition = slotTrans; }
      }

      // each pill's natural width — the slot sizes to the active one, which drives the reflow
      var trigW = 0, expW = 0, slotH = 0, lastBeat = -1;
      function measure() {
        slotH = 0;
        if (trig) { trigW = trig.offsetWidth; slotH = Math.max(slotH, trig.offsetHeight); }
        if (exp) {
          var d = exp.style.display, o = exp.style.opacity;   // reveal briefly to measure
          exp.style.display = ''; exp.style.opacity = '0';
          if (clampW) { exp.style.maxWidth = 'none'; }
          expW = exp.offsetWidth; slotH = Math.max(slotH, exp.offsetHeight);
          if (clampW) {
            var avail = root.clientWidth || 0;
            if (avail && expW > avail) { expW = avail; }
            exp.style.maxWidth = expW + 'px';
            exp.style.overflow = 'hidden';
          }
          exp.style.display = d; exp.style.opacity = o;
        }
        if (slotH) { slot.style.height = slotH + 'px'; }
        if (lastBeat >= 0 && (trigW || expW)) { slot.style.width = (lastBeat >= 1 ? expW : trigW) + 'px'; }
      }
      measure();

      // beat 0 = rest · 1 = trigger out, room made, URL waiting below · 2 = URL risen into the slot ·
      // 3 = everything fades out where it stands, so the loop restarts from empty rather than cutting
      function render(tp) {
        var beat = beatOf(tp, [C2_LIFT, C2_RISE, C2_OUT]);
        var wasBeat = lastBeat;
        lastBeat = beat;
        // beat 3 fades the ROW — the pills hold their pose underneath it, so nothing moves while it goes
        if (fadeEl) { fadeEl.style.opacity = (beat === 3) ? '0' : '1'; }
        if (beat === 0 && wasBeat === 3) { resetInstant(); }        // restart: pose back, invisibly
        if (beat === 3) { return; }                                 // leave everything as the fade found it

        var urlIn = (beat === 2);
        if (trig) {
          trig.style.transform = 'translate(-50%,-50%) translateY(' + (beat === 0 ? 0 : -SNIP_RISE) + 'px)';
          trig.style.opacity = urlIn ? '0' : '1';
        }
        if (exp) {
          exp.style.transform = 'translate(-50%,-50%) translateY(' + (urlIn ? 0 : SNIP_RISE) + 'px)';
          exp.style.opacity = (beat >= 1) ? '1' : '0';
        }
        // the slot grows at beat 1, BEFORE the URL rises, so the URL lands straight instead of from the right
        if (trigW || expW) { slot.style.width = (beat >= 1 ? expW : trigW) + 'px'; }
      }

      return {
        render: render,
        measure: measure,
        destroy: function () {
          slot.style.width = ''; slot.style.height = '';
          if (exp && clampW) { exp.style.maxWidth = ''; exp.style.overflow = ''; }
        }
      };
    }

    // ---- card 3: cycle Formal → Casual → Very casual; message waves in, active button takes is-active ----
    function buildCard3(root) {
      if (!root) { return null; }
      var btns = root.querySelectorAll('[data-tone]');
      Array.prototype.forEach.call(btns, function (b) {
        b.style.transition = 'background-color ' + TRIG_MS + 'ms ease, color ' + TRIG_MS + 'ms ease';
      });
      if (!btns.length) { console.warn('[languages] card 3: no [data-tone] buttons found'); }

      // one el per tone, [data-tone-msg="0|1|2"] or the tone key, so the copy stays editable in Webflow.
      // Fallback: a single untagged [data-tone-msg] → JS swaps its text from TONES.
      var msgList = root.querySelectorAll('[data-tone-msg]');
      var msgByTone = [];
      Array.prototype.forEach.call(msgList, function (el) {
        var v = el.getAttribute('data-tone-msg');
        var idx = parseInt(v, 10);
        if (isNaN(idx)) { for (var k = 0; k < TONES.length; k++) { if (TONES[k].key === v) { idx = k; break; } } }
        if (idx >= 0 && !isNaN(idx)) { msgByTone[idx] = el; }
      });
      var authored = msgByTone.filter(Boolean).length >= 2;
      var single = (!authored && msgList.length === 1) ? msgList[0] : null;
      var wrap = null, msgSpans = [], measure = function () {};

      if (authored) {
        // stack the messages in ONE GRID CELL so they can crossfade. Grid, not absolute: the wrapper keeps
        // sizing itself (width = its normal box, height = the tallest message, padding native). Absolute
        // collapsed the wrapper, which forced px locks and shrank the box to a text column when narrow.
        var kept = msgByTone.filter(Boolean);
        wrap = kept[0].parentNode;
        if (wrap) {
          wrap.style.display = 'grid';
          wrap.style.boxSizing = 'border-box';
        }
        msgByTone.forEach(function (el, t) {
          if (!el) { return; }
          el.style.gridArea = '1 / 1';
          el.style.whiteSpace = 'pre-line';
          msgSpans[t] = waveWrap(el, WAVE_STAGGER);
        });
      } else if (single) {
        single.style.whiteSpace = 'pre-line'; single.style.willChange = 'opacity, transform';
        single.style.transition = 'opacity ' + TRIG_MS + 'ms ease';
      }

      var lastActive = -1;
      // active tone = which third of the slice we're in
      function render(tp) {
        var N = TONES.length;
        var active = Math.max(0, Math.min(N - 1, Math.floor(Math.max(0, Math.min(1, tp)) * N)));

        if (active === lastActive) return;

        if (authored) {
          // the messages share one grid cell, so an outgoing word and an incoming word occupy the same
          // spot. staggering BOTH left the two texts legible on top of each other — the old one clears
          // fast and all at once, and only then does the new one wave in.
          var lag = (lastActive === -1) ? 0 : (TONE_OUT_MS + TONE_IN_LAG);
          for (var t = 0; t < N; t++) {
            var spans = msgSpans[t];
            if (!spans) { continue; }
            var on = (t === active);
            for (var w = 0; w < spans.length; w++) {
              var sp = spans[w];
              if (on) {
                sp.style.transitionDuration = TONE_IN_MS + 'ms, ' + TONE_IN_MS + 'ms';
                sp.style.transitionDelay = (lag + w * WAVE_STAGGER) + 'ms';
              } else {
                sp.style.transitionDuration = TONE_OUT_MS + 'ms, ' + TONE_OUT_MS + 'ms';
                sp.style.transitionDelay = '0ms';                  // no wave on the way out
              }
              sp.style.opacity = on ? '1' : '0';
              sp.style.transform = on ? 'translateY(0px)' : 'translateY(8px)';
            }
          }
        } else if (single) {
          if (active !== lastActive) { single.textContent = TONES[active].text; }
          single.style.opacity = '1';
        }

        if (active !== lastActive) {
          for (var b = 0; b < btns.length; b++) {
            var v = btns[b].getAttribute('data-tone');
            // match by ORDER as well as value/key, so a mistagged button still activates
            btns[b].classList.toggle(ACTIVE_CLASS, b === active || v === String(active) || v === TONES[active].key);
          }
          lastActive = active;
        }
      }

      return {
        render: render,
        measure: measure,
        destroy: function () { if (wrap) { wrap.style.display = ''; } }
      };
    }


    VOCAB_WORD = root.getAttribute('data-vocab-word') || VOCAB_WORD;
    // Namespaced IDs keep independently pasted SVG embeds from sharing a curve.
    uniqIds(root, 'scroll-card-' + (++cardId));
    const built = index === 0 ? buildCard0(root, LANG_PATH_FONT, desktopMode)
      : index === 1 ? buildCard1(root)
      : index === 2 ? buildCard2(root, false) : buildCard3(root);
    if (!built) { root.innerHTML = originalHTML; return null; }
    const start = LANG_START[index] || 0;
    let progress = start;
    built.render(progress);
    return {
      tick(dt) {
        motion.step(dt);
        progress += dt / LANG_AUTOPLAY_MS[index];
        if (progress >= 1) progress = index === 0 ? progress % 1 : start;
        built.render(progress);
      },
      reset() { jobs.clear(); progress = start; built.render(progress); },
      measure() { canvasCache = {}; built.measure(); },
      destroy() { built.destroy(); jobs.clear(); root.innerHTML = originalHTML; }
    };
  }

  function playCards(pairs, desktop, reduced, selected) {
    const entries = pairs.map((pair, index) => ({
      ...pair, index, card: pair.image.hasAttribute('data-scroll-card') ? createCard(pair.image, desktop.matches) : null,
      visible: false, playing: false
    })).filter(entry => entry.card);
    if (!entries.length) return () => {};
    let frame = 0, last = null, alive = true;
    function running(entry) {
      return !reduced.matches && !document.hidden && entry.visible && (!desktop.matches || selected() === entry.index);
    }
    function tick(time) {
      frame = 0;
      if (!alive) return;
      const dt = last === null ? 0 : Math.min(time - last, 100);
      last = time;
      let playing = false;
      entries.forEach(entry => {
        const on = running(entry);
        if (on) { entry.card.tick(dt); playing = true; }
        else if (entry.playing && !document.hidden) entry.card.reset();
        entry.playing = on;
      });
      if (playing) frame = requestAnimationFrame(tick); else last = null;
    }
    function wake() { if (alive && !frame) frame = requestAnimationFrame(tick); }
    function visibility() { last = null; wake(); }
    const io = window.IntersectionObserver ? new IntersectionObserver(records => {
      records.forEach(record => {
        const entry = entries.find(e => e.image === record.target);
        if (entry) entry.visible = record.isIntersecting;
      });
      wake();
    }, { threshold: 0, rootMargin: '0px 0px -10% 0px' }) : null;
    if (io) entries.forEach(e => io.observe(e.image));
    else entries.forEach(e => { e.visible = true; });
    function measure() { if (alive) entries.forEach(e => e.card.measure()); }
    const ro = window.ResizeObserver ? new ResizeObserver(measure) : null;
    if (ro) entries.forEach(e => ro.observe(e.image));
    window.addEventListener('resize', measure);
    document.addEventListener('visibilitychange', visibility);
    // Selection dispatch is scoped to this section's existing stage controller.
    const section = pairs[0].item.closest(SELECTOR);
    section.addEventListener('image-scroll-select', wake);
    if (document.fonts) document.fonts.ready.then(measure);
    wake();
    return () => {
      alive = false; cancelAnimationFrame(frame);
      if (io) io.disconnect(); if (ro) ro.disconnect();
      window.removeEventListener('resize', measure);
      document.removeEventListener('visibilitychange', visibility);
      section.removeEventListener('image-scroll-select', wake);
      entries.forEach(e => e.card.destroy());
    };
  }

  function start() {
    if (document.querySelector('[data-scroll-card]') && !document.getElementById('scroll-card-motion')) {
      const style = document.createElement('style');
      style.id = 'scroll-card-motion';
      style.textContent = '@media(prefers-reduced-motion:reduce){[data-scroll-card] *,[data-scroll-card] *::before{transition:none!important;animation:none!important;}}';
      document.head.appendChild(style);
    }
    document.querySelectorAll(SELECTOR).forEach(initialize); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
