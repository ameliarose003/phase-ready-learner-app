import * as env from '$app/env/private';
import { dev } from '$app/env';
import { createDatabase } from './postgres.js';

// Import only in server files, such as +page.server.ts or +server.ts.
// SvelteKit prevents modules in src/lib/server from reaching the browser.
const db = createDatabase(env, dev);

export default db;
