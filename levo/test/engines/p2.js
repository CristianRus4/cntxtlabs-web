/*
 * The footer physics test: p2.js 0.7.1 (cdnjs, pinned; unmaintained since 2015 but stable). Letters
 * are convex pieces; continuous collision for fast bodies; sleeping; a revolute constraint for the
 * lean; the drag is a damped spring at the grab point.
 */
(function () {
	"use strict";
	var SRC = "https://cdnjs.cloudflare.com/ajax/libs/p2.js/0.7.1/p2.min.js";
	var SRI = "sha512-SU6tqA+YK4akayI+sUt7HarDVpnJ9NdWy5UwIp5Tnx7KwzoSfwthJI8TBp+Job5IzhHnwyGcL+bRcKJ/n7TUPA==";
	var P = 40, p2, world, ground, V, sub = 1, loading = null, drags = [], mats = {}, statics = [];
	var G_ALL = 0x0001, G_L = 0x0002, MASK_ALL = 0xFFFF;
	function script(src, sri) {
		return new Promise(function (res, rej) {
			var s = document.createElement("script");
			s.src = src; s.integrity = sri; s.crossOrigin = "anonymous"; s.onload = res; s.onerror = rej;
			document.head.appendChild(s);
		});
	}
	function material(key, m) { if (!mats[key]) { mats[key] = new p2.Material(); mats[key].m = m; } return mats[key]; }
	var paired = {};
	function pairs() {
		var keys = Object.keys(mats);
		keys.forEach(function (a, i) { keys.slice(i).forEach(function (b) {
			if (paired[a + "|" + b]) return;
			paired[a + "|" + b] = true;
			var A = mats[a], B = mats[b];
			world.addContactMaterial(new p2.ContactMaterial(A, B, { friction: Math.min(A.m.friction, B.m.friction), restitution: Math.max(A.m.restitution, B.m.restitution) }));
		}); });
	}
	function dampPerSecond(d) { return Math.min(0.95, 1 - Math.exp(-d)); }
	function boxShape(w, h, m, key) { var s = new p2.Box({ width: w / P, height: h / P }); s.material = material(key, m); return s; }
	function binParts(b, w, h, k, m) {
		b.shapes.slice().forEach(function (s) { b.removeShape(s); });
		[[0, h / 2 - k / 2, w, k], [-w / 2 + k / 2, 0, k, h], [w / 2 - k / 2, 0, k, h]].forEach(function (r) { b.addShape(boxShape(r[2], r[3], m, "bin"), [r[0] / P, r[1] / P]); });
		b.mass = m.density * (w * k + 2 * k * h) / (P * P) * 4; b.updateMassProperties();
	}
	function worldPolys(skip) {
		var out = [];
		world.bodies.forEach(function (b) {
			if (b === skip) return;
			b.shapes.forEach(function (s) {
				if (!s.vertices) return;
				var c = Math.cos(b.angle), sn = Math.sin(b.angle), sc = Math.cos(s.angle), ss = Math.sin(s.angle);
				out.push(s.vertices.map(function (v) {
					var lx = s.position[0] + v[0] * sc - v[1] * ss, ly = s.position[1] + v[0] * ss + v[1] * sc;
					return { x: (b.position[0] + lx * c - ly * sn) * P, y: (b.position[1] + lx * sn + ly * c) * P };
				}));
			});
		});
		return out;
	}
	function pv(b, p) { var r = [p[0] - b.position[0], p[1] - b.position[1]]; return [b.velocity[0] - b.angularVelocity * r[1], b.velocity[1] + b.angularVelocity * r[0]]; }
	window.LF_ENGINE = {
		name: "p2.js 0.7.1",
		load: function () { return loading || (loading = window.p2 ? Promise.resolve() : script(SRC, SRI)); },
		create: function (v) {
			p2 = window.p2; V = v; sub = v.substeps || 1;
			world = new p2.World({ gravity: [0, v.gravity / P] }); mats = {}; paired = {};
			world.sleepMode = v.sleep === false ? p2.World.NO_SLEEPING : p2.World.BODY_SLEEPING;
			world.solver.iterations = v.velIter || 10;
			ground = new p2.Body({ mass: 0 }); world.addBody(ground);
		},
		clearStatics: function () {
			statics.forEach(function (b) { world.removeBody(b); }); statics = [];
		},
		addStaticBox: function (x, y, w, h, m) { var b = new p2.Body({ mass: 0, position: [x / P, y / P] }); b.addShape(boxShape(w, h, m, "wall")); world.addBody(b); statics.push(b); pairs(); },
		addLetter: function (outline, hulls, m, isL) {
			hulls.forEach(function (h) {
				var cx = 0, cy = 0; h.forEach(function (p) { cx += p.x; cy += p.y; }); cx /= h.length; cy /= h.length;
				var verts = h.map(function (p) { return [(p.x - cx) / P, (p.y - cy) / P]; }), area = 0;
				for (var i = 0; i < verts.length; i++) { var a = verts[i], b2 = verts[(i + 1) % verts.length]; area += a[0] * b2[1] - b2[0] * a[1]; }
				if (area < 0) verts.reverse();
				var body = new p2.Body({ mass: 0, position: [cx / P, cy / P] }), s = new p2.Convex({ vertices: verts });
				s.material = material("letter", m); s.collisionGroup = isL ? G_L : G_ALL; s.collisionMask = MASK_ALL;
				body.addShape(s); world.addBody(body); statics.push(body);
			});
			pairs();
		},
		addBox: function (w, h, x, y, a, m) {
			var b = new p2.Body({ mass: m.density * w * h / (P * P) * 4, position: [x / P, y / P], angle: a || 0, damping: dampPerSecond(m.damp), angularDamping: dampPerSecond(m.angDamp) });
			b.addShape(boxShape(w, h, m, "file"));
			b.ccdSpeedThreshold = 6; b.ccdIterations = 10;
			b.allowSleep = V.sleep !== false; b.sleepSpeedLimit = V.sleepSpeed || 0.1; b.sleepTimeLimit = V.sleepTime || 0.5;
			world.addBody(b); pairs();
			return b;
		},
		addBin: function (x, y, w, h, k, m) {
			var b = new p2.Body({ mass: 1, position: [x / P, y / P], damping: dampPerSecond(m.damp), angularDamping: dampPerSecond(m.angDamp) });
			binParts(b, w, h, k, m);
			b.allowSleep = V.sleep !== false; b.sleepSpeedLimit = V.sleepSpeed || 0.1; b.sleepTimeLimit = V.sleepTime || 0.5;
			world.addBody(b); pairs();
			return b;
		},
		remove: function (b) { drags = drags.filter(function (d) { return d.b !== b; }); world.removeBody(b); },
		pos: function (b) { return { x: b.position[0] * P, y: b.position[1] * P }; },
		angle: function (b) { return b.angle; },
		vel: function (b) { return { x: b.velocity[0] * P / 60, y: b.velocity[1] * P / 60 }; },
		pointVel: function (b, p) { var v = pv(b, [p.x / P, p.y / P]); return { x: v[0] * P / 60, y: v[1] * P / 60 }; },
		setVel: function (b, v) { b.velocity[0] = v.x * 60 / P; b.velocity[1] = v.y * 60 / P; },
		spin: function (b) { return b.angularVelocity / 60; },
		setSpin: function (b, w) { b.angularVelocity = w * 60; },
		speed: function (b) { return Math.hypot(b.velocity[0], b.velocity[1]) * P / 60; },
		setPose: function (b, x, y, a) { b.position[0] = x / P; b.position[1] = y / P; b.angle = a; b.previousPosition[0] = b.position[0]; b.previousPosition[1] = b.position[1]; b.previousAngle = a; },
		resizeBox: function (b, w, h, m) { b.shapes.slice().forEach(function (s) { b.removeShape(s); }); b.addShape(boxShape(w, h, m, "file")); b.mass = m.density * w * h / (P * P) * 4; b.updateMassProperties(); },
		resizeBin: function (b, w, h, k, m) { binParts(b, w, h, k, m); },
		wake: function (b) { b.wakeUp(); },
		asleep: function (b) { return V.sleep === false ? null : b.sleepState === p2.Body.SLEEPING; },
		centreOfMass: function (b) { return this.pos(b); },
		hinge: function (b, p) { var c = new p2.RevoluteConstraint(ground, b, { worldPivot: [p.x / P, p.y / P] }); world.addConstraint(c); return { joint: c }; },
		passOverL: function (b, on) { b.shapes.forEach(function (s) { s.collisionMask = on ? MASK_ALL & ~G_L : MASK_ALL; }); },
		drag: function (b, p, d) {
			var dx = p.x / P - b.position[0], dy = p.y / P - b.position[1], c = Math.cos(-b.angle), s = Math.sin(-b.angle);
			var j = { drag: true, b: b, local: [dx * c - dy * s, dx * s + dy * c], target: [p.x / P, p.y / P], d: d };
			drags.push(j);
			return j;
		},
		dragTarget: function (j, p) { j.target = [p.x / P, p.y / P]; },
		removeJoint: function (j) { if (j.drag) drags = drags.filter(function (x) { return x !== j; }); else world.removeConstraint(j.joint); },
		overlapsBox: function (w, h, x, y, a, skip) {
			var box = LF_COMMON.corners(x, y, w, h, a);
			return worldPolys(skip).some(function (poly) { return LF_COMMON.overlap(box, poly); });
		},
		step: function () {
			var dt = 1 / 60 / sub;
			for (var i = 0; i < sub; i++) {
				drags.forEach(function (j) {
					var b = j.b, c = Math.cos(b.angle), s = Math.sin(b.angle);
					var r = [j.local[0] * c - j.local[1] * s, j.local[0] * s + j.local[1] * c], p = [b.position[0] + r[0], b.position[1] + r[1]], v = pv(b, p);
					var imp = LF_COMMON.spring(b.mass, { x: j.target[0] - p[0], y: j.target[1] - p[1] }, { x: v[0], y: v[1] }, j.d.k, j.d.c, dt, j.d.force * b.mass * V.gravity / P);
					b.applyImpulse([imp.x, imp.y], r);
					b.wakeUp();
				});
				world.step(dt);
			}
		}
	};
})();
