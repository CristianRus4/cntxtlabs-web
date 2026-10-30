/*
 * The footer physics test: Matter.js 0.20.0 (cdnjs, pinned). The live footer's engine. Letters are
 * convex pieces (Matter has no chains); no continuous collision; sleeping is optional.
 */
(function () {
	"use strict";
	var SRC = "https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.20.0/matter.min.js";
	var SRI = "sha384-ZRKYEXtLBVeqs9z1WxyeKutCqnkqolS/r1EUWuoUpG4ZKbnRAIXnHhHdnNuiB6CL";
	var M, engine, world, statics = [], V, sub = 1, loading = null, L_CAT = 0x0002;
	function script(src, sri) {
		return new Promise(function (res, rej) {
			var s = document.createElement("script");
			s.src = src; if (sri) { s.integrity = sri; s.crossOrigin = "anonymous"; } s.onload = res; s.onerror = rej;
			document.head.appendChild(s);
		});
	}
	function rot(a, v) { var c = Math.cos(a), s = Math.sin(a); return { x: v.x * c - v.y * s, y: v.x * s + v.y * c }; }
	function opts(mat, extra) {
		var o = { friction: mat.friction, frictionStatic: Math.max(mat.friction * 0.6, 0.05), restitution: mat.restitution };
		for (var k in extra) o[k] = extra[k];
		return o;
	}
	var E = window.LF_ENGINE = {
		name: "Matter.js 0.20.0",
		load: function () { return loading || (loading = window.Matter ? Promise.resolve() : script(SRC, SRI)); },
		create: function (v) {
			M = window.Matter; V = v; sub = v.substeps || 1;
			engine = M.Engine.create({ gravity: { x: 0, y: 1, scale: 0.0012 * v.gravity / 1200 }, positionIterations: v.posIter || 10, velocityIterations: v.velIter || 8, enableSleeping: !!v.sleep });
			world = engine.world;
		},
		clearStatics: function () { if (statics.length) M.Composite.remove(world, statics); statics = []; },
		addStaticBox: function (x, y, w, h, mat) { var b = M.Bodies.rectangle(x, y, w, h, opts(mat, { isStatic: true })); statics.push(b); M.Composite.add(world, b); },
		addLetter: function (outline, hulls, mat, isL) {
			hulls.forEach(function (h) {
				var c = M.Vertices.centre(h), b = M.Bodies.fromVertices(c.x, c.y, [h], opts(mat, { isStatic: true }));
				if (isL) b.parts.forEach(function (p) { p.collisionFilter.category = L_CAT; });
				statics.push(b); M.Composite.add(world, b);
			});
		},
		addBox: function (w, h, x, y, a, mat) {
			var b = M.Bodies.rectangle(x, y, w, h, opts(mat, { frictionAir: mat.damp / 60, density: 0.0016 * mat.density, chamfer: { radius: Math.min(w, h) * 0.06 } }));
			M.Body.setAngle(b, a || 0);
			if (V.sleepFrames) b.sleepThreshold = V.sleepFrames;
			b.w = w; b.h = h;
			M.Composite.add(world, b);
			return b;
		},
		addBin: function (x, y, w, h, k, mat) {
			var P = opts(mat, { density: 0.0016 * mat.density });
			var b = M.Body.create({ parts: [M.Bodies.rectangle(x, y + h / 2 - k / 2, w, k, P), M.Bodies.rectangle(x - w / 2 + k / 2, y, k, h, P), M.Bodies.rectangle(x + w / 2 - k / 2, y, k, h, P)],
				frictionAir: mat.damp / 60, friction: mat.friction, restitution: mat.restitution });
			b.off = { x: x - b.position.x, y: y - b.position.y };
			b.bw = w;
			if (V.sleepFrames) b.sleepThreshold = V.sleepFrames;
			M.Composite.add(world, b);
			return b;
		},
		remove: function (b) { M.Composite.remove(world, b); },
		pos: function (b) { if (!b.off) return { x: b.position.x, y: b.position.y }; var o = rot(b.angle, b.off); return { x: b.position.x + o.x, y: b.position.y + o.y }; },
		angle: function (b) { return b.angle; },
		vel: function (b) { var o = b.off ? rot(b.angle, b.off) : { x: 0, y: 0 }; return { x: b.velocity.x - b.angularVelocity * o.y, y: b.velocity.y + b.angularVelocity * o.x }; },
		pointVel: function (b, p) { var r = { x: p.x - b.position.x, y: p.y - b.position.y }; return { x: b.velocity.x - b.angularVelocity * r.y, y: b.velocity.y + b.angularVelocity * r.x }; },
		setVel: function (b, v) { M.Body.setVelocity(b, v); },
		spin: function (b) { return b.angularVelocity; },
		setSpin: function (b, w) { M.Body.setAngularVelocity(b, w); },
		speed: function (b) { return Math.hypot(b.velocity.x, b.velocity.y); },
		setPose: function (b, x, y, a) {
			M.Body.setAngle(b, a);
			var o = b.off ? rot(a, b.off) : { x: 0, y: 0 };
			M.Body.setPosition(b, { x: x - o.x, y: y - o.y });
		},
		resizeBox: function (b, w, h) { if (w !== b.w || h !== b.h) { var a = b.angle; M.Body.setAngle(b, 0); M.Body.scale(b, w / b.w, h / b.h); M.Body.setAngle(b, a); b.w = w; b.h = h; } },
		resizeBin: function (b, w) { var k = w / b.bw; if (k !== 1) { M.Body.scale(b, k, k); b.off.x *= k; b.off.y *= k; b.bw = w; } },
		wake: function (b) { if (b.isSleeping) M.Sleeping.set(b, false); },
		asleep: function (b) { return V.sleep ? !!b.isSleeping : null; },
		centreOfMass: function (b) { return { x: b.position.x, y: b.position.y }; },
		hinge: function (b, p) { var c = M.Constraint.create({ pointA: p, bodyB: b, pointB: { x: p.x - b.position.x, y: p.y - b.position.y }, length: 0, stiffness: 1, damping: 0 }); M.Composite.add(world, c); return c; },
		passOverL: function (b, on) { b.parts.forEach(function (p) { p.collisionFilter.mask = on ? 0xFFFFFFFF & ~L_CAT : 0xFFFFFFFF; }); },
		drag: function (b, p, d) { var c = M.Constraint.create({ pointA: p, bodyB: b, pointB: { x: p.x - b.position.x, y: p.y - b.position.y }, length: 0, stiffness: d.k, damping: d.c }); M.Composite.add(world, c); return c; },
		dragTarget: function (j, p) { j.pointA = p; },
		removeJoint: function (j) { M.Composite.remove(world, j); },
		overlapsBox: function (w, h, x, y, a, skip) {
			var probe = M.Bodies.rectangle(x, y, w, h, { angle: a }), list = [];
			M.Composite.allBodies(world).forEach(function (b) { if (b === skip || b.parent !== b) return; if (b.parts.length > 1) list = list.concat(b.parts.slice(1)); else list.push(b); });
			return M.Query.collides(probe, list).length > 0;
		},
		step: function () { for (var i = 0; i < sub; i++) M.Engine.update(engine, 1000 / 60 / sub); }
	};
})();
