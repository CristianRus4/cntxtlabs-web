// Renders the desktop's and Finder's file icons from this Mac into img/desk/.
// Usage, from levo/: swift tools/export-desk-icons.swift
// Each icon is 64 pt @2x (128 px), in light (<name>.png) and dark (<name>-dark.png),
// asked of IconServices per appearance (0 light, 1 dark), like export-dock-icons.swift.
// When macOS draws a type the same in both appearances, only the light file is kept.
// Leaves img/desk/levo-volume*.png (made by export-dock-icons.swift) alone.
import AppKit

// (file name, uniform type identifier)
let types: [(String, String)] = [
    ("folder", "public.folder"),
    ("txt", "public.plain-text"),
    ("zip", "public.zip-archive"),
    ("doc", "public.data"),
    ("pdf", "com.adobe.pdf"),
    ("png", "public.png"),
    ("psd", "com.adobe.photoshop-image"),
    ("dmg", "com.apple.disk-image-udif"),
    ("pkg", "com.apple.installer-package-archive"),
    ("app", "com.apple.application-bundle"),
]

let out = URL(fileURLWithPath: "img/desk", isDirectory: true)
try? FileManager.default.createDirectory(at: out, withIntermediateDirectories: true)

guard Bundle(path: "/System/Library/PrivateFrameworks/IconServices.framework")?.load() == true,
      let iconClass = NSClassFromString("ISTypeIcon"), let descClass = NSClassFromString("ISImageDescriptor"),
      let send = dlsym(UnsafeMutableRawPointer(bitPattern: -2), "objc_msgSend") else {
    fatalError("IconServices isn't available")
}
typealias InitType = @convention(c) (AnyObject, Selector, NSString) -> AnyObject
typealias InitSize = @convention(c) (AnyObject, Selector, CGSize, CGFloat) -> AnyObject
typealias SetInt = @convention(c) (AnyObject, Selector, Int) -> Void
typealias Prepare = @convention(c) (AnyObject, Selector, NSArray) -> Void
typealias Image = @convention(c) (AnyObject, Selector, AnyObject) -> Unmanaged<CGImage>?

func alloc(_ cls: AnyClass) -> AnyObject { (cls as AnyObject).perform(NSSelectorFromString("alloc")).takeUnretainedValue() }

func render(_ uti: String, appearance: Int) -> CGImage? {
    let icon = unsafeBitCast(send, to: InitType.self)(alloc(iconClass), NSSelectorFromString("initWithType:"), uti as NSString)
    let desc = unsafeBitCast(send, to: InitSize.self)(alloc(descClass), NSSelectorFromString("initWithSize:scale:"), CGSize(width: 64, height: 64), 2)
    unsafeBitCast(send, to: SetInt.self)(desc, NSSelectorFromString("setAppearance:"), appearance)
    unsafeBitCast(send, to: Prepare.self)(icon, NSSelectorFromString("prepareImagesForDescriptors:"), [desc] as NSArray)
    return unsafeBitCast(send, to: Image.self)(icon, NSSelectorFromString("CGImageForDescriptor:"), desc)?.takeUnretainedValue()
}

// IconServices may hand back a larger representation; draw it at exactly 128 px.
func png(_ image: CGImage) -> Data? {
    guard let ctx = CGContext(data: nil, width: 128, height: 128, bitsPerComponent: 8, bytesPerRow: 0,
                              space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return nil }
    ctx.interpolationQuality = .high
    ctx.draw(image, in: CGRect(x: 0, y: 0, width: 128, height: 128))
    guard let out = ctx.makeImage() else { return nil }
    return NSBitmapImageRep(cgImage: out).representation(using: .png, properties: [:])
}

for (name, uti) in types {
    guard let light = render(uti, appearance: 0), let lightPNG = png(light) else { print("no image for \(name)"); continue }
    try? lightPNG.write(to: out.appendingPathComponent(name + ".png"))
    print("wrote img/desk/\(name).png")
    let darkURL = out.appendingPathComponent(name + "-dark.png")
    if let dark = render(uti, appearance: 1), let darkPNG = png(dark), darkPNG != lightPNG {
        try? darkPNG.write(to: darkURL)
        print("wrote img/desk/\(name)-dark.png")
    } else {
        try? FileManager.default.removeItem(at: darkURL)
        print("\(name): the same in dark, light only")
    }
}
