/* Marketers hero: original Flow chapters 1 + 2, one responsive card.
 * Layout and content stay in Webflow. No scroll pinning or background swaps.
 */
(function () {
  'use strict';
  if (window.MarketersHero) window.MarketersHero.destroy();
  var SELECTOR = '[data-flow-hero="marketers"]';
  var CONFIG = { revealSeconds: 9.5, polishSeconds: 6.2, typeEnd: 0.9, holdSeconds: 2, resetSeconds: 1.8 };
  var chaptersEnd = CONFIG.revealSeconds + CONFIG.polishSeconds;
  var resetStart = chaptersEnd + CONFIG.holdSeconds;
  var cycleSeconds = resetStart + CONFIG.resetSeconds;
  var instances = [], disposed = false;
  function clamp(t) { return Math.max(0, Math.min(1, t)); }
  function smooth(t) { t = clamp(t); return t * t * (3 - 2 * t); }
  function phaseT(p, a, b) { return smooth((p - a) / (b - a)); }
  var BOX_GROW_FAST     = 2.6;
  var BOX_OUT_POW   = 4;
  var GLOW_BAND     = 0.14;
  var GLOW_COLOR    = '255,255,240';
  var GLOW_DIAG     = 0.35;
  var GLOW_EDGE     = true;
  var GLOW_MAX      = 12;
  var GRAD_SHIFT_MS = 3200;
  var GRAD_SPAN     = 2.2;
  var MSG_BLEED     = true;
  var MSG_BLEED_X   = -1;
  var MSG_BORDER    = true;
  var PASTE_MODE        = true;
  var PLACEHOLDER_OUT = 6.0;
  var POLISH_AMP    = 12;
  var POLISH_BAND   = 0.22;
  var POLISH_DROP   = [0.52, 0.66];
  var POLISH_FAST       = 1.7;
  var POLISH_GAP    = 0.12;
  var POLISH_GRAD   = [0.0, 0.46];
  var POLISH_GRAD_CSS = 'linear-gradient(100deg,#F0D7FF 0%,#FFA946 23%,#FF6C4C 39%,#FFBCF2 67%,#7232A6 91%)';
  var POLISH_RAWOUT = [0.46, 0.55];
  var POLISH_WAVE   = true;
  var RAW_FADE_FAST     = 1.12;
  var RAW_OUT_ANGLE = (180 - 45 * GLOW_DIAG).toFixed(1) + 'deg';
  var RAW_OUT_SOFT  = 30;
  var RAW_OUT_WAVE  = true;
  var RAW_PUSH_SCALE    = 1;
  var RAW_PUSH_Y        = 90;
  var WAVE_AMP      = 7;
  var WAVE_BAND     = 0.18;
  var WAVE_MOTION   = true;
  var WAVE_ROT      = 0;
  var WAVE_SCALE    = 0.05;
  var WORD_GRAD     = true;

  function create(root) {
    var q = function (s) { return root.querySelector(s); };
    var transcriptEl = q('[data-type="raw"]');
    var polishedEl = q('[data-type="polished"]');
    var msgGrowEl = q('[data-flow="msg-grow"]');
    var composer = q('[data-flow="composer"]');
    if (!transcriptEl || !polishedEl || !msgGrowEl || !composer) {
      console.warn('[marketers-hero] Missing transcript, polished text, composer or msg-grow.', root);
      return null;
    }
    // Restore original nodes/styles on destroy, including when the script is loaded twice.
    var originalHTML = root.innerHTML, originalStyle = root.getAttribute('style');
    var originalReady = root.getAttribute('data-hero-ready');
    var rawWrap = transcriptEl.parentElement, msgContain = msgGrowEl.parentElement;
    var placeholderEl = composer.querySelector('.flow_message-placeholder');
    var audio = q('[data-flow="pill-audio"]');
    var identifiers = q('.flow_pill-anim-wrap');
    var polishPill = q('[data-pill="polishing"]');
    var pills = Array.from(root.querySelectorAll('[data-pill]'));
    var words = [], pwords = [], wordEls = [];
    var clock = 0, elapsed = 0, frame = 0, lastTime = null, visible = false;
    var ready = false, dead = false, manual = false, polishCur = 0;
    var msgCollapsedH = 0, msgExpandedH = 0, heightsOK = false;
    var gradW = 0, gradReady = false, diagMeasured = false;
    var msgPadL = 0, msgPadR = 0, msgBorderL = '', msgBorderR = '', msgBorderT = '';
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    var phase = '', pillShown = null;

    function wrapRaw(node, category) {
      Array.from(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var span = document.createElement('span');
            span.className = 'flow_w'; span.textContent = part;
            span.style.opacity = '0'; frag.appendChild(span);
            words.push({ el: span, cat: category });
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) {
          // Preserve original color-only aliases: only the full category names select pills.
          var match = /(?:^|\s)flow_type-([a-z]+)/.exec(child.className || '');
          wrapRaw(child, match ? match[1] : category);
        }
      });
    }
    wrapRaw(transcriptEl, null);
    var text = polishedEl.textContent;
    polishedEl.textContent = '';
    text.split(/(\s+)/).forEach(function (part) {
      if (!part) return;
      if (/^\s+$/.test(part)) { polishedEl.appendChild(document.createTextNode(part)); return; }
      var span = document.createElement('span');
      span.className = 'flow_pw'; span.textContent = part;
      polishedEl.appendChild(span); pwords.push(span);
    });
    Object.assign(polishedEl.style, { position: 'relative', height: 'auto', opacity: '1',
      overflow: 'visible', transform: 'translateY(-16px)' });
    msgContain.style.overflow = 'visible';
    msgGrowEl.style.overflow = 'hidden';
    if (identifiers) identifiers.style.opacity = '1';
    pills.forEach(function (pill) {
      var label = pill.querySelector('.flow_text-type,.flow_text-polish-type');
      if (!label) return;
      var labelText = label.textContent; label.textContent = '';
      Array.from(labelText).forEach(function (char, i) {
        var span = document.createElement('span'); span.className = 'pill-ch';
        span.textContent = char === ' ' ? '\u00a0' : char;
        span.style.transitionDelay = (0.16 + i * 0.018) + 's'; label.appendChild(span);
      });
    });
    if (polishPill) {
      var dotWrap = polishPill.querySelector('.flow_pill-polish_wrap') || polishPill;
      var row = document.createElement('div'); row.className = 'flow_pill-dots';
      for (var i = 0; i < 10; i++) {
        var dot = document.createElement('span'); dot.className = 'flow_pill-dot';
        dot.style.transitionDelay = i * 0.03 + 's'; row.appendChild(dot);
      }
      dotWrap.appendChild(row);
    }
    var spinner = q('[data-flow="spinner"]');
    if (spinner && !spinner.querySelector('svg')) {
      spinner.innerHTML = '<svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">' +
          '<path d="M7.53991 0.363512L8.60385 2.9853C9.04863 4.08175 9.91825 4.95137 11.0147 5.39615L13.6365 ' +
          '6.46009C14.1212 6.65699 14.1212 7.34338 13.6365 7.53991L11.0147 8.60385C9.91825 9.04863 9.04863 ' +
          '9.91825 8.60385 11.0147L7.53991 13.6365C7.34301 14.1212 6.65662 14.1212 6.46009 13.6365L5.39615 ' +
          '11.0147C4.95137 9.91825 4.08175 9.04863 2.9853 8.60385L0.363512 7.53991C-0.121171 7.34301 ' +
          '-0.121171 6.65662 0.363512 6.46009L2.9853 5.39615C4.08175 4.95137 4.95137 4.08175 5.39615 ' +
          '2.9853L6.46009 0.363512C6.65662 -0.121171 7.34301 -0.121171 7.53991 0.363512Z" fill="currentColor"/></svg>';
    }
    var bars = audio ? Array.from(audio.querySelectorAll('[data-anim="audio"] rect')) : [];
    if (audio && !bars.length) bars = Array.from(audio.querySelectorAll('.flow_svg-inner rect'));
    var audioBars = bars.map(function (el) {
      var svg = el.closest('svg'), h = parseFloat(el.getAttribute('height')) || 0;
      return { el: el, cy: (parseFloat(el.getAttribute('y')) || 0) + h / 2,
        vbh: svg && svg.viewBox.baseVal.height || 33,
        ceil: 0.24 + 0.74 * (0.82 + 0.18 * Math.random()),
        f1: 0.8 + Math.random() * 1.5, f2: 2 + Math.random() * 3,
        ph1: Math.random() * 6.2832, ph2: Math.random() * 6.2832 };
    });
    var envPh1 = Math.random() * 6.2832, envPh2 = Math.random() * 6.2832;
    function updateAudio() {
      var t = clock * 2.4, pi = Math.PI * 2;
      var env = (0.5 + 0.5 * Math.sin(t * pi * 0.9 + envPh1)) *
        (0.5 + 0.5 * Math.sin(t * pi * 2.3 + envPh2));
      audioBars.forEach(function (bar, i) {
        var v = 0.55 * Math.sin(t * pi * bar.f1 + bar.ph1) + 0.45 * Math.sin(t * pi * bar.f2 + bar.ph2);
        var jag = (0.5 + 0.5 * v) * (0.22 * env + 0.78);
        var x = audioBars.length > 1 ? i / (audioBars.length - 1) : 0.5;
        var wave = 0.6 * Math.sin((x * 1.7 - t) * pi) + 0.4 * Math.sin((x * 0.85 - t * 0.6) * pi + 1.7);
        var wav = (0.5 + 0.5 * wave) * (0.7 + 0.3 * Math.sin(x * Math.PI));
        var height = (0.24 + (bar.ceil - 0.24) * (0.72 * wav + 0.28 * jag)) * bar.vbh;
        bar.el.setAttribute('height', height); bar.el.setAttribute('y', bar.cy - height / 2);
      });
    }
    function measureWordDiag() {
      var base = transcriptEl.getBoundingClientRect(), min = Infinity, max = -Infinity;
      words.forEach(function (word) {
        var r = word.el.getBoundingClientRect();
        word._v = (r.top + r.height / 2 - base.top) / (base.height || 1) +
          (r.left + r.width / 2 - base.left) / (base.width || 1) * 0.35;
        min = Math.min(min, word._v); max = Math.max(max, word._v);
      });
      words.forEach(function (word) { word.diag = (word._v - min) / (max - min || 1); });
    }
    function measure() {
      if (dead || !root.clientWidth) return;
      setMsgBleed(false);
      msgGrowEl.style.height = ''; msgGrowEl.style.marginTop = '0px';
      polishedEl.style.display = 'none'; msgCollapsedH = msgGrowEl.offsetHeight;
      polishedEl.style.display = 'block'; msgExpandedH = Math.max(msgCollapsedH, msgGrowEl.offsetHeight);
      var cs = getComputedStyle(msgContain);
      msgPadL = parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth);
      msgPadR = parseFloat(cs.paddingRight) + parseFloat(cs.borderRightWidth);
      msgBorderL = cs.borderLeft; msgBorderR = cs.borderRight; msgBorderT = cs.borderTop;
      msgGrowEl.style.backgroundColor = cs.backgroundColor;
      msgGrowEl.style.borderTopLeftRadius = cs.borderTopLeftRadius;
      msgGrowEl.style.borderTopRightRadius = cs.borderTopRightRadius;
      heightsOK = msgCollapsedH > 0 && msgExpandedH > 0;
      // Measure the untransformed text so resizing in mid-polish cannot skew the diagonal.
      rawWrap.style.transform = '';
      words.forEach(function (w) { w.el.style.transform = ''; });
      measureWordDiag(); diagMeasured = true;
      wordEls = words.map(function (w) { return w.el; });
      gradW = gradMeasure(wordEls, transcriptEl); gradPaint(wordEls); gradReady = true;
      paint();
    }
      function gradMeasure(list, container) {
        if (!container || !list.length) { return 0; }
        var cr = container.getBoundingClientRect();
        for (var i = 0; i < list.length; i++) {
          list[i]._gx = list[i].getBoundingClientRect().left - cr.left;
        }
        return cr.width || 1;
      }
      function gradPaint(list) {
        for (var i = 0; i < list.length; i++) {
          var s = list[i].style;
          s.backgroundImage  = POLISH_GRAD_CSS;
          s.backgroundRepeat = 'no-repeat';
          s.setProperty('-webkit-background-clip', 'text');
          s.backgroundClip = 'text';
        }
      }
      function gradShift(list, w) {
        if (!w || !list.length) { return; }
        var span  = w * GRAD_SPAN;
        var t     = (clock * 1000 / GRAD_SHIFT_MS) % 2;
        var slide = (t > 1 ? 2 - t : t) * (span - w);
        var sz    = span.toFixed(1) + 'px 100%';
        for (var i = 0; i < list.length; i++) {
          list[i].style.backgroundSize = sz;
          list[i].style.backgroundPosition = (-(list[i]._gx || 0) - slide).toFixed(1) + 'px 0';
        }
      }

      // the grown box sits INSIDE the container's border, so that border shows as a strip beside
      // the part that grew. bleed over it and carry the border while grown.
      function setMsgBleed(on) { setBoxBleed(msgGrowEl, on); }
      function setBoxBleed(box, on) {
        if (!box || !MSG_BLEED) { return; }
        var l = (MSG_BLEED_X >= 0) ? MSG_BLEED_X : msgPadL;
        var r = (MSG_BLEED_X >= 0) ? MSG_BLEED_X : msgPadR;
        box.style.marginLeft  = on ? (-l) + 'px' : '';
        box.style.marginRight = on ? (-r) + 'px' : '';
        if (MSG_BORDER && msgBorderL) {
          box.style.boxSizing   = on ? 'border-box' : '';
          box.style.borderLeft  = on ? msgBorderL : '';
          box.style.borderRight = on ? msgBorderR : '';
          box.style.borderTop   = on ? msgBorderT : '';
        }
      }
      function outPow(t) {
        if (!(BOX_OUT_POW > 1)) { return smooth(t); }
        var c = t < 0 ? 0 : (t > 1 ? 1 : t);
        return 1 - Math.pow(1 - c, BOX_OUT_POW);
      }
      function crestAt(front, ph) {
        var d = front - ph;
        if (d <= 0 || d >= WAVE_BAND) { return 0; }
        return Math.sin(Math.PI * (d / WAVE_BAND));
      }
      function crestCSS(w, extraY) {
        var y = (extraY || 0) - WAVE_AMP * w;
        var t = '';
        if (y) { t += 'translateY(' + y.toFixed(2) + 'px)'; }
        if (WAVE_SCALE && w) { t += ' scale(' + (1 + WAVE_SCALE * w).toFixed(4) + ')'; }
        if (WAVE_ROT && w)   { t += ' rotate(' + (WAVE_ROT * w).toFixed(2) + 'deg)'; }
        return t;
      }

      var RAW_OUT_ANGLE = (180 - 45 * GLOW_DIAG).toFixed(1) + 'deg';
      function rawOutMask(wipe) {
        if (!RAW_OUT_WAVE) {
          var soft = 16, stop = wipe * (100 + soft);
          return 'linear-gradient(to top, transparent ' + Math.max(0, stop - soft).toFixed(1) +
            '%, #000 ' + stop.toFixed(1) + '%)';
        }

        var s = wipe * (100 + RAW_OUT_SOFT * 2) - RAW_OUT_SOFT;
        return 'linear-gradient(' + RAW_OUT_ANGLE + ', transparent ' + s.toFixed(1) +
          '%, #000 ' + (s + RAW_OUT_SOFT).toFixed(1) + '%)';
      }

      function renderPolish(tp) {
        var n = words.length, np = pwords.length;
        if (GLOW_EDGE && !diagMeasured) { measureWordDiag(); diagMeasured = true; }
        if (WORD_GRAD) {
          if (!gradReady) {
            if (!wordEls.length) { for (var wi = 0; wi < n; wi++) { wordEls.push(words[wi].el); } }
            gradW = gradMeasure(wordEls, transcriptEl);
            gradPaint(wordEls);
            gradReady = true;
          }
          gradShift(wordEls, gradW);
        }

        var Fg = phaseT(tp, POLISH_GRAD[0], POLISH_GRAD[1]) * 1.08;

        var Fglow = phaseT(tp, POLISH_GRAD[0], POLISH_GRAD[1]) * (1 + GLOW_BAND + 0.05);

        var F  = outPow(phaseT(tp, POLISH_DROP[0], POLISH_DROP[1])) *
                 (PASTE_MODE ? POLISH_FAST : 1) * (1 + POLISH_GAP + POLISH_BAND);
        for (var i = 0; i < n; i++) {
          var ph = (words[i].diag != null) ? words[i].diag : (n > 1 ? i / (n - 1) : 0);
          words[i].el.style.color = (Fg > ph) ? 'transparent' : '';
          if (GLOW_EDGE) {
            var df = Fglow - ph;
            var g = (df >= 0 && df < GLOW_BAND) ? (1 - df / GLOW_BAND) : 0;
            words[i].el.style.textShadow = g > 0.02
              ? ('0 0 ' + (GLOW_MAX * g).toFixed(1) + 'px rgba(' + GLOW_COLOR + ',' + (0.9 * g).toFixed(2) + ')')
              : '';
          }
          if (WAVE_MOTION) {
            var cw = crestAt(Fglow, ph);
            words[i].el.style.transform = cw > 0.002 ? crestCSS(cw, 0) : '';
          }
        }

        if (rawWrap) {
          var rawT = smooth(phaseT(tp, POLISH_RAWOUT[0], POLISH_RAWOUT[1]));

          var m = rawOutMask(PASTE_MODE ? Math.min(1, rawT * RAW_FADE_FAST) : rawT);
          rawWrap.style.webkitMaskImage = m;
          rawWrap.style.maskImage = m;
          if (PASTE_MODE) {

            rawWrap.style.transformOrigin = '50% 100%';
            rawWrap.style.transform = rawT > 0.0005
              ? ('translateY(' + (RAW_PUSH_Y * rawT).toFixed(2) + 'px)' +
                 (RAW_PUSH_SCALE === 1 ? '' :
                   ' scale(' + (1 - (1 - RAW_PUSH_SCALE) * rawT).toFixed(4) + ')'))
              : '';
          }
        }
        for (var j = 0; j < np; j++) {
          var pph = np > 1 ? j / (np - 1) : 0;
          var o = smooth((F - pph - POLISH_GAP) / POLISH_BAND);
          pwords[j].style.opacity = String(o);
          if (POLISH_WAVE) {
            pwords[j].style.transform = crestCSS(crestAt(F, pph) * 0.6, POLISH_AMP * (1 - o));
          }
        }
        var grow = outPow(phaseT(tp, POLISH_DROP[0], POLISH_DROP[1]));
        if (PASTE_MODE && BOX_GROW_FAST > 0) { grow = Math.pow(grow, 1 / BOX_GROW_FAST); }
        var gpx  = (msgExpandedH - msgCollapsedH) * grow;

        if (msgGrowEl && heightsOK) {
          msgGrowEl.style.height = (msgCollapsedH + gpx) + 'px';
          msgGrowEl.style.marginTop = (-gpx) + 'px';
          setMsgBleed(gpx > 0.5);
        }

        if (placeholderEl){ placeholderEl.style.opacity = String(1 - smooth(Math.min(1, grow * PLACEHOLDER_OUT))); }
      }


    function showPill(name) {
      if (name === pillShown) return;
      pillShown = name;
      pills.forEach(function (pill) {
        var on = pill.getAttribute('data-pill') === name;
        pill.classList.toggle('is-on', on);
        // Also overrides optional pre-load opacity rules in the page head.
        pill.style.opacity = on ? '1' : '0';
      });
    }
    // Fade the result before collapsing its box; restore the recording state only
    // after the old content is hidden. Both ends have zero velocity.
    function paintReset() {
      var t = elapsed - resetStart;
      words.forEach(function (word) { word.el.style.opacity = '0'; });
      var fade = smooth(t / 0.45);
      polishedEl.style.opacity = String(1 - fade);
      if (polishPill) polishPill.style.opacity = String(1 - fade);
      var collapse = smooth((t - 0.3) / 0.9);
      var gpx = (msgExpandedH - msgCollapsedH) * (1 - collapse);
      msgGrowEl.style.height = (msgCollapsedH + gpx) + 'px';
      msgGrowEl.style.marginTop = (-gpx) + 'px';
      setMsgBleed(gpx > 0.5);
      var enter = smooth((t - 1.05) / 0.65);
      if (placeholderEl) placeholderEl.style.opacity = String(enter);
      if (audio) audio.style.opacity = String(enter);
    }
    function paint() {
      polishedEl.style.opacity = '1';
      var polishing = elapsed >= CONFIG.revealSeconds;
      var nextPhase = polishing ? 'polish' : 'reveal';
      var tp = clamp((elapsed - CONFIG.revealSeconds) / CONFIG.polishSeconds);
      if (nextPhase !== phase) {
        phase = nextPhase;
        transcriptEl.classList.toggle('is-polishing', polishing);
        transcriptEl.classList.toggle('is-wordgrad', polishing);
      }
      var count = polishing ? words.length : Math.round(clamp(elapsed / (CONFIG.revealSeconds * CONFIG.typeEnd)) * words.length);
      words.forEach(function (word, i) { word.el.style.opacity = i < count ? '1' : '0'; });
      if (audio) audio.style.opacity = polishing ? '0' : '1';
      if (polishing) {
        showPill('polishing'); renderPolish(polishCur);
        if (polishPill) {
          polishPill.style.opacity = '1';
          polishPill.classList.toggle('is-done', tp >= 0.46);
          polishPill.classList.toggle('is-in', tp >= 0.46 + 0.24 / CONFIG.polishSeconds);
        }
      } else {
        var active = null;
        for (var i = count - 1; i >= 0; i--) {
          if (['filler', 'correction', 'repetition'].indexOf(words[i].cat) !== -1) { active = words[i].cat; break; }
        }
        showPill(active);
        if (polishPill) polishPill.classList.remove('is-done', 'is-in');
        rawWrap.style.maskImage = ''; rawWrap.style.webkitMaskImage = ''; rawWrap.style.transform = '';
        words.forEach(function (w) { w.el.style.color = ''; w.el.style.textShadow = ''; w.el.style.transform = ''; });
        pwords.forEach(function (w) { w.style.opacity = '0'; w.style.transform = ''; });
        msgGrowEl.style.height = msgCollapsedH + 'px'; msgGrowEl.style.marginTop = '0px'; setMsgBleed(false);
        if (placeholderEl) placeholderEl.style.opacity = '1';
      }
      if (elapsed >= resetStart) paintReset();
    }
    function tick(time) {
      frame = 0;
      if (dead || !ready || !visible || document.hidden || manual || reduced.matches) { lastTime = null; return; }
      var dt = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time; clock += dt;
      elapsed += dt;
      if (elapsed >= cycleSeconds) {
        elapsed %= cycleSeconds;
        polishCur = 0;
      }
      var target = clamp((elapsed - CONFIG.revealSeconds) / CONFIG.polishSeconds);
      polishCur += (target - polishCur) * (1 - Math.pow(1 - 0.32, dt * 60));
      if (Math.abs(target - polishCur) < 0.0004) polishCur = target;
      paint(); if (elapsed < CONFIG.revealSeconds || elapsed >= resetStart) updateAudio();
      frame = requestAnimationFrame(tick);
    }
    function wake() {
      if (!frame && ready && visible && !document.hidden && !manual && !reduced.matches) frame = requestAnimationFrame(tick);
    }
    function motionChange() {
      if (reduced.matches) { elapsed = CONFIG.revealSeconds + CONFIG.polishSeconds; polishCur = 1; paint(); }
      else wake();
    }
    var io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (!visible) lastTime = null;
      wake();
    }, { threshold: 0.15 }) : null;
    if (io) io.observe(root); else visible = true;
    var width = root.clientWidth;
    var ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(function () {
      if (width !== root.clientWidth) { width = root.clientWidth; if (ready) measure(); }
    }) : null;
    if (ro) ro.observe(root);
    function visibilityChange() { lastTime = null; wake(); }
    document.addEventListener('visibilitychange', visibilityChange);
    reduced.addEventListener('change', motionChange);
    root.setAttribute('data-hero-ready', '');
    measure();
    Promise.resolve(document.fonts ? document.fonts.ready : null).then(function () {
      if (dead) return; ready = true; measure(); motionChange(); wake();
    });
    return {
      replay: function () { manual = false; elapsed = 0; polishCur = 0; lastTime = null; phase = ''; measure(); motionChange(); wake(); },
      seek: function (seconds) { manual = true; elapsed = Math.max(0, Math.min(cycleSeconds, Number(seconds) || 0));
        polishCur = clamp((elapsed - CONFIG.revealSeconds) / CONFIG.polishSeconds); paint(); },
      refresh: measure,
      destroy: function () {
        dead = true; cancelAnimationFrame(frame); if (io) io.disconnect(); if (ro) ro.disconnect();
        document.removeEventListener('visibilitychange', visibilityChange); reduced.removeEventListener('change', motionChange);
        root.innerHTML = originalHTML;
        if (originalStyle === null) root.removeAttribute('style'); else root.setAttribute('style', originalStyle);
        if (originalReady === null) root.removeAttribute('data-hero-ready'); else root.setAttribute('data-hero-ready', originalReady);
      }
    };
  }
  // Animation-only styles; all selectors are isolated from other Flow components.
  var style = document.createElement('style');
  style.id = 'marketers-hero-styles';
  style.textContent = `
[data-flow-hero="marketers"] .flow_w{transition:opacity .12s linear;}
[data-flow-hero="marketers"] .flow_w,[data-flow-hero="marketers"] .flow_pw{display:inline-block;vertical-align:baseline;will-change:transform;}
[data-flow-hero="marketers"] [data-pill]{opacity:0;transform:scaleX(0);transform-origin:center;transition:transform .3s cubic-bezier(.34,1.56,.64,1),opacity .18s ease;pointer-events:none;}
[data-flow-hero="marketers"] [data-pill].is-on{opacity:1;transform:scaleX(1);}
[data-flow-hero="marketers"] [data-pill] .pill-ch{display:inline-block;opacity:0;transform:translateY(.4em);transition:opacity .2s ease,transform .28s cubic-bezier(.34,1.56,.64,1);}
[data-flow-hero="marketers"] [data-pill].is-on .pill-ch{opacity:1;transform:none;}
[data-flow-hero="marketers"] [data-flow="pill-audio"]{transition:opacity .3s ease;}
[data-flow-hero="marketers"] [data-flow="spinner"] svg{width:100%;height:100%;display:block;}
[data-flow-hero="marketers"] [data-flow="spinner"]{color:#71716e;animation:mh-spin 1.6s linear infinite;}
[data-flow-hero="marketers"] [data-type="raw"].is-polishing .flow_w{transition:color .35s ease,opacity .12s linear;}
[data-flow-hero="marketers"] [data-pill="polishing"] .flow_pill-polish_wrap::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:2px;background:conic-gradient(from var(--mh-angle),transparent 0deg,#FF6C4C 90deg,#FFA946 170deg,#FFBCF2 250deg,#7232A6 320deg,transparent 360deg);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:mh-border 2.2s linear infinite;pointer-events:none;z-index:2;}
[data-flow-hero="marketers"] [data-pill="polishing"] .flow_pill-polish_wrap>*{position:relative;z-index:1;}
[data-flow-hero="marketers"] [data-pill="polishing"].is-done .flow_pill-polish_wrap::before{background:conic-gradient(from var(--mh-angle),#EEEBE3 0deg,#FFFFEB 120deg,#EEEBE3 240deg,#FFFFEB 360deg);}
[data-flow-hero="marketers"] [data-pill="polishing"] .flow_pill-polish_wrap>*:not(.flow_pill-dots){transition:opacity .24s ease,transform .24s ease;transform-origin:center;}
[data-flow-hero="marketers"] [data-pill="polishing"].is-done .flow_pill-polish_wrap>*:not(.flow_pill-dots){opacity:0;transform:scale(.4);}
[data-flow-hero="marketers"] [data-pill="polishing"].is-in .flow_pill-polish_wrap>*:not(.flow_pill-dots){display:none;}
[data-flow-hero="marketers"] .flow_pill-dots{display:none;align-items:center;justify-content:center;box-sizing:content-box;height:14px;padding:2px 0;gap:2px;pointer-events:none;position:relative;z-index:1;}
[data-flow-hero="marketers"] [data-pill="polishing"].is-in .flow_pill-dots{display:flex;}
[data-flow-hero="marketers"] [data-pill="polishing"].is-in .flow_pill-polish_wrap{padding:5px 15.75px;}
[data-flow-hero="marketers"] .flow_pill-dot{width:2.25px;height:2.25px;border-radius:999px;background:rgba(255,255,255,.4);opacity:0;flex:0 0 auto;transform:translateY(4px) scale(.6);transition:opacity .22s ease,transform .38s cubic-bezier(.34,1.56,.64,1);}
[data-flow-hero="marketers"] [data-pill="polishing"].is-in .flow_pill-dot{opacity:1;transform:none;}
@property --mh-angle{syntax:"<angle>";inherits:false;initial-value:0deg;}
@keyframes mh-spin{to{transform:rotate(360deg);}}
@keyframes mh-border{to{--mh-angle:360deg;}}
@media(prefers-reduced-motion:reduce){[data-flow-hero="marketers"] *,[data-flow-hero="marketers"] *::before{animation:none!important;transition:none!important;}}
`;
  document.head.appendChild(style);
  function init() {
    if (disposed) return;
    instances = Array.from(document.querySelectorAll(SELECTOR)).map(create).filter(Boolean);
  }
  window.MarketersHero = {
    replay: function () { instances.forEach(function (i) { i.replay(); }); },
    seek: function (seconds) { instances.forEach(function (i) { i.seek(seconds); }); },
    refresh: function () { instances.forEach(function (i) { i.refresh(); }); },
    destroy: function () { disposed = true; document.removeEventListener('DOMContentLoaded', init);
      instances.forEach(function (i) { i.destroy(); }); instances = []; style.remove(); }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
}());
