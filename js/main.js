// 江湖山庄 — 入口：渲染器、相机、操控、主循环
import * as THREE from 'three';
import { buildWorld, terrainHeight, colliders, world as worldHooks, POND } from './world.js';
import { buildVillage } from './architecture.js';
import { initMeditation } from './meditation.js';
import { buildCharacter } from './character.js';

export function boot() {
  // ---------- 渲染基础 ----------
  const SNAP_MODE = location.search.includes('snap');
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: SNAP_MODE });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.96;
  document.body.insertBefore(renderer.domElement, document.body.firstChild);
  const canvas = renderer.domElement;
  canvas.style.outline = 'none';

  const scene = new THREE.Scene();
  const SKY = 0xb8d0dc;
  scene.background = new THREE.Color(SKY);
  // 分层雾：远山融进天色（青绿山水感的关键）
  scene.fog = new THREE.Fog(SKY, 60, 230);

  const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 500);
  window.__cam = camera;

  // 光：暖阳 + 天光 + 南向补光（防止屋檐下死黑）
  const hemi = new THREE.HemisphereLight(0xd6e8f0, 0x70805e, 0.95);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe6c4, 1.15);
  sun.position.set(52, 66, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -80; sun.shadow.camera.right = 80;
  sun.shadow.camera.top = 80; sun.shadow.camera.bottom = -80;
  sun.shadow.camera.far = 240;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xd8e4e8, 0.5);
  fill.position.set(-15, 28, 62);
  scene.add(fill);

  // ---------- 世界 ----------
  buildWorld(scene);
  const pavilion = buildVillage(scene);

  // ---------- 主角 ----------
  const character = buildCharacter();
  const player = character.group;
  const SPAWN = { x: 0, z: 18 };
  player.position.set(SPAWN.x, terrainHeight(SPAWN.x, SPAWN.z), SPAWN.z);
  player.rotation.y = 0; // 模型正面为 -Z（已在 character.js 内补转 π），此处 0 即面向 +z 山门
  scene.add(player);

  // ---------- 修炼 ----------
  const meditation = initMeditation(scene, pavilion.cushionPos, player);
  let playerToCushion = 999;

  // ---------- 输入 ----------
  const keys = {};
  let jumpQueued = false;
  document.addEventListener('keydown', e => {
    keys[e.key] = true;
    keys[e.code] = true;
    if (e.code === 'Space') { e.preventDefault(); jumpQueued = true; }
    if (e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') e.preventDefault();
  });
  document.addEventListener('keyup', e => { keys[e.key] = false; keys[e.code] = false; });
  // 切窗/失焦时清空按键，防止"往前走停不下来"
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; jumpQueued = false; });

  // 相机轨道：左键/右键拖动都可转视角；右键不弹菜单
  let orbit = { on: false, x: 0, y: 0, theta: 2.6, phi: 0.42, r: 11 };
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('mousedown', e => {
    if (e.button !== 0 && e.button !== 2) return;
    orbit.on = true; orbit.x = e.clientX; orbit.y = e.clientY;
    canvas.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', e => {
    if (!orbit.on) return;
    orbit.theta -= (e.clientX - orbit.x) * 0.005;
    orbit.phi = Math.max(0.08, Math.min(1.25, orbit.phi + (e.clientY - orbit.y) * 0.004));
    orbit.x = e.clientX; orbit.y = e.clientY;
  });
  window.addEventListener('mouseup', () => { orbit.on = false; canvas.style.cursor = 'grab'; });
  canvas.style.cursor = 'grab';
  canvas.addEventListener('wheel', e => {
    orbit.r = Math.max(4, Math.min(26, orbit.r + e.deltaY * 0.012));
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
        orbit.phi = Math.max(0.08, Math.min(1.25, orbit.phi + (t.clientY - orbit.y) * 0.005));
        orbit.x = t.clientX; orbit.y = t.clientY;
      } else if (t.clientX <= window.innerWidth / 2 && joy.on) {
        joy.dx = Math.max(-1, Math.min(1, (t.clientX - joy.tx) / 55));
        joy.dy = Math.max(-1, Math.min(1, (t.clientY - joy.ty) / 55));
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
    const pd = Math.sqrt((nx - POND.x) ** 2 + (nz - POND.z) ** 2);
    if (pd < POND.r - 1) return false;
    return true;
  }

  let playerAngle = 0;
  const JUMP_V = 5.6, GRAVITY = 17.5;
  let vy = 0, jumpY = 0, airborne = false;
  let moving = false;
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (worldHooks.animate) worldHooks.animate(t, dt);

    // ---- 移动 ----
    moving = false;
    const running = !!(keys.ShiftLeft || keys.ShiftRight);
    if (!meditation.sitting) {
      let dx = 0, dy = 0;
      if (keys.ArrowUp || keys.w || keys.W || (joy.on && joy.dy < -0.25)) dy = -1;
      if (keys.ArrowDown || keys.s || keys.S || (joy.on && joy.dy > 0.25)) dy = 1;
      if (keys.ArrowLeft || keys.a || keys.A || (joy.on && joy.dx < -0.25)) dx = -1;
      if (keys.ArrowRight || keys.d || keys.D || (joy.on && joy.dx > 0.25)) dx = 1;

      if (dx || dy) {
        moving = true;
        // 相机相对方向：屏幕前方 = -(sinθ, cosθ)
        const sinT = Math.sin(orbit.theta), cosT = Math.cos(orbit.theta);
        const mx = dx * cosT + dy * sinT;
        const mz = -dx * sinT + dy * cosT;
        const len = Math.max(0.001, Math.hypot(mx, mz));
        const speed = (running ? 12.5 : 7.2) * dt;
        const nx = player.position.x + (mx / len) * speed;
        const nz = player.position.z + (mz / len) * speed;
        if (tryMove(nx, player.position.z)) player.position.x = nx;
        if (tryMove(player.position.x, nz)) player.position.z = nz;

        const ta = Math.atan2(mx / len, mz / len);
        let diff = ta - playerAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        playerAngle += diff * 0.2;
        player.rotation.y = playerAngle;
      }

      // ---- 跳跃 ----
      if (jumpQueued && !airborne) { vy = JUMP_V; airborne = true; }
    }
    jumpQueued = false;

    if (airborne) {
      vy -= GRAVITY * dt;
      jumpY += vy * dt;
      if (jumpY <= 0) { jumpY = 0; vy = 0; airborne = false; }
    }

    // ---- 落地高度统一在此计算 ----
    const groundY = terrainHeight(player.position.x, player.position.z);
    const sitDrop = meditation.sitting ? -0.3 + Math.sin(t * 1.1) * 0.018 : 0;
    player.position.y = groundY + jumpY + sitDrop;

    character.update(t, dt, moving, airborne, running);
    if (meditation.sitting) player.rotation.y = playerAngle = 0; // 打坐面向山门

    playerToCushion = Math.hypot(player.position.x - pavilion.cushionPos.x, player.position.z - pavilion.cushionPos.z);
    meditation.update(t, dt, playerToCushion);

    // ---- 相机跟随 ----
    if (meditation.sitting) orbit.theta += dt * 0.1;
    const cp = meditation.sitting ? pavilion.cushionPos : player.position;
    const camX = cp.x + orbit.r * Math.sin(orbit.theta) * Math.cos(orbit.phi);
    const camZ = cp.z + orbit.r * Math.cos(orbit.theta) * Math.cos(orbit.phi);
    let camY = cp.y + 1.35 + orbit.r * Math.sin(orbit.phi);
    // 不钻地
    const camFloor = terrainHeight(camX, camZ) + 0.9;
    if (camY < camFloor) camY = camFloor;
    camera.position.set(camX, camY, camZ);
    camera.lookAt(cp.x, cp.y + 1.25, cp.z);

    renderer.render(scene, camera);
  }

  document.getElementById('loading').style.display = 'none';

  // 自检钩子：同帧重渲染后导出 JPEG（供本地视觉验证 / 未来截图分享用）
  window.__snap = (q = 0.6, maxW = 1200) => {
    renderer.render(scene, camera);
    const src = canvas;
    if (src.width <= maxW) return src.toDataURL('image/jpeg', q);
    const c2 = document.createElement('canvas');
    c2.width = maxW;
    c2.height = Math.round(src.height * maxW / src.width);
    c2.getContext('2d').drawImage(src, 0, 0, c2.width, c2.height);
    return c2.toDataURL('image/jpeg', q);
  };

  animate();
}
