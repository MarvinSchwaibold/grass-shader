import { cp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { startPreview } from './preview-server.mjs';

const target = new URL('../ios/GrassStudyFluidDemo/GrassStudyFluidDemo/Resources/WebDemo/', import.meta.url);
const staging = new URL('../work/ios-web-staging/', import.meta.url);
const server = await startPreview();
try {
  const response = await fetch(`${server.url}/demo-two?native=1`);
  if (!response.ok) throw new Error(`Unable to render native page: ${response.status}`);
  let html = await response.text();
  if (!html.includes('grass-canvas')) throw new Error('Native page is missing its shader canvas');
  html = html.replace('</head>', '<link rel="stylesheet" href="/phone-overrides.css"/></head>');
  await rm(staging, { recursive: true, force: true });
  await mkdir(staging, { recursive: true });
  await cp(new URL('../dist/client/', import.meta.url), staging, { recursive: true });
  // Native AVPlayer owns videos. The WebView only needs scripts and textures.
  // Remove rejected terrain experiments even if they exist locally in public/.
  for (const name of ['grass-world', 'IMG_7400.mp4', 'IMG_7401.mp4', ...['7394','7398','7400','7401','7403','7406'].map(id => `study-${id}.mp4`)]) {
    await rm(new URL(name, staging), { recursive: true, force: true });
  }
  await writeFile(new URL('index.html', staging), html);
  await writeFile(new URL('phone-overrides.css', staging), await readFile(new URL('../ios/phone-overrides.css', import.meta.url)));
  await rm(target, { recursive: true, force: true });
  await rename(staging, target);
  console.log('Updated the bundled iPhone shader. Build and run the app in Xcode.');
} finally {
  await server.stop();
}
