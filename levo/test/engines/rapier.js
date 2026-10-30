/*
 * The footer physics test: Rapier 2D 0.21 (jsDelivr, pinned; the compat build embeds its WASM).
 * Letters are polylines along their real outlines; continuous collision; sleeping; a revolute
 * joint for the lean; the drag is a damped spring at the grab point (Rapier has no mouse joint).
 */
(function () {
	"use strict";
	var SRC = "https://cdn.jsdelivr.net/npm/@dimforge/rapier2d-compat@0.21.0/dist/rapier.mjs";
	var P = 40, R, world, ground, V, sub = 1, loading = null, drags = [];
	var G_ALL = 0xFFFFFFFF, G_L = (0x0002 << 16) | 0xFFFF, G_PASS = (0x0001 << 16) | (0xFFFF & ~0x0002), G_BIN = (0x0001 << 16) | 0xFFFF;
	function mat(d, m) { return d.setFriction(m.friction).setRestitution(m.restitution); }
	function binParts(b, w, h, k, m) {
		while (b.numColliders()) world.removeCollider(b.collider(0), false);
		[[0, h / 2 - k / 2, w, k], [-w / 2 + k / 2, 0, k, h], [w / 2 - k / 2, 0, k, h]].forEach(function (r) {
			world.createCollider(mat(R.ColliderDesc.cuboid(r[2] / 2 / P, r[3] / 2 / P).setTranslation(r[0] / P, r[1] / P).setDensity(m.density), m).setCollisionGroups(G_BIN), b);
		});
	}
	function com(b) { var c = b.worldCom ? b.worldCom() : b.translation(); return c; }
	function pv(b, p) { var v = b.linvel(), w = b.angvel(), c = com(b); return { x: v.x - w * (p.y - c.y), y: v.y + w * (p.x - c.x) }; }
	window.LF_ENGINE = {
		name: "Rapier 2D 0.21",
		load: function () {
			return loading || (loading = import(SRC).then(function (m) { R = m.default || m; return R.init(); }));
		},
		create: function (v) {
			V = v; sub = v.substeps || 1;
			world = new R.World({ x: 0, y: v.gravity / P });
			world.timestep = 1 / 60 / sub;
			if (v.velIter && world.integrationParameters) world.integrationParameters.numSolverIterations = v.velIter;
			ground = world.createRigidBody(R.RigidBodyDesc.fixed());
		},
		clearStatics: function () { if (ground) world.removeRigidBody(ground); ground = world.createRigidBody(R.RigidBodyDesc.fixed()); },
		addStaticBox: function (x, y, w, h, m) { world.createCollider(mat(R.ColliderDesc.cuboid(w / 2 / P, h / 2 / P).setTranslation(x / P, y / P), m), ground); },
		addLetter: function (outline, hulls, m, isL) {
			var pts = new Float32Array(outline.length * 2);
			outline.forEach(function (p, i) { pts[i * 2] = p.x / P; pts[i * 2 + 1] = p.y / P; });
			world.createCollider(mat(R.ColliderDesc.polyline(pts), m).setCollisionGroups(isL ? G_L : G_ALL), ground);
		},
		addBox: function (w, h, x, y, a, m) {
			var b = world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(x / P, y / P).setRotation(a || 0).setLinearDamping(m.damp).setAngularDamping(m.angDamp).setCcdEnabled(true).setCanSleep(V.sleep !== false));
			world.createCollider(mat(R.ColliderDesc.cuboid(w / 2 / P, h / 2 / P).setDensity(m.density), m), b);
			return b;
		},
		addBin: function (x, y, w, h, k, m) {
			var b = world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(x / P, y / P).setLinearDamping(m.damp).setAngularDamping(m.angDamp).setCcdEnabled(true).setCanSleep(V.sleep !== false));
			binParts(b, w, h, k, m);
			return b;
		},
		remove: function (b) { drags = drags.filter(function (d) { return d.b !== b; }); world.removeRigidBody(b); },
		pos: function (b) { var t = b.translation(); return { x: t.x * P, y: t.y * P }; },
		angle: function (b) { return b.rotation(); },
		vel: function (b) { var v = pv(b, b.translation()); return { x: v.x * P / 60, y: v.y * P / 60 }; },
		pointVel: function (b, p) { var v = pv(b, { x: p.x / P, y: p.y / P }); return { x: v.x * P / 60, y: v.y * P / 60 }; },
		setVel: function (b, v) {
			var w = b.angvel(), c = com(b), o = b.translation();
			b.setLinvel({ x: v.x * 60 / P - w * (c.y - o.y), y: v.y * 60 / P + w * (c.x - o.x) }, true);
		},
		spin: function (b) { return b.angvel() / 60; },
		setSpin: function (b, w) { b.setAngvel(w * 60, true); },
		speed: function (b) { var v = b.linvel(); return Math.hypot(v.x, v.y) * P / 60; },
		setPose: function (b, x, y, a) { b.setTranslation({ x: x / P, y: y / P }, true); b.setRotation(a, true); },
		resizeBox: function (b, w, h, m) { while (b.numColliders()) world.removeCollider(b.collider(0), false); world.createCollider(mat(R.ColliderDesc.cuboid(w / 2 / P, h / 2 / P).setDensity(m.density), m), b); },
		resizeBin: function (b, w, h, k, m) { binParts(b, w, h, k, m); },
		wake: function (b) { b.wakeUp(); },
		asleep: function (b) { return V.sleep === false ? null : b.isSleeping(); },
		centreOfMass: function (b) { var c = com(b); return { x: c.x * P, y: c.y * P }; },
		hinge: function (b, p) {
			var o = b.translation(), a = b.rotation(), dx = p.x / P - o.x, dy = p.y / P - o.y, c = Math.cos(-a), s = Math.sin(-a);
			return { joint: world.createImpulseJoint(R.JointData.revolute({ x: p.x / P, y: p.y / P }, { x: dx * c - dy * s, y: dx * s + dy * c }), ground, b, true) };
		},
		passOverL: function (b, on) { for (var i = 0; i < b.numColliders(); i++) b.collider(i).setCollisionGroups(on ? G_PASS : G_BIN); },
		drag: function (b, p, d) {
			var o = b.translation(), a = b.rotation(), dx = p.x / P - o.x, dy = p.y / P - o.y, c = Math.cos(-a), s = Math.sin(-a);
			var j = { drag: true, b: b, local: { x: dx * c - dy * s, y: dx * s + dy * c }, target: { x: p.x / P, y: p.y / P }, d: d };
			drags.push(j);
			return j;
		},
		dragTarget: function (j, p) { j.target = { x: p.x / P, y: p.y / P }; },
		removeJoint: function (j) { if (j.drag) drags = drags.filter(function (x) { return x !== j; }); else world.removeImpulseJoint(j.joint, true); },
		overlapsBox: function (w, h, x, y, a, skip) {
			return !!world.intersectionWithShape({ x: x / P, y: y / P }, a, new R.Cuboid(w / 2 / P, h / 2 / P), undefined, undefined, undefined, skip);
		},
		step: function () {
			for (var i = 0; i < sub; i++) {
				drags.forEach(function (j) {
					var b = j.b, o = b.translation(), a = b.rotation(), c = Math.cos(a), s = Math.sin(a);
					var p = { x: o.x + j.local.x * c - j.local.y * s, y: o.y + j.local.x * s + j.local.y * c }, v = pv(b, p);
					var imp = LF_COMMON.spring(b.mass(), { x: j.target.x - p.x, y: j.target.y - p.y }, v, j.d.k, j.d.c, world.timestep, j.d.force * b.mass() * V.gravity / P);
					b.applyImpulseAtPoint(imp, p, true);
				});
				world.step();
			}
		}
	};
})();
