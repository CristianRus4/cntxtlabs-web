/*
 * The footer: the year, and a small scene run by Matter.js (0.20.0 from cdnjs, pinned, with its
 * integrity hash, loaded only when the footer comes near).
 *
 * "Levo" is the page's rounded heavy face (ui-rounded, "SF Pro Rounded", then the system font),
 * huge, its lower part below the page's bottom edge, fading out towards it. One source: each glyph
 * is drawn on one canvas, and its collider is that same glyph's outline, read from the same canvas
 * drawing (the convex hull of the part above the floor: round tops, a round e and o, the v with its
 * notch filled so nothing wedges there). The colliders keep the full shape; only the ink fades.
 * A resize (debounced) or document.fonts.ready rebuilds both together, and every body is moved and
 * scaled to match: positions follow the letters, clamped inside the walls and clear of the letters,
 * and gravity settles them.
 *
 * The Trash, about two files tall, stands full at the right of the L's round top, its centre of
 * mass just past where it stands: on a hinge at its base it leans, slowly and then faster, and past
 * about 17 degrees it's let go and falls onto "evo". Its files aren't bodies while they're inside
 * (hidden behind the bin, which shows macOS's full Trash icon): once its opening tilts past 45
 * degrees they come out one at a time, every ~80 ms, each from a spot inside the bin just within
 * the rim where it overlaps nothing, with the bin's own velocity there, a small nudge and a little
 * spin, so they spread along the fall; when it lands, the jolt throws the rest out quicker and
 * harder, each still on its own, and on its side what's in the opening drifts on out as tumbling
 * contents do, so the next can follow. Nothing appears anywhere but inside the bin. Files dropped into the upright bin's opening go in the same
 * way, and come out the same way.
 *
 * Every body is its real rectangle with low bounce; low static friction lets things roll off the
 * round letters, and a gentle settle tips anything at rest onto its nearest flat side. Grab
 * anything at any point, with the mouse or a finger: a soft constraint holds it at exactly that
 * point, so it hangs and swings under gravity. A double-click stands the bin up.
 * Reduced motion: no physics; the bin lies on its side on the L, the files rest on "evo".
 */
(function () {
	"use strict";
	var root = document.querySelector("[data-lf]");
	if (!root) return;
	var year = root.querySelector("[data-lf-year]");
	if (year) year.textContent = String(new Date().getFullYear());

	var stage = root.querySelector("[data-spill]");
	if (!stage) return;
	var word = stage.querySelector("[data-word]"), binEl = stage.querySelector("[data-bin]");
	var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	var MATTER = { src: "https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.20.0/matter.min.js", sri: "sha384-ZRKYEXtLBVeqs9z1WxyeKutCqnkqolS/r1EUWuoUpG4ZKbnRAIXnHhHdnNuiB6CL" };
	var BIN = { empty: "img/dock/trash-empty.png", full: "img/dock/trash-full.png" };
	var FACE = 'ui-rounded, "SF Pro Rounded", -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
	// The L's foot is under the page's edge, so "evo" sits closer to its stem than the face spaces it.
	var WORD = "Levo", TRACK = -0.045, KERN_L = -0.3;

	// macOS's own icons, as on the simulated desktop (img/desk). The rectangle is each icon's real
	// outline as a share of its image: folders are wide, documents tall.
	var FILES = [["folder", 0.92, 0.72], ["txt", 0.72, 0.9], ["zip", 0.72, 0.9], ["pdf", 0.72, 0.9], ["png", 0.72, 0.9],
		["folder", 0.92, 0.72], ["pkg", 0.86, 0.8], ["doc", 0.72, 0.9], ["psd", 0.72, 0.9]];
	// The Trash image's own body, as a share of the image: its outer width and height, the wall.
	var BW = 0.6, BH = 0.78, WALL = 0.05;

	var W = 0, H = 0, G = null, S = 40, SB = 140, files = [];
	var probe = document.createElement("canvas");

	// ---------------------------------------------------------------- The one geometry: the glyphs

	function font(px) { return "800 " + px + "px " + FACE; }
	// A glyph's outline above the floor, from the glyph itself: the top edge of every column of its
	// pixels, as convex hulls with the floor. Where the top edge dips into a valley between two
	// peaks (the v's notch), it's two parts that meet there, so the notch stays open and can catch.
	function outline(ch, x, base, F, floor) {
		var c = probe.getContext("2d", { willReadFrequently: true });
		c.font = font(F);
		var m = c.measureText(ch), pad = 6;
		var l = Math.ceil(m.actualBoundingBoxLeft), r = Math.ceil(m.actualBoundingBoxRight), a = Math.ceil(m.actualBoundingBoxAscent), d = Math.ceil(m.actualBoundingBoxDescent);
		var w = l + r + pad * 2, h = a + d + pad * 2;
		probe.width = w; probe.height = h;
		c = probe.getContext("2d", { willReadFrequently: true });
		c.font = font(F);
		c.fillStyle = "#000";
		c.fillText(ch, pad + l, pad + a);
		var px = c.getImageData(0, 0, w, h).data, pts = [];
		for (var col = 0; col < w; col += 2) {
			for (var row = 0; row < h; row++) {
				if (px[(row * w + col) * 4 + 3] > 120) {
					var X = x - l - pad + col, Y = base - a - pad + row;
					if (Y < floor - 1) pts.push({ x: X, y: Y });
					break;
				}
			}
		}
		if (pts.length < 3) return null;
		var half = pts.length >> 1, low = function (list) { return Math.min.apply(null, list.map(function (p) { return p.y; })); };
		var peakL = pts.indexOf(pts.slice(0, half).reduce(function (m, p) { return p.y < m.y ? p : m; }));
		var peakR = half + pts.slice(half).indexOf(pts.slice(half).reduce(function (m, p) { return p.y < m.y ? p : m; }));
		var k = peakL;
		for (var i = peakL; i <= peakR; i++) if (pts[i].y > pts[k].y) k = i;
		var parts = pts[k].y - Math.max(low(pts.slice(0, half)), low(pts.slice(half))) > F * 0.15 ? [pts.slice(0, k + 1), pts.slice(k)] : [pts];
		return parts.map(function (q) {
			q = q.concat([{ x: q[0].x, y: floor + 80 }, { x: q[q.length - 1].x, y: floor + 80 }]);
			return hull(q);
		});
	}
	function hull(p) {
		p = p.slice().sort(function (a, b) { return a.x - b.x || a.y - b.y; });
		var cross = function (o, a, b) { return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x); };
		var lo = [], up = [];
		p.forEach(function (q) { while (lo.length > 1 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); });
		p.slice().reverse().forEach(function (q) { while (up.length > 1 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); });
		return lo.slice(0, -1).concat(up.slice(0, -1));
	}
	function geometry() {
		W = Math.round(stage.clientWidth); H = Math.round(stage.clientHeight);
		var c = probe.getContext("2d", { willReadFrequently: true });
		c.font = font(100);
		var adv = WORD.split("").map(function (ch) { return c.measureText(ch).width / 100; });
		var em = adv.reduce(function (s, v) { return s + v; }, 0) + TRACK * (WORD.length - 1) + KERN_L;
		// Huge: the width of the footer, or as tall as fits; about a fifth of it below the edge.
		var F = Math.round(Math.min(W * 0.92 / em, H * 1.3));
		var floor = H, base = floor + Math.round(F * 0.2), x = Math.round((W - em * F) / 2);
		var glyphs = WORD.split("").map(function (ch, i) {
			var parts = outline(ch, x, base, F, floor);
			var g = { ch: ch, x: x, hulls: parts || [], hull: parts ? [].concat.apply([], parts) : null };
			x += Math.round((adv[i] + TRACK + (i === 0 ? KERN_L : 0)) * F);
			return g;
		});
		// The L's round top: the bin stands on it, a little right of its centre.
		var L = glyphs[0].hull, top = Math.min.apply(null, L.map(function (p) { return p.y; }));
		var stemL = Math.min.apply(null, L.map(function (p) { return p.x; })), stemR = Math.max.apply(null, L.filter(function (p) { return p.y < floor - 2; }).map(function (p) { return p.x; }));
		// Files at their size; the Trash about two documents tall beside them.
		S = Math.round(Math.max(28, Math.min(52, F * 0.1)));
		SB = Math.round(S * 2.3);
		G = { F: F, floor: floor, base: base, glyphs: glyphs, stemTop: top, stemX: (stemL + stemR) / 2, stemW: stemR - stemL,
			bw: SB * BW, bh: SB * BH, wall: Math.max(3, SB * WALL) };
		// At the right of the L's top, its centre of mass just past where it stands: it leans.
		G.binX = G.stemX + G.stemW * 0.18;
		G.binY = top - G.bh / 2 - 1;
		return G;
	}
	// The same glyphs, drawn at the same place in the ink of .lf-word (footer.css), strong at the
	// letters' top and fading to nothing at the page's bottom edge.
	function drawWord() {
		var dpr = Math.min(2, window.devicePixelRatio || 1);
		word.width = Math.round(W * dpr); word.height = Math.round(H * dpr);
		word.style.width = W + "px"; word.style.height = H + "px";
		var c = word.getContext("2d"), ink = getComputedStyle(word).color.match(/[\d.]+/g) || [0, 0, 0, 0.1];
		var rgb = ink.slice(0, 3).join(","), a = ink.length > 3 ? +ink[3] : 1;
		c.setTransform(dpr, 0, 0, dpr, 0, 0);
		c.clearRect(0, 0, W, H);
		var top = Math.min.apply(null, G.glyphs.map(function (g) { return g.hull ? Math.min.apply(null, g.hull.map(function (p) { return p.y; })) : H; }));
		var fade = c.createLinearGradient(0, top, 0, H);
		fade.addColorStop(0, "rgba(" + rgb + "," + a + ")");
		fade.addColorStop(1, "rgba(" + rgb + ",0)");
		c.fillStyle = fade;
		c.font = font(G.F);
		G.glyphs.forEach(function (g) { c.fillText(g.ch, g.x, G.base); });
	}

	// ---------------------------------------------------------------- Drawing bodies

	function place(el, x, y, a, size) {
		el.style.width = size + "px"; el.style.height = size + "px";
		el.style.transform = "translate(" + (x - size / 2).toFixed(1) + "px," + (y - size / 2).toFixed(1) + "px) rotate(" + (a || 0).toFixed(3) + "rad)";
	}
	function makeEls() {
		FILES.forEach(function (f, i) {
			var img = document.createElement("img");
			img.className = "lf-item is-in";
			img.src = "img/desk/" + f[0] + ".png";
			img.alt = ""; img.draggable = false;
			stage.appendChild(img);
			files[i] = { el: img, w: f[1], h: f[2], body: null };
		});
	}
	function topAt(g, x) {
		// The glyph's top at x, from its outline (for resting things on it without physics).
		var best = G.floor;
		g.hulls.forEach(function (h) {
			h.forEach(function (p, i) {
				var q = h[(i + 1) % h.length];
				if ((p.x - x) * (q.x - x) <= 0 && p.x !== q.x) { var y = p.y + (q.y - p.y) * (x - p.x) / (q.x - p.x); if (y < best) best = y; }
			});
		});
		return best;
	}
	// Reduced motion: the bin on its side on top of the L, files on "evo" (one in the v's notch) and the floor.
	function lieStill() {
		binEl.src = BIN.empty;
		place(binEl, G.stemX + G.bh * 0.1, G.stemTop - G.bw / 2, Math.PI / 2, SB);
		var spots = [];
		[1, 2, 3].forEach(function (k) {
			var g = G.glyphs[k];
			var xs = g.hull.map(function (p) { return p.x; }), a = Math.min.apply(null, xs), b = Math.max.apply(null, xs), mid = (a + b) / 2;
			spots.push([mid, topAt(g, mid)]);
		});
		files.forEach(function (f, i) {
			f.el.classList.remove("is-in");
			var fh = S * f.h, s = spots[i % spots.length], layer = Math.floor(i / spots.length);
			if (layer < 2) place(f.el, s[0] + (layer ? S * 0.3 : 0), s[1] - fh / 2 - layer * S * 0.82, 0, S);
			else place(f.el, Math.min(W - S, W * 0.92 - (i - 6) * S), G.floor - fh / 2, 0, S);
		});
	}
	// Before it plays: the bin upright and full on the L.
	function poseStart() {
		binEl.src = BIN.full;
		place(binEl, G.binX, G.binY, 0, SB);
	}

	// ---------------------------------------------------------------- With Matter.js

	var M, engine, world, statics = [], bin = null, raf = 0, calm = 0, grab = null, started = false, frame = 0;
	// Matter pairs take the lower friction and the higher static friction of two bodies, so the
	// moving bodies keep a low static friction: on the round letters they roll or slide off.
	var SURFACE = { friction: 0.12, frictionStatic: 0.08, restitution: 0.04 };

	function loadMatter(done) {
		if (window.Matter) { done(); return; }
		var s = document.querySelector("script[data-matter]");
		if (!s) {
			s = document.createElement("script");
			s.src = MATTER.src; s.integrity = MATTER.sri; s.crossOrigin = "anonymous"; s.referrerPolicy = "no-referrer";
			s.setAttribute("data-matter", "");
			document.head.appendChild(s);
		}
		s.addEventListener("load", done);
		s.addEventListener("error", function () { lieStill(); stage.classList.add("lf-still"); });
	}

	function buildStatics() {
		var B = M.Bodies, thick = 400;
		if (statics.length) M.Composite.remove(world, statics);
		var LETTER = { isStatic: true, friction: 0.2, frictionStatic: 0.08, restitution: 0.04 };
		var WALLS = { isStatic: true, friction: 0.5, frictionStatic: 0.14, restitution: 0.04 };
		statics = [
			B.rectangle(W / 2, G.floor + thick / 2, W * 3, thick, WALLS),
			B.rectangle(-thick / 2, H / 2, thick, H * 4, WALLS),
			B.rectangle(W + thick / 2, H / 2, thick, H * 4, WALLS),
			B.rectangle(W / 2, -thick / 2 - H * 0.6, W * 3, thick, WALLS)
		];
		G.glyphs.forEach(function (g) {
			g.hulls.forEach(function (h) {
				var c = M.Vertices.centre(h), b = M.Bodies.fromVertices(c.x, c.y, [h], LETTER);
				if (g.ch === "L") b.parts.forEach(function (p) { p.collisionFilter.category = 0x0002; });
				statics.push(b);
			});
		});
		M.Composite.add(world, statics);
	}
	function rect(w, h, x, y) {
		return M.Bodies.rectangle(x, y, w, h, {
			friction: SURFACE.friction, frictionStatic: SURFACE.frictionStatic, restitution: SURFACE.restitution,
			frictionAir: 0.02, density: 0.0016, chamfer: { radius: Math.min(w, h) * 0.06 }
		});
	}
	// The bin: hollow, a floor and two walls, open at the top, as one body.
	function makeBin(x, y) {
		var w = G.bw, h = G.bh, k = G.wall, P = { friction: 0.3, frictionStatic: 0.14, restitution: 0.03, density: 0.003 };
		var b = M.Body.create({
			parts: [
				M.Bodies.rectangle(x, y + h / 2 - k / 2, w, k, P),
				M.Bodies.rectangle(x - w / 2 + k / 2, y, k, h, P),
				M.Bodies.rectangle(x + w / 2 - k / 2, y, k, h, P)
			],
			frictionAir: 0.02, restitution: 0.03, friction: 0.3, frictionStatic: 0.14
		});
		b.imageOffset = { x: x - b.position.x, y: y - b.position.y };
		b.inside = [];
		return b;
	}
	function local(b, v) { var c = Math.cos(b.angle), s = Math.sin(b.angle); return { x: v.x * c - v.y * s, y: v.x * s + v.y * c }; }
	function binCentre() { var o = local(bin, bin.imageOffset); return { x: bin.position.x + o.x, y: bin.position.y + o.y }; }
	function opening() { return Math.abs(Math.atan2(Math.sin(bin.angle), Math.cos(bin.angle))); }

	// Past this tilt of the opening (45 degrees) the files start to slide out, one every ~80 ms.
	var POUR = Math.PI / 4, EVERY = 5;
	// Out at the rim: each file appears inside the bin, just inside the opening (or deeper when
	// that's taken), in a spot where it overlaps nothing
	// (the bin's walls, the letters, the files already out), with the bin's own velocity there, a
	// small nudge out of the opening and a little spin; the bin's tilt does the rest. With no free
	// spot (the opening against a letter or a pile), it waits, and after a few seconds gives up.
	// A bin on its side still empties, as contents tumble out: what's in its opening or just past
	// the rim drifts on outward, gently, so the next one can follow.
	function spill() {
		if (opening() < POUR) return;
		var c = binCentre(), out = local(bin, { x: 0, y: -1 });
		files.forEach(function (f) {
			var b = f.body;
			if (!b || (grab && grab.body === b)) return;
			var d = { x: b.position.x - c.x, y: b.position.y - c.y };
			var lx = d.x * Math.cos(bin.angle) + d.y * Math.sin(bin.angle), ly = -d.x * Math.sin(bin.angle) + d.y * Math.cos(bin.angle);
			if (Math.abs(lx) > G.bw / 2 || ly > -G.bh * 0.1 || ly < -G.bh / 2 - S * 1.7) return;
			var along = b.velocity.x * out.x + b.velocity.y * out.y;
			b.spilled = (b.spilled || 0) + 1;
			if (along < 3.4 && b.spilled < 180) M.Body.setVelocity(b, { x: b.velocity.x + out.x * 0.35, y: b.velocity.y + out.y * 0.35 - 0.3 });
		});
	}
	// The jolt: what sits in the opening or just past it, as the bin stops, carries on out with a
	// little hop, clearing the way for the rest.
	function hop() {
		var c = binCentre(), mouth = local(bin, { x: 0, y: -G.bh / 2 }), out = local(bin, { x: 0, y: -1 });
		var m = { x: c.x + mouth.x, y: c.y + mouth.y };
		files.forEach(function (f) {
			var b = f.body;
			if (!b || (grab && grab.body === b) || Math.hypot(b.position.x - m.x, b.position.y - m.y) > G.bh * 0.8) return;
			M.Body.setVelocity(b, { x: b.velocity.x + out.x * 3, y: b.velocity.y + out.y * 3 - 2.4 });
			M.Body.setAngularVelocity(b, b.angularVelocity + (Math.random() - 0.5) * 0.2);
			b.calmUntil = frame + 30;
		});
	}
	// When it lands (or hits anything hard), the jolt throws what's left out quicker and harder:
	// for a moment one file every ~50 ms, each on its own, with a firmer push and more spin.
	function pour() {
		var o = opening(), burst = bin.jolt && frame - bin.jolt < 70;
		if (!bin.inside.length || o < POUR || frame - (bin.poured || 0) < (burst ? 3 : EVERY)) return;
		var f = bin.inside[0], c = binCentre(), fh = S * f.h, fw = S * f.w, p = null;
		var room = Math.max(0, (G.bw - 2 * G.wall - fw) / 2);
		var others = statics.concat(bin.parts.slice(1), files.map(function (x) { return x.body; }).filter(Boolean));
		// Always inside the bin, in its own frame: just inside the rim, or a little deeper when the
		// file before it is still leaving. Every file visibly comes out through the opening.
		var deep = Math.max(0, G.bh - 2 * G.wall - fh);
		for (var t = 0, n = burst ? 12 : 6; t < n && !p; t++) {
			var rim = local(bin, { x: (Math.random() * 2 - 1) * room, y: -G.bh / 2 + fh / 2 + 1 + deep * Math.min(1, t / (n - 1)) });
			var q = { x: c.x + rim.x, y: c.y + rim.y };
			if (!M.Query.collides(M.Bodies.rectangle(q.x, q.y, fw, fh, { angle: bin.angle }), others).length) p = q;
		}
		if (!p) { bin.blocked = (bin.blocked || 0) + 1; return; }
		bin.blocked = 0;
		bin.poured = frame;
		bin.inside.shift();
		var r = { x: p.x - bin.position.x, y: p.y - bin.position.y };
		f.body = rect(fw, fh, p.x, p.y);
		f.body.isFile = true;
		M.Body.setAngle(f.body, bin.angle + (Math.random() - 0.5) * 0.2);
		var fan = (Math.random() - 0.5) * (burst ? 0.8 : 0.5), out = local(bin, { x: Math.sin(fan), y: -Math.cos(fan) });
		var push = burst ? 3.4 + Math.random() * 2.2 : 1.2 + Math.random() * 1.6;
		M.Body.setVelocity(f.body, { x: bin.velocity.x - bin.angularVelocity * r.y + out.x * push, y: bin.velocity.y + bin.angularVelocity * r.x + out.y * push - (burst ? 1.6 : 0) });
		M.Body.setAngularVelocity(f.body, bin.angularVelocity * 0.6 + (Math.random() - 0.5) * (burst ? 0.24 : 0.12));
		f.body.calmUntil = frame + 30;
		M.Composite.add(world, f.body);
		f.el.classList.remove("is-in");
	}
	// In at the opening of the upright bin: a file that comes to its rim from above goes in.
	function catchIn() {
		if (opening() > 0.35) return;
		var c = binCentre(), mouth = { x: c.x, y: c.y - G.bh / 2 };
		files.forEach(function (f) {
			var b = f.body;
			if (!b || (grab && grab.body === b)) return;
			if (Math.abs(b.position.x - mouth.x) < G.bw * 0.34 && b.position.y < mouth.y + 6 && b.position.y > mouth.y - S && b.velocity.y > -1) {
				M.Composite.remove(world, b);
				f.body = null;
				f.el.classList.add("is-in");
				bin.inside.push(f);
			}
		});
	}
	function setup() {
		M = window.Matter;
		engine = M.Engine.create({ gravity: { x: 0, y: 1, scale: 0.0012 }, positionIterations: 10, velocityIterations: 8, enableSleeping: false });
		world = engine.world;
		buildStatics();
		bin = makeBin(G.binX, G.binY);
		bin.inside = files.slice();
		M.Composite.add(world, bin);
		lean();
		wire(binEl, function () { return bin; });
		files.forEach(function (f) { wire(f.el, function () { return f.body; }); });
		binEl.addEventListener("dblclick", standUp);
	}
	// The lean: the bin turns on a hinge at its base, a hair left of its centre of mass, so it starts
	// slowly and speeds up, as a bin balanced just past an edge does; past about 17 degrees it's let
	// go and falls by itself. While it leans it passes over the L's round top (it stands on the hinge).
	var hinge = null;
	function lean() {
		var foot = { x: bin.position.x - 0.15, y: G.binY + G.bh / 2 };
		hinge = M.Constraint.create({ pointA: foot, bodyB: bin, pointB: { x: foot.x - bin.position.x, y: foot.y - bin.position.y }, length: 0, stiffness: 1, damping: 0 });
		M.Composite.add(world, hinge);
		bin.parts.forEach(function (b) { b.collisionFilter.mask = 0xFFFFFFFD; });
	}
	function letGo() {
		if (!hinge) return;
		M.Composite.remove(world, hinge);
		hinge = null;
		bin.parts.forEach(function (b) { b.collisionFilter.mask = 0xFFFFFFFF; });
	}
	function standUp() {
		if (!bin) return;
		M.Body.setAngle(bin, 0);
		M.Body.setAngularVelocity(bin, 0);
		M.Body.setVelocity(bin, { x: 0, y: 0 });
		var c = binCentre();
		M.Body.translate(bin, { x: 0, y: Math.min(0, G.floor - (c.y + G.bh / 2)) - 4 });
		wake();
	}

	function tilt(b) { var q = Math.PI / 2, d = ((b.angle % q) + q) % q; return d > q / 2 ? d - q : d; }
	// At rest, a body with a clear tilt tips onto its nearest flat side, as a real one does with the
	// smallest nudge; it gives up if something holds it.
	function settle() {
		M.Composite.allBodies(world).forEach(function (b) {
			if (b.isStatic || b.parent !== b || (grab && grab.body === b) || b === bin && frame < 260) return;
			var d = tilt(b);
			if (b.speed > 0.25 || Math.abs(b.angularVelocity) > 0.02 || Math.abs(d) < 0.06) { if (b.speed > 1) b.tries = 0; return; }
			b.tries = (b.tries || 0) + 1;
			if (b.tries > 240) return;
			M.Body.setAngularVelocity(b, -d * 0.08);
		});
	}
	// Just out of the bin, a file can't be flung: its speed is capped for half a second.
	function capSpeeds() {
		files.forEach(function (f) {
			var b = f.body;
			if (!b || !(b.calmUntil > frame) || b.speed < 7.5) return;
			var k = 7.5 / b.speed;
			M.Body.setVelocity(b, { x: b.velocity.x * k, y: b.velocity.y * k });
		});
	}
	function render() {
		var c = binCentre();
		place(binEl, c.x, c.y, bin.angle, SB);
		files.forEach(function (f) { if (f.body) place(f.el, f.body.position.x, f.body.position.y, f.body.angle, S); });
		var src = bin.inside.length ? BIN.full : BIN.empty;
		if (binEl.getAttribute("src") !== src) binEl.setAttribute("src", src);
	}
	function tick() {
		frame++;
		if (grab) grab.c.pointA = { x: grab.x, y: grab.y };
		settle();
		var was = bin.speed;
		M.Engine.update(engine, 1000 / 60);
		if (!hinge && was > 3 && was - bin.speed > 2.2) { bin.jolt = frame; hop(); }
		capSpeeds();
		if (hinge && (Math.abs(bin.angle) > 0.3 || grab)) letGo();
		pour();
		spill();
		catchIn();
		render();
		var still = true;
		M.Composite.allBodies(world).forEach(function (b) {
			if (b.isStatic || b.parent !== b) return;
			if (b.speed > 0.06 || Math.abs(b.angularVelocity) > 0.002 || (Math.abs(tilt(b)) > 0.06 && (b.tries || 0) <= 240)) still = false;
		});
		calm = still && !grab && !(bin.inside.length && opening() >= POUR && (bin.blocked || 0) < 240) ? calm + 1 : 0;
		if (calm > 90 && frame > 300) { raf = 0; return; }
		raf = requestAnimationFrame(tick);
	}
	function wake() { calm = 0; if (!raf && engine) raf = requestAnimationFrame(tick); }

	// Held at exactly the point grabbed: a soft constraint there, the body's own inertia, so it
	// hangs and swings from the pointer. Mouse and touch alike.
	function wire(el, get) {
		el.addEventListener("pointerdown", function (e) {
			var b = get();
			if (!b || REDUCED || e.button > 0) return;
			e.preventDefault();
			var r = stage.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
			var c = M.Constraint.create({ pointA: { x: x, y: y }, bodyB: b, pointB: { x: x - b.position.x, y: y - b.position.y }, length: 0, stiffness: 0.06, damping: 0.08 });
			M.Composite.add(world, c);
			grab = { body: b, c: c, x: x, y: y };
			el.classList.add("lf-held");
			try { el.setPointerCapture(e.pointerId); } catch (err) {}
			var move = function (ev) { var r2 = stage.getBoundingClientRect(); grab.x = ev.clientX - r2.left; grab.y = ev.clientY - r2.top; wake(); };
			var up = function () {
				el.removeEventListener("pointermove", move);
				el.removeEventListener("pointerup", up);
				el.removeEventListener("pointercancel", up);
				el.classList.remove("lf-held");
				if (grab) M.Composite.remove(world, grab.c);
				grab = null;
				wake();
			};
			el.addEventListener("pointermove", move);
			el.addEventListener("pointerup", up);
			el.addEventListener("pointercancel", up);
			wake();
		});
	}

	function start() {
		if (started || REDUCED) return;
		started = true;
		loadMatter(function () {
			if (engine) return;
			setup();
			render();
			wake();
		});
	}

	// The stage's size rules everything: on any change, the drawing and the colliders are rebuilt
	// together, and every body follows. Its height above the floor scales with the letters and its
	// x with the width; it's scaled to the new sizes, kept inside the walls, lifted clear of the
	// letters and of what's already placed, and left to gravity.
	function relayout(force) {
		var oldW = W, oldH = H, old = G, oldS = S, oldSB = SB;
		geometry();
		if (!force && oldW && W === oldW && H === oldH) return;
		drawWord();
		if (REDUCED) { lieStill(); return; }
		if (!engine) { poseStart(); return; }
		buildStatics();
		if (!old || (W === oldW && H === oldH && G.F === old.F)) { wake(); return; }
		if (grab) { M.Composite.remove(world, grab.c); grab = null; }
		letGo();
		var sx = W / oldW, sf = G.F / old.F, placed = statics.slice();
		var bodies = M.Composite.allBodies(world).filter(function (b) { return !b.isStatic && b.parent === b; });
		bodies.sort(function (p, q) { return q.position.y - p.position.y; });
		bodies.forEach(function (b) {
			var k = b === bin ? SB / oldSB : S / oldS;
			if (k !== 1) {
				M.Body.scale(b, k, k);
				if (b === bin) { bin.imageOffset.x *= k; bin.imageOffset.y *= k; }
			}
			var hx = (b.bounds.max.x - b.bounds.min.x) / 2, hy = (b.bounds.max.y - b.bounds.min.y) / 2;
			var x = Math.max(hx + 1, Math.min(W - hx - 1, b.position.x * sx));
			var y = Math.min(G.floor - hy - 1, G.floor - (old.floor - b.position.y) * sf);
			M.Body.setPosition(b, { x: x, y: y });
			for (var i = 0; i < 200 && M.Query.collides(b, placed).length; i++) M.Body.setPosition(b, { x: x, y: b.position.y - 3 });
			M.Body.setVelocity(b, { x: 0, y: 0 });
			M.Body.setAngularVelocity(b, 0);
			b.tries = 0;
			placed.push(b);
		});
		render();
		wake();
	}
	var resizeTimer = 0;
	function onResize() { clearTimeout(resizeTimer); resizeTimer = setTimeout(function () { relayout(); }, 120); }

	makeEls();
	relayout(true);
	if (REDUCED) stage.classList.add("lf-still");
	if (window.ResizeObserver) new ResizeObserver(onResize).observe(stage);
	else window.addEventListener("resize", onResize);
	// The ink follows the page's appearance.
	if (window.MutationObserver) new MutationObserver(function () { if (G) drawWord(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
	if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { relayout(true); });

	if (window.IntersectionObserver) {
		// Matter loads as the footer comes near; the bin's moment starts once it's in view.
		var near = new IntersectionObserver(function (es) {
			if (es.some(function (en) { return en.isIntersecting; })) { near.disconnect(); if (!REDUCED) loadMatter(function () {}); }
		}, { rootMargin: "800px 0px" });
		near.observe(stage);
		new IntersectionObserver(function (es, io) {
			if (es.some(function (en) { return en.isIntersecting; })) { io.disconnect(); start(); }
		}, { threshold: 0.45 }).observe(stage);
	} else start();
})();
