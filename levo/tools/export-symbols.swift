// Usage: swift levo/tools/export-symbols.swift [symbol.name …]   (no args: every name in levo/tools/symbols.txt)
import AppKit
import Foundation

let scriptURL = URL(fileURLWithPath: #filePath).standardizedFileURL
let toolsDir = scriptURL.deletingLastPathComponent()
let outDir = toolsDir.deletingLastPathComponent().appendingPathComponent("img/symbols")
let fm = FileManager.default
try fm.createDirectory(at: outDir, withIntermediateDirectories: true)

// MARK: names

var names = Array(CommandLine.arguments.dropFirst())
if names.isEmpty {
    let list = try String(contentsOf: toolsDir.appendingPathComponent("symbols.txt"), encoding: .utf8)
    names = list.split(whereSeparator: \.isNewline).compactMap { line in
        let t = line.split(separator: "#", maxSplits: 1, omittingEmptySubsequences: false)[0]
            .trimmingCharacters(in: .whitespaces)
        return t.isEmpty ? nil : t
    }
}
var seen = Set<String>()
names = names.filter { seen.insert($0).inserted }

// MARK: PDF (vector glyph, monochrome, 16 pt regular)

/// A filled shape with its layer opacity.
struct Fill { let path: CGPath; let opacity: CGFloat }
/// One way of building the glyph's geometry, with the fill rule that goes with it.
struct Candidate { let fills: [Fill]; let rule: CGPathFillRule }

/// Candidates for the glyph shape in the glyph's own coordinates (y-down, 2x pixels):
/// the layers composited with real boolean operations (erasers cut out, translucent
/// layers kept apart), then the plain outline under both fill rules.
func candidates(_ glyph: NSObject, _ outline: NSBezierPath) -> [Candidate] {
    var list: [Candidate] = []
    if let layers = glyph.value(forKey: "monochromeLayers") as? [NSObject] {
        var groups: [(opacity: CGFloat, path: CGPath)] = []
        var ok = true
        for layer in layers {
            guard let raw = layer.perform(NSSelectorFromString("shape")) else { ok = false; break }
            let shape = raw.takeUnretainedValue() as! CGPath
            let eraser = (layer.value(forKey: "eraserLayer") as? Bool) ?? false
            let opacity = CGFloat((layer.value(forKey: "opacity") as? Double) ?? 1)
            if eraser {
                groups = groups.map { ($0.opacity, $0.path.subtracting(shape, using: .winding)) }
            } else {
                var mine = shape
                var merged = false
                for i in groups.indices {
                    if groups[i].opacity == opacity { groups[i].path = groups[i].path.union(shape, using: .winding); merged = true }
                    else if groups[i].opacity < opacity { groups[i].path = groups[i].path.subtracting(shape, using: .winding) }
                    else { mine = mine.subtracting(groups[i].path, using: .winding) }
                }
                if !merged { groups.append((opacity, mine)) }
            }
        }
        if ok { list.append(Candidate(fills: groups.filter { !$0.path.isEmpty && $0.opacity > 0 }.map { Fill(path: $0.path, opacity: $0.opacity) }, rule: .winding)) }
    }
    list.append(Candidate(fills: [Fill(path: outline.cgPath, opacity: 1)], rule: .winding))
    list.append(Candidate(fills: [Fill(path: outline.cgPath, opacity: 1)], rule: .evenOdd))
    return list
}

func paint(_ c: Candidate, in ctx: CGContext) {
    for f in c.fills {
        ctx.setFillColor(CGColor(gray: 0, alpha: f.opacity))
        ctx.addPath(f.path)
        ctx.fillPath(using: c.rule)
    }
}

/// Picks the candidate closest to the system's own rendering of the symbol.
func bestCandidate(_ image: NSImage, _ cands: [Candidate], _ place: CGAffineTransform) -> Candidate {
    let k = 4, w = Int(image.size.width) * k, h = Int(image.size.height) * k
    func alpha(_ draw: (CGContext) -> Void) -> [UInt8] {
        let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
                            space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
        ctx.scaleBy(x: CGFloat(k), y: CGFloat(k))
        draw(ctx)
        let p = ctx.data!.assumingMemoryBound(to: UInt8.self)
        return (0..<w * h).map { p[$0 * 4 + 3] }
    }
    let truth = alpha { ctx in
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = NSGraphicsContext(cgContext: ctx, flipped: false)
        image.draw(in: NSRect(origin: .zero, size: image.size))
        NSGraphicsContext.restoreGraphicsState()
    }
    func error(_ c: Candidate) -> Int {
        let mine = alpha { ctx in ctx.concatenate(place); paint(c, in: ctx) }
        return zip(truth, mine).reduce(0) { $0 + abs(Int($1.0) - Int($1.1)) }
    }
    return cands.min { error($0) < error($1) }!
}

func symbolPDF(_ name: String) -> (pdf: Data, size: CGSize)? {
    let config = NSImage.SymbolConfiguration(pointSize: 16, weight: .regular).applying(.preferringMonochrome())
    guard let image = NSImage(systemSymbolName: name, accessibilityDescription: nil)?
        .withSymbolConfiguration(config),
        let rep = image.representations.first,
        let glyph = rep.value(forKey: "vectorGlyph") as? NSObject,
        let outline = rep.value(forKey: "outlinePath") as? NSBezierPath,
        let align = (glyph.value(forKey: "alignmentRectUnrounded") as? NSValue)?.rectValue
    else { return nil }
    // Glyph coordinates are y-down, in 2x pixels, anchored at the alignment rect's top-left.
    let place = CGAffineTransform(translationX: align.origin.x, y: align.origin.y + align.height).scaledBy(x: 0.5, y: -0.5)
    let best = bestCandidate(image, candidates(glyph, outline), place)
    var box = CGRect(origin: .zero, size: image.size)
    let data = NSMutableData()
    guard let consumer = CGDataConsumer(data: data),
          let ctx = CGContext(consumer: consumer, mediaBox: &box, nil) else { return nil }
    ctx.beginPDFPage(nil)
    ctx.concatenate(place)
    paint(best, in: ctx)
    ctx.endPDFPage()
    ctx.closePDF()
    return (data as Data, image.size)
}

// MARK: pdftocairo

func pdfToSVG(_ pdf: Data) throws -> String {
    let tmp = fm.temporaryDirectory.appendingPathComponent("levo-symbol-\(getpid())")
    try fm.createDirectory(at: tmp, withIntermediateDirectories: true)
    defer { try? fm.removeItem(at: tmp) }
    let inURL = tmp.appendingPathComponent("in.pdf"), outURL = tmp.appendingPathComponent("out.svg")
    try pdf.write(to: inURL)
    let p = Process()
    p.executableURL = URL(fileURLWithPath: "/usr/bin/env")
    p.arguments = ["pdftocairo", "-svg", inURL.path, outURL.path]
    var env = ProcessInfo.processInfo.environment
    env["PATH"] = (env["PATH"] ?? "") + ":/opt/homebrew/bin:/usr/local/bin"
    p.environment = env
    try p.run()
    p.waitUntilExit()
    guard p.terminationStatus == 0 else { throw Failure("pdftocairo failed") }
    return try String(contentsOf: outURL, encoding: .utf8)
}

struct Failure: Error, CustomStringConvertible {
    let description: String
    init(_ d: String) { description = d }
}

// MARK: clean-up

func round2(_ s: String) -> String {
    let re = try! NSRegularExpression(pattern: #"-?\d+\.\d+"#)
    var out = "", last = s.startIndex
    for m in re.matches(in: s, range: NSRange(s.startIndex..., in: s)) {
        let r = Range(m.range, in: s)!
        out += s[last..<r.lowerBound]
        var t = String(format: "%.2f", Double(s[r])!)
        if t.contains(".") { while t.hasSuffix("0") { t.removeLast() }; if t.hasSuffix(".") { t.removeLast() } }
        out += (t == "-0" ? "0" : t)
        last = r.upperBound
    }
    return out + s[last...]
}

func attr(_ e: XMLElement, _ n: String) -> String? { e.attribute(forName: n)?.stringValue }
func href(_ e: XMLElement) -> String? {
    (attr(e, "xlink:href") ?? attr(e, "href")).map { String($0.drop(while: { $0 == "#" })) }
}

/// Flattens pdftocairo output into plain shapes (paths only, transforms allowed).
func cleanBody(svg: String, size: CGSize) throws -> String {
    let doc = try XMLDocument(xmlString: svg, options: [.nodeLoadExternalEntitiesNever])
    guard let root = doc.rootElement() else { throw Failure("no svg root") }
    var defs: [String: XMLElement] = [:]
    func collect(_ e: XMLElement) {
        for case let c as XMLElement in e.children ?? [] {
            if let id = attr(c, "id") { defs[id] = c }
            collect(c)
        }
    }
    collect(root)

    func coversBox(_ clipID: String) -> Bool {
        guard let cp = defs[clipID], cp.name == "clipPath" else { return false }
        let shapes = (cp.children ?? []).compactMap { $0 as? XMLElement }
        guard shapes.count == 1, let s = shapes.first else { return false }
        var x0 = 0.0, y0 = 0.0, x1 = 0.0, y1 = 0.0
        if s.name == "rect" {
            x0 = Double(attr(s, "x") ?? "0") ?? 0; y0 = Double(attr(s, "y") ?? "0") ?? 0
            x1 = x0 + (Double(attr(s, "width") ?? "0") ?? 0); y1 = y0 + (Double(attr(s, "height") ?? "0") ?? 0)
        } else if s.name == "path", let d = attr(s, "d") {
            let nums = d.split(whereSeparator: { !"-0123456789.".contains($0) }).compactMap { Double($0) }
            guard nums.count >= 2 else { return false }
            let xs = stride(from: 0, to: nums.count - 1, by: 2).map { nums[$0] }
            let ys = stride(from: 1, to: nums.count, by: 2).map { nums[$0] }
            x0 = xs.min()!; x1 = xs.max()!; y0 = ys.min()!; y1 = ys.max()!
        } else { return false }
        return x1 - x0 >= size.width - 0.01 && y1 - y0 >= size.height - 0.01
    }

    var shapes: [String] = []
    func walk(_ e: XMLElement, _ transforms: [String]) throws {
        var tf = transforms
        if let t = attr(e, "transform") { tf.append(t) }
        if attr(e, "mask") != nil || attr(e, "filter") != nil { throw Failure("uses mask/filter (raster content)") }
        if let c = attr(e, "clip-path") {
            let id = c.replacingOccurrences(of: "url(#", with: "").replacingOccurrences(of: ")", with: "")
            if !coversBox(id) { throw Failure("non-trivial clip path") }
        }
        switch e.name {
        case "svg", "g":
            for case let c as XMLElement in e.children ?? [] where c.name != "defs" { try walk(c, tf) }
        case "use":
            guard let h = href(e), let target = defs[h] else { throw Failure("unresolved use") }
            if target.name == "symbol" || target.name == "g" || target.name == "path" || target.name == "rect" {
                try walk(target, tf)
            } else { throw Failure("use of <\(target.name ?? "?")>") }
        case "symbol":
            for case let c as XMLElement in e.children ?? [] { try walk(c, tf) }
        case "path", "rect":
            var a: [String] = []
            if e.name == "rect" {
                for k in ["x", "y", "width", "height", "rx", "ry"] { if let v = attr(e, k) { a.append("\(k)=\"\(round2(v))\"") } }
            } else if let d = attr(e, "d") { a.append("d=\"\(round2(d.trimmingCharacters(in: .whitespaces)))\"") }
            if let r = attr(e, "fill-rule"), r != "nonzero" { a.append("fill-rule=\"\(r)\"") }
            if let o = attr(e, "fill-opacity"), let v = Double(o), v < 0.999 { a.append("fill-opacity=\"\(round2(o))\"") }
            if let o = attr(e, "opacity"), let v = Double(o), v < 0.999 { a.append("opacity=\"\(round2(o))\"") }
            if let s = attr(e, "stroke"), s != "none" { throw Failure("uses stroke") }
            if !tf.isEmpty { a.append("transform=\"\(round2(tf.joined(separator: " ")))\"") }
            a.append("fill=\"currentColor\"")
            shapes.append("<\(e.name!) \(a.joined(separator: " "))/>")
        case "image": throw Failure("contains a raster image")
        default: throw Failure("unexpected <\(e.name ?? "?")>")
        }
    }
    try walk(root, [])
    guard !shapes.isEmpty else { throw Failure("empty glyph") }
    return shapes.joined()
}

func fmt(_ v: CGFloat) -> String { v == v.rounded() ? String(Int(v)) : String(format: "%g", Double(v)) }

// MARK: export

var exported: [String] = [], missing: [String] = [], failed: [(String, String)] = []
for name in names {
    guard let (pdf, size) = symbolPDF(name) else { missing.append(name); continue }
    do {
        let body = try cleanBody(svg: try pdfToSVG(pdf), size: size)
        let w = fmt(size.width), h = fmt(size.height)
        let svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"\(w)\" height=\"\(h)\" viewBox=\"0 0 \(w) \(h)\">\(body)</svg>\n"
        try svg.write(to: outDir.appendingPathComponent("\(name).svg"), atomically: true, encoding: .utf8)
        exported.append(name)
    } catch { failed.append((name, "\(error)")) }
}

// MARK: bundle (rebuilt from every svg in the folder)

func jsString(_ s: String) -> String {
    let e = JSONEncoder(); e.outputFormatting = [.withoutEscapingSlashes]
    return String(data: try! e.encode(s), encoding: .utf8)!
}
let files = try fm.contentsOfDirectory(atPath: outDir.path).filter { $0.hasSuffix(".svg") }.sorted()
var entries: [String] = []
let head = try! NSRegularExpression(pattern: #"^<svg [^>]*?width="([\d.]+)" height="([\d.]+)"[^>]*>(.*)</svg>\s*$"#, options: [.dotMatchesLineSeparators])
for f in files {
    let s = try String(contentsOf: outDir.appendingPathComponent(f), encoding: .utf8)
    guard let m = head.firstMatch(in: s, range: NSRange(s.startIndex..., in: s)) else {
        FileHandle.standardError.write(Data("skipped unparsable \(f)\n".utf8)); continue
    }
    let g = { (i: Int) in String(s[Range(m.range(at: i), in: s)!]) }
    entries.append("  \(jsString(String(f.dropLast(4)))): { w: \(g(1)), h: \(g(2)), body: \(jsString(g(3))) }")
}
let js = "// Generated by levo/tools/export-symbols.swift from the svgs in this folder. Do not edit by hand.\nwindow.LEVO_SYMBOLS = {\n\(entries.joined(separator: ",\n"))\n};\n"
try js.write(to: outDir.appendingPathComponent("symbols.js"), atomically: true, encoding: .utf8)

// MARK: report

print("exported \(exported.count), bundle has \(entries.count)")
if !missing.isEmpty { print("missing on this macOS: \(missing.joined(separator: " "))") }
for (n, why) in failed { print("failed \(n): \(why)") }
