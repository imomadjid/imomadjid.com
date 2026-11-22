import SwiftUI

// Tailwind v4 palette entries, converted from the oklch values in tailwindcss/theme.css to
// Display P3 so iOS receives the same color the browser paints on a P3 display.
struct Swatch: Identifiable {
    let id: String
    let color: Color

    init(_ name: String, _ r: Double, _ g: Double, _ b: Double) {
        id = name
        color = Color(.displayP3, red: r, green: g, blue: b)
    }

    init(_ name: String, system: Color) {
        id = name
        color = system
    }
}

let tailwind: [Swatch] = [
    Swatch("red-500", 0.9037, 0.2626, 0.2533),
    Swatch("red-600", 0.8303, 0.1404, 0.1332),
    Swatch("orange-500", 0.9466, 0.4498, 0.0757),
    Swatch("orange-600", 0.8875, 0.3417, 0.0220),
    Swatch("amber-500", 0.9399, 0.6206, 0.0585),
    Swatch("amber-600", 0.8271, 0.4672, 0.0336),
    Swatch("green-500", 0.3087, 0.7748, 0.3743),
    Swatch("green-600", 0.2439, 0.6408, 0.2948),
    Swatch("teal-500", 0.2666, 0.7215, 0.6555),
    Swatch("teal-600", 0.2071, 0.5796, 0.5367),
    Swatch("sky-500", 0.2191, 0.6390, 0.9315),
    Swatch("sky-600", 0.1625, 0.5094, 0.7961),
    Swatch("blue-500", 0.2664, 0.4912, 0.9886),
    Swatch("blue-600", 0.1745, 0.3590, 0.9502),
    Swatch("indigo-500", 0.3804, 0.3722, 0.9717),
    Swatch("indigo-600", 0.2977, 0.2279, 0.9292),
    Swatch("purple-500", 0.6295, 0.3009, 0.9908),
    Swatch("purple-600", 0.5467, 0.1302, 0.9444),
    Swatch("pink-500", 0.8889, 0.2765, 0.5950),
    Swatch("pink-600", 0.8256, 0.1412, 0.4593),
]

// System colors adapt to light and dark, so they show how far Apple's own tints sit from Tailwind.
let system: [Swatch] = [
    Swatch("system red", system: .red),
    Swatch("system orange", system: .orange),
    Swatch("system green", system: .green),
    Swatch("system blue", system: .blue),
    Swatch("system indigo", system: .indigo),
    Swatch("system purple", system: .purple),
    Swatch("system pink", system: .pink),
]

enum Backdrop: String, CaseIterable, Identifiable {
    case white, grey, dark, black, stripes

    var id: String { rawValue }

    var scheme: ColorScheme {
        switch self {
        case .white, .grey, .stripes: .light
        case .dark, .black: .dark
        }
    }

    @ViewBuilder var fill: some View {
        switch self {
        case .white: Color.white
        case .grey: Color(red: 242 / 255, green: 241 / 255, blue: 246 / 255)
        case .dark: Color(red: 28 / 255, green: 28 / 255, blue: 30 / 255)
        case .black: Color.black
        case .stripes:
            // Hard-edged content behind the glass makes tint opacity and blur visible.
            HStack(spacing: 0) {
                ForEach(0..<24, id: \.self) { i in
                    (i.isMultiple(of: 2) ? Color.black : Color.white).frame(width: 18)
                }
            }
        }
    }
}

struct TintRow: View {
    let swatch: Swatch

    var body: some View {
        HStack(spacing: 16) {
            Text(swatch.id)
                .font(.system(size: 13, weight: .medium).monospaced())
                .frame(width: 120, alignment: .leading)

            // Flat reference: the raw color with no glass.
            Capsule().fill(swatch.color).frame(width: 96, height: 44)

            Button("Label") {}
                .buttonStyle(.glassProminent)
                .controlSize(.large)
                .tint(swatch.color)
                .frame(width: 110)

            Capsule()
                .fill(.clear)
                .frame(width: 96, height: 44)
                .glassEffect(.regular.tint(swatch.color), in: .capsule)

            Capsule()
                .fill(.clear)
                .frame(width: 96, height: 44)
                .glassEffect(.regular.tint(swatch.color.opacity(0.5)), in: .capsule)
        }
    }
}

struct ContentView: View {
    @State private var backdrop =
        Backdrop(rawValue: UserDefaults.standard.string(forKey: "backdrop") ?? "") ?? .white

    var body: some View {
        VStack(spacing: 0) {
            Picker("Backdrop", selection: $backdrop) {
                ForEach(Backdrop.allCases) { Text($0.rawValue).tag($0) }
            }
            .pickerStyle(.segmented)
            .padding()

            ScrollView([.vertical, .horizontal]) {
                VStack(alignment: .leading, spacing: 12) {
                    HStack(spacing: 16) {
                        ForEach(
                            [("", 120), ("flat", 96), (".glassProminent", 110),
                             (".regular.tint", 96), ("tint 50%", 96)],
                            id: \.0
                        ) { title, width in
                            Text(title).frame(width: CGFloat(width), alignment: .leading)
                        }
                    }
                    .font(.system(size: 11).monospaced())
                    .foregroundStyle(.secondary)

                    ForEach(tailwind) { TintRow(swatch: $0) }
                    Divider().padding(.vertical, 8)
                    ForEach(system) { TintRow(swatch: $0) }
                }
                .padding(24)
            }
            .background { backdrop.fill.ignoresSafeArea() }
            .environment(\.colorScheme, backdrop.scheme)
        }
    }
}

// Capture mode mirrors the /dev/glass reference frames: a 393 x 108 pt backdrop with the glass
// at the iOS tab bar geometry (352.033 x 63.1 pt at 20.483, 23.85), one frame per tint,
// stacked with no gaps so the diff scripts can locate frames by backdrop color.
// Launch arguments: -capture red-500,blue-600 -alpha 1 -backdrop white -style effect|prominent
struct CaptureView: View {
    let swatches: [Swatch]
    let alpha: Double
    let backdrop: Backdrop
    let prominent: Bool

    var body: some View {
        VStack(spacing: 0) {
            ForEach(swatches) { swatch in
                ZStack(alignment: .topLeading) {
                    backdrop.fill
                    surface(swatch.color.opacity(alpha))
                        .frame(width: 352.033, height: 63.1)
                        .offset(x: 20.483, y: 23.85)
                }
                .frame(width: 393, height: 108)
                .clipped()
            }
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, alignment: .topLeading)
        .background { backdrop.fill.ignoresSafeArea() }
        .environment(\.colorScheme, backdrop.scheme)
        #if os(iOS)
        .statusBarHidden()
        #endif
    }

    @ViewBuilder func surface(_ tint: Color) -> some View {
        if prominent {
            Button {} label: { Color.clear.frame(width: 352.033, height: 63.1) }
                .buttonStyle(.glassProminent)
                .buttonBorderShape(.capsule)
                .tint(tint)
        } else {
            Color.clear.glassEffect(.regular.tint(tint), in: .capsule)
        }
    }
}

struct RootView: View {
    private let defaults = UserDefaults.standard

    var body: some View {
        if let list = defaults.string(forKey: "capture") {
            let names = list.split(separator: ",").map(String.init)
            CaptureView(
                swatches: (tailwind + system).filter { names.contains($0.id) },
                alpha: defaults.object(forKey: "alpha") == nil ? 1 : defaults.double(forKey: "alpha"),
                backdrop: Backdrop(rawValue: defaults.string(forKey: "backdrop") ?? "") ?? .white,
                prominent: defaults.string(forKey: "style") == "prominent"
            )
        } else {
            ContentView()
        }
    }
}

@main
struct GlassTintsApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
                #if os(macOS)
                .frame(minWidth: 640, minHeight: 900)
                // Inactive macOS windows desaturate glass and tints; pin the key look so
                // background captures match the foreground rendering.
                .environment(\.controlActiveState, .key)
                #endif
        }
    }
}
