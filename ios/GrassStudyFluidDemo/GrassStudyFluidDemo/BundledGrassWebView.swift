import SwiftUI
import WebKit
import Network

struct BundledGrassWebView: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .nonPersistent()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true

        let webView = GrassControlWebView(frame: .zero, configuration: configuration)
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false
        webView.isOpaque = true
        webView.backgroundColor = .white
        webView.scrollView.backgroundColor = webView.backgroundColor
        webView.isUserInteractionEnabled = true

        LocalWebServer.shared.start { [weak webView] page in
            webView?.load(URLRequest(url: page))
        }
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}
}

/// The shader remains visually live across the whole stage, while touch input
/// is reserved for the original web wind drawer at the bottom. Swipes over the
/// grass continue through to SwiftUI's paging gesture.
private final class GrassControlWebView: WKWebView, UIGestureRecognizerDelegate {
    private static let protectedBottomBandHeight: CGFloat = 107

    private lazy var bottomBandPanShield: UIPanGestureRecognizer = {
        let recognizer = UIPanGestureRecognizer(
            target: self,
            action: #selector(absorbBottomBandPan(_:))
        )
        recognizer.cancelsTouchesInView = false
        recognizer.delaysTouchesBegan = false
        recognizer.delegate = self
        return recognizer
    }()

    override init(frame: CGRect, configuration: WKWebViewConfiguration) {
        super.init(frame: frame, configuration: configuration)
        addGestureRecognizer(bottomBandPanShield)
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        addGestureRecognizer(bottomBandPanShield)
    }

    override func didMoveToWindow() {
        super.didMoveToWindow()

        // SwiftUI's paged TabView is backed by an ancestor UIScrollView. Make
        // its paging pan wait for the bottom-band recognizer. A pan beginning
        // in the protected band is absorbed here; a pan above it never enters
        // this WebView because hitTest returns nil there.
        DispatchQueue.main.async { [weak self] in
            self?.prioritizeBottomBandOverPaging()
        }
    }

    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        // Reserve the complete bottom control band for WebKit. This keeps page
        // navigation out of the full-width area occupied by the wind control,
        // including its invisible 15 pt interaction halo.
        let drawerRegion = CGRect(
            x: 0,
            y: max(0, bounds.height - Self.protectedBottomBandHeight),
            width: bounds.width,
            height: Self.protectedBottomBandHeight
        )
        guard drawerRegion.contains(point) else { return nil }
        return super.hitTest(point, with: event)
    }

    override func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
        guard gestureRecognizer === bottomBandPanShield else { return true }
        let point = gestureRecognizer.location(in: self)
        return point.y >= bounds.height - Self.protectedBottomBandHeight
    }

    func gestureRecognizer(
        _ gestureRecognizer: UIGestureRecognizer,
        shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer
    ) -> Bool {
        // Keep the DOM range input live while the native shield owns the page
        // gesture conflict.
        true
    }

    @objc private func absorbBottomBandPan(_ recognizer: UIPanGestureRecognizer) {
        // Intentionally empty: recognition itself prevents page navigation.
    }

    private func prioritizeBottomBandOverPaging() {
        var ancestor = superview
        while let view = ancestor {
            if let pagingScrollView = view as? UIScrollView,
               pagingScrollView !== scrollView {
                pagingScrollView.panGestureRecognizer.require(
                    toFail: bottomBandPanShield
                )
                return
            }
            ancestor = view.superview
        }
    }
}

/// Serves the packaged production build over loopback so WebKit can load its
/// ES modules, shader chunks, and textures exactly as a normal web page would.
/// Nothing leaves the device and no hosted authentication is involved.
private final class LocalWebServer {
    static let shared = LocalWebServer()

    private let queue = DispatchQueue(label: "com.grassstudy.local-web-server")
    private var listener: NWListener?
    private var pageURL: URL?
    private var pending: [(URL) -> Void] = []

    private init() {}

    func start(completion: @escaping (URL) -> Void) {
        queue.async { [self] in
            if let pageURL {
                DispatchQueue.main.async { completion(pageURL) }
                return
            }

            pending.append(completion)
            guard listener == nil else { return }

            do {
                let parameters = NWParameters.tcp
                parameters.requiredLocalEndpoint = .hostPort(
                    host: .ipv4(.loopback),
                    port: .any
                )

                let listener = try NWListener(using: parameters)
                self.listener = listener
                listener.newConnectionHandler = { [weak self] connection in
                    self?.serve(connection)
                }
                listener.stateUpdateHandler = { [weak self, weak listener] state in
                    guard let self, let listener else { return }
                    switch state {
                    case .ready:
                        guard let port = listener.port,
                              let url = URL(string: "http://127.0.0.1:\(port.rawValue)/index.html?native=1")
                        else { return }
                        pageURL = url
                        let callbacks = pending
                        pending.removeAll()
                        DispatchQueue.main.async {
                            callbacks.forEach { $0(url) }
                        }
                    case .failed:
                        self.listener = nil
                    default:
                        break
                    }
                }
                listener.start(queue: queue)
            } catch {
                assertionFailure("Unable to start bundled grass server: \(error)")
                listener = nil
            }
        }
    }

    private func serve(_ connection: NWConnection) {
        connection.start(queue: queue)
        connection.receive(minimumIncompleteLength: 1, maximumLength: 65_536) {
            [weak self] data, _, _, _ in
            guard let self, let data,
                  let request = String(data: data, encoding: .utf8)
            else {
                connection.cancel()
                return
            }

            let target = request
                .split(separator: "\r\n", maxSplits: 1)
                .first?
                .split(separator: " ")
                .dropFirst()
                .first
                .map(String.init) ?? "/index.html"

            sendFile(for: target, over: connection)
        }
    }

    private func sendFile(for rawTarget: String, over connection: NWConnection) {
        let pathOnly = rawTarget.split(separator: "?", maxSplits: 1).first.map(String.init) ?? "/"
        let decoded = pathOnly.removingPercentEncoding ?? pathOnly
        let relative = decoded == "/" ? "index.html" : String(decoded.drop(while: { $0 == "/" }))

        guard !relative.contains(".."),
              let root = Bundle.main.resourceURL?.appendingPathComponent("WebDemo", isDirectory: true)
        else {
            send(status: "400 Bad Request", body: Data(), mime: "text/plain", over: connection)
            return
        }

        let fileURL = root.appendingPathComponent(relative)
        guard let body = try? Data(contentsOf: fileURL) else {
            send(status: "404 Not Found", body: Data(), mime: "text/plain", over: connection)
            return
        }

        send(status: "200 OK", body: body, mime: mimeType(for: fileURL), over: connection)
    }

    private func send(
        status: String,
        body: Data,
        mime: String,
        over connection: NWConnection
    ) {
        let header = """
        HTTP/1.1 \(status)\r
        Content-Type: \(mime)\r
        Content-Length: \(body.count)\r
        Cache-Control: no-store\r
        Connection: close\r
        \r

        """
        var response = Data(header.utf8)
        response.append(body)
        connection.send(content: response, completion: .contentProcessed { _ in
            connection.cancel()
        })
    }

    private func mimeType(for url: URL) -> String {
        switch url.pathExtension.lowercased() {
        case "html": return "text/html; charset=utf-8"
        case "js", "mjs": return "text/javascript; charset=utf-8"
        case "css": return "text/css; charset=utf-8"
        case "json": return "application/json"
        case "png": return "image/png"
        case "jpg", "jpeg": return "image/jpeg"
        case "svg": return "image/svg+xml"
        case "woff2": return "font/woff2"
        default: return "application/octet-stream"
        }
    }
}
