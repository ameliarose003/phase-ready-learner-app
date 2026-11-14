import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

// A separate process exercises the built server without loading private .env files.
const port = 5187;
const origin = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ['build/server/production.js'], {
 windowsHide: true, env: {...process.env, NODE_ENV: 'production', PORT: String(port), HOST: '127.0.0.1', ORIGIN: origin, DB_URL: ''},
 stdio: ['ignore', 'pipe', 'pipe']
});
let errors = '';
child.stderr.on('data', chunk => { errors += chunk; });
try {
 await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('Production server did not start: ' + errors)), 15000);
  child.stdout.once('data', () => { clearTimeout(timeout); resolve(); });
  child.once('error', reject);
  child.once('exit', code => { clearTimeout(timeout); reject(new Error('Server exited: ' + code + ' ' + errors)); });
 });
 for (const pathname of ['/', '/login', '/signup', '/api/me']) {
  const response = await fetch(origin + pathname);
  assert.equal(response.status, 200, pathname + ': ' + await response.clone().text());
 }
 const html = await (await fetch(origin)).text();
 const payload = html.match(/<script type="application\/json" id="page-state">([\s\S]*?)<\/script>/)[1];
 assert.equal(JSON.parse(payload).data.NODE_ENV, 'production');
 const asset = html.match(/src="([^"]+\.js)"/)[1];
 const javascript = await fetch(origin + asset);
 assert.equal(javascript.status, 200);
 assert.match(javascript.headers.get('content-type'), /javascript/);
 const bundle = await javascript.text();
 assert.ok(!bundle.includes('DB_URL'));
 assert.ok(!bundle.includes('phase_ready_session'));
 assert.equal((await fetch(origin + '/missing-page')).status, 404);
 console.log('Production smoke passed: pages, API, static assets, 404, and private-code boundaries.');
} finally {
 child.kill();
}
