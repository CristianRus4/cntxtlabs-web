/*
 * The footer: the year, and a small scene run by Matter.js (0.20.0 from cdnjs, pinned, with its
 * integrity hash, loaded only when the footer comes near).
 *
 * "Levo" is solid: L as two bars, e and o as circles, v as a trapezoid (its two slanted bars and the
 * notch between them, so nothing wedges there). When the footer comes into view, macOS's Trash
 * stands upright on top of the L, full; it wobbles, tips over, and its files spill out, bounce off
 * the letters and come to rest. Every body is its real rectangle with friction, a little bounce and
 * air drag, so things topple and lie flat; nothing sleeps mid-tilt (the loop only stops once every
 * body is still).
 *
 * Drag and throw anything, with the mouse or a finger (the page still scrolls over empty space).
 * The bin stands up while it's carried, so dropping it leaves it upright; a double-click stands it
 * up too. A file dropped into the upright bin's opening goes in and the bin turns full; tip the
 * full bin over and everything spills out again.
 *
 * Reduced motion: no physics; the bin lies on its side on the L and the files rest on "evo".
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

	// macOS's own icons, as on the simulated desktop (img/desk). The rectangle is each icon's real
	// outline as a share of its image: folders are wide, documents tall.
	var FILES = [["folder", 0.92, 0.72], ["txt", 0.72, 0.9], ["zip", 0.72, 0.9], ["pdf", 0.72, 0.9], ["png", 0.72, 0.9], ["dmg", 0.72, 0.9],
		["folder", 0.92, 0.72], ["pkg", 0.86, 0.8], ["doc", 0.72, 0.9], ["psd", 0.72, 0.9], ["app", 0.8, 0.8]];

	var W = 0, H = 0, G = null, S = 56, SB = 112, files = [], bin = null;

	// ---------------------------------------------------------------- The wordmark, as shapes

	function geometry() {
		W = stage.clientWidth; H = stage.clientHeight;
		var h = Math.round(Math.min(H * 0.64, (W - 32) / 2.9)), t = Math.round(h * 0.2), xh = Math.round(h * 0.68), r = xh / 2, gap = h * 0.04;
		var total = 0.6 * h + gap + xh + gap + 0.66 * h + gap + xh, x0 = Math.round((W - total) / 2), floor = H;
		var ex = x0 + 0.6 * h + gap + r, vx = ex + r + gap, ox = vx + 0.66 * h + gap + r, top = floor - xh;
		S = Math.round(Math.max(36, Math.min(64, h * 0.2)));
		SB = Math.round(Math.max(64, Math.min(128, h * 0.42)));
		G = { h: h, t: t, xh: xh, r: r, x0: x0, floor: floor, ex: ex, vx: vx, ox: ox, top: top, cy: floor - r };
		return G;
	}
	function vPath() {
		var g = G, m = g.vx + 0.33 * g.h, b = g.t * 0.55, a = g.t * 1.1;
		var u = (0.33 * g.h - a) / (0.33 * g.h + b - a), notch = g.top + u * g.xh;
		return '<path class="f" d="M' + g.vx + " " + g.top + "H" + (g.vx + a) + "L" + m + " " + notch + "L" + (g.vx + 0.66 * g.h - a) + " " + g.top + "H" + (g.vx + 0.66 * g.h) +
			"L" + (m + b) + " " + g.floor + "H" + (m - b) + 'Z"/>';
	}
	function drawWord() {
		var g = G, R = g.r - g.t / 2, a = Math.PI / 4;
		svg.setAttribute("viewBox", "0 0 " + W + " " + H);
		svg.innerHTML =
			// L: a stem and a foot, as one outline (so the corner isn't drawn twice).
			'<path class="f" d="M' + g.x0 + " " + (g.floor - g.h) + "h" + g.t + "V" + (g.floor - g.t) + "H" + (g.x0 + 0.6 * g.h) + "V" + g.floor + "H" + g.x0 + 'Z"/>' +
			// e: a ring open at the lower right, with its bar.
			'<path class="s" stroke-width="' + g.t + '" d="M' + (g.ex - R) + " " + g.cy + "H" + (g.ex + R) + "A" + R + " " + R + " 0 1 0 " + (g.ex + R * Math.cos(a)) + " " + (g.cy + R * Math.sin(a)) + '"/>' +
			// v: two slanted bars as one outline, their flat tops exactly on the collider's top edge.
			vPath() +
			// o: a ring.
			'<circle class="s" stroke-width="' + g.t + '" cx="' + g.ox + '" cy="' + g.cy + '" r="' + R + '"/>';
	}

	// ---------------------------------------------------------------- Without physics (reduced motion)

	function place(el, x, y, a, size) {
		el.style.width = size + "px"; el.style.height = size + "px";
		el.style.transform = "translate(" + (x - size / 2).toFixed(1) + "px," + (y - size / 2).toFixed(1) + "px) rotate(" + (a || 0).toFixed(3) + "rad)";
	}
	function makeEls() {
		FILES.forEach(function (f, i) {
			if (files[i]) return;
			var img = document.createElement("img");
			img.className = "lf-item";
			img.src = "img/desk/" + f[0] + ".png";
			img.alt = ""; img.draggable = false;
			stage.appendChild(img);
			files[i] = { el: img, w: f[1], h: f[2], body: null, inBin: false };
		});
	}
	function lieStill() {
		var g = G, bw = SB * 0.58, bh = SB * 0.76;
		binEl.src = BIN.empty;
		// The bin on its side in the L's corner, its opening towards "evo".
		place(binEl, g.x0 + g.t + bh / 2 + 4, g.floor - g.t - bw / 2, Math.PI / 2, SB);
		// Three flat on the v's top, the rest along the floor clear of the letters, then a second
		// layer on the v's row if the floor runs out (a phone).
		var onV = [g.vx + 0.13 * g.h, g.vx + 0.33 * g.h, g.vx + 0.53 * g.h], k = 0, step = S * 0.92;
		var taken = [[g.x0 - 6, g.x0 + 0.6 * g.h + SB * 0.1], [g.ex - g.r, g.ex + g.r], [g.vx, g.vx + 0.66 * g.h], [g.ox - g.r, g.ox + g.r]];
		var slots = [];
		for (var x = step / 2 + 6; x < W - step / 2; x += step) {
			if (!taken.some(function (t) { return x + step / 2 > t[0] && x - step / 2 < t[1]; })) slots.push(x);
		}
		files.forEach(function (f, i) {
			f.el.classList.remove("is-in");
			var fh = S * f.h;
			if (k < onV.length) { place(f.el, onV[k], g.top - fh / 2, 0, S); k++; return; }
			if (slots.length) { place(f.el, slots.shift(), g.floor - fh / 2, 0, S); return; }
			place(f.el, onV[(i - 3) % 3], g.top - S * 0.9 - fh / 2, 0, S);
		});
	}

	// ---------------------------------------------------------------- With Matter.js

	var M, engine, world, statics = [], raf = 0, calm = 0, drag = null, queue = [], started = false;

	function loadMatter(done) {
		if (window.Matter) { done(); return; }
		var s = document.createElement("script");
		s.src = MATTER.src; s.integrity = MATTER.sri; s.crossOrigin = "anonymous"; s.referrerPolicy = "no-referrer";
		s.onload = done;
		s.onerror = function () { lieStill(); stage.classList.add("lf-still"); };
		document.head.appendChild(s);
	}

	// Matter pairs take the lower friction and the higher static friction of two bodies, so the
	// moving bodies keep a low static friction: on the round letters they roll or slide off.
	var SURFACE = { friction: 0.32, frictionStatic: 0.36, restitution: 0.12 };
	function buildStatics() {
		var B = M.Bodies, g = G;
		if (statics.length) M.Composite.remove(world, statics);
		var ROUND = { isStatic: true, friction: 0.02, frictionStatic: 0.02, restitution: 0.15 };
		var FLAT = { isStatic: true, friction: 0.5, frictionStatic: 0.36, restitution: 0.1 };
		var thick = 200;
		statics = [
			B.rectangle(W / 2, g.floor + thick / 2, W * 3, thick, FLAT),
			B.rectangle(-thick / 2, H / 2, thick, H * 4, FLAT),
			B.rectangle(W + thick / 2, H / 2, thick, H * 4, FLAT),
			B.rectangle(W / 2, -thick / 2 - H, W * 3, thick, FLAT),
			B.rectangle(g.x0 + g.t / 2, g.floor - g.h / 2, g.t, g.h, FLAT),
			B.rectangle(g.x0 + 0.3 * g.h, g.floor - g.t / 2, 0.6 * g.h, g.t, FLAT),
			B.circle(g.ex, g.cy, g.r, ROUND, 48),
			B.circle(g.ox, g.cy, g.r, ROUND, 48),
			vBody()
		];
		M.Composite.add(world, statics);
	}
	// The v: a trapezoid placed by its own centroid, as Matter centres a body there.
	function vBody() {
		var g = G, vs = [{ x: g.vx, y: g.top }, { x: g.vx + 0.66 * g.h, y: g.top }, { x: g.vx + 0.33 * g.h + g.t * 0.55, y: g.floor }, { x: g.vx + 0.33 * g.h - g.t * 0.55, y: g.floor }];
		var c = M.Vertices.centre(vs);
		return M.Bodies.fromVertices(c.x, c.y, [vs], { isStatic: true, friction: SURFACE.friction, frictionStatic: SURFACE.frictionStatic, restitution: 0.1 });
	}
	function body(w, h, x, y, opts) {
		var b = M.Bodies.rectangle(x, y, w, h, Object.assign({
			friction: SURFACE.friction, frictionStatic: SURFACE.frictionStatic, restitution: SURFACE.restitution,
			frictionAir: 0.018, density: 0.0016, chamfer: { radius: Math.min(w, h) * 0.06 }
		}, opts || {}));
		return b;
	}
	function setup() {
		M = window.Matter;
		engine = M.Engine.create({ gravity: { x: 0, y: 1, scale: 0.0012 }, positionIterations: 10, velocityIterations: 8, enableSleeping: false });
		world = engine.world;
		buildStatics();
		// The bin, upright and full, balanced on top of the L.
		var g = G;
		bin = body(SB * 0.58, SB * 0.76, g.x0 + g.t * 0.82, g.floor - g.h - SB * 0.38 - 1, { density: 0.0024 });
		bin.inside = files.slice();
		files.forEach(function (f) { f.inBin = true; f.el.classList.add("is-in"); });
		binEl.src = BIN.full;
		M.Composite.add(world, bin);
		wire(binEl, function () { return bin; });
		files.forEach(function (f) { wire(f.el, function () { return f.body; }); });
		binEl.addEventListener("dblclick", standUp);
	}

	// The bin's opening: its top edge's middle, wherever it points.
	function mouth(extra) {
		var up = { x: Math.sin(bin.angle), y: -Math.cos(bin.angle) }, d = SB * 0.38 + (extra || 0);
		return { x: bin.position.x + up.x * d, y: bin.position.y + up.y * d, up: up };
	}
	function upright() { var a = Math.atan2(Math.sin(bin.angle), Math.cos(bin.angle)); return Math.abs(a) < 0.3; }

	// Tipped far enough, a full bin empties, one file at a time out of its opening.
	function spill() {
		var a = Math.abs(Math.atan2(Math.sin(bin.angle), Math.cos(bin.angle)));
		if (!bin.inside.length || a < 1.05) return;
		while (bin.inside.length) queue.push(bin.inside.shift());
		binEl.src = BIN.empty;
	}
	function release() {
		if (!queue.length) return;
		if (queue.t && performance.now() - queue.t < 70) return;
		queue.t = performance.now();
		var f = queue.shift(), m = mouth(S * 0.5), w = S * f.w, h = S * f.h;
		f.body = body(w, h, m.x, m.y);
		M.Body.setAngle(f.body, bin.angle + (Math.random() - 0.5) * 0.6);
		// Out over "evo": along the opening, with a lift and a push to the right.
		var speed = 6 + Math.random() * 5;
		M.Body.setVelocity(f.body, { x: m.up.x * speed + 2.2 + Math.random() * 2.5, y: m.up.y * speed - 2.5 - Math.random() * 3 });
		M.Body.setAngularVelocity(f.body, (Math.random() - 0.5) * 0.25);
		M.Composite.add(world, f.body);
		f.inBin = false;
		f.el.classList.remove("is-in");
	}
	// A file dropped into the upright bin's opening goes in.
	function swallow() {
		if (!upright()) return;
		var m = mouth(0), half = SB * 0.58 * 0.36;
		files.forEach(function (f) {
			var b = f.body;
			if (!b || f.inBin || (drag && drag.body === b)) return;
			var p = b.position;
			if (Math.abs(p.x - m.x) < half && p.y < m.y + 4 && p.y > m.y - S * 0.95 && b.velocity.y > -1) {
				M.Composite.remove(world, b);
				f.body = null; f.inBin = true;
				f.el.classList.add("is-in");
				bin.inside.push(f);
				binEl.src = BIN.full;
			}
		});
	}
	function standUp() {
		if (!bin) return;
		M.Body.setAngle(bin, 0);
		M.Body.setAngularVelocity(bin, 0);
		M.Body.setVelocity(bin, { x: 0, y: 0 });
		M.Body.setPosition(bin, { x: bin.position.x, y: Math.min(bin.position.y, G.floor - SB * 0.38 - 2) - 6 });
		wake();
	}

	function tilt(b) { var q = Math.PI / 2, d = ((b.angle % q) + q) % q; return d > q / 2 ? d - q : d; }
	function settle() {
		M.Composite.allBodies(world).forEach(function (b) {
			if (b.isStatic || (drag && drag.body === b)) return;
			var d = tilt(b);
			if (b.speed > 0.25 || Math.abs(b.angularVelocity) > 0.02 || Math.abs(d) < 0.01) { if (b.speed > 1) b.tries = 0; return; }
			b.tries = (b.tries || 0) + 1;
			if (b.tries > 240) return;
			M.Body.setAngularVelocity(b, -d * 0.08);
		});
	}
	function render() {
		place(binEl, bin.position.x, bin.position.y, bin.angle, SB);
		files.forEach(function (f) { if (f.body) place(f.el, f.body.position.x, f.body.position.y, f.body.angle, S); });
	}
	function tick() {
		if (drag) {
			M.Body.setVelocity(drag.body, { x: (drag.x - drag.body.position.x - drag.off.x) * 0.35, y: (drag.y - drag.body.position.y - drag.off.y) * 0.35 });
			// Carried, the bin stands up, so a drop leaves it upright.
			if (drag.body === bin) M.Body.setAngularVelocity(bin, -Math.atan2(Math.sin(bin.angle), Math.cos(bin.angle)) * 0.12);
		}
		settle();
		M.Engine.update(engine, 1000 / 60);
		spill(); release(); swallow();
		render();
		var still = true;
		M.Composite.allBodies(world).forEach(function (b) {
			if (b.isStatic) return;
			if (b.speed > 0.06 || Math.abs(b.angularVelocity) > 0.002 || (Math.abs(tilt(b)) > 0.02 && (b.tries || 0) <= 240)) still = false;
		});
		calm = still && !drag && !queue.length ? calm + 1 : 0;
		if (calm > 90) { raf = 0; return; }
		raf = requestAnimationFrame(tick);
	}
	function wake() { calm = 0; if (!raf && engine) raf = requestAnimationFrame(tick); }

	// Drag and throw: the body follows the pointer and keeps its last speed on release.
	function wire(el, get) {
		el.addEventListener("pointerdown", function (e) {
			var b = get();
			if (!b || REDUCED || e.button > 0) return;
			e.preventDefault();
			var r = stage.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
			drag = { body: b, x: x, y: y, off: { x: x - b.position.x, y: y - b.position.y } };
			el.classList.add("lf-held");
			try { el.setPointerCapture(e.pointerId); } catch (err) {}
			var move = function (ev) { var r2 = stage.getBoundingClientRect(); drag.x = ev.clientX - r2.left; drag.y = ev.clientY - r2.top; wake(); };
			var up = function () {
				el.removeEventListener("pointermove", move);
				el.removeEventListener("pointerup", up);
				el.removeEventListener("pointercancel", up);
				el.classList.remove("lf-held");
				drag = null;
				wake();
			};
			el.addEventListener("pointermove", move);
			el.addEventListener("pointerup", up);
			el.addEventListener("pointercancel", up);
			wake();
		});
	}

	function start() {
		if (started) return;
		started = true;
		if (REDUCED) return;
		loadMatter(function () {
			setup();
			render();
			wake();
			// It wobbles on the L, rocking a little more each time, then tips over towards "evo".
			[[400, 0.018], [760, -0.022], [1120, 0.03], [1480, -0.026], [1840, 0.075]].forEach(function (w, i) {
				setTimeout(function () { M.Body.setAngularVelocity(bin, w[1]); if (i === 4) M.Body.setVelocity(bin, { x: 1.4, y: -0.4 }); wake(); }, w[0]);
			});
		});
	}

	geometry();
	drawWord();
	makeEls();
	if (REDUCED) { lieStill(); stage.classList.add("lf-still"); }
	else {
		// Before it plays: the bin upright and full on the L.
		place(binEl, G.x0 + G.t * 0.82, G.floor - G.h - SB * 0.38 - 1, 0, SB);
		files.forEach(function (f) { f.el.classList.add("is-in"); place(f.el, -S, -S, 0, S); });
	}

	window.addEventListener("resize", function () {
		var oldW = W, oldH = H;
		geometry();
		drawWord();
		if (!engine) { if (REDUCED || !started) { if (REDUCED) lieStill(); else place(binEl, G.x0 + G.t * 0.82, G.floor - G.h - SB * 0.38 - 1, 0, SB); } return; }
		buildStatics();
		M.Composite.allBodies(world).forEach(function (b) {
			if (b.isStatic) return;
			M.Body.setPosition(b, { x: b.position.x * W / (oldW || W), y: Math.min(b.position.y + H - oldH, H - 20) });
		});
		wake();
	});

	if (window.IntersectionObserver) {
		// Matter loads as the footer comes near; the bin falls once it's in view.
		var near = new IntersectionObserver(function (es) {
			if (es.some(function (en) { return en.isIntersecting; })) { near.disconnect(); if (!REDUCED) loadMatter(function () {}); }
		}, { rootMargin: "800px 0px" });
		near.observe(stage);
		new IntersectionObserver(function (es, io) {
			if (es.some(function (en) { return en.isIntersecting; })) { io.disconnect(); start(); }
		}, { threshold: 0.45 }).observe(stage);
	} else start();
})();
