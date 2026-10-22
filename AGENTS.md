# Agent guide — Grass Shader

## Start here

Read `README.md` and `ios/README.md`. Use Node 22.13+ and `npm ci`.
Run `npm run dev`; the primary desktop page is `http://localhost:5207/demo-one`.
There are no required secrets, database bindings, or hosted services.

## Product constraints

- Preserve the original grass appearance: authored clumps, blade detail, camera, lighting, and flowing wind are intentional.
- Do not add unsolicited UI to any demo. Keep the canvas free of toolbars, shortcut hints, status counters, labels, navigation buttons, or explanatory chrome. Add controls only when explicitly requested. Existing wind and reference controls remain.
- Do not reintroduce the rejected Blender renderer, terrain remapping, or Before/After switch.
- A numerical geometry check does not establish visual fidelity. Compare actual rendered images and motion before claiming a visual change is correct.
- Do not replace the grass renderer or change its camera as part of unrelated cleanup.

## Architecture

`app/OrnamentalGrass.tsx` owns the WebGL2 renderer, GLSL strings, deterministic base/mound blade generation, wind controls, reference selector, and video grid interactions. `start()` returns a cleanup function that cancels animation and disposes GPU resources. Preserve that lifecycle.

`GrassDemoRoute` composes the same experience for both routes. `/demo-one` includes the six-recording grid; `/demo-two` omits it. `app/page.tsx` is the demo index.

The native app lives in `ios/GrassStudyFluidDemo`. SwiftUI owns paging and gestures; AVPlayer owns native videos. `BundledGrassWebView.swift` serves `Resources/WebDemo` over an on-device loopback HTTP server for the shader. `?native=1` selects the existing native launch settings. Keep the wind drawer touch region separate from the native paging gesture.

`Resources/WebDemo` is a committed generated snapshot so a clone can run directly in Xcode. Do not hand-edit its hashed JS/CSS. Change web source or `ios/phone-overrides.css`, then run `npm run ios:sync`. Native AVPlayer media lives beside WebDemo and must not be removed by the sync process.

## Validate

1. `npm run check` — types, lint, build, production routes, client assets, and video delivery.
2. Check both demo routes in a browser. Verify videos advance, the grass animates, wind responds, and recording expansion/dismissal works. Check a phone-sized viewport for relevant changes.
3. For native changes, read `ios/README.md`, sync if web source changed, and build the Xcode project with signing disabled for Simulator. Device signing belongs to the person installing the app.
4. A simulator build does not prove real-device frame rate or gestures. State that limitation when reporting validation.

## Repository hygiene

Keep dependency changes locked in `package-lock.json`. CI uses `npm ci`.
Never commit credentials, provisioning profiles, personal Xcode state, node_modules, build output, local gallery state, or experimental Blender exports. `work/` and `outputs/` are ignored scratch directories. The bundled iPhone WebDemo is the deliberate exception for generated output.
Keep user-authored media and the restored shader intact. Public repository visibility does not imply permission to add an open-source license or relicense footage; obtain the owner's chosen license before adding one.
