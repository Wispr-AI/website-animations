/* Notetaker ICP tabs — load after GSAP + ScrollTrigger, or before DOMContentLoaded.
 * Markup: [data-nt-tabs] > ... [data-nt-pin], indexed data-nt-tab/anim/text.
 * Layout is authored in Webflow. This script owns animation states only.
 */
(function () {
  'use strict';

  var CONFIG = {
    desktopMin: 992,
    stepVH: 1,
    endHoldVH: 0.35,
    waveIn: 0.9,
    waveOut: 0.4,
    meltDuration: 0.7,
    meltIntensity: 0.35,
    meltNoise: 3
  };
  var previous = window.NotetakerTabs;
  if (previous && typeof previous.destroy === 'function') previous.destroy();

  var disposed = false;
  var started = false;
  var media = null;
  var refreshFrame = 0;
  var disposers = [];

  function listen(target, type, handler, options, bag) {
    target.addEventListener(type, handler, options);
    (bag || disposers).push(function () { target.removeEventListener(type, handler, options); });
  }

  function refresh() {
    if (disposed || !started || refreshFrame) return;
    refreshFrame = requestAnimationFrame(function () {
      refreshFrame = 0;
      if (!disposed) window.ScrollTrigger.refresh();
    });
  }

  window.NotetakerTabs = {
    refresh: refresh,
    destroy: function () {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(refreshFrame);
      if (media) media.revert();
      disposers.reverse().forEach(function (fn) { fn(); });
    }
  };

  function indexed(scope, selector, attribute) {
    var elements = Array.from(scope.querySelectorAll(selector));
    var result = [];
    elements.forEach(function (element) {
      var raw = element.getAttribute(attribute);
      if (!/^(0|[1-9]\d*)$/.test(raw || '')) throw new Error('Invalid ' + attribute + ': ' + raw);
      var index = Number(raw);
      if (index >= elements.length || result[index]) throw new Error('Missing or duplicate ' + attribute + ' index');
      result[index] = element;
    });
    return result;
  }

  function installAnimationStyles() {
    var p = 'html [data-nt-tabs="icp"] [data-nt-pin] ';
    var style = document.createElement('style');
    style.id = 'nt-tabs-controller-style';
    style.textContent = '@media(min-width:992px){' +
      p + '[data-tab-anim],' + p + '[data-tab-text]{opacity:0!important;visibility:hidden!important;pointer-events:none;transition:opacity .4s ease;}' +
      p + '[data-tab-anim].is-active,' + p + '[data-tab-text].is-active{opacity:1!important;visibility:visible!important;pointer-events:auto;}' +
      p + '[data-tab-text] .meeting_tabs_heading,' + p + '[data-tab-text] .meeting_tabs_paragraph{opacity:0;transform:translateY(8px);transition:opacity .5s ease,transform .5s ease;}' +
      p + '[data-tab-text].is-active .meeting_tabs_heading{opacity:1;transform:none;transition-delay:.06s;}' +
      p + '[data-tab-text].is-active .meeting_tabs_paragraph{opacity:1;transform:none;transition-delay:.16s;}' +
      p + '[data-tab-indicator]{transition:transform .45s cubic-bezier(.22,1,.36,1),height .45s cubic-bezier(.22,1,.36,1);}' +
      p + '.meeting_tabs_item .meeting_tabs_text_wrap{transition:color .3s ease;}' +
      p + '.meeting_tabs_item.is-active .meeting_tabs_text_wrap{color:var(--dark-main);}' +
      p + '.meeting_tabs_item{cursor:pointer;}' +
      p + '.meeting_tabs_item:focus-visible{outline:2px solid currentColor;outline-offset:4px;}' +
      '}' +
      // Bridge legacy body animation CSS until its targeted cleanup.
      '@media(max-width:991px){' +
      p + '[data-tab-anim],' + p + '[data-tab-text],' + p + '.meeting_tabs_heading,' + p + '.meeting_tabs_paragraph{opacity:1!important;visibility:visible!important;transform:none!important;pointer-events:auto;transition:none!important;}}' +
      '@media(prefers-reduced-motion:reduce){' +
      p + '[data-tab-anim],' + p + '[data-tab-text],' + p + '[data-tab-indicator],' + p + '.meeting_tabs_heading,' + p + '.meeting_tabs_paragraph{transition:none!important;}}';
    document.head.appendChild(style);
    disposers.push(function () { style.remove(); });
  }

  // Original chapter-photo shader, now applied to the complete static tab images.
  // The real <img> stays underneath, including when WebGL/CORS is unavailable.
  function createMelt(stage, panels, gsap) {
    var images = panels.map(function (panel) { return panel.querySelector('.nt_tab_image'); });
    if (!stage || images.length < 2 || images.some(function (image) { return !image; })) return null;
    var canvas = document.createElement('canvas');
    canvas.className = 'nt-melt-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:0;pointer-events:none;z-index:2;';
    stage.appendChild(canvas);
    var gl;
    try { gl = canvas.getContext('webgl', { premultipliedAlpha: false, alpha: true }); } catch (error) {}
    if (!gl) { canvas.remove(); return null; }
    var dead = false, lost = false, tween = null;
    var shaders = [], textures = [], meta = [];
    var program = null, buffer = null;

        var VS = 'attribute vec2 aPos;varying vec2 vUv;void main(){vUv=aPos*0.5+0.5;gl_Position=vec4(aPos,0.,1.);}';
        var FS = [
          'precision mediump float;',
          'uniform sampler2D uFrom;uniform sampler2D uTo;',
          'uniform float uDisp;uniform float uIntensity;uniform float uNoise;',
          'uniform vec4 uCoverFrom;uniform vec4 uCoverTo;varying vec2 vUv;',
          'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}',
          'float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));vec2 u=f*f*(3.-2.*f);return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);}',
          'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*vnoise(p);p*=2.;a*=.5;}return v;}',
          'void main(){',
          ' float n=fbm(vUv*uNoise);float amt=n*uIntensity;',
          ' vec2 uF=clamp(vUv+vec2(amt*uDisp,0.0),0.,1.)*uCoverFrom.xy+uCoverFrom.zw;',
          ' vec2 uT=clamp(vUv-vec2(amt*(1.0-uDisp),0.0),0.,1.)*uCoverTo.xy+uCoverTo.zw;',
          ' gl_FragColor=mix(texture2D(uFrom,uF),texture2D(uTo,uT),uDisp);',
          '}'
        ].join('\n');


    function compile(type, source) {
      var shader = gl.createShader(type);
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      return shader;
    }
    function stop() {
      if (tween) { tween.kill(); tween = null; }
      canvas.style.opacity = '0';
      canvas.setAttribute('data-state', 'idle');
    }
    function contextLost() { lost = true; stop(); }
    canvas.addEventListener('webglcontextlost', contextLost);
    function destroy() {
      dead = true;
      stop();
      canvas.removeEventListener('webglcontextlost', contextLost);
      meta.forEach(function (m) { if (m.loader) m.loader.onload = m.loader.onerror = null; });
      textures.forEach(function (texture) { gl.deleteTexture(texture); });
      shaders.forEach(function (shader) { gl.deleteShader(shader); });
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      var lose = gl.getExtension('WEBGL_lose_context');
      if (lose && !lost) lose.loseContext();
      canvas.remove();
    }
    try {
      program = gl.createProgram();
      gl.attachShader(program, compile(gl.VERTEX_SHADER, VS));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
      var position = gl.getAttribLocation(program, 'aPos');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      var from = gl.getUniformLocation(program, 'uFrom'), to = gl.getUniformLocation(program, 'uTo');
      var displacement = gl.getUniformLocation(program, 'uDisp');
      var fromCover = gl.getUniformLocation(program, 'uCoverFrom'), toCover = gl.getUniformLocation(program, 'uCoverTo');
      gl.uniform1i(from, 0); gl.uniform1i(to, 1);
      gl.uniform1f(gl.getUniformLocation(program, 'uIntensity'), CONFIG.meltIntensity);
      gl.uniform1f(gl.getUniformLocation(program, 'uNoise'), CONFIG.meltNoise);
      meta = images.map(function () {
        var texture = gl.createTexture();
        textures.push(texture);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        return { texture: texture, width: 1, height: 1, ready: false, source: '', loader: null };
      });
    } catch (error) {
      console.warn('[notetaker-tabs] Melt unavailable; using panel fade.', error);
      destroy();
      return null;
    }
    function load(index) {
      var m = meta[index], image = images[index];
      var source = image.currentSrc || image.src;
      if (m.source === source || dead || lost) return;
      if (m.loader) m.loader.onload = m.loader.onerror = null;
      m.source = source; m.ready = false;
      var loader = m.loader = new Image();
      loader.crossOrigin = 'anonymous';
      loader.onload = function () {
        if (dead || lost || m.loader !== loader) return;
        try {
          gl.bindTexture(gl.TEXTURE_2D, m.texture);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, loader);
          m.width = loader.naturalWidth; m.height = loader.naturalHeight; m.ready = true;
        } catch (error) { m.ready = false; }
      };
      loader.onerror = function () { m.ready = false; };
      loader.src = source;
    }
    function cover(m) {
      var ca = canvas.width / canvas.height, ia = m.width / m.height;
      var sx = ia > ca ? ca / ia : 1, sy = ia > ca ? 1 : ia / ca;
      return [sx, sy, (1 - sx) / 2, (1 - sy) / 2];
    }
    function render(a, b, progress) {
      var rect = stage.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      var width = Math.max(1, Math.round(rect.width * dpr));
      var height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      gl.viewport(0, 0, width, height);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, meta[a].texture);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, meta[b].texture);
      var cf = cover(meta[a]), ct = cover(meta[b]);
      gl.uniform4fv(fromCover, cf); gl.uniform4fv(toCover, ct);
      gl.uniform1f(displacement, progress);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    images.forEach(function (_, index) { load(index); });
    canvas.setAttribute('data-state', 'idle');
    return {
      play: function (a, b) {
        stop();
        if (a < 0 || b < 0 || dead || lost) return;
        load(a); load(b);
        // Match the authored centered cover crop. Other fitting modes retain the
        // ordinary image fade rather than jumping to a different crop mid-transition.
        var compatible = [images[a], images[b]].every(function (image) {
          var css = getComputedStyle(image);
          return css.objectFit === 'cover' && css.objectPosition === '50% 50%';
        });
        if (!compatible || !meta[a].ready || !meta[b].ready) return;
        render(a, b, 0);
        canvas.style.opacity = '1';
        canvas.setAttribute('data-state', 'melting');
        var proxy = { p: 0 };
        tween = gsap.to(proxy, {
          p: 1, duration: CONFIG.meltDuration, ease: 'power1.inOut',
          onUpdate: function () { if (!dead && !lost) render(a, b, proxy.p); },
          onComplete: function () { tween = null; canvas.style.opacity = '0'; canvas.setAttribute('data-state', 'idle'); }
        });
      },
      destroy: destroy
    };
  }

  function build(root, reducedMotion) {
    var pin = root.querySelector('[data-nt-pin]');
    if (!pin) throw new Error('Missing [data-nt-pin]');
    var tabs = indexed(pin, '.meeting_tabs_item', 'data-nt-tab');
    var panels = indexed(pin, '[data-tab-anim]', 'data-tab-anim');
    var copies = indexed(pin, '[data-tab-text]', 'data-tab-text');
    if (!tabs.length || panels.length !== tabs.length || copies.length !== tabs.length) {
      throw new Error('Each tab needs one matching image panel and copy panel');
    }

    var features = indexed(pin, '[data-nt-feature]', 'data-nt-feature');
    if (features.length !== tabs.length || features.some(function (feature, i) {
      return panels[i].parentElement !== feature || copies[i].parentElement !== feature;
    })) throw new Error('Each data-nt-feature must contain its matching image and copy');

    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;
    var indicator = pin.querySelector('[data-tab-indicator]');
    var nav = pin.querySelector('.meeting_tabs_nav');
    var wrapper = pin.querySelector('.meeting_tabs_contain');
    var cleanup = [];
    var saved = [];
    var active = -1;
    var waveActive = -2;
    var alive = true;
    var trigger;
    var observer;
    var spanVH = (tabs.length - 1) * CONFIG.stepVH + CONFIG.endHoldVH;
    var groups = Array.from(pin.querySelectorAll('[data-tab-bg]')).map(function (svg) {
      return Array.from(svg.querySelectorAll('path')).map(function (path) {
        return { element: path, length: path.getTotalLength() || 1 };
      });
    });
    var paths = groups.reduce(function (all, group) {
      return all.concat(group.map(function (entry) { return entry.element; }));
    }, []);

    function preserve(element, attributes) {
      if (!element) return;
      attributes.forEach(function (name) {
        saved.push([element, name, element.getAttribute(name)]);
      });
    }
    preserve(root, ['data-nt-ready', 'data-active-tab']);
    preserve(wrapper, ['data-active-tab']);
    preserve(indicator, ['style']);
    tabs.forEach(function (tab) { preserve(tab, ['class', 'role', 'tabindex', 'aria-pressed']); });
    panels.concat(copies).forEach(function (panel) { preserve(panel, ['class', 'aria-hidden']); });
    paths.forEach(function (path) { preserve(path, ['style']); });

    // A visual-only grid overlay; content stays paired in its authored wrapper.
    var meltStage = null;
    if (!reducedMotion) {
      meltStage = document.createElement('div');
      meltStage.className = 'nt_melt_stage';
      meltStage.setAttribute('aria-hidden', 'true');
      features[0].appendChild(meltStage);
    }
    function sizeMeltStage() {
      if (!meltStage) return;
      var css = getComputedStyle(panels[0]);
      var panelRect = panels[0].getBoundingClientRect();
      var featureRect = features[0].getBoundingClientRect();
      // The overlay must not contribute intrinsic width to the feature grid.
      // A fixed-size grid child could otherwise hold tracks open after resizing.
      meltStage.style.position = 'absolute';
      meltStage.style.left = (panelRect.left - featureRect.left - features[0].clientLeft) + 'px';
      meltStage.style.top = (panelRect.top - featureRect.top - features[0].clientTop) + 'px';
      meltStage.style.width = panelRect.width + 'px';
      meltStage.style.height = panelRect.height + 'px';
      meltStage.style.borderRadius = css.borderRadius;
      meltStage.style.overflow = 'clip';
      meltStage.style.pointerEvents = 'none';
      meltStage.style.zIndex = '2';
    }
    sizeMeltStage();
    var melt = meltStage ? createMelt(meltStage, panels, gsap) : null;

    function moveIndicator() {
      if (!indicator || !nav || active < 0) return;
      var label = tabs[active].querySelector('.meeting_tabs_text_wrap') || tabs[active];
      var rect = label.getBoundingClientRect();
      var navRect = nav.getBoundingClientRect();
      indicator.style.transform = 'translateY(' + (rect.top - navRect.top - nav.clientTop) + 'px)';
      indicator.style.height = rect.height + 'px';
    }

    function drawWave(index, immediate) {
      if (waveActive === index && !immediate) return;
      waveActive = index;
      groups.forEach(function (group, i) {
        group.forEach(function (entry) {
          gsap.to(entry.element, {
            strokeDashoffset: i === index ? 0 : entry.length,
            duration: immediate || reducedMotion ? 0 : (i === index ? CONFIG.waveIn : CONFIG.waveOut),
            ease: 'power2.inOut', overwrite: true
          });
        });
      });
    }

    function select(index) {
      if (index === active) return;
      if (melt) melt.play(active, index);
      active = index;
      tabs.forEach(function (tab, i) {
        tab.classList.toggle('is-active', i === index);
        tab.setAttribute('aria-pressed', String(i === index));
      });
      [panels, copies].forEach(function (list) {
        list.forEach(function (panel, i) {
          panel.classList.toggle('is-active', i === index);
          panel.setAttribute('aria-hidden', String(i !== index));
        });
      });
      root.setAttribute('data-active-tab', String(index));
      if (wrapper) wrapper.setAttribute('data-active-tab', String(index));
      moveIndicator();
    }

    function sync(self) {
      if (!alive) return;
      var index = Math.min(tabs.length - 1, Math.max(0, Math.floor(self.progress * spanVH / CONFIG.stepVH)));
      select(index);
      // First image/copy is present on arrival; the wave draws when the pin starts.
      drawWave(self.scroll() >= self.start ? index : -1);
    }

    function jump(index) {
      if (!trigger || !alive) return;
      var begin = index * CONFIG.stepVH;
      var length = index === tabs.length - 1 ? CONFIG.endHoldVH : CONFIG.stepVH;
      var progress = (begin + length / 2) / spanVH;
      // ScrollTrigger's setter is immediate, independent of page scroll-behavior.
      trigger.scroll(trigger.start + progress * (trigger.end - trigger.start));
      ScrollTrigger.update();
      sync(trigger);
    }

    groups.forEach(function (group) {
      group.forEach(function (entry) {
        gsap.set(entry.element, { strokeDasharray: entry.length, strokeDashoffset: entry.length });
      });
    });
    root.setAttribute('data-nt-ready', '');
    select(0);
    tabs.forEach(function (tab, index) {
      tab.setAttribute('role', 'button');
      tab.setAttribute('tabindex', '0');
      listen(tab, 'click', function (event) { event.preventDefault(); jump(index); }, false, cleanup);
      listen(tab, 'keydown', function (event) {
        var target = index;
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') target = (index + 1) % tabs.length;
        else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') target = (index + tabs.length - 1) % tabs.length;
        else if (event.key === 'Home') target = 0;
        else if (event.key === 'End') target = tabs.length - 1;
        else if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        tabs[target].focus({ preventScroll: true });
        jump(target);
      }, false, cleanup);
    });

    trigger = ScrollTrigger.create({
      trigger: pin,
      pin: pin,
      start: 'top top',
      end: function () { return '+=' + window.innerHeight * spanVH; },
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: sync,
      onRefresh: function (self) { sizeMeltStage(); sync(self); moveIndicator(); },
      onEnter: sync,
      onEnterBack: sync,
      onLeave: sync,
      onLeaveBack: sync
    });
    sync(trigger);

    if (window.ResizeObserver) {
      observer = new ResizeObserver(function () { if (alive) refresh(); });
      // Observe intrinsic content, not the pin/spacer that refresh itself changes.
      [panels[0], nav].concat(copies).forEach(function (element) {
        if (element) observer.observe(element);
      });
    }
    Array.from(pin.querySelectorAll('img')).forEach(function (image) {
      if (!image.complete) {
        listen(image, 'load', refresh, { once: true }, cleanup);
        listen(image, 'error', refresh, { once: true }, cleanup);
      }
    });

    return function () {
      alive = false;
      if (observer) observer.disconnect();
      cleanup.reverse().forEach(function (fn) { fn(); });
      trigger.kill(true);
      if (melt) melt.destroy();
      if (meltStage) meltStage.remove();
      gsap.killTweensOf(paths);
      saved.reverse().forEach(function (entry) {
        if (entry[2] === null) entry[0].removeAttribute(entry[1]);
        else entry[0].setAttribute(entry[1], entry[2]);
      });
    };
  }

  function start() {
    if (disposed || started || document.documentElement.classList.contains('wf-design-mode')) return;
    if (!document.getElementById('nt-tabs-controller-style') && document.querySelector('[data-nt-tabs="icp"]')) installAnimationStyles();
    if (!window.gsap || !window.ScrollTrigger) return;
    var roots = Array.from(document.querySelectorAll('[data-nt-tabs="icp"]'));
    if (!roots.length) return;
    started = true;
    window.gsap.registerPlugin(window.ScrollTrigger);
    media = window.gsap.matchMedia();
    media.add({ desktop: '(min-width:' + CONFIG.desktopMin + 'px)', reduce: '(prefers-reduced-motion:reduce)' }, function (context) {
      if (!context.conditions.desktop) return;
      var cleanups = [];
      roots.forEach(function (root) {
        try { cleanups.push(build(root, context.conditions.reduce)); }
        catch (error) { console.error('[notetaker-tabs]', error.message, root); }
      });
      return function () { cleanups.reverse().forEach(function (fn) { fn(); }); };
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
    refresh();
  }

  listen(window, 'load', function () {
    start();
    if (!started && document.querySelector('[data-nt-tabs="icp"]')) {
      console.warn('[notetaker-tabs] GSAP and ScrollTrigger must load before this controller initializes.');
    }
    refresh();
  });
  listen(window, 'pageshow', refresh);
  if (document.readyState === 'loading') listen(document, 'DOMContentLoaded', start, { once: true });
  else start();
}());
