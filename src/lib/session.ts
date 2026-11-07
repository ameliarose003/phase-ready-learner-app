import { writable } from 'svelte/store';

export type PublicUser = { id: number; name: string; email: string; role_name: string };
// Initialized per browser hydration. Never write account state to this store during SSR.
export const sessionUser = writable<PublicUser | null>(null);
