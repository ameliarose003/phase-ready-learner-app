import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { respond } from './render.js';
import { serveRequest } from './node.js';
process.env.NODE_ENV = 'production';
const clientDir = fileURLToPath(new URL('../client/', import.meta.url));
const template = await readFile(path.join(clientDir, 'index.html'), 'utf8');
const mime: Record<string, string> = {'.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.json': 'application/json', '.webmanifest': 'application/manifest+json'};
const server = createServer(async (req, res) => {
 if (req.method === 'GET' || req.method === 'HEAD') {
  let filename: string;
  try { filename = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname); }
  catch { res.writeHead(400); res.end('Malformed URL'); return; }
  const full = path.resolve(clientDir, '.' + filename);
  if (full.startsWith(clientDir) && full !== path.join(clientDir, 'index.html') && path.extname(full)) {
   try {
    const data = await readFile(full);
    res.writeHead(200, {'content-type': mime[path.extname(full)] || 'application/octet-stream', 'cache-control': filename.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600'});
    res.end(req.method === 'HEAD' ? undefined : data); return;
   } catch { /* A route may contain a dot; let the router decide. */ }
  }
 }
 await serveRequest(req, res, template, respond);
});
server.listen(Number(process.env.PORT || 3000), process.env.HOST || '0.0.0.0', () => console.log('Phase Ready Vue server is listening on port ' + (process.env.PORT || 3000)));
for (const signal of ['SIGTERM', 'SIGINT'] as const) process.on(signal, () => server.close(() => process.exit(0)));
