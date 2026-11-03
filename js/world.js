// 江湖山庄 — 地形·水·远山·植被编排
import * as THREE from 'three';
import {
  makePine, makeBroadleaf, makeBamboo, makeShrub, makeRock,
  makeGrassField, makeFlowers, makeReeds, makeLilies, makeButterflies,
  updateFoliage
} from './flora.js';

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
  // 远处 → 融进天青（青绿山水的"空气透视"）
  const far = smooth(78, 118, r) * 0.72;
  const FOG = { r: 0.68, g: 0.78, b: 0.83 };
  cr = cr * (1 - far) + FOG.r * far;
  cg = cg * (1 - far) + FOG.g * far;
  cb = cb * (1 - far) + FOG.b * far;
  out.r = cr; out.g = cg; out.b = cb;
}

const rnd = (a, b) => a + Math.random() * (b - a);

export function buildWorld(scene) {
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
    { r0: 96, r1: 118, hMin: 16, hMax: 30, color: 0x6f8f8a, op: 1, n: 16 },
    { r0: 128, r1: 152, hMin: 22, hMax: 42, color: 0x8fa9a6, op: 1, n: 18 },
    { r0: 162, r1: 195, hMin: 30, hMax: 56, color: 0xa8bfc0, op: 1, n: 20 },
  ];
  for (const L of ridgeLayers) {
    for (let i = 0; i < L.n; i++) {
      const a = (i / L.n) * Math.PI * 2 + rnd(-0.1, 0.1);
      const d = rnd(L.r0, L.r1);
      const h = rnd(L.hMin, L.hMax);
      const w = rnd(28, 58);
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(w, h, 5 + (Math.random() * 3 | 0), 1),
        new THREE.MeshStandardMaterial({ color: L.color, roughness: 1, flatShading: true, fog: true })
      );
      cone.position.set(Math.cos(a) * d, h * 0.32 - 4, Math.sin(a) * d);
      cone.rotation.y = Math.random() * Math.PI * 2;
      cone.scale.set(1, 1, rnd(0.7, 1.2));
      scene.add(cone);
      farRocks.push(cone);
    }
  }

  // ---------- 池塘水面 ----------
  const waterGeo = new THREE.CircleGeometry(POND.r, 56);
  waterGeo.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(waterGeo, new THREE.MeshStandardMaterial({
    color: 0x4a7c88, transparent: true, opacity: 0.86, roughness: 0.12, metalness: 0.2
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

  addTree(makeBroadleaf(1.25), -14, 8, 0.7);
  addTree(makeBroadleaf(1.35), 14, 10, 0.7);
  addTree(makePine(1.1), -16, -4, 0.6);
  addTree(makeBroadleaf(1.0), 12, -6, 0.6);
  addTree(makePine(1.25), 18, -30, 0.65);
  addTree(makeBroadleaf(1.1), -22, 16, 0.65);

  // 围墙边灌木
  for (let i = 0; i < 16; i++) {
    const a = Math.random() * Math.PI * 2, d = rnd(20, 27);
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (Math.abs(z - 26) < 4 && Math.abs(x) < 5) continue; // 让开山门
    if (Math.abs(x) < 6 && z < 26 && z > -18) continue;   // 让开中轴
    addTree(makeShrub(rnd(0.85, 1.4)), x, z, 0);
  }

  // ---------- 竹林（东北角） ----------
  for (let i = 0; i < 12; i++) {
    const a = -0.55 + Math.random() * 0.55, d = 30 + Math.random() * 15;
    const x = Math.cos(a) * d + 6, z = Math.sin(a) * d - 26;
    addTree(makeBamboo(3 + (Math.random() * 3 | 0)), x, z, 0.7);
  }

  // ---------- 外围林带 ----------
  for (let i = 0; i < 96; i++) {
    const a = Math.random() * Math.PI * 2, d = 32 + Math.random() * 62;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (Math.sqrt((x - POND.x) ** 2 + (z - POND.z) ** 2) < POND.r + 5) continue;
    if (Math.random() < 0.55) addTree(makePine(0.85 + Math.random() * 0.9), x, z, 0.55);
    else addTree(makeBroadleaf(0.85 + Math.random() * 0.8), x, z, 0.6);
  }

  // ---------- 池边石 ----------
  for (let i = 0; i < 30; i++) {
    const a = Math.random() * Math.PI * 2, d = POND.r + rnd(0.4, 3.2);
    const x = POND.x + Math.cos(a) * d, z = POND.z + Math.sin(a) * d;
    const rk = makeRock(rnd(0.7, 1.5));
    rk.position.set(x, POND.waterY + rnd(0.02, 0.16), z);
    scene.add(rk);
  }
  // 山上散石
  for (let i = 0; i < 22; i++) {
    const a = Math.random() * Math.PI * 2, d = rnd(40, 95);
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    const rk = makeRock(rnd(0.9, 2.0));
    rk.position.set(x, terrainHeight(x, z) + 0.05, z);
    scene.add(rk);
  }

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
  makeGrassField(scene, grassSamples, 2400);
  makeFlowers(scene, () => {
    const p = grassSamples();
    if (!p) return null;
    const r = Math.sqrt(p.x * p.x + p.z * p.z);
    if (r < PLAZA_R + 2) return null;
    return p;
  }, 200);

  // ---------- 池中与池边 ----------
  makeReeds(scene, POND.x, POND.z, POND.r, 52);
  makeLilies(scene, POND.x, POND.z, POND.r, 26);

  // ---------- 蝴蝶 ----------
  const butterflyAnchors = [];
  for (let i = 0; i < 6; i++) {
    const a = Math.random() * Math.PI * 2, d = 14 + Math.random() * 26;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    butterflyAnchors.push({ x, y: terrainHeight(x, z), z });
  }
  const butterflies = makeButterflies(scene, butterflyAnchors);

  // ---------- 每帧动画 ----------
  let tAcc = 0;
  world.animate = (t, dt) => {
    tAcc += dt;
    water.position.y = POND.waterY + Math.sin(t * 0.7) * 0.028;
    const s = (t * 0.22) % 1;
    ripple.scale.setScalar(1 + s * 10);
    ripple.material.opacity = 0.3 * (1 - s);
    butterflies.update(t);
    updateFoliage(t);
  };
}
