import * as THREE from '../vendor/three.module.js';

const host = document.querySelector('#hero-world'),
  hero = document.querySelector('#spatial-hero');
if (host && hero) {
  hero.tabIndex = 0;
  hero.setAttribute('aria-describedby', 'blueprint-hint');
  hero.setAttribute('aria-keyshortcuts', 'Space Enter');
  let fullBlueprint = false;
  let renderer,
    material,
    geometry,
    resizeObserver,
    observer,
    frame = 0,
    visible = true,
    held = false,
    activePointer = null,
    disposed = false,
    failed = false,
    contextLost = false;
  let paused =
    document.documentElement.classList.contains('motion-paused') ||
    matchMedia('(prefers-reduced-motion:reduce)').matches;
  const pointer = new THREE.Vector2(0.5, 0.5),
    target = new THREE.Vector2(0.5, 0.5);
  const uniforms = {
    uTexture: { value: null },
    uDraft: { value: null },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uImage: { value: new THREE.Vector2(1672, 941) },
    uPointer: { value: pointer },
    uReveal: { value: 0 },
    uMode: { value: 0 },
  };
  function setHeld(value) {
    held = value;
    hero.classList.toggle('is-blueprint-held', value);
    schedule();
  }
  function release() {
    setHeld(false);
    if (activePointer !== null && hero.hasPointerCapture(activePointer))
      hero.releasePointerCapture(activePointer);
    activePointer = null;
  }
  function locate(e) {
    const r = hero.getBoundingClientRect();
    target.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
    host.style.setProperty('--cad-x', `${e.clientX - r.left}px`);
    host.style.setProperty('--cad-y', `${e.clientY - r.top}px`);
  }
  hero.addEventListener('pointerdown', (e) => {
    if (
      e.button !== 0 ||
      !e.isPrimary ||
      e.target.closest('a,input,select,textarea') ||
      e.target.closest('button:not(.blueprint-hold)')
    )
      return;
    locate(e);
    activePointer = e.pointerId;
    hero.setPointerCapture(e.pointerId);
    setHeld(true);
  });
  hero.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType === 'mouse' || held) {
        locate(e);
        schedule();
      }
    },
    { passive: true },
  );
  hero.addEventListener('pointerleave', () => {
    target.set(0.5, 0.5);
    if (!hero.hasPointerCapture(activePointer ?? -1)) release();
    schedule();
  });
  hero.addEventListener('lostpointercapture', () => {
    activePointer = null;
    setHeld(false);
  });
  addEventListener('pointerup', release);
  addEventListener('pointercancel', release);
  addEventListener('blur', release);
  hero.addEventListener('contextmenu', (e) => {
    if (held) e.preventDefault();
  });
  hero.addEventListener('keydown', (e) => {
    if (e.target !== hero) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      target.set(0.5, 0.5);
      host.style.setProperty('--cad-x', '50%');
      host.style.setProperty('--cad-y', '50%');
      setHeld(true);
    }
    if (e.key === 'Escape') release();
  });
  hero.addEventListener('keyup', (e) => {
    if (e.target === hero && (e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault();
      release();
    }
  });
  hero.addEventListener('blur', release);
  hero.querySelectorAll('[data-world-mode]').forEach((button) =>
    button.addEventListener('click', () => {
      release();
      fullBlueprint = button.dataset.worldMode === '1';
      hero.classList.toggle('is-blueprint-full', fullBlueprint);
      hero.dataset.view = fullBlueprint ? 'structure' : 'atmosphere';
      hero.querySelectorAll('[data-world-mode]').forEach((item) => {
        const selected = item === button;
        item.classList.toggle('is-active', selected);
        item.setAttribute('aria-pressed', String(selected));
      });
      hero.querySelector('#blueprint-hint').textContent = fullBlueprint
        ? 'Full architectural drawing. Select Normal to explore with the pointer.'
        : 'Hold & move on the image to uncover the drawing.';
      schedule();
    }),
  );
  const scene = new THREE.Scene(),
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  function fallback() {
    failed = true;
    cancelAnimationFrame(frame);
    frame = 0;
    if (renderer) renderer.domElement.style.opacity = '0';
    host.classList.remove('is-cad-ready');
    host.querySelector('.world-poster')?.classList.remove('world-under-canvas');
  }
  function draw(immediate = false) {
    if (disposed || failed || contextLost || !uniforms.uTexture.value || !uniforms.uDraft.value)
      return;
    const blend = immediate ? 1 : 0.115;
    pointer.lerp(target, blend);
    uniforms.uReveal.value = THREE.MathUtils.lerp(uniforms.uReveal.value, held ? 1 : 0, blend);
    uniforms.uMode.value = THREE.MathUtils.lerp(uniforms.uMode.value, fullBlueprint ? 1 : 0, blend);
    renderer.render(scene, camera);
  }
  function loop() {
    frame = 0;
    if (!visible || document.hidden || disposed || failed || contextLost) return;
    draw(paused);
    if (
      !paused &&
      pointer.distanceTo(target) +
        Math.abs(uniforms.uReveal.value - (held ? 1 : 0)) +
        Math.abs(uniforms.uMode.value - (fullBlueprint ? 1 : 0)) >
        0.001
    )
      frame = requestAnimationFrame(loop);
  }
  function schedule() {
    if (!renderer || failed || contextLost || disposed) return;
    if (paused) {
      draw(true);
      return;
    }
    if (!frame && visible && !document.hidden) frame = requestAnimationFrame(loop);
  }
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: 'low-power',
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setClearColor(0x141713, 0);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.style.opacity = '0';
    host.prepend(renderer.domElement);
    renderer.debug.onShaderError = fallback;
    material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
      fragmentShader: `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uTexture,uDraft;
      uniform vec2 uResolution,uImage,uPointer;
      uniform float uReveal,uMode;
      vec2 cover(vec2 uv){float a=uResolution.x/uResolution.y,b=uImage.x/uImage.y;return (uv-.5)*vec2(min(a/b,1.),min(b/a,1.))+.5;}
      float inkLuma(vec2 uv){return dot(texture2D(uTexture,uv).rgb,vec3(.299,.587,.114));}
      float draftingGrid(vec2 uv,float size){vec2 cell=uv*uResolution/size;vec2 edge=abs(fract(cell-.5)-.5)/max(fwidth(cell),vec2(.001));return 1.-min(min(edge.x,edge.y),1.);}
      void main(){
        vec2 uv=cover((vUv-.5)*.972+.5+(uPointer-.5)*.013);
        vec3 photo=texture2D(uTexture,uv).rgb;
        vec2 p=vec2(1.35)/uImage;
        float tl=inkLuma(uv+vec2(-p.x,p.y)),tc=inkLuma(uv+vec2(0.,p.y)),tr=inkLuma(uv+p);
        float ml=inkLuma(uv-vec2(p.x,0.)),mr=inkLuma(uv+vec2(p.x,0.));
        float bl=inkLuma(uv-p),bc=inkLuma(uv-vec2(0.,p.y)),br=inkLuma(uv+vec2(p.x,-p.y));
        float gx=-tl-2.*ml-bl+tr+2.*mr+br,gy=tl+2.*tc+tr-bl-2.*bc-br;
        float lines=smoothstep(.09,.56,length(vec2(gx,gy)));
        float contour=smoothstep(.08,.34,abs(inkLuma(uv-p*3.)-inkLuma(uv+p*3.)));
        float grid=draftingGrid(vUv,26.)*.016+draftingGrid(vUv,130.)*.028;
        vec3 cad=vec3(.014,.035,.045)+vec3(.48,.69,.71)*max(lines,contour*.48)+grid*vec3(.55,.8,.85);
        vec4 notes=texture2D(uDraft,uv);
        cad=mix(cad,notes.rgb,notes.a*.92);
        float radius=min(245.,min(uResolution.x,uResolution.y)*.32);
        float distanceToPointer=length((vUv-uPointer)*uResolution);
        float lens=(1.-smoothstep(radius-18.,radius+10.,distanceToPointer))*uReveal;
        float vignette=1.-.23*length((vUv-.5)*vec2(1.,.7));
        gl_FragColor=vec4(mix(photo*.87,cad,max(lens,uMode))*vignette,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    });
    geometry = new THREE.PlaneGeometry(2, 2);
    scene.add(new THREE.Mesh(geometry, material));
    function resize() {
      const w = host.clientWidth,
        h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      uniforms.uResolution.value.set(w, h);
      draw(true);
    }
    function ready() {
      if (!uniforms.uTexture.value || !uniforms.uDraft.value) return;
      resize();
      if (!failed) {
        renderer.domElement.style.opacity = '1';
        host.classList.add('is-cad-ready');
        host.querySelector('.world-poster')?.classList.add('world-under-canvas');
        schedule();
      }
    }
    const loader = new THREE.TextureLoader();
    loader.load(
      'assets/images/courtyard.webp',
      (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        uniforms.uTexture.value = texture;
        ready();
      },
      undefined,
      fallback,
    );
    loader.load(
      'assets/images/courtyard-drawing.svg',
      (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        uniforms.uDraft.value = texture;
        ready();
      },
      undefined,
      fallback,
    );
    observer = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible) schedule();
      else {
        release();
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    observer.observe(hero);
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      contextLost = true;
      fallback();
    });
    renderer.domElement.addEventListener('webglcontextrestored', () => {
      contextLost = false;
      failed = false;
      ready();
    });
  } catch {
    fallback();
    renderer?.dispose();
    renderer?.domElement.remove();
  }
  document.addEventListener('insight:motion', (e) => {
    paused = e.detail.paused;
    cancelAnimationFrame(frame);
    frame = 0;
    target.set(0.5, 0.5);
    schedule();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      release();
      cancelAnimationFrame(frame);
      frame = 0;
    } else schedule();
  });
  addEventListener(
    'pagehide',
    (e) => {
      release();
      if (e.persisted) return;
      disposed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      resizeObserver?.disconnect();
      uniforms.uTexture.value?.dispose();
      uniforms.uDraft.value?.dispose();
      material?.dispose();
      geometry?.dispose();
      renderer?.dispose();
    },
    { once: true },
  );
}
