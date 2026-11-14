import type { IncomingMessage, ServerResponse } from 'node:http';
export async function serveRequest(req: IncomingMessage, res: ServerResponse, template: string,
 respond: (request: Request, template: string, address: string) => Promise<Response>) {
 try {
  const origin = process.env.ORIGIN || `http://${req.headers.host || 'localhost'}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  const chunks: Buffer[] = []; let size = 0;
  for await (const chunk of req) {
   size += chunk.length;
   if (size > 1024 * 1024) { res.writeHead(413, {'content-type': 'text/plain'}); res.end('Form body is too large.'); return; }
   chunks.push(Buffer.from(chunk));
  }
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  const request = new Request(new URL(req.url || '/', origin), {method: req.method, headers, body});
  const response = await respond(request, template, req.socket.remoteAddress || 'unknown');
  res.statusCode = response.status;
  for (const [name, value] of response.headers) if (name !== 'set-cookie') res.setHeader(name, value);
  const cookies = response.headers.getSetCookie();
  if (cookies.length) res.setHeader('set-cookie', cookies);
  res.end(req.method === 'HEAD' ? undefined : Buffer.from(await response.arrayBuffer()));
 } catch (cause) {
  console.error(cause instanceof Error ? cause.message : 'Request failed');
  if (!res.headersSent) res.writeHead(500, {'content-type': 'text/plain', 'cache-control': 'no-store'});
  res.end('Unable to process this request.');
 }
}
