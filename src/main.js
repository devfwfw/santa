import { createStage } from './stage.js';
import colasLogo from './assets/colas.png';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
const first = (n) => n.trim().split(/\s+/)[0];
const initials = (n) => { const p = n.trim().split(/\s+/); return ((p[0] || '')[0] || '').toUpperCase() + (p.length > 1 ? (p[p.length - 1][0] || '').toUpperCase() : ''); };
const app = $('#app');
const APP = 'Mystère de Noël', TEAM = 'Team RH Colas';
const DEFAULT_BASE = (window.__BASE_URL__ || location.href.split('#')[0]);

/* ---------- Encodage compact des liens (lettres + chiffres uniquement) ---------- */
function pack(meta, photo) {
  const j = new TextEncoder().encode(JSON.stringify(meta));
  const out = new Uint8Array(4 + j.length + (photo ? photo.length : 0));
  new DataView(out.buffer).setUint32(0, j.length); out.set(j, 4); if (photo) out.set(photo, 4 + j.length);
  return out;
}
const B62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', BIG62 = 62n ** 10n;
const bytesToBig = (bytes) => { let hex = '01'; for (const b of bytes) hex += b.toString(16).padStart(2, '0'); return BigInt('0x' + hex); };
const bigToBytes = (n) => { let hex = n.toString(16); if (hex.length % 2) hex = '0' + hex; const out = new Uint8Array(hex.length / 2); for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16); return out.slice(1); };
function toB62(bytes) {
  let n = bytesToBig(bytes); const parts = [];
  while (n > 0n) { let r = n % BIG62; n /= BIG62; let c = ''; for (let i = 0; i < 10; i++) { c = B62[Number(r % 62n)] + c; r /= 62n; } parts.push(c); }
  return parts.reverse().join('').replace(/^0+/, '');
}
function fromB62(s) {
  let n = 0n, pos = 0, len = s.length % 10 || 10;
  while (pos < s.length) { const c = s.slice(pos, pos + len); pos += len; len = 10; let v = 0n; for (const ch of c) { const k = B62.indexOf(ch); if (k < 0) throw new Error('b62'); v = v * 62n + BigInt(k); } n = n * BIG62 + v; }
  return bigToBytes(n);
}
// anciens liens (#s-…) : base 36
function fromB36(s) {
  let n = 0n; const CH = 10;
  for (let i = 0; i < s.length; i += CH) { const c = s.slice(i, i + CH); n = n * (36n ** BigInt(c.length)) + BigInt(parseInt(c, 36)); }
  return bigToBytes(n);
}
function unpack(bytes) {
  const len = new DataView(bytes.buffer, bytes.byteOffset).getUint32(0);
  const meta = JSON.parse(new TextDecoder().decode(bytes.slice(4, 4 + len)));
  const rest = bytes.slice(4 + len);
  if (rest.length) meta.photoUrl = URL.createObjectURL(new Blob([rest], { type: 'image/jpeg' }));
  return meta;
}
const dataUrlToBytes = (u) => Uint8Array.from(atob(u.split(',')[1]), (c) => c.charCodeAt(0));

async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; } catch (e) {
    const ta = document.createElement('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (_) {}
    ta.remove(); return ok;
  }
}
let toastT;
function toast(msg) {
  let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2600);
}

/* ---------- Marque ---------- */
function brand(extra = '') {
  return `<header class="brand"><img class="logo" src="${colasLogo}" alt="Colas — We open the way">
  <div class="sep" aria-hidden="true"></div><div class="ttl"><b>${APP}</b><small>${TEAM} · 2026</small></div>${extra}</header>`;
}

const EXAMPLE = `Camille > Mehdi
Mehdi > Inès
Inès > Julien
Julien > Sofia
Sofia > Hugo
Hugo > Camille`;

/* ---------- ADMIN ---------- */
const QUAL = { leger: { label: 'Léger', size: 176, q: 0.6 }, standard: { label: 'Standard', size: 240, q: 0.66 }, fin: { label: 'Fin', size: 320, q: 0.72 } };
const photos = new Map();   // nom normalisé → photo d'origine réduite (360 px), sert à fabriquer les miniatures
const thumbs = new Map();   // nom|qualité → miniature carrée envoyée dans le lien
const DEFAULT_RULES = 'Budget maximum : 10 €\nMets le nom de ton ami secret dans le cadeau';
const adminState = { text: '', rules: DEFAULT_RULES, base: DEFAULT_BASE, quality: 'standard' };
let fromAdminFlag = false;

/* Sauvegarde locale (navigateur de l'organisateur uniquement, rien n'est envoyé à un serveur) */
const STORE = 'santa-magica-atelier-v1';
function saveAtelier() {
  const d = { t: adminState.text, r: adminState.rules, b: adminState.base === DEFAULT_BASE ? '' : adminState.base, q: adminState.quality };
  try { localStorage.setItem(STORE, JSON.stringify({ ...d, p: Object.fromEntries(photos) })); }
  catch (e) { try { localStorage.setItem(STORE, JSON.stringify(d)); toast('Photos trop lourdes pour la sauvegarde : le texte est enregistré, pas les photos.'); } catch (_) {} }
}
function loadAtelier() {
  try {
    const d = JSON.parse(localStorage.getItem(STORE) || 'null'); if (!d) return;
    adminState.text = d.t || ''; adminState.rules = typeof d.r === 'string' ? d.r : DEFAULT_RULES; if (d.b) adminState.base = d.b; if (QUAL[d.q]) adminState.quality = d.q;
    Object.entries(d.p || {}).forEach(([k, v]) => photos.set(k, v));
  } catch (e) {}
}
function clearAtelier() { try { localStorage.removeItem(STORE); } catch (e) {} photos.clear(); thumbs.clear(); Object.assign(adminState, { text: '', rules: DEFAULT_RULES, base: DEFAULT_BASE, quality: 'standard' }); }
loadAtelier();

/* « NOM, Prénom » devient « Prénom NOM » pour l'affichage */
const displayName = (s) => { const i = s.indexOf(','); return i < 0 ? s : `${s.slice(i + 1).trim()} ${s.slice(0, i).trim()}`.trim(); };
function parseMap(text) {
  const pairs = [], errors = [];
  text.split(/\r?\n/).forEach((line, i) => {
    const l = line.trim(); if (!l || l.startsWith('#')) return;
    const sep = /(?:->|→|=>|>)/.test(l) ? /\s*(?:->|→|=>|>)\s*/ : /\s*(?:;|\t|,)\s*/;
    const parts = l.split(sep).map((s) => s.trim()).filter(Boolean).map(displayName);
    if (parts.length !== 2) { errors.push(`Ligne ${i + 1} : « ${l} » — format attendu : Celui qui offre > Celui qui reçoit`); return; }
    pairs.push({ g: parts[0], r: parts[1], line: i + 1 });
  });
  const gs = new Map(), rs = new Map();
  pairs.forEach((p) => {
    if (norm(p.g) === norm(p.r)) errors.push(`Ligne ${p.line} : « ${p.g} » est associé(e) à lui/elle-même.`);
    if (gs.has(norm(p.g))) errors.push(`« ${p.g} » apparaît deux fois comme donneur (lignes ${gs.get(norm(p.g))} et ${p.line}).`); else gs.set(norm(p.g), p.line);
    if (rs.has(norm(p.r))) errors.push(`« ${p.r} » reçoit deux cadeaux (lignes ${rs.get(norm(p.r))} et ${p.line}).`); else rs.set(norm(p.r), p.line);
  });
  const people = new Map();
  pairs.forEach((p) => [p.g, p.r].forEach((n) => { if (!people.has(norm(n))) people.set(norm(n), n); }));
  return { pairs, errors, people: [...people.values()] };
}

async function fileToMaster(file) {
  const bmp = await createImageBitmap(file); const s = Math.min(bmp.width, bmp.height), size = Math.min(360, s);
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
  g.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, size, size);
  return c.toDataURL('image/jpeg', 0.82);
}
async function makeThumb(master, size, q) {
  const im = new Image(); im.src = master; await im.decode();
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
  g.drawImage(im, 0, 0, im.width, im.height, 0, 0, size, size);
  return c.toDataURL('image/jpeg', q);
}
async function ensureThumbs() {
  const Q = QUAL[adminState.quality];
  for (const [k, master] of photos) { const key = k + '|' + adminState.quality; if (!thumbs.has(key)) { try { thumbs.set(key, await makeThumb(master, Q.size, Q.q)); } catch (e) {} } }
}

function linkFor(p) {
  const meta = { v: 2, g: p.g, r: p.r }; const rules = adminState.rules.trim(); if (rules) meta.m = rules;
  const ph = thumbs.get(norm(p.r) + '|' + adminState.quality);
  const base = (adminState.base || DEFAULT_BASE).split('#')[0];
  return base + '#t-' + toB62(pack(meta, ph ? dataUrlToBytes(ph) : null));
}

function renderAdmin() {
  app.innerHTML = `${brand()}
  <div class="snow" aria-hidden="true"></div>
  <main class="admin">
    <section class="hero">
      <p class="eyebrow">Atelier de l'organisateur · ${TEAM}</p>
      <h1><span class="spark">${APP}</span></h1>
      <p class="lead">Le Secret Santa de la ${TEAM}. Collez la carte des duos : chaque collègue reçoit un lien personnel, le Père Noël accourt et lui révèle son ami secret.</p>
    </section>

    <section class="paper">
      <h2><span class="num">01</span>La carte des duos</h2>
      <p class="hint">Une ligne par duo : <code>NOM, Prénom &gt; NOM, Prénom</code> (celui qui offre &gt; celui qui reçoit)</p>
      <textarea id="map" rows="8" spellcheck="false" placeholder="Camille > Mehdi&#10;Mehdi > Inès&#10;…"></textarea>
      <div class="row"><button class="btn ghost small" id="ex">Charger un exemple</button><button class="btn ghost small" id="wipe">Tout effacer</button><span id="status" class="status"></span></div>
      <div id="errors"></div>
    </section>

    <section class="paper">
      <h2><span class="num">02</span>Règles du jeu <small>(facultatif)</small></h2>
      <p class="hint">Affichées sur la page de chaque collègue, dans un popup à la révélation et via le bouton « Règles du jeu ». Une règle par ligne.</p>
      <textarea id="rules" rows="3" placeholder="Budget, date de l'échange…"></textarea>
    </section>

    <section class="paper">
      <h2><span class="num">03</span>Les photos <small>(facultatif)</small></h2>
      <p class="hint">La photo de celui qui <b>reçoit</b> s'affiche à la révélation. Sans photo, ses initiales.</p>
      <div class="seg" id="qual" role="group" aria-label="Qualité des photos">${Object.entries(QUAL).map(([k, v]) => `<button type="button" class="btn ghost small" data-q="${k}">${v.label}</button>`).join('')}</div>
      <p class="hint" id="qualhint"></p>
      <div id="people" class="people"></div>
    </section>

    <section class="paper">
      <h2><span class="num">04</span>Les liens</h2>
      <p class="hint">Chaque lien est personnel et ne révèle que <b>la personne à offrir</b>. À envoyer en privé.</p>
      <label class="field">Adresse de l'application<input id="base" type="text" spellcheck="false"></label>
      <div id="links"></div>
    </section>
    <footer class="foot">L'atelier est enregistré sur cet appareil, dans ce navigateur : rien n'est envoyé à un serveur. Les données des duos vivent dans les liens.</footer>
  </main>`;
  const map = $('#map'), rules = $('#rules'), base = $('#base');
  map.value = adminState.text; rules.value = adminState.rules; base.value = adminState.base;
  let tm, seq = 0;
  const refresh = async () => {
    const my = ++seq;
    adminState.text = map.value; adminState.rules = rules.value; adminState.base = base.value.trim() || DEFAULT_BASE;
    const parsed = parseMap(map.value); renderStatus(parsed);
    await ensureThumbs(); if (my !== seq) return;
    renderPeople(parsed); renderLinks(parsed); renderQual(); saveAtelier();
  };
  [map, rules, base].forEach((el) => el.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(refresh, 200); }));
  $('#ex').addEventListener('click', () => { map.value = EXAMPLE; refresh(); });
  let armed = 0;
  $('#wipe').addEventListener('click', (e) => {
    if (!armed) { armed = 1; e.target.textContent = 'Confirmer l’effacement'; setTimeout(() => { armed = 0; e.target.textContent = 'Tout effacer'; }, 4000); return; }
    clearAtelier(); armed = 0; e.target.textContent = 'Tout effacer'; map.value = ''; rules.value = DEFAULT_RULES; base.value = adminState.base; refresh(); toast('Atelier vidé.');
  });
  $('#qual').querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => { adminState.quality = b.dataset.q; refresh(); }));
  refresh();
}

let lastLens = [];
function renderQual() {
  document.querySelectorAll('#qual [data-q]').forEach((b) => { const on = b.dataset.q === adminState.quality; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
  const Q = QUAL[adminState.quality];
  const withPhoto = lastLens.filter((x) => x.ph).map((x) => x.n);
  $('#qualhint').textContent = `Photo envoyée en ${Q.size} px : plus elle est fine, plus le lien est long.` + (withPhoto.length ? ` Lien moyen avec photo : ${Math.round(withPhoto.reduce((a, b) => a + b, 0) / withPhoto.length).toLocaleString('fr-FR')} caractères.` : '');
}

function renderStatus(parsed) {
  const s = $('#status'), e = $('#errors');
  s.textContent = parsed.pairs.length && !parsed.errors.length ? `${parsed.pairs.length} duo${parsed.pairs.length > 1 ? 's' : ''} · ${parsed.people.length} personnes` : '';
  e.innerHTML = parsed.errors.length ? `<ul class="errs">${parsed.errors.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
}

function renderPeople(parsed) {
  const el = $('#people');
  if (!parsed.people.length) { el.innerHTML = '<p class="empty">Les participants apparaîtront ici dès que la carte sera remplie.</p>'; return; }
  el.innerHTML = parsed.people.map((n) => {
    const ph = photos.get(norm(n));
    return `<div class="person"><div class="thumb">${ph ? `<img src="${ph}" alt="">` : `<span>${esc(initials(n))}</span>`}</div><b>${esc(n)}</b>
      <label class="btn ghost small">${ph ? 'Changer' : 'Ajouter une photo'}<input type="file" accept="image/*" data-n="${esc(n)}" hidden></label>
      ${ph ? `<button class="x" data-rm="${esc(n)}" aria-label="Retirer la photo de ${esc(n)}">×</button>` : ''}</div>`;
  }).join('');
  el.querySelectorAll('input[type=file]').forEach((inp) => inp.addEventListener('change', async () => {
    const f = inp.files[0]; if (!f) return;
    try { photos.set(norm(inp.dataset.n), await fileToMaster(f)); } catch (e) { toast("Cette image n'a pas pu être lue."); return; }
    await ensureThumbs(); const p = parseMap($('#map').value); renderPeople(p); renderLinks(p); saveAtelier();
  }));
  el.querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', () => { photos.delete(norm(b.dataset.rm)); const p = parseMap($('#map').value); renderPeople(p); renderLinks(p); saveAtelier(); }));
}

function renderLinks(parsed) {
  const el = $('#links');
  if (parsed.errors.length || !parsed.pairs.length) { el.innerHTML = `<p class="empty">${parsed.errors.length ? 'Corrigez la carte pour faire apparaître les liens.' : 'Les liens apparaîtront ici.'}</p>`; return; }
  const rows = parsed.pairs.map((p) => ({ p, url: linkFor(p) }));
  lastLens = rows.map((r) => ({ n: r.url.length, ph: thumbs.has(norm(r.p.r) + '|' + adminState.quality) }));
  el.innerHTML = `<div class="row"><button class="btn small" id="all">Copier tous les liens</button></div>
  <ul class="links">${rows.map((r, i) => `<li><div><b>${esc(r.p.g)}</b><small>${r.url.length <= 3000 ? 'lien court' : r.url.length <= 6500 ? 'lien moyen (photo) · mail ou Teams' : 'lien long (photo) · mail ou Teams, pas SMS'} · ${r.url.length.toLocaleString('fr-FR')} caractères</small></div>
    <div class="acts"><button class="btn small" data-c="${i}">Copier le lien</button><button class="btn ghost small" data-v="${i}">Aperçu</button></div></li>`).join('')}</ul>`;
  el.querySelectorAll('[data-c]').forEach((b) => b.addEventListener('click', async () => { const r = rows[+b.dataset.c]; await copyText(r.url); toast(`Lien copié — à envoyer en privé à ${first(r.p.g)}`); }));
  el.querySelectorAll('[data-v]').forEach((b) => b.addEventListener('click', () => { fromAdminFlag = true; location.hash = rows[+b.dataset.v].url.split('#')[1]; }));
  $('#all').addEventListener('click', async () => { await copyText(rows.map((r) => `${r.p.g} : ${r.url}`).join('\n')); toast('Tous les liens sont copiés (un par ligne).'); });
}

/* ---------- RÉVÉLATION ---------- */
let stage = null;
function renderReveal(data) {
  const isAdmin = fromAdminFlag; fromAdminFlag = false;
  document.title = `${APP} — ${TEAM}`;
  const rules = (data.m || DEFAULT_RULES).trim();
  const items = rules.split(/\n+/).map((l) => l.trim()).filter(Boolean).map((l) => `<li>${esc(l)}</li>`).join('');
  app.innerHTML = `${brand(isAdmin ? '<a class="back" href="#">← Atelier</a>' : '')}
  <button class="info" id="info" aria-haspopup="dialog"><i>i</i><span>Règles du jeu</span></button>
  <div class="modal" id="rules" role="dialog" aria-modal="true" aria-labelledby="rt" hidden>
    <div class="modal-bg" data-close></div>
    <div class="modal-card"><button class="close" data-close aria-label="Fermer">×</button>
      <p class="eyebrow">${TEAM}</p><h2 id="rt">Règles du jeu</h2>
      <ul class="rules-list">${items}</ul>
      <p class="friend">Ton ami secret : <b>${esc(data.r)}</b></p>
      <button class="btn" data-close>J'ai compris</button></div></div>
  <section class="reveal">
    <div class="canvas-wrap" id="cv"></div><div class="flash" id="flash"></div>
    <div class="ui">
      <div class="greet" id="greet" hidden>
        <p class="eyebrow">${TEAM} · Secret Santa</p>
        <h1><span class="spark">Bonjour ${esc(first(data.g))}, le Père Noël a une mission pour toi&nbsp;!</span></h1>
        <p class="lead">Tu fais partie des lutins de la ${TEAM} : quelqu'un compte sur toi pour son cadeau. Prêt(e) à découvrir ton ami secret&nbsp;?</p>
        <button class="btn big" id="go">Découvrir mon ami secret</button>
      </div>
      <div class="result" id="result" hidden>
        <p class="eyebrow">Tu offres un cadeau à</p>
        <div class="frame">${data.photoUrl ? `<img src="${data.photoUrl}" alt="Photo de ${esc(data.r)}">` : `<div class="mono">${esc(initials(data.r))}</div>`}</div>
        <h1 class="name spark">${esc(data.r)}</h1>
        <div class="after" id="after" hidden>
          <p class="note">Chut… garde le secret jusqu'à l'échange des cadeaux de la ${TEAM}.</p>
          <div class="row center"><button class="btn ghost small" id="again">Rejouer la magie</button><button class="btn ghost small" id="veil">Cacher</button></div>
        </div>
      </div>
    </div>
  </section>`;
  const greet = $('#greet'), result = $('#result'), flash = $('#flash'), rulesEl = $('#rules'), info = $('#info');
  let rtimer = 0;
  const setRules = (open) => {
    clearTimeout(rtimer); rulesEl.hidden = !open; info.setAttribute('aria-expanded', String(open));
    if (open) { void rulesEl.offsetWidth; rulesEl.classList.add('open'); $('.btn', rulesEl).focus(); } else { rulesEl.classList.remove('open'); info.focus({ preventScroll: true }); }
  };
  info.addEventListener('click', () => setRules(true));
  rulesEl.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) setRules(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !rulesEl.hidden) setRules(false); });
  $('#go').addEventListener('click', () => stage.magic());
  $('#again').addEventListener('click', () => { result.hidden = true; result.classList.remove('in', 'veil'); $('#after').hidden = true; stage.restart(); });
  $('#veil').addEventListener('click', (e) => { result.classList.toggle('veil'); e.target.textContent = result.classList.contains('veil') ? 'Révéler' : 'Cacher'; });

  stage = createStage($('#cv'), {
    onClick() {},
    frameRect() { const f = $('.frame, .mono', result); return f ? f.getBoundingClientRect() : null; },
    onPhase(p) {
      if (p === 'run') { greet.hidden = true; result.hidden = true; clearTimeout(rtimer); }
      if (p === 'greet') { greet.hidden = false; greet.classList.remove('out'); void greet.offsetWidth; greet.classList.add('in'); }
      if (p === 'magic') { greet.classList.add('out'); setTimeout(() => (greet.hidden = true), 400); }
      if (p === 'flash') { flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go'); }
      if (p === 'reveal') { result.hidden = false; void result.offsetWidth; result.classList.add('in'); }
      if (p === 'done') { $('#after').hidden = false; rtimer = setTimeout(() => setRules(true), 900); }
    },
  });
}

/* ---------- Routage ---------- */
function route() {
  if (stage) { stage.dispose(); stage = null; }
  const m = location.hash.match(/^#([st])-([0-9A-Za-z]+)$/);
  if (m) {
    let data = null; try { data = unpack(m[1] === 't' ? fromB62(m[2]) : fromB36(m[2])); } catch (e) {}
    if (data && data.g && data.r) { document.body.className = 'is-reveal'; renderReveal(data); return; }
    document.body.className = '';
    app.innerHTML = `${brand()}<main class="admin"><section class="paper"><h2>Ce lien est incomplet</h2><p>Le lien n'a pas pu être lu. Demandez à l'organisateur de vous le renvoyer en entier.</p><a class="btn" href="#">Aller à l'atelier</a></section></main>`;
    return;
  }
  document.body.className = ''; document.title = `${APP} — Atelier`;
  renderAdmin();
}
window.addEventListener('hashchange', route);
route();
