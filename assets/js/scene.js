import * as THREE from '../vendor/three.module.js';
import { createPavilion, createBlueprint } from './pavilion.js';

const host = document.querySelector('#model-view');
const slider = document.querySelector('#model-explode');
const reset = document.querySelector('.model-reset');
if (host) {
  let renderer,
    frame = 0,
    visible = false,
    paused = document.documentElement.classList.contains('motion-paused'),
    disposed = false;
  const scene = new THREE.Scene();
  const groups = [];
  const solids = [];
  let observer, resizeObserver;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'low-power',
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute(
      'aria-label',
      'Interactive architectural pavilion. Drag to orbit, use arrow keys to rotate, plus and minus to zoom, or select a surface to learn its material.',
    );
    renderer.domElement.setAttribute('role', 'img');
    renderer.domElement.tabIndex = 0;
    host.appendChild(renderer.domElement);
    const camera = new THREE.OrthographicCamera(-9, 9, 7, -7, 0.1, 100);
    camera.position.set(13, 11, 16);
    camera.lookAt(0, 2, 0);
    scene.add(new THREE.HemisphereLight(0xfff9eb, 0x7b8369, 2.6));
    const sun = new THREE.DirectionalLight(0xfff8e9, 3.2);
    sun.position.set(-9, 17, 9);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, {
      left: -12,
      right: 12,
      top: 12,
      bottom: -12,
      near: 0.1,
      far: 50,
    });
    sun.shadow.normalBias = 0.03;
    scene.add(sun);
    const pavilion = createPavilion(),
      model = pavilion.model;
    model.rotation.y = -0.3;
    scene.add(model);
    groups.push(...pavilion.groups);
    solids.push(...pavilion.solids);
    const drawing = createBlueprint();
    drawing.group.position.y = 0.25;
    drawing.group.visible = false;
    model.add(drawing.group);
    const cutaway = document.querySelector('[data-model-cutaway]'),
      dimensions = document.querySelector('[data-model-dimensions]');
    cutaway?.addEventListener('click', () => {
      const off = cutaway.getAttribute('aria-pressed') !== 'true';
      cutaway.setAttribute('aria-pressed', String(off));
      groups.filter((g) => g.userData.stage >= 0.68).forEach((g) => (g.visible = !off));
      draw(true);
    });
    dimensions?.addEventListener('click', () => {
      drawing.group.visible = !drawing.group.visible;
      dimensions.setAttribute('aria-pressed', String(drawing.group.visible));
      draw(true);
    });
    const grid = new THREE.GridHelper(24, 24, 0xaeb5a1, 0xc4cbbb);
    grid.position.y = -0.27;
    grid.material.transparent = true;
    grid.material.opacity = 0.28;
    scene.add(grid);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.ShadowMaterial({ opacity: 0.13 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.26;
    floor.receiveShadow = true;
    scene.add(floor);
    let targetExplode = Number(slider.value) / 100,
      currentExplode = targetExplode,
      targetRotation = -0.3,
      dragging = false,
      lastX = 0,
      lastY = 0,
      manual = false;
    let targetElevation = 0.47,
      elevation = 0.47,
      zoom = 1,
      targetZoom = 1,
      autoRotate = false,
      wireframe = false,
      downX = 0,
      downY = 0,
      lastFrame = 0,
      contextLost = false;
    let selected = null,
      originalMaterial = null;
    const raycaster = new THREE.Raycaster(),
      mouse = new THREE.Vector2();
    const selection = document.querySelector('#model-selection'),
      zoomInput = document.querySelector('#model-zoom');
    const viewButtons = [...document.querySelectorAll('[data-model-view]')],
      wireButton = document.querySelector('[data-model-wireframe]'),
      rotateButton = document.querySelector('[data-model-rotate]'),
      touchButton = document.querySelector('[data-model-touch]');
    function resize() {
      const w = host.clientWidth,
        h = host.clientHeight;
      if (!w || !h) return;
      const aspect = w / h,
        size = Math.max(8.9, 9.2 / aspect);
      camera.left = -size * aspect;
      camera.right = size * aspect;
      camera.top = size;
      camera.bottom = -size;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      draw(true);
    }
    function draw(immediate = false) {
      if (disposed || contextLost) return;
      const blend = immediate ? 1 : 0.095;
      currentExplode = THREE.MathUtils.lerp(currentExplode, targetExplode, blend);
      model.rotation.y = THREE.MathUtils.lerp(model.rotation.y, targetRotation, blend);
      elevation = THREE.MathUtils.lerp(elevation, targetElevation, blend);
      zoom = THREE.MathUtils.lerp(zoom, targetZoom, blend);
      camera.position.set(
        Math.cos(elevation) * 13,
        2.1 + Math.sin(elevation) * 22,
        Math.cos(elevation) * 16,
      );
      camera.lookAt(0, 2.1, 0);
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
      groups.forEach((g) => {
        g.position.y = g.userData.offset * currentExplode;
      });
      renderer.render(scene, camera);
    }
    function unsettled() {
      return (
        Math.abs(currentExplode - targetExplode) +
          Math.abs(model.rotation.y - targetRotation) +
          Math.abs(elevation - targetElevation) +
          Math.abs(zoom - targetZoom) >
        0.0003
      );
    }
    function tick(now) {
      frame = 0;
      if (!visible || paused || document.hidden || disposed || contextLost) return;
      const delta = Math.min((now - lastFrame) / 1000, 0.04);
      lastFrame = now;
      if (autoRotate && !dragging) targetRotation += delta * 0.18;
      draw();
      if (unsettled() || autoRotate) frame = requestAnimationFrame(tick);
    }
    function schedule() {
      if (contextLost) return;
      if (!frame && visible && !paused && !document.hidden && !disposed) {
        lastFrame = performance.now();
        frame = requestAnimationFrame(tick);
      } else if (paused) draw(true);
    }
    function stopRotation() {
      autoRotate = false;
      rotateButton?.setAttribute('aria-pressed', 'false');
      if (rotateButton) rotateButton.textContent = 'Auto rotate';
    }
    function clearSelection() {
      if (selected) {
        selected.material.dispose();
        selected.material = originalMaterial;
        selected = null;
        originalMaterial = null;
      }
    }
    function selectSurface(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(mouse, camera);
      const available = solids.filter((mesh) => {
        for (let item = mesh; item; item = item.parent) if (!item.visible) return false;
        return true;
      });
      const hit = raycaster.intersectObjects(available, false)[0];
      clearSelection();
      if (hit) {
        selected = hit.object;
        originalMaterial = selected.material;
        selected.material = originalMaterial.clone();
        selected.material.emissive?.setHex(0xed663f);
        selected.material.emissiveIntensity = 0.2;
        if (selection) selection.textContent = selected.userData.label || 'Landscape and planting';
      } else if (selection) selection.textContent = 'Select a surface to explore its material.';
      draw(true);
    }
    slider.addEventListener('input', () => {
      manual = true;
      targetExplode = Number(slider.value) / 100;
      schedule();
    });
    zoomInput?.addEventListener('input', () => {
      targetZoom = Number(zoomInput.value) / 100;
      schedule();
    });
    host.addEventListener('pointerdown', (e) => {
      if (
        e.target !== renderer.domElement ||
        (e.pointerType === 'touch' && !host.classList.contains('touch-interactive'))
      )
        return;
      dragging = true;
      manual = true;
      stopRotation();
      downX = lastX = e.clientX;
      downY = lastY = e.clientY;
      host.setPointerCapture(e.pointerId);
    });
    host.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      targetRotation += (e.clientX - lastX) * 0.008;
      targetElevation = THREE.MathUtils.clamp(
        targetElevation + (e.clientY - lastY) * 0.004,
        0.12,
        1.5,
      );
      lastX = e.clientX;
      lastY = e.clientY;
      viewButtons.forEach((b) => b.setAttribute('aria-pressed', 'false'));
      schedule();
    });
    host.addEventListener('pointerup', (e) => {
      if (dragging && Math.hypot(e.clientX - downX, e.clientY - downY) < 5) selectSurface(e);
      dragging = false;
      if (host.hasPointerCapture(e.pointerId)) host.releasePointerCapture(e.pointerId);
    });
    host.addEventListener('pointercancel', () => {
      dragging = false;
    });
    host.addEventListener('lostpointercapture', () => {
      dragging = false;
    });
    renderer.domElement.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-'].includes(e.key))
        return;
      e.preventDefault();
      manual = true;
      stopRotation();
      if (e.key === 'ArrowLeft') targetRotation -= 0.12;
      if (e.key === 'ArrowRight') targetRotation += 0.12;
      if (e.key === 'ArrowUp') targetElevation = Math.min(1.5, targetElevation + 0.07);
      if (e.key === 'ArrowDown') targetElevation = Math.max(0.12, targetElevation - 0.07);
      if (e.key === '+' || e.key === '=') targetZoom = Math.min(1.5, targetZoom + 0.1);
      if (e.key === '-') targetZoom = Math.max(0.7, targetZoom - 0.1);
      if (zoomInput) zoomInput.value = Math.round(targetZoom * 100);
      schedule();
    });
    viewButtons.forEach((button) =>
      button.addEventListener('click', () => {
        manual = true;
        stopRotation();
        viewButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
        targetRotation = button.dataset.modelView === 'plan' ? 0 : -0.3;
        targetElevation = button.dataset.modelView === 'plan' ? 1.5 : 0.47;
        schedule();
      }),
    );
    wireButton?.addEventListener('click', () => {
      clearSelection();
      wireframe = !wireframe;
      new Set(solids.map((mesh) => mesh.material)).forEach((mat) => {
        mat.wireframe = wireframe;
      });
      wireButton.setAttribute('aria-pressed', String(wireframe));
      draw(true);
    });
    rotateButton?.addEventListener('click', () => {
      manual = true;
      autoRotate = !autoRotate;
      rotateButton.setAttribute('aria-pressed', String(autoRotate));
      rotateButton.textContent = autoRotate ? 'Stop rotation' : 'Auto rotate';
      if (paused && autoRotate) {
        targetRotation += 0.4;
      }
      schedule();
    });
    touchButton?.addEventListener('click', () => {
      const active = host.classList.toggle('touch-interactive');
      touchButton.setAttribute('aria-pressed', String(active));
      touchButton.textContent = active ? 'Done exploring' : 'Touch to orbit';
    });
    reset.hidden = false;
    reset.addEventListener('click', () => {
      manual = true;
      stopRotation();
      clearSelection();
      groups.forEach((g) => (g.visible = true));
      drawing.group.visible = false;
      cutaway?.setAttribute('aria-pressed', 'false');
      dimensions?.setAttribute('aria-pressed', 'false');
      targetExplode = 0.2;
      targetRotation = -0.3;
      targetElevation = 0.47;
      targetZoom = 1;
      slider.value = 20;
      if (zoomInput) zoomInput.value = 100;
      wireframe = false;
      new Set(solids.map((mesh) => mesh.material)).forEach((mat) => (mat.wireframe = false));
      wireButton?.setAttribute('aria-pressed', 'false');
      viewButtons.forEach((b) =>
        b.setAttribute('aria-pressed', String(b.dataset.modelView === 'perspective')),
      );
      if (selection) selection.textContent = 'Select a surface to explore its material.';
      schedule();
    });
    function onScroll() {
      if (manual || paused || !visible) return;
      const r = host.getBoundingClientRect();
      targetExplode = THREE.MathUtils.clamp(
        (innerHeight * 0.72 - r.top) / (innerHeight * 0.9),
        0.05,
        0.88,
      );
      slider.value = Math.round(targetExplode * 100);
      schedule();
    }
    addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('insight:motion', (e) => {
      paused = e.detail.paused;
      if (paused) {
        stopRotation();
        cancelAnimationFrame(frame);
        frame = 0;
        draw(true);
      } else schedule();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else schedule();
    });
    observer = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        if (visible) {
          onScroll();
          schedule();
        } else {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      },
      { rootMargin: '120px' },
    );
    observer.observe(host);
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();
    host.classList.add('is-ready');
    renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      contextLost = true;
      cancelAnimationFrame(frame);
      frame = 0;
      host.classList.remove('is-ready');
      renderer.domElement.hidden = true;
      if (selection)
        selection.textContent = '3D is temporarily unavailable. Showing the architectural drawing.';
    });
    renderer.domElement.addEventListener('webglcontextrestored', () => {
      contextLost = false;
      renderer.domElement.hidden = false;
      host.classList.add('is-ready');
      if (selection) selection.textContent = 'Select a surface to explore its material.';
      resize();
      schedule();
    });
    addEventListener(
      'pagehide',
      (e) => {
        if (e.persisted) return;
        disposed = true;
        cancelAnimationFrame(frame);
        observer.disconnect();
        resizeObserver.disconnect();
        scene.traverse((o) => {
          o.geometry?.dispose();
          if (o.material) {
            const materials = Array.isArray(o.material) ? o.material : [o.material];
            materials.forEach((m) => m.dispose());
          }
        });
        renderer.dispose();
      },
      { once: true },
    );
  } catch (error) {
    renderer?.dispose();
    renderer?.domElement.remove();
    host.classList.remove('is-ready');
    slider.disabled = true;
    reset.hidden = true;
    document.querySelectorAll('.model-toolbar button,#model-zoom').forEach((control) => {
      control.disabled = true;
    });
    const status = document.querySelector('#model-selection');
    if (status)
      status.textContent =
        '3D is unavailable in this browser. The architectural drawing remains available.';
    const instructions = document.querySelector('.model-instruction');
    if (instructions) instructions.textContent = 'Architectural model study · Static view';
    console.info('The architectural study is displayed in its static view.');
  }
}
