// Construit dist/index.html : un seul fichier autonome (code, 3D et polices intégrés).
// Usage : node build.mjs [adresse-publique-de-l-appli]
import { build } from 'esbuild';
import fs from 'node:fs';

const b64 = (p) => fs.readFileSync(p).toString('base64');
const base = process.argv[2] || process.env.BASE_URL || '';

const bundle = await build({ entryPoints: ['src/main.js'], bundle: true, minify: true, format: 'iife', write: false, logLevel: 'warning' });
const js = bundle.outputFiles[0].text.replace(/<\/script>/g, '<\\/script>');

let fonts = '';
for (const w of [400, 600, 800]) {
  const p = `node_modules/@fontsource/montserrat/files/montserrat-latin-${w}-normal.woff2`;
  fonts += `@font-face{font-family:'Montserrat';font-weight:${w};font-style:normal;font-display:swap;src:url(data:font/woff2;base64,${b64(p)}) format('woff2')}\n`;
}
// Police des titres : à déposer à la main dans fonts/ (licence « usage personnel », voir README)
const star = 'fonts/MerryChristmasStar.ttf';
if (fs.existsSync(star)) {
  fonts += `@font-face{font-family:'Merry Christmas Star';font-weight:400;font-style:normal;font-display:swap;src:url(data:font/ttf;base64,${b64(star)}) format('truetype')}\n`;
} else {
  console.warn('Police fonts/MerryChristmasStar.ttf absente : les titres utiliseront une police script de secours.');
}

const html = fs.readFileSync('template.html', 'utf8')
  .replace('/*FONTS*/', () => fonts)
  .replace('/*SCRIPT*/', () => js)
  .replace('/*BASE*/', () => (base ? `window.__BASE_URL__=${JSON.stringify(base)};` : ''));
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/index.html', html);
console.log(`dist/index.html (${Math.round(html.length / 1024)} Ko)`);
