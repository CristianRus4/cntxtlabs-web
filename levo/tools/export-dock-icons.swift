// Renders the demo dock's app icons from the apps on this Mac into img/dock/.
// Usage, from levo/: swift tools/export-dock-icons.swift
// Each icon is 128 pt @2x (256 px), in light (<name>.png) and dark (<name>-dark.png).
// NSWorkspace's icons follow this Mac's own icon style whatever appearance is drawn
// in, so this asks IconServices for each appearance (0 light, 1 dark) instead.
// Swap the folder to change the set.
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
    ("levo", NSString(string: "~/Applications/Levo.app").expandingTildeInPath),
]

let out = URL(fileURLWithPath: "img/dock", isDirectory: true)
try? FileManager.default.createDirectory(at: out, withIntermediateDirectories: true)

guard Bundle(path: "/System/Library/PrivateFrameworks/IconServices.framework")?.load() == true,
      let iconClass = NSClassFromString("ISBundleIcon"), let descClass = NSClassFromString("ISImageDescriptor"),
      let send = dlsym(UnsafeMutableRawPointer(bitPattern: -2), "objc_msgSend") else {
    fatalError("IconServices isn't available")
}
typealias InitURL = @convention(c) (AnyObject, Selector, NSURL) -> AnyObject
typealias InitSize = @convention(c) (AnyObject, Selector, CGSize, CGFloat) -> AnyObject
typealias SetInt = @convention(c) (AnyObject, Selector, Int) -> Void
typealias Prepare = @convention(c) (AnyObject, Selector, NSArray) -> Void
typealias Image = @convention(c) (AnyObject, Selector, AnyObject) -> Unmanaged<CGImage>?

func alloc(_ cls: AnyClass) -> AnyObject { (cls as AnyObject).perform(NSSelectorFromString("alloc")).takeUnretainedValue() }

func render(_ path: String, appearance: Int) -> CGImage? {
    let icon = unsafeBitCast(send, to: InitURL.self)(alloc(iconClass), NSSelectorFromString("initWithBundleURL:"), NSURL(fileURLWithPath: path))
    let desc = unsafeBitCast(send, to: InitSize.self)(alloc(descClass), NSSelectorFromString("initWithSize:scale:"), CGSize(width: 128, height: 128), 2)
    unsafeBitCast(send, to: SetInt.self)(desc, NSSelectorFromString("setAppearance:"), appearance)
    unsafeBitCast(send, to: Prepare.self)(icon, NSSelectorFromString("prepareImagesForDescriptors:"), [desc] as NSArray)
    return unsafeBitCast(send, to: Image.self)(icon, NSSelectorFromString("CGImageForDescriptor:"), desc)?.takeUnretainedValue()
}

func write(_ image: CGImage, _ name: String) {
    let rep = NSBitmapImageRep(cgImage: image)
    guard let png = rep.representation(using: .png, properties: [:]) else { return }
    try? png.write(to: out.appendingPathComponent(name + ".png"))
    print("wrote img/dock/\(name).png")
}

for (name, path) in apps {
    guard FileManager.default.fileExists(atPath: path) else { print("missing \(path)"); continue }
    for (suffix, appearance) in [("", 0), ("-dark", 1)] {
        if let image = render(path, appearance: appearance) { write(image, name + suffix) } else { print("no image for \(name)\(suffix)") }
    }
}

// The Trash, empty and full: the same in both appearances.
for (name, image) in [("trash-empty", NSImage(named: NSImage.trashEmptyName)), ("trash-full", NSImage(named: NSImage.trashFullName))] {
    guard let image else { print("missing \(name)"); continue }
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: 256, pixelsHigh: 256, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true,
                               isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    rep.size = NSSize(width: 128, height: 128)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    image.draw(in: NSRect(x: 0, y: 0, width: 128, height: 128), from: .zero, operation: .copy, fraction: 1)
    NSGraphicsContext.restoreGraphicsState()
    if let png = rep.representation(using: .png, properties: [:]) { try? png.write(to: out.appendingPathComponent(name + ".png")); print("wrote img/dock/\(name).png") }
}
