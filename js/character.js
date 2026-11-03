// 江湖山庄 — 主角：分层骨架（袍/袖/头/剑）+ 走跑跳姿态动画
import * as THREE from 'three';

// 材质集中管理，便于统一调色
const MAT = {
  robe: new THREE.MeshStandardMaterial({ color: 0x3f5560, roughness: 0.85 }),
  robeDark: new THREE.MeshStandardMaterial({ color: 0x2c3d45, roughness: 0.9 }),
  trim: new THREE.MeshStandardMaterial({ color: 0x9c7a4a, roughness: 0.6, metalness: 0.2 }),
  skin: new THREE.MeshStandardMaterial({ color: 0xe8c49a, roughness: 0.55 }),
  hair: new THREE.MeshStandardMaterial({ color: 0x14100d, roughness: 0.85 }),
  band: new THREE.MeshStandardMaterial({ color: 0xa8382c, roughness: 0.7 }),
  blade: new THREE.MeshStandardMaterial({ color: 0xcfd4d8, metalness: 0.75, roughness: 0.25 }),
  hilt: new THREE.MeshStandardMaterial({ color: 0x6d3b2c, roughness: 0.65 }),
  boot: new THREE.MeshStandardMaterial({ color: 0x241c16, roughness: 0.8 }),
};

function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = false;
  return m;
}

// 一只袖子（Group，枢轴在肩，便于前后摆动）
function makeArm(side) {
  const g = new THREE.Group();
  // 上臂 + 垂坠大袖
  const upper = mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.34, 10), MAT.robe, 0, -0.17, 0);
  g.add(upper);
  const sleeve = mesh(new THREE.CylinderGeometry(0.11, 0.2, 0.42, 10), MAT.robe, 0, -0.5, 0);
  g.add(sleeve);
  // 袖口金边
  g.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.035, 10), MAT.trim, 0, -0.7, 0));
  // 手
  g.add(mesh(new THREE.SphereGeometry(0.062, 10, 8), MAT.skin, 0, -0.75, 0));
  g.position.set(side * 0.285, 1.24, 0);
  g.rotation.z = side * 0.12;
  return g;
}

// 一只脚（袍下露出，走路交替前后）
function makeFoot(side) {
  const g = new THREE.Group();
  const boot = mesh(new THREE.BoxGeometry(0.13, 0.1, 0.26), MAT.boot, 0, 0, 0.03);
  boot.geometry.translate(0, 0, 0);
  g.add(boot);
  g.position.set(side * 0.11, 0.05, 0);
  return g;
}

export function buildCharacter() {
  const player = new THREE.Group();      // 世界坐标（位置由 main 控制）
  const root = new THREE.Group();        // 姿态层（起伏/倾斜）
  player.add(root);

  // ---- 身体：长袍（锥台）+ 下摆 + 腰带 + 胸襟 ----
  const body = new THREE.Group();
  root.add(body);

  const hem = mesh(new THREE.CylinderGeometry(0.4, 0.47, 0.2, 14), MAT.robeDark, 0, 0.28, 0);
  body.add(hem);
  // 下摆斜切感：外圈薄环
  body.add(mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.03, 14), MAT.trim, 0, 0.19, 0));

  const skirt = mesh(new THREE.CylinderGeometry(0.31, 0.4, 0.68, 14), MAT.robe, 0, 0.72, 0);
  body.add(skirt);

  const chest = mesh(new THREE.CylinderGeometry(0.255, 0.31, 0.42, 14), MAT.robe, 0, 1.27, 0);
  body.add(chest);

  // 腰带
  body.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 14), MAT.robeDark, 0, 1.06, 0));
  body.add(mesh(new THREE.BoxGeometry(0.14, 0.12, 0.05), MAT.trim, 0, 1.06, 0.29));

  // 交领（斜襟）：两片薄板交叉
  const lapelL = mesh(new THREE.BoxGeometry(0.1, 0.44, 0.03), MAT.robeDark, -0.07, 1.3, 0.245);
  lapelL.rotation.z = 0.34;
  body.add(lapelL);
  const lapelR = mesh(new THREE.BoxGeometry(0.1, 0.44, 0.03), MAT.robeDark, 0.07, 1.3, 0.24);
  lapelR.rotation.z = -0.34;
  body.add(lapelR);

  // 肩线（稍宽的弧肩）
  body.add(mesh(new THREE.SphereGeometry(0.29, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), MAT.robe, 0, 1.41, 0));

  // ---- 手臂 ----
  const armL = makeArm(-1), armR = makeArm(1);
  body.add(armL, armR);

  // ---- 头 ----
  const head = new THREE.Group();
  head.position.set(0, 1.57, 0);
  body.add(head);

  head.add(mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.12, 10), MAT.skin, 0, 0.0, 0)); // 颈
  const skull = mesh(new THREE.SphereGeometry(0.205, 18, 16), MAT.skin, 0, 0.16, 0);
  skull.scale.set(1, 1.04, 0.98);
  head.add(skull);

  // 头发：浅覆球壳（只罩头顶）+ 后脑补片
  const hairShell = mesh(
    new THREE.SphereGeometry(0.215, 18, 16, 0, Math.PI * 2, 0, Math.PI * 0.48),
    MAT.hair, 0, 0.165, 0
  );
  hairShell.scale.set(1, 1.06, 1);
  head.add(hairShell);
  const backHair = mesh(new THREE.SphereGeometry(0.19, 14, 12, 0, Math.PI, Math.PI * 0.5, Math.PI * 0.42), MAT.hair, 0, 0.14, -0.03);
  backHair.scale.set(1, 1.05, 0.9);
  head.add(backHair);
  // 鬓发两侧
  for (const s of [-1, 1]) {
    const side = mesh(new THREE.SphereGeometry(0.075, 10, 10), MAT.hair, s * 0.175, 0.11, -0.02);
    side.scale.set(0.75, 1.5, 0.9);
    head.add(side);
  }
  // 发髻
  head.add(mesh(new THREE.SphereGeometry(0.088, 12, 12), MAT.hair, 0, 0.335, -0.03));
  // 发带
  const bandGeo = new THREE.TorusGeometry(0.062, 0.016, 8, 18);
  const band = mesh(bandGeo, MAT.band, 0, 0.29, -0.03);
  band.rotation.x = Math.PI / 2;
  head.add(band);
  // 飘带（两缕）
  for (const s of [-1, 1]) {
    const tail = mesh(new THREE.BoxGeometry(0.03, 0.22, 0.012), MAT.band, s * 0.055, 0.2, -0.14);
    tail.rotation.x = -0.35; tail.rotation.z = s * 0.15;
    head.add(tail);
  }
  // 眉眼（极简：细横条，避免"无脸"）
  for (const s of [-1, 1]) {
    const eye = mesh(new THREE.BoxGeometry(0.045, 0.012, 0.01), MAT.hair, s * 0.072, 0.175, 0.187);
    head.add(eye);
  }

  // ---- 背剑 ----
  const sword = new THREE.Group();
  const scab = mesh(new THREE.BoxGeometry(0.048, 0.92, 0.022), MAT.blade, 0, 0, 0);
  sword.add(scab);
  sword.add(mesh(new THREE.BoxGeometry(0.058, 0.05, 0.03), MAT.trim, 0, 0.48, 0));   // 剑格
  sword.add(mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.2, 8), MAT.hilt, 0, 0.6, 0)); // 剑柄
  sword.add(mesh(new THREE.SphereGeometry(0.032, 8, 8), MAT.trim, 0, 0.71, 0));       // 剑首
  sword.position.set(-0.17, 1.0, -0.26);
  sword.rotation.set(0.12, 0, 0.55);
  body.add(sword);

  // ---- 双脚 ----
  const footL = makeFoot(-1), footR = makeFoot(1);
  root.add(footL, footR);

  // 姿态状态
  const st = { phase: 0, air: 0 };

  return {
    group: player,
    // moving: 是否在走；jumping: 是否腾空；t: 累计时间
    update(t, dt, moving, jumping, speedRatio = 1) {
      st.phase += dt * (moving ? 8.6 * speedRatio : 2.2);
      const p = st.phase;
      const swing = moving ? Math.sin(p) : 0;

      // 手臂前后摆
      armL.rotation.x = swing * 0.62;
      armR.rotation.x = -swing * 0.62;
      armL.rotation.z = -0.12 - Math.abs(swing) * 0.05;
      armR.rotation.z = 0.12 + Math.abs(swing) * 0.05;

      // 双脚交替 + 抬脚
      footL.position.z = moving ? swing * 0.17 : 0;
      footR.position.z = moving ? -swing * 0.17 : 0;
      footL.position.y = 0.05 + (moving ? Math.max(0, swing) * 0.07 : 0);
      footR.position.y = 0.05 + (moving ? Math.max(0, -swing) * 0.07 : 0);

      // 身体起伏 + 轻微左右摆 + 前倾
      const bob = moving ? Math.abs(Math.sin(p)) * 0.045 : Math.sin(t * 1.6) * 0.012;
      root.position.y = bob;
      root.rotation.z = moving ? Math.sin(p * 0.5) * 0.022 : 0;
      root.rotation.x = moving ? 0.055 : 0;

      // 腾空：手臂上扬、身体后仰一点
      if (jumping) {
        armL.rotation.x = -0.9; armR.rotation.x = -0.9;
        armL.rotation.z = -0.45; armR.rotation.z = 0.45;
        root.rotation.x = -0.08;
      }

      // 打坐时：整体坐下（由 main 通过 sitDrop 控制 y，这里只收袖）
      if (!moving && !jumping) {
        armL.rotation.x += 0.28; armR.rotation.x += 0.28;
      }
    }
  };
}
