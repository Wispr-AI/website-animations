/* Standalone message entrance extracted from aquaNeon/wispr stack.js b0c1460.
 * Layout stays in Webflow. Replace stack.js; do not load both controllers.
 */
(function () {
  'use strict';
  if (window.NotetakerMessages) window.NotetakerMessages.destroy();
  var SELECTOR = '.hero_contain.is-green.is-message-hero';
  var cleanups = [], started = false, dead = false;

  function saveStyle(el) {
    var original = el.getAttribute('style');
    return function () {
      if (original === null) el.removeAttribute('style');
      else el.setAttribute('style', original);
    };
  }

  function messages(root) {
    var rows = Array.from(root.querySelectorAll('.meeting_items > [data-stack="item"]'));
    if (!rows.length) return function () {};
    rows.sort(function (a, b) {
      var x = parseFloat(a.getAttribute('data-stack-order'));
      var y = parseFloat(b.getAttribute('data-stack-order'));
      return (isNaN(x) ? Infinity : x) - (isNaN(y) ? Infinity : y);
    });
    var restore = [], words = [], calls = [], ripples = [];
    var opacity = rows.map(function (row) { return parseFloat(getComputedStyle(row).opacity); });
    var checks = rows.map(function (row) { return row.querySelector('.meeting_check'); }).filter(Boolean);
    rows.concat(checks).forEach(function (el) { restore.push(saveStyle(el)); });
    rows.forEach(function (row, slot) {
      row.querySelectorAll('.meeting_item_animate').forEach(function (el) {
        // Save actual nodes so teardown preserves authored markup and listeners.
        var original = Array.from(el.childNodes), letters = [];
        var color = getComputedStyle(el).color;
        Array.from(el.textContent).forEach(function (char) {
          var span = document.createElement('span');
          span.textContent = char;
          span.style.cssText = 'display:inline-block;white-space:pre;';
          letters.push(span);
        });
        el.replaceChildren.apply(el, letters);
        words.push({ el: el, letters: letters, color: color, slot: slot });
        restore.push(function () { el.replaceChildren.apply(el, original); });
      });
    });
    function paint(word, on) {
      var rect = word.el.getBoundingClientRect();
      word.letters.forEach(function (letter) {
        if (on) {
          letter.style.backgroundImage = 'linear-gradient(100deg,#8E948C 0%,#C9CEC4 26%,#FFFFFF 48%,#EFF2EA 62%,#9AA096 100%)';
          letter.style.backgroundSize = (rect.width || 1) + 'px 100%';
          letter.style.backgroundRepeat = 'no-repeat';
          letter.style.backgroundPosition = -(letter.getBoundingClientRect().left - rect.left) + 'px 0';
          letter.style.backgroundClip = 'text';
          letter.style.webkitBackgroundClip = 'text';
        }
        var duration = on ? 350 : 600;
        letter.style.transition = 'color ' + duration + 'ms ease,text-shadow ' + duration + 'ms ease';
        letter.style.textShadow = on ? '0 0 6px rgba(255,255,255,.45)' : '';
        letter.style.color = on ? 'transparent' : word.color;
      });
    }
    function cancelEffects() {
      calls.forEach(function (call) { call.kill(); }); calls = [];
      ripples.forEach(function (animation) { animation.cancel(); }); ripples = [];
      words.forEach(function (word) { paint(word, false); });
    }
    function detect() {
      cancelEffects();
      words.forEach(function (word) {
        // Preserve the original per-word timing, including the first three simultaneous pops.
        calls.push(gsap.delayedCall(0.22 + word.slot * 0.28, function () {
          paint(word, true);
          word.letters.forEach(function (letter, i) {
            if (!letter.animate) return;
            ripples.push(letter.animate([
              { transform: 'translateY(0%) rotate(0deg)' },
              { transform: 'translateY(-20%) rotate(-5deg)', offset: 0.5 },
              { transform: 'translateY(0%) rotate(0deg)' }
            ], { duration: 500, delay: i * 45, easing: 'linear' }));
          });
          calls.push(gsap.delayedCall(1.45, function () { paint(word, false); }));
        }));
      });
    }
    function stagger(i) { return i < 3 ? 0 : (i - 2) * 0.28; }
    gsap.set(rows, { opacity: 0, scaleX: 0.35, scaleY: 0.85, transformOrigin: '50% 50%' });
    gsap.set(checks, { scale: 0, opacity: 0, transformOrigin: '50% 50%' });
    var tl = gsap.timeline({ paused: true });
    tl.to(rows, { opacity: function (i) { return opacity[i]; }, scaleX: 1, scaleY: 1,
      duration: 0.5, ease: 'back.out(2)', stagger: stagger }, 0);
    tl.to(checks, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.4)', stagger: stagger }, 0.18);
    var playing = false;
    function enter() { if (!playing) { playing = true; tl.play(); detect(); } }
    function leaveBack() { if (playing) { playing = false; tl.reverse(); cancelEffects(); } }
    var trigger = ScrollTrigger.create({
      trigger: root, start: 'top 60%', end: 'bottom top',
      onEnter: enter, onLeaveBack: leaveBack
    });
    // Covers a restored scroll position already beyond the entrance threshold.
    if (window.scrollY >= trigger.start) enter();
    return function () {
      trigger.kill(); tl.kill(); cancelEffects();
      restore.reverse().forEach(function (fn) { fn(); });
    };
  }

  function corners() {
    var entries = [], frame = 0, last = 0;
    var previousCorners = window.Corners;
    function scan() {
      document.querySelectorAll('[data-corners]').forEach(function (el) {
        if (entries.some(function (entry) { return entry.el === el; })) return;
        var properties = ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius'];
        var saved = properties.map(function (p) { return [p, el.style.getPropertyValue(p), el.style.getPropertyPriority(p)]; });
        entries.push({ el: el, top: -1, bottom: -1, restore: function () {
          saved.forEach(function (s) { if (s[1]) el.style.setProperty(s[0], s[1], s[2]); else el.style.removeProperty(s[0]); });
        } });
      });
    }
    function tick(now) {
      var dt = last ? Math.min((now - last) / (1000 / 60), 4) : 1;
      last = now;
      var k = 1 - Math.pow(0.84, dt);
      entries.forEach(function (entry) {
        var el = entry.el, r = el.getBoundingClientRect();
        if (!el.isConnected || (!r.width && !r.height)) return;
        var max = parseFloat(el.getAttribute('data-corners')) || 80;
        // Original green-panel responsive maximum; phones remain authored/static.
        if (el.matches(SELECTOR) && innerWidth < 768) return;
        var top = Math.max(0, Math.min(max, r.top));
        var bottom = Math.max(0, Math.min(max, innerHeight - r.bottom));
        entry.top = entry.top < 0 ? top : entry.top + (top - entry.top) * k;
        entry.bottom = entry.bottom < 0 ? bottom : entry.bottom + (bottom - entry.bottom) * k;
        if (Math.abs(entry.top - top) < 0.1) entry.top = top;
        if (Math.abs(entry.bottom - bottom) < 0.1) entry.bottom = bottom;
        ['left', 'right'].forEach(function (side) {
          el.style.setProperty('border-top-' + side + '-radius', entry.top + 'px', 'important');
          el.style.setProperty('border-bottom-' + side + '-radius', entry.bottom + 'px', 'important');
        });
      });
      frame = requestAnimationFrame(tick);
    }
    function resized() {
      entries.forEach(function (entry) {
        if (entry.el.matches(SELECTOR) && innerWidth < 768) entry.restore();
        entry.top = entry.bottom = -1;
      });
    }
    scan(); frame = requestAnimationFrame(tick);
    var api = { scan: scan };
    window.Corners = api;
    window.addEventListener('resize', resized);
    window.addEventListener('load', scan);
    return function () {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resized); window.removeEventListener('load', scan);
      entries.forEach(function (entry) { entry.restore(); });
      if (window.Corners === api) {
        if (previousCorners === undefined) delete window.Corners;
        else window.Corners = previousCorners;
      }
    };
  }

  function refresh() { if (started && !dead) ScrollTrigger.refresh(); }
  function start() {
    if (started || dead || !window.gsap || !window.ScrollTrigger) return;
    started = true; gsap.registerPlugin(ScrollTrigger);
    var mm = gsap.matchMedia();
    mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', function () {
      var dispose = Array.from(document.querySelectorAll(SELECTOR)).map(messages);
      return function () { dispose.forEach(function (fn) { fn(); }); };
    });
    mm.add('(prefers-reduced-motion: no-preference)', corners);
    cleanups.push(function () { mm.revert(); });
    if (document.fonts) document.fonts.ready.then(refresh);
    refresh();
  }
  function loaded() { start(); refresh(); }
  function destroy() {
    dead = true;
    document.removeEventListener('DOMContentLoaded', start);
    window.removeEventListener('load', loaded);
    cleanups.reverse().forEach(function (fn) { fn(); });
    cleanups = [];
  }
  window.NotetakerMessages = { refresh: refresh, destroy: destroy };
  document.addEventListener('DOMContentLoaded', start, { once: true });
  window.addEventListener('load', loaded, { once: true });
  if (document.readyState !== 'loading') start();
}());
