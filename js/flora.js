// 江湖山庄 — 植被与生机：松/阔叶/竹/灌木/草/芦苇/睡莲/蝶
// M2：几何体树 → 贴图化真实树形（程序化 canvas 贴图 + 交叉面片树冠 + 风摆）
import * as THREE from 'three';
import { mergeGeometries } from '../utils/BufferGeometryUtils.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[(Math.random() * arr.length) | 0];

// ---------- 程序化贴图（运行时生成，零下载成本） ----------
function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// 树叶簇：白色/浅灰叶片，实际颜色交给材质 color 调制
const leafTex = canvasTex(256, 256, (ctx, w, h) => {
  ctx.clearRect(0, 0, w, h);
  for (let i = 0; i < 130; i++) {
    const cx = rnd(0, w), cy = rnd(0, h);
    const rw = rnd(9, 21), rh = rw * rnd(0.45, 0.8);
    const lum = 180 + (Math.random() * 75 | 0);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.random() * Math.PI * 2);
    ctx.fillStyle = `rgba(${lum},${lum},${lum},${0.82 + Math.random() * 0.18})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
});

// 松针：细长针叶，纵向均匀分布（不依赖上下方向，避免 UV 翻转问题）
const needleTex = canvasTex(256, 256, (ctx, w, h) => {
  ctx.clearRect(0, 0, w, h);
  for (let i = 0; i < 340; i++) {
    const x = rnd(0, w), y0 = rnd(-40, h * 0.7);
    const len = rnd(h * 0.25, h * 0.55);
    const lum = 80 + (Math.random() * 120 | 0);
    ctx.strokeStyle = `rgba(${lum},${lum},${lum},${0.55 + Math.random() * 0.45})`;
    ctx.lineWidth = rnd(1.1, 2.4);
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.quadraticCurveTo(x + rnd(-7, 7), y0 + len * 0.55, x + rnd(-13, 13), y0 + len);
    ctx.stroke();
  }
});

// 树皮：纵向裂纹
const barkTex = canvasTex(128, 256, (ctx, w, h) => {
  ctx.fillStyle = '#6a5238';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 170; i++) {
    const x = rnd(0, w);
    ctx.strokeStyle = `rgba(${28 + Math.random() * 42 | 0},${20 + Math.random() * 30 | 0},${12 + Math.random() * 22 | 0},${0.2 + Math.random() * 0.55})`;
    ctx.lineWidth = rnd(0.8, 3.2);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    let y = 0;
    while (y < h) { y += rnd(8, 28); ctx.lineTo(x + rnd(-4, 4), y); }
    ctx.stroke();
  }
  // 少量高光，避免糊成一片
  for (let i = 0; i < 60; i++) {
    ctx.strokeStyle = `rgba(190,175,150,${0.05 + Math.random() * 0.12})`;
    ctx.lineWidth = rnd(0.6, 1.6);
    const x = rnd(0, w);
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + rnd(-5, 5), h); ctx.stroke();
  }
});

// 草叶：底部生根，顶端渐细
const grassTex = canvasTex(128, 128, (ctx, w, h) => {
  ctx.clearRect(0, 0, w, h);
  for (let i = 0; i < 26; i++) {
    const x0 = rnd(w * 0.12, w * 0.88);
    const tipX = x0 + rnd(-26, 26);
    const tipY = rnd(0, h * 0.3);
    const wBase = rnd(2.5, 5.5);
    const lum = 170 + (Math.random() * 85 | 0);
    ctx.fillStyle = `rgba(${lum},${lum},${lum},${0.8 + Math.random() * 0.2})`;
    ctx.beginPath();
    ctx.moveTo(x0 - wBase, h);
    ctx.quadraticCurveTo(x0 - wBase * 0.4, (h + tipY) * 0.5, tipX, tipY);
    ctx.quadraticCurveTo(x0 + wBase * 0.4, (h + tipY) * 0.5, x0 + wBase, h);
    ctx.closePath();
    ctx.fill();
  }
});

const MAT = {
  bark: new THREE.MeshStandardMaterial({ map: barkTex, roughness: 0.98 }),
  barkLight: new THREE.MeshStandardMaterial({ map: barkTex, color: 0xc8bba8, roughness: 0.98 }),
  pineDark: new THREE.MeshStandardMaterial({ map: needleTex, color: 0x2f5330, alphaTest: 0.42, side: THREE.DoubleSide, roughness: 0.92 }),
  pineMid: new THREE.MeshStandardMaterial({ map: needleTex, color: 0x3d6b39, alphaTest: 0.42, side: THREE.DoubleSide, roughness: 0.92 }),
  pineLight: new THREE.MeshStandardMaterial({ map: needleTex, color: 0x4e8043, alphaTest: 0.42, side: THREE.DoubleSide, roughness: 0.92 }),
  leafA: new THREE.MeshStandardMaterial({ map: leafTex, color: 0x4d7f3a, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.94 }),
  leafB: new THREE.MeshStandardMaterial({ map: leafTex, color: 0x5f8f43, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.94 }),
  leafC: new THREE.MeshStandardMaterial({ map: leafTex, color: 0x6f9d4c, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.94 }),
  leafD: new THREE.MeshStandardMaterial({ map: leafTex, color: 0x406b34, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.94 }),
  bamboo: new THREE.MeshStandardMaterial({ color: 0x7ba347, roughness: 0.72 }),
  bambooNode: new THREE.MeshStandardMaterial({ color: 0x62893a, roughness: 0.78 }),
  bambooLeaf: new THREE.MeshStandardMaterial({ map: leafTex, color: 0x8cb556, alphaTest: 0.42, side: THREE.DoubleSide, roughness: 0.88 }),
  rock: new THREE.MeshStandardMaterial({ color: 0x7d8577, roughness: 1, flatShading: true }),
  rockDark: new THREE.MeshStandardMaterial({ color: 0x6a7264, roughness: 1, flatShading: true }),
  reed: new THREE.MeshStandardMaterial({ color: 0x8a9a5c, roughness: 0.9 }),
  lily: new THREE.MeshStandardMaterial({ color: 0x3f6b3a, roughness: 0.85, side: THREE.DoubleSide }),
  lotus: new THREE.MeshStandardMaterial({ color: 0xe8a6b8, roughness: 0.7 }),
};

const LEAF_MATS = [MAT.leafA, MAT.leafB, MAT.leafC, MAT.leafD];

function m(geo, mat, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geo, mat);
  o.position.set(x, y, z);
  o.castShadow = true;
  return o;
}

// ---------- 风摆登记 ----------
const swayers = [];
function registerSway(obj, amp = 0.012, speed = 0.8) {
  swayers.push({ obj, amp, speed, phase: Math.random() * 10, baseZ: obj.rotation.z, baseX: obj.rotation.x });
}
export function updateFoliage(t) {
  for (const s of swayers) {
    const w = Math.sin(t * s.speed + s.phase);
    s.obj.rotation.z = s.baseZ + w * s.amp;
    s.obj.rotation.x = s.baseX + Math.cos(t * s.speed * 0.7 + s.phase) * s.amp * 0.6;
  }
}

// 树冠：实心内核 + 五片竖直 + 一片水平交叉面片，贴图做叶片轮廓
function makeCanopyCluster(size, mat) {
  const g = new THREE.Group();
  const geo = new THREE.PlaneGeometry(size, size);
  // 实心内核：消除面片间的穿透感，避免"乱"
  const coreMat = new THREE.MeshStandardMaterial({
    color: mat.color.clone().multiplyScalar(0.66), roughness: 0.96, flatShading: true
  });
  const core = m(new THREE.IcosahedronGeometry(size * 0.46, 0), coreMat, 0, size * 0.05, 0);
  core.castShadow = true;
  g.add(core);
  for (let i = 0; i < 5; i++) {
    const p = new THREE.Mesh(geo, mat);
    p.rotation.y = (i / 5) * Math.PI + rnd(-0.1, 0.1);
    p.rotation.z = rnd(-0.1, 0.1);
    p.castShadow = true;
    g.add(p);
  }
  const top = new THREE.Mesh(geo, mat);
  top.rotation.x = -Math.PI / 2;
  top.rotation.z = Math.random() * Math.PI;
  top.scale.setScalar(0.82);
  top.castShadow = true;
  top.position.y = size * 0.2;
  g.add(top);
  return g;
}

// ---------- 松：分层锯齿锥体 + 针叶贴图 ----------
function jaggedCone(r, h, seg = 12) {
  const geo = new THREE.ConeGeometry(r, h, seg, 2, true);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const rr = Math.hypot(v.x, v.z);
    if (rr > 0.001) {
      // 底缘锯齿最明显，向上收敛
      const yNorm = (v.y + h / 2) / h; // 0 底部 ~ 1 顶部
      const j = 1 + (1 - yNorm) * rnd(-0.22, 0.22);
      v.x *= j; v.z *= j;
      v.y += (1 - yNorm) * rnd(-0.06, 0.06) * h;
    }
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

export function makePine(s = 1) {
  const g = new THREE.Group();
  const h = rnd(3.4, 5.4) * s;

  // 树干 + 根部隆起
  const trunk = m(new THREE.CylinderGeometry(0.09 * s, 0.20 * s, h, 9), MAT.bark, 0, h / 2, 0);
  g.add(trunk);
  g.add(m(new THREE.CylinderGeometry(0.2 * s, 0.32 * s, 0.34 * s, 9), MAT.bark, 0, 0.14 * s, 0));

  // 4~5 层树冠
  const layers = 4 + (Math.random() < 0.5 ? 1 : 0);
  let cy = h * 0.55;
  let cr = rnd(1.15, 1.5) * s;
  for (let i = 0; i < layers; i++) {
    const mat = i === 0 ? MAT.pineDark : (i % 2 ? MAT.pineMid : MAT.pineLight);
    const cone = m(jaggedCone(cr, cr * rnd(1.35, 1.75)), mat,
      rnd(-0.08, 0.08) * s, cy + cr * 0.5, rnd(-0.08, 0.08) * s);
    cone.rotation.y = Math.random() * Math.PI * 2;
    cone.rotation.z = rnd(-0.07, 0.07);
    g.add(cone);
    registerSway(cone, 0.02 + i * 0.004, 0.55 + i * 0.06);
    cy += cr * 0.52;
    cr *= 0.74;
  }
  // 顶梢
  const tip = m(jaggedCone(cr * 0.78, cr * 1.6, 9), MAT.pineLight, 0, cy + cr * 0.55, 0);
  g.add(tip);
  registerSway(tip, 0.03, 0.7);

  registerSway(g, 0.006, 0.5);
  return g;
}

// ---------- 阔叶：真实树皮 + 分枝 + 交叉面片树冠 ----------
export function makeBroadleaf(s = 1) {
  const g = new THREE.Group();
  const h = rnd(3.0, 4.6) * s;

  const trunk = m(new THREE.CylinderGeometry(0.10 * s, 0.23 * s, h, 9), MAT.barkLight, 0, h / 2, 0);
  g.add(trunk);
  // 根部外扩
  g.add(m(new THREE.CylinderGeometry(0.23 * s, 0.34 * s, 0.3 * s, 9), MAT.barkLight, 0, 0.13 * s, 0));

  // 2~3 根分叉枝
  const branches = 2 + (Math.random() * 2 | 0);
  const tips = [];
  for (let i = 0; i < branches; i++) {
    const a = (i / branches) * Math.PI * 2 + rnd(-0.4, 0.4);
    const len = rnd(0.6, 1.0) * s;
    const br = m(new THREE.CylinderGeometry(0.04 * s, 0.08 * s, len, 6), MAT.barkLight,
      Math.cos(a) * len * 0.3, h - 0.05 * s + len * 0.32, Math.sin(a) * len * 0.3);
    br.rotation.z = Math.cos(a) * -0.55;
    br.rotation.x = Math.sin(a) * 0.55;
    g.add(br);
    tips.push({ x: Math.cos(a) * len * 0.66, y: h + len * 0.6, z: Math.sin(a) * len * 0.66 });
  }

  // 树冠：中心大簇 + 周围小簇
  const baseR = rnd(1.9, 2.5) * s;
  const center = makeCanopyCluster(baseR, pick(LEAF_MATS));
  center.position.y = h + baseR * 0.42;
  g.add(center);
  registerSway(center, 0.03, 0.75);

  const blobs = 4 + (Math.random() * 3 | 0);
  for (let i = 0; i < blobs; i++) {
    const t = tips[i % tips.length];
    const size = baseR * rnd(0.5, 0.78);
    const b = makeCanopyCluster(size, pick(LEAF_MATS));
    b.position.set(
      t.x + rnd(-0.45, 0.45) * s,
      t.y + rnd(-0.3, 0.4) * s,
      t.z + rnd(-0.45, 0.45) * s
    );
    b.rotation.y = Math.random() * Math.PI;
    g.add(b);
    registerSway(b, 0.035, rnd(0.6, 0.95));
  }

  registerSway(g, 0.005, 0.45);
  return g;
}

// ---------- 竹：竹竿带节 + 竹叶（贴图） ----------
export function makeBamboo(caneCount = 4) {
  const g = new THREE.Group();
  const leafGeo = new THREE.PlaneGeometry(0.42, 0.62);
  for (let i = 0; i < caneCount; i++) {
    const h = rnd(4.5, 8.0);
    const cane = new THREE.Group();
    const lean = rnd(-0.09, 0.09);
    const segH = h / 3;
    for (let k = 0; k < 3; k++) {
      const r = 0.055 - k * 0.008;
      const seg = m(new THREE.CylinderGeometry(r, r + 0.008, segH, 8), MAT.bamboo, 0, segH * (k + 0.5), 0);
      seg.rotation.z = lean * (k + 1) * 0.5;
      cane.add(seg);
      cane.add(m(new THREE.CylinderGeometry(r + 0.018, r + 0.018, 0.045, 8), MAT.bambooNode, 0, segH * (k + 0.6), 0));
    }
    // 竹叶簇
    for (let k = 0; k < 7; k++) {
      const leaf = new THREE.Mesh(leafGeo, MAT.bambooLeaf);
      leaf.position.set(rnd(-0.4, 0.4), h - rnd(0, 1.5), rnd(-0.4, 0.4));
      leaf.rotation.set(rnd(-0.6, 0.4), Math.random() * Math.PI * 2, rnd(-0.6, 0.6));
      leaf.scale.set(rnd(0.7, 1.1), rnd(0.8, 1.2), 1);
      leaf.castShadow = true;
      cane.add(leaf);
    }
    cane.position.set(rnd(-0.7, 0.7), 0, rnd(-0.7, 0.7));
    cane.rotation.y = Math.random() * Math.PI * 2;
    registerSway(cane, 0.02, rnd(0.5, 0.8));
    g.add(cane);
  }
  return g;
}

// ---------- 灌木 ----------
export function makeShrub(s = 1) {
  const g = new THREE.Group();
  const n = 2 + (Math.random() * 3 | 0);
  for (let i = 0; i < n; i++) {
    const size = rnd(0.6, 1.05) * s;
    const b = makeCanopyCluster(size, pick([MAT.leafA, MAT.leafB, MAT.leafD]));
    b.position.set(rnd(-0.34, 0.34) * s, size * rnd(0.32, 0.45), rnd(-0.34, 0.34) * s);
    b.rotation.y = Math.random() * Math.PI;
    g.add(b);
    registerSway(b, 0.02, rnd(0.7, 1.1));
  }
  return g;
}

// ---------- 岩石（顶点扰动，非规则形） ----------
export function makeRock(s = 1) {
  const geo = new THREE.IcosahedronGeometry(1, 0);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(i,
      pos.getX(i) * rnd(0.7, 1.25),
      pos.getY(i) * rnd(0.55, 1.0),
      pos.getZ(i) * rnd(0.7, 1.25)
    );
  }
  geo.computeVertexNormals();
  const r = m(geo, Math.random() < 0.5 ? MAT.rock : MAT.rockDark);
  r.scale.setScalar(rnd(0.28, 0.7) * s);
  r.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
  return r;
}

// ---------- 草丛（交叉面片 + 草叶贴图，InstancedMesh 一次 draw call） ----------
export function makeGrassField(scene, samples, count = 9000) {
  const a = new THREE.PlaneGeometry(0.5, 0.36);
  a.translate(0, 0.23, 0);
  const b = a.clone(); b.rotateY(Math.PI / 2);
  const c = a.clone(); c.rotateY(Math.PI / 4);
  const geo = mergeGeometries([a, b, c], false);

  const mat = new THREE.MeshStandardMaterial({
    map: grassTex, alphaTest: 0.38, side: THREE.DoubleSide, roughness: 0.95,
  });
  const inst = new THREE.InstancedMesh(geo, mat, count);
  inst.castShadow = false;
  inst.receiveShadow = false;

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  let n = 0, guard = 0;
  while (n < count && guard < count * 12) {
    guard++;
    const p = samples();
    if (!p) continue;
    dummy.position.set(p.x, p.y, p.z);
    dummy.rotation.set(rnd(-0.1, 0.1), Math.random() * Math.PI * 2, rnd(-0.1, 0.1));
    const s = rnd(0.72, 1.45);
    dummy.scale.set(s, s * rnd(0.85, 1.4), s);
    dummy.updateMatrix();
    inst.setMatrixAt(n, dummy.matrix);
    const k = Math.random();
    color.setRGB(0.34 + k * 0.22, 0.46 + k * 0.24, 0.2 + k * 0.1);
    inst.setColorAt(n, color);
    n++;
  }
  inst.count = n;
  inst.instanceMatrix.needsUpdate = true;
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  scene.add(inst);
  return inst;
}

// ---------- 泥土斑块（造田/水岸边裸露的泥土地） ----------
export function makeDirtPatch(scene, x, z, r) {
  const geo = new THREE.CircleGeometry(r, 24);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({ color: 0x6e5536, roughness: 1 });
  const patch = new THREE.Mesh(geo, mat);
  patch.position.set(x, terrainHeightSafe(x, z) + 0.02, z);
  patch.receiveShadow = true;
  scene.add(patch);
  // 散落小石
  for (let i = 0; i < 5; i++) {
    const a = Math.random() * Math.PI * 2, d = rnd(0, r * 0.8);
    const rk = makeRock(rnd(0.25, 0.5));
    rk.position.set(x + Math.cos(a) * d, terrainHeightSafe(x, z) + 0.05, z + Math.sin(a) * d);
    scene.add(rk);
  }
}
// terrainHeight 在 world.js 中定义，这里用迟绑定避免循环依赖
let _th = null;
export function bindTerrainHeight(fn) { _th = fn; }
function terrainHeightSafe(x, z) { return _th ? _th(x, z) : 0; }

// ---------- 野花（更艳更多） ----------
export function makeFlowers(scene, samples, count = 520) {
  const stemGeo = new THREE.CylinderGeometry(0.013, 0.016, 0.42, 4);
  stemGeo.translate(0, 0.21, 0);
  const headGeo = new THREE.SphereGeometry(0.085, 8, 7);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x5d7c3c, roughness: 0.9 });
  const colors = [0xf2d04a, 0xf0728c, 0xe8e8ec, 0xd36fc4, 0xf79a3c, 0x7fa0e0, 0xe85b5b];

  const group = new THREE.Group();
  let n = 0, guard = 0;
  while (n < count && guard < count * 10) {
    guard++;
    const p = samples();
    if (!p) continue;
    const st = new THREE.Mesh(stemGeo, stemMat);
    st.position.set(p.x, p.y, p.z);
    group.add(st);
    const hm = new THREE.Mesh(headGeo, new THREE.MeshStandardMaterial({ color: pick(colors), roughness: 0.75 }));
    hm.position.set(p.x, p.y + 0.31, p.z);
    hm.scale.set(1, 0.8, 1);
    group.add(hm);
    n++;
  }
  scene.add(group);
  return group;
}

// ---------- 芦苇（池边） ----------
export function makeReeds(scene, cx, cz, radius, count = 46) {
  const group = new THREE.Group();
  const stemGeo = new THREE.CylinderGeometry(0.018, 0.028, 1.5, 5);
  const plumeGeo = new THREE.ConeGeometry(0.075, 0.42, 6);
  const plumeMat = new THREE.MeshStandardMaterial({ color: 0xb8a676, roughness: 0.9 });

  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = radius + rnd(-0.6, 1.6);
    const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
    const h = rnd(0.8, 1.5);
    const g = new THREE.Group();
    const st = new THREE.Mesh(stemGeo, MAT.reed);
    st.scale.y = h / 1.5;
    st.position.y = h / 2;
    st.rotation.z = rnd(-0.14, 0.14);
    g.add(st);
    const pl = new THREE.Mesh(plumeGeo, plumeMat);
    pl.position.set(st.rotation.z * -h * 0.5, h + 0.16, 0);
    pl.rotation.z = st.rotation.z;
    g.add(pl);
    g.position.set(x, -0.62, z);
    registerSway(g, 0.03, rnd(0.9, 1.4));
    group.add(g);
  }
  scene.add(group);
  return group;
}

// ---------- 睡莲（水面） ----------
export function makeLilies(scene, cx, cz, radius, count = 22) {
  const group = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = Math.sqrt(Math.random()) * radius * 0.82;
    const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
    const r = rnd(0.28, 0.55);
    const pad = new THREE.Mesh(new THREE.CircleGeometry(r, 14, 0.35, Math.PI * 2 - 0.7), MAT.lily);
    pad.rotation.x = -Math.PI / 2;
    pad.rotation.z = Math.random() * Math.PI * 2;
    pad.position.set(x, -0.5 + rnd(0, 0.03), z);
    group.add(pad);
    if (Math.random() < 0.22) {
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.2, 6), MAT.lotus);
      f.position.set(x, -0.42, z);
      f.rotation.x = Math.PI;
      group.add(f);
    }
  }
  scene.add(group);
  return group;
}

// ---------- 蝴蝶（3 只，飘飞） ----------
export function makeButterflies(scene, anchors) {
  const list = [];
  const wingMat = [
    new THREE.MeshStandardMaterial({ color: 0xf6e6a0, roughness: 0.6, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ color: 0xe9b7d0, roughness: 0.6, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ color: 0xc9dcf0, roughness: 0.6, side: THREE.DoubleSide }),
  ];
  for (let i = 0; i < 4; i++) {
    const g = new THREE.Group();
    const mat = wingMat[i % wingMat.length];
    const wingGeo = new THREE.CircleGeometry(0.1, 8, 0, Math.PI);
    const wl = new THREE.Mesh(wingGeo, mat);
    wl.rotation.y = -0.5;
    const wr = new THREE.Mesh(wingGeo, mat);
    wr.rotation.y = Math.PI + 0.5;
    g.add(wl, wr);
    g.scale.setScalar(0.9);
    scene.add(g);
    const a = anchors[i % anchors.length];
    list.push({
      g, wl, wr,
      base: new THREE.Vector3(a.x + rnd(-2, 2), a.y + rnd(0.6, 1.5), a.z + rnd(-2, 2)),
      phase: Math.random() * 10,
      speed: rnd(0.5, 0.9),
      radius: rnd(1.2, 2.6),
    });
  }
  return {
    update(t) {
      for (const b of list) {
        const p = t * b.speed + b.phase;
        b.g.position.set(
          b.base.x + Math.cos(p) * b.radius,
          b.base.y + Math.sin(p * 1.7) * 0.45,
          b.base.z + Math.sin(p * 0.8) * b.radius
        );
        b.g.rotation.y = -p * 0.6;
        const flap = Math.sin(t * 16 + b.phase) * 0.85;
        b.wl.rotation.z = flap;
        b.wr.rotation.z = -flap;
      }
    }
  };
}
