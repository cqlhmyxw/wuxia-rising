// 角色 v2：仙侠侠客（织物纹理多层衣袍 + 半透纱 + 及腰长发 + 波动披帛 + 背剑）
// 对标燕云立绘：月白主袍/黛青暗纹/朱砂束带/广袖/长发束/飘带细长流动
// 接口：buildCharacter() -> { group, update(t,dt,moving,airborne,running), toggleHat, ready }
// 约定：角色正面朝 -Z（与 main.js 移动朝向公式 front=(-sinα,-cosα) 对齐）
import * as THREE from 'three';

// ---------- 程序化布料贴图：织纹 + 晕染 + 黛青暗纹 ----------
function clothTexture(base = '#ece5d3', motif = 'rgba(52,84,99,', density = 1) {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, 512, 512);
  // 经纬织纹
  for (let i = 0; i < 512; i += 3) { x.fillStyle = 'rgba(110,100,80,0.055)'; x.fillRect(0, i, 512, 1); }
  for (let i = 0; i < 512; i += 3) { x.fillStyle = 'rgba(110,100,80,0.045)'; x.fillRect(i, 0, 1, 512); }
  // 晕染（染色不均匀感）
  for (let i = 0; i < 46; i++) {
    const px = Math.random() * 512, py = Math.random() * 512, r = 30 + Math.random() * 90;
    const g = x.createRadialGradient(px, py, 0, px, py, r);
    const dark = Math.random() < 0.5;
    g.addColorStop(0, dark ? 'rgba(150,140,115,0.06)' : 'rgba(255,252,244,0.07)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
  }
  // 黛青云纹暗花（疏密可控）
  x.lineWidth = 1.4;
  for (let i = 0; i < 26 * density; i++) {
    const px = Math.random() * 512, py = Math.random() * 512, r = 14 + Math.random() * 26;
    x.strokeStyle = motif + (0.10 + Math.random() * 0.10) + ')';
    x.beginPath();
    x.arc(px, py, r, Math.PI * 0.9, Math.PI * 1.9);
    x.stroke();
    x.beginPath();
    x.arc(px + r * 0.7, py - r * 0.35, r * 0.55, Math.PI, Math.PI * 2.2);
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------- 程序化头发贴图：发丝条纹 ----------
function hairTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512;
  const x = c.getContext('2d');
  x.fillStyle = '#231d19'; x.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 220; i++) {
    const px = Math.random() * 256;
    x.strokeStyle = Math.random() < 0.6 ? 'rgba(70,58,48,0.35)' : 'rgba(10,8,6,0.5)';
    x.lineWidth = 0.8 + Math.random();
    x.beginPath(); x.moveTo(px, -10);
    x.bezierCurveTo(px + (Math.random() - 0.5) * 30, 170, px + (Math.random() - 0.5) * 30, 340, px + (Math.random() - 0.5) * 20, 522);
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildCharacter() {
  const group = new THREE.Group();
  const inner = new THREE.Group();
  group.add(inner);

  const C = {
    skin: 0xeed3b2, robe: 0xf0e9d8, gauze: 0xf3eee0, sash: 0xa8342a,
    trim: 0x2f4d5c, hair: 0x241d18, jade: 0x7fae9a, steel: 0xb9c2c8,
    scabbard: 0x2c2c30, tassel: 0xa8342a,
  };

  const clothTex = clothTexture(); clothTex.repeat.set(2, 2);
  const hairTex = hairTexture(); hairTex.repeat.set(1, 2);

  const skin = new THREE.MeshStandardMaterial({ color: C.skin, roughness: 0.62 });
  const robe = new THREE.MeshStandardMaterial({ map: clothTex, color: 0xffffff, roughness: 0.9 });
  const robeIn = new THREE.MeshStandardMaterial({ color: 0xd9d0ba, roughness: 0.95 }); // 里衬
  const gauze = new THREE.MeshStandardMaterial({          // 外层纱（仙气关键）
    color: C.gauze, roughness: 0.75, transparent: true, opacity: 0.42,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const trim = new THREE.MeshStandardMaterial({ color: C.trim, roughness: 0.85 });
  const sash = new THREE.MeshStandardMaterial({ color: C.sash, roughness: 0.8 });
  const silk = new THREE.MeshStandardMaterial({           // 披帛：丝缎
    color: 0xd9483a, roughness: 0.42, metalness: 0.06, side: THREE.DoubleSide,
  });
  const hairMat = new THREE.MeshStandardMaterial({ map: hairTex, color: 0xffffff, roughness: 0.5 });
  const jade = new THREE.MeshStandardMaterial({ color: C.jade, roughness: 0.25, metalness: 0.1 });
  const steel = new THREE.MeshStandardMaterial({ color: C.steel, metalness: 0.7, roughness: 0.3 });
  const scab = new THREE.MeshStandardMaterial({ color: C.scabbard, roughness: 0.55 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x5a4026, roughness: 0.7 });
  const straw = new THREE.MeshStandardMaterial({ color: 0x8a6d44, roughness: 0.95 });

  // ---------- 主袍：收腰轮廓（织物贴图） ----------
  const pts = [
    new THREE.Vector2(0.02, 0.0), new THREE.Vector2(0.31, 0.04),
    new THREE.Vector2(0.34, 0.14), new THREE.Vector2(0.28, 0.5),
    new THREE.Vector2(0.16, 0.88), new THREE.Vector2(0.19, 1.08),
    new THREE.Vector2(0.22, 1.32), new THREE.Vector2(0.17, 1.48),
    new THREE.Vector2(0.10, 1.55), new THREE.Vector2(0.0, 1.58),
  ];
  const robeMesh = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), robe);
  robeMesh.castShadow = true;
  inner.add(robeMesh);

  // ---------- 外层纱袍（比主袍大一圈，下摆更张，半透明） ----------
  const gPts = [
    new THREE.Vector2(0.10, 0.02), new THREE.Vector2(0.40, 0.10),
    new THREE.Vector2(0.34, 0.52), new THREE.Vector2(0.21, 0.92),
    new THREE.Vector2(0.25, 1.22), new THREE.Vector2(0.20, 1.46),
    new THREE.Vector2(0.0, 1.52),
  ];
  const gauzeRobe = new THREE.Mesh(new THREE.LatheGeometry(gPts, 28), gauze);
  gauzeRobe.castShadow = false;
  inner.add(gauzeRobe);

  // 交领（里衬露出 + 黛青滚边）
  const collar = new THREE.Mesh(
    new THREE.RingGeometry(0.055, 0.175, 18, 1, Math.PI * 0.12, Math.PI * 0.76), robeIn);
  collar.position.set(0, 1.34, -0.12);
  collar.rotation.x = -Math.PI / 2 + 0.42;
  inner.add(collar);
  const collarTrim = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.014, 6, 22), trim);
  collarTrim.position.set(0, 1.34, -0.12);
  collarTrim.rotation.x = Math.PI / 2 - 0.42;
  inner.add(collarTrim);

  // ---------- 腰带（朱砂）+ 玉佩 + 垂穗 ----------
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.045, 8, 24), sash);
  belt.position.y = 0.88; belt.rotation.x = Math.PI / 2; belt.castShadow = true;
  inner.add(belt);
  const beltBand = new THREE.Mesh(new THREE.CylinderGeometry(0.215, 0.215, 0.09, 24, 1, true), sash);
  beltBand.position.y = 0.88; inner.add(beltBand);
  const pendant = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.012, 8, 16), jade);
  pendant.position.set(0.08, 0.72, -0.19); inner.add(pendant);
  const pendantTassel = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.004, 0.14, 5), sash);
  pendantTassel.position.set(0.08, 0.60, -0.19); inner.add(pendantTassel);

  // ---------- 链式飘带：波动沿长度传播（飘逸核心） ----------
  // 返回节点数组；update 里按 相位滞后 依次摆动 → 波从根传到梢
  function chain(root, n, segLen, mesh) {
    const nodes = []; let p = root;
    for (let i = 0; i < n; i++) {
      const g = new THREE.Group();
      g.position.y = -segLen;
      const m = mesh(i);
      m.position.y = -segLen / 2;
      g.add(m);
      p.add(g);
      p = g; nodes.push(g);
    }
    return nodes;
  }
  const segPlane = (w) => new THREE.PlaneGeometry(w, 0.22);

  // 披帛 ×2：从肩后出发，极长（10 段 × 0.22 = 2.2m），细长流动
  function makePibo(side) {
    const root = new THREE.Group();
    root.position.set(side * 0.17, 1.44, 0.08);
    root.rotation.x = -0.85;            // 向后上扬的基准
    inner.add(root);
    const nodes = chain(root, 10, 0.22, () => new THREE.Mesh(segPlane(0.055), silk));
    return { root, nodes };
  }
  const piboL = makePibo(1), piboR = makePibo(-1);

  // ---------- 广袖：宽口双层（外层纱） ----------
  function makeSleeve(side) {
    const g = new THREE.Group();
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.175, 0.82, 10, 1, true), robe);
    s.position.y = -0.41; s.castShadow = true; g.add(s);
    const gs = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.21, 0.86, 10, 1, true), gauze);
    gs.position.y = -0.43; g.add(gs);
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.175, 0.014, 6, 18), trim);
    cuff.position.y = -0.81; cuff.rotation.x = Math.PI / 2; g.add(cuff);
    // 露出的手
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), skin);
    hand.position.y = -0.86; g.add(hand);
    g.position.set(side * 0.21, 1.44, 0);
    g.rotation.z = side * 0.16;
    inner.add(g);
    return g;
  }
  const sleeveL = makeSleeve(1), sleeveR = makeSleeve(-1);

  // ---------- 头 / 面容 ----------
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 16), skin);
  head.scale.set(0.92, 1.06, 0.96);                 // 略拉长的脸型
  head.position.y = 1.72; head.castShadow = true;
  inner.add(head);
  // 眉眼（正面 -Z）：细弯眉 + 眼线
  function faceLine(w, x, y, rz, mat) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(w, 0.006, 4, 12, Math.PI * 0.8), mat);
    m.position.set(x, y, -0.132);
    m.rotation.z = rz;
    m.rotation.x = -0.15;
    head.add(m);
    return m;
  }
  const ink = new THREE.MeshStandardMaterial({ color: 0x1a1512, roughness: 0.6 });
  faceLine(0.026, -0.055, 1.755 - 1.72 + 0.02, Math.PI * 0.62, ink); // 左眼线
  faceLine(0.026, 0.055, 0.055, Math.PI * 0.62, ink);                // 右眼线（镜像相位）
  faceLine(0.030, -0.062, 0.095, Math.PI * 0.55, ink);               // 眉
  faceLine(0.030, 0.062, 0.095, Math.PI * 0.55, ink);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.006, 4, 10, Math.PI), 
    new THREE.MeshStandardMaterial({ color: 0xb4625a, roughness: 0.55 }));
  lip.position.set(0, -0.045, -0.138); lip.rotation.z = Math.PI; lip.rotation.x = -0.2;
  head.add(lip);

  // ---------- 长发：发冠 + 及腰长发束（链式，会摆） ----------
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.158, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.64), hairMat);
  hairCap.position.y = 1.735; hairCap.scale.set(0.95, 1.05, 0.98);
  inner.add(hairCap);
  const bun = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), hairMat);
  bun.scale.set(1, 0.75, 1); bun.position.y = 1.90;
  inner.add(bun);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.05, 10), jade);
  crown.position.y = 1.965; inner.add(crown);
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 0.34, 6), wood);
  pin.position.y = 1.90; pin.rotation.z = Math.PI / 2; pin.rotation.y = 0.2;
  inner.add(pin);
  // 及腰长发束 ×3（脑后垂落，链式摆动）
  function makeHairStrand(x, z, w, n) {
    const root = new THREE.Group();
    root.position.set(x, 1.80, z);
    root.rotation.x = -0.5;            // 贴背垂落（+Z 为背后）
    inner.add(root);
    const nodes = chain(root, n, 0.17, () => new THREE.Mesh(segPlane(w), hairMat));
    return { root, nodes };
  }
  const hairC = makeHairStrand(0, 0.13, 0.10, 7);
  const hairL = makeHairStrand(-0.07, 0.11, 0.06, 6);
  const hairR = makeHairStrand(0.07, 0.11, 0.06, 6);

  // ---------- 斗笠（可切换，默认隐藏） ----------
  const hat = new THREE.Group();
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.035, 24), straw);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.24, 24), straw);
  cone.position.y = 0.13;
  hat.add(brim, cone);
  hat.position.y = 1.86; hat.visible = false;
  hat.castShadow = true;
  inner.add(hat);

  // ---------- 背后长剑（+Z = 背面）：鞘 + 剑柄 + 剑穗 ----------
  const sword = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.5, 0.011), steel);
  blade.position.y = 0.28;
  const guard = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.022, 12), steel);
  const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.17, 8), wood);
  hilt.position.y = -0.10;
  const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), steel);
  pommel.position.y = -0.19;
  const knot = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.003, 0.16, 5), sash); // 剑穗
  knot.position.set(0.02, -0.28, 0); knot.rotation.z = 0.25;
  sword.add(blade, guard, hilt, pommel, knot);
  const sheath = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.024, 1.06, 10), scab);
  sheath.position.set(0.045, 0.42, 0.015); sheath.rotation.z = -0.08;
  sword.add(sheath);
  sword.position.set(-0.02, 1.02, 0.20);
  sword.rotation.x = -0.14; sword.rotation.z = 0.12;
  sword.castShadow = true;
  inner.add(sword);

  // ---------- 程序化动作 ----------
  let phase = 0, lean = 0;
  function update(t, dt, moving, airborne, running) {
    const speed = running ? 14 : 9;
    if (moving) phase += dt * speed;
    const breathe = Math.sin(t * 1.6) * 0.012;
    inner.scale.set(1 + breathe * 0.3, 1 - breathe, 1 + breathe * 0.3);

    // 摆袖
    const sw = moving ? (running ? 0.95 : 0.55) : 0;
    const a = Math.sin(phase);
    const swA = moving ? a * sw : Math.sin(t * 1.4) * 0.06;
    sleeveL.rotation.x = swA + 0.18;
    sleeveR.rotation.x = -swA + 0.18;
    sleeveL.rotation.z = 0.16 - Math.max(0, a) * sw * 0.25;
    sleeveR.rotation.z = -0.16 + Math.max(0, -a) * sw * 0.25;

    const bob = moving ? Math.abs(Math.sin(phase)) * (running ? 0.06 : 0.035) : 0;
    inner.position.y = bob;
    if (airborne) lean += (0.32 - lean) * 0.2; else lean += (0 - lean) * 0.2;
    inner.rotation.x = -lean;

    // 披帛：波动沿长度传播 + 移动时整体后扬 + 风的慢波
    const back = moving ? (running ? 0.6 : 0.38) : 0;
    const gust = Math.sin(t * 1.2) * 0.10;
    [piboL, piboR].forEach((p, pi) => {
      const dir = pi === 0 ? 1 : -1;
      p.nodes.forEach((n, i) => {
        const wave = Math.sin(t * 3.1 - i * 0.55 + pi * 2.1) * (0.05 + i * 0.035);
        const walkWave = moving ? Math.sin(phase - i * 0.7) * (running ? 0.14 : 0.08) * (i / 6) : 0;
        n.rotation.x = -0.10 + back + wave + walkWave + gust * (i / 8);
        n.rotation.z = dir * (0.04 + Math.sin(t * 1.5 - i * 0.5) * 0.05 * (i / 4));
      });
    });
    // 长发：微幅慢摆
    [hairC, hairL, hairR].forEach((h, hi) => {
      h.nodes.forEach((n, i) => {
        const wave = Math.sin(t * 2.2 - i * 0.8 + hi) * 0.03 * (i / 3);
        n.rotation.x = -0.06 + back * 0.45 + wave + (moving ? Math.sin(phase - i * 0.6) * 0.05 : 0);
      });
    });
  }

  function toggleHat() { hat.visible = !hat.visible; }
  window.addEventListener('keydown', (e) => {
    if (e.key === 'h' || e.key === 'H') toggleHat();
  });

  return { group, update, toggleHat, ready: true };
}
