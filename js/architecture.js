// 江湖山庄 — 中式建筑构件体系（模块化，全部程序化几何）
import * as THREE from 'three';
import { colliders, terrainHeight } from './world.js?v=12';

// 配色：木 / 朱漆 / 青瓦 / 粉墙 / 石材
const M = {
  wood:   new THREE.MeshStandardMaterial({ color: 0x6b4f33, roughness: 0.85 }),
  woodDk: new THREE.MeshStandardMaterial({ color: 0x4a3524, roughness: 0.9 }),
  red:    new THREE.MeshStandardMaterial({ color: 0x8a4436, roughness: 0.78 }),
  redDk:  new THREE.MeshStandardMaterial({ color: 0x6e3229, roughness: 0.8 }),
  tile:   new THREE.MeshStandardMaterial({ color: 0x44566a, roughness: 0.7 }),
  tileLt: new THREE.MeshStandardMaterial({ color: 0x54677c, roughness: 0.68 }),
  plaster:new THREE.MeshStandardMaterial({ color: 0xe8dfca, roughness: 0.95 }),
  stone:  new THREE.MeshStandardMaterial({ color: 0x9a968a, roughness: 0.95 }),
  stoneDk:new THREE.MeshStandardMaterial({ color: 0x7d7a70, roughness: 0.95 }),
  gold:   new THREE.MeshStandardMaterial({ color: 0xc8a44a, roughness: 0.38, metalness: 0.65 }),
  paper:  new THREE.MeshStandardMaterial({ color: 0xf2c98a, emissive: 0xd98b3a, emissiveIntensity: 0.55, roughness: 0.6 }),
  lattic: new THREE.MeshStandardMaterial({ color: 0x5b4028, roughness: 0.8 }),
};

function box(w, h, d, mat, x, y, z, ry = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.rotation.y = ry;
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function place(g, x, z, ry = 0) { g.position.set(x, terrainHeight(x, z), z); g.rotation.y = ry; }

// 柱 + 柱础
function column(g, h, span, x = 0, y0 = 0, z = 0, r = 0.2, mat = M.red) {
  const col = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.88, r, h, 10), mat);
  col.position.set(x, y0 + h / 2, z); col.castShadow = true; g.add(col);
  // 柱础
  const base = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.5, r * 1.65, 0.16, 10), M.stone);
  base.position.set(x, y0 + 0.08, z); base.castShadow = true; g.add(base);
  return col;
}
function columnPair(g, h, span, mat = M.red) {
  for (const s of [-1, 1]) column(g, h, span, s * span / 2, 0, 0, 0.19, mat);
}

// 灯笼（暖色自发光小球 + 上下木箍 + 吊绳）
function lantern(g, x, y, z) {
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), M.paper);
  body.scale.set(1, 1.18, 1);
  body.position.set(x, y, z);
  g.add(body);
  for (const dy of [0.21, -0.21]) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.055, 8), M.woodDk);
    cap.position.set(x, y + dy, z);
    g.add(cap);
  }
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 4), M.woodDk);
  cord.position.set(x, y + 0.4, z);
  g.add(cord);
  const light = new THREE.PointLight(0xffb066, 0.55, 4.5, 2);
  light.position.set(x, y, z);
  g.add(light);
}

// 歇山屋顶：四坡主体 + 挑檐 + 正脊 + 两端翘头 + 檐角起翘
function roof(g, w, d, h, y, withRidgeOrn = true) {
  // 屋面主体
  const body = new THREE.Mesh(new THREE.ConeGeometry(1, h, 4), M.tile);
  body.scale.set(w * 0.78, 1, d * 0.78);
  body.rotation.y = Math.PI / 4;
  body.position.y = y + h / 2;
  body.castShadow = true; body.receiveShadow = true;
  g.add(body);

  // 挑檐：略外挑的薄板（中式屋顶最关键的轮廓线）
  const eave = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.11, 4), M.tileLt);
  eave.scale.set(w * 0.82, 1, d * 0.82);
  eave.rotation.y = Math.PI / 4;
  eave.position.y = y + 0.05;
  eave.castShadow = true;
  g.add(eave);

  // 檐口下缘（深色薄边，加深轮廓）
  const under = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.06, 4), M.woodDk);
  under.scale.set(w * 0.79, 1, d * 0.79);
  under.rotation.y = Math.PI / 4;
  under.position.y = y - 0.03;
  g.add(under);

  // 正脊
  g.add(box(w * 0.6, 0.14, 0.18, M.tileLt, 0, y + h, 0));
  g.add(box(w * 0.62, 0.05, 0.26, M.woodDk, 0, y + h - 0.1, 0));

  // 屋脊两端翘头（鸱吻意象）
  if (withRidgeOrn) {
    for (const s of [-1, 1]) {
      const orn = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.42, 5), M.tileLt);
      orn.position.set(s * w * 0.31, y + h + 0.19, 0);
      orn.rotation.z = -s * 0.5;
      orn.castShadow = true;
      g.add(orn);
    }
  }

  // 四角起翘
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const e = box(0.85, 0.07, 0.26, M.tileLt, sx * w * 0.44, y + h * 0.3, sz * d * 0.44, Math.PI / 4);
    e.rotation.z = -sx * 0.42; e.rotation.x = sz * 0.42;
    g.add(e);
    // 翘角下的戗脊
    const spur = box(0.5, 0.05, 0.1, M.tile, sx * w * 0.36, y + h * 0.18, sz * d * 0.36, Math.PI / 4);
    spur.rotation.z = -sx * 0.3; spur.rotation.x = sz * 0.3;
    g.add(spur);
  }
}

// 窗：木框 + 棂条（细格）
function latticeWindow(g, w, h, x, y, z, ry = 0) {
  const grp = new THREE.Group();
  grp.position.set(x, y, z); grp.rotation.y = ry;
  grp.add(box(w, h, 0.06, M.woodDk, 0, 0, 0));
  const nv = 3, nh = 4;
  for (let i = 1; i < nv; i++) {
    grp.add(box(0.035, h * 0.94, 0.03, M.lattic, -w / 2 + (w / nv) * i, 0, 0.035));
  }
  for (let j = 1; j < nh; j++) {
    grp.add(box(w * 0.94, 0.03, 0.03, M.lattic, 0, -h / 2 + (h / nh) * j, 0.035));
  }
  g.add(grp);
}

// ---------- 山门（入口牌楼） ----------
export function shanmen(scene, x, z, ry = 0) {
  const g = new THREE.Group();
  // 台阶 + 台基
  g.add(box(7.2, 0.4, 3.0, M.stoneDk, 0, 0.2, 0));
  g.add(box(6.4, 0.42, 2.6, M.stone, 0, 0.6, 0));
  // 两级台阶
  g.add(box(7.6, 0.18, 0.6, M.stoneDk, 0, 0.09, 1.75));
  g.add(box(8.2, 0.16, 0.6, M.stone, 0, 0.08, 2.3));

  for (const s of [-1, 1]) {
    column(g, 3.5, 4.4, s * 2.2, 0.8, 0, 0.22, M.red);
    // 鼓石
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.22, 12), M.stone);
    drum.rotation.z = Math.PI / 2;
    drum.position.set(s * 2.2, 0.92, 0.5);
    drum.castShadow = true; g.add(drum);
  }
  g.add(box(5.8, 0.32, 0.5, M.wood, 0, 4.3, 0));      // 大额枋
  g.add(box(5.8, 0.2, 0.4, M.redDk, 0, 3.95, 0));      // 小额枋
  // 斗拱意象（小方块叠）
  for (const s of [-1, 1]) {
    g.add(box(0.34, 0.22, 0.42, M.woodDk, s * 2.2, 4.55, 0));
    g.add(box(0.46, 0.14, 0.5, M.red, s * 2.2, 4.7, 0));
  }
  roof(g, 6.8, 3.4, 1.7, 4.6);

  // 匾额
  g.add(box(2.0, 0.66, 0.09, M.woodDk, 0, 4.05, 0.3));
  g.add(box(1.82, 0.5, 0.05, M.gold, 0, 4.05, 0.36));

  // 灯笼一对
  lantern(g, -2.0, 3.5, 0.35);
  lantern(g, 2.0, 3.5, 0.35);

  place(g, x, z, ry); scene.add(g);
  colliders.push({ x: x + Math.cos(ry) * -2.2, z: z - Math.sin(ry) * 2.2, r: 0.55 });
  colliders.push({ x: x + Math.cos(ry) * 2.2, z: z - Math.sin(ry) * -2.2, r: 0.55 });
  return g;
}

// ---------- 主宅：台基 + 前廊柱 + 粉墙 + 歇山顶 ----------
export function house(scene, x, z, ry = 0) {
  const g = new THREE.Group();
  const W = 11, D = 7.4;
  g.add(box(W + 1.6, 0.5, D + 1.6, M.stoneDk, 0, 0.25, 0));   // 台基
  g.add(box(W + 1.0, 0.24, D + 1.0, M.stone, 0, 0.62, 0));    // 台明
  // 台阶（正面三级）
  for (let i = 0; i < 3; i++) {
    g.add(box(3.6 - i * 0.2, 0.2, 0.5, M.stone, 0, 0.1 + i * 0.2, D / 2 + 1.05 - i * 0.45));
  }

  // 墙
  g.add(box(W, 3.0, 0.3, M.plaster, 0, 2.24, -D / 2 + 0.15));
  for (const s of [-1, 1]) g.add(box(0.3, 3.0, D, M.plaster, s * W / 2, 2.24, 0));

  // 墙顶木枋
  g.add(box(W + 0.4, 0.26, 0.42, M.wood, 0, 3.76, -D / 2 + 0.15));
  for (const s of [-1, 1]) g.add(box(0.42, 0.26, D, M.wood, s * W / 2, 3.76, 0));

  // 前廊柱（带柱础）
  for (let i = -2; i <= 2; i++) {
    column(g, 3.2, 0, i * 2.4, 0.74, D / 2 - 0.55, 0.18, M.red);
  }
  // 廊下横梁
  g.add(box(W + 0.6, 0.2, 0.26, M.wood, 0, 3.9, D / 2 - 0.55));

  // 门（双扇 + 门钉感）+ 门枕石
  g.add(box(2.2, 2.3, 0.14, M.woodDk, -2.6, 1.9, D / 2 - 0.55));
  g.add(box(2.2, 2.3, 0.14, M.woodDk, 2.6, 1.9, D / 2 - 0.55));
  g.add(box(2.36, 2.44, 0.06, M.redDk, -2.6, 1.9, D / 2 - 0.63));
  g.add(box(2.36, 2.44, 0.06, M.redDk, 2.6, 1.9, D / 2 - 0.63));
  // 中央格扇门
  latticeWindow(g, 1.7, 2.1, 0, 2.0, D / 2 - 0.58);

  // 侧窗（格子）
  latticeWindow(g, 1.8, 1.3, -4.1, 2.2, D / 2 - 0.12);
  latticeWindow(g, 1.8, 1.3, 4.1, 2.2, D / 2 - 0.12);

  // 灯笼一对（廊下）
  lantern(g, -3.6, 3.15, D / 2 - 0.55);
  lantern(g, 3.6, 3.15, D / 2 - 0.55);

  roof(g, W + 3.0, D + 3.2, 2.3, 3.95);
  place(g, x, z, ry); scene.add(g);
  colliders.push({ x, z, r: Math.max(W, D) * 0.55 });
  return g;
}

// ---------- 六角亭 + 中央石台（打坐点） ----------
export function pavilion(scene, x, z, ry = 0) {
  const g = new THREE.Group();
  const R = 2.6;

  // 台基（两层）
  const base1 = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.95, R + 1.15, 0.28, 6), M.stoneDk);
  base1.position.y = 0.14; base1.castShadow = true; base1.receiveShadow = true; g.add(base1);
  const base2 = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.6, R + 0.8, 0.32, 6), M.stone);
  base2.position.y = 0.44; base2.castShadow = true; base2.receiveShadow = true; g.add(base2);

  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3 + Math.PI / 6;
    const cx = Math.cos(a) * R, cz = Math.sin(a) * R;
    column(g, 2.7, 0, cx, 0.6, cz, 0.15, M.red);
    colliders.push({ x: x + Math.cos(ry + a) * R, z: z + Math.sin(ry + a) * R, r: 0.32 });
  }

  // 美人靠（柱子之间的矮栏杆 + 坐板）
  for (let i = 0; i < 6; i++) {
    const a0 = i * Math.PI / 3 + Math.PI / 6;
    const a1 = (i + 1) * Math.PI / 3 + Math.PI / 6;
    const mx = (Math.cos(a0) + Math.cos(a1)) / 2 * R;
    const mz = (Math.sin(a0) + Math.sin(a1)) / 2 * R;
    const seg = Math.hypot(Math.cos(a1) - Math.cos(a0), Math.sin(a1) - Math.sin(a0)) * R;
    const ang = Math.atan2(Math.sin(a1) - Math.sin(a0), Math.cos(a1) - Math.cos(a0));
    const rail = box(seg * 0.96, 0.09, 0.34, M.wood, mx, 1.02, mz, -ang);
    g.add(rail);
    const backr = box(seg * 0.96, 0.06, 0.08, M.woodDk, mx, 1.36, mz, -ang);
    g.add(backr);
    // 栏杆立柱
    g.add(box(0.07, 0.42, 0.07, M.woodDk, mx, 1.2, mz));
    // 仅在两柱之间（避开入口，入口在 i===0 那段）
    if (i !== 4) { rail.visible = true; backr.visible = true; }
  }

  // 亭顶：六坡 + 挑檐
  const top = new THREE.Mesh(new THREE.ConeGeometry(1, 1.5, 6), M.tile);
  top.scale.set(R + 1.2, 1, R + 1.2);
  top.rotation.y = Math.PI / 6;
  top.position.y = 3.75; top.castShadow = true; g.add(top);

  const eave = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.1, 6), M.tileLt);
  eave.scale.set(R + 1.42, 1, R + 1.42);
  eave.rotation.y = Math.PI / 6;
  eave.position.y = 3.02;
  eave.castShadow = true; g.add(eave);

  // 宝顶（莲瓣 + 顶珠）
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), M.gold);
  knob.position.y = 4.62; g.add(knob);
  const knob2 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), M.gold);
  knob2.position.y = 4.86; g.add(knob2);

  // 亭内匾额
  g.add(box(1.3, 0.4, 0.07, M.woodDk, 0, 2.62, R - 0.12));
  g.add(box(1.15, 0.26, 0.04, M.gold, 0, 2.62, R - 0.06));

  // 石台（打坐用）+ 蒲团
  const cushion = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.2, 18), M.stone);
  cushion.position.y = 0.72; cushion.receiveShadow = true; cushion.castShadow = true; g.add(cushion);
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.09, 16), M.redDk);
  pad.position.y = 0.86; g.add(pad);

  lantern(g, 0, 2.15, 0);

  place(g, x, z, ry); scene.add(g);
  return { group: g, cushionPos: new THREE.Vector3(x, terrainHeight(x, z) + 0.9, z) };
}

// ---------- 月洞门墙 ----------
export function moonGate(scene, x, z, ry = 0, w = 7, h = 2.8) {
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, 0); shape.lineTo(w / 2, 0); shape.lineTo(w / 2, h); shape.lineTo(-w / 2, h); shape.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 1.3, 1.2, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.42, bevelEnabled: false });
  const wall = new THREE.Mesh(geo, M.plaster);
  wall.castShadow = true; wall.receiveShadow = true;
  wall.position.z = -0.21;
  g.add(wall);

  // 洞口砖圈（双层，做出厚度）
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.1, 10, 32), M.stoneDk);
  ring.position.set(0, 1.3, 0.06); ring.castShadow = true; g.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.07, 8, 32), M.stone);
  ring2.position.set(0, 1.3, -0.16); g.add(ring2);

  // 压顶（瓦）
  g.add(box(w + 0.6, 0.26, 0.78, M.tile, 0, h + 0.13, 0));
  g.add(box(w + 0.7, 0.07, 0.86, M.tileLt, 0, h + 0.3, 0));
  // 墙裙
  g.add(box(w + 0.05, 0.5, 0.46, M.stone, 0, 0.25, 0));

  place(g, x, z, ry); scene.add(g);
  colliders.push({ x, z, r: w / 2 });
  return g;
}

// ---------- 回廊 ----------
export function corridor(scene, x, z, len, ry = 0) {
  const g = new THREE.Group();
  const n = Math.max(2, Math.floor(len / 2.2));
  for (let i = 0; i <= n; i++) {
    const t = -len / 2 + i * (len / n);
    for (const sz of [-1, 1]) {
      column(g, 2.5, 0, t, 0.2, sz * 1.0, 0.12, M.red);
    }
    // 座凳栏
    if (i < n) {
      const sx = -len / 2 + (i + 0.5) * (len / n);
      g.add(box(len / n - 0.15, 0.09, 0.26, M.wood, sx, 0.72, 1.0));
      g.add(box(len / n - 0.15, 0.09, 0.26, M.wood, sx, 0.72, -1.0));
    }
  }
  // 台基
  g.add(box(len + 0.8, 0.22, 3.0, M.stone, 0, 0.11, 0));
  // 顶（略斜的两坡）
  const roofA = box(len + 0.9, 0.16, 1.95, M.tile, 0, 2.85, 0.82);
  roofA.rotation.x = 0.19; g.add(roofA);
  const roofB = box(len + 0.9, 0.16, 1.95, M.tile, 0, 2.85, -0.82);
  roofB.rotation.x = -0.19; g.add(roofB);
  g.add(box(len + 1.0, 0.12, 0.2, M.tileLt, 0, 3.03, 0));
  // 檐下横枋
  g.add(box(len + 0.5, 0.16, 0.2, M.wood, 0, 2.6, 1.0));
  g.add(box(len + 0.5, 0.16, 0.2, M.wood, 0, 2.6, -1.0));

  place(g, x, z, ry); scene.add(g);
  return g;
}

// ---------- 影壁（砖雕照壁） ----------
export function screenWall(scene, x, z, ry = 0) {
  const g = new THREE.Group();
  g.add(box(4.0, 0.4, 0.7, M.stoneDk, 0, 0.2, 0));      // 须弥座
  g.add(box(3.6, 2.1, 0.36, M.plaster, 0, 1.45, 0));    // 壁身
  g.add(box(3.0, 1.4, 0.06, M.stone, 0, 1.5, 0.2));     // 砖雕面
  g.add(box(4.2, 0.3, 0.8, M.tile, 0, 2.6, 0));         // 瓦顶
  g.add(box(4.4, 0.08, 0.92, M.tileLt, 0, 2.76, 0));
  place(g, x, z, ry); scene.add(g);
  colliders.push({ x, z, r: 1.8 });
  return g;
}

// ---------- 总布局 ----------
export function buildVillage(scene) {
  shanmen(scene, 0, 26, Math.PI);
  house(scene, 0, -14, 0);
  const pav = pavilion(scene, -18, -12, 0.5);
  moonGate(scene, 14, 4, Math.PI / 2, 7, 2.8);
  corridor(scene, -9.5, -13, 10, Math.PI / 2);
  screenWall(scene, -8, 18, 0.2);
  screenWall(scene, 8, 18, -0.2);
  return pav;
}
