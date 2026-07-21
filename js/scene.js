import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.136.0/build/three.module.js";

export function initPremiumScene() {
  const container = document.getElementById("webgl-container");
  if (!container) return;

  // ==========================================
  // 1. Scene & Camera Setup
  // ==========================================
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050507, 0.015); // Fixed dark fog

  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    500,
  );
  camera.position.set(0, 15, 60);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  // ==========================================
  // 2. The Monolith City
  // ==========================================
  const monolithCount = 500;
  const geometry = new THREE.BoxGeometry(1, 1, 1);

  const material = new THREE.MeshStandardMaterial({
    color: 0x111115, // Fixed dark material
    metalness: 0.8,
    roughness: 0.2,
  });

  const instancedMesh = new THREE.InstancedMesh(
    geometry,
    material,
    monolithCount,
  );
  scene.add(instancedMesh);

  const dummy = new THREE.Object3D();

  for (let i = 0; i < monolithCount; i++) {
    const radius = Math.random() * 80 + 10;
    const angle = Math.random() * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const height = Math.pow(Math.random(), 2) * 35 + 5;
    const y = height / 2 - 10;

    dummy.position.set(x, y, z);
    const width = Math.random() * 1.5 + 0.5;
    const depth = Math.random() * 1.5 + 0.5;
    dummy.scale.set(width, height, depth);
    dummy.rotation.y = -angle;

    dummy.updateMatrix();
    instancedMesh.setMatrixAt(i, dummy.matrix);
  }
  instancedMesh.instanceMatrix.needsUpdate = true;

  // ==========================================
  // 3. Cinematic Lighting
  // ==========================================
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 2);
  mainLight.position.set(50, 50, -50);
  scene.add(mainLight);

  const blueLight = new THREE.DirectionalLight(0x0055ff, 2);
  blueLight.position.set(-50, -20, 50);
  scene.add(blueLight);

  const coreLight = new THREE.PointLight(0xff4a00, 10, 100);
  coreLight.position.set(0, 0, 0);
  scene.add(coreLight);

  // ==========================================
  // 4. Advanced Interaction (Hover Color)
  // ==========================================
  const defaultColor = new THREE.Color(0xff4a00);

  window.addEventListener("projectHover", (e) => {
    const targetColor = new THREE.Color(e.detail.color);
    if (window.gsap) {
      window.gsap.to(coreLight.color, {
        r: targetColor.r,
        g: targetColor.g,
        b: targetColor.b,
        duration: 0.5,
      });
      window.gsap.to(coreLight, { intensity: 20, duration: 0.5 });
    }
  });

  window.addEventListener("projectLeave", () => {
    if (window.gsap) {
      window.gsap.to(coreLight.color, {
        r: defaultColor.r,
        g: defaultColor.g,
        b: defaultColor.b,
        duration: 1.0,
      });
    }
  });

  // ==========================================
  // 5. Parallax Movement
  // ==========================================
  let mouseX = 0,
    mouseY = 0,
    gyroX = 0,
    gyroY = 0;
  let windowHalfX = window.innerWidth / 2;
  let windowHalfY = window.innerHeight / 2;

  document.addEventListener("mousemove", (e) => {
    mouseX = (e.clientX - windowHalfX) / windowHalfX;
    mouseY = (e.clientY - windowHalfY) / windowHalfY;
  });

  document.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length > 0) {
        mouseX = (e.touches[0].pageX - windowHalfX) / windowHalfX;
        mouseY = (e.touches[0].pageY - windowHalfY) / windowHalfY;
      }
    },
    { passive: true },
  );

  window.addEventListener("deviceorientation", (e) => {
    if (e.gamma !== null && e.beta !== null) {
      gyroX = Math.max(-45, Math.min(45, e.gamma)) / 45;
      gyroY = Math.max(-45, Math.min(45, e.beta - 45)) / 45;
    }
  });

  window.addEventListener("resize", () => {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    instancedMesh.rotation.y = time * 0.02;
    coreLight.intensity = 8 + Math.sin(time * 2) * 2;

    const targetCamX = mouseX * 20 + gyroX * 20;
    const targetCamY = 15 + -mouseY * 10 + -gyroY * 10;

    camera.position.x += (targetCamX - camera.position.x) * 0.02;
    camera.position.y += (targetCamY - camera.position.y) * 0.02;

    camera.lookAt(0, 5, 0);
    renderer.render(scene, camera);
  }

  animate();
}
