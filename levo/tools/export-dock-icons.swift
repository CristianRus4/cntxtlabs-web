// Renders the demo dock's app icons from the apps on this Mac into img/dock/.
// Usage, from levo/: swift tools/export-dock-icons.swift
// Each icon is drawn at 128 pt @2x (256 px), in this Mac's own icon style
// (System Settings › Appearance › Icon and widget style). Swap the folder to change the set.
import AppKit

let apps: [(String, String)] = [
    ("finder", "/System/Library/CoreServices/Finder.app"),
    ("safari", "/System/Volumes/Preboot/Cryptexes/App/System/Applications/Safari.app"),
    ("mail", "/System/Applications/Mail.app"),
    ("messages", "/System/Applications/Messages.app"),
    ("notes", "/System/Applications/Notes.app"),
    ("music", "/System/Applications/Music.app"),
    ("photos", "/System/Applications/Photos.app"),
    ("calendar", "/System/Applications/Calendar.app"),
    ("settings", "/System/Applications/System Settings.app"),
    ("terminal", "/System/Applications/Utilities/Terminal.app"),
]

let out = URL(fileURLWithPath: "img/dock", isDirectory: true)
try? FileManager.default.createDirectory(at: out, withIntermediateDirectories: true)

func write(_ image: NSImage, _ name: String) {
    let px = 256
    guard let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: px, pixelsHigh: px, bitsPerSample: 8,
                                     samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
                                     colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0) else { return }
    rep.size = NSSize(width: 128, height: 128)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    NSGraphicsContext.current?.imageInterpolation = .high
    image.draw(in: NSRect(x: 0, y: 0, width: 128, height: 128), from: .zero, operation: .copy, fraction: 1)
    NSGraphicsContext.restoreGraphicsState()
    guard let png = rep.representation(using: .png, properties: [:]) else { return }
    try? png.write(to: out.appendingPathComponent(name + ".png"))
    print("wrote img/dock/\(name).png")
}

for (name, path) in apps {
    guard FileManager.default.fileExists(atPath: path) else { print("missing \(path)"); continue }
    let icon = NSWorkspace.shared.icon(forFile: path)
    icon.size = NSSize(width: 128, height: 128)
    write(icon, name)
}

// The Trash, empty and full, from the Dock's own artwork when it is there.
let dock = "/System/Library/CoreServices/Dock.app/Contents/Resources/"
for (name, files) in [("trash-empty", ["trashempty2.png", "trashempty.png"]), ("trash-full", ["trashfull2.png", "trashfull.png"])] {
    if let file = files.first(where: { FileManager.default.fileExists(atPath: dock + $0) }), let image = NSImage(contentsOfFile: dock + file) {
        write(image, name)
    } else if let image = NSImage(named: name == "trash-empty" ? NSImage.trashEmptyName : NSImage.trashFullName) {
        write(image, name)
    } else {
        print("missing \(name)")
    }
}
