// 角色：程序化武侠/仙侠形象（收腰长袍 + 广袖 + 飘带 + 发髻/斗笠可切换 + 背后长剑）
// 接口：buildCharacter() -> { group, update(t,dt,moving,airborne,running), toggleHat, ready }
// 约定：角色正面朝 -Z（与 main.js 移动朝向公式 front=(-sinα,-cosα) 对齐）
import * as THREE from 'three';

export function buildCharacter() {
  const group = new THREE.Group();
  const inner = new THREE.Group(); // 呼吸/前倾挂这里，不干扰朝向
  group.add(inner);

  const C = {
    skin: 0xe7c4a0,
    robe: 0xeae3d0,      // 月白
    robeDark: 0xd6cdb6,  // 衣襟深一档
    sash: 0xb23a2e,      // 朱砂束带
    trim: 0x35535e,      // 黛青滚边
    hair: 0x26221e,
    steel: 0xc2cbd0,
    wood: 0x6b4a2a,
    ribbon: 0xb23a2e,
  };

  const skin = new THREE.MeshStandardMaterial({ color: C.skin, roughness: 0.85 });
  const robe = new THREE.MeshStandardMaterial({ color: C.robe, roughness: 0.96 });
  const robeDark = new THREE.MeshStandardMaterial({ color: C.robeDark, roughness: 0.96 });
  const sash = new THREE.MeshStandardMaterial({ color: C.sash, roughness: 0.85 });
  const trim = new THREE.MeshStandardMaterial({ color: C.trim, roughness: 0.9 });
  const hair = new THREE.MeshStandardMaterial({ color: C.hair, roughness: 0.8 });
  const steel = new THREE.MeshStandardMaterial({ color: C.steel, metalness: 0.55, roughness: 0.35 });
  const wood = new THREE.MeshStandardMaterial({ color: C.wood, roughness: 0.7 });
  const ribbonMat = new THREE.MeshStandardMaterial({ color: C.ribbon, roughness: 0.85, side: THREE.DoubleSide });
  const straw = new THREE.MeshStandardMaterial({ color: 0x8a6d44, roughness: 0.95 });

  // ---------- 长袍：收腰轮廓（肩窄 → 腰收 → 下摆微张） ----------
  const pts = [
    new THREE.Vector2(0.02, 0.0),
    new THREE.Vector2(0.30, 0.04),
    new THREE.Vector2(0.33, 0.12),
    new THREE.Vector2(0.27, 0.46),   // 臀
    new THREE.Vector2(0.155, 0.86),  // 腰（收）
    new THREE.Vector2(0.185, 1.06),
    new THREE.Vector2(0.215, 1.30),  // 胸
    new THREE.Vector2(0.165, 1.46),  // 肩（窄）
    new THREE.Vector2(0.10, 1.53),
    new THREE.Vector2(0.0, 1.56),
  ];
  const robeMesh = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), robe);
  robeMesh.castShadow = true;
  inner.add(robeMesh);

  // 交领（深一档 + 黛青滚边）
  const collar = new THREE.Mesh(
    new THREE.RingGeometry(0.06, 0.17, 18, 1, Math.PI * 0.12, Math.PI * 0.76), robeDark);
  collar.position.set(0, 1.32, -0.12);
  collar.rotation.x = -Math.PI / 2 + 0.42;
  inner.add(collar);
  const collarTrim = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.016, 6, 22), trim);
  collarTrim.position.set(0, 1.32, -0.12);
  collarTrim.rotation.x = Math.PI / 2 - 0.42;
  inner.add(collarTrim);

  // 腰带 + 双垂穗
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.05, 8, 24), sash);
  belt.position.y = 0.86; belt.rotation.x = Math.PI / 2; belt.castShadow = true;
  inner.add(belt);
  const tail1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.02), sash);
  tail1.position.set(0.05, 0.6, -0.2); inner.add(tail1);
  const tail2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.42, 0.02), sash);
  tail2.position.set(-0.05, 0.64, -0.2); inner.add(tail2);

  // 飘带（腰侧垂落，飘逸关键，随风 + 移动时向后扬）
  function makeRibbon(side) {
    const g = new THREE.Group();
    const seg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.92, 0.012), ribbonMat);
    seg.position.y = -0.46; g.add(seg);
    g.position.set(side * 0.16, 0.84, -0.04);
    inner.add(g);
    return g;
  }
  const ribbonL = makeRibbon(1), ribbonR = makeRibbon(-1);

  // 广袖（肩垂下的宽袖，代替手臂摆动）
  function makeSleeve(side) {
    const g = new THREE.Group();
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.15, 0.8, 8, 1, true), robe);
    s.position.y = -0.4; s.castShadow = true; g.add(s);
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.018, 6, 16), trim);
    cuff.position.y = -0.79; cuff.rotation.x = Math.PI / 2; g.add(cuff);
    g.position.set(side * 0.2, 1.42, 0);
    g.rotation.z = side * 0.18;
    inner.add(g);
    return g;
  }
  const sleeveL = makeSleeve(1), sleeveR = makeSleeve(-1);

  // ---------- 头 / 发髻 ----------
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.155, 18, 16), skin);
  head.position.y = 1.70; head.castShadow = true;
  inner.add(head);
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.162, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62), hair);
  hairCap.position.y = 1.71;
  inner.add(hairCap);
  const bun = new THREE.Mesh(new THREE.SphereGeometry(0.10, 12, 10), hair);
  bun.position.y = 1.87;
  inner.add(bun);
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.34, 6), wood);
  pin.position.y = 1.86; pin.rotation.z = Math.PI / 2;
  inner.add(pin);

  // ---------- 斗笠（可切换，默认隐藏） ----------
  const hat = new THREE.Group();
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 24), straw);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.26, 24), straw);
  cone.position.y = 0.14;
  hat.add(brim, cone);
  hat.position.y = 1.82; hat.visible = false;
  hat.castShadow = true;
  inner.add(hat);

  // ---------- 背后长剑（+Z = 背面，正面朝 -Z） ----------
  const sword = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.045, 1.02, 0.012), steel);
  blade.position.y = 0.51;
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.03), wood);
  const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 6), wood);
  hilt.position.y = -0.08;
  sword.add(blade, guard, hilt);
  sword.position.set(0.0, 1.04, 0.2);
  sword.rotation.x = -0.16; sword.rotation.z = 0.1;
  sword.castShadow = true;
  inner.add(sword);

  // ---------- 程序化动作 ----------
  let phase = 0, lean = 0;
  function update(t, dt, moving, airborne, running) {
    const speed = running ? 14 : 9;
    if (moving) phase += dt * speed;
    // 待机呼吸
    const breathe = Math.sin(t * 1.6) * 0.012;
    inner.scale.set(1 + breathe * 0.35, 1 - breathe, 1 + breathe * 0.35);
    // 摆袖
    const sw = moving ? (running ? 0.95 : 0.55) : 0;
    const a = Math.sin(phase);
    const swA = moving ? a * sw : Math.sin(t * 1.4) * 0.06;
    sleeveL.rotation.x = swA + 0.18;
    sleeveR.rotation.x = -swA + 0.18;
    const bob = moving ? Math.abs(Math.sin(phase)) * (running ? 0.06 : 0.035) : 0;
    inner.position.y = bob;
    // 起跳前倾
    if (airborne) lean += (0.32 - lean) * 0.2; else lean += (0 - lean) * 0.2;
    inner.rotation.x = -lean;
    // 飘带随风 + 移动时向后扬
    const wind = Math.sin(t * 1.3);
    const back = moving ? (running ? 0.55 : 0.32) : 0;
    ribbonL.rotation.x = wind * 0.18 + back;
    ribbonR.rotation.x = -wind * 0.18 + back;
    ribbonL.rotation.z = Math.sin(t * 1.1 + 1) * 0.12;
    ribbonR.rotation.z = Math.sin(t * 1.1) * 0.12;
  }

  function toggleHat() { hat.visible = !hat.visible; }
  window.addEventListener('keydown', (e) => {
    if (e.key === 'h' || e.key === 'H') toggleHat();
  });

  document.title = document.title.replace('运行中', '运行中·侠客就绪');
  return { group, update, toggleHat, ready: true };
}
