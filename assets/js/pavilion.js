import * as THREE from '../vendor/three.module.js';

// One authored courtyard study, shared by the film and the explorable maquette.
export function createPavilion() {
  const model = new THREE.Group(),
    groups = [],
    solids = [];
  const material = (color, roughness = 0.8, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness, ...extra });
  const stone = material(0xd8d0bc),
    concrete = material(0xb8b5a7),
    timber = material(0x886044),
    steel = material(0x292f2b, 0.4),
    glass = material(0xabc3b7, 0.12, {
      transparent: true,
      opacity: 0.32,
      metalness: 0.22,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    water = material(0x568d86, 0.16, { metalness: 0.55 }),
    green = material(0x68765a),
    gravel = material(0xa39d8b),
    fabric = material(0xe7ddc5);
  const names = new Map([
    [stone, 'Honed limestone / continuous floor and roof plates'],
    [concrete, 'Exposed concrete / load-bearing walls'],
    [timber, 'Walnut brise-soleil / filtered daylight'],
    [steel, 'Slim steel / structural framing'],
    [glass, 'Glazing / courtyard connection'],
    [water, 'Reflecting pool / light and microclimate'],
    [green, 'Planted landscape / shaded courtyard'],
    [gravel, 'Gravel garden / permeable ground'],
    [fabric, 'Interior / a human scale'],
  ]);
  function layer(name, offset, stage) {
    const g = new THREE.Group();
    g.name = name;
    g.userData = { offset, stage };
    model.add(g);
    groups.push(g);
    return g;
  }
  const base = layer('Landscape', 0, 0.18),
    structure = layer('Ground floor', 1.5, 0.32),
    upper = layer('Gallery', 3, 0.5),
    roof = layer('Roof + daylight', 4.5, 0.68),
    screens = layer('Solar screens', 5.6, 0.8);
  function box(g, w, h, d, x, y, z, mat = stone) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { label: names.get(mat), stage: g.userData.stage, baseY: y, height: h };
    g.add(mesh);
    solids.push(mesh);
    return mesh;
  }
  box(base, 16, 0.25, 12, 0, -0.22, 0, concrete);
  box(base, 14, 0.18, 10, 0, 0, 0, stone);
  box(base, 6.2, 0.06, 2.9, 2.3, 0.13, 2.25, water);
  for (let i = 0; i < 6; i++) box(base, 1.15, 0.1, 0.44, -0.5 + i * 0.97, 0.2, 4.1, stone);
  box(base, 1.35, 0.09, 8, -6.15, 0.14, 0, gravel);
  box(base, 2.7, 0.09, 2.4, -3.9, 0.15, 2.5, gravel);
  for (let i = 0; i < 6; i++) {
    box(base, 2.4 + i * 0.22, 0.13, 0.37, 0, 0.08 - i * 0.09, 5.04 + i * 0.32, stone);
  }
  // L-shaped ground floor leaves an open-to-sky garden and water court.
  box(structure, 11.6, 0.24, 3.6, 0, 0.34, -2.55, stone);
  box(structure, 3.25, 0.24, 3.8, -4.17, 0.34, 1.15, stone);
  box(structure, 11.6, 2.85, 0.18, 0, 1.88, -4.25, concrete);
  box(structure, 0.23, 2.85, 6.7, -5.68, 1.88, -0.95, concrete);
  box(structure, 0.18, 2.85, 3.6, 5.65, 1.88, -2.55, concrete);
  box(structure, 2.2, 2.85, 0.18, -4.5, 1.88, 3.0, concrete);
  box(structure, 8.1, 2.65, 0.045, 1.45, 1.86, -0.8, glass);
  box(structure, 0.045, 2.65, 3.7, -2.58, 1.86, 1.0, glass);
  for (let x = -2.5; x < 5.7; x += 1.35) box(structure, 0.045, 2.85, 0.07, x, 1.88, -0.76, steel);
  for (let z = -0.6; z < 3; z += 0.9) box(structure, 0.07, 2.85, 0.045, -2.56, 1.88, z, steel);
  for (const x of [-5.5, -2.55, 1.55, 5.48])
    for (const z of [-4.05, -0.9]) box(structure, 0.12, 2.9, 0.12, x, 1.9, z, steel);
  // A readable stair, furniture, doors and handrails make the model inhabitable.
  for (let i = 0; i < 17; i++) {
    box(structure, 1.2, 0.12, 0.27, -4.75, 0.52 + i * 0.173, 2.55 - i * 0.265, stone);
    box(structure, 0.025, 0.95, 0.025, -4.1, 1.05 + i * 0.173, 2.55 - i * 0.265, steel);
  }
  box(structure, 1.8, 0.34, 0.7, 2.6, 0.65, -3.2, timber);
  box(structure, 1.8, 0.14, 0.68, 2.6, 0.89, -3.2, fabric);
  box(structure, 1.8, 0.48, 0.16, 2.6, 1.02, -3.49, fabric);
  box(structure, 1.25, 0.08, 0.65, 2.6, 0.81, -1.9, timber);
  for (const x of [2.08, 3.12]) box(structure, 0.045, 0.34, 0.045, x, 0.6, -1.9, steel);
  box(structure, 1.8, 0.06, 0.9, -0.6, 1.16, -2.6, timber);
  for (const x of [-1.3, 0.1])
    for (const z of [-2.9, -2.3]) box(structure, 0.06, 0.7, 0.06, x, 0.79, z, steel);
  for (const x of [-1.15, -0.1])
    for (const z of [-3.35, -1.85]) {
      box(structure, 0.44, 0.09, 0.43, x, 0.88, z, fabric);
      box(structure, 0.43, 0.48, 0.06, x, 1.12, z + (z < -2.5 ? -0.19 : 0.19), timber);
    }
  box(upper, 11.9, 0.25, 3.85, 0, 3.43, -2.55, stone);
  box(upper, 3.5, 0.25, 3.9, -4.2, 3.43, 1.2, stone);
  box(upper, 9.1, 2.55, 0.17, 1, 4.83, -4.14, concrete);
  box(upper, 0.17, 2.55, 3.2, 5.45, 4.83, -2.62, concrete);
  box(upper, 9.9, 2.45, 0.045, 0.6, 4.8, -0.97, glass);
  box(upper, 0.045, 2.45, 3.12, -4.4, 4.8, -2.55, glass);
  for (let x = -4.35; x < 5.5; x += 1.4) box(upper, 0.05, 2.6, 0.06, x, 4.84, -0.94, steel);
  // Lower roof terrace: thin balustrade and a row of planted pockets.
  box(upper, 0.045, 0.95, 3.6, -5.89, 4.03, 1.2, glass);
  box(upper, 3.5, 0.95, 0.045, -4.2, 4.03, 3.14, glass);
  for (let i = 0; i < 4; i++) {
    box(upper, 0.65, 0.4, 0.58, -5.35 + i * 0.8, 3.78, 2.5, concrete);
    box(upper, 0.52, 0.2, 0.46, -5.35 + i * 0.8, 4.05, 2.5, green);
  }
  // Four plates form a real rooflight opening, rather than a solid roof box.
  box(roof, 11.15, 0.23, 1.0, 0.45, 6.24, -3.95, stone);
  box(roof, 11.15, 0.23, 1.35, 0.45, 6.24, -1.25, stone);
  box(roof, 3.9, 0.23, 1.85, -3.17, 6.24, -2.8, stone);
  box(roof, 3.7, 0.23, 1.85, 4.15, 6.24, -2.8, stone);
  box(roof, 3.5, 0.05, 1.65, 0.75, 6.29, -2.85, glass);
  for (let x = -0.9; x < 2.6; x += 0.45) box(roof, 0.035, 0.06, 1.65, x, 6.34, -2.85, steel);
  for (let i = 0; i < 35; i++) box(screens, 0.065, 2.55, 0.4, -4.35 + i * 0.28, 4.83, -0.6, timber);
  for (let i = 0; i < 12; i++) box(screens, 0.11, 0.17, 3.45, -5.9 + i * 0.3, 3.62, 1.4, timber);
  for (let x of [-5.9, -2.6]) box(structure, 0.09, 2.95, 0.09, x, 1.87, 3.15, steel);
  // Deterministic clustered foliage, with trunks and branching silhouettes.
  function tree(x, z, size) {
    const g = new THREE.Group();
    g.position.set(x, 0.2, z);
    base.add(g);
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055 * size, 0.1 * size, 1.7 * size, 7),
      timber,
    );
    trunk.position.y = 0.85 * size;
    g.add(trunk);
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4,
        r = (0.42 * size * (i % 3)) / 2;
      const m = new THREE.Mesh(
        new THREE.IcosahedronGeometry((0.45 + (i % 3) * 0.09) * size, 1),
        green,
      );
      m.position.set(Math.cos(a) * r, (1.7 + (i % 4) * 0.18) * size, Math.sin(a) * r);
      m.castShadow = true;
      g.add(m);
    }
    g.traverse((m) => {
      if (m.isMesh) {
        m.userData.label = 'Courtyard canopy / shade and seasonal light';
        solids.push(m);
      }
    });
  }
  tree(-1.9, 2.3, 1.25);
  tree(6.4, -3.8, 1);
  tree(6.4, 3.8, 0.8);
  tree(-6.5, -4.8, 0.85);
  // Delicate edge definition reads like a physical architectural maquette.
  const outlineMat = new THREE.LineBasicMaterial({
    color: 0x29382e,
    transparent: true,
    opacity: 0.22,
  });
  solids.forEach((mesh) => {
    if (
      mesh.geometry.type === 'BoxGeometry' &&
      mesh.material !== glass &&
      mesh.material !== water
    ) {
      const line = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 35), outlineMat);
      mesh.add(line);
    }
  });
  return { model, groups, solids };
}

export function createBlueprint() {
  const group = new THREE.Group(),
    points = [];
  const segment = (x, z, a, b) => points.push(x, 0.01, z, a, 0.01, b);
  const rectangle = (x, z, w, d) => {
    segment(x, z, x + w, z);
    segment(x + w, z, x + w, z + d);
    segment(x + w, z + d, x, z + d);
    segment(x, z + d, x, z);
  };
  rectangle(-8, -6, 16, 12);
  rectangle(-5.8, -4.4, 11.6, 3.8);
  rectangle(-5.8, -0.6, 3.3, 3.8);
  rectangle(-0.8, 0.8, 6.2, 2.9);
  rectangle(-5.58, -4.18, 11.15, 3.36);
  rectangle(-5.58, -0.6, 2.87, 3.57);
  for (let x = -5.5; x < 5.7; x += 1.4) {
    rectangle(x, -4.1, 0.12, 0.12);
    rectangle(x, -0.9, 0.12, 0.12);
  }
  for (let i = 0; i < 17; i++) rectangle(-5.35, 2.55 - i * 0.265, 1.2, 0.25);
  rectangle(1.7, -3.5, 1.8, 0.7);
  rectangle(1.95, -2.25, 1.25, 0.65);
  rectangle(-1.5, -3.05, 1.8, 0.9);
  for (let x = -8; x <= 8; x += 2) segment(x, -7, x, 7);
  for (let z = -6; z <= 6; z += 2) segment(-9, z, 9, z);
  segment(-8, 6.7, 8, 6.7);
  segment(8.7, -6, 8.7, 6);
  for (const x of [-8, 8]) segment(x - 0.15, 6.5, x + 0.15, 6.9);
  for (const z of [-6, 6]) segment(8.5, z - 0.15, 8.9, z + 0.15);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  const mat = new THREE.LineBasicMaterial({ color: 0xe7b589, transparent: true, opacity: 0.75 });
  const lines = new THREE.LineSegments(geo, mat);
  group.add(lines);
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1536;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#dfb995';
  ctx.textAlign = 'center';
  ctx.font = '24px monospace';
  ctx.fillText('16 000', 1024, 1460);
  ctx.save();
  ctx.translate(1940, 768);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('12 000', 0, 0);
  ctx.restore();
  ctx.font = '18px monospace';
  ctx.fillText('LIVING / GALLERY', 1130, 540);
  ctx.fillText('WATER COURT', 1270, 1080);
  ctx.fillText('N ↑', 155, 150);
  ctx.fillText('IS–001   /   CONCEPT DIMENSIONS · mm', 680, 110);
  const texture = new THREE.CanvasTexture(canvas),
    labels = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 14),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
  labels.rotation.x = -Math.PI / 2;
  labels.position.y = 0.025;
  group.add(labels);
  return { group, lines, mat, labels, count: points.length / 3 };
}
