// Petit serveur local pour tester : http://localhost:8080
import http from 'node:http';
import fs from 'node:fs';
http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(fs.readFileSync('dist/index.html'));
}).listen(8080, () => console.log('Santa Magica sur http://localhost:8080'));
