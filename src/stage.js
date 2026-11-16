import * as THREE from 'three';

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
  const FOG = new THREE.Color(0x073b78);
  scene.fog = new THREE.Fog(FOG, 9, 38);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
  const LOOK = new THREE.Vector3(0, 0.55, 0);
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
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(160, 80), new THREE.MeshBasicMaterial({ map: skyTexture(), fog: false, depthWrite: false }));
  sky.position.set(0, 12, -50); scene.add(sky);
  const moon = new THREE.Mesh(new THREE.CircleGeometry(1.5, 48), new THREE.MeshBasicMaterial({ color: 0xdbe9f2, fog: false }));
  moon.position.set(-11, 13, -45); scene.add(moon);
  const halo = new THREE.Sprite(additive(new THREE.SpriteMaterial({ map: softTexture(195, 224, 235), color: 0xC3E0EB, transparent: true, opacity: 0.5, depthWrite: false, fog: false })));
  halo.scale.set(16, 16, 1); halo.position.copy(moon.position); halo.position.z += 0.2; scene.add(halo);
  const sTex = sparkleTexture();
  const mkStars = (n) => {
    const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { p[i * 3] = (Math.random() - 0.5) * 110; p[i * 3 + 1] = 3 + Math.random() * 26; p[i * 3 + 2] = -44; }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const pts = new THREE.Points(g, additive(new THREE.PointsMaterial({ map: sTex, color: 0xffe9a8, size: 0.9, transparent: true, depthWrite: false, fog: false })));
    scene.add(pts); return pts;
  };
  const starsA = mkStars(110), starsB = mkStars(110);

  /* Sol enneigé + sapins */
  const grad = toonGradient();
  const toon = (c) => new THREE.MeshToonMaterial({ color: c, gradientMap: grad });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), toon(0x507B99));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const glow = new THREE.Mesh(new THREE.CircleGeometry(4.5, 48), new THREE.MeshBasicMaterial({ map: softTexture(195, 224, 235), transparent: true, opacity: 0.4, depthWrite: false }));
  glow.rotation.x = -Math.PI / 2; glow.position.set(0, 0.02, 1.2); scene.add(glow);
  const treeMats = [toon(0x2E6B4F), toon(0x1F4D3A)], snowM = toon(0xF2E8D5), trunkM = toon(0x4a3626);
  function tree(x, z, s) {
    const g = new THREE.Group();
    [[1.05, 1.6, 1.1], [0.82, 1.4, 2.1], [0.58, 1.2, 3.0]].forEach(([r, h, y], i) => { const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), treeMats[i % 2]); c.position.y = y; g.add(c); });
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.5, 7), snowM); cap.position.y = 3.75; g.add(cap);
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.6, 8), trunkM); tr.position.y = 0.3; g.add(tr);
    g.position.set(x, 0, z); g.scale.setScalar(s); g.rotation.y = Math.random() * 6; scene.add(g);
  }
  for (let i = 0; i < 22; i++) {
    const z = 4 - i * 2.4, side = i % 2 ? 1 : -1;
    tree(side * (3.6 + Math.random() * 3.2), z, 0.85 + Math.random() * 0.6);
    if (i % 3 === 0) tree(-side * (6.5 + Math.random() * 6), z - 1, 1 + Math.random() * 0.7);
  }

  /* Père Noël (procédural, style à aplats) */
  const RED = toon(0xB3202A), RED2 = toon(0x8f1923), WHITE = toon(0xF2E8D5), SKIN = toon(0xe6c3a0), BLACK = toon(0x1a1a1a), GOLD = toon(0xC9A54C), SACK = toon(0x2E6B4F);
  const M = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return m; };
  const ell = (r, sx, sy, sz, mat, x, y, z) => { const m = M(new THREE.SphereGeometry(r, 28, 20), mat, x, y, z); m.scale.set(sx, sy, sz); return m; };
  const santa = new THREE.Group(); const rig = new THREE.Group(); santa.add(rig);
  const body = new THREE.Group(); body.position.y = 0.9; rig.add(body);          // pivot hanches
  body.add(ell(1, 0.64, 0.7, 0.58, RED, 0, 0.4, 0));                               // torse
  body.add(ell(1, 0.7, 0.62, 0.66, RED, 0, 0.18, 0.05));                           // ventre
  const belt = M(new THREE.CylinderGeometry(0.7, 0.72, 0.13, 32, 1, true), BLACK, 0, 0.16, 0.05); belt.scale.z = 0.95; belt.material.side = THREE.DoubleSide; body.add(belt);
  body.add(M(new THREE.BoxGeometry(0.22, 0.2, 0.05), GOLD, 0, 0.16, 0.7));
  body.add(M(new THREE.BoxGeometry(0.12, 0.8, 0.05), WHITE, 0, 0.4, 0.66));        // bande de fourrure
  const hem = M(new THREE.TorusGeometry(0.66, 0.08, 10, 36), WHITE, 0, -0.12, 0.04); hem.rotation.x = Math.PI / 2; hem.scale.y = 0.92; body.add(hem);
  const sack = ell(1, 0.5, 0.55, 0.45, SACK, -0.45, 0.6, -0.5); body.add(sack);
  body.add(M(new THREE.TorusGeometry(0.2, 0.04, 8, 16), GOLD, -0.45, 1.1, -0.5));
  const legs = [-1, 1].map((s) => { const l = new THREE.Group(); l.position.set(s * 0.22, 0, 0); body.add(l);
    l.add(M(new THREE.CylinderGeometry(0.17, 0.15, 0.62, 14), RED2, 0, -0.31, 0));
    l.add(M(new THREE.BoxGeometry(0.3, 0.24, 0.5), BLACK, 0, -0.68, 0.08));
    const cuff = M(new THREE.TorusGeometry(0.16, 0.05, 8, 18), WHITE, 0, -0.58, 0); cuff.rotation.x = Math.PI / 2; l.add(cuff); return l; });
  const arms = [-1, 1].map((s) => { const a = new THREE.Group(); a.position.set(s * 0.62, 0.62, 0); body.add(a);
    a.add(M(new THREE.CylinderGeometry(0.14, 0.12, 0.62, 12), RED, 0, -0.31, 0));
    const c = M(new THREE.TorusGeometry(0.13, 0.05, 8, 16), WHITE, 0, -0.6, 0); c.rotation.x = Math.PI / 2; a.add(c);
    const mit = M(new THREE.SphereGeometry(0.16, 16, 12), WHITE, 0, -0.76, 0); mit.name = 'mit'; a.add(mit); return a; });
  const head = new THREE.Group(); head.position.y = 1.0; body.add(head);
  head.add(ell(0.36, 1, 1, 1, SKIN, 0, 0.1, 0));
  head.add(ell(0.38, 1.02, 0.85, 0.72, WHITE, 0, -0.12, 0.2));                      // barbe
  [-1, 1].forEach((s) => {
    head.add(ell(0.11, 1.3, 0.8, 0.9, WHITE, s * 0.1, 0.02, 0.36));                   // moustache
    head.add(M(new THREE.SphereGeometry(0.035, 10, 8), BLACK, s * 0.14, 0.2, 0.32));  // yeux
    const br = M(new THREE.BoxGeometry(0.14, 0.04, 0.05), WHITE, s * 0.14, 0.28, 0.33); br.rotation.z = -s * 0.2; head.add(br);
    head.add(M(new THREE.SphereGeometry(0.05, 10, 8), toon(0xd88c80), s * 0.2, 0.1, 0.31)); // joues
  });
  head.add(M(new THREE.SphereGeometry(0.075, 12, 10), toon(0xd98a7c), 0, 0.12, 0.38));      // nez
  const hat = new THREE.Group(); hat.position.set(0, 0.32, 0); hat.rotation.z = 0.28; head.add(hat);
  hat.add(M(new THREE.ConeGeometry(0.38, 0.72, 20), RED, 0, 0.3, 0));
  const trim = M(new THREE.TorusGeometry(0.36, 0.09, 10, 30), WHITE, 0, 0.0, 0); trim.rotation.x = Math.PI / 2; hat.add(trim);
  hat.add(M(new THREE.SphereGeometry(0.12, 14, 12), WHITE, -0.02, 0.7, 0));
  const SC = 0.78; santa.scale.setScalar(SC); scene.add(santa);
  const mits = []; arms.forEach((a) => mits.push(a.getObjectByName('mit')));

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
    const ph = mode === 'run' ? t * 19 : t * 7;
    let by = 0;
    if (mode === 'run') {
      const s = Math.sin(ph);
      legs[0].rotation.x = s * 1.0; legs[1].rotation.x = -s * 1.0;
      arms[0].rotation.z = -(1.5 + Math.sin(ph * 0.5) * 0.9); arms[1].rotation.z = 1.5 - Math.sin(ph * 0.5) * 0.9;
      arms[0].rotation.x = s * 0.5; arms[1].rotation.x = -s * 0.5;
      body.rotation.set(0.14, Math.sin(ph * 0.5) * 0.3, Math.sin(ph) * 0.06);
      head.rotation.z = Math.sin(ph * 0.5) * 0.15;
      by = Math.abs(s) * 0.16; rig.rotation.y = 0;
    } else if (mode === 'jig') {
      const s = Math.sin(ph);
      legs[0].rotation.x = s * 0.35; legs[1].rotation.x = -s * 0.35;
      arms[1].rotation.z = 2.5 + Math.sin(ph * 2) * 0.35; arms[1].rotation.x = 0;     // il salue
      arms[0].rotation.z = -(0.7 + Math.sin(ph) * 0.15); arms[0].rotation.x = 0.2;
      body.rotation.set(0.04, Math.sin(t * 3) * 0.2, Math.sin(ph) * 0.07);
      head.rotation.z = Math.sin(ph) * 0.12; by = Math.abs(Math.sin(ph)) * 0.15; rig.rotation.y = 0;
    } else {
      legs[0].rotation.x = -0.4; legs[1].rotation.x = 0.4;
      arms[0].rotation.z = -2.6; arms[1].rotation.z = 2.6; arms[0].rotation.x = arms[1].rotation.x = 0;
      body.rotation.set(0, 0, 0); head.rotation.z = 0; rig.rotation.y = m * m * 30;
    }
    body.position.y = 0.9 + by;
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
