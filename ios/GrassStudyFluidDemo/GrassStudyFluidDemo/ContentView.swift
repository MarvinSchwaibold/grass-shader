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
    @Namespace private var recordingTransition
    @State private var selectedRecording: String?
    @State private var expandedDragOffset: CGFloat = 0

    var body: some View {
        GeometryReader { proxy in
            let horizontalInset: CGFloat = 14
            let topInset = max(proxy.safeAreaInsets.top, 12)
            let bottomInset = max(proxy.safeAreaInsets.bottom + 44, 58)
            let stageWidth = max(1, proxy.size.width - horizontalInset * 2)
            let stageHeight = max(1, proxy.size.height - topInset - bottomInset)
            let recordingHeight = max(1, (stageHeight - 24) / 3)

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
                            .frame(height: recordingHeight)
                            .clipShape(RoundedRectangle(cornerRadius: 15, style: .continuous))
                            .matchedGeometryEffect(
                                id: recording,
                                in: recordingTransition,
                                isSource: true
                            )
                            .opacity(selectedRecording == recording ? 0 : 1)
                            .contentShape(RoundedRectangle(cornerRadius: 15, style: .continuous))
                        }
                        .buttonStyle(FluidThumbnailButtonStyle())
                        .accessibilityLabel("Open grass study recording IMG_\(recording)")
                    }
                }
                .frame(width: stageWidth, height: stageHeight)

                if let selectedRecording {
                    LoopingVideoView(
                        resource: "study-\(selectedRecording)",
                        fileExtension: "mp4"
                    )
                    .frame(width: stageWidth, height: stageHeight)
                    .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
                    .matchedGeometryEffect(
                        id: selectedRecording,
                        in: recordingTransition,
                        isSource: false
                    )
                    .offset(y: expandedDragOffset)
                    .shadow(
                        color: .black.opacity(0.12 * dragProgress),
                        radius: 22,
                        y: 10
                    )
                    .contentShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
                    .onTapGesture(perform: close)
                    .gesture(dismissGesture)
                    .accessibilityLabel("Grass study recording IMG_\(selectedRecording). Tap or swipe down to close.")
                    .accessibilityAddTraits(.isModal)
                    .zIndex(1)
                }
            }
            .frame(width: stageWidth, height: stageHeight)
            .background(Color.white)
            .position(
                x: proxy.size.width / 2,
                y: topInset + stageHeight / 2
            )
        }
        .background(Color.white)
    }

    private var dragProgress: Double {
        max(0, min(1, Double(expandedDragOffset / 180)))
    }

    private var dismissGesture: some Gesture {
        DragGesture(minimumDistance: 8)
            .onChanged { value in
                expandedDragOffset = max(0, value.translation.height)
            }
            .onEnded { value in
                if value.translation.height > 70 || value.predictedEndTranslation.height > 150 {
                    close()
                } else {
                    withAnimation(.spring(response: 0.38, dampingFraction: 0.74)) {
                        expandedDragOffset = 0
                    }
                }
            }
    }

    private func open(_ recording: String) {
        expandedDragOffset = 0
        withAnimation(.spring(response: 0.48, dampingFraction: 0.82)) {
            selectedRecording = recording
        }
    }

    private func close() {
        withAnimation(.spring(response: 0.46, dampingFraction: 0.8)) {
            expandedDragOffset = 0
            selectedRecording = nil
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
