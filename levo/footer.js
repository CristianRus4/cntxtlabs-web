/*
 * The footer: the year, and a small scene run by Matter.js (0.20.0 from cdnjs, pinned, with its
 * integrity hash, loaded only when the footer comes near).
 *
 * "Levo" is the page's rounded heavy face (ui-rounded, "SF Pro Rounded", then the system font),
 * huge, its lower part below the page's bottom edge. One source: each glyph is drawn as SVG text
 * at a position computed here, and its collider is that same glyph's outline, read from a canvas
 * drawn with the same font, size and position (the convex hull of the part above the floor: round
 * tops, a round e and o, the v with its notch filled so nothing wedges there). A ResizeObserver
 * and document.fonts.ready rebuild both together.
 *
 * The Trash stands centred on the L's top, full. A tiny tilt makes it wobble and settle; after a
 * couple of seconds a gentle push tips it over towards "evo". Its files aren't bodies while they're
 * inside (hidden behind the bin, which shows macOS's full Trash icon): once its opening tilts past
 * about 70 degrees they come out at the rim one at a time, with the bin's own velocity and no push,
 * their speed capped for a moment, so they slide out rather than shoot. Files dropped into the
 * upright bin's opening go in the same way, and come out the same way.
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
	var svg = stage.querySelector("[data-word]"), binEl = stage.querySelector("[data-bin]");
	var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	var MATTER = { src: "https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.20.0/matter.min.js", sri: "sha384-ZRKYEXtLBVeqs9z1WxyeKutCqnkqolS/r1EUWuoUpG4ZKbnRAIXnHhHdnNuiB6CL" };
	var BIN = { empty: "img/dock/trash-empty.png", full: "img/dock/trash-full.png" };
	var FACE = 'ui-rounded, "SF Pro Rounded", -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
	var WORD = "Levo", TRACK = -0.045;

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
	// pixels, as the convex hull with the floor.
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
		var minX = Math.min.apply(null, pts.map(function (p) { return p.x; })), maxX = Math.max.apply(null, pts.map(function (p) { return p.x; }));
		pts.push({ x: minX, y: floor + 80 }, { x: maxX, y: floor + 80 });
		return hull(pts);
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
		var em = adv.reduce(function (s, v) { return s + v; }, 0) + TRACK * (WORD.length - 1);
		// Huge: the width of the footer, or as tall as fits; about a fifth of it below the edge.
		var F = Math.round(Math.min(W * 0.92 / em, H * 1.3));
		var floor = H, base = floor + Math.round(F * 0.2), x = Math.round((W - em * F) / 2);
		var glyphs = WORD.split("").map(function (ch, i) {
			var g = { ch: ch, x: x, hull: outline(ch, x, base, F, floor) };
			x += Math.round((adv[i] + TRACK) * F);
			return g;
		});
		// The L's top: where the bin stands, centred on it.
		var L = glyphs[0].hull, top = Math.min.apply(null, L.map(function (p) { return p.y; }));
		var near = L.filter(function (p) { return p.y < top + 3; }), lx = near.reduce(function (s, p) { return s + p.x; }, 0) / near.length;
		var stemL = Math.min.apply(null, L.map(function (p) { return p.x; })), stemR = Math.max.apply(null, L.filter(function (p) { return p.y < floor - 2; }).map(function (p) { return p.x; }));
		SB = Math.round(Math.max(96, Math.min(180, F * 0.34)));
		S = Math.round(Math.max(28, Math.min(52, SB * 0.3)));
		G = { F: F, floor: floor, base: base, glyphs: glyphs, stemTop: top, stemX: (stemL + stemR) / 2, stemW: stemR - stemL,
			bw: SB * BW, bh: SB * BH, wall: Math.max(4, SB * WALL) };
		G.binX = G.stemX;
		G.binY = top - G.bh / 2 - 1;
		return G;
	}
	function drawWord() {
		svg.setAttribute("width", W);
		svg.setAttribute("height", H);
		svg.setAttribute("viewBox", "0 0 " + W + " " + H);
		svg.setAttribute("preserveAspectRatio", "none");
		svg.innerHTML = G.glyphs.map(function (g) {
			return '<text class="f" x="' + g.x + '" y="' + G.base + '" font-size="' + G.F + '" font-weight="800" font-family=\'' + FACE.replace(/'/g, "") + "'>" + g.ch + "</text>";
		}).join("");
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
		g.hull.forEach(function (p, i) {
			var q = g.hull[(i + 1) % g.hull.length];
			if ((p.x - x) * (q.x - x) <= 0 && p.x !== q.x) { var y = p.y + (q.y - p.y) * (x - p.x) / (q.x - p.x); if (y < best) best = y; }
		});
		return best;
	}
	// Reduced motion: the bin on its side on top of the L, files flat on "evo" and the floor.
	function lieStill() {
		binEl.src = BIN.empty;
		place(binEl, G.stemX + G.bh * 0.1, G.stemTop - G.bw / 2, Math.PI / 2, SB);
		var spots = [];
		G.glyphs.slice(1).forEach(function (g) {
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
	var SURFACE = { friction: 0.24, frictionStatic: 0.14, restitution: 0.04 };

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
		var LETTER = { isStatic: true, friction: 0.3, frictionStatic: 0.14, restitution: 0.04 };
		var WALLS = { isStatic: true, friction: 0.5, frictionStatic: 0.14, restitution: 0.04 };
		statics = [
			B.rectangle(W / 2, G.floor + thick / 2, W * 3, thick, WALLS),
			B.rectangle(-thick / 2, H / 2, thick, H * 4, WALLS),
			B.rectangle(W + thick / 2, H / 2, thick, H * 4, WALLS),
			B.rectangle(W / 2, -thick / 2 - H * 0.6, W * 3, thick, WALLS)
		];
		G.glyphs.forEach(function (g) {
			if (!g.hull) return;
			var c = M.Vertices.centre(g.hull);
			statics.push(M.Bodies.fromVertices(c.x, c.y, [g.hull], LETTER));
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

	// Out at the rim: one file per few frames once the opening has tilted past 70 degrees, placed just
	// beyond the rim with the velocity of the bin at that point, and nothing more.
	function pour() {
		// The further it turns over, the quicker they slide out: upside down, they all fall at once.
		var o = opening(), wait = Math.max(2, Math.round(9 - 4 * (o - 1.22)));
		if (!bin.inside.length || o < 1.22 || frame - (bin.poured || 0) < wait) return;
		var f = bin.inside[0], c = binCentre(), fh = S * f.h, fw = S * f.w;
		var rim = local(bin, { x: (Math.random() - 0.5) * G.bw * 0.3, y: -G.bh / 2 - fh * 0.55 });
		var p = { x: c.x + rim.x, y: c.y + rim.y }, r = { x: p.x - bin.position.x, y: p.y - bin.position.y };
		// Only into open space: with the opening against a letter or a pile, the rest stay in.
		var probe = M.Bodies.rectangle(p.x, p.y, fw, fh, { angle: bin.angle });
		var others = M.Composite.allBodies(world).filter(function (b) { return b !== bin; });
		if (M.Query.collides(probe, others).length) return;
		bin.poured = frame;
		bin.inside.shift();
		f.body = rect(fw, fh, p.x, p.y);
		M.Body.setAngle(f.body, bin.angle);
		M.Body.setVelocity(f.body, { x: bin.velocity.x - bin.angularVelocity * r.y, y: bin.velocity.y + bin.angularVelocity * r.x });
		M.Body.setAngularVelocity(f.body, bin.angularVelocity * 0.5 + (Math.random() - 0.5) * 0.04);
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
		// A tiny tilt to the right: it wobbles and settles on the L before anything else happens.
		M.Body.rotate(bin, 0.03, { x: G.binX, y: G.binY + G.bh / 2 });
		bin.inside = files.slice();
		M.Composite.add(world, bin);
		wire(binEl, function () { return bin; });
		files.forEach(function (f) { wire(f.el, function () { return f.body; }); });
		binEl.addEventListener("dblclick", standUp);
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
			if (!b || !(b.calmUntil > frame) || b.speed < 5) return;
			var k = 5 / b.speed;
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
		M.Engine.update(engine, 1000 / 60);
		capSpeeds();
		pour();
		catchIn();
		render();
		var still = true;
		M.Composite.allBodies(world).forEach(function (b) {
			if (b.isStatic || b.parent !== b) return;
			if (b.speed > 0.06 || Math.abs(b.angularVelocity) > 0.002 || (Math.abs(tilt(b)) > 0.06 && (b.tries || 0) <= 240)) still = false;
		});
		calm = still && !grab && !(bin.inside.length && opening() >= 1.22) ? calm + 1 : 0;
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
			// After its wobble, a gentle push to the right: over it goes.
			setTimeout(function () { if (!grab) { M.Body.setAngularVelocity(bin, 0.05); M.Body.setVelocity(bin, { x: 0.6, y: -0.2 }); } wake(); }, 2600);
		});
	}

	// The stage's size rules everything: on any change, the drawing and the colliders are rebuilt
	// together, and bodies keep their place relative to the stage.
	function relayout(force) {
		var oldW = W, oldH = H;
		geometry();
		if (!force && oldW && W === oldW && H === oldH) return;
		drawWord();
		if (REDUCED) { lieStill(); return; }
		if (!engine) { poseStart(); return; }
		buildStatics();
		if (W !== oldW || H !== oldH) {
			var sx = oldW ? W / oldW : 1;
			M.Composite.allBodies(world).forEach(function (b) {
				if (b.isStatic || b.parent !== b) return;
				// Lifted clear of the rebuilt letters, they fall back onto them.
				M.Body.setPosition(b, { x: b.position.x * sx, y: Math.min(b.position.y + (H - oldH), H - 10) - G.F * 0.15 });
				M.Body.setVelocity(b, { x: 0, y: 0 });
			});
		}
		wake();
	}

	makeEls();
	relayout(true);
	if (REDUCED) stage.classList.add("lf-still");
	if (window.ResizeObserver) new ResizeObserver(function () { relayout(); }).observe(stage);
	else window.addEventListener("resize", function () { relayout(); });
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
