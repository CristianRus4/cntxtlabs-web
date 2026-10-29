/*
 * The footer: the year, and an emptied Trash with its files spilled out, which the visitor can
 * drag and throw. A tiny physics loop: circles under gravity, the stage's floor and walls, the bin
 * as a box, bounces and collisions; it sleeps once everything rests and wakes on a touch.
 * Mouse and touch. Reduced motion: the files lie still where they fell.
 */
(function () {
	"use strict";
	var root = document.querySelector("[data-lf]");
	if (!root) return;
	var year = root.querySelector("[data-lf-year]");
	if (year) year.textContent = String(new Date().getFullYear());

	var stage = root.querySelector("[data-spill]");
	if (!stage) return;
	var bin = stage.querySelector(".lf-bin");
	var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	// macOS's own icons, as on the simulated desktop (img/desk, from tools/export-desk-icons.swift).
	var FILES = ["folder", "txt", "zip", "pdf", "png", "dmg", "folder", "pkg", "doc", "psd", "txt", "app"];
	var G = 2200, BOUNCE = 0.32, FLOOR_FRICTION = 0.9, AIR = 0.999, SLEEP = 6;

	var W = 0, H = 0, S = 64, R = 30, box = null, bodies = [], raf = 0, last = 0, held = null, calm = 0, started = false;

	function measure() {
		W = stage.clientWidth; H = stage.clientHeight - 6;
		var small = W < 760;
		S = small ? 52 : 64; R = S * 0.46;
		var bs = small ? 120 : 168, bx = Math.round(Math.max(12, W * 0.08));
		// The bin lies on its side, its opening to the right, resting on the floor.
		bin.style.transform = "translate(" + bx + "px," + Math.round(H - bs * 0.95) + "px) rotate(90deg)";
		box = { x0: bx + bs * 0.14, x1: bx + bs * 0.82, y0: H - bs * 0.72, y1: H + 40 };
	}

	function make() {
		bodies = FILES.map(function (name, i) {
			var img = document.createElement("img");
			img.className = "lf-item";
			img.src = "img/desk/" + name + ".png";
			img.alt = "";
			img.width = S; img.height = S;
			img.draggable = false;
			stage.appendChild(img);
			return { el: img, x: 0, y: 0, vx: 0, vy: 0, a: (Math.random() - 0.5) * 0.6, i: i };
		});
	}

	// Out of the bin's mouth, in a spill to the right.
	function spill() {
		bodies.forEach(function (b, i) {
			b.x = box.x1 + R * 0.4 + (i % 3) * 6;
			b.y = box.y0 + R + (i % 4) * 8;
			b.vx = 380 + Math.random() * 900;
			b.vy = -200 - Math.random() * 520;
		});
	}
	// Where they come to rest without physics: a loose line in front of the bin.
	function lieStill() {
		var x = box.x1 + R + 8;
		bodies.forEach(function (b, i) {
			b.x = Math.min(W - R, x + i * (R * 1.9) + (i % 2) * 6);
			b.y = H - R - (i % 3 === 1 && i > 2 ? R * 1.6 : 0);
			b.a = (i % 2 ? 1 : -1) * (0.15 + (i % 3) * 0.2);
		});
		draw();
	}

	function draw() {
		bodies.forEach(function (b) {
			b.el.style.transform = "translate(" + (b.x - S / 2).toFixed(1) + "px," + (b.y - S / 2).toFixed(1) + "px) rotate(" + b.a.toFixed(3) + "rad)";
		});
	}

	function collideBox(b) {
		// The bin: the circle against the nearest point of its box.
		var cx = Math.max(box.x0, Math.min(b.x, box.x1)), cy = Math.max(box.y0, Math.min(b.y, box.y1));
		var dx = b.x - cx, dy = b.y - cy, d2 = dx * dx + dy * dy;
		if (d2 >= R * R) return;
		var d = Math.sqrt(d2) || 0.001, nx = d2 ? dx / d : 0, ny = d2 ? dy / d : -1;
		b.x += nx * (R - d); b.y += ny * (R - d);
		var vn = b.vx * nx + b.vy * ny;
		if (vn < 0) { b.vx -= (1 + BOUNCE) * vn * nx; b.vy -= (1 + BOUNCE) * vn * ny; }
	}

	function step(dt) {
		var moving = 0;
		bodies.forEach(function (b) {
			if (b === held) return;
			b.vy += G * dt;
			b.vx *= AIR; b.vy *= AIR;
			b.x += b.vx * dt; b.y += b.vy * dt;
			// Floor and walls.
			if (b.y > H - R) {
				b.y = H - R;
				if (b.vy > 0) b.vy = -b.vy * BOUNCE;
				if (Math.abs(b.vy) < 40) b.vy = 0;
				b.vx *= Math.pow(FLOOR_FRICTION, dt * 60);
				b.a += b.vx * dt / R;
			}
			if (b.y < R) { b.y = R; b.vy = Math.abs(b.vy) * BOUNCE; }
			if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx) * BOUNCE; }
			if (b.x > W - R) { b.x = W - R; b.vx = -Math.abs(b.vx) * BOUNCE; }
			collideBox(b);
		});
		// Each pair once: push apart and trade a little momentum.
		for (var i = 0; i < bodies.length; i++) for (var j = i + 1; j < bodies.length; j++) {
			var p = bodies[i], q = bodies[j], dx = q.x - p.x, dy = q.y - p.y, d2 = dx * dx + dy * dy, min = R * 2;
			if (d2 >= min * min || d2 === 0) continue;
			var d = Math.sqrt(d2), nx = dx / d, ny = dy / d, over = (min - d) / 2;
			var pw = p === held ? 0 : 1, qw = q === held ? 0 : 1, sum = pw + qw || 1;
			p.x -= nx * over * 2 * pw / sum; p.y -= ny * over * 2 * pw / sum;
			q.x += nx * over * 2 * qw / sum; q.y += ny * over * 2 * qw / sum;
			var rv = (q.vx - p.vx) * nx + (q.vy - p.vy) * ny;
			if (rv < 0) {
				var k = -(1 + BOUNCE) * rv / sum;
				p.vx -= k * nx * pw; p.vy -= k * ny * pw;
				q.vx += k * nx * qw; q.vy += k * ny * qw;
				p.a -= rv * 0.0015 * pw; q.a += rv * 0.0015 * qw;
			}
		}
		bodies.forEach(function (b) { if (b !== held) moving = Math.max(moving, Math.abs(b.vx) + Math.abs(b.vy)); });
		return moving;
	}

	function loop(now) {
		var dt = Math.min(0.033, (now - last) / 1000 || 0.016);
		last = now;
		// Two sub-steps keep fast throws from passing through each other.
		var m = Math.max(step(dt / 2), step(dt / 2));
		draw();
		calm = m < SLEEP && !held ? calm + dt : 0;
		if (calm > 1.2) { raf = 0; return; }
		raf = requestAnimationFrame(loop);
	}
	function wake() { calm = 0; if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } }

	// Drag and throw, with the mouse or a finger.
	function grab(e) {
		var el = e.target.closest && e.target.closest(".lf-item");
		if (!el || REDUCED) return;
		var b = bodies.filter(function (x) { return x.el === el; })[0];
		if (!b) return;
		e.preventDefault();
		held = b;
		el.classList.add("is-held");
		try { el.setPointerCapture(e.pointerId); } catch (err) {}
		var r = stage.getBoundingClientRect(), ox = e.clientX - r.left - b.x, oy = e.clientY - r.top - b.y;
		var trail = [];
		var move = function (ev) {
			var r2 = stage.getBoundingClientRect(), t = performance.now();
			b.x = Math.max(R, Math.min(W - R, ev.clientX - r2.left - ox));
			b.y = Math.max(R, Math.min(H - R, ev.clientY - r2.top - oy));
			trail.push([t, b.x, b.y]);
			while (trail.length > 2 && t - trail[0][0] > 90) trail.shift();
			b.vx = 0; b.vy = 0;
			wake();
		};
		var up = function () {
			el.removeEventListener("pointermove", move);
			el.removeEventListener("pointerup", up);
			el.removeEventListener("pointercancel", up);
			el.classList.remove("is-held");
			if (trail.length > 1) {
				var a = trail[0], z = trail[trail.length - 1], dt = Math.max(16, z[0] - a[0]) / 1000;
				b.vx = Math.max(-3200, Math.min(3200, (z[1] - a[1]) / dt));
				b.vy = Math.max(-3200, Math.min(3200, (z[2] - a[2]) / dt));
			}
			held = null;
			wake();
		};
		el.addEventListener("pointermove", move);
		el.addEventListener("pointerup", up);
		el.addEventListener("pointercancel", up);
		wake();
	}

	function start() {
		if (started) return;
		started = true;
		if (REDUCED) { lieStill(); stage.classList.add("lf-still"); return; }
		spill();
		draw();
		wake();
	}

	measure();
	make();
	lieStill();
	stage.addEventListener("pointerdown", grab);
	window.addEventListener("resize", function () {
		measure();
		bodies.forEach(function (b) { b.x = Math.max(R, Math.min(W - R, b.x)); b.y = Math.min(H - R, b.y); });
		if (REDUCED) lieStill(); else { draw(); wake(); }
	});
	// The spill happens as the end of the page comes into view.
	if (window.IntersectionObserver) {
		bodies.forEach(function (b) { b.el.style.visibility = "hidden"; });
		new IntersectionObserver(function (es, io) {
			es.forEach(function (en) {
				if (!en.isIntersecting) return;
				bodies.forEach(function (b) { b.el.style.visibility = ""; });
				start();
				io.disconnect();
			});
		}, { threshold: 0.3 }).observe(stage);
	} else start();
})();
