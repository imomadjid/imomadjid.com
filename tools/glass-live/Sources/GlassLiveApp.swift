import SwiftUI

#if os(iOS)
typealias PlatformImage = UIImage
#else
typealias PlatformImage = NSImage
#endif

// Scenes come from Scenes/scenes.json, which tools/glass-live/scenes.ts writes and /dev/live-glass
// reads too, so both sides lay out the same photos and patterns at the same points.
struct SceneFile: Decodable {
    let width: Double
    let height: Double
    let scenes: [GlassScene]
}

struct GlassScene: Decodable, Identifiable, Hashable {
    struct Placed: Decodable, Hashable {
        let file: String
        let x, y, width, height, radius: Double
    }

    struct Frame: Decodable, Hashable {
        let x, y, size: Double
    }

    struct Motion: Decodable, Hashable {
        let height, speed, hold: Double
    }

    let name: String
    let scheme: String
    let background: String
    let button: Frame
    let images: [Placed]
    let motion: Motion?

    var id: String { name }
    var colorScheme: ColorScheme { scheme == "dark" ? .dark : .light }
}

let sceneFile: SceneFile = {
    let url = Bundle.main.url(forResource: "scenes", withExtension: "json", subdirectory: "Scenes")!
    return try! JSONDecoder().decode(SceneFile.self, from: Data(contentsOf: url))
}()

func bundledImage(_ file: String) -> PlatformImage? {
    let name = (file as NSString).deletingPathExtension
    let ext = (file as NSString).pathExtension
    let url =
        Bundle.main.url(forResource: name, withExtension: ext)
        ?? Bundle.main.url(forResource: name, withExtension: ext, subdirectory: "Scenes")
    guard let url else { return nil }
    #if os(iOS)
    return UIImage(contentsOfFile: url.path)
    #else
    return NSImage(contentsOf: url)
    #endif
}

extension Color {
    init(hex: String) {
        let value = UInt64(hex.dropFirst(), radix: 16) ?? 0
        self.init(
            .sRGB,
            red: Double((value >> 16) & 0xff) / 255,
            green: Double((value >> 8) & 0xff) / 255,
            blue: Double(value & 0xff) / 255
        )
    }
}

extension Image {
    init(platform: PlatformImage) {
        #if os(iOS)
        self.init(uiImage: platform)
        #else
        self.init(nsImage: platform)
        #endif
    }
}

// A motion scene's images scroll up at its speed after its hold, through the whole strip, then
// stop; -scroll <pt> holds them at one offset instead.
struct MotionView: View {
    let scene: GlassScene
    let icon: Bool
    let motion: GlassScene.Motion
    @State private var start = Date()

    var body: some View {
        if let fixed = UserDefaults.standard.string(forKey: "scroll").flatMap(Double.init) {
            SceneView(scene: scene, icon: icon, scroll: fixed)
        } else {
            TimelineView(.animation) { context in
                let t = context.date.timeIntervalSince(start) - motion.hold
                let end = motion.height - sceneFile.height
                SceneView(scene: scene, icon: icon, scroll: min(end, max(0, t * motion.speed)))
            }
        }
    }
}

// One screen: the backdrop, then the close button's glass, a 56 pt circle as on the web. With
// `icon` off the glass is empty, so diffs measure the material alone.
struct SceneView: View {
    let scene: GlassScene
    let icon: Bool
    var scroll: Double = 0

    var body: some View {
        ZStack(alignment: .topLeading) {
            Color(hex: scene.background)
            ForEach(scene.images, id: \.self) { placed in
                if let image = bundledImage(placed.file) {
                    Image(platform: image)
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(width: placed.width, height: placed.height)
                        .clipShape(RoundedRectangle(cornerRadius: placed.radius, style: .circular))
                        .offset(x: placed.x, y: placed.y - scroll)
                }
            }
            ZStack {
                if icon {
                    Image(systemName: "xmark")
                        .font(.system(size: 20, weight: .medium))
                        .foregroundStyle(.primary)
                }
            }
            .frame(width: scene.button.size, height: scene.button.size)
            .glassEffect(.regular.interactive(), in: .circle)
            .offset(x: scene.button.x, y: scene.button.y)
        }
        .frame(width: sceneFile.width, height: sceneFile.height, alignment: .topLeading)
        .environment(\.colorScheme, scene.colorScheme)
    }
}

struct RootView: View {
    private let defaults = UserDefaults.standard
    @State private var selected = sceneFile.scenes[0]

    var body: some View {
        // Capture mode: -scene <name> [-icon 0], full screen with no system overlays.
        if let name = defaults.string(forKey: "scene"),
           let scene = sceneFile.scenes.first(where: { $0.name == name })
        {
            let icon = defaults.object(forKey: "icon") == nil || defaults.bool(forKey: "icon")
            Group {
                if let motion = scene.motion {
                    MotionView(scene: scene, icon: icon, motion: motion)
                } else {
                    SceneView(scene: scene, icon: icon)
                }
            }
                .ignoresSafeArea()
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                .background(Color(hex: scene.background).ignoresSafeArea())
                #if os(iOS)
                .statusBarHidden()
                .persistentSystemOverlays(.hidden)
                #endif
        } else {
            VStack(spacing: 0) {
                Picker("Scene", selection: $selected) {
                    ForEach(sceneFile.scenes) { Text($0.name).tag($0) }
                }
                .padding(8)
                ScrollView([.vertical, .horizontal]) { SceneView(scene: selected, icon: true) }
            }
        }
    }
}

@main
struct GlassLiveApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
                #if os(macOS)
                .frame(minWidth: 420, minHeight: 940)
                // Inactive macOS windows desaturate glass; pin the key look.
                .environment(\.controlActiveState, .key)
                #endif
        }
    }
}
