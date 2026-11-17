/* Coffre chiffré : chaque lien court contient un identifiant (8 caractères) et une clé secrète (22 caractères).
   Les données de chaque personne sont chiffrées (AES-GCM) avec sa clé et rangées dans cadeaux.json,
   publié avec le site. Sans la clé du lien, le fichier est illisible. */
const B62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
export const ID_LEN = 8, KEY_LEN = 22;

export function randomToken(n) {
  const out = []; const buf = new Uint8Array(n * 2);
  while (out.length < n) { crypto.getRandomValues(buf); for (const b of buf) { if (b < 248 && out.length < n) out.push(B62[b % 62]); } }
  return out.join('');
}
const toB64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(s); };
const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function aesKey(secret, usage) {
  const raw = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('mystere-de-noel|' + secret));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, [usage]);
}
export async function seal(bytes, secret) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(secret, 'encrypt'), bytes));
  const out = new Uint8Array(12 + ct.length); out.set(iv); out.set(ct, 12);
  return toB64(out);
}
export async function open(b64, secret) {
  const all = fromB64(b64);
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: all.slice(0, 12) }, await aesKey(secret, 'decrypt'), all.slice(12)));
}
