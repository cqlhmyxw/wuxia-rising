// 江湖山庄 — 地形·水·远山·植被编排
import * as THREE from 'three';
import {
  makePine, makeBroadleaf, makeBamboo, makeShrub, makeRock,
  makeGrassField, makeFlowers, makeReeds, makeLilies, makeButterflies,
  makePetals, makeBirds,
  updateFoliage, makeDirtPatch, bindTerrainHeight
} from './flora.js?v=12';

export const POND = { x: 35, z: -18, r: 11.5, waterY: -0.55 };
export const colliders = []; // {x,z,r}
export const world = { animate: null };

// 平滑阶梯
function smooth(a, b, v) { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); }
function noise2(x, z) { return Math.sin(x * 0.05 + 1.3) * Math.cos(z * 0.042 + 0.7) + 0.6 * Math.sin(x * 0.11 + 4) * Math.sin(z * 0.09 + 2) + 0.35 * Math.sin(x * 0.23) * Math.cos(z * 0.19); }

export const PLAZA_R = 24;

export function terrainHeight(x, z) {
  let h = noise2(x, z) * 1.1;
  const r = Math.sqrt(x * x + z * z);
  h += smooth(62, 108, r) * (9 + 6 * noise2(x * 0.6, z * 0.6));
  const pd = Math.sqrt((x - POND.x) ** 2 + (z - POND.z) ** 2);
  h -= 3 * Math.exp(-(pd * pd) / (2 * 10 * 10));
  const f = smooth(PLAZA_R, PLAZA_R + 9, r);
  h *= f;
  return h;
}

function terrainColor(x, z, y, out) {
  const r = Math.sqrt(x * x + z * z);
  const n = 0.5 + 0.5 * Math.sin(x * 0.31 + z * 0.27);
  // 草地基色（偏黄绿，比纯绿更自然）
  let cr = 0.44 + 0.07 * n, cg = 0.56 + 0.08 * n, cb = 0.29;
  // 高处 → 岩石灰绿
  if (y > 5) { const t = Math.min(1, (y - 5) / 8); cr = cr * (1 - t) + 0.52 * t; cg = cg * (1 - t) + 0.58 * t; cb = cb * (1 - t) + 0.55 * t; }
  // 广场 → 夯土
  const pz = 1 - smooth(PLAZA_R - 4, PLAZA_R, r);
  cr = cr * (1 - pz) + 0.72 * pz; cg = cg * (1 - pz) + 0.66 * pz; cb = cb * (1 - pz) + 0.52 * pz;
  // 池边 → 沙岸
  const pd = Math.sqrt((x - POND.x) ** 2 + (z - POND.z) ** 2);
  if (pd < POND.r + 4) { const t = 1 - smooth(POND.r + 1, POND.r + 4, pd); cr = cr * (1 - t) + 0.78 * t; cg = cg * (1 - t) + 0.70 * t; cb = cb * (1 - t) + 0.52 * t; }
  // 远处 → 融进暖绿天色（江南烟雨的"空气透视"）
  const far = smooth(70, 115, r) * 0.85;
  const FOG = { r: 0.80, g: 0.875, b: 0.83 };
  cr = cr * (1 - far) + FOG.r * far;
  cg = cg * (1 - far) + FOG.g * far;
  cb = cb * (1 - far) + FOG.b * far;
  out.r = cr; out.g = cg; out.b = cb;
}

const rnd = (a, b) => a + Math.random() * (b - a);

export function buildWorld(scene) {
  bindTerrainHeight(terrainHeight);
  // ---------- 地形 ----------
  const SIZE = 260, SEG = 150;
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = { r: 0, g: 0, b: 0 };
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const y = terrainHeight(x, z);
    pos.setY(i, y);
    terrainColor(x, z, y, c);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const terrain = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }));
  terrain.receiveShadow = true;
  scene.add(terrain);

  // ---------- 远山剪影（三层，越远越淡） ----------
  const farRocks = [];
  const ridgeLayers = [
    { r0: 96, r1: 118, hMin: 16, hMax: 30, color: 0x8fae8a, op: 1.0, n: 16 },
    { r0: 128, r1: 152, hMin: 22, hMax: 42, color: 0xa9c2a4, op: 0.9, n: 18 },
    { r0: 162, r1: 195, hMin: 30, hMax: 56, color: 0xc2d4bd, op: 0.78, n: 20 },
  ];
  for (const L of ridgeLayers) {
    for (let i = 0; i < L.n; i++) {
      const a = (i / L.n) * Math.PI * 2 + rnd(-0.1, 0.1);
      const d = rnd(L.r0, L.r1);
      const h = rnd(L.hMin, L.hMax);
      const w = rnd(28, 58);
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(w, h, 5 + (Math.random() * 3 | 0), 1),
        new THREE.MeshStandardMaterial({ color: L.color, roughness: 1, flatShading: true, transparent: true, opacity: L.op })
      );
      cone.position.set(Math.cos(a) * d, h * 0.32 - 4, Math.sin(a) * d);
      cone.rotation.y = Math.random() * Math.PI * 2;
      cone.scale.set(1, 1, rnd(0.7, 1.2));
      scene.add(cone);
      farRocks.push(cone);
    }
  }

  // ---------- 池塘水面：渐变天光倒影（近岸浅绿 → 中央深碧），低粗糙模拟水镜 ----------
  const waterCanvas = document.createElement('canvas');
  waterCanvas.width = 16; waterCanvas.height = 128;
  const wctx = waterCanvas.getContext('2d');
  const wgrad = wctx.createLinearGradient(0, 0, 0, 128);
  wgrad.addColorStop(0, '#cfe6df');
  wgrad.addColorStop(0.5, '#7fb6b0');
  wgrad.addColorStop(1, '#2f6f72');
  wctx.fillStyle = wgrad; wctx.fillRect(0, 0, 16, 128);
  const waterTex = new THREE.CanvasTexture(waterCanvas);
  waterTex.colorSpace = THREE.SRGBColorSpace;
  waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping;
  const waterGeo = new THREE.CircleGeometry(POND.r, 56);
  waterGeo.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(waterGeo, new THREE.MeshStandardMaterial({
    map: waterTex, transparent: true, opacity: 0.92, roughness: 0.08, metalness: 0.35
  }));
  water.position.set(POND.x, POND.waterY, POND.z);
  scene.add(water);

  const ripple = new THREE.Mesh(new THREE.RingGeometry(1, 1.07, 44),
    new THREE.MeshBasicMaterial({ color: 0xd6ecef, transparent: true, opacity: 0.32, side: THREE.DoubleSide }));
  ripple.rotation.x = -Math.PI / 2;
  ripple.position.set(POND.x, POND.waterY + 0.03, POND.z);
  scene.add(ripple);

  // ---------- 石板路：山门 → 主宅 ----------
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8f8a7e, roughness: 0.95 });
  for (let z = 26; z > -10; z -= 2.4) {
    const jx = (noise2(z, 7) * 0.5);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.12, 7), stoneMat);
    st.position.set(jx, terrainHeight(jx, z) + 0.06, z);
    st.rotation.y = z * 0.7;
    st.receiveShadow = true;
    scene.add(st);
  }

  // ---------- 植被：广场点缀 ----------
  function addTree(obj, x, z, collR) {
    obj.position.set(x, terrainHeight(x, z), z);
    obj.rotation.y = Math.random() * Math.PI * 2;
    scene.add(obj);
    if (collR) colliders.push({ x, z, r: collR });
  }

  addTree(makeBroadleaf(1.7), -14, 8, 0.8);
  addTree(makeBroadleaf(1.9), 14, 10, 0.8);
  addTree(makePine(1.5), -16, -4, 0.7);
  addTree(makeBroadleaf(1.4), 12, -6, 0.7);
  addTree(makePine(1.7), 18, -30, 0.75);
  addTree(makeBroadleaf(1.5), -22, 16, 0.75);

  // 围墙边灌木
  for (let i = 0; i < 16; i++) {
    const a = Math.random() * Math.PI * 2, d = rnd(20, 27);
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (Math.abs(z - 26) < 4 && Math.abs(x) < 5) continue; // 让开山门
    if (Math.abs(x) < 6 && z < 26 && z > -18) continue;   // 让开中轴
    addTree(makeShrub(rnd(0.85, 1.4)), x, z, 0);
  }

  // ---------- 竹林（东北角 + 湖西，成片） ----------
  function plantGrove(cx, cz, n, spread) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, d = spread * Math.sqrt(Math.random());
      addTree(makeBamboo(3 + (Math.random() * 4 | 0)), cx + Math.cos(a) * d, cz + Math.sin(a) * d, 0.6);
    }
  }
  plantGrove(8, -44, 16, 7);                  // 东北角竹丛
  plantGrove(POND.x - 9, POND.z - 6, 12, 6);  // 湖西竹丛

  // ---------- 外围林带（高低错落：高直松 / 高大阔叶 / 矮丛） ----------
  for (let i = 0; i < 150; i++) {
    const a = Math.random() * Math.PI * 2, d = 32 + Math.random() * 62;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (Math.sqrt((x - POND.x) ** 2 + (z - POND.z) ** 2) < POND.r + 5) continue;
    const r = Math.random();
    if (r < 0.3) addTree(makePine(1.3 + Math.random() * 0.7), x, z, 0.6);      // 高直松树
    else if (r < 0.55) addTree(makePine(0.8 + Math.random() * 0.6), x, z, 0.55);
    else if (r < 0.8) addTree(makeBroadleaf(1.2 + Math.random() * 0.6), x, z, 0.65); // 高大阔叶
    else addTree(makeBroadleaf(0.7 + Math.random() * 0.5), x, z, 0.6);          // 矮丛
  }

  // ---------- 池边石 ----------
  for (let i = 0; i < 60; i++) {
    const a = Math.random() * Math.PI * 2, d = POND.r + rnd(0.4, 3.6);
    const x = POND.x + Math.cos(a) * d, z = POND.z + Math.sin(a) * d;
    const rk = makeRock(rnd(0.6, 1.7));
    rk.position.set(x, POND.waterY + rnd(0.02, 0.18), z);
    scene.add(rk);
  }
  // 山上散石
  for (let i = 0; i < 45; i++) {
    const a = Math.random() * Math.PI * 2, d = rnd(40, 95);
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    const rk = makeRock(rnd(0.9, 2.2));
    rk.position.set(x, terrainHeight(x, z) + 0.05, z);
    scene.add(rk);
  }

  // ---------- 泥土斑块（造田/水岸裸露泥地） ----------
  makeDirtPatch(scene, 9, 30, 3.2);                 // 庄前空地
  makeDirtPatch(scene, POND.x + 5, POND.z + POND.r + 5, 3.0); // 湖畔
  makeDirtPatch(scene, -22, -8, 2.6);               // 西隅

  // ---------- 草与花 ----------
  const grassSamples = () => {
    const a = Math.random() * Math.PI * 2;
    const d = Math.sqrt(Math.random()) * 78 + 3;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    const r = Math.sqrt(x * x + z * z);
    // 广场夯土上不长草
    if (r < PLAZA_R - 3.5) return null;
    // 水面不长草
    const pd = Math.sqrt((x - POND.x) ** 2 + (z - POND.z) ** 2);
    if (pd < POND.r + 0.6) return null;
    return { x, y: terrainHeight(x, z), z };
  };
  makeGrassField(scene, grassSamples, 8000);
  makeFlowers(scene, () => {
    const p = grassSamples();
    if (!p) return null;
    const r = Math.sqrt(p.x * p.x + p.z * p.z);
    if (r < PLAZA_R + 2) return null;
    return p;
  }, 520);

  // ---------- 池中与池边 ----------
  makeReeds(scene, POND.x, POND.z, POND.r, 52);
  makeLilies(scene, POND.x, POND.z, POND.r, 26);

  // ---------- 溪涧 + 拱桥（从镜湖引出） ----------
  const streamLen = 11, streamW = 3;
  const streamGeo = new THREE.PlaneGeometry(streamLen, streamW);
  streamGeo.rotateX(-Math.PI / 2);
  const stream = new THREE.Mesh(streamGeo, new THREE.MeshStandardMaterial({
    map: waterTex, transparent: true, opacity: 0.9, roughness: 0.1, metalness: 0.3
  }));
  const sx = POND.x + POND.r + streamLen / 2 - 1;
  const sz = POND.z + 1.5;
  stream.position.set(sx, POND.waterY + 0.02, sz);
  scene.add(stream);
  // 溪岸石
  for (let i = 0; i < 14; i++) {
    const t = i / 14;
    const x = POND.x + POND.r - 1 + t * streamLen;
    for (const dz of [-streamW / 2 - 0.4, streamW / 2 + 0.4]) {
      const rk = makeRock(rnd(0.5, 1.1));
      rk.position.set(x, POND.waterY + 0.05, sz + dz);
      scene.add(rk);
    }
  }
  // 拱桥
  const bridge = new THREE.Group();
  const bridgeStone = new THREE.MeshStandardMaterial({ color: 0x9a9282, roughness: 0.95 });
  const R = 2.4, tube = 0.26;
  bridge.add(new THREE.Mesh(new THREE.TorusGeometry(R, tube, 10, 28, Math.PI), bridgeStone));
  for (const dz of [-0.55, 0.55]) {
    const rail = new THREE.Mesh(new THREE.TorusGeometry(R, 0.05, 6, 28, Math.PI), bridgeStone);
    rail.position.set(0, 0.55, dz); bridge.add(rail);
    for (let i = 0; i <= 6; i++) {
      const th = Math.PI * i / 6;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.55, 0.07), bridgeStone);
      post.position.set(Math.cos(th) * R, Math.sin(th) * R + 0.55, dz);
      bridge.add(post);
    }
  }
  bridge.position.set(sx, POND.waterY + 0.05, sz);
  bridge.rotation.y = Math.PI / 2; // 桥跨过溪（溪沿 x 向，桥沿 z 向）
  scene.add(bridge);

  // ---------- 蝴蝶 ----------
  const butterflyAnchors = [];
  for (let i = 0; i < 6; i++) {
    const a = Math.random() * Math.PI * 2, d = 14 + Math.random() * 26;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    butterflyAnchors.push({ x, y: terrainHeight(x, z), z });
  }
  const butterflies = makeButterflies(scene, butterflyAnchors);

  // ---------- 落英 + 飞鸟 ----------
  const petals = makePetals(scene, 90);
  const birds = makeBirds(scene, 3);

  // ---------- 每帧动画 ----------
  let tAcc = 0;
  world.animate = (t, dt) => {
    tAcc += dt;
    water.position.y = POND.waterY + Math.sin(t * 0.7) * 0.028;
    waterTex.rotation += dt * 0.04;
    const s = (t * 0.22) % 1;
    ripple.scale.setScalar(1 + s * 10);
    ripple.material.opacity = 0.3 * (1 - s);
    butterflies.update(t);
    petals.update(t, dt);
    birds.update(t);
    updateFoliage(t);
  };
}
