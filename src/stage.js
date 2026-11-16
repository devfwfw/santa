import * as THREE from 'three';
import santaTorse from './assets/santa_torse.png';
import santaJambeA from './assets/santa_jambeA.png';
import santaJambeB from './assets/santa_jambeB.png';
import tree1Img from './assets/tree1.png';
import tree2Img from './assets/tree2.png';
import fondImg from './assets/fond.jpg';
import orImg from './assets/or.jpg';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };

function additive(m) {
  m.blending = THREE.CustomBlending; m.blendEquation = THREE.AddEquation;
  m.blendSrc = THREE.SrcAlphaFactor; m.blendDst = THREE.OneFactor;
  m.blendSrcAlpha = THREE.ZeroFactor; m.blendDstAlpha = THREE.OneFactor; return m;
}
function sparkleTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.22, 'rgba(255,240,200,.8)'); grd.addColorStop(1, 'rgba(255,240,200,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  g.fillStyle = 'rgba(255,255,255,.95)';
  g.beginPath(); g.moveTo(32, 2); g.quadraticCurveTo(34, 30, 62, 32); g.quadraticCurveTo(34, 34, 32, 62); g.quadraticCurveTo(30, 34, 2, 32); g.quadraticCurveTo(30, 30, 32, 2); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function softTexture(r = 255, g_ = 255, b = 255) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, `rgba(${r},${g_},${b},1)`); grd.addColorStop(1, `rgba(${r},${g_},${b},0)`);
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function skyTexture() {
  const c = document.createElement('canvas'); c.width = 8; c.height = 512;
  const g = c.getContext('2d'); const grd = g.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, '#010E25'); grd.addColorStop(0.4, '#021A39'); grd.addColorStop(0.7, '#043E8A'); grd.addColorStop(0.71, '#073b78'); grd.addColorStop(1, '#06305f');
  g.fillStyle = grd; g.fillRect(0, 0, 8, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function toonGradient() {
  const t = new THREE.DataTexture(new Uint8Array([70, 150, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
}

export function createStage(container, cb) {
  const reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
  catch (e) {
    const t = []; return {
      restart() { t.splice(0).forEach(clearTimeout); cb.onPhase('run'); t.push(setTimeout(() => cb.onPhase('greet'), 1500)); },
      magic() { cb.onPhase('flash'); t.push(setTimeout(() => cb.onPhase('reveal'), 900), setTimeout(() => cb.onPhase('done'), 1800)); },
      dispose() { t.splice(0).forEach(clearTimeout); },
    };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const FOG = new THREE.Color(0x2a6a92);
  scene.fog = new THREE.Fog(FOG, 10, 40);
  container.style.background = `#021A39 url(${fondImg}) center / cover no-repeat`;
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
  const LOOK = new THREE.Vector3(0, 1.45, 0);
  let baseZ = 7;
  function resize() {
    const w = container.clientWidth || innerWidth, h = container.clientHeight || innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    baseZ = Math.max(6.6, 1.2 + 3.6 / (0.77 * camera.aspect));
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize); resize();

  /* Lumières */
  scene.add(new THREE.AmbientLight(0xa9c8ff, 0.8));
  const moonLight = new THREE.DirectionalLight(0xd6e6ff, 1.5); moonLight.position.set(-4, 8, 6); scene.add(moonLight);
  const warm = new THREE.PointLight(0xffd98a, 14, 9, 1.6); scene.add(warm);

  /* Ciel, lune, étoiles */
  const sTex = sparkleTexture();
  const mkStars = (n) => {
    const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { p[i * 3] = (Math.random() - 0.5) * 110; p[i * 3 + 1] = 3 + Math.random() * 26; p[i * 3 + 2] = -44; }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const pts = new THREE.Points(g, additive(new THREE.PointsMaterial({ map: sTex, color: 0xffe9a8, size: 0.9, transparent: true, depthWrite: false, fog: false })));
    scene.add(pts); return pts;
  };
  const starsA = mkStars(50), starsB = mkStars(50);

  /* Sol enneigé + sapins */
  const grad = toonGradient();
  const toon = (c) => new THREE.MeshToonMaterial({ color: c, gradientMap: grad });
  const glow = new THREE.Mesh(new THREE.CircleGeometry(4.5, 48), new THREE.MeshBasicMaterial({ map: softTexture(195, 224, 235), transparent: true, opacity: 0.35, depthWrite: false }));
  glow.rotation.x = -Math.PI / 2; glow.position.set(0, 0.02, 1.2); scene.add(glow);
  /* Sapins : rendus 3D détourés (Magnific), plantés en volume dans la scène */
  const loadTex = (u) => { const x = new THREE.TextureLoader().load(u); x.colorSpace = THREE.SRGBColorSpace; x.anisotropy = 8; return x; };
  const treeMats = [tree1Img, tree2Img].map((u) => new THREE.MeshBasicMaterial({ map: loadTex(u), transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, color: 0xb4c8f2 }));
  const TH = 4.2, treeGeo = new THREE.PlaneGeometry(TH * 0.75, TH); treeGeo.translate(0, TH / 2 - 0.09 * TH, 0);
  function tree(x, z, s) {
    const m = new THREE.Mesh(treeGeo, treeMats[Math.random() < 0.5 ? 0 : 1]);
    m.position.set(x, 0, z); m.scale.set(s * (Math.random() < 0.5 ? -1 : 1), s, 1); scene.add(m);
  }
  for (let i = 0; i < 22; i++) {
    const z = 4 - i * 2.4, side = i % 2 ? 1 : -1;
    tree(side * (3.6 + Math.random() * 3.2), z, 0.85 + Math.random() * 0.6);
    if (i % 3 === 0) tree(-side * (6.5 + Math.random() * 6), z - 1, 1 + Math.random() * 0.7);
  }

  /* Père Noël : rendu 3D détouré (image générée avec Magnific), animé en volume dans la scène */
  const santa = new THREE.Group(); const rig = new THREE.Group(); santa.add(rig);
  const SH = 2.7, SW = SH * 0.75;
  const stTex = (u) => { const x = new THREE.TextureLoader().load(u); x.colorSpace = THREE.SRGBColorSpace; x.anisotropy = 8; return x; };
  const santaGeo = new THREE.PlaneGeometry(SW, SH); santaGeo.translate(0, SH / 2, 0);
  const part = (u, order) => { const m = new THREE.Mesh(santaGeo, new THREE.MeshBasicMaterial({ map: stTex(u), transparent: true, side: THREE.DoubleSide, color: 0xe4ecff, depthWrite: false })); m.renderOrder = order; return m; };
  const body = new THREE.Group(); rig.add(body);
  // jambes articulées aux hanches (pivot au haut de la jambe), dessinées derrière le torse
  const hip = (px, py, u) => { const g = new THREE.Group(); g.position.set((px / 600 - 0.5) * SW, (1 - py / 800) * SH, 0); const m = part(u, 5); m.position.set(-g.position.x, -g.position.y, 0); g.add(m); body.add(g); return g; };
  const legA = hip(245, 532, santaJambeA), legB = hip(370, 532, santaJambeB);
  const torse = part(santaTorse, 6); body.add(torse);
  const SC = 0.8; santa.scale.setScalar(SC); scene.add(santa);
  const spot = (px, py) => { const o = new THREE.Object3D(); o.position.set((px / 600 - 0.5) * SW, (1 - py / 800) * SH, 0.05); rig.add(o); return o; };
  const mits = [spot(160, 170), spot(505, 470)]; // sac de cadeaux, main libre

  /* Traînées dorées scintillantes */
  const orTex = loadTex(orImg);
  const ribbons = [0, 1].map((i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.6), additive(new THREE.MeshBasicMaterial({ map: orTex, transparent: true, depthWrite: false, fog: false, opacity: 0 })));
    m.renderOrder = i ? 6 : 4; m.scale.x = i ? -1 : 1; scene.add(m); return m;
  });

  /* Neige + particules */
  const NN = 600; const np = new Float32Array(NN * 3), nv = new Float32Array(NN);
  for (let i = 0; i < NN; i++) { np[i * 3] = (Math.random() - 0.5) * 22; np[i * 3 + 1] = Math.random() * 10; np[i * 3 + 2] = -14 + Math.random() * 22; nv[i] = 0.3 + Math.random() * 0.6; }
  const snowGeo = new THREE.BufferGeometry(); snowGeo.setAttribute('position', new THREE.BufferAttribute(np, 3));
  scene.add(new THREE.Points(snowGeo, new THREE.PointsMaterial({ map: softTexture(), color: 0xF2E8D5, size: 0.14, transparent: true, depthWrite: false })));

  const PN = 1200; const pPos = new Float32Array(PN * 3), pCol = new Float32Array(PN * 3), pBase = new Float32Array(PN * 3), pVel = new Float32Array(PN * 3), pLife = new Float32Array(PN), pMax = new Float32Array(PN);
  for (let i = 0; i < PN; i++) pPos[i * 3 + 1] = -99;
  const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3)); pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  const parts = new THREE.Points(pGeo, additive(new THREE.PointsMaterial({ map: sTex, size: 0.34, vertexColors: true, transparent: true, depthWrite: false })));
  parts.frustumCulled = false; scene.add(parts);
  const PCOL = [[1, 0.86, 0.5], [1, 0.95, 0.82], [1, 0.62, 0.4], [0.7, 1, 0.85]]; let pIdx = 0;
  function emit(n, o, speed, burst, spread = 0.25) {
    for (let k = 0; k < n; k++) {
      const i = pIdx = (pIdx + 1) % PN;
      pPos[i * 3] = o.x + (Math.random() - 0.5) * spread; pPos[i * 3 + 1] = o.y + (Math.random() - 0.5) * spread; pPos[i * 3 + 2] = o.z + (Math.random() - 0.5) * spread;
      const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.8), b = Math.random() * Math.PI - Math.PI / 2;
      if (burst) { pVel[i * 3] = Math.cos(a) * Math.cos(b) * s; pVel[i * 3 + 1] = Math.sin(b) * s; pVel[i * 3 + 2] = Math.sin(a) * Math.cos(b) * s; }
      else { pVel[i * 3] = Math.cos(a) * s * 0.5; pVel[i * 3 + 1] = s * (0.2 + Math.random()); pVel[i * 3 + 2] = Math.sin(a) * s * 0.5 + 1.5; }
      pMax[i] = pLife[i] = 0.7 + Math.random() * 1.1;
      const c = PCOL[(Math.random() * PCOL.length) | 0]; pBase[i * 3] = c[0]; pBase[i * 3 + 1] = c[1]; pBase[i * 3 + 2] = c[2];
    }
  }
  // astres flottants autour du Père Noël
  const orbit = []; for (let i = 0; i < 22; i++) {
    const s = new THREE.Sprite(additive(new THREE.SpriteMaterial({ map: sTex, color: 0xffe2a0, transparent: true, depthWrite: false, opacity: 0 })));
    s.userData = { a: Math.random() * 6.28, r: 1.0 + Math.random() * 1.0, h: 0.2 + Math.random() * 2.0, sp: 0.6 + Math.random() * 1.2, sz: 0.1 + Math.random() * 0.2, ph: Math.random() * 6 };
    scene.add(s); orbit.push(s);
  }
  // tourbillon
  const VN = 2600; const vPos = new Float32Array(VN * 3), vCol = new Float32Array(VN * 3); const vd = [];
  for (let i = 0; i < VN; i++) vd.push({ th: Math.random() * 6.28, h: Math.random(), r: 0.6 + Math.random() * 0.8, sp: 0.4 + Math.random() * 0.8, c: PCOL[(Math.random() * 4) | 0], mix: Math.random() });
  const vGeo = new THREE.BufferGeometry(); vGeo.setAttribute('position', new THREE.BufferAttribute(vPos, 3)); vGeo.setAttribute('color', new THREE.BufferAttribute(vCol, 3));
  const vort = new THREE.Points(vGeo, additive(new THREE.PointsMaterial({ map: sTex, size: 0.2, vertexColors: true, transparent: true, depthWrite: false })));
  vort.frustumCulled = false; scene.add(vort);

  /* État */
  let phase = 'run', t0 = 0, time = 0, raf = 0, vortex = 0, flashed = false, revealed = false;
  const RUN = reduced ? 0.6 : 1.5, MAGIC = reduced ? 1.6 : 3.4;
  const tmp = new THREE.Vector3();
  function restart() { phase = 'run'; t0 = time; vortex = 0; flashed = revealed = false; santa.visible = true; cb.onPhase('run'); }
  function magic() { if (phase !== 'greet') return; phase = 'magic'; t0 = time; flashed = revealed = false; cb.onPhase('magic'); }
  renderer.domElement.addEventListener('click', () => cb.onClick && cb.onClick());

  function pose(mode, t, m) {
    if (mode === 'run') {
      const ph = t * 17, sn = Math.sin(ph);
      legA.rotation.z = 0.38 + 0.4 * sn; legB.rotation.z = -0.45 - 0.45 * sn;
      body.position.y = Math.abs(Math.cos(ph)) * 0.2; torse.rotation.z = -0.03 + Math.sin(ph + 0.6) * 0.04;
      rig.rotation.set(0.08, 0, sn * 0.05);
    } else if (mode === 'jig') {
      const ph = t * 7, sn = Math.sin(ph);
      legA.rotation.z = 0.2 + 0.12 * sn; legB.rotation.z = -0.2 - 0.12 * sn;
      body.position.y = Math.abs(sn) * 0.12; torse.rotation.z = Math.sin(ph) * 0.03;
      rig.rotation.set(0, Math.sin(t * 3) * 0.25, Math.sin(ph) * 0.06);
    } else {
      legA.rotation.z = 0.3; legB.rotation.z = -0.3; torse.rotation.z = 0;
      body.position.y = 0; rig.rotation.set(0, m * m * 30, 0);
    }
  }

  function update(dt) {
    time += dt;
    camera.position.set(Math.sin(time * 0.3) * 0.12, 1.7, baseZ); camera.lookAt(LOOK);
    starsA.material.opacity = 0.55 + Math.sin(time * 2.1) * 0.45; starsB.material.opacity = 0.55 + Math.cos(time * 1.7) * 0.45;
    const sa = snowGeo.attributes.position;
    for (let i = 0; i < NN; i++) { let y = sa.array[i * 3 + 1] - nv[i] * dt; if (y < 0) y = 10; sa.array[i * 3 + 1] = y; sa.array[i * 3] += Math.sin(time + i) * dt * 0.12; }
    sa.needsUpdate = true;

    const s = time - t0; let orb = 0, vTarget = vortex;
    if (phase === 'run') {
      const u = clamp(s / RUN), e = 1 - Math.pow(1 - u, 2.2);
      santa.position.set(Math.sin(u * 9) * 1.1 * (1 - u), 0, -17 + e * 17.2);
      santa.rotation.y = 0; pose('run', s, 0);
      rig.position.y = 0; santa.scale.setScalar(SC);
      mits.forEach((m) => { m.getWorldPosition(tmp); emit(4, tmp, 1.6, false, 0.15); });
      emit(5, tmp.set(santa.position.x, 0.2, santa.position.z), 1.4, false, 0.5);
      if (u >= 1) { phase = 'greet'; t0 = time; cb.onPhase('greet'); }
    } else if (phase === 'greet') {
      santa.position.set(0, 0, 0.2); santa.rotation.y = 0; pose('jig', s, 0); orb = clamp(s / 0.6);
      if (Math.random() < dt * 18) { mits[1].getWorldPosition(tmp); emit(2, tmp, 1.2, true, 0.1); }
    } else if (phase === 'magic') {
      const m = clamp(s / MAGIC);
      pose('magic', s, m);
      const rise = Math.max(0, m - 0.2); santa.position.set(0, rise * rise * 5.5, 0.2);
      santa.scale.setScalar(SC * (1 - smooth((m - 0.5) / 0.4)));
      vTarget = smooth(m / 0.5); orb = 1 - smooth((m - 0.3) / 0.3);
      if (m > 0.2 && m < 0.85) emit(Math.round(240 * dt), tmp.set(santa.position.x, santa.position.y + 1.2, santa.position.z), 2.5, true, 0.6);
      if (!flashed && m >= 0.62) { flashed = true; emit(260, tmp.set(0, 2.2, 0.2), 5.5, true, 0.3); cb.onPhase('flash'); }
      if (!revealed && m >= 0.72) { revealed = true; santa.visible = false; cb.onPhase('reveal'); }
      if (m > 0.85) vTarget = 1 - smooth((m - 0.85) / 0.15) * 0.74;
      if (m >= 1) { phase = 'done'; t0 = time; cb.onPhase('done'); }
    } else { vTarget = 0.26 + Math.sin(time * 1.3) * 0.04; santa.visible = false; }
    vortex += (vTarget - vortex) * Math.min(1, dt * 6);

    // traînées dorées
    const rb = phase === 'run' ? clamp(s / RUN) : phase === 'greet' ? 1 : phase === 'magic' ? 1 - smooth((s / MAGIC - 0.55) / 0.3) : 0;
    ribbons.forEach((r, i) => {
      const k = i ? 1 : -1, spin = phase === 'magic' ? (s / MAGIC) * (s / MAGIC) * 9 : 0, sc = (phase === 'magic' ? 1 + (s / MAGIC) * 1.6 : 0.9 + 0.1 * Math.sin(time * 1.5 + i)) * (i ? 0.9 : 1.1);
      r.position.set(santa.position.x + k * 0.15, santa.position.y + 1.2, santa.position.z + k * 0.25);
      r.rotation.z = (i ? 0.45 : -0.15) + Math.sin(time * 0.9 + i * 2) * 0.12 + k * spin;
      r.scale.set((i ? -1 : 1) * sc, sc, 1);
      r.material.opacity = rb * (i ? 1 : 1.4) * (0.85 + 0.15 * Math.sin(time * 4 + i));
    });

    // lumière + astres
    warm.position.set(santa.position.x, santa.position.y + 2.2, santa.position.z + 2);
    warm.intensity = phase === 'done' ? 0 : 14 + Math.sin(time * 5) * 2;
    orbit.forEach((o) => {
      const d = o.userData; const a = d.a + time * d.sp;
      o.position.set(santa.position.x + Math.cos(a) * d.r, santa.position.y + d.h + Math.sin(time * 1.6 + d.ph) * 0.15, santa.position.z + Math.sin(a) * d.r * 0.8);
      const tw = 0.6 + Math.sin(time * 4 + d.ph) * 0.4; o.material.opacity = orb * tw; o.scale.setScalar(d.sz * (0.8 + tw * 0.4));
    });
    // tourbillon
    if (vortex > 0.01) {
      vort.visible = true;
      for (let i = 0; i < VN; i++) {
        const d = vd[i]; const h = (d.h + time * 0.22 * d.sp) % 1;
        const R = (0.25 + 2.9 * Math.pow(h, 1.15)) * d.r * (0.5 + 0.5 * vortex);
        const th = d.th + time * (1.6 + 5 / (R + 0.5)) * (0.4 + vortex);
        vPos[i * 3] = Math.cos(th) * R; vPos[i * 3 + 1] = h * 6.4; vPos[i * 3 + 2] = 0.2 + Math.sin(th) * R * 0.85;
        const a = vortex * (0.35 + 0.65 * Math.sin(h * Math.PI)) * (0.55 + 0.45 * Math.sin(time * 6 + i));
        const w = d.mix > 0.55 ? 1 : 0.55;
        vCol[i * 3] = (d.mix > 0.55 ? 1 : d.c[0]) * a; vCol[i * 3 + 1] = (d.mix > 0.55 ? 1 : d.c[1]) * a * w + (1 - w) * a * 0.3; vCol[i * 3 + 2] = (d.mix > 0.55 ? 0.95 : d.c[2]) * a * (d.mix > 0.55 ? 1 : 0.8);
      }
      vGeo.attributes.position.needsUpdate = true; vGeo.attributes.color.needsUpdate = true;
    } else vort.visible = false;
    // particules
    for (let i = 0; i < PN; i++) {
      if (pLife[i] > 0) {
        pLife[i] -= dt; const f = Math.max(0, pLife[i] / pMax[i]);
        pPos[i * 3] += pVel[i * 3] * dt; pPos[i * 3 + 1] += pVel[i * 3 + 1] * dt; pPos[i * 3 + 2] += pVel[i * 3 + 2] * dt;
        pVel[i * 3] *= 0.98; pVel[i * 3 + 1] = pVel[i * 3 + 1] * 0.98 - 0.8 * dt; pVel[i * 3 + 2] *= 0.98;
        pCol[i * 3] = pBase[i * 3] * f; pCol[i * 3 + 1] = pBase[i * 3 + 1] * f; pCol[i * 3 + 2] = pBase[i * 3 + 2] * f;
      } else pCol[i * 3] = pCol[i * 3 + 1] = pCol[i * 3 + 2] = 0;
    }
    pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
  }

  let last = performance.now();
  function frame(now) { raf = requestAnimationFrame(frame); const dt = Math.min((now - last) / 1000, 0.05); last = now; update(dt); renderer.render(scene, camera); }
  raf = requestAnimationFrame(frame);
  restart();
  return {
    restart, magic,
    dispose() { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); renderer.dispose(); renderer.domElement.remove(); },
  };
}
