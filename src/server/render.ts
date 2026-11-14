import { renderToString } from '@vue/server-renderer';
import { createApp, type PageState } from '../app.js';
import { handle } from '../hooks.server.js';
import { load as loadLayout } from './layout.js';
import { routes } from './routes.js';
import { createCookies, error, FormFailure, HttpError, Redirect, type Handler, type RequestEvent } from './http.js';
const escapeHtml = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');

function matchRoute(pathname: string) {
 for (const route of routes) {
  const keys: string[] = [];
  const pattern = route.path === '/' ? '^/$' : '^' + route.path.split('/').filter(Boolean).map(segment => {
   if (segment.startsWith('[...')) { keys.push(segment.slice(4, -1)); return '(?:/(.*))?'; }
   if (segment.startsWith('[')) { keys.push(segment.slice(1, -1)); return '/([^/]+)'; }
   return '/' + segment;
  }).join('') + '/?$';
  const match = pathname.match(new RegExp(pattern));
  if (match) return {route, params: Object.fromEntries(keys.map((key, i) => [key, match[i + 1]]))};
 }
 return null;
}

async function renderPage(state: PageState, template: string) {
 // Use JSON data on both server and client to keep hydration deterministic.
 const serializable: PageState = JSON.parse(JSON.stringify(state));
 const {app, head} = createApp(serializable);
 const markup = await renderToString(app);
 // Escape script delimiters so user input cannot become executable markup.
 const payload = JSON.stringify(serializable).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
 return template.replace('<!--app-head-->', () => '<title>' + escapeHtml(head.value.title) + '</title>')
  .replace('<!--app-html-->', () => markup)
  .replace('<!--app-state-->', () => '<script type="application/json" id="page-state">' + payload + '</script>');
}

export async function respond(request: Request, template: string, address: string): Promise<Response> {
 const url = new URL(request.url);
 let pathname: string;
 try { pathname = decodeURIComponent(url.pathname); } catch { return new Response('Malformed URL', {status: 400}); }
 const match = matchRoute(pathname);
 const {cookies, output} = createCookies(request.headers.get('cookie'));
 const event: RequestEvent = {request, url, params: match?.params ?? {}, route: {id: match?.route.path ?? pathname},
  locals: {} as App.Locals, cookies, getClientAddress: () => address, depends: () => {}};
 let response: Response;
 try {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && request.headers.get('origin') !== url.origin) error(403, 'Cross-origin form submissions are forbidden.');
  response = await handle({event, resolve: async () => {
   if (!match) error(404, 'Not found.');
   const {route} = match;
   const handlers = route.handlers as {load?: Handler; actions?: Record<string, Handler>; GET?: Handler; POST?: Handler};
   if (!route.page) {
    const handler = request.method === 'HEAD' ? handlers.GET : handlers[request.method as 'GET' | 'POST'];
    if (!handler) error(405, 'Method not allowed.');
    return await handler(event);
   }
   let form = null, status = 200;
   if (request.method === 'POST') {
    const actionName = [...url.searchParams.keys()].find(key => key.startsWith('/'))?.slice(1) ?? 'default';
    const action = handlers.actions?.[actionName];
    if (!action) error(405, 'Method not allowed.');
    const result = await action(event);
    if (result instanceof FormFailure) { status = result.status; form = result.data; }
   } else if (!['GET', 'HEAD'].includes(request.method)) error(405, 'Method not allowed.');
   const data = {...await loadLayout(event), ...await handlers.load?.(event)};
   const html = await renderPage({component: route.component, data, form, status, error: {message: ''}}, template);
   return new Response(html, {status, headers: {'content-type': 'text/html; charset=utf-8'}});
  }});
 } catch (cause) {
  if (cause instanceof Redirect) response = new Response(null, {status: cause.status, headers: {location: cause.location}});
  else {
   const status = cause instanceof HttpError ? cause.status : 500;
   const message = cause instanceof HttpError ? cause.message : 'Something went wrong. Please try again.';
   if (status === 500) console.error(cause instanceof Error ? cause.stack : 'Unexpected server failure');
   const data = {currentYear: new Date().getFullYear(), pathname: url.pathname, currentUser: null, isLoggedIn: false, flashMessages: {}};
   const html = await renderPage({component: '', data, form: null, status, error: {message}}, template);
   response = new Response(html, {status, headers: {'content-type': 'text/html; charset=utf-8'}});
  }
 }
 if (event.locals.session || request.method !== 'GET' || response.status >= 400) response.headers.set('cache-control', 'private, no-store');
 for (const cookie of output) response.headers.append('set-cookie', cookie);
 return response;
}
