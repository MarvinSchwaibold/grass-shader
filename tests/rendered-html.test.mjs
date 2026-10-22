import assert from 'node:assert/strict';
import test from 'node:test';
import { startPreview } from '../scripts/preview-server.mjs';

test('production routes render the restored grass study and serve reference media', async () => {
  const server = await startPreview();
  try {
    const index = await (await fetch(server.url)).text();
    assert.match(index, /href="\/demo-one"/);
    assert.match(index, /href="\/demo-two"/);
    for (const route of ['/demo-one', '/demo-two', '/demo-two?native=1']) {
      const response = await fetch(server.url + route);
      assert.equal(response.status, 200);
      const html = await response.text();
      assert.match(html, /grass-canvas/);
      assert.match(html, /Wind strength/);
      assert.doesNotMatch(html, /grass-version-toggle|grass-world/);
      if (route === '/demo-one') assert.match(html, /Six original grass study recordings/);
      else assert.doesNotMatch(html, /Six original grass study recordings/);
      const scripts = [...html.matchAll(/(?:src|href)="([^" ]+\.js)"/g)].map(match => match[1]);
      assert.ok(scripts.length > 0);
      for (const src of new Set(scripts)) assert.equal((await fetch(new URL(src, server.url))).status, 200);
    }
    for (const name of ['IMG_7400', 'study-7394', 'study-7398', 'study-7400', 'study-7401', 'study-7403', 'study-7406']) {
      const response = await fetch(`${server.url}/${name}.mp4`, { headers: { Range: 'bytes=0-1023' } });
      assert.ok([200, 206].includes(response.status), `${name} must be served`);
      assert.match(response.headers.get('content-type'), /video\/mp4/);
      const bytes = (await response.arrayBuffer()).byteLength;
      assert.ok(response.status === 206 ? bytes === 1024 : bytes > 1024);
    }
  } finally { await server.stop(); }
});
