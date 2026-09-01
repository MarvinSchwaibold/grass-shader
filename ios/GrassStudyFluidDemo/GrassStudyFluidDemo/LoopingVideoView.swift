import AVFoundation
import SwiftUI
import UIKit

struct LoopingVideoView: UIViewRepresentable {
    let resource: String
    let fileExtension: String

    func makeCoordinator() -> Coordinator {
        Coordinator(resource: resource, fileExtension: fileExtension)
    }

    func makeUIView(context: Context) -> PlayerSurfaceView {
        let view = PlayerSurfaceView()
        view.backgroundColor = .black
        view.playerLayer.videoGravity = .resizeAspectFill
        view.playerLayer.player = context.coordinator.player
        context.coordinator.player?.play()
        return view
    }

    func updateUIView(_ uiView: PlayerSurfaceView, context: Context) {
        uiView.playerLayer.player = context.coordinator.player
        context.coordinator.player?.play()
    }

    static func dismantleUIView(_ uiView: PlayerSurfaceView, coordinator: Coordinator) {
        coordinator.player?.pause()
        uiView.playerLayer.player = nil
    }

    final class Coordinator {
        let player: AVQueuePlayer?
        private var looper: AVPlayerLooper?

        init(resource: String, fileExtension: String) {
            guard let url = Bundle.main.url(forResource: resource, withExtension: fileExtension) else {
                player = nil
                return
            }

            let queue = AVQueuePlayer()
            queue.isMuted = true
            queue.actionAtItemEnd = .advance
            player = queue
            looper = AVPlayerLooper(player: queue, templateItem: AVPlayerItem(url: url))
        }
    }
}

final class PlayerSurfaceView: UIView {
    override class var layerClass: AnyClass { AVPlayerLayer.self }
    var playerLayer: AVPlayerLayer { layer as! AVPlayerLayer }
}
