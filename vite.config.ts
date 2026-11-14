import vue from '@vitejs/plugin-vue';
import { defineConfig, loadEnv, type Plugin, type EnvironmentModuleNode } from 'vite';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// SSR sends visible markup before the client module graph has executed. Load
// its styles as blocking stylesheets so that the first paint is already styled.
function developmentStyles(entry: EnvironmentModuleNode | undefined): string {
 const visited = new Set<EnvironmentModuleNode>();
 const styles: string[] = [];
 function visit(module: EnvironmentModuleNode) {
  if (visited.has(module)) return;
  visited.add(module);
  if (/\.css(?:$|\?)/.test(module.url)) {
   // Keep Vue's trailing lang.css suffix intact for Vite's CSS detection.
   const url = module.url.includes('?') ? module.url.replace('?', '?direct&') : module.url + '?direct';
   styles.push(`<link rel="stylesheet" href="${url.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}" />`);
   return;
  }
  for (const dependency of module.importedModules) visit(dependency);
 }
 if (entry) visit(entry);
 return styles.join('\n');
}

function serverRendering(): Plugin {
 return {
  name: 'phase-ready-vue-ssr',
  configureServer(server) {
   return () => server.middlewares.use(async (req, res, next) => {
    try {
     let template = await server.transformIndexHtml(req.url || '/', await readFile(new URL('./index.html', import.meta.url), 'utf8'));
     const {respond} = await server.ssrLoadModule('/src/server/render.ts');
     const entry = await server.environments.ssr.moduleGraph.getModuleByUrl('/src/server/render.ts');
     template = template.replace('</head>', () => developmentStyles(entry) + '\n </head>');
     const {serveRequest} = await server.ssrLoadModule('/src/server/node.ts');
     await serveRequest(req, res, template, respond);
    } catch (cause) { if (cause instanceof Error) server.ssrFixStacktrace(cause); next(cause); }
   });
  }
 };
}

export default defineConfig(({isSsrBuild, mode}) => {
 const privateEnv = loadEnv(mode, process.cwd(), '');
 for (const key of ['DB_URL', 'ENABLE_SQL_LOGGING', 'ORIGIN']) {
  if (process.env[key] === undefined && privateEnv[key] !== undefined) process.env[key] = privateEnv[key];
 }
 return {
 plugins: [vue(), serverRendering()],
 appType: 'custom',
 publicDir: 'static',
 resolve: {alias: {'#lib': fileURLToPath(new URL('./src/lib', import.meta.url))}},
 build: {outDir: isSsrBuild ? 'build/server' : 'build/client', emptyOutDir: true}
 };
});
