import SwiftUI
import UIKit
import Wave

private struct StudyAsset: Identifiable {
    enum Kind { case video, image }

    let id: Int
    let title: String
    let resource: String
    let thumbnail: String
    let kind: Kind

    static let all: [StudyAsset] = [
        .init(id: 0, title: "Grass Study Recording.mp4", resource: "IMG_7400", thumbnail: "IMG_7400-poster", kind: .video),
        .init(id: 1, title: "Pixel Hex Map", resource: "pixel-hex-map", thumbnail: "pixel-hex-map", kind: .image),
        .init(id: 2, title: "Color Relief Map", resource: "color-relief-map", thumbnail: "color-relief-map", kind: .image),
        .init(id: 3, title: "Gradient Map", resource: "gradient-map", thumbnail: "gradient-map", kind: .image),
        .init(id: 4, title: "Topographical Map", resource: "topographical-map", thumbnail: "topographical-map", kind: .image),
    ]
}

struct ContentView: View {
    @State private var page = 0

    var body: some View {
        TabView(selection: $page) {
            RecordingGridPage()
                .tag(0)

            ReferenceStudyPage()
                .tag(1)

            GeneratedStudyPage()
                .tag(2)
        }
        .tabViewStyle(.page(indexDisplayMode: .never))
        .background(Color.white)
        .ignoresSafeArea()
        .statusBarHidden(true)
    }
}

private struct RecordingGridPage: View {
    private let recordings = ["7394", "7398", "7400", "7401", "7403", "7406"]
    @StateObject private var motionStore = RecordingGridMotionStore(
        recordings: ["7394", "7398", "7400", "7401", "7403", "7406"]
    )
    @State private var selectedRecording: String?
    @State private var selectedSourceFrame: CGRect?
    @State private var returningRecordings: Set<String> = []
    @State private var isDragging = false
    @State private var dragStartFrame: CGRect = .zero
    @State private var dragStartRadius: CGFloat = 28
    @State private var flightID = 0

    var body: some View {
        GeometryReader { proxy in
            let horizontalInset: CGFloat = 14
            let topInset = max(proxy.safeAreaInsets.top, 12)
            let bottomInset = max(proxy.safeAreaInsets.bottom + 44, 58)
            let stageWidth = max(1, proxy.size.width - horizontalInset * 2)
            let stageHeight = max(1, proxy.size.height - topInset - bottomInset)
            let recordingHeight = max(1, (stageHeight - 24) / 3)
            let expandedFrame = CGRect(
                x: 0,
                y: 0,
                width: stageWidth,
                height: stageHeight
            )
            let recordingFrames = recordingFrames(
                stageWidth: stageWidth,
                recordingHeight: recordingHeight
            )

            ZStack {
                ForEach(recordings, id: \.self) { recording in
                    let sourceFrame = recordingFrames[recording] ?? .zero
                    let isActive = selectedRecording == recording
                    let isReturning = returningRecordings.contains(recording)

                    PersistentRecordingArtifact(
                        recording: recording,
                        motion: motionStore.motion(for: recording),
                        sourceFrame: sourceFrame,
                        isActive: isActive,
                        isReturning: isReturning
                    )
                    .allowsHitTesting(false)
                    .accessibilityHidden(true)
                    .zIndex(isActive ? 200 : isReturning ? 100 : 0)
                }

                // The persistent AVPlayer surfaces are render-only. Gesture
                // ownership lives in one geometry layer, just like the
                // Fluid Bookshelf canvas hit-test. This prevents an offscreen
                // UIViewRepresentable surface from swallowing sibling taps.
                ForEach(recordings, id: \.self) { recording in
                    let sourceFrame = recordingFrames[recording] ?? .zero
                    let isUnavailable = selectedRecording == recording
                        || returningRecordings.contains(recording)

                    if !isUnavailable {
                        RecordingHitTarget(
                            frame: sourceFrame,
                            cornerRadius: 15
                        )
                        .onTapGesture {
                            open(
                                recording,
                                sourceFrame: sourceFrame,
                                expandedFrame: expandedFrame
                            )
                        }
                        .accessibilityLabel(
                            "Open grass study recording IMG_\(recording)"
                        )
                        .accessibilityAddTraits(.isButton)
                        .zIndex(250)
                    }
                }

                if let activeRecording = selectedRecording {
                    ActiveRecordingHitTarget(
                        motion: motionStore.motion(for: activeRecording)
                    )
                    .onTapGesture {
                        close()
                    }
                    .highPriorityGesture(
                        dismissGesture(
                            recording: activeRecording,
                            stageHeight: stageHeight,
                            expandedFrame: expandedFrame
                        )
                    )
                    .accessibilityLabel(
                        "Grass study recording IMG_\(activeRecording). Tap or swipe down to close."
                    )
                    .accessibilityAddTraits(.isButton)
                    .zIndex(300)
                }
            }
            .frame(width: stageWidth, height: stageHeight)
            .background(Color.white)
            .coordinateSpace(name: "recording-stage")
            .position(
                x: proxy.size.width / 2,
                y: topInset + stageHeight / 2
            )
        }
        .background(Color.white)
    }

    private func dismissGesture(
        recording: String,
        stageHeight: CGFloat,
        expandedFrame: CGRect
    ) -> some Gesture {
        DragGesture(minimumDistance: 8)
            .onChanged { value in
                guard selectedRecording == recording else { return }
                let distance = max(0, value.translation.height)
                guard distance > 0 || isDragging else { return }

                let motion = motionStore.motion(for: recording)

                if !isDragging {
                    isDragging = true
                    flightID += 1
                    dragStartFrame = motion.frame
                    dragStartRadius = motion.cornerRadius
                    motion.beginInteraction()
                }

                let compressionProgress = min(
                    1,
                    distance / max(1, stageHeight * 0.32)
                )
                let scale = 1 - compressionProgress * 0.08
                let size = CGSize(
                    width: dragStartFrame.width * scale,
                    height: dragStartFrame.height * scale
                )
                let center = CGPoint(
                    x: dragStartFrame.midX + value.translation.width,
                    y: dragStartFrame.midY + distance
                )
                motion.setInteractive(
                    frame: CGRect(
                        x: center.x - size.width / 2,
                        y: center.y - size.height / 2,
                        width: size.width,
                        height: size.height
                    ),
                    cornerRadius: dragStartRadius - compressionProgress * 4
                )
            }
            .onEnded { value in
                guard selectedRecording == recording, isDragging else { return }
                isDragging = false
                let motion = motionStore.motion(for: recording)

                let projectionDuration: CGFloat = 0.2
                let releaseVelocityY = max(
                    0,
                    value.predictedEndTranslation.height
                        - value.translation.height
                ) / projectionDuration
                let releaseVelocityX = (
                    value.predictedEndTranslation.width
                        - value.translation.width
                ) / projectionDuration
                let shouldClose = value.translation.height > stageHeight * 0.12
                    || releaseVelocityY / max(1, stageHeight * 0.3) > 0.72
                let frameVelocity = gestureFrameVelocity(
                    x: releaseVelocityX,
                    y: releaseVelocityY,
                    stageHeight: stageHeight
                )

                if shouldClose {
                    close(frameVelocity: frameVelocity)
                } else {
                    flightID += 1
                    let openingFlightID = flightID
                    motion.retarget(
                        frame: expandedFrame,
                        cornerRadius: 28,
                        frameVelocity: frameVelocity,
                        radiusVelocity: -releaseVelocityY * 0.01,
                        completion: {
                            guard openingFlightID == flightID else { return }
                        }
                    )
                }
            }
    }

    private func open(
        _ recording: String,
        sourceFrame: CGRect,
        expandedFrame: CGRect
    ) {
        if selectedRecording != nil {
            handOffActiveRecordingToItsSource()
        }

        // A fresh selection accelerates any older cards that are still
        // returning. Those flights remain visible below the new active card,
        // but relinquish all interaction immediately.
        returningRecordings.forEach {
            motionStore.motion(for: $0).speedUpReturn()
        }

        flightID += 1
        let openingFlightID = flightID

        // A newly selected recording always begins at its own current grid
        // frame. It never inherits the outgoing recording's geometry.
        let motion = motionStore.motion(for: recording)
        motion.jump(frame: sourceFrame, cornerRadius: 15)
        selectedSourceFrame = sourceFrame
        selectedRecording = recording
        isDragging = false
        motion.retarget(
            frame: expandedFrame,
            cornerRadius: 28,
            completion: {
                guard openingFlightID == flightID,
                      selectedRecording == recording else { return }
            }
        )
    }

    private func recordingFrames(
        stageWidth: CGFloat,
        recordingHeight: CGFloat
    ) -> [String: CGRect] {
        let spacing: CGFloat = 12
        let recordingWidth = max(1, (stageWidth - spacing) / 2)
        return Dictionary(uniqueKeysWithValues: recordings.enumerated().map {
            index,
            recording in
            let column = index % 2
            let row = index / 2
            return (
                recording,
                CGRect(
                    x: CGFloat(column) * (recordingWidth + spacing),
                    y: CGFloat(row) * (recordingHeight + spacing),
                    width: recordingWidth,
                    height: recordingHeight
                )
            )
        })
    }

    private func close(frameVelocity: CGRect? = nil) {
        handOffActiveRecordingToItsSource(frameVelocity: frameVelocity)
    }

    private func handOffActiveRecordingToItsSource(
        frameVelocity: CGRect? = nil
    ) {
        guard let recording = selectedRecording,
              let sourceFrame = selectedSourceFrame else { return }

        let motion = motionStore.motion(for: recording)
        let snapshot = motion.snapshot()
        returningRecordings.insert(recording)

        motion.retarget(
            frame: sourceFrame,
            cornerRadius: 15,
            frameVelocity: frameVelocity ?? snapshot.frameVelocity,
            radiusVelocity: snapshot.radiusVelocity,
            completion: {
                returningRecordings.remove(recording)
            }
        )

        selectedRecording = nil
        selectedSourceFrame = nil
        isDragging = false
    }

    private func gestureFrameVelocity(
        x: CGFloat,
        y: CGFloat,
        stageHeight: CGFloat
    ) -> CGRect {
        let compressionRange = max(1, stageHeight * 0.32)
        let scaleVelocity = -0.08 * y / compressionRange
        let widthVelocity = dragStartFrame.width * scaleVelocity
        let heightVelocity = dragStartFrame.height * scaleVelocity
        return CGRect(
            x: x - widthVelocity / 2,
            y: y - heightVelocity / 2,
            width: widthVelocity,
            height: heightVelocity
        )
    }
}

private final class RecordingGridMotionStore: ObservableObject {
    private let motions: [String: WaveArtifactMotion]

    init(recordings: [String]) {
        motions = Dictionary(
            uniqueKeysWithValues: recordings.map { ($0, WaveArtifactMotion()) }
        )
    }

    func motion(for recording: String) -> WaveArtifactMotion {
        guard let motion = motions[recording] else {
            preconditionFailure("Missing motion state for recording \(recording)")
        }
        return motion
    }
}

private struct PersistentRecordingArtifact: View {
    let recording: String
    @ObservedObject var motion: WaveArtifactMotion
    let sourceFrame: CGRect
    let isActive: Bool
    let isReturning: Bool

    private var displayedFrame: CGRect {
        isActive || isReturning ? motion.frame : sourceFrame
    }

    private var displayedRadius: CGFloat {
        isActive || isReturning ? motion.cornerRadius : 15
    }

    var body: some View {
        LoopingVideoView(
            resource: "study-\(recording)",
            fileExtension: "mp4"
        )
        .frame(
            width: max(1, displayedFrame.width),
            height: max(1, displayedFrame.height)
        )
        .clipShape(
            RoundedRectangle(
                cornerRadius: displayedRadius,
                style: .continuous
            )
        )
        .position(x: displayedFrame.midX, y: displayedFrame.midY)
        .shadow(
            color: .black.opacity(isActive ? 0.13 : isReturning ? 0.08 : 0),
            radius: isActive ? 20 : 12,
            y: isActive ? 8 : 5
        )
    }
}

private struct RecordingHitTarget: View {
    let frame: CGRect
    let cornerRadius: CGFloat

    var body: some View {
        Color.clear
            .frame(
                width: max(1, frame.width),
                height: max(1, frame.height)
            )
            .contentShape(
                RoundedRectangle(
                    cornerRadius: cornerRadius,
                    style: .continuous
                )
            )
            .position(x: frame.midX, y: frame.midY)
    }
}

private struct ActiveRecordingHitTarget: View {
    @ObservedObject var motion: WaveArtifactMotion

    var body: some View {
        RecordingHitTarget(
            frame: motion.frame,
            cornerRadius: motion.cornerRadius
        )
    }
}

private struct WaveArtifactSnapshot {
    let frame: CGRect
    let cornerRadius: CGFloat
    let frameVelocity: CGRect
    let radiusVelocity: CGFloat
}

private final class WaveArtifactMotion: ObservableObject {
    @Published private(set) var frame: CGRect = .zero
    @Published private(set) var cornerRadius: CGFloat = 15

    private let frameAnimator: SpringAnimator<CGRect>
    private let radiusAnimator: SpringAnimator<CGFloat>
    private let standardDampingRatio: CGFloat
    private let standardResponse: CGFloat
    private var pendingCompletion: (() -> Void)?

    init(dampingRatio: CGFloat = 0.84, response: CGFloat = 0.40) {
        let spring = Spring(dampingRatio: dampingRatio, response: response)
        standardDampingRatio = dampingRatio
        standardResponse = response
        frameAnimator = SpringAnimator<CGRect>(spring: spring)
        radiusAnimator = SpringAnimator<CGFloat>(spring: spring)
        installFrameCompletionHandler()

        frameAnimator.valueChanged = { [weak self] value in
            self?.frame = value
        }
        radiusAnimator.valueChanged = { [weak self] value in
            self?.cornerRadius = value
        }
    }

    func jump(frame: CGRect, cornerRadius: CGFloat) {
        pendingCompletion = nil
        stopAnimators()
        frameAnimator.value = frame
        frameAnimator.target = frame
        frameAnimator.velocity = .zero
        radiusAnimator.value = cornerRadius
        radiusAnimator.target = cornerRadius
        radiusAnimator.velocity = .zero
        self.frame = frame
        self.cornerRadius = cornerRadius
    }

    func beginInteraction() {
        pendingCompletion = nil
        stopAnimators()
    }

    func setInteractive(frame: CGRect, cornerRadius: CGFloat) {
        frameAnimator.value = frame
        frameAnimator.target = frame
        frameAnimator.velocity = .zero
        radiusAnimator.value = cornerRadius
        radiusAnimator.target = cornerRadius
        radiusAnimator.velocity = .zero
        self.frame = frame
        self.cornerRadius = cornerRadius
    }

    func snapshot() -> WaveArtifactSnapshot {
        WaveArtifactSnapshot(
            frame: frame,
            cornerRadius: cornerRadius,
            frameVelocity: frameAnimator.velocity,
            radiusVelocity: radiusAnimator.velocity
        )
    }

    /// Tightens an in-flight return without replacing its completion or
    /// resetting its current position. Wave keeps the existing velocity while
    /// the faster spring immediately takes over on the next display-link tick.
    func speedUpReturn() {
        let fasterSpring = Spring(dampingRatio: 0.92, response: 0.22)
        frameAnimator.spring = fasterSpring
        radiusAnimator.spring = fasterSpring
    }

    func retarget(
        frame: CGRect,
        cornerRadius: CGFloat,
        frameVelocity: CGRect? = nil,
        radiusVelocity: CGFloat? = nil,
        completion: (() -> Void)? = nil
    ) {
        pendingCompletion = completion
        let standardSpring = Spring(
            dampingRatio: standardDampingRatio,
            response: standardResponse
        )
        frameAnimator.spring = standardSpring
        radiusAnimator.spring = standardSpring
        if let frameVelocity {
            frameAnimator.velocity = frameVelocity
        }
        if let radiusVelocity {
            radiusAnimator.velocity = radiusVelocity
        }

        frameAnimator.target = frame
        radiusAnimator.target = cornerRadius

        if frameAnimator.state != .running {
            frameAnimator.start()
        }
        if radiusAnimator.state != .running {
            radiusAnimator.start()
        }
    }

    private func stopAnimators() {
        frameAnimator.completion = nil
        radiusAnimator.completion = nil
        frameAnimator.stop()
        radiusAnimator.stop()
        installFrameCompletionHandler()
    }

    private func installFrameCompletionHandler() {
        frameAnimator.completion = { [weak self] event in
            guard case .finished = event else { return }
            let completion = self?.pendingCompletion
            self?.pendingCompletion = nil
            completion?()
        }
    }
}

private struct ReferenceStudyPage: View {
    @State private var selection = 0
    private let assets = StudyAsset.all

    private var selectedAsset: StudyAsset {
        assets.first(where: { $0.id == selection }) ?? assets[0]
    }

    var body: some View {
        GeometryReader { proxy in
            let horizontalInset: CGFloat = 14
            let topInset = max(proxy.safeAreaInsets.top, 12)
            let bottomInset = max(proxy.safeAreaInsets.bottom + 44, 58)
            let stageWidth = max(1, proxy.size.width - horizontalInset * 2)
            let stageHeight = max(1, proxy.size.height - topInset - bottomInset)

            ZStack(alignment: .bottom) {
                ZStack {
                    ForEach(assets) { asset in
                        Group {
                            switch asset.kind {
                            case .video:
                                LoopingVideoView(resource: asset.resource, fileExtension: "mp4")
                            case .image:
                                BundledImage(name: asset.resource)
                            }
                        }
                        .frame(width: stageWidth, height: stageHeight)
                        .clipped()
                        .opacity(selection == asset.id ? 1 : 0)
                        .accessibilityHidden(selection != asset.id)
                    }
                }
                .frame(width: stageWidth, height: stageHeight)
                .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
                .overlay(alignment: .topLeading) {
                    Text(selectedAsset.title)
                        .font(.system(size: 12, weight: .medium, design: .monospaced))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(.black.opacity(0.42), in: Capsule())
                        .padding(14)
                }

                ThumbnailRail(assets: assets, selection: $selection)
                    .offset(y: 35)
            }
            .frame(width: stageWidth, height: stageHeight)
            .position(
                x: proxy.size.width / 2,
                y: topInset + stageHeight / 2
            )
            .animation(.smooth(duration: 0.34), value: selection)
        }
        .background(Color.white)
    }
}

private struct ThumbnailRail: View {
    let assets: [StudyAsset]
    @Binding var selection: Int

    var body: some View {
        HStack(spacing: 7) {
            ForEach(assets) { asset in
                Button {
                    withAnimation(.spring(response: 0.42, dampingFraction: 0.78)) {
                        selection = asset.id
                    }
                } label: {
                    BundledImage(name: asset.thumbnail)
                        .frame(width: 34, height: 60)
                        .clipShape(RoundedRectangle(cornerRadius: 9, style: .continuous))
                        .overlay {
                            if selection == asset.id {
                                RoundedRectangle(cornerRadius: 9, style: .continuous)
                                    .strokeBorder(.black.opacity(0.82), lineWidth: 2)
                            }
                        }
                        .contentShape(RoundedRectangle(cornerRadius: 9, style: .continuous))
                }
                .buttonStyle(FluidThumbnailButtonStyle())
                .accessibilityLabel(asset.title)
                .accessibilityAddTraits(selection == asset.id ? .isSelected : [])
            }
        }
        .padding(6)
        .background(.white, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .shadow(color: .black.opacity(0.12), radius: 18, y: 8)
    }
}

private struct BundledImage: View {
    let name: String

    var body: some View {
        if let image = loadImage() {
            Image(uiImage: image)
                .resizable()
                .scaledToFill()
        } else {
            Color(white: 0.94)
        }
    }

    private func loadImage() -> UIImage? {
        for fileExtension in ["png", "jpg", "jpeg"] {
            if let path = Bundle.main.path(forResource: name, ofType: fileExtension),
               let image = UIImage(contentsOfFile: path) {
                return image
            }
        }
        return nil
    }
}

private struct FluidThumbnailButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.92 : 1)
            .animation(.spring(response: 0.28, dampingFraction: 0.68), value: configuration.isPressed)
    }
}

private struct GeneratedStudyPage: View {
    var body: some View {
        GeometryReader { proxy in
            let horizontalInset: CGFloat = 14
            let topInset = max(proxy.safeAreaInsets.top, 12)
            let bottomInset = max(proxy.safeAreaInsets.bottom + 44, 58)
            let controlOverflow: CGFloat = 56
            let stageWidth = max(1, proxy.size.width - horizontalInset * 2)
            let stageHeight = max(1, proxy.size.height - topInset - bottomInset)

            BundledGrassWebView()
                .frame(
                    width: stageWidth,
                    height: stageHeight + controlOverflow
                )
                .position(
                    x: proxy.size.width / 2,
                    y: topInset + (stageHeight + controlOverflow) / 2
                )
        }
        .background(Color.white)
    }
}

#Preview {
    ContentView()
}
