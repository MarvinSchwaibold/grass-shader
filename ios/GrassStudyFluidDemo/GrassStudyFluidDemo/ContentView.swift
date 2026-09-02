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
    private enum ArtifactPhase {
        case idle
        case opening
        case open
        case dragging
        case closing
    }

    private let recordings = ["7394", "7398", "7400", "7401", "7403", "7406"]
    @StateObject private var motion = WaveArtifactMotion()
    @State private var selectedRecording: String?
    @State private var selectedSourceFrame: CGRect?
    @State private var artifactPhase: ArtifactPhase = .idle
    @State private var isDragging = false
    @State private var dragStartFrame: CGRect = .zero
    @State private var dragStartRadius: CGFloat = 28
    @State private var flightID = 0
    @State private var returningFlights: [ReturningRecordingFlight] = []

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
                LazyVGrid(
                    columns: [
                        GridItem(.flexible(), spacing: 12),
                        GridItem(.flexible(), spacing: 12),
                    ],
                    spacing: 12
                ) {
                    ForEach(recordings, id: \.self) { recording in
                        recordingCell(
                            recording,
                            sourceFrame: recordingFrames[recording],
                            expandedFrame: expandedFrame
                        )
                        .frame(height: recordingHeight)
                    }
                }
                .frame(width: stageWidth, height: stageHeight)

                ForEach(returningFlights) { flight in
                    ReturningRecordingArtifact(flight: flight)
                        .allowsHitTesting(false)
                        .accessibilityHidden(true)
                        .zIndex(90)
                }

                if let selectedRecording {
                    LoopingVideoView(
                        resource: "study-\(selectedRecording)",
                        fileExtension: "mp4"
                    )
                    .id("recording-artifact-\(selectedRecording)")
                    .frame(
                        width: max(1, motion.frame.width),
                        height: max(1, motion.frame.height)
                    )
                    .clipShape(
                        RoundedRectangle(
                            cornerRadius: motion.cornerRadius,
                            style: .continuous
                        )
                    )
                    .position(x: motion.frame.midX, y: motion.frame.midY)
                    .shadow(color: .black.opacity(0.13), radius: 20, y: 8)
                    .contentShape(
                        RoundedRectangle(
                            cornerRadius: motion.cornerRadius,
                            style: .continuous
                        )
                    )
                    .gesture(
                        SpatialTapGesture()
                            .onEnded { value in
                                handleOverlayTap(
                                    localPoint: value.location,
                                    recordingFrames: recordingFrames,
                                    expandedFrame: expandedFrame
                                )
                            }
                    )
                    .highPriorityGesture(
                        dismissGesture(
                            stageHeight: stageHeight,
                            expandedFrame: expandedFrame
                        )
                    )
                    .accessibilityLabel("Grass study recording IMG_\(selectedRecording). Tap or swipe down to close.")
                    .accessibilityAddTraits(.isModal)
                    .zIndex(100)
                }

                if artifactPhase == .closing {
                    ForEach(recordings, id: \.self) { recording in
                        if recording != selectedRecording,
                           !returningFlights.contains(where: { $0.recording == recording }),
                           let sourceFrame = recordingFrames[recording] {
                            Button {
                                open(
                                    recording,
                                    sourceFrame: sourceFrame,
                                    expandedFrame: expandedFrame
                                )
                            } label: {
                                Color.clear
                                    .contentShape(
                                        RoundedRectangle(
                                            cornerRadius: 15,
                                            style: .continuous
                                        )
                                    )
                            }
                            .buttonStyle(.plain)
                            .frame(
                                width: sourceFrame.width,
                                height: sourceFrame.height
                            )
                            .position(
                                x: sourceFrame.midX,
                                y: sourceFrame.midY
                            )
                            .accessibilityLabel("Open grass study recording IMG_\(recording)")
                            .zIndex(110)
                        }
                    }
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

    @ViewBuilder
    private func recordingCell(
        _ recording: String,
        sourceFrame: CGRect?,
        expandedFrame: CGRect
    ) -> some View {
        if selectedRecording == recording || returningFlights.contains(where: { $0.recording == recording }) {
            // Every recording has exactly one visual instance while it is in
            // flight. Its grid cell stays as a layout-only source/target.
            Color.clear
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .accessibilityHidden(true)
        } else {
            Button {
                guard let sourceFrame else { return }
                open(
                    recording,
                    sourceFrame: sourceFrame,
                    expandedFrame: expandedFrame
                )
            } label: {
                ZStack {
                    LoopingVideoView(
                        resource: "study-\(recording)",
                        fileExtension: "mp4"
                    )
                    .allowsHitTesting(false)

                    Color.clear
                        .contentShape(Rectangle())
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .clipShape(
                    RoundedRectangle(
                        cornerRadius: 15,
                        style: .continuous
                    )
                )
                .contentShape(
                    RoundedRectangle(
                        cornerRadius: 15,
                        style: .continuous
                    )
                )
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .buttonStyle(FluidThumbnailButtonStyle())
            .accessibilityLabel("Open grass study recording IMG_\(recording)")
        }
    }

    private func dismissGesture(
        stageHeight: CGFloat,
        expandedFrame: CGRect
    ) -> some Gesture {
        DragGesture(minimumDistance: 8)
            .onChanged { value in
                let distance = max(0, value.translation.height)
                guard distance > 0 || isDragging else { return }

                if !isDragging {
                    isDragging = true
                    flightID += 1
                    artifactPhase = .dragging
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
                guard isDragging else { return }
                isDragging = false

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
                    artifactPhase = .opening
                    motion.retarget(
                        frame: expandedFrame,
                        cornerRadius: 28,
                        frameVelocity: frameVelocity,
                        radiusVelocity: -releaseVelocityY * 0.01,
                        completion: {
                            guard openingFlightID == flightID else { return }
                            artifactPhase = .open
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
        flightID += 1
        let openingFlightID = flightID

        if selectedRecording != nil {
            handOffActiveRecordingToItsSource()
        }

        // A newly selected recording always begins at its own current grid
        // frame. It never inherits the outgoing recording's geometry.
        motion.jump(frame: sourceFrame, cornerRadius: 15)
        selectedSourceFrame = sourceFrame
        selectedRecording = recording
        artifactPhase = .opening
        isDragging = false
        motion.retarget(
            frame: expandedFrame,
            cornerRadius: 28,
            completion: {
                guard openingFlightID == flightID,
                      selectedRecording == recording else { return }
                artifactPhase = .open
            }
        )
    }

    private func handleOverlayTap(
        localPoint: CGPoint,
        recordingFrames: [String: CGRect],
        expandedFrame: CGRect
    ) {
        let stagePoint = CGPoint(
            x: motion.frame.minX + localPoint.x,
            y: motion.frame.minY + localPoint.y
        )
        if artifactPhase == .closing,
           let recording = recordings.first(where: {
               recordingFrames[$0]?.contains(stagePoint) == true
           }),
           recording != selectedRecording,
           let sourceFrame = recordingFrames[recording] {
            open(
                recording,
                sourceFrame: sourceFrame,
                expandedFrame: expandedFrame
            )
            return
        }

        close()
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
        guard let selectedRecording, let selectedSourceFrame else { return }
        flightID += 1
        let closingFlightID = flightID
        artifactPhase = .closing
        isDragging = false
        motion.retarget(
            frame: selectedSourceFrame,
            cornerRadius: 15,
            frameVelocity: frameVelocity,
            completion: {
                guard closingFlightID == flightID,
                      self.selectedRecording == selectedRecording else { return }
                self.selectedRecording = nil
                self.selectedSourceFrame = nil
                artifactPhase = .idle
            }
        )
    }

    private func handOffActiveRecordingToItsSource() {
        guard let recording = selectedRecording,
              let sourceFrame = selectedSourceFrame else { return }

        let snapshot = motion.snapshot()
        let returningFlight = ReturningRecordingFlight(
            recording: recording,
            sourceFrame: sourceFrame,
            snapshot: snapshot
        )
        returningFlights.append(returningFlight)

        returningFlight.motion.retarget(
            frame: sourceFrame,
            cornerRadius: 15,
            frameVelocity: snapshot.frameVelocity,
            radiusVelocity: snapshot.radiusVelocity,
            completion: {
                returningFlights.removeAll { $0.id == returningFlight.id }
            }
        )

        selectedRecording = nil
        selectedSourceFrame = nil
        artifactPhase = .idle
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

private struct WaveArtifactSnapshot {
    let frame: CGRect
    let cornerRadius: CGFloat
    let frameVelocity: CGRect
    let radiusVelocity: CGFloat
}

private final class ReturningRecordingFlight: Identifiable {
    let id = UUID()
    let recording: String
    let sourceFrame: CGRect
    let motion: WaveArtifactMotion

    init(
        recording: String,
        sourceFrame: CGRect,
        snapshot: WaveArtifactSnapshot
    ) {
        self.recording = recording
        self.sourceFrame = sourceFrame
        motion = WaveArtifactMotion()
        motion.jump(
            frame: snapshot.frame,
            cornerRadius: snapshot.cornerRadius
        )
    }
}

private struct ReturningRecordingArtifact: View {
    let flight: ReturningRecordingFlight
    @ObservedObject private var motion: WaveArtifactMotion

    init(flight: ReturningRecordingFlight) {
        self.flight = flight
        _motion = ObservedObject(wrappedValue: flight.motion)
    }

    var body: some View {
        LoopingVideoView(
            resource: "study-\(flight.recording)",
            fileExtension: "mp4"
        )
        .id("returning-recording-\(flight.id)")
        .frame(
            width: max(1, motion.frame.width),
            height: max(1, motion.frame.height)
        )
        .clipShape(
            RoundedRectangle(
                cornerRadius: motion.cornerRadius,
                style: .continuous
            )
        )
        .position(x: motion.frame.midX, y: motion.frame.midY)
        .shadow(color: .black.opacity(0.08), radius: 12, y: 5)
    }
}

private final class WaveArtifactMotion: ObservableObject {
    @Published private(set) var frame: CGRect = .zero
    @Published private(set) var cornerRadius: CGFloat = 15

    private let frameAnimator: SpringAnimator<CGRect>
    private let radiusAnimator: SpringAnimator<CGFloat>
    private var pendingCompletion: (() -> Void)?

    init() {
        let spring = Spring(dampingRatio: 0.82, response: 0.44)
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

    func retarget(
        frame: CGRect,
        cornerRadius: CGFloat,
        frameVelocity: CGRect? = nil,
        radiusVelocity: CGFloat? = nil,
        completion: (() -> Void)? = nil
    ) {
        pendingCompletion = completion
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
