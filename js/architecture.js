// 江湖山庄 — 中式建筑构件体系（模块化，全部程序化几何）
import * as THREE from 'three';
import { colliders, terrainHeight } from './world.js';

// 配色：木 / 朱漆 / 青瓦 / 粉墙 / 石材
const M = {
  wood:   new THREE.MeshStandardMaterial({ color: 0x6b4f33, roughness: 0.85 }),
  woodDk: new THREE.MeshStandardMaterial({ color: 0x503a26, roughness: 0.9 }),
  red:    new THREE.MeshStandardMaterial({ color: 0x8a4436, roughness: 0.8 }),
  tile:   new THREE.MeshStandardMaterial({ color: 0x46586a, roughness: 0.75 }),
  plaster:new THREE.MeshStandardMaterial({ color: 0xe6ddc8, roughness: 0.95 }),
  stone:  new THREE.MeshStandardMaterial({ color: 0x9a968a, roughness: 0.95 }),
  gold:   new THREE.MeshStandardMaterial({ color: 0xc8a44a, roughness: 0.4, metalness: 0.6 }),
};

function box(w, h, d, mat, x, y, z, ry = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.rotation.y = ry;
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function place(g, x, z, ry = 0) { g.position.set(x, terrainHeight(x, z), z); g.rotation.y = ry; }

// 柱 + 梁的门架
function columnPair(g, h, span, mat = M.red) {
  for (const s of [-1, 1]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, h, 8), mat);
    col.position.set(s * span / 2, h / 2, 0); col.castShadow = true; g.add(col);
  }
}

// 歇山小屋顶：主体四坡 + 端头起翘
function roof(g, w, d, h, y) {
  const body = new THREE.Mesh(new THREE.ConeGeometry(1, h, 4), M.tile);
  body.scale.set(w * 0.78, 1, d * 0.78);
  body.rotation.y = Math.PI / 4;
  body.position.y = y + h / 2;
  body.castShadow = true; g.add(body);
  // 正脊
  const ridge = box(w * 0.62, 0.16, 0.2, M.woodDk, 0, y + h, 0);
  g.add(ridge);
  // 四角起翘（小翘角块）
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const e = box(0.7, 0.08, 0.24, M.tile, sx * w * 0.42, y + h * 0.36, sz * d * 0.42, Math.PI / 4);
    e.rotation.z = -sx * 0.35; e.rotation.x = sz * 0.35;
    g.add(e);
  }
}

// 山门（入口牌楼）
export function shanmen(scene, x, z, ry = 0) {
  const g = new THREE.Group();
  const base = box(6, 0.5, 2.4, M.stone, 0, 0.25, 0); g.add(base);
  columnPair(g, 3.4, 4.4);
  g.add(box(5.6, 0.35, 0.5, M.wood, 0, 3.5, 0));           // 大额枋
  g.add(box(5.6, 0.22, 0.4, M.red, 0, 3.1, 0));            // 小额枋
  roof(g, 6.4, 3.2, 1.5, 3.7);
  const plaque = box(1.9, 0.62, 0.1, M.woodDk, 0, 3.28, 0.28);
  g.add(plaque);
  g.add(box(1.7, 0.4, 0.06, M.gold, 0, 3.28, 0.34));       // 匾额底光
  place(g, x, z, ry); scene.add(g);
  colliders.push({ x: x + Math.cos(ry) * -2.2, z: z - Math.sin(ry) * 2.2, r: 0.5 });
  colliders.push({ x: x + Math.cos(ry) * 2.2, z: z - Math.sin(ry) * -2.2, r: 0.5 });
  return g;
}

// 主宅：台基 + 前廊柱 + 粉墙 + 歇山顶
export function house(scene, x, z, ry = 0) {
  const g = new THREE.Group();
  const W = 11, D = 7.4;
  g.add(box(W + 1.2, 0.6, D + 1.2, M.stone, 0, 0.3, 0));    // 台基
  // 后墙与侧墙（粉墙留正面开敞）
  g.add(box(W, 2.9, 0.3, M.plaster, 0, 2.1, -D / 2 + 0.15));
  for (const s of [-1, 1]) g.add(box(0.3, 2.9, D, M.plaster, s * W / 2, 2.1, 0));
  // 墙顶木枋
  g.add(box(W + 0.3, 0.25, 0.4, M.wood, 0, 3.6, -D / 2 + 0.15));
  for (const s of [-1, 1]) g.add(box(0.4, 0.25, D, M.wood, s * W / 2, 3.6, 0));
  // 前廊柱
  for (let i = -2; i <= 2; i++) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 3.2, 8), M.red);
    col.position.set(i * 2.4, 2.2, D / 2 - 0.5); col.castShadow = true; g.add(col);
  }
  // 门（双扇）+ 窗
  g.add(box(2.2, 2.2, 0.12, M.woodDk, -2.6, 1.4, D / 2 - 0.5));
  g.add(box(2.2, 2.2, 0.12, M.woodDk, 2.6, 1.4, D / 2 - 0.5));
  g.add(box(1.6, 1.4, 0.1, M.woodDk, 0, 1.9, D / 2 - 0.5));
  roof(g, W + 2.4, D + 2.6, 2.1, 3.7);
  place(g, x, z, ry); scene.add(g);
  colliders.push({ x, z, r: Math.max(W, D) * 0.55 });
  return g;
}

// 六角亭 + 中央石台（打坐点锚定在此）
export function pavilion(scene, x, z, ry = 0) {
  const g = new THREE.Group();
  const R = 2.6;
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(R + 0.7, R + 0.9, 0.5, 6), M.stone));
  g.children[0].position.y = 0.25;
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3 + Math.PI / 6;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 2.9, 8), M.red);
    col.position.set(Math.cos(a) * R, 1.95, Math.sin(a) * R);
    col.castShadow = true; g.add(col);
    colliders.push({ x: x + Math.cos(ry + a) * R, z: z + Math.sin(ry + a) * R, r: 0.3 });
  }
  const top = new THREE.Mesh(new THREE.ConeGeometry(1, 1.4, 6), M.tile);
  top.scale.set(R + 1.15, 1, R + 1.15);
  top.rotation.y = Math.PI / 6;
  top.position.y = 3.6; top.castShadow = true; g.add(top);
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), M.gold);
  finial.position.y = 4.4; g.add(finial);
  // 石台（打坐用）
  const cushion = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.22, 16), M.stone);
  cushion.position.y = 0.61; cushion.receiveShadow = true; g.add(cushion);
  place(g, x, z, ry); scene.add(g);
  return { group: g, cushionPos: new THREE.Vector3(x, terrainHeight(x, z) + 0.72, z) };
}

// 月洞门墙（Shape 挖圆洞）
export function moonGate(scene, x, z, ry = 0, w = 7, h = 2.6) {
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, 0); shape.lineTo(w / 2, 0); shape.lineTo(w / 2, h); shape.lineTo(-w / 2, h); shape.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 1.25, 1.15, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.4, bevelEnabled: false });
  const wall = new THREE.Mesh(geo, M.plaster);
  wall.castShadow = true; wall.receiveShadow = true;
  wall.position.y = 0; wall.position.z = -0.2;
  g.add(wall);
  // 洞口砖圈
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.09, 8, 28), M.stone);
  ring.position.set(0, 1.25, 0.05); g.add(ring);
  // 压顶
  g.add(box(w + 0.4, 0.28, 0.7, M.tile, 0, h + 0.14, 0));
  place(g, x, z, ry); scene.add(g);
  colliders.push({ x, z, r: w / 2 }); // 近似：整段墙不可穿越（两侧绕行）
  return g;
}

// 回廊（连接主宅与亭）
export function corridor(scene, x, z, len, ry = 0) {
  const g = new THREE.Group();
  const n = Math.floor(len / 2.2);
  for (let i = 0; i <= n; i++) {
    const t = -len / 2 + i * (len / n);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 2.6, 8), M.red);
    col.position.set(t, 1.5, -1); col.castShadow = true; g.add(col);
    const col2 = col.clone(); col2.position.z = 1; g.add(col2);
  }
  const roofStrip = box(len + 0.6, 0.18, 3.2, M.tile, 0, 3.05, 0);
  roofStrip.rotation.z = 0.1; g.add(roofStrip);
  place(g, x, z, ry); scene.add(g);
  return g;
}

// 总布局：山门(南) → 石板路 → 主宅(北) ；亭(西) ；月洞门(东) 通花园
export function buildVillage(scene) {
  shanmen(scene, 0, 26, Math.PI);
  house(scene, 0, -14, 0);
  const pav = pavilion(scene, -18, -12, 0.5);
  moonGate(scene, 14, 4, Math.PI / 2, 7, 2.6);
  corridor(scene, -9.5, -13, 10, Math.PI / 2);
  // 影壁一对
  const mb1 = box(3.4, 2.2, 0.4, M.plaster, -8, 1.1 + terrainHeight(-8, 18), 18, 0.2);
  scene.add(mb1);
  const mb2 = mb1.clone(); mb2.position.x = 8; mb2.rotation.y = -0.2; scene.add(mb2);
  colliders.push({ x: -8, z: 18, r: 1.6 }, { x: 8, z: 18, r: 1.6 });
  return pav;
}
