// Construit dist/index.html : un seul fichier autonome (code, 3D et polices intégrés).
// Usage : node build.mjs [adresse-publique-de-l-appli]
import { build } from 'esbuild';
import fs from 'node:fs';

const b64 = (p) => fs.readFileSync(p).toString('base64');
const base = process.argv[2] || process.env.BASE_URL || '';

const bundle = await build({ entryPoints: ['src/main.js'], bundle: true, minify: true, format: 'iife', write: false, loader: { '.png': 'dataurl' }, logLevel: 'warning' });
const js = bundle.outputFiles[0].text.replace(/<\/script>/g, '<\\/script>');

let fonts = '';
for (const w of [400, 600, 800]) {
  const p = `node_modules/@fontsource/montserrat/files/montserrat-latin-${w}-normal.woff2`;
  fonts += `@font-face{font-family:'Montserrat';font-weight:${w};font-style:normal;font-display:swap;src:url(data:font/woff2;base64,${b64(p)}) format('woff2')}\n`;
}
// Police des titres : Norican (licence OFL, libre y compris en entreprise)
fonts += `@font-face{font-family:'Norican';font-weight:400;font-style:normal;font-display:swap;src:url(data:font/woff2;base64,${b64('node_modules/@fontsource/norican/files/norican-latin-400-normal.woff2')}) format('woff2')}\n`;

const html = fs.readFileSync('template.html', 'utf8')
  .replace('/*FONTS*/', () => fonts)
  .replace('/*SCRIPT*/', () => js)
  .replace('/*BASE*/', () => (base ? `window.__BASE_URL__=${JSON.stringify(base)};` : ''));
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/index.html', html);
console.log(`dist/index.html (${Math.round(html.length / 1024)} Ko)`);
