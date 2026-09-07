// Serve the actual Pages subdirectory locally, with no extra dependencies.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('dist/client');
const prefix = '/first-thread';
const port = Number(process.env.PORT || 5275);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.rsc': 'text/x-component',
};
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, 'http://localhost').pathname,
    );
    if (pathname === '/' || pathname === prefix) {
      res.writeHead(302, { Location: prefix + '/' });
      res.end();
      return;
    }
    if (!pathname.startsWith(prefix + '/')) throw new Error('Not found');
    let file = resolve(root, '.' + pathname.slice(prefix.length));
    if (file !== root && !file.startsWith(root + sep))
      throw new Error('Not found');
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': mime[extname(file)] || 'application/octet-stream',
    });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(port, '127.0.0.1', () =>
  process.stdout.write(`Pages preview: http://localhost:${port}${prefix}/\n`),
);
