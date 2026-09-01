import SwiftUI
import UIKit

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
    @StateObject private var transition = RetargetableProgressSpring()
    @StateObject private var dragOffsetX = RetargetableProgressSpring(
        allowedRange: nil
    )
    @StateObject private var dragOffsetY = RetargetableProgressSpring(
        allowedRange: nil
    )
    @StateObject private var dragScale = RetargetableProgressSpring(
        initialValue: 1,
        allowedRange: 0.86...1
    )
    @State private var selectedRecording: String?
    @State private var selectedSourceFrame: CGRect?
    @State private var recordingFrames: [String: CGRect] = [:]
    @State private var isDragging = false

    var body: some View {
        GeometryReader { proxy in
            let horizontalInset: CGFloat = 14
            let topInset = max(proxy.safeAreaInsets.top, 12)
            let bottomInset = max(proxy.safeAreaInsets.bottom + 44, 58)
            let stageWidth = max(1, proxy.size.width - horizontalInset * 2)
            let stageHeight = max(1, proxy.size.height - topInset - bottomInset)
            let recordingHeight = max(1, (stageHeight - 24) / 3)
            let targetFrame = CGRect(
                x: 0,
                y: 0,
                width: stageWidth,
                height: stageHeight
            )

            ZStack {
                LazyVGrid(
                    columns: [
                        GridItem(.flexible(), spacing: 12),
                        GridItem(.flexible(), spacing: 12),
                    ],
                    spacing: 12
                ) {
                    ForEach(recordings, id: \.self) { recording in
                        Button {
                            open(recording)
                        } label: {
                            LoopingVideoView(
                                resource: "study-\(recording)",
                                fileExtension: "mp4"
                            )
                            .frame(maxWidth: .infinity)
                            .frame(height: recordingHeight)
                            .clipShape(RoundedRectangle(cornerRadius: 15, style: .continuous))
                            .contentShape(RoundedRectangle(cornerRadius: 15, style: .continuous))
                        }
                        .frame(maxWidth: .infinity)
                        .background {
                            GeometryReader { itemProxy in
                                Color.clear.preference(
                                    key: RecordingFramePreferenceKey.self,
                                    value: [
                                        recording: itemProxy.frame(
                                            in: .named("recording-stage")
                                        )
                                    ]
                                )
                            }
                        }
                        .opacity(selectedRecording == recording ? 0 : 1)
                        .buttonStyle(FluidThumbnailButtonStyle())
                        .accessibilityLabel("Open grass study recording IMG_\(recording)")
                    }
                }
                .frame(width: stageWidth, height: stageHeight)
                .allowsHitTesting(selectedRecording == nil)

                if let selectedRecording,
                   let sourceFrame = selectedSourceFrame {
                    let progress = clamped(transition.value)
                    let visualFrame = interpolatedFrame(
                        from: sourceFrame,
                        to: targetFrame,
                        progress: progress
                    )
                    let visualRadius = interpolatedValue(
                        from: 15,
                        to: 28,
                        progress: progress
                    )
                    let scale = dragScale.value

                    LoopingVideoView(
                        resource: "study-\(selectedRecording)",
                        fileExtension: "mp4"
                    )
                    .frame(
                        width: visualFrame.width * scale,
                        height: visualFrame.height * scale
                    )
                    .clipShape(
                        RoundedRectangle(
                            cornerRadius: visualRadius,
                            style: .continuous
                        )
                    )
                    .position(
                        x: visualFrame.midX + dragOffsetX.value,
                        y: visualFrame.midY + dragOffsetY.value
                    )
                    .shadow(
                        color: .black.opacity(0.13 * Double(progress)),
                        radius: 20 * progress,
                        y: 8 * progress
                    )
                    .contentShape(
                        RoundedRectangle(
                            cornerRadius: visualRadius,
                            style: .continuous
                        )
                    )
                    .onTapGesture(perform: togglePresentation)
                    .highPriorityGesture(dismissGesture(stageHeight: stageHeight))
                    .accessibilityLabel("Grass study recording IMG_\(selectedRecording). Tap or swipe down to close.")
                    .accessibilityAddTraits(.isModal)
                    .zIndex(100)
                }
            }
            .frame(width: stageWidth, height: stageHeight)
            .background(Color.white)
            .coordinateSpace(name: "recording-stage")
            .onPreferenceChange(RecordingFramePreferenceKey.self) { frames in
                recordingFrames = frames
            }
            .position(
                x: proxy.size.width / 2,
                y: topInset + stageHeight / 2
            )
        }
        .background(Color.white)
    }

    private func dismissGesture(stageHeight: CGFloat) -> some Gesture {
        DragGesture(minimumDistance: 8)
            .onChanged { value in
                let distance = max(0, value.translation.height)
                guard distance > 0 || isDragging else { return }

                if !isDragging {
                    isDragging = true
                    transition.beginInteraction()
                    dragOffsetX.beginInteraction()
                    dragOffsetY.beginInteraction()
                    dragScale.beginInteraction()
                }

                dragOffsetX.setInteractive(value.translation.width)
                dragOffsetY.setInteractive(distance)

                let compressionProgress = min(
                    1,
                    distance / max(1, stageHeight * 0.32)
                )
                dragScale.setInteractive(1 - compressionProgress * 0.08)
            }
            .onEnded { value in
                guard isDragging else { return }
                isDragging = false

                let dismissalDistance = max(1, stageHeight * 0.3)
                let projectionDuration: CGFloat = 0.2
                let projectedTravel = max(
                    0,
                    value.predictedEndTranslation.height
                        - value.translation.height
                )
                let releaseVelocityY = projectedTravel / projectionDuration
                let releaseVelocityX = (
                    value.predictedEndTranslation.width
                        - value.translation.width
                ) / projectionDuration
                let releaseVelocity = -releaseVelocityY
                    / dismissalDistance
                let shouldClose = value.translation.height > stageHeight * 0.12
                    || releaseVelocity < -0.72

                dragOffsetX.retarget(
                    to: 0,
                    releaseVelocity: releaseVelocityX
                )
                dragOffsetY.retarget(
                    to: 0,
                    releaseVelocity: releaseVelocityY
                )
                dragScale.retarget(
                    to: 1,
                    releaseVelocity: releaseVelocity * 0.08
                )

                if shouldClose {
                    close(releaseVelocity: releaseVelocity)
                } else {
                    transition.retarget(
                        to: 1,
                        releaseVelocity: releaseVelocity
                    )
                }
            }
    }

    private func open(_ recording: String) {
        guard let sourceFrame = recordingFrames[recording] else { return }
        selectedSourceFrame = sourceFrame
        selectedRecording = recording
        dragOffsetX.jump(to: 0)
        dragOffsetY.jump(to: 0)
        dragScale.jump(to: 1)
        transition.jump(to: 0)
        DispatchQueue.main.async {
            transition.retarget(to: 1)
        }
    }

    private func togglePresentation() {
        settleDirectManipulation()
        if transition.target > 0.5 {
            close()
        } else {
            transition.retarget(to: 1)
        }
    }

    private func close(releaseVelocity: CGFloat? = nil) {
        transition.retarget(to: 0, releaseVelocity: releaseVelocity) {
            dragOffsetX.jump(to: 0)
            dragOffsetY.jump(to: 0)
            dragScale.jump(to: 1)
            selectedRecording = nil
            selectedSourceFrame = nil
        }
    }

    private func settleDirectManipulation() {
        dragOffsetX.retarget(to: 0)
        dragOffsetY.retarget(to: 0)
        dragScale.retarget(to: 1)
    }
}

private struct RecordingFramePreferenceKey: PreferenceKey {
    static var defaultValue: [String: CGRect] = [:]

    static func reduce(
        value: inout [String: CGRect],
        nextValue: () -> [String: CGRect]
    ) {
        value.merge(nextValue(), uniquingKeysWith: { _, next in next })
    }
}

private func clamped(_ value: CGFloat) -> CGFloat {
    min(1, max(0, value))
}

private func interpolatedValue(
    from: CGFloat,
    to: CGFloat,
    progress: CGFloat
) -> CGFloat {
    from + (to - from) * progress
}

private func interpolatedFrame(
    from: CGRect,
    to: CGRect,
    progress: CGFloat
) -> CGRect {
    CGRect(
        x: interpolatedValue(from: from.minX, to: to.minX, progress: progress),
        y: interpolatedValue(from: from.minY, to: to.minY, progress: progress),
        width: interpolatedValue(from: from.width, to: to.width, progress: progress),
        height: interpolatedValue(from: from.height, to: to.height, progress: progress)
    )
}

private final class RetargetableProgressSpring: NSObject, ObservableObject {
    @Published private(set) var value: CGFloat
    private(set) var target: CGFloat

    private let stiffness: CGFloat = 300
    private let damping: CGFloat = 35
    private let mass: CGFloat = 1
    private let allowedRange: ClosedRange<CGFloat>?
    private var velocity: CGFloat = 0
    private var displayLink: CADisplayLink?
    private var lastTimestamp: CFTimeInterval?
    private var completion: (() -> Void)?

    init(
        initialValue: CGFloat = 0,
        allowedRange: ClosedRange<CGFloat>? = 0...1
    ) {
        let constrainedValue: CGFloat
        if let allowedRange {
            constrainedValue = min(
                allowedRange.upperBound,
                max(allowedRange.lowerBound, initialValue)
            )
        } else {
            constrainedValue = initialValue
        }

        value = constrainedValue
        target = constrainedValue
        self.allowedRange = allowedRange
        super.init()
    }

    func jump(to value: CGFloat) {
        stopAnimation()
        let nextValue = constrained(value)
        self.value = nextValue
        target = nextValue
        velocity = 0
    }

    func beginInteraction() {
        stopAnimation()
    }

    func setInteractive(_ value: CGFloat) {
        self.value = constrained(value)
        target = self.value
        velocity = 0
    }

    func retarget(
        to target: CGFloat,
        releaseVelocity: CGFloat? = nil,
        completion: (() -> Void)? = nil
    ) {
        self.completion = completion
        self.target = constrained(target)
        if let releaseVelocity {
            velocity = releaseVelocity
        }

        if displayLink == nil {
            let displayLink = CADisplayLink(target: self, selector: #selector(step(_:)))
            displayLink.preferredFrameRateRange = CAFrameRateRange(
                minimum: 60,
                maximum: 120,
                preferred: 120
            )
            displayLink.add(to: .main, forMode: .common)
            self.displayLink = displayLink
        }
    }

    private func stopAnimation() {
        completion = nil
        displayLink?.invalidate()
        displayLink = nil
        lastTimestamp = nil
    }

    private func constrained(_ value: CGFloat) -> CGFloat {
        guard let allowedRange else { return value }
        return min(
            allowedRange.upperBound,
            max(allowedRange.lowerBound, value)
        )
    }

    @objc private func step(_ displayLink: CADisplayLink) {
        let timestamp = displayLink.timestamp
        let deltaTime = lastTimestamp.map { timestamp - $0 } ?? (1 / 120)
        lastTimestamp = timestamp
        let dt = CGFloat(min(max(deltaTime, 1 / 240), 1 / 30))
        let displacement = value - target
        let acceleration = (
            -stiffness * displacement - damping * velocity
        ) / mass

        velocity += acceleration * dt
        value += velocity * dt

        guard abs(value - target) < 0.0001,
              abs(velocity) < 0.0001
        else { return }

        value = target
        velocity = 0
        let completion = self.completion
        stopAnimation()
        completion?()
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
