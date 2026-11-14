/** Framework-independent HTTP types shared by controllers and the Node server. */
export interface CookieOptions {
 path?: string; httpOnly?: boolean; sameSite?: 'lax' | 'strict' | 'none';
 secure?: boolean; expires?: Date; maxAge?: number;
}
export interface RequestEvent {
 request: Request; url: URL; params: Record<string, string | undefined>; route: {id: string | null};
 locals: App.Locals;
 cookies: {get(name: string): string | undefined; set(name: string, value: string, options: CookieOptions): void; delete(name: string, options: CookieOptions): void};
 getClientAddress(): string;
 depends(key: string): void;
}
export type Handler = (event: RequestEvent) => any;
export type Loader = Handler;
export type Handle = (input: {event: RequestEvent; resolve: (event: RequestEvent) => Promise<Response>}) => Promise<Response>;
export class HttpError extends Error {
 body: {message: string};
 constructor(public status: number, message: string) { super(message); this.body = {message}; }
}
export class Redirect extends Error {
 constructor(public status: number, public location: string) { super('Redirect'); }
}
export class FormFailure<T> {
 constructor(public status: number, public data: T) {}
}
export function error(status: number, message: string): never { throw new HttpError(status, message); }
export function redirect(status: number, location: string): never { throw new Redirect(status, location); }
export function fail<T>(status: number, data: T) { return new FormFailure(status, data); }
export function json(data: unknown, init?: ResponseInit) { return Response.json(data, init); }

export function createCookies(header: string | null) {
 const jar = new Map<string, string>();
 for (const entry of (header ?? '').split(';')) {
  const at = entry.indexOf('=');
  if (at < 0) continue;
  try { jar.set(entry.slice(0, at).trim(), decodeURIComponent(entry.slice(at + 1).trim())); } catch { /* Ignore invalid cookies. */ }
 }
 const output: string[] = [];
 function set(name: string, value: string, options: CookieOptions) {
  jar.set(name, value);
  const parts = [name + '=' + encodeURIComponent(value), 'Path=' + (options.path ?? '/')];
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (options.sameSite) parts.push('SameSite=' + options.sameSite);
  if (options.expires) parts.push('Expires=' + options.expires.toUTCString());
  if (options.maxAge !== undefined) parts.push('Max-Age=' + options.maxAge);
  output.push(parts.join('; '));
 }
 return {output, cookies: {get: (name: string) => jar.get(name), set,
  delete(name: string, options: CookieOptions) { set(name, '', {...options, maxAge: 0, expires: new Date(0)}); jar.delete(name); }
 }};
}
