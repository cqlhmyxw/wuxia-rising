// 江湖山庄 — 植被与生机：松/阔叶/竹/灌木/草/芦苇/睡莲/蝶
import * as THREE from 'three';

const MAT = {
  trunk: new THREE.MeshStandardMaterial({ color: 0x5a4230, roughness: 0.95 }),
  trunkLight: new THREE.MeshStandardMaterial({ color: 0x6d5238, roughness: 0.95 }),
  pineDark: new THREE.MeshStandardMaterial({ color: 0x2f5530, roughness: 0.88 }),
  pineMid: new THREE.MeshStandardMaterial({ color: 0x3c6b38, roughness: 0.88 }),
  pineLight: new THREE.MeshStandardMaterial({ color: 0x4a7c40, roughness: 0.88 }),
  leafA: new THREE.MeshStandardMaterial({ color: 0x4f7f3c, roughness: 0.9 }),
  leafB: new THREE.MeshStandardMaterial({ color: 0x5f8f45, roughness: 0.9 }),
  leafC: new THREE.MeshStandardMaterial({ color: 0x6d9b4c, roughness: 0.9 }),
  leafD: new THREE.MeshStandardMaterial({ color: 0x436f36, roughness: 0.9 }),
  bamboo: new THREE.MeshStandardMaterial({ color: 0x7ba347, roughness: 0.75 }),
  bambooNode: new THREE.MeshStandardMaterial({ color: 0x648a3a, roughness: 0.8 }),
  bambooLeaf: new THREE.MeshStandardMaterial({ color: 0x86b154, roughness: 0.8, side: THREE.DoubleSide }),
  rock: new THREE.MeshStandardMaterial({ color: 0x7d8577, roughness: 1, flatShading: true }),
  rockDark: new THREE.MeshStandardMaterial({ color: 0x6a7264, roughness: 1, flatShading: true }),
  reed: new THREE.MeshStandardMaterial({ color: 0x8a9a5c, roughness: 0.9 }),
  lily: new THREE.MeshStandardMaterial({ color: 0x3f6b3a, roughness: 0.85, side: THREE.DoubleSide }),
  lotus: new THREE.MeshStandardMaterial({ color: 0xe8a6b8, roughness: 0.7 }),
};

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[(Math.random() * arr.length) | 0];

function m(geo, mat, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geo, mat);
  o.position.set(x, y, z);
  o.castShadow = true;
  return o;
}

// ---------- 松：分层错落锥体 ----------
export function makePine(s = 1) {
  const g = new THREE.Group();
  const h = rnd(2.0, 2.8) * s;
  // 树干（略带锥度）+ 根部隆起
  g.add(m(new THREE.CylinderGeometry(0.09 * s, 0.21 * s, h, 8), MAT.trunk, 0, h / 2, 0));
  g.add(m(new THREE.CylinderGeometry(0.2 * s, 0.3 * s, 0.3 * s, 8), MAT.trunk, 0, 0.12 * s, 0));

  // 4~5 层树冠，逐层缩小、随机偏移
  const layers = 4 + (Math.random() < 0.5 ? 1 : 0);
  let cy = h * 0.62;
  let cr = rnd(1.15, 1.5) * s;
  for (let i = 0; i < layers; i++) {
    const mat = i === 0 ? MAT.pineDark : (i % 2 ? MAT.pineMid : MAT.pineLight);
    const cone = m(new THREE.ConeGeometry(cr, cr * rnd(1.25, 1.6), 9), mat,
      rnd(-0.09, 0.09) * s, cy + cr * 0.42, rnd(-0.09, 0.09) * s);
    cone.rotation.y = Math.random() * Math.PI * 2;
    cone.rotation.z = rnd(-0.06, 0.06);
    g.add(cone);
    cy += cr * 0.55;
    cr *= 0.72;
  }
  // 顶梢
  g.add(m(new THREE.ConeGeometry(cr * 0.8, cr * 1.5, 8), MAT.pineLight, 0, cy + cr * 0.5, 0));
  return g;
}

// ---------- 阔叶：多团簇冠 ----------
export function makeBroadleaf(s = 1) {
  const g = new THREE.Group();
  const h = rnd(2.0, 2.6) * s;
  g.add(m(new THREE.CylinderGeometry(0.11 * s, 0.24 * s, h, 8), MAT.trunkLight, 0, h / 2, 0));

  // 2~3 根分叉枝
  const branches = 2 + (Math.random() * 2 | 0);
  const tips = [];
  for (let i = 0; i < branches; i++) {
    const a = (i / branches) * Math.PI * 2 + rnd(-0.4, 0.4);
    const len = rnd(0.5, 0.9) * s;
    const br = m(new THREE.CylinderGeometry(0.045 * s, 0.085 * s, len, 6), MAT.trunkLight,
      Math.cos(a) * len * 0.28, h - 0.1 * s + len * 0.3, Math.sin(a) * len * 0.28);
    br.rotation.z = Math.cos(a) * -0.55;
    br.rotation.x = Math.sin(a) * 0.55;
    g.add(br);
    tips.push({ x: Math.cos(a) * len * 0.62, y: h + len * 0.55, z: Math.sin(a) * len * 0.62 });
  }

  // 树冠：中心大团 + 周围小团，形成不规则轮廓
  const mats = [MAT.leafA, MAT.leafB, MAT.leafC, MAT.leafD];
  const baseR = rnd(1.1, 1.45) * s;
  const center = m(new THREE.IcosahedronGeometry(baseR, 1), pick(mats), 0, h + baseR * 0.72, 0);
  center.scale.set(1.1, 0.86, 1.1);
  g.add(center);

  const blobs = 4 + (Math.random() * 3 | 0);
  for (let i = 0; i < blobs; i++) {
    const t = tips[i % tips.length];
    const r = baseR * rnd(0.45, 0.72);
    const b = m(new THREE.IcosahedronGeometry(r, 1), pick(mats));
    b.position.set(
      t.x + rnd(-0.4, 0.4) * s,
      t.y + rnd(-0.25, 0.35) * s,
      t.z + rnd(-0.4, 0.4) * s
    );
    b.scale.set(1, rnd(0.75, 0.95), 1);
    b.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    g.add(b);
  }
  return g;
}

// ---------- 竹：竹竿带节 + 竹叶 ----------
export function makeBamboo(caneCount = 4) {
  const g = new THREE.Group();
  for (let i = 0; i < caneCount; i++) {
    const h = rnd(3.6, 6.2);
    const cane = new THREE.Group();
    const lean = rnd(-0.09, 0.09);
    // 分 3 段，做出轻微弯曲
    const segH = h / 3;
    for (let k = 0; k < 3; k++) {
      const r = 0.055 - k * 0.008;
      const seg = m(new THREE.CylinderGeometry(r, r + 0.008, segH, 7), MAT.bamboo, 0, segH * (k + 0.5), 0);
      seg.rotation.z = lean * (k + 1) * 0.5;
      cane.add(seg);
      // 竹节
      cane.add(m(new THREE.CylinderGeometry(r + 0.018, r + 0.018, 0.045, 7), MAT.bambooNode, 0, segH * (k + 0.6), 0));
    }
    // 竹叶：顶端几片细长叶
    for (let k = 0; k < 5; k++) {
      const leaf = m(new THREE.PlaneGeometry(0.075, rnd(0.5, 0.85)), MAT.bambooLeaf, 0, 0, 0);
      leaf.position.set(rnd(-0.35, 0.35), h - rnd(0, 1.1), rnd(-0.35, 0.35));
      leaf.rotation.set(rnd(-0.7, 0.7), Math.random() * Math.PI, rnd(-0.9, -0.2));
      leaf.castShadow = false;
      cane.add(leaf);
    }
    cane.position.set(rnd(-0.7, 0.7), 0, rnd(-0.7, 0.7));
    cane.rotation.y = Math.random() * Math.PI * 2;
    g.add(cane);
  }
  return g;
}

// ---------- 灌木 ----------
export function makeShrub(s = 1) {
  const g = new THREE.Group();
  const mats = [MAT.leafA, MAT.leafB, MAT.leafD];
  const n = 2 + (Math.random() * 3 | 0);
  for (let i = 0; i < n; i++) {
    const r = rnd(0.3, 0.55) * s;
    const b = m(new THREE.IcosahedronGeometry(r, 1), pick(mats),
      rnd(-0.32, 0.32) * s, r * rnd(0.55, 0.95), rnd(-0.32, 0.32) * s);
    b.scale.set(1, rnd(0.65, 0.85), 1);
    b.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    g.add(b);
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

// ---------- 草丛（InstancedMesh，一次 draw call） ----------
export function makeGrassField(scene, samples, count = 2600) {
  const geo = new THREE.ConeGeometry(0.055, 0.42, 3);
  geo.translate(0, 0.21, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0x6f9048, roughness: 0.95 });
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
    dummy.rotation.set(rnd(-0.16, 0.16), Math.random() * Math.PI * 2, rnd(-0.16, 0.16));
    const s = rnd(0.7, 1.5);
    dummy.scale.set(s, s * rnd(0.8, 1.5), s);
    dummy.updateMatrix();
    inst.setMatrixAt(n, dummy.matrix);
    // 颜色微差：偏黄绿到深绿
    const k = Math.random();
    color.setRGB(0.32 + k * 0.2, 0.44 + k * 0.22, 0.2 + k * 0.1);
    inst.setColorAt(n, color);
    n++;
  }
  inst.count = n;
  inst.instanceMatrix.needsUpdate = true;
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  scene.add(inst);
  return inst;
}

// ---------- 野花（小簇） ----------
export function makeFlowers(scene, samples, count = 180) {
  const stemGeo = new THREE.CylinderGeometry(0.012, 0.014, 0.3, 4);
  stemGeo.translate(0, 0.15, 0);
  const headGeo = new THREE.SphereGeometry(0.055, 7, 6);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x5d7c3c, roughness: 0.9 });
  const colors = [0xf2e6a8, 0xf0c8d4, 0xe8e8ec, 0xd9a6c4, 0xf7f0c0];

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
    // 荷叶：带缺口的圆（用 CircleGeometry 的 thetaLength 做出豁口）
    const pad = new THREE.Mesh(new THREE.CircleGeometry(r, 14, 0.35, Math.PI * 2 - 0.7), MAT.lily);
    pad.rotation.x = -Math.PI / 2;
    pad.rotation.z = Math.random() * Math.PI * 2;
    pad.position.set(x, -0.5 + rnd(0, 0.03), z);
    group.add(pad);
    // 少量荷花
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
