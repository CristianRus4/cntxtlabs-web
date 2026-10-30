/*
 * The footer physics test: Planck.js 1.5.1, a Box2D 2.x port (cdnjs, pinned). Letters are chains
 * along their real outlines; continuous collision against them; sleeping and a mouse joint.
 */
(function () {
	"use strict";
	var SRC = "https://cdnjs.cloudflare.com/ajax/libs/planck-js/1.5.1/planck.min.js";
	var SRI = "sha512-nGiOcn+EAqGFIevDTKodpJBUWCj2HX7cV8hsaQ/ti7DCZUOl9Ikpzdz61Xswm0N6wD9p/8pS4iKDVvwBc6lrYQ==";
	var P = 40, pl, world, ground, V, sub = 1, loading = null, L_CAT = 0x0002;
	function script(src, sri) {
		return new Promise(function (res, rej) {
			var s = document.createElement("script");
			s.src = src; if (sri) { s.integrity = sri; s.crossOrigin = "anonymous"; } s.onload = res; s.onerror = rej;
			document.head.appendChild(s);
		});
	}
	function v2(x, y) { return pl.Vec2(x / P, y / P); }
	function fx(mat, extra) { var o = { friction: mat.friction, restitution: mat.restitution }; for (var k in extra) o[k] = extra[k]; return o; }
	function binParts(b, w, h, k, mat) {
		var f; while ((f = b.getFixtureList())) b.destroyFixture(f);
		[[0, h / 2 - k / 2, w, k], [-w / 2 + k / 2, 0, k, h], [w / 2 - k / 2, 0, k, h]].forEach(function (r) {
			b.createFixture(fx(mat, { shape: pl.Box(r[2] / 2 / P, r[3] / 2 / P, v2(r[0], r[1]), 0), density: mat.density }));
		});
	}
	window.LF_ENGINE = {
		name: "Planck.js 1.5.1",
		load: function () { return loading || (loading = window.planck ? Promise.resolve() : script(SRC, SRI)); },
		create: function (v) {
			pl = window.planck; V = v; sub = v.substeps || 1;
			if (v.sleepLin != null) pl.Settings.linearSleepTolerance = v.sleepLin;
			if (v.sleepTime != null) pl.Settings.timeToSleep = v.sleepTime;
			world = new pl.World({ gravity: pl.Vec2(0, v.gravity / P), allowSleep: v.sleep !== false });
			ground = world.createBody();
		},
		clearStatics: function () { if (ground) world.destroyBody(ground); ground = world.createBody(); },
		addStaticBox: function (x, y, w, h, mat) { ground.createFixture(fx(mat, { shape: pl.Box(w / 2 / P, h / 2 / P, v2(x, y), 0) })); },
		addLetter: function (outline, hulls, mat, isL) {
			ground.createFixture(fx(mat, { shape: pl.Chain(outline.map(function (p) { return v2(p.x, p.y); }), false), filterCategoryBits: isL ? L_CAT : 0x0001 }));
		},
		addBox: function (w, h, x, y, a, mat) {
			var b = world.createBody({ type: "dynamic", position: v2(x, y), angle: a || 0, linearDamping: mat.damp, angularDamping: mat.angDamp, bullet: !!V.bullet });
			b.createFixture(fx(mat, { shape: pl.Box(w / 2 / P, h / 2 / P), density: mat.density }));
			return b;
		},
		addBin: function (x, y, w, h, k, mat) {
			var b = world.createBody({ type: "dynamic", position: v2(x, y), linearDamping: mat.damp, angularDamping: mat.angDamp });
			binParts(b, w, h, k, mat);
			return b;
		},
		remove: function (b) { world.destroyBody(b); },
		pos: function (b) { var p = b.getPosition(); return { x: p.x * P, y: p.y * P }; },
		angle: function (b) { return b.getAngle(); },
		vel: function (b) { var v = b.getLinearVelocityFromWorldPoint(b.getPosition()); return { x: v.x * P / 60, y: v.y * P / 60 }; },
		pointVel: function (b, p) { var v = b.getLinearVelocityFromWorldPoint(v2(p.x, p.y)); return { x: v.x * P / 60, y: v.y * P / 60 }; },
		setVel: function (b, v) {
			// Sets the velocity of the origin: the centre of mass moves with the spin around it.
			var w = b.getAngularVelocity(), c = b.getWorldCenter(), o = b.getPosition();
			b.setLinearVelocity(pl.Vec2(v.x * 60 / P - w * (c.y - o.y), v.y * 60 / P + w * (c.x - o.x)));
		},
		spin: function (b) { return b.getAngularVelocity() / 60; },
		setSpin: function (b, w) { b.setAngularVelocity(w * 60); },
		speed: function (b) { var v = b.getLinearVelocity(); return Math.hypot(v.x, v.y) * P / 60; },
		setPose: function (b, x, y, a) { b.setTransform(v2(x, y), a); },
		resizeBox: function (b, w, h, mat) { b.destroyFixture(b.getFixtureList()); b.createFixture(fx(mat, { shape: pl.Box(w / 2 / P, h / 2 / P), density: mat.density })); },
		resizeBin: function (b, w, h, k, mat) { binParts(b, w, h, k, mat); },
		wake: function (b) { b.setAwake(true); },
		asleep: function (b) { return V.sleep === false ? null : !b.isAwake(); },
		centreOfMass: function (b) { var c = b.getWorldCenter(); return { x: c.x * P, y: c.y * P }; },
		hinge: function (b, p) { return world.createJoint(pl.RevoluteJoint({}, ground, b, v2(p.x, p.y))); },
		passOverL: function (b, on) { for (var f = b.getFixtureList(); f; f = f.getNext()) f.setFilterMaskBits(on ? 0xFFFF & ~L_CAT : 0xFFFF); },
		drag: function (b, p, d) { return world.createJoint(pl.MouseJoint({ maxForce: d.force * b.getMass() * V.gravity / P, frequencyHz: d.k, dampingRatio: d.c }, ground, b, v2(p.x, p.y))); },
		dragTarget: function (j, p) { j.setTarget(v2(p.x, p.y)); },
		removeJoint: function (j) { world.destroyJoint(j); },
		overlapsBox: function (w, h, x, y, a, skip) {
			var shape = pl.Box(w / 2 / P, h / 2 / P), xf = pl.Transform(v2(x, y), a), aabb = new pl.AABB(), hit = false;
			shape.computeAABB(aabb, xf, 0);
			world.queryAABB(aabb, function (f) {
				if (skip && f.getBody() === skip) return true;
				var s = f.getShape(), n = s.getChildCount();
				for (var i = 0; i < n; i++) if (pl.testOverlap(shape, 0, s, i, xf, f.getBody().getTransform())) { hit = true; return false; }
				return true;
			});
			return hit;
		},
		step: function () { for (var i = 0; i < sub; i++) world.step(1 / 60 / sub, V.velIter || 8, V.posIter || 3); }
	};
})();
