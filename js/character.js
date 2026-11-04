// 角色：程序化武侠/仙侠形象（长袍 + 发髻 + 背后长剑），自带程序化走/跑/待机动作
// 接口与旧版一致：buildCharacter() -> { group, update(t, dt, moving, airborne, running) }
// 约定：角色正面朝 -Z（与 main.js 移动朝向公式 front=(-sinα,-cosα) 对齐）
import * as THREE from 'three';

export function buildCharacter() {
  const group = new THREE.Group();
  const inner = new THREE.Group(); // 呼吸/前倾挂这里，不干扰朝向
  group.add(inner);

  const skin = new THREE.MeshStandardMaterial({ color: 0xe7c4a0, roughness: 0.85 });
  const robe = new THREE.MeshStandardMaterial({ color: 0xeae5d7, roughness: 0.96 });
  const robeDark = new THREE.MeshStandardMaterial({ color: 0xcfc9b6, roughness: 0.96 });
  const sash = new THREE.MeshStandardMaterial({ color: 0x3c6f6a, roughness: 0.9 }); // 黛青腰带
  const hair = new THREE.MeshStandardMaterial({ color: 0x26221e, roughness: 0.8 });
  const steel = new THREE.MeshStandardMaterial({ color: 0xc2cbd0, metalness: 0.55, roughness: 0.35 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.7 });

  // ---------- 长袍：LatheGeometry 旋成 vase 轮廓 ----------
  const pts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.44, 0.02),
    new THREE.Vector2(0.47, 0.14),
    new THREE.Vector2(0.40, 0.52),
    new THREE.Vector2(0.30, 0.94),
    new THREE.Vector2(0.26, 1.18),
    new THREE.Vector2(0.30, 1.42),
    new THREE.Vector2(0.21, 1.50),
    new THREE.Vector2(0.11, 1.56),
    new THREE.Vector2(0.0, 1.585),
  ];
  const robeMesh = new THREE.Mesh(new THREE.LatheGeometry(pts, 20), robe);
  robeMesh.castShadow = true;
  inner.add(robeMesh);

  // 衣襟交叠（深一档）
  const lapel = new THREE.Mesh(new THREE.CircleGeometry(0.12, 12, 0, Math.PI), robeDark);
  lapel.position.set(0, 1.28, -0.27);
  lapel.rotation.x = -Math.PI / 2 + 0.5;
  inner.add(lapel);

  // 腰带 + 垂穗
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.30, 0.055, 8, 22), sash);
  belt.position.y = 0.95; belt.rotation.x = Math.PI / 2; belt.castShadow = true;
  inner.add(belt);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.5, 0.025), sash);
  tail.position.set(0, 0.7, -0.29);
  inner.add(tail);

  // ---------- 头 / 发髻 ----------
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 16), skin);
  head.position.y = 1.74; head.castShadow = true;
  inner.add(head);
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.166, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.6), hair);
  hairCap.position.y = 1.75;
  inner.add(hairCap);
  const bun = new THREE.Mesh(new THREE.SphereGeometry(0.10, 12, 10), hair);
  bun.position.y = 1.90;
  inner.add(bun);
  const ribbon = new THREE.Mesh(new THREE.TorusGeometry(0.165, 0.02, 6, 18), sash);
  ribbon.position.y = 1.82; ribbon.rotation.x = Math.PI / 2;
  inner.add(ribbon);

  // ---------- 手臂（肩为枢轴，便于摆动） ----------
  function makeArm(side) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.27, 1.36, 0);
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.5, 8), robe);
    upper.position.y = -0.25; upper.castShadow = true;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), skin);
    hand.position.y = -0.52;
    pivot.add(upper, hand);
    pivot.rotation.z = side * 0.16;
    inner.add(pivot);
    return pivot;
  }
  const armL = makeArm(1), armR = makeArm(-1);

  // ---------- 背后长剑（背在 +Z = 角色背面，因正面朝 -Z） ----------
  const sword = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.0, 0.013), steel);
  blade.position.y = 0.5;
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.03, 0.03), wood);
  const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 6), wood);
  hilt.position.y = -0.08;
  sword.add(blade, guard, hilt);
  sword.position.set(0.0, 1.06, 0.22);
  sword.rotation.x = -0.16; sword.rotation.z = 0.12;
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
    // 摆臂 + 上下起伏
    const sw = moving ? (running ? 0.95 : 0.55) : 0;
    const a = Math.sin(phase);
    armL.rotation.x = a * sw;
    armR.rotation.x = -a * sw;
    const bob = moving ? Math.abs(Math.sin(phase)) * (running ? 0.06 : 0.035) : 0;
    inner.position.y = bob;
    // 起跳前倾
    if (airborne) lean += (0.32 - lean) * 0.2; else lean += (0 - lean) * 0.2;
    inner.rotation.x = -lean;
    if (!moving) { armL.rotation.x *= 0.9; armR.rotation.x *= 0.9; }
  }

  document.title = document.title.replace('运行中', '运行中·侠客就绪');
  return { group, update, ready: true };
}
