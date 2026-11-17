import * as THREE from 'three';
import santaTorse from './assets/santa_torse.png';
import santaJambeA from './assets/santa_jambeA.png';
import santaJambeB from './assets/santa_jambeB.png';
import tree1Img from './assets/tree3.png';
import tree2Img from './assets/tree4.png';
import tree3Img from './assets/tree5.png';
import tree4Img from './assets/tree6.png';
import tree5Img from './assets/tree7.png';
import fondImg from './assets/fond.jpg';

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
  const LOOK = new THREE.Vector3(0, 0.7, 0);
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
  /* Sol : vrai relief enneigé en 3D (doux, plat autour du Père Noël), pour que chaque sapin y soit planté */
  const hill = (x, z) => {
    const w = Math.min(1, Math.max(0, (Math.hypot(x * 0.7, z - 1) - 2) / 4)), k = w * w * (3 - 2 * w);
    return k * (0.34 * Math.sin(x * 0.33 + z * 0.17) + 0.24 * Math.sin(x * 0.15 - z * 0.29) + 0.1 * Math.sin(x * 0.7 + z * 0.5));
  };
  const gGeo = new THREE.PlaneGeometry(140, 76, 140, 76); gGeo.rotateX(-Math.PI / 2); gGeo.translate(0, 0, -24);
  { const gp = gGeo.attributes.position; for (let i = 0; i < gp.count; i++) gp.setY(i, hill(gp.getX(i), gp.getZ(i))); gGeo.computeVertexNormals(); }
  scene.add(new THREE.Mesh(gGeo, new THREE.MeshToonMaterial({ color: 0x5d82a8, gradientMap: grad })));
  const shadowTex = softTexture(2, 10, 28), shadowGeo = new THREE.PlaneGeometry(2.6, 1.3);
  /* Sapins : rendus 3D détourés (Magnific), plantés en volume dans la scène */
  const loadTex = (u) => { const x = new THREE.TextureLoader().load(u); x.colorSpace = THREE.SRGBColorSpace; x.anisotropy = 8; return x; };
  const treeMats = [tree1Img, tree2Img, tree3Img, tree4Img, tree5Img].map((u) => new THREE.MeshBasicMaterial({ map: loadTex(u), transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, color: 0xdbe6ff }));
  const TH = 4.2, treeGeo = new THREE.PlaneGeometry(TH * 0.75, TH); treeGeo.translate(0, TH / 2 - 0.0725 * TH, 0);
  const treeLights = []; const LCOL = [0xffd77a, 0xff6a5a, 0x8fbfff, 0xffe9a8];
  /* Vent et sillage : chaque sapin plie dans le vertex shader (plus on monte, plus il plie) et oscille sur un ressort amorti */
  const trees = [], BEND = 0.5;
  function swayMaterial(base) {
    const mat = base.clone(), u = { value: 0 };
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uBend = u;
      sh.vertexShader = 'uniform float uBend;\n' + sh.vertexShader.replace('#include <begin_vertex>',
        `#include <begin_vertex>
        float bh = max(0.0, (position.y + ${(0.0725 * TH).toFixed(4)}) / ${TH.toFixed(4)});
        transformed.x += uBend * bh * bh;
        transformed.y -= abs(uBend) * 0.12 * bh * bh;`);
    };
    mat.customProgramCacheKey = () => 'sway-tree';
    mat.userData.u = u; return mat;
  }
  const snowGeo2 = new THREE.SphereGeometry(1, 12, 9), snowMat2 = toon(0xdbe9f7);
  /* Petits cadeaux (boîte + ruban + nœud) et blocs de neige au pied des sapins */
  const giftGeo = new THREE.BoxGeometry(1, 1, 1);
  const giftMats = [0xB3202A, 0x1F4D3A, 0xC9A54C, 0xF2E8D5, 0x2E6B9A].map(toon), ribMats = [toon(0xC9A54C), toon(0xF2E8D5), toon(0xB3202A)];
  function gift(x, z) {
    const g = new THREE.Group(), w = 0.17 + Math.random() * 0.2, h = 0.14 + Math.random() * 0.2, d = 0.17 + Math.random() * 0.2, bi = (Math.random() * 5) | 0;
    const rm = ribMats[bi === 2 ? 1 : bi === 3 ? 2 : 0];
    const box = new THREE.Mesh(giftGeo, giftMats[bi]); box.scale.set(w, h, d); box.position.y = h / 2; g.add(box);
    const r1 = new THREE.Mesh(giftGeo, rm); r1.scale.set(w * 1.04, h * 1.04, d * 0.2); r1.position.y = h / 2; g.add(r1);
    const r2 = new THREE.Mesh(giftGeo, rm); r2.scale.set(w * 0.2, h * 1.04, d * 1.04); r2.position.y = h / 2; g.add(r2);
    const bow = new THREE.Mesh(giftGeo, rm); bow.scale.set(w * 0.34, h * 0.2, d * 0.34); bow.position.y = h + h * 0.08; bow.rotation.y = 0.78; g.add(bow);
    g.position.set(x, hill(x, z) - 0.01, z); g.rotation.y = Math.random() * 6.28; scene.add(g);
  }
  function props(x, z, s) {
    const n = 1 + ((Math.random() * 3) | 0);
    for (let k = 0; k < n; k++) gift(x + (Math.random() - 0.5) * 1.5 * s, z + 0.25 + Math.random() * 0.55);
    if (Math.random() < 0.8) clump(x + (Math.random() - 0.5) * 1.3 * s, z + 0.2 + Math.random() * 0.4, 0.14 + Math.random() * 0.2);
  }
  function tree(x, z, s) {
    const m = new THREE.Mesh(treeGeo, swayMaterial(treeMats[Math.floor(Math.random() * treeMats.length)]));
    const gy = hill(x, z); if (z > -26) props(x, z, s);
     m.position.set(x, gy - 0.04, z); m.scale.set(s, s, 1); scene.add(m);
    const sh = new THREE.Mesh(shadowGeo, new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.5, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.set(x, gy + 0.03, z + 0.05); sh.scale.set(s * 1.1, s, 1); scene.add(sh);
    const tr = { m, a: 0, v: 0, lights: [] }; trees.push(tr);
    if (z > -13) for (let k = 0; k < 11; k++) { // petites lumières qui scintillent dans le feuillage
      const f = Math.random(), hw = 0.36 * (TH * 0.75) * (1 - f) * 0.95;
      const l = new THREE.Sprite(additive(new THREE.SpriteMaterial({ map: sTex, color: LCOL[k % 4], transparent: true, depthWrite: false, fog: false, opacity: 0.5 })));
      l.position.set((Math.random() * 2 - 1) * hw, TH * (0.12 + 0.58 * f), 0.05); l.scale.setScalar(0.34 / s * (0.8 + Math.random() * 0.5));
      l.userData.ph = Math.random() * 6.28; l.userData.sp = 1.4 + Math.random() * 2.2; m.add(l); treeLights.push(l);
      tr.lights.push({ l, bx: l.position.x, h: (l.position.y + 0.0725 * TH) / TH });
    }
  }
  for (let i = 0; i < 34; i++) {
    const z = 5 - i * 1.55 + (Math.random() - 0.5) * 0.6, side = i % 2 ? 1 : -1;
    tree(side * (3.3 + Math.random() * 3.4), z, 0.85 + Math.random() * 0.6);
    if (i % 2 === 0) tree(-side * (5.2 + Math.random() * 7), z - 0.8, 1 + Math.random() * 0.7);
    if (i % 3 === 0) tree(side * (8.5 + Math.random() * 7), z - 0.4, 0.95 + Math.random() * 0.6);
  }
  /* Blocs de neige disséminés (jamais sur le chemin du Père Noël) */
  function clump(x, z, r) {
    const m = new THREE.Mesh(snowGeo2, snowMat2); m.scale.set(r * 1.25, r * 0.68, r); m.position.set(x, hill(x, z) + r * 0.2, z); m.rotation.y = Math.random() * 6.28; scene.add(m);
  }
  for (let i = 0; i < 90; i++) {
    const x = (Math.random() - 0.5) * 30, z = 4 - Math.random() * 34;
    if (Math.abs(x) < 2.6 && z > -4) continue;
    clump(x, z, 0.16 + Math.random() * 0.42);
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
  const SC = 1.05; santa.scale.setScalar(SC); scene.add(santa);
  const spot = (px, py) => { const o = new THREE.Object3D(); o.position.set((px / 600 - 0.5) * SW, (1 - py / 800) * SH, 0.05); rig.add(o); return o; };
  const mits = [spot(160, 170), spot(505, 470)]; // sac de cadeaux, main libre

  /* Neige + particules */
  const NN = 600; const np = new Float32Array(NN * 3), nv = new Float32Array(NN);
  for (let i = 0; i < NN; i++) { np[i * 3] = (Math.random() - 0.5) * 22; np[i * 3 + 1] = Math.random() * 10; np[i * 3 + 2] = -14 + Math.random() * 22; nv[i] = 0.3 + Math.random() * 0.6; }
  const snowGeo = new THREE.BufferGeometry(); snowGeo.setAttribute('position', new THREE.BufferAttribute(np, 3));
  scene.add(new THREE.Points(snowGeo, new THREE.PointsMaterial({ map: softTexture(), color: 0xF2E8D5, size: 0.14, transparent: true, depthWrite: false })));

  /* Étincelles : chaque particule a une position, une vitesse et une durée de vie.
     À chaque image : position += vitesse * dt ; durée restante -= dt ; opacité = durée restante / durée initiale ;
     à 0 la particule disparaît (sa place est réutilisée). De nouvelles étincelles naissent en continu près du Père Noël. */
  const PN = 7000;
  const pPos = new Float32Array(PN * 3), pCol = new Float32Array(PN * 3), pVel = new Float32Array(PN * 3);
  const pK = new Float32Array(PN), pR = new Float32Array(PN), pWA = new Float32Array(PN), pW = new Float32Array(PN), pAx = new Float32Array(PN), pAy = new Float32Array(PN), pLife = new Float32Array(PN), pMax = new Float32Array(PN), pS0 = new Float32Array(PN), pPh = new Float32Array(PN);
  const pAlpha = new Float32Array(PN), pSize = new Float32Array(PN), pRot = new Float32Array(PN);
  for (let i = 0; i < PN; i++) pPos[i * 3 + 1] = -99;
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3)); pGeo.setAttribute('aCol', new THREE.BufferAttribute(pCol, 3));
  pGeo.setAttribute('aAlpha', new THREE.BufferAttribute(pAlpha, 1)); pGeo.setAttribute('aSize', new THREE.BufferAttribute(pSize, 1)); pGeo.setAttribute('aRot', new THREE.BufferAttribute(pRot, 1));
  const pMat = additive(new THREE.ShaderMaterial({
    uniforms: { map: { value: sTex }, uScale: { value: 300 } }, transparent: true, depthWrite: false,
    vertexShader: `attribute vec3 aCol; attribute float aAlpha; attribute float aSize; attribute float aRot;
      uniform float uScale; varying vec3 vC; varying float vA; varying float vR;
      void main(){ vC = aCol; vA = aAlpha; vR = aRot; vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv; gl_PointSize = aSize * uScale / max(0.1, -mv.z); }`,
    fragmentShader: `uniform sampler2D map; varying vec3 vC; varying float vA; varying float vR;
      void main(){ vec2 p = gl_PointCoord - 0.5; float c = cos(vR), s = sin(vR); p = mat2(c, -s, s, c) * p + 0.5;
        vec4 t = texture2D(map, p); gl_FragColor = vec4(vC * (0.5 + 0.5 * t.r), t.a * vA);
        #include <colorspace_fragment>
      }`,
  }));
  const parts = new THREE.Points(pGeo, pMat);
  parts.frustumCulled = false; parts.renderOrder = 10; scene.add(parts); // dessiné après le Père Noël : la poussière passe devant lui
  const PCOL = [[1, 0.78, 0.26], [1, 0.84, 0.38], [1, 0.7, 0.16], [1, 0.88, 0.5]]; let pIdx = 0;
  function spawn(x, y, z, vx, vy, vz, life, size, bright = 1, kind = 0, R = 0) {
    const i = pIdx = (pIdx + 1) % PN;
    pPos[i * 3] = x; pPos[i * 3 + 1] = y; pPos[i * 3 + 2] = z;
    pVel[i * 3] = vx; pVel[i * 3 + 1] = vy; pVel[i * 3 + 2] = vz;
    pMax[i] = pLife[i] = life; pS0[i] = size; pK[i] = kind; pR[i] = R; pPh[i] = Math.random() * 6.283;
    const c = kind === 1 ? (Math.random() < 0.5 ? [1, 0.66, 0.12] : [1, 0.76, 0.22]) : PCOL[(Math.random() * PCOL.length) | 0]; pCol[i * 3] = c[0] * bright; pCol[i * 3 + 1] = c[1] * bright; pCol[i * 3 + 2] = c[2] * bright;
  }
  const pSizeRand = () => (Math.random() < 0.12 ? 0.42 + Math.random() * 0.3 : 0.12 + Math.random() * 0.26);
  function emit(n, o, speed, burst, spread = 0.25) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.8), b = Math.random() * Math.PI - Math.PI / 2;
      const x = o.x + (Math.random() - 0.5) * spread, y = o.y + (Math.random() - 0.5) * spread, z = o.z + (Math.random() - 0.5) * spread;
      if (burst) spawn(x, y, z, Math.cos(a) * Math.cos(b) * s, Math.sin(b) * s, Math.sin(a) * Math.cos(b) * s, 0.8 + Math.random() * 1.2, pSizeRand());
      else spawn(x, y, z, Math.cos(a) * s * 0.5, s * (0.2 + Math.random()), Math.sin(a) * s * 0.5 + 1.5, 0.7 + Math.random() * 1.1, pSizeRand());
    }
  }
  /* Rubans de poussière féerique : chaque ruban a un point d'émission accroché au Père Noël (à son côté, légèrement devant) ;
     les étincelles dérivent doucement dans une direction propre au ruban et ondulent de côté (sinus), puis s'estompent. */
  const RIB = [
    { o: [-0.95, 0.75, 0.5], d: [-0.5, 0.3, 0.5], A: 0.24, w: 3.0, ph: 0.0, r: 115 },
    { o: [0.9, 1.1, 0.55], d: [0.55, 0.28, 0.45], A: 0.2, w: 2.5, ph: 2.1, r: 110 },
    { o: [-0.85, 1.6, 0.55], d: [-0.45, 0.45, 0.4], A: 0.18, w: 3.6, ph: 4.0, r: 95 },
    { o: [0.85, 1.95, 0.5], d: [0.5, 0.4, 0.4], A: 0.2, w: 2.2, ph: 1.2, r: 95 },
    { o: [0.75, 0.4, 0.65], d: [0.4, 0.16, 0.6], A: 0.24, w: 2.1, ph: 3.1, r: 90 },
    { o: [-0.7, 0.3, 0.65], d: [-0.4, 0.14, 0.6], A: 0.2, w: 2.8, ph: 5.0, r: 80 },
  ];
  const ribAcc = RIB.map(() => 0);
  function fairy(dt, k) {
    RIB.forEach((rb, j) => {
      ribAcc[j] += dt * rb.r * k; const n = Math.floor(ribAcc[j]); ribAcc[j] -= n;
      for (let q = 0; q < n; q++) {
        const sp = 0.55 + Math.random() * 0.4, dl = Math.hypot(rb.d[0], rb.d[1], rb.d[2]);
        const dx = rb.d[0] / dl * sp, dy = rb.d[1] / dl * sp, dz = rb.d[2] / dl * sp, ax = -dy, ay = dx, al = Math.hypot(ax, ay) + 1e-4;
        const i = pIdx = (pIdx + 1) % PN;
        pPos[i * 3] = santa.position.x + rb.o[0] * SC + (Math.random() - 0.5) * 0.12; pPos[i * 3 + 1] = santa.position.y + rb.o[1] * SC + (Math.random() - 0.5) * 0.12; pPos[i * 3 + 2] = santa.position.z + rb.o[2] + (Math.random() - 0.5) * 0.12;
        pVel[i * 3] = dx; pVel[i * 3 + 1] = dy; pVel[i * 3 + 2] = dz;
        pMax[i] = pLife[i] = 2.2 + Math.random() * 1.0; pS0[i] = Math.random() < 0.08 ? 0.26 + Math.random() * 0.14 : 0.09 + Math.random() * 0.1; pPh[i] = rb.ph;
        pK[i] = 2; pW[i] = rb.w * (0.9 + Math.random() * 0.2); pWA[i] = rb.A * pW[i]; pAx[i] = ax / al; pAy[i] = ay / al; pR[i] = 0;
        const c = RIBC[(Math.random() * RIBC.length) | 0]; pCol[i * 3] = c[0]; pCol[i * 3 + 1] = c[1]; pCol[i * 3 + 2] = c[2];
      }
    });
  }
  const RIBC = [[1, 0.9, 0.6], [1, 0.8, 0.4], [1, 0.95, 0.82], [1, 0.74, 0.3]];

  // anneau de magie : centre et rayon suivis en douceur ; les étincelles qui y naissent suivent sa tangente
  let rcx = 0, rcy = 1.3, rcz = 0.2, rhs = 1.2, vAcc = 0; const rv = new THREE.Vector3();

  /* État */
  let lastSX = null, lastSZ = null, lastZ = null, phase = 'run', t0 = 0, time = 0, raf = 0, vortex = 0, flashed = false, revealed = false;
  const RUN = reduced ? 0.6 : 1.5, MAGIC = reduced ? 1.6 : 3.4;
  const tmp = new THREE.Vector3();
  function restart() { lastZ = null; lastSX = lastSZ = null; phase = 'run'; t0 = time; vortex = 0; flashed = revealed = false; santa.visible = true; cb.onPhase('run'); }
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

    const s = time - t0; let vTarget = vortex; const amp0 = reduced ? 0.35 : 1;
    const auraX = lastSX === null ? santa.position.x : lastSX, auraZ = lastSZ === null ? santa.position.z : lastSZ;
    if (phase === 'run') {
      const u = clamp(s / RUN), e = 1 - Math.pow(1 - u, 2.2);
      santa.position.set(Math.sin(u * 9) * 1.1 * (1 - u), 0, -17 + e * 17.2);
      santa.rotation.y = 0; pose('run', s, 0);
      rig.position.y = 0; santa.scale.setScalar(SC);
      if (u >= 1) { phase = 'greet'; t0 = time; cb.onPhase('greet'); }
    } else if (phase === 'greet') {
      santa.position.set(0, 0, 0.2); santa.rotation.y = 0; pose('jig', s, 0);
    } else if (phase === 'magic') {
      const m = clamp(s / MAGIC);
      pose('magic', s, m);
      const rise = Math.max(0, m - 0.2); santa.position.set(0, rise * rise * 5.5, 0.2);
      santa.scale.setScalar(SC * (1 - smooth((m - 0.5) / 0.4)));
      vTarget = smooth(m / 0.5);
      if (m > 0.2 && m < 0.85) emit(Math.round(240 * dt), tmp.set(santa.position.x, santa.position.y + 1.2, santa.position.z), 2.5, true, 0.6);
      if (!flashed && m >= 0.62) { flashed = true; emit(260, tmp.set(0, 2.2, 0.2), 5.5, true, 0.3); cb.onPhase('flash'); }
      if (!revealed && m >= 0.72) { revealed = true; santa.visible = false; cb.onPhase('reveal'); }
      if (m > 0.85) vTarget = 1 - smooth((m - 0.85) / 0.15) * 0.08;
      if (m >= 1) { phase = 'done'; t0 = time; cb.onPhase('done'); }
    } else { vTarget = 0.9 + Math.sin(time * 1.3) * 0.08; santa.visible = false; }
    vortex += (vTarget - vortex) * Math.min(1, dt * 6);
    { const fk = (phase === 'run' ? 1 : phase === 'greet' ? 1 : phase === 'magic' ? 1 - smooth(s / MAGIC / 0.4) : 0) * (reduced ? 0.4 : 1); if (fk > 0.01) fairy(dt, fk); }
    lastSX = santa.position.x; lastSZ = santa.position.z;

    // vent léger + sillage du Père Noël : un souffle pousse les sapins vers l'extérieur à son passage
    const sp = phase === 'run' && lastZ !== null ? clamp((santa.position.z - lastZ) / Math.max(dt, 1e-3) / 18) : 0; lastZ = santa.position.z;
    const amp = reduced ? 0.3 : 1, step = Math.min(dt, 0.033);
    for (const tr of trees) {
      const px = tr.m.position.x, pz = tr.m.position.z, dz = santa.position.z - pz;
      const gust = sp * Math.exp(-((dz + 0.8) * (dz + 0.8)) / 5.2) * Math.exp(-Math.abs(px - santa.position.x) / 9);
      const dir = (px - santa.position.x) >= 0 ? 1 : -1;
      const wind = 0.06 * Math.sin(time * 1.1 + px * 0.4 + pz * 0.25) + 0.04 * Math.sin(time * 2.3 + pz * 0.7 + px * 0.2);
      const acc = -36 * tr.a - 2.4 * tr.v + 36 * wind * amp + 30 * gust * dir * amp;
      tr.v += acc * step; tr.a += tr.v * step; tr.a = Math.max(-1.2, Math.min(1.2, tr.a));
      const bend = tr.a * BEND; tr.m.material.userData.u.value = bend;
      for (const L of tr.lights) L.l.position.x = L.bx + bend * L.h * L.h;
    }
    treeLights.forEach((l) => { l.material.opacity = 0.15 + 0.85 * Math.pow(0.5 + 0.5 * Math.sin(time * l.userData.sp + l.userData.ph), 2); });
    // lumière
    warm.position.set(santa.position.x, santa.position.y + 2.2, santa.position.z + 2);
    warm.intensity = phase === 'done' ? 0 : 14 + Math.sin(time * 5) * 2;
    // anneau doré qui tourne autour de la photo (ou autour du Père Noël avant la révélation)
    {
      const W = container.clientWidth || innerWidth, Hh = container.clientHeight || innerHeight;
      const fr = (phase === 'done' || revealed) && cb.frameRect ? cb.frameRect() : null;
      let tx = santa.position.x, ty = santa.position.y + 1.3, ths = 1.2;
      if (fr && fr.width > 20) {
        camera.updateMatrixWorld();
        rv.set(((fr.left + fr.width / 2) / W) * 2 - 1, -(((fr.top + fr.height / 2) / Hh) * 2 - 1), 0.5).unproject(camera).sub(camera.position).normalize();
        const k = (0.2 - camera.position.z) / rv.z; tx = camera.position.x + rv.x * k; ty = camera.position.y + rv.y * k;
        ths = (fr.width / 2) * (2 * (camera.position.z - 0.2) * Math.tan(THREE.MathUtils.degToRad(21)) / Hh);
      }
      const f = Math.min(1, dt * 5); rcx += (tx - rcx) * f; rcy += (ty - rcy) * f; rhs += (ths - rhs) * f;
    }
    if (vortex > 0.01) {
      // des étincelles naissent en continu sur l'anneau, avec une vitesse tangente : elles filent, s'éteignent, puis d'autres naissent
      vAcc += dt * vortex * (reduced ? 700 : 2400);
      const n = Math.min(Math.floor(vAcc), 160); vAcc -= Math.floor(vAcc);
      for (let k = 0; k < n; k++) {
        const th = Math.random() * 6.283, R = rhs * (1.0 + 0.5 * Math.pow(Math.random(), 1.2));
        const cx = Math.cos(th), sy = Math.sin(th), w = 1.4 * R;
        spawn(rcx + cx * R, rcy + sy * R, rcz + sy * 0.4 + (Math.random() - 0.5) * 0.3, -sy * w, cx * w, 0, 1.3 + Math.random() * 1.2, 0.07 + Math.random() * 0.13, 0.9, 1, R);
      }
    }
    // particules : position += vitesse * dt ; durée restante -= dt ; opacité = durée restante / durée initiale
    for (let i = 0; i < PN; i++) {
      if (pLife[i] > 0) {
        pLife[i] -= dt;
        if (pLife[i] <= 0) { pAlpha[i] = 0; pSize[i] = 0; pPos[i * 3 + 1] = -99; continue; }
        const f = pLife[i] / pMax[i];
        if (pK[i] === 2) {
          const age = pMax[i] - pLife[i], lat = pWA[i] * Math.cos(pW[i] * age + pPh[i]);
          pPos[i * 3] += (pVel[i * 3] + pAx[i] * lat) * dt; pPos[i * 3 + 1] += (pVel[i * 3 + 1] + pAy[i] * lat) * dt; pPos[i * 3 + 2] += pVel[i * 3 + 2] * dt;
          pVel[i * 3 + 1] += Math.sin(time * 1.7 + pS0[i] * 40) * dt * 0.1;
          const tw3 = 0.6 + 0.4 * Math.sin(time * 10 + pS0[i] * 90);
          // zone douce autour du visage et du buste : la poussière s'y estompe pour ne rien masquer
          const fx = pPos[i * 3] - santa.position.x, fy = pPos[i * 3 + 1] - (santa.position.y + 2.15 * SC);
          const dface = Math.min(1, Math.hypot(fx, fy * 0.85) / 0.9), mask = dface * dface * (3 - 2 * dface);
          const body = (Math.abs(fx) < 0.6 && fy < 0.2 && fy > -2.2) ? 0.55 : 1;
          pAlpha[i] = Math.min(1, f * 2.2) * Math.min(1, age * 3) * tw3 * (0.03 + 0.97 * mask) * body;
          pSize[i] = pS0[i] * (0.55 + 0.45 * f) * (0.8 + 0.2 * tw3); pRot[i] = pS0[i] * 50 + time * 0.6;
          continue;
        }
        if (pK[i] === 1) {
          // tourbillon : la vitesse est ramenée vers le sens de rotation autour du centre, et un ressort garde la particule sur son rayon
          const dx = pPos[i * 3] - rcx, dy = pPos[i * 3 + 1] - rcy, r = Math.hypot(dx, dy) + 1e-4, R = pR[i];
          const tx = -dy / r, ty = dx / r, w = 1.4 * R, k = Math.min(1, dt * 3.5), rad = (r - R) * 7 * dt;
          pVel[i * 3] += (tx * w - pVel[i * 3]) * k - (dx / r) * rad;
          pVel[i * 3 + 1] += (ty * w - pVel[i * 3 + 1]) * k - (dy / r) * rad;
          pPos[i * 3] += pVel[i * 3] * dt; pPos[i * 3 + 1] += pVel[i * 3 + 1] * dt;
          const tw2 = 0.65 + 0.35 * Math.sin(time * 9 + pPh[i] * 5);
          pAlpha[i] = Math.min(1, f * 2) * Math.min(1, (1 - f) * 8 + 0.2) * tw2; pSize[i] = pS0[i] * (0.5 + 0.5 * f) * (0.85 + 0.15 * tw2);
          pRot[i] = pPh[i] + time * 0.8;
          continue;
        }
        pPos[i * 3] += pVel[i * 3] * dt; pPos[i * 3 + 1] += pVel[i * 3 + 1] * dt; pPos[i * 3 + 2] += pVel[i * 3 + 2] * dt;
        const dr = Math.pow(0.5, dt * 2.2);
        pVel[i * 3] = pVel[i * 3] * dr + Math.sin(time * 2.3 + pPh[i]) * dt * 0.5;
        pVel[i * 3 + 1] = pVel[i * 3 + 1] * dr - 0.5 * dt;
        pVel[i * 3 + 2] *= dr;
        const tw = 0.7 + 0.3 * Math.sin(time * 11 + pPh[i] * 5);
        pAlpha[i] = Math.min(1, f * 1.6) * tw;
        pSize[i] = pS0[i] * (0.35 + 0.65 * f) * (0.85 + 0.15 * tw);
        pRot[i] = pPh[i] + time * (0.6 + 0.5 * Math.sin(pPh[i]));
      }
    }
    pMat.uniforms.uScale.value = renderer.getPixelRatio() * (container.clientHeight || innerHeight) * 0.5;
    pGeo.attributes.position.needsUpdate = true; pGeo.attributes.aCol.needsUpdate = true;
    pGeo.attributes.aAlpha.needsUpdate = true; pGeo.attributes.aSize.needsUpdate = true; pGeo.attributes.aRot.needsUpdate = true;
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
