// 江湖山庄 — 入口：渲染器、相机、操控、主循环
import * as THREE from 'three';
import { buildWorld, terrainHeight, colliders, world as worldHooks, POND } from './world.js';
import { buildVillage } from './architecture.js';
import { initMeditation } from './meditation.js';

export function boot() {
  // ---------- 渲染基础 ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.insertBefore(renderer.domElement, document.body.firstChild);
  const canvas = renderer.domElement;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xaec8d4);
  // 分层雾：远山融进天色（青绿山水感的关键）
  scene.fog = new THREE.Fog(0xaec8d4, 55, 150);

  const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 400);

  // 光：暖阳 + 天光
  const hemi = new THREE.HemisphereLight(0xcfe4ee, 0x6a7a58, 0.75);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe3bb, 1.25);
  sun.position.set(42, 58, 24);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -70; sun.shadow.camera.right = 70;
  sun.shadow.camera.top = 70; sun.shadow.camera.bottom = -70;
  sun.shadow.camera.far = 200;
  sun.shadow.bias = -0.0004;
  scene.add(sun);

  // ---------- 世界 ----------
  buildWorld(scene);
  const pavilion = buildVillage(scene);

  // ---------- 主角 ----------
  const player = new THREE.Group();
  {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.4, 0.85, 8),
      new THREE.MeshStandardMaterial({ color: 0x4a6048, roughness: 0.7 }));
    body.position.y = 0.75; body.castShadow = true; player.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xe8c090, roughness: 0.5 }));
    head.position.y = 1.32; head.castShadow = true; player.add(head);
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.9 }));
    bun.position.set(0, 1.52, -0.06); player.add(bun);
    // 背剑
    const sword = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.0, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xcfd4d8, metalness: 0.7, roughness: 0.3 }));
    sword.position.set(-0.32, 0.95, -0.18); sword.rotation.z = 0.5; sword.castShadow = true;
    player.add(sword);
    const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x8a4436, roughness: 0.6 }));
    hilt.position.set(-0.45, 0.5, -0.18); hilt.rotation.z = 0.5; player.add(hilt);
  }
  const SPAWN = { x: 0, z: 18 };
  player.position.set(SPAWN.x, terrainHeight(SPAWN.x, SPAWN.z), SPAWN.z);
  player.userData.baseY = player.position.y;
  scene.add(player);

  // ---------- 修炼 ----------
  const meditation = initMeditation(scene, pavilion.cushionPos, player);
  let playerToCushion = 999;

  // ---------- 操控 ----------
  const keys = {};
  document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if ('ArrowUp,ArrowDown,ArrowLeft,ArrowRight'.indexOf(e.key) > -1) e.preventDefault();
  });
  document.addEventListener('keyup', e => { keys[e.key] = false; });

  // 相机轨道（鼠标 / 右半屏触摸）
  let orbit = { on: false, x: 0, y: 0, theta: 2.6, phi: 0.42, r: 11 };
  function setCanvas(c) { return c; }
  canvas.addEventListener('mousedown', e => { orbit.on = true; orbit.x = e.clientX; orbit.y = e.clientY; });
  window.addEventListener('mousemove', e => {
    if (!orbit.on) return;
    orbit.theta -= (e.clientX - orbit.x) * 0.005;
    orbit.phi = Math.max(0.12, Math.min(1.25, orbit.phi + (e.clientY - orbit.y) * 0.004));
    orbit.x = e.clientX; orbit.y = e.clientY;
  });
  window.addEventListener('mouseup', () => { orbit.on = false; });
  canvas.addEventListener('wheel', e => {
    orbit.r = Math.max(5, Math.min(24, orbit.r + e.deltaY * 0.012));
  }, { passive: true });

  // 触摸：右半屏转视角，左半屏摇杆
  let joy = { on: false, dx: 0, dy: 0 };
  function onTouchStart(e) {
    const t = e.touches[0]; if (!t) return;
    if (t.clientX > window.innerWidth / 2) { orbit.on = true; orbit.x = t.clientX; orbit.y = t.clientY; }
    else { joy.on = true; joy.tx = t.clientX; joy.ty = t.clientY; joy.dx = 0; joy.dy = 0; }
  }
  function onTouchMove(e) {
    for (const t of e.touches) {
      if (t.clientX > window.innerWidth / 2 && orbit.on) {
        orbit.theta -= (t.clientX - orbit.x) * 0.006;
        orbit.phi = Math.max(0.12, Math.min(1.25, orbit.phi + (t.clientY - orbit.y) * 0.005));
        orbit.x = t.clientX; orbit.y = t.clientY;
      } else if (t.clientX <= window.innerWidth / 2 && joy.on) {
        joy.dx = Math.max(-1, Math.min(1, (t.clientX - joy.tx) / 60));
        joy.dy = Math.max(-1, Math.min(1, (t.clientY - joy.ty) / 60));
      }
    }
  }
  function onTouchEnd(e) {
    let rightGone = true, leftGone = true;
    for (const t of e.touches) { if (t.clientX > window.innerWidth / 2) rightGone = false; else leftGone = false; }
    if (rightGone) orbit.on = false;
    if (leftGone) { joy.on = false; joy.dx = 0; joy.dy = 0; }
  }
  canvas.addEventListener('touchstart', onTouchStart, { passive: true });
  canvas.addEventListener('touchmove', onTouchMove, { passive: true });
  canvas.addEventListener('touchend', onTouchEnd, { passive: true });
  canvas.addEventListener('touchcancel', onTouchEnd, { passive: true });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ---------- 移动与碰撞 ----------
  function tryMove(nx, nz) {
    const PR = 0.4;
    for (const c of colliders) {
      const d = Math.sqrt((nx - c.x) ** 2 + (nz - c.z) ** 2);
      if (d < c.r + PR) return false;
    }
    // 不许下水
    const pd = Math.sqrt((nx - POND.x) ** 2 + (nz - POND.z) ** 2);
    if (pd < POND.r - 1) return false;
    return true;
  }

  let playerAngle = Math.PI;
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (worldHooks.animate) worldHooks.animate(t, dt);

    // 移动
    if (!meditation.sitting) {
      let dx = 0, dy = 0;
      if (keys.ArrowUp || keys.w || keys.W || (joy.on && joy.dy < -0.25)) dy = -1;
      if (keys.ArrowDown || keys.s || keys.S || (joy.on && joy.dy > 0.25)) dy = 1;
      if (keys.ArrowLeft || keys.a || keys.A || (joy.on && joy.dx < -0.25)) dx = -1;
      if (keys.ArrowRight || keys.d || keys.D || (joy.on && joy.dx > 0.25)) dx = 1;
      if (dx || dy) {
        // 相机相对方向
        const sinT = Math.sin(orbit.theta), cosT = Math.cos(orbit.theta);
        const mx = dx * cosT - dy * sinT;
        const mz = -dx * sinT - dy * cosT;
        const len = Math.max(0.001, Math.hypot(mx, mz));
        const speed = 4.4 * dt;
        const nx = player.position.x + (mx / len) * speed;
        const nz = player.position.z + (mz / len) * speed;
        if (tryMove(nx, player.position.z)) player.position.x = nx;
        if (tryMove(player.position.x, nz)) player.position.z = nz;
        const ta = Math.atan2(mx / len, mz / len);
        let diff = ta - playerAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        playerAngle += diff * 0.18;
        player.rotation.y = playerAngle;
        // 走路轻微起伏
        player.userData.baseY = terrainHeight(player.position.x, player.position.z) + Math.abs(Math.sin(t * 9)) * 0.05;
      } else {
        player.userData.baseY = terrainHeight(player.position.x, player.position.z);
      }
    }

    player.position.y = player.userData.baseY;
    playerToCushion = Math.hypot(player.position.x - pavilion.cushionPos.x, player.position.z - pavilion.cushionPos.z);
    meditation.update(t, dt, playerToCushion);

    // 相机跟随（打坐时缓慢环绕）
    if (meditation.sitting) orbit.theta += dt * 0.12;
    const cp = meditation.sitting ? pavilion.cushionPos : player.position;
    camera.position.set(
      cp.x + orbit.r * Math.sin(orbit.theta) * Math.cos(orbit.phi),
      cp.y + 1.2 + orbit.r * Math.sin(orbit.phi),
      cp.z + orbit.r * Math.cos(orbit.theta) * Math.cos(orbit.phi)
    );
    camera.lookAt(cp.x, cp.y + 1.3, cp.z);

    renderer.render(scene, camera);
  }

  document.getElementById('loading').style.display = 'none';
  animate();
}
