/*
 * The footer physics test (levo/test/, private): the live footer's scene, on any engine. One scene,
 * one geometry and story (the rounded "Levo", the bin leaning off the L, the pour from inside the
 * opening, the landing, dragging, resize, light and dark); the engine is an adapter with the same
 * small interface (test/engines/*.js), and the variant (test/variants.js) sets what decides the
 * feel: gravity and steps, friction and bounce, the bin's weight, damping, sleep, the drag and the
 * pour. Distances are pixels, velocities pixels per frame at 60 Hz, angles radians.
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
	var E = window.LF_ENGINE, V = window.LF_VARIANT;
	if (!E || !V) return;
	// macOS's Trash, empty or full, in the page's appearance (img/dock/trash-*-dark.png are its dark
	// renders); a theme change swaps the image in place. The documents and folder look the same in
	// both appearances in macOS, so they have one image each.
	var binFull = true;
	function binSrc(full) {
		binFull = full;
		return "img/dock/trash-" + (full ? "full" : "empty") + (document.documentElement.classList.contains("dark") ? "-dark" : "") + ".png";
	}
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
	// Depth (V.depth): how thick the ledge on top of the letters looks, in pixels.
	function ledge() { return V.depth && G ? Math.max(4, Math.min(20, Math.round(G.F * 0.035))) : 0; }
	// How far up the colliders sit, so things stand on the middle of that ledge, not in front of it.
	function lift() { return Math.round(ledge() * 0.55); }
	function drawWord() {
		var dpr = Math.min(2, window.devicePixelRatio || 1);
		word.width = Math.round(W * dpr); word.height = Math.round(H * dpr);
		word.style.width = W + "px"; word.style.height = H + "px";
		var c = word.getContext("2d"), css = getComputedStyle(word), ink = css.color.match(/[\d.]+/g) || [0, 0, 0, 0.1];
		var rgb = ink.slice(0, 3).join(","), a = ink.length > 3 ? +ink[3] : 1, d = ledge();
		c.setTransform(dpr, 0, 0, dpr, 0, 0);
		c.clearRect(0, 0, W, H);
		var top = Math.min.apply(null, G.glyphs.map(function (g) { return g.hull ? Math.min.apply(null, g.hull.map(function (p) { return p.y; })) : H; })) - d;
		if (!d) {
			var fade = c.createLinearGradient(0, top, 0, H);
			fade.addColorStop(0, "rgba(" + rgb + "," + a + ")");
			fade.addColorStop(1, "rgba(" + rgb + ",0)");
			c.fillStyle = fade;
			c.font = font(G.F);
			G.glyphs.forEach(function (g) { c.fillText(g.ch, g.x, G.base); });
			return;
		}
		// The block: the ledge (copies stepping back and up), a one-pixel lit front edge, then the
		// front face over them; drawn solid off screen, then faded towards the page's bottom.
		var off = document.createElement("canvas");
		off.width = word.width; off.height = word.height;
		var o = off.getContext("2d");
		o.setTransform(dpr, 0, 0, dpr, 0, 0);
		o.font = font(G.F);
		o.fillStyle = css.getPropertyValue("--lf-ledge").trim();
		for (var k = d; k >= 1; k--) G.glyphs.forEach(function (g) { o.fillText(g.ch, g.x, G.base - k); });
		o.fillStyle = css.getPropertyValue("--lf-edge").trim();
		G.glyphs.forEach(function (g) { o.fillText(g.ch, g.x, G.base - 1); });
		var face = o.createLinearGradient(0, top + d, 0, H);
		face.addColorStop(0, css.getPropertyValue("--lf-front").trim());
		face.addColorStop(1, css.getPropertyValue("--lf-front-low").trim());
		o.fillStyle = face;
		G.glyphs.forEach(function (g) { o.fillText(g.ch, g.x, G.base); });
		o.setTransform(1, 0, 0, 1, 0, 0);
		o.globalCompositeOperation = "destination-in";
		var fadeOut = o.createLinearGradient(0, top * dpr, 0, H * dpr);
		fadeOut.addColorStop(0, "rgba(0,0,0,1)");
		fadeOut.addColorStop(0.35, "rgba(0,0,0,0.85)");
		fadeOut.addColorStop(1, "rgba(0,0,0,0)");
		o.fillStyle = fadeOut;
		o.fillRect(0, 0, off.width, off.height);
		c.setTransform(1, 0, 0, 1, 0, 0);
		c.drawImage(off, 0, 0);
	}
	// The resting surface under x: the top of the letters' colliders there, or the floor.
	function surfaceAt(x) {
		var best = G.floor, up = lift();
		G.glyphs.forEach(function (g) {
			var p = g.profile;
			if (!p || x < p[0].x || x > p[p.length - 1].x) return;
			for (var i = 0; i + 1 < p.length; i++) {
				if (x >= p[i].x && x <= p[i + 1].x) {
					var t = p[i + 1].x === p[i].x ? 0 : (x - p[i].x) / (p[i + 1].x - p[i].x), y = p[i].y + (p[i + 1].y - p[i].y) * t - up;
					if (y < best) best = y;
					break;
				}
			}
		});
		return best;
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
		binEl.src = binSrc(false);
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
		binEl.src = binSrc(true);
		place(binEl, G.binX, G.binY, 0, SB);
	}

	// ---------------------------------------------------------------- The story, on any engine

	var bin = null, raf = 0, calm = 0, grab = null, started = false, frame = 0, hinge = null, leftWall = false;
	var MAT = {
		file: { friction: V.fFile, restitution: V.rFile, density: 1, damp: V.linDamp, angDamp: V.angDamp },
		bin: { friction: V.fBin, restitution: V.rBin, density: V.binDensity, damp: V.linDamp * 0.5, angDamp: V.angDamp * 0.5 },
		letter: { friction: V.fLetter, restitution: V.rLetter },
		wall: { friction: 0.5, restitution: 0.04 }
	};
	function local(a, v) { var c = Math.cos(a), s = Math.sin(a); return { x: v.x * c - v.y * s, y: v.x * s + v.y * c }; }
	function opening() { var a = E.angle(bin); return Math.abs(Math.atan2(Math.sin(a), Math.cos(a))); }
	function bodies() { return [bin].concat(files.map(function (f) { return f.body; }).filter(Boolean)); }

	function buildStatics() {
		E.clearStatics();
		var thick = 400;
		E.addStaticBox(W / 2, G.floor + thick / 2, W * 3, thick, MAT.wall);
		if (!V.throw || leftWall) E.addStaticBox(-thick / 2, H / 2, thick, H * 4, MAT.wall);
		E.addStaticBox(W + thick / 2, H / 2, thick, H * 4, MAT.wall);
		E.addStaticBox(W / 2, -thick / 2 - H * (V.throw ? 1.6 : 0.6), W * 3, thick, MAT.wall);
		G.glyphs.forEach(function (g) {
			if (!g.profile || g.profile.length < 2) return;
			var up = lift(), raise = function (p) { return { x: p.x, y: p.y - up }; };
			var outline = [{ x: g.profile[0].x, y: G.floor + 80 }].concat(g.profile.map(raise), [{ x: g.profile[g.profile.length - 1].x, y: G.floor + 80 }]);
			E.addLetter(outline, g.hulls.map(function (h) { return h.map(function (p) { return p.y < G.floor ? raise(p) : p; }); }), MAT.letter, g.ch === "L");
		});
	}

	var POUR = (V.pourDeg || 45) * Math.PI / 180, EVERY = V.pourEvery || 5;
	// A bin on its side still empties: what's in its opening or just past the rim drifts on out.
	function spill() {
		if (opening() < POUR || !V.spill) return;
		var c = E.pos(bin), a = E.angle(bin), out = local(a, { x: 0, y: -1 });
		files.forEach(function (f) {
			var b = f.body;
			if (!b || (grab && grab.body === b)) return;
			var p = E.pos(b), d = { x: p.x - c.x, y: p.y - c.y };
			var lx = d.x * Math.cos(a) + d.y * Math.sin(a), ly = -d.x * Math.sin(a) + d.y * Math.cos(a);
			if (Math.abs(lx) > G.bw / 2 || ly > -G.bh * 0.1 || ly < -G.bh / 2 - S * 1.7) return;
			var v = E.vel(b), along = v.x * out.x + v.y * out.y;
			b.spilled = (b.spilled || 0) + 1;
			if (along < 3.4 && b.spilled < (lyingTipped() ? 420 : 180)) { E.wake(b); E.setVel(b, { x: v.x + out.x * 0.35 * V.spill, y: v.y + out.y * 0.35 * V.spill - 0.3 * V.spill }); }
		});
	}
	// The landing jolt: what sits in the opening carries on out with a little hop.
	function hop() {
		if (!V.hop) return;
		var c = E.pos(bin), a = E.angle(bin), mouth = local(a, { x: 0, y: -G.bh / 2 }), out = local(a, { x: 0, y: -1 });
		var m = { x: c.x + mouth.x, y: c.y + mouth.y };
		files.forEach(function (f) {
			var b = f.body;
			if (!b || (grab && grab.body === b)) return;
			var p = E.pos(b);
			if (Math.hypot(p.x - m.x, p.y - m.y) > G.bh * 0.8) return;
			var v = E.vel(b);
			E.setVel(b, { x: v.x + out.x * 3 * V.hop, y: v.y + out.y * 3 * V.hop - 2.4 * V.hop });
			E.setSpin(b, E.spin(b) + (Math.random() - 0.5) * 0.2);
			b.calmUntil = frame + 30;
		});
	}
	// Out through the opening: each file appears inside the bin just within the rim (deeper when the
	// last is still leaving), where it overlaps nothing, with the bin's own velocity there, a nudge
	// and a little spin. "pile" releases every file that fits at once; "stagger" one at a time.
	function release(burst, carry) {
		var f = bin.inside[0], c = E.pos(bin), a = E.angle(bin), fh = S * f.h, fw = S * f.w, p = null;
		var room = Math.max(0, (G.bw - 2 * G.wall - fw) / 2), deep = Math.max(0, G.bh - 2 * G.wall - fh);
		for (var t = 0, n = burst ? 12 : 6; t < n && !p; t++) {
			var rim = local(a, { x: (Math.random() * 2 - 1) * room, y: -G.bh / 2 + fh / 2 + 1 + deep * Math.min(1, t / (n - 1)) });
			var q = { x: c.x + rim.x, y: c.y + rim.y };
			if (!E.overlapsBox(fw * 1.02, fh * 1.02, q.x, q.y, a)) p = q;
		}
		if (!p) return false;
		bin.inside.shift();
		var bv = E.pointVel(bin, p);
		f.body = E.addBox(fw, fh, p.x, p.y, a + (Math.random() - 0.5) * 0.2, MAT.file);
		var fan = (Math.random() - 0.5) * (burst ? 0.8 : 0.5), out = local(a, { x: Math.sin(fan), y: -Math.cos(fan) });
		var push = (burst ? 3.4 + Math.random() * 2.2 : 1.2 + Math.random() * 1.6) * V.push;
		var k = carry ? (V.fling || 0.6) : 0, cx = carry ? carry.x * k : 0, cy = carry ? carry.y * k : 0;
		E.setVel(f.body, { x: bv.x + out.x * push + cx, y: bv.y + out.y * push - (burst ? 1.6 : 0) + cy });
		E.setSpin(f.body, E.spin(bin) * 0.6 + (Math.random() - 0.5) * (burst ? 0.24 : 0.12));
		f.body.calmUntil = frame + 30;
		f.el.classList.remove("is-in");
		return true;
	}
	// keepPour: once it has landed and lies tipped past that angle, it keeps releasing the rest at the
	// rim (landEvery frames apart) instead of giving up when the opening is crowded.
	function lyingTipped() { return V.keepPour && bin.jolt && opening() >= V.keepPour * Math.PI / 180; }
	function pour() {
		if (V.throw && !bin.jolt) return;
		// The fling: just after a thrown bin first hits, its files carry on with the speed it had, out
		// through the opening whatever its angle, a couple of frames apart.
		var fling = V.throw && bin.fling && frame < bin.fling.until;
		if (fling && bin.inside.length && frame - (bin.poured || 0) >= (V.flingEvery || 2)) {
			if (release(true, bin.fling.v)) { bin.poured = frame; bin.blocked = 0; }
			return;
		}
		var burst = bin.jolt && frame - bin.jolt < 70, every = lyingTipped() && !burst ? (V.landEvery || EVERY) : EVERY;
		if (!bin.inside.length || opening() < POUR || frame - (bin.poured || 0) < (burst ? 3 : every)) return;
		var n = 0;
		do { if (release(burst)) n++; else break; } while (V.pour === "pile" && bin.inside.length);
		if (!n) { bin.blocked = (bin.blocked || 0) + 1; return; }
		bin.blocked = 0;
		bin.poured = frame;
	}
	// Into the bin: the file slides down through the opening, clipped at the rim line as it goes (as
	// if behind the bin's front rim), then it's gone and the bin turns full. Each drop sinks on its
	// own; with less motion, a quick fade.
	function sink(f, from, mouth, a) {
		var el = f.el, s = S, rim = mouth.y, to = { x: mouth.x, y: rim + s * 0.8 };
		var tf = function (p, ang) { return "translate(" + (p.x - s / 2).toFixed(1) + "px," + (p.y - s / 2).toFixed(1) + "px) rotate(" + ang.toFixed(3) + "rad)"; };
		var clip = function (y) { return "inset(0 0 " + Math.max(0, y + s / 2 - rim).toFixed(1) + "px 0)"; };
		var done = function () { el.style.clipPath = ""; el.classList.add("is-in"); bin.inside.push(f); render(); wake(); };
		if (REDUCED || !el.animate) { el.classList.add("is-in"); setTimeout(function () { bin.inside.push(f); render(); }, 150); return; }
		var anim = el.animate([{ transform: tf(from, from.a), clipPath: clip(from.y) }, { transform: tf(to, a), clipPath: clip(to.y) }],
			{ duration: 420, easing: "cubic-bezier(.45, 0, .85, .45)" });
		el.style.transform = tf(to, a); el.style.clipPath = clip(to.y);
		anim.onfinish = done;
	}
	// In at the opening of the upright bin: a file that comes to its rim from above goes in.
	function catchIn() {
		if (opening() > 0.35) return;
		var c = E.pos(bin), mouth = { x: c.x, y: c.y - G.bh / 2 };
		files.forEach(function (f) {
			var b = f.body;
			if (!b || (grab && grab.body === b)) return;
			var p = E.pos(b);
			if (Math.abs(p.x - mouth.x) < G.bw * 0.34 && p.y < mouth.y + 6 && p.y > mouth.y - S && E.vel(b).y > -1) {
				var from = { x: p.x, y: p.y, a: E.angle(b) };
				E.remove(b);
				f.body = null;
				sink(f, from, mouth, E.angle(bin));
			}
		});
	}
	// The lean: the bin turns on a hinge at its base, a hair left of its centre of mass, so it starts
	// slowly and speeds up; past about 17 degrees it's let go and falls by itself.
	function lean() {
		var cm = E.centreOfMass(bin);
		hinge = E.hinge(bin, { x: cm.x - 0.15, y: G.binY + G.bh / 2 });
		E.passOverL(bin, true);
		// And a tiny rightward drift, so no engine's solver can hold it balanced at the top.
		E.setSpin(bin, 0.0005);
	}
	// The throw (V.throw): from off the left edge (run px further out at 1440 wide, so it arrives with
	// speed), h bin-heights above the L's top, on an arc
	// that comes down on the L in T frames; aim moves the point it's aimed at towards the L's right
	// shoulder, so the hit sends it on over "evo". A little tilt and spin.
	function throwIn() {
		var th = V.throw, x0 = -G.bw * 0.7 - (th.run || 0) * G.F / 576, y0 = G.stemTop - G.bh * th.h, tx = G.stemX + G.stemW * (th.aim || 0), ty = G.stemTop - G.bh / 2 - lift() - 2;
		var g = V.gravity / 3600, T = th.T;
		E.setPose(bin, x0, y0, th.tilt || -0.15);
		E.setVel(bin, { x: (tx - x0) / T, y: (ty - y0 - 0.5 * g * T * T) / T });
		E.setSpin(bin, th.spin || 0);
		E.wake(bin);
	}
	function letGo() {
		if (!hinge) return;
		E.removeJoint(hinge);
		hinge = null;
		E.passOverL(bin, false);
	}
	function standUp() {
		if (!bin) return;
		letGo();
		var c = E.pos(bin);
		E.setPose(bin, c.x, Math.min(c.y, G.floor - G.bh / 2) - 4, 0);
		E.setVel(bin, { x: 0, y: 0 }); E.setSpin(bin, 0); E.wake(bin);
		wake();
	}
	// Some engines leave things balanced on an edge; this tips them onto their nearest flat side.
	function tilt(a) { var q = Math.PI / 2, d = ((a % q) + q) % q; return d > q / 2 ? d - q : d; }
	function settle() {
		if (!V.settle) return;
		bodies().forEach(function (b) {
			if ((grab && grab.body === b) || (b === bin && frame < 260)) return;
			var d = tilt(E.angle(b));
			if (E.speed(b) > 0.25 || Math.abs(E.spin(b)) > 0.02 || Math.abs(d) < 0.06) { if (E.speed(b) > 1) b.tries = 0; return; }
			b.tries = (b.tries || 0) + 1;
			if (b.tries > 240) return;
			E.setSpin(b, -d * 0.08);
		});
	}
	function capSpeeds() {
		files.forEach(function (f) {
			var b = f.body;
			if (!b || !(b.calmUntil > frame)) return;
			var v = E.vel(b), s = Math.hypot(v.x, v.y), cap = V.cap || 7.5;
			if (s > cap) E.setVel(b, { x: v.x * cap / s, y: v.y * cap / s });
		});
	}
	var shadows = null;
	function shadowFor(el, b, w, h) {
		if (!b) { el.style.opacity = "0"; return; }
		var p = E.pos(b), a = E.angle(b), bottom = p.y + Math.abs(w / 2 * Math.sin(a)) + Math.abs(h / 2 * Math.cos(a));
		var ground = surfaceAt(p.x), gap = Math.max(0, ground - bottom), near = Math.max(0, 1 - gap / (S * 1.4));
		var sw = w * (0.8 + gap / S * 0.5), sh = Math.max(4, w * 0.16 * (1 + gap / S * 0.4));
		el.style.width = sw.toFixed(1) + "px"; el.style.height = sh.toFixed(1) + "px";
		el.style.transform = "translate(" + (p.x - sw / 2).toFixed(1) + "px," + (ground - sh * 0.55).toFixed(1) + "px)";
		el.style.opacity = (near * near).toFixed(2);
	}
	function renderShadows() {
		if (!V.depth) return;
		if (!shadows) {
			shadows = [bin].concat(files).map(function () { var d = document.createElement("div"); d.className = "lf-shadow"; stage.insertBefore(d, word.nextSibling); return d; });
		}
		shadowFor(shadows[0], bin, G.bw, G.bh);
		files.forEach(function (f, i) { shadowFor(shadows[i + 1], f.body, S * f.w, S * f.h); });
	}
	function render() {
		renderShadows();
		var c = E.pos(bin);
		place(binEl, c.x, c.y, E.angle(bin), SB);
		files.forEach(function (f) { if (f.body) { var p = E.pos(f.body); place(f.el, p.x, p.y, E.angle(f.body), S); } });
		var src = binSrc(!!bin.inside.length);
		if (binEl.getAttribute("src") !== src) binEl.setAttribute("src", src);
	}
	function still() {
		return bodies().every(function (b) {
			var s = E.asleep(b);
			if (s !== null) return s;
			return E.speed(b) < 0.06 && Math.abs(E.spin(b)) < 0.002 && (!V.settle || Math.abs(tilt(E.angle(b))) < 0.06 || (b.tries || 0) > 240);
		});
	}
	function tick() {
		frame++;
		if (grab) E.dragTarget(grab.j, { x: grab.x, y: grab.y });
		settle();
		// While it leans on its hinge the bin moves too slowly for some engines not to put it to sleep.
		if (hinge) E.wake(bin);
		// Once a thrown bin is in, the left wall goes up behind it.
		if (V.throw && !leftWall && E.pos(bin).x > G.bw) { leftWall = true; E.addStaticBox(-200, H / 2, 400, H * 4, MAT.wall); }
		var was = E.speed(bin), wasV = E.vel(bin);
		E.step();
		// An impact: the bin suddenly slows (a glancing hit counts sooner for a thrown one).
		if (!hinge && was > 3 && was - E.speed(bin) > (V.throw ? 1.2 : 2.2)) {
			if (V.throw && !bin.jolt) bin.fling = { until: frame + (V.flingFrames || 24), v: wasV };
			bin.jolt = frame; hop();
			// rock: on its first landing it rocks once further over, so the last few tumble out.
			if (V.rock && !bin.rocked) { bin.rocked = true; var a = E.angle(bin); E.setSpin(bin, E.spin(bin) + V.rock * (a >= 0 ? 1 : -1)); }
		}
		capSpeeds();
		if (hinge && (Math.abs(E.angle(bin)) > 0.3 || grab)) letGo();
		pour();
		spill();
		catchIn();
		render();
		var patience = lyingTipped() ? 900 : 240;
		calm = still() && !grab && !hinge && !(bin.inside.length && opening() >= POUR && (bin.blocked || 0) < patience) ? calm + 1 : 0;
		if (calm > 30 && frame > 120) { raf = 0; if (window.LF_STATS) LF_STATS.rest(frame); return; }
		raf = requestAnimationFrame(tick);
	}
	function wake() { calm = 0; if (!raf && bin) raf = requestAnimationFrame(tick); }
	function wire(el, get) {
		el.addEventListener("pointerdown", function (e) {
			var b = get();
			if (!b || REDUCED || e.button > 0) return;
			e.preventDefault();
			var r = stage.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
			E.wake(b);
			grab = { body: b, j: E.drag(b, { x: x, y: y }, V.drag), x: x, y: y };
			el.classList.add("lf-held");
			try { el.setPointerCapture(e.pointerId); } catch (err) {}
			var move = function (ev) { var r2 = stage.getBoundingClientRect(); grab.x = ev.clientX - r2.left; grab.y = ev.clientY - r2.top; wake(); };
			var up = function () {
				el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up);
				el.classList.remove("lf-held");
				if (grab) E.removeJoint(grab.j);
				grab = null;
				wake();
			};
			el.addEventListener("pointermove", move); el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
			wake();
		});
	}
	function setup() {
		E.create(V);
		if (V.throw) stage.style.clipPath = "inset(-" + Math.round(H * 1.6) + "px 0 0 0)";
		buildStatics();
		bin = E.addBin(G.binX, G.binY, G.bw, G.bh, G.wall, MAT.bin);
		bin.inside = files.slice();
		if (V.throw) throwIn(); else lean();
		wire(binEl, function () { return bin; });
		files.forEach(function (f) { wire(f.el, function () { return f.body; }); });
		binEl.addEventListener("dblclick", standUp);
	}
	function start() {
		if (started || REDUCED) return;
		started = true;
		E.load().then(function () { setup(); render(); wake(); }, function (err) { if (window.LF_STATS) LF_STATS.fail(err); lieStill(); });
	}
	// A resize rebuilds the letters and moves every body with them, clear of what's placed.
	function relayout(force) {
		var oldW = W, oldH = H, old = G;
		geometry();
		G.binY -= lift();
		if (!force && oldW && W === oldW && H === oldH) return;
		drawWord();
		if (REDUCED) { lieStill(); return; }
		if (!bin) { poseStart(); return; }
		if (grab) { E.removeJoint(grab.j); grab = null; }
		letGo();
		buildStatics();
		if (!old || (W === oldW && H === oldH && G.F === old.F)) { wake(); return; }
		var sx = W / oldW, sf = G.F / old.F, list = bodies();
		list.sort(function (p, q) { return E.pos(q).y - E.pos(p).y; });
		list.forEach(function (b) {
			var f = b === bin ? null : files.filter(function (x) { return x.body === b; })[0];
			var w = f ? S * f.w : G.bw, h = f ? S * f.h : G.bh;
			if (f) E.resizeBox(b, w, h, MAT.file); else E.resizeBin(b, G.bw, G.bh, G.wall, MAT.bin);
			var p = E.pos(b), a = E.angle(b), half = Math.max(w, h) / 2;
			var x = Math.max(half + 1, Math.min(W - half - 1, p.x * sx)), y = Math.min(G.floor - half - 1, G.floor - (old.floor - p.y) * sf);
			for (var i = 0; i < 200 && E.overlapsBox(w, h, x, y, a, b); i++) y -= 3;
			E.setPose(b, x, y, a);
			E.setVel(b, { x: 0, y: 0 }); E.setSpin(b, 0); E.wake(b);
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
	if (window.MutationObserver) new MutationObserver(function () { if (G) drawWord(); binEl.setAttribute("src", binSrc(binFull)); }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
	if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { relayout(true); });
	E.load();
	new IntersectionObserver(function (es, io) {
		if (es.some(function (en) { return en.isIntersecting; })) { io.disconnect(); start(); }
	}, { threshold: 0.45 }).observe(stage);
})();
