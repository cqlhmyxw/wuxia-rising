// 角色：骨骼蒙皮人形（Soldier.glb，自带 Idle/Walk/Run 动作捕捉动画）
// 接口与旧手写几何版一致：buildCharacter() -> { group, update(t, dt, moving, airborne, running) }
import * as THREE from 'three';
import { GLTFLoader } from '../lib/GLTFLoader.js';

// Soldier.glb 实测正面朝 -Z（three.js 官方示例相机即从 -Z 方向观看），
// 故需补转 π 才能与移动朝向公式（rotation.y = atan2(mx, mz)）一致
const MODEL_YAW = Math.PI;

export function buildCharacter() {
  const group = new THREE.Group();
  const inner = new THREE.Group(); // 前倾等程序化姿态挂在 inner，不干扰朝向
  group.add(inner);

  let mixer = null;
  const actions = {};
  let current = null;
  let ready = false;

  function play(name, fade = 0.22) {
    if (!ready || !actions[name] || current === name) return;
    const next = actions[name];
    if (current && actions[current]) actions[current].fadeOut(fade);
    next.reset().fadeIn(fade).play();
    current = name;
  }

  // 加载前的兜底占位：简单人形柱，避免空场景
  const placeholder = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.26, 0.72, 4, 10),
    new THREE.MeshLambertMaterial({ color: 0x54685a })
  );
  placeholder.position.y = 0.68;
  placeholder.castShadow = true;
  inner.add(placeholder);

  new GLTFLoader().load(
    'models/soldier.glb',
    (gltf) => {
      const model = gltf.scene;

      // 尺寸：Soldier.glb 实际身高约 1.8 单位（蒙皮网格 Box3 不可靠，用已知值）
      model.scale.setScalar(1.0);

      // 统一上色：迷彩 → 灰度化后青灰色调（保留明暗细节=保留五官/衣褶），去现代感
      model.traverse((o) => {
        if (o.isMesh && o.material) {
          o.castShadow = true; o.frustumCulled = false;
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          const recolored = mats.map((m) => {
            if (!m.map || !m.map.image) return m;
            try {
              const img = m.map.image;
              const cv = document.createElement('canvas');
              cv.width = img.width; cv.height = img.height;
              const ctx = cv.getContext('2d');
              // 色调滤镜：去迷彩饱和度、统一青灰调，保亮度（不 darken）
              ctx.filter = 'grayscale(1) sepia(0.5) hue-rotate(165deg) saturate(0.75) brightness(1.0) contrast(0.96)';
              ctx.drawImage(img, 0, 0, cv.width, cv.height);
              const tex = new THREE.CanvasTexture(cv);
              tex.colorSpace = THREE.SRGBColorSpace;
              tex.flipY = m.map.flipY;
              const nm = m.clone();
              nm.map = tex; nm.roughness = 0.88; nm.metalness = 0.04;
              return nm;
            } catch (e) { return m; }
          });
          o.material = recolored.length === 1 ? recolored[0] : recolored;
        } else if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; }
      });

      model.rotation.y = MODEL_YAW;
      inner.add(model);
      inner.remove(placeholder);
      placeholder.geometry.dispose(); placeholder.material.dispose();

      mixer = new THREE.AnimationMixer(model);
      for (const clip of gltf.animations) {
        const n = clip.name.toLowerCase();
        if (n.includes('idle')) actions.idle = mixer.clipAction(clip);
        else if (n.includes('walk')) actions.walk = mixer.clipAction(clip);
        else if (n.includes('run')) actions.run = mixer.clipAction(clip);
      }
      if (actions.idle) { actions.idle.play(); current = 'idle'; }
      // 移动速度加快后，同步动画播放速率，避免"脚底打滑"
      if (actions.walk) actions.walk.timeScale = 1.35;
      if (actions.run) actions.run.timeScale = 1.25;
      ready = true;
      document.title = document.title.replace('运行中', '运行中·角色就绪');
    },
    undefined,
    (err) => { document.title = '江湖山庄 · 模型加载失败'; console.error('soldier.glb:', err); }
  );

  let lean = 0; // 空中前倾角
  function update(t, dt, moving, airborne, running) {
    if (mixer) mixer.update(dt);
    if (airborne) {
      lean += (0.3 - lean) * 0.18; // 起跳后身体前倾
    } else {
      lean += (0 - lean) * 0.22;
      if (moving) play(running ? 'run' : 'walk');
      else play('idle');
    }
    inner.rotation.x = -lean;
  }

  return {
    group,
    update,
    get ready() { return ready; },
  };
}
