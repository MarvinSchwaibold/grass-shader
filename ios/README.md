# iPhone app

The native app presents three pages: the six reference recordings, a reference-media viewer, and the original live grass shader. Swipe horizontally between pages. The wind drawer controls the shader without triggering paging.

## Requirements

- macOS with Xcode 16 or newer (verified here with Xcode 26.6).
- iOS 17 or newer on an iPhone or simulator.
- Internet for the first Swift Package resolution. Wave is pinned to version 0.3.4.
- An Apple account and your own signing Team for a physical device. Simulator builds need no signing identity.

## Open and run

```sh
open ios/GrassStudyFluidDemo/GrassStudyFluidDemo.xcodeproj
```

Choose scheme **GrassStudyFluidDemo**, choose an iPhone simulator, and press Run. All required media and the web shader snapshot are committed. No web server is needed.

For a physical phone:

1. Connect and trust the phone, then select it as the run destination.
2. In the target's **Signing & Capabilities**, enable automatic signing and select your Team.
3. Change the bundle identifier from `com.marvinschwaibold.GrassStudyFluidDemo` to a unique identifier you control.
4. Follow Xcode's prompts to enable Developer Mode or trust the developer app on the phone, then Run.

Personal Team installs may require periodic reinstallation. This project is source for local installation, not an App Store or TestFlight distribution.

## Update the embedded shader

From the repository root:

```sh
npm ci
npm run ios:sync
```

This builds the web app, starts a temporary loopback production server, renders `/demo-two?native=1`, copies its client assets into `Resources/WebDemo`, and adds `ios/phone-overrides.css`. The temporary server stops automatically. Native videos remain in `Resources/`; they are not duplicated into WebDemo.

Rebuild the app in Xcode afterward. Commit the refreshed WebDemo files together with the source changes so someone cloning the repository gets the same shader. To change the phone layout, edit `ios/phone-overrides.css`, not the generated copy.

## Command-line build

From the repository root:

```sh
xcodebuild \
  -project ios/GrassStudyFluidDemo/GrassStudyFluidDemo.xcodeproj \
  -scheme GrassStudyFluidDemo \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath ios/DerivedData \
  CODE_SIGNING_ALLOWED=NO build
```

For an interactive simulator, select a concrete available iPhone destination in Xcode. A successful command-line build validates compilation, not real-device animation performance.

## How offline mode works

`ContentView.swift` owns native presentation; `LoopingVideoView.swift` plays bundled media. `BundledGrassWebView.swift` runs the shader in WKWebView. Its HTTP listener binds only to `127.0.0.1` on an ephemeral port on the phone, serving the bundled files. It does not contact a hosted site or your computer.

If the shader is blank, confirm `Resources/WebDemo/index.html` and its referenced `_next` assets are present; run `npm run ios:sync` and rebuild. If package resolution fails, use Xcode's File → Packages → Resolve Package Versions. Signing errors require your own Team and bundle identifier.
