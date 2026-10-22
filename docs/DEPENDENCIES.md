# Dependency maintenance

Install with `npm ci` so the checked-in lockfile is used. After updating dependencies, run `npm run check`, verify the moving grass and reference videos in a browser, and run `npm run ios:sync` before rebuilding the iPhone app.

The 2026-10-22 cleanup updated React, React DOM, React Server Components, vinext, Vite, and compatible transitive packages. `npm audit` still reports upstream advisories through `braces` (build/lint glob parsing) and `fflate` (the framework's Open Graph dependency chain). The grass app does not accept glob patterns or uploaded ZIP files, but these dependencies are not declared vulnerability-free. Recheck the current audit before hosting the app publicly. Do not use `npm audit fix --force` without reviewing the resulting framework downgrades and retesting both platforms.

Repository visibility and website deployment are separate: publishing this repository does not deploy a public server.
