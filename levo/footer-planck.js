/*
 * The footer: the year, and a small scene run by Planck.js (1.5.1, a Box2D port, from cdnjs, pinned,
 * with its integrity hash, loaded only when the footer comes near). Box2D's solver keeps stacks
 * still and puts resting bodies to sleep; continuous collision keeps fast files out of the letters;
 * the letters are their real top outlines as chains, so the e's dome and the v's notch are exact.
 *
 * "Levo" is the page's rounded heavy face (ui-rounded, "SF Pro Rounded", then the system font),
 * huge, its lower part below the page's bottom edge, fading out towards it. One source: each glyph
 * is drawn on one canvas, and its collider is that same glyph's outline, read from the same canvas
 * drawing: the top edge of every column of its pixels above the floor, as one chain (round tops, a
 * round e and o, the v's notch). The colliders keep the full shape; only the ink fades.
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
	var ENGINE = { src: "https://cdnjs.cloudflare.com/ajax/libs/planck-js/1.5.1/planck.min.js", sri: "sha512-nGiOcn+EAqGFIevDTKodpJBUWCj2HX7cV8hsaQ/ti7DCZUOl9Ikpzdz61Xswm0N6wD9p/8pS4iKDVvwBc6lrYQ==" };
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
		var out = parts.map(function (q) {
			q = q.concat([{ x: q[0].x, y: floor + 80 }, { x: q[q.length - 1].x, y: floor + 80 }]);
			return hull(q);
		});
		out.profile = simplify(pts, 1.2);
		return out;
	}
	// Fewer points on the same outline (Ramer-Douglas-Peucker, within tol pixels).
	function simplify(p, tol) {
		if (p.length < 3) return p.slice();
		var a = p[0], b = p[p.length - 1], dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, far = 0, at = 0;
		for (var i = 1; i < p.length - 1; i++) {
			var d = Math.abs(dy * p[i].x - dx * p[i].y + b.x * a.y - b.y * a.x) / len;
			if (d > far) { far = d; at = i; }
		}
		if (far <= tol) return [a, b];
		return simplify(p.slice(0, at + 1), tol).slice(0, -1).concat(simplify(p.slice(at), tol));
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
			var g = { ch: ch, x: x, hulls: parts || [], hull: parts ? [].concat.apply([], parts) : null, profile: parts ? parts.profile : null };
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

	// ---------------------------------------------------------------- With Planck.js (Box2D)

	// Box2D likes metres: 40 px to the metre; y runs down the page, as on screen.
	var P = 40, GRAV = 30;
	var pl, world, ground = null, bin = null, raf = 0, calm = 0, grab = null, started = false, frame = 0, hinge = null;
	var FILE = { density: 1, friction: 0.14, restitution: 0.04 }, BINF = { density: 2.4, friction: 0.3, restitution: 0.03 };
	var L_CAT = 0x0002;

	function v2(x, y) { return pl.Vec2(x / P, y / P); }
	function px(v) { return { x: v.x * P, y: v.y * P }; }
	function pos(b) { return px(b.getPosition()); }
	function vel(b) { var v = b.getLinearVelocity(); return { x: v.x * P / 60, y: v.y * P / 60 }; }
	function setVel(b, v) { b.setLinearVelocity(pl.Vec2(v.x * 60 / P, v.y * 60 / P)); }
	function speed(b) { var v = vel(b); return Math.hypot(v.x, v.y); }
	function spin(b) { return b.getAngularVelocity() / 60; }
	function setSpin(b, w) { b.setAngularVelocity(w * 60); }

	function loadEngine(done) {
		if (window.planck) { done(); return; }
		var s = document.querySelector("script[data-physics]");
		if (!s) {
			s = document.createElement("script");
			s.src = ENGINE.src; s.integrity = ENGINE.sri; s.crossOrigin = "anonymous"; s.referrerPolicy = "no-referrer";
			s.setAttribute("data-physics", "");
			document.head.appendChild(s);
		}
		s.addEventListener("load", done);
		s.addEventListener("error", function () { lieStill(); stage.classList.add("lf-still"); });
	}

	// The floor, the walls and a ceiling, and every letter as a chain along its real top outline.
	function buildStatics() {
		if (ground) world.destroyBody(ground);
		ground = world.createBody();
		var thick = 400, box = function (x, y, w, h) { ground.createFixture({ shape: pl.Box(w / 2 / P, h / 2 / P, v2(x, y), 0), friction: 0.5, restitution: 0.04 }); };
		box(W / 2, G.floor + thick / 2, W * 3, thick);
		box(-thick / 2, H / 2, thick, H * 4);
		box(W + thick / 2, H / 2, thick, H * 4);
		box(W / 2, -thick / 2 - H * 0.6, W * 3, thick);
		G.glyphs.forEach(function (g) {
			if (!g.profile || g.profile.length < 2) return;
			var pts = [{ x: g.profile[0].x, y: G.floor + 80 }].concat(g.profile, [{ x: g.profile[g.profile.length - 1].x, y: G.floor + 80 }]);
			ground.createFixture({ shape: pl.Chain(pts.map(function (p) { return v2(p.x, p.y); }), false), friction: 0.2, restitution: 0.04,
				filterCategoryBits: g.ch === "L" ? L_CAT : 0x0001 });
		});
	}
	function makeFile(w, h, x, y, angle) {
		var b = world.createBody({ type: "dynamic", position: v2(x, y), angle: angle || 0, linearDamping: 0.4, angularDamping: 0.6 });
		b.createFixture({ shape: pl.Box(w / 2 / P, h / 2 / P), density: FILE.density, friction: FILE.friction, restitution: FILE.restitution });
		b.isFile = true;
		return b;
	}
	// The bin: hollow, a floor and two walls, open at the top, as one body whose origin is the
	// image's centre.
	function binFixtures(b) {
		var w = G.bw, h = G.bh, k = G.wall, f;
		while ((f = b.getFixtureList())) b.destroyFixture(f);
		[[0, h / 2 - k / 2, w, k], [-w / 2 + k / 2, 0, k, h], [w / 2 - k / 2, 0, k, h]].forEach(function (r) {
			b.createFixture({ shape: pl.Box(r[2] / 2 / P, r[3] / 2 / P, v2(r[0], r[1]), 0), density: BINF.density, friction: BINF.friction, restitution: BINF.restitution });
		});
	}
	function makeBin(x, y) {
		var b = world.createBody({ type: "dynamic", position: v2(x, y), linearDamping: 0.2, angularDamping: 0.2 });
		binFixtures(b);
		b.inside = [];
		return b;
	}
	function local(b, v) { var a = b.getAngle(), c = Math.cos(a), s = Math.sin(a); return { x: v.x * c - v.y * s, y: v.x * s + v.y * c }; }
	function binCentre() { return pos(bin); }
	function opening() { var a = bin.getAngle(); return Math.abs(Math.atan2(Math.sin(a), Math.cos(a))); }
	// Whether a box at (x, y, angle) would overlap any fixture (letters, walls, the bin, files).
	function overlaps(w, h, x, y, angle, skip) {
		var shape = pl.Box(w / 2 / P, h / 2 / P), xf = pl.Transform(v2(x, y), angle), aabb = new pl.AABB(), hit = false;
		shape.computeAABB(aabb, xf, 0);
		world.queryAABB(aabb, function (fx) {
			if (skip && fx.getBody() === skip) return true;
			var s = fx.getShape(), n = s.getChildCount();
			for (var i = 0; i < n; i++) if (pl.testOverlap(shape, 0, s, i, xf, fx.getBody().getTransform())) { hit = true; return false; }
			return true;
		});
		return hit;
	}

	// Past this tilt of the opening (45 degrees) the files start to slide out, one every ~80 ms.
	var POUR = Math.PI / 4, EVERY = 5;
	// A bin on its side still empties, as contents tumble out: what's in its opening or just past
	// the rim drifts on outward, gently, so the next one can follow.
	function spill() {
		if (opening() < POUR) return;
		var c = binCentre(), out = local(bin, { x: 0, y: -1 }), a = bin.getAngle();
		files.forEach(function (f) {
			var b = f.body;
			if (!b || (grab && grab.body === b)) return;
			var p = pos(b), d = { x: p.x - c.x, y: p.y - c.y };
			var lx = d.x * Math.cos(a) + d.y * Math.sin(a), ly = -d.x * Math.sin(a) + d.y * Math.cos(a);
			if (Math.abs(lx) > G.bw / 2 || ly > -G.bh * 0.1 || ly < -G.bh / 2 - S * 1.7) return;
			var v = vel(b), along = v.x * out.x + v.y * out.y;
			b.spilled = (b.spilled || 0) + 1;
			if (along < 3.4 && b.spilled < 180) { b.setAwake(true); setVel(b, { x: v.x + out.x * 0.35, y: v.y + out.y * 0.35 - 0.3 }); }
		});
	}
	// The jolt: what sits in the opening or just past it, as the bin stops, carries on out with a
	// little hop, clearing the way for the rest.
	function hop() {
		var c = binCentre(), mouth = local(bin, { x: 0, y: -G.bh / 2 }), out = local(bin, { x: 0, y: -1 });
		var m = { x: c.x + mouth.x, y: c.y + mouth.y };
		files.forEach(function (f) {
			var b = f.body;
			if (!b || (grab && grab.body === b)) return;
			var p = pos(b);
			if (Math.hypot(p.x - m.x, p.y - m.y) > G.bh * 0.8) return;
			var v = vel(b);
			setVel(b, { x: v.x + out.x * 3, y: v.y + out.y * 3 - 2.4 });
			setSpin(b, spin(b) + (Math.random() - 0.5) * 0.2);
			b.calmUntil = frame + 30;
		});
	}
	// Out at the rim: each file appears inside the bin, just inside the opening (or deeper when the
	// one before it is still leaving), where it overlaps nothing, with the bin's own velocity there,
	// a small nudge out of the opening and a little spin. When it lands, the jolt throws the rest
	// out quicker and harder, each still on its own.
	function pour() {
		var o = opening(), burst = bin.jolt && frame - bin.jolt < 70;
		if (!bin.inside.length || o < POUR || frame - (bin.poured || 0) < (burst ? 3 : EVERY)) return;
		var f = bin.inside[0], c = binCentre(), fh = S * f.h, fw = S * f.w, p = null, a = bin.getAngle();
		var room = Math.max(0, (G.bw - 2 * G.wall - fw) / 2), deep = Math.max(0, G.bh - 2 * G.wall - fh);
		for (var t = 0, n = burst ? 12 : 6; t < n && !p; t++) {
			var rim = local(bin, { x: (Math.random() * 2 - 1) * room, y: -G.bh / 2 + fh / 2 + 1 + deep * Math.min(1, t / (n - 1)) });
			var q = { x: c.x + rim.x, y: c.y + rim.y };
			if (!overlaps(fw * 1.02, fh * 1.02, q.x, q.y, a)) p = q;
		}
		if (!p) { bin.blocked = (bin.blocked || 0) + 1; return; }
		bin.blocked = 0;
		bin.poured = frame;
		bin.inside.shift();
		var w0 = bin.getAngularVelocity(), bv = bin.getLinearVelocityFromWorldPoint(v2(p.x, p.y));
		f.body = makeFile(fw, fh, p.x, p.y, a + (Math.random() - 0.5) * 0.2);
		var fan = (Math.random() - 0.5) * (burst ? 0.8 : 0.5), out = local(bin, { x: Math.sin(fan), y: -Math.cos(fan) });
		var push = burst ? 3.4 + Math.random() * 2.2 : 1.2 + Math.random() * 1.6, b = { x: bv.x * P / 60, y: bv.y * P / 60 };
		setVel(f.body, { x: b.x + out.x * push, y: b.y + out.y * push - (burst ? 1.6 : 0) });
		f.body.setAngularVelocity(w0 * 0.6 + (Math.random() - 0.5) * (burst ? 14 : 7));
		f.body.calmUntil = frame + 30;
		f.el.classList.remove("is-in");
	}
	// In at the opening of the upright bin: a file that comes to its rim from above goes in.
	function catchIn() {
		if (opening() > 0.35) return;
		var c = binCentre(), mouth = { x: c.x, y: c.y - G.bh / 2 };
		files.forEach(function (f) {
			var b = f.body;
			if (!b || (grab && grab.body === b)) return;
			var p = pos(b);
			if (Math.abs(p.x - mouth.x) < G.bw * 0.34 && p.y < mouth.y + 6 && p.y > mouth.y - S && vel(b).y > -1) {
				world.destroyBody(b);
				f.body = null;
				f.el.classList.add("is-in");
				bin.inside.push(f);
			}
		});
	}
	function setup() {
		pl = window.planck;
		world = new pl.World({ gravity: pl.Vec2(0, GRAV) });
		buildStatics();
		bin = makeBin(G.binX, G.binY);
		bin.inside = files.slice();
		lean();
		wire(binEl, function () { return bin; });
		files.forEach(function (f) { wire(f.el, function () { return f.body; }); });
		binEl.addEventListener("dblclick", standUp);
	}
	// The lean: the bin turns on a hinge at its base, a hair left of its centre of mass, so it starts
	// slowly and speeds up, as a bin balanced just past an edge does; past about 17 degrees it's let
	// go and falls by itself. While it leans it passes over the L's round top (it stands on the hinge).
	function lean() {
		var cm = px(bin.getWorldCenter()), foot = { x: cm.x - 0.15, y: G.binY + G.bh / 2 };
		hinge = world.createJoint(pl.RevoluteJoint({}, ground, bin, v2(foot.x, foot.y)));
		for (var f = bin.getFixtureList(); f; f = f.getNext()) f.setFilterMaskBits(0xFFFF & ~L_CAT);
	}
	function letGo() {
		if (!hinge) return;
		world.destroyJoint(hinge);
		hinge = null;
		for (var f = bin.getFixtureList(); f; f = f.getNext()) f.setFilterMaskBits(0xFFFF);
	}
	function standUp() {
		if (!bin) return;
		letGo();
		var c = binCentre();
		bin.setTransform(v2(c.x, Math.min(c.y, G.floor - G.bh / 2) - 4), 0);
		bin.setLinearVelocity(pl.Vec2(0, 0));
		bin.setAngularVelocity(0);
		bin.setAwake(true);
		wake();
	}
	// Just out of the bin, a file can't be flung: its speed is capped for half a second.
	function capSpeeds() {
		files.forEach(function (f) {
			var b = f.body;
			if (!b || !(b.calmUntil > frame)) return;
			var v = vel(b), s = Math.hypot(v.x, v.y);
			if (s > 7.5) setVel(b, { x: v.x * 7.5 / s, y: v.y * 7.5 / s });
		});
	}
	function render() {
		var c = binCentre();
		place(binEl, c.x, c.y, bin.getAngle(), SB);
		files.forEach(function (f) { if (f.body) { var p = pos(f.body); place(f.el, p.x, p.y, f.body.getAngle(), S); } });
		var src = bin.inside.length ? BIN.full : BIN.empty;
		if (binEl.getAttribute("src") !== src) binEl.setAttribute("src", src);
	}
	function tick() {
		frame++;
		if (grab) grab.j.setTarget(v2(grab.x, grab.y));
		var was = speed(bin);
		world.step(1 / 60, 10, 4);
		if (!hinge && was > 3 && was - speed(bin) > 2.2) { bin.jolt = frame; hop(); }
		capSpeeds();
		if (hinge && (Math.abs(bin.getAngle()) > 0.3 || grab)) letGo();
		pour();
		spill();
		catchIn();
		render();
		// Box2D puts bodies that have come to rest to sleep; once they all sleep, so does the loop.
		var awake = false;
		for (var b = world.getBodyList(); b; b = b.getNext()) if (b.isDynamic() && b.isAwake()) { awake = true; break; }
		calm = !awake && !grab && !hinge && !(bin.inside.length && opening() >= POUR && (bin.blocked || 0) < 240) ? calm + 1 : 0;
		if (calm > 20) { raf = 0; return; }
		raf = requestAnimationFrame(tick);
	}
	function wake() { calm = 0; if (!raf && world) raf = requestAnimationFrame(tick); }

	// Held at exactly the point grabbed: Box2D's mouse joint there, soft, with a little damping, and
	// the body's own inertia, so it hangs and swings from the pointer. Mouse and touch alike.
	function wire(el, get) {
		el.addEventListener("pointerdown", function (e) {
			var b = get();
			if (!b || REDUCED || e.button > 0) return;
			e.preventDefault();
			var r = stage.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
			b.setAwake(true);
			var j = world.createJoint(pl.MouseJoint({ maxForce: 260 * b.getMass() * GRAV / 30, frequencyHz: 3.5, dampingRatio: 0.35 }, ground, b, v2(x, y)));
			grab = { body: b, j: j, x: x, y: y };
			el.classList.add("lf-held");
			try { el.setPointerCapture(e.pointerId); } catch (err) {}
			var move = function (ev) { var r2 = stage.getBoundingClientRect(); grab.x = ev.clientX - r2.left; grab.y = ev.clientY - r2.top; wake(); };
			var up = function () {
				el.removeEventListener("pointermove", move);
				el.removeEventListener("pointerup", up);
				el.removeEventListener("pointercancel", up);
				el.classList.remove("lf-held");
				if (grab) world.destroyJoint(grab.j);
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
		loadEngine(function () {
			if (world) return;
			setup();
			render();
			wake();
		});
	}

	// The stage's size rules everything: on any change, the drawing and the colliders are rebuilt
	// together, and every body follows. Its height above the floor scales with the letters and its
	// x with the width; it's rebuilt at the new sizes, kept inside the walls, lifted clear of the
	// letters and of what's already placed, and left to gravity.
	function relayout(force) {
		var oldW = W, oldH = H, old = G;
		geometry();
		if (!force && oldW && W === oldW && H === oldH) return;
		drawWord();
		if (REDUCED) { lieStill(); return; }
		if (!world) { poseStart(); return; }
		if (grab) { world.destroyJoint(grab.j); grab = null; }
		letGo();
		buildStatics();
		if (!old || (W === oldW && H === oldH && G.F === old.F)) { wake(); return; }
		var sx = W / oldW, sf = G.F / old.F, bodies = [];
		for (var b = world.getBodyList(); b; b = b.getNext()) if (b.isDynamic()) bodies.push(b);
		bodies.sort(function (p, q) { return pos(q).y - pos(p).y; });
		bodies.forEach(function (b) {
			var f = b === bin ? null : files.filter(function (x) { return x.body === b; })[0];
			var w = f ? S * f.w : G.bw, h = f ? S * f.h : G.bh;
			if (f) { b.destroyFixture(b.getFixtureList()); b.createFixture({ shape: pl.Box(w / 2 / P, h / 2 / P), density: FILE.density, friction: FILE.friction, restitution: FILE.restitution }); }
			else binFixtures(b);
			var p = pos(b), half = Math.max(w, h) / 2;
			var x = Math.max(half + 1, Math.min(W - half - 1, p.x * sx)), y = Math.min(G.floor - half - 1, G.floor - (old.floor - p.y) * sf);
			for (var i = 0; i < 200 && overlaps(w, h, x, y, b.getAngle(), b); i++) y -= 3;
			b.setTransform(v2(x, y), b.getAngle());
			b.setLinearVelocity(pl.Vec2(0, 0));
			b.setAngularVelocity(0);
			b.setAwake(true);
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
		// The engine loads as the footer comes near; the bin's moment starts once it's in view.
		var near = new IntersectionObserver(function (es) {
			if (es.some(function (en) { return en.isIntersecting; })) { near.disconnect(); if (!REDUCED) loadEngine(function () {}); }
		}, { rootMargin: "800px 0px" });
		near.observe(stage);
		new IntersectionObserver(function (es, io) {
			if (es.some(function (en) { return en.isIntersecting; })) { io.disconnect(); start(); }
		}, { threshold: 0.45 }).observe(stage);
	} else start();
})();
