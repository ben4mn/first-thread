import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const base = process.env.PAGES_BASE_PATH || '';
const root = resolve('dist/client');
const html = await readFile(resolve(root, 'index.html'), 'utf8');
assert.ok(html.includes('First Thread'));
const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((p) => p.startsWith('/'));
assert.ok(refs.some((p) => p.endsWith('.js')));
assert.ok(refs.some((p) => p.endsWith('.css')));
for (const ref of refs) {
  assert.ok(ref.startsWith(base + '/'), `Wrong deployment prefix: ${ref}`);
  assert.ok(
    (await stat(resolve(root, '.' + ref.slice(base.length)))).isFile(),
    `Missing asset ${ref}`,
  );
}
process.stdout.write(
  `Verified index.html and ${refs.length} deployment assets under ${base || '/'}.\n`,
);
