// Renders the demo dock's app icons from the apps on this Mac into img/dock/.
// Usage, from levo/: swift tools/export-dock-icons.swift [name …] (no names: the whole set)
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
    ("textedit", "/System/Applications/TextEdit.app"),
    ("levo", NSString(string: "~/Applications/Levo.app").expandingTildeInPath),
    ("amply", "/Applications/Amply.app"),
]
let only = Set(CommandLine.arguments.dropFirst())

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

for (name, path) in apps where only.isEmpty || only.contains(name) {
    guard FileManager.default.fileExists(atPath: path) else { print("missing \(path)"); continue }
    for (suffix, appearance) in [("", 0), ("-dark", 1)] {
        if let image = render(path, appearance: appearance) { write(image, name + suffix) } else { print("no image for \(name)\(suffix)") }
    }
}

// The Trash, empty and full, from CoreTypes.bundle: the same in both appearances.
let core = "/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/"
for (name, image) in [("trash-empty", NSImage(contentsOfFile: core + "TrashIcon.icns")), ("trash-full", NSImage(contentsOfFile: core + "FullTrashIcon.icns"))] {
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

// The Trash's dark renders (trash-empty-dark.png, trash-full-dark.png): AppKit's named Trash images
// drawn with the app in the dark appearance, at the same 128 pt @2x. The CoreTypes .icns above has
// no dark artwork; the named images do. (Documents and folders look the same in both in macOS.)
for (name, image) in [("trash-empty", NSImage(named: NSImage.trashEmptyName)), ("trash-full", NSImage(named: NSImage.trashFullName))] {
    guard let image else { continue }
    NSApplication.shared.appearance = NSAppearance(named: .darkAqua)
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: 256, pixelsHigh: 256, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true,
                               isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    rep.size = NSSize(width: 128, height: 128)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    NSGraphicsContext.current?.imageInterpolation = .high
    NSAppearance(named: .darkAqua)!.performAsCurrentDrawingAppearance {
        image.draw(in: NSRect(x: 0, y: 0, width: 128, height: 128), from: .zero, operation: .copy, fraction: 1)
    }
    NSGraphicsContext.restoreGraphicsState()
    if let png = rep.representation(using: .png, properties: [:]) { try? png.write(to: out.appendingPathComponent(name + "-dark.png")); print("wrote img/dock/\(name)-dark.png") }
}

// The mounted "Levo" disk image on the desktop: macOS's removable volume icon with
// Levo's app icon centred on it, as app disk images do, in light and dark.
typealias InitIcns = @convention(c) (AnyObject, Selector, NSURL) -> AnyObject
func volume(appearance: Int) -> CGImage? {
    guard let icnsClass = NSClassFromString("ISIcnsIcon") else { return nil }
    let url = NSURL(fileURLWithPath: "/System/Library/Extensions/IOStorageFamily.kext/Contents/Resources/Removable.icns")
    let icon = unsafeBitCast(send, to: InitIcns.self)(alloc(icnsClass), NSSelectorFromString("initWithContentOfURL:"), url)
    let desc = unsafeBitCast(send, to: InitSize.self)(alloc(descClass), NSSelectorFromString("initWithSize:scale:"), CGSize(width: 128, height: 128), 2)
    unsafeBitCast(send, to: SetInt.self)(desc, NSSelectorFromString("setAppearance:"), appearance)
    unsafeBitCast(send, to: Prepare.self)(icon, NSSelectorFromString("prepareImagesForDescriptors:"), [desc] as NSArray)
    return unsafeBitCast(send, to: Image.self)(icon, NSSelectorFromString("CGImageForDescriptor:"), desc)?.takeUnretainedValue()
}
let desk = URL(fileURLWithPath: "img/desk", isDirectory: true)
try? FileManager.default.createDirectory(at: desk, withIntermediateDirectories: true)
let levoApp = NSString(string: "~/Applications/Levo.app").expandingTildeInPath
for (suffix, appearance) in [("", 0), ("-dark", 1)] {
    guard let base = volume(appearance: appearance), let app = render(levoApp, appearance: appearance),
          let ctx = CGContext(data: nil, width: 256, height: 256, bitsPerComponent: 8, bytesPerRow: 0,
                              space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else {
        print("missing volume\(suffix)"); continue
    }
    ctx.interpolationQuality = .high
    ctx.draw(base, in: CGRect(x: 0, y: 0, width: 256, height: 256))
    let side: CGFloat = 112
    ctx.draw(app, in: CGRect(x: (256 - side) / 2, y: (256 - side) / 2 + 6, width: side, height: side))
    if let out = ctx.makeImage(), let png = NSBitmapImageRep(cgImage: out).representation(using: .png, properties: [:]) {
        try? png.write(to: desk.appendingPathComponent("levo-volume\(suffix).png"))
        print("wrote img/desk/levo-volume\(suffix).png")
    }
}

// Process rows in the popover: the installed apps' own icons, as Levo shows them.
let processApps: [(String, String)] = [
    ("xcode", "/Applications/Xcode.app"),
    ("safari", "/System/Volumes/Preboot/Cryptexes/App/System/Applications/Safari.app"),
    ("claude", "/Applications/Claude.app"),
    ("cursor", "/Applications/Cursor.app"),
]
let appsOut = URL(fileURLWithPath: "img/apps", isDirectory: true)
try? FileManager.default.createDirectory(at: appsOut, withIntermediateDirectories: true)
for (name, path) in processApps {
    guard FileManager.default.fileExists(atPath: path) else { print("missing \(path)"); continue }
    for (suffix, appearance) in [("", 0), ("-dark", 1)] {
        guard let image = render(path, appearance: appearance),
              let png = NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:]) else { continue }
        try? png.write(to: appsOut.appendingPathComponent(name + suffix + ".png"))
        print("wrote img/apps/\(name)\(suffix).png")
    }
}

// The Downloads stack: the real Downloads folder icon (the same in both appearances).
do {
    let icon = NSWorkspace.shared.icon(forFile: NSString(string: "~/Downloads").expandingTildeInPath)
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: 256, pixelsHigh: 256, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true,
                               isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    rep.size = NSSize(width: 128, height: 128)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    icon.draw(in: NSRect(x: 0, y: 0, width: 128, height: 128), from: .zero, operation: .copy, fraction: 1)
    NSGraphicsContext.restoreGraphicsState()
    if let png = rep.representation(using: .png, properties: [:]) { try? png.write(to: out.appendingPathComponent("downloads.png")); print("wrote img/dock/downloads.png") }
}
