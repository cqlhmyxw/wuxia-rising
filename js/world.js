// 江湖山庄 — 地形·水·植被
import * as THREE from 'three';

export const POND = { x: 35, z: -18, r: 11.5, waterY: -0.55 };
export const colliders = []; // {x,z,r}
export const world = { animate: null }; // 动画钩子

// 平滑阶梯
function smooth(a, b, v) { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); }
function noise2(x, z) { return Math.sin(x * 0.05 + 1.3) * Math.cos(z * 0.042 + 0.7) + 0.6 * Math.sin(x * 0.11 + 4) * Math.sin(z * 0.09 + 2) + 0.35 * Math.sin(x * 0.23) * Math.cos(z * 0.19); }

// 中心广场半径，在此范围内地势被压平
export const PLAZA_R = 24;

export function terrainHeight(x, z) {
  let h = noise2(x, z) * 1.1;
  const r = Math.sqrt(x * x + z * z);
  // 外围山脊
  h += smooth(62, 108, r) * (9 + 6 * noise2(x * 0.6, z * 0.6));
  // 池塘凹陷
  const pd = Math.sqrt((x - POND.x) ** 2 + (z - POND.z) ** 2);
  h -= 3 * Math.exp(-(pd * pd) / (2 * 10 * 10));
  // 中央广场压平
  const f = smooth(PLAZA_R, PLAZA_R + 9, r);
  h *= f;
  return h;
}

function terrainColor(x, z, y, out) {
  const r = Math.sqrt(x * x + z * z);
  const n = 0.5 + 0.5 * Math.sin(x * 0.31 + z * 0.27);
  // 草地基色
  let cr = 0.42 + 0.06 * n, cg = 0.55 + 0.08 * n, cb = 0.30;
  // 高处 → 岩石灰绿
  if (y > 5) { const t = Math.min(1, (y - 5) / 8); cr = cr * (1 - t) + 0.52 * t; cg = cg * (1 - t) + 0.58 * t; cb = cb * (1 - t) + 0.55 * t; }
  // 广场 → 夯土
  const pz = 1 - smooth(PLAZA_R - 4, PLAZA_R, r);
  cr = cr * (1 - pz) + 0.72 * pz; cg = cg * (1 - pz) + 0.66 * pz; cb = cb * (1 - pz) + 0.52 * pz;
  // 池边 → 沙岸
  const pd = Math.sqrt((x - POND.x) ** 2 + (z - POND.z) ** 2);
  if (pd < POND.r + 4) { const t = 1 - smooth(POND.r + 1, POND.r + 4, pd); cr = cr * (1 - t) + 0.78 * t; cg = cg * (1 - t) + 0.70 * t; cb = cb * (1 - t) + 0.52 * t; }
  out.r = cr; out.g = cg; out.b = cb;
}

export function buildWorld(scene) {
  // ---------- 地形 ----------
  const SIZE = 240, SEG = 130;
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

  // ---------- 池塘水面 ----------
  const waterGeo = new THREE.CircleGeometry(POND.r, 48);
  waterGeo.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(waterGeo, new THREE.MeshStandardMaterial({
    color: 0x3f6d7d, transparent: true, opacity: 0.82, roughness: 0.15, metalness: 0.1
  }));
  water.position.set(POND.x, POND.waterY, POND.z);
  scene.add(water);
  // 涟漪环（缓慢扩散的高光圈，给水面一点生命）
  const ripple = new THREE.Mesh(new THREE.RingGeometry(1, 1.08, 40),
    new THREE.MeshBasicMaterial({ color: 0xcfe8ec, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
  ripple.rotation.x = -Math.PI / 2;
  ripple.position.set(POND.x, POND.waterY + 0.03, POND.z);
  scene.add(ripple);
  world.animate = (t, dt) => {
    water.position.y = POND.waterY + Math.sin(t * 0.7) * 0.03;
    const s = (t * 0.22) % 1;
    ripple.scale.setScalar(1 + s * 9);
    ripple.material.opacity = 0.32 * (1 - s);
  };
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

  // ---------- 植被 ----------
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5f4630, roughness: 0.95 });
  const pineMat = new THREE.MeshStandardMaterial({ color: 0x3e6b34, roughness: 0.9 });
  const leafMats = [0x4e7d3a, 0x5c8a42, 0x47743a].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 }));
  const bambooMat = new THREE.MeshStandardMaterial({ color: 0x6f9a4a, roughness: 0.8 });

  function pine(x, z, s) {
    const g = new THREE.Group();
    const h = 2.2 * s;
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * s, 0.2 * s, h, 6), trunkMat);
    tr.position.y = h / 2; tr.castShadow = true; g.add(tr);
    let cy = h, cr = 1.5 * s;
    for (let i = 0; i < 3; i++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(cr, cr * 1.5, 7), pineMat);
      cone.position.y = cy + cr * 0.6; cone.castShadow = true; g.add(cone);
      cy += cr * 0.8; cr *= 0.68;
    }
    g.position.set(x, terrainHeight(x, z), z);
    g.rotation.y = Math.random() * Math.PI * 2;
    scene.add(g);
    colliders.push({ x, z, r: 0.55 * s });
  }
  function broadleaf(x, z, s) {
    const g = new THREE.Group();
    const h = 2.4 * s;
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * s, 0.24 * s, h, 6), trunkMat);
    tr.position.y = h / 2; tr.castShadow = true; g.add(tr);
    const cr = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6 * s, 0), leafMats[(Math.random() * 3) | 0]);
    cr.position.y = h + 0.9 * s; cr.castShadow = true; g.add(cr);
    g.position.set(x, terrainHeight(x, z), z);
    g.rotation.y = Math.random() * Math.PI * 2;
    scene.add(g);
    colliders.push({ x, z, r: 0.6 * s });
  }
  function bamboo(x, z) {
    const g = new THREE.Group();
    const n = 3 + (Math.random() * 3 | 0);
    for (let i = 0; i < n; i++) {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 4 + Math.random() * 2.5, 5), bambooMat);
      b.position.set((Math.random() - 0.5) * 0.9, b.geometry.parameters.height / 2, (Math.random() - 0.5) * 0.9);
      b.castShadow = true; g.add(b);
    }
    g.position.set(x, terrainHeight(x, z), z);
    scene.add(g);
    colliders.push({ x, z, r: 0.8 });
  }

  // 广场内点缀几棵树（避开中轴与建筑）
  broadleaf(-14, 8, 1.1); broadleaf(14, 10, 1.2); pine(-16, -4, 1.0); broadleaf(12, -6, 0.9);
  // 竹林：东北角
  for (let i = 0; i < 14; i++) {
    const a = -0.5 + Math.random() * 0.5, d = 30 + Math.random() * 14;
    bamboo(Math.cos(a) * d + 6, Math.sin(a) * d - 26);
  }
  // 外围成片树林
  for (let i = 0; i < 90; i++) {
    const a = Math.random() * Math.PI * 2, d = 34 + Math.random() * 55;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (Math.sqrt((x - POND.x) ** 2 + (z - POND.z) ** 2) < POND.r + 5) continue;
    if (Math.random() < 0.6) pine(x, z, 0.8 + Math.random() * 0.9);
    else broadleaf(x, z, 0.8 + Math.random() * 0.8);
  }

  // ---------- 溪石 ----------
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x7d8577, roughness: 1 });
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2, d = POND.r + 1.5 + Math.random() * 3;
    const x = POND.x + Math.cos(a) * d, z = POND.z + Math.sin(a) * d;
    const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25 + Math.random() * 0.4, 0), rockMat);
    rk.position.set(x, POND.waterY + 0.1, z);
    rk.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    rk.castShadow = true;
    scene.add(rk);
  }
}
