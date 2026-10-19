import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
await build({
  entryPoints: [root + 'js/pixel-studio-source.js'],
  outfile: root + 'js/pixel-studio.bundle.js',
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['safari15', 'chrome95', 'firefox95'],
  nodePaths: [fileURLToPath(new URL('node_modules', import.meta.url))],
  legalComments: 'inline',
});
console.log('Built js/pixel-studio.bundle.js');
