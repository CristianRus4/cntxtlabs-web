// Renders the desktop's, Finder's and the Downloads stack's file icons from this Mac into img/desk/.
// Usage, from levo/: swift tools/export-desk-icons.swift
// Each icon is 64 pt @2x (128 px), from NSWorkspace.shared.icon(for: UTType(filenameExtension:)),
// drawn in light (<name>.png) and, only when macOS draws it differently, dark (<name>-dark.png).
// Also the Applications folder, this Mac and two Mac models at 128 pt @2x (see the end).
// Leaves img/desk/levo-volume*.png (made by export-dock-icons.swift) alone.
import AppKit
import UniformTypeIdentifiers

// (file name, filename extension, or nil for a folder)
let types: [(String, String?)] = [
    ("folder", nil),
    ("dmg", "dmg"),
    ("pkg", "pkg"),
    ("zip", "zip"),
    ("txt", "txt"),
    ("png", "png"),
    ("pdf", "pdf"),
    ("psd", "psd"),
    ("app", "app"),
    ("doc", "data"),
]

let out = URL(fileURLWithPath: "img/desk", isDirectory: true)
try? FileManager.default.createDirectory(at: out, withIntermediateDirectories: true)

func png(_ image: NSImage, appearance: NSAppearance.Name, pt: Int = 64) -> Data? {
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: pt * 2, pixelsHigh: pt * 2, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true,
                               isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    rep.size = NSSize(width: pt, height: pt)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    NSGraphicsContext.current?.imageInterpolation = .high
    NSAppearance(named: appearance)?.performAsCurrentDrawingAppearance {
        image.draw(in: NSRect(x: 0, y: 0, width: pt, height: pt), from: .zero, operation: .copy, fraction: 1)
    }
    NSGraphicsContext.restoreGraphicsState()
    return rep.representation(using: .png, properties: [:])
}

func write(_ image: NSImage, _ name: String, pt: Int = 64) {
    guard let light = png(image, appearance: .aqua, pt: pt) else { return }
    try? light.write(to: out.appendingPathComponent(name + ".png"))
    print("wrote img/desk/\(name).png")
    if let dark = png(image, appearance: .darkAqua, pt: pt), dark != light {
        try? dark.write(to: out.appendingPathComponent(name + "-dark.png"))
        print("wrote img/desk/\(name)-dark.png")
    }
}

for (name, ext) in types {
    let type: UTType? = ext.map { UTType(filenameExtension: $0) ?? .data } ?? .folder
    guard let type else { continue }
    let icon = NSWorkspace.shared.icon(for: type)
    icon.size = NSSize(width: 64, height: 64)
    write(icon, name)
}

// At 128 pt: the Applications folder (the installer window's drop target), this Mac's own icon
// (About This Mac on a Mac mini, and system alerts), and the laptop and iMac for About This Mac.
write(NSWorkspace.shared.icon(forFile: "/Applications"), "applications", pt: 128)
if let mac = NSImage(named: NSImage.computerName) { write(mac, "this-mac", pt: 128) }
let core = "/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/"
for (name, file) in [("macbook-pro", "com.apple.macbookpro-14-2021-space-gray.icns"), ("imac", "com.apple.imac-2021-blue.icns")] {
    guard let icon = NSImage(contentsOfFile: core + file) else { print("missing \(file)"); continue }
    write(icon, name, pt: 128)
}
