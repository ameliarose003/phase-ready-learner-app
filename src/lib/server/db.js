import { createDatabase } from './postgres.js';
// This module is imported only by the server entry; never by the Vue browser entry.
export default createDatabase(process.env, import.meta.env.DEV);
