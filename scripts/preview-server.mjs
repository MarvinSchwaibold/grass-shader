import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';

// Use an available loopback port so tests and iOS packaging do not disturb dev.
export async function startPreview() {
  const probe = createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const { port } = probe.address();
  await new Promise(resolve => probe.close(resolve));
  const child = spawn(process.execPath, ['node_modules/vinext/dist/cli.js', 'start', '-p', String(port), '-H', '127.0.0.1'], {
    cwd: new URL('..', import.meta.url), stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  child.stdout.on('data', data => { log += data; });
  child.stderr.on('data', data => { log += data; });
  const url = `http://127.0.0.1:${port}`;
  const stop = async () => {
    if (child.exitCode !== null) return;
    const ended = once(child, 'exit');
    child.kill('SIGTERM');
    await ended;
  };
  try {
    for (let i = 0; i < 150; i++) {
      if (child.exitCode !== null) throw new Error(log);
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
        if (response.ok) return { url, stop };
      } catch { /* Server is still starting. */ }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    throw new Error(`Preview did not start: ${log}`);
  } catch (error) {
    await stop();
    throw error;
  }
}
