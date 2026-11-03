// 江湖山庄 — 打坐修炼系统（轻养成：静坐涨修为，境界自然推进）
import * as THREE from 'three';

const REALMS = [
  { name: '凡人', at: 0 },
  { name: '炼气', at: 60 },
  { name: '筑基', at: 200 },
  { name: '金丹', at: 520 },
  { name: '元婴', at: 1200 },
  { name: '化神', at: 2600 },
  { name: '炼虚', at: 5200 },
  { name: '合体', at: 9500 },
  { name: '大乘', at: 16000 },
  { name: '渡劫', at: 26000 },
];

const SAVE_KEY = 'sz_save_v1';
const state = { realm: 0, xiu: 0, sitting: false };

// 存档
try {
  const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
  if (s && typeof s.xiu === 'number') { state.realm = s.realm | 0; state.xiu = s.xiu; }
} catch (e) { /* 损坏存档忽略 */ }
let saveTimer = 0;
function save(dt) {
  saveTimer += dt;
  if (saveTimer > 5) { saveTimer = 0; try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { } }
}

const hudRealm = document.querySelector('#hud .realm');
const hudXiu = document.querySelector('#hud .xiu');
const hint = document.getElementById('hint');
const meditBox = document.getElementById('medit');
const meditBtn = document.getElementById('meditBtn');

function realmOf(xiu) { let i = 0; while (i + 1 < REALMS.length && xiu >= REALMS[i + 1].at) i++; return i; }

function refreshHud() {
  hudRealm.textContent = '境界 · ' + REALMS[state.realm].name;
  const next = REALMS[state.realm + 1];
  hudXiu.textContent = next ? `修为 ${Math.floor(state.xiu)} / ${next.at}` : `修为 ${Math.floor(state.xiu)} · 圆满`;
}
function toast(text) {
  hint.textContent = text; hint.style.display = 'block';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { hint.style.display = 'none'; }, 2600);
}

// 灵气粒子（打坐时升起）
function makeQi(scene, origin) {
  const N = 42;
  const pos = new Float32Array(N * 3);
  const seeds = [];
  for (let i = 0; i < N; i++) seeds.push({ a: Math.random() * Math.PI * 2, r: 0.4 + Math.random() * 0.9, y: Math.random() * 2.4, v: 0.25 + Math.random() * 0.4 });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xbfe8c8, size: 0.07, transparent: true, opacity: 0.0, depthWrite: false
  }));
  scene.add(pts);
  return {
    pts,
    update(t, dt, active) {
      pts.material.opacity += ((active ? 0.85 : 0) - pts.material.opacity) * Math.min(1, dt * 3);
      if (pts.material.opacity < 0.02) return;
      for (let i = 0; i < N; i++) {
        const s = seeds[i];
        s.y += s.v * dt; if (s.y > 2.6) s.y = 0;
        const wob = Math.sin(t * 1.4 + i) * 0.12;
        pos[i * 3] = origin.x + Math.cos(s.a) * (s.r + wob);
        pos[i * 3 + 1] = origin.y + s.y;
        pos[i * 3 + 2] = origin.z + Math.sin(s.a) * (s.r + wob);
      }
      geo.attributes.position.needsUpdate = true;
    }
  };
}

export function initMeditation(scene, cushionPos, player) {
  const qi = makeQi(scene, cushionPos);
  refreshHud();
  meditBtn.addEventListener('click', () => toggle());
  window.addEventListener('keydown', e => { if (e.key === 'e' || e.key === 'E') toggle(); });

  function toggle() {
    if (state.sitting) { state.sitting = false; toast('收功起身'); }
    else { state.sitting = true; toast('静心打坐，气血流转…'); }
  }

  return {
    get sitting() { return state.sitting; },
    // 每帧：靠近提示 + 涨修为 + 粒子
    update(t, dt, playerDist) {
      save(dt);
      if (state.sitting) {
        meditBtn.textContent = '起 身';
        meditBox.style.display = 'block';
      } else {
        meditBtn.textContent = '打 坐';
        meditBox.style.display = playerDist < 3 ? 'block' : 'none';
      }
      if (state.sitting) {
        const gain = 2.2 * dt;
        state.xiu += gain;
        const r = realmOf(state.xiu);
        if (r > state.realm) { state.realm = r; toast('✦ 突破！进入 ' + REALMS[r].name); }
        refreshHud();
      }
      qi.update(t, dt, state.sitting);
      // 打坐姿态：主角坐下（整体压低一点），轻微呼吸起伏
      player.position.y = player.userData.baseY + (state.sitting ? -0.28 : 0) + (state.sitting ? Math.sin(t * 1.1) * 0.02 : 0);
    },
    isNear(playerDist) { return playerDist < 3; },
    showHint(text) { hint.textContent = text; hint.style.display = 'block'; },
    hideHint() { hint.style.display = 'none'; },
  };
}
