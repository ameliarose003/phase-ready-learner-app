// Enforce production even when a developer's private .env sets NODE_ENV.
// This controls Vue's production runtime and Secure session-cookie defaults.
process.env.NODE_ENV = 'production';
const { build } = await import('vite');
await build();
await build({build: {ssr: 'src/server/production.ts'}});
