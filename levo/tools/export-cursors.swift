// Renders macOS's open and closed hand cursors for the footer test's carried bin into img/cursor/.
// Usage, from levo/: swift tools/export-cursors.swift   (each at 2x, with its hotspot printed)
import AppKit
let out = URL(fileURLWithPath: "img/cursor", isDirectory: true)
try? FileManager.default.createDirectory(at: out, withIntermediateDirectories: true)
for (name, cursor) in [("open-hand", NSCursor.openHand), ("closed-hand", NSCursor.closedHand)] {
    let img = cursor.image, size = img.size
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(size.width * 2), pixelsHigh: Int(size.height * 2), bitsPerSample: 8, samplesPerPixel: 4,
                               hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    rep.size = size
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    img.draw(in: NSRect(origin: .zero, size: size), from: .zero, operation: .copy, fraction: 1)
    NSGraphicsContext.restoreGraphicsState()
    try! rep.representation(using: .png, properties: [:])!.write(to: out.appendingPathComponent(name + ".png"))
    print(name, "size", size.width, size.height, "hotspot", cursor.hotSpot.x, cursor.hotSpot.y)
}
