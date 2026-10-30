/*
 * The footer physics test: Box2D v3 (box2d3-wasm 6.0.0, the compat WASM build, jsDelivr, pinned).
 * Soft step solver with substeps, continuous collision and sleeping. Letters are segments along
 * their real outlines. A revolute joint for the lean; the drag is a motor joint's linear spring at
 * the grab point; spawn overlap is checked on the shapes' outlines.
 */
(function () {
	"use strict";
	var SRC = "https://cdn.jsdelivr.net/npm/box2d3-wasm@6.0.0/build/dist/es/compat/Box2D.compat.mjs";
	var P = 40, B, wid, ground, V, loading = null, drags = [], statics = [], dyn = [], L_CAT = 0x0002;
	function take(o) { var r = { x: o.x, y: o.y }; if (o.delete) o.delete(); return r; }
	function vec(x, y) { return new B.b2Vec2(x, y); }
	function rot(a) { var r = new B.b2Rot(); r.SetAngle(a); return r; }
	function shapeDef(m, density, cat) {
		var sd = B.b2DefaultShapeDef();
		sd.material.friction = m.friction; sd.material.restitution = m.restitution;
		if (density != null) sd.density = density;
		if (cat) sd.filter.categoryBits = cat;
		return sd;
	}
	function addBoxes(h, boxes, m) {
		h.shapes = boxes.map(function (r) {
			var c = vec(r.x / P, r.y / P), q = rot(0), sd = shapeDef(m, m.density);
			var id = B.b2CreatePolygonShape(h.id, sd, B.b2MakeOffsetBox(r.w / 2 / P, r.h / 2 / P, c, q));
			return id;
		});
		h.boxes = boxes;
	}
	function dropShapes(h) { (h.shapes || []).forEach(function (s) { B.b2DestroyShape(s, true); }); h.shapes = []; }
	function body(x, y, a, m, bullet) {
		var bd = B.b2DefaultBodyDef();
		bd.type = B.b2BodyType.b2_dynamicBody;
		bd.position = vec(x / P, y / P); bd.rotation = rot(a || 0);
		bd.linearDamping = m.damp; bd.angularDamping = m.angDamp;
		bd.enableSleep = V.sleep !== false; bd.isBullet = !!bullet;
		if (V.sleepLin != null) bd.sleepThreshold = V.sleepLin;
		var h = { id: B.b2CreateBody(wid, bd) };
		dyn.push(h);
		return h;
	}
	function pose(h) { var p = take(B.b2Body_GetPosition(h.id)), r = B.b2Body_GetRotation(h.id), a = B.b2Rot_GetAngle(r); if (r.delete) r.delete(); return { x: p.x, y: p.y, a: a }; }
	function ptVel(h, x, y) { return take(B.b2Body_GetWorldPointVelocity(h.id, vec(x, y))); }
	window.LF_ENGINE = {
		name: "Box2D v3 (box2d3-wasm 6.0.0)",
		load: function () { return loading || (loading = import(SRC).then(function (m) { return m.default(); }).then(function (b) { B = b; })); },
		create: function (v) {
			V = v;
			var wd = B.b2DefaultWorldDef(); wd.gravity.Set(0, v.gravity / P);
			if (v.contactHertz) wd.contactHertz = v.contactHertz;
			wd.enableSleep = v.sleep !== false;
			wid = B.b2CreateWorld(wd);
			ground = B.b2CreateBody(wid, B.b2DefaultBodyDef());
		},
		clearStatics: function () { if (ground) B.b2DestroyBody(ground); ground = B.b2CreateBody(wid, B.b2DefaultBodyDef()); statics = []; },
		addStaticBox: function (x, y, w, h, m) {
			B.b2CreatePolygonShape(ground, shapeDef(m), B.b2MakeOffsetBox(w / 2 / P, h / 2 / P, vec(x / P, y / P), rot(0)));
			statics.push(LF_COMMON.corners(x, y, w, h, 0));
		},
		addLetter: function (outline, hulls, m, isL) {
			var sd = shapeDef(m, null, isL ? L_CAT : 0x0001);
			for (var i = 0; i + 1 < outline.length; i++) {
				var s = new B.b2Segment(); s.point1 = vec(outline[i].x / P, outline[i].y / P); s.point2 = vec(outline[i + 1].x / P, outline[i + 1].y / P);
				B.b2CreateSegmentShape(ground, sd, s);
				statics.push([outline[i], outline[i + 1]]);
			}
		},
		addBox: function (w, h, x, y, a, m) { var b = body(x, y, a, m, V.bullet); addBoxes(b, [{ x: 0, y: 0, w: w, h: h }], m); return b; },
		addBin: function (x, y, w, h, k, m) {
			var b = body(x, y, 0, m);
			addBoxes(b, [{ x: 0, y: h / 2 - k / 2, w: w, h: k }, { x: -w / 2 + k / 2, y: 0, w: k, h: h }, { x: w / 2 - k / 2, y: 0, w: k, h: h }], m);
			return b;
		},
		remove: function (h) { drags = drags.filter(function (d) { return d.b !== h; }); dyn = dyn.filter(function (x) { return x !== h; }); B.b2DestroyBody(h.id); },
		pos: function (h) { var p = pose(h); return { x: p.x * P, y: p.y * P }; },
		angle: function (h) { return pose(h).a; },
		vel: function (h) { var p = pose(h), v = ptVel(h, p.x, p.y); return { x: v.x * P / 60, y: v.y * P / 60 }; },
		pointVel: function (h, p) { var v = ptVel(h, p.x / P, p.y / P); return { x: v.x * P / 60, y: v.y * P / 60 }; },
		setVel: function (h, v) {
			var o = pose(h), c = take(B.b2Body_GetWorldCenter(h.id)), w = B.b2Body_GetAngularVelocity(h.id);
			B.b2Body_SetLinearVelocity(h.id, vec(v.x * 60 / P - w * (c.y - o.y), v.y * 60 / P + w * (c.x - o.x)));
		},
		spin: function (h) { return B.b2Body_GetAngularVelocity(h.id) / 60; },
		setSpin: function (h, w) { B.b2Body_SetAngularVelocity(h.id, w * 60); },
		speed: function (h) { var v = take(B.b2Body_GetLinearVelocity(h.id)); return Math.hypot(v.x, v.y) * P / 60; },
		setPose: function (h, x, y, a) { B.b2Body_SetTransform(h.id, vec(x / P, y / P), rot(a)); },
		resizeBox: function (h, w, hh, m) { dropShapes(h); addBoxes(h, [{ x: 0, y: 0, w: w, h: hh }], m); },
		resizeBin: function (h, w, hh, k, m) { dropShapes(h); addBoxes(h, [{ x: 0, y: hh / 2 - k / 2, w: w, h: k }, { x: -w / 2 + k / 2, y: 0, w: k, h: hh }, { x: w / 2 - k / 2, y: 0, w: k, h: hh }], m); },
		wake: function (h) { B.b2Body_SetAwake(h.id, true); },
		asleep: function (h) { return V.sleep === false ? null : !B.b2Body_IsAwake(h.id); },
		centreOfMass: function (h) { var c = take(B.b2Body_GetWorldCenter(h.id)); return { x: c.x * P, y: c.y * P }; },
		// Box2D's revolute joint at the foot holds the leaning bin where it stands.
		hinge: function (h, p) {
			var o = pose(h), dx = p.x / P - o.x, dy = p.y / P - o.y, c = Math.cos(-o.a), s = Math.sin(-o.a);
			var d = B.b2DefaultRevoluteJointDef();
			d.base.bodyIdA = ground; d.base.bodyIdB = h.id;
			d.base.localFrameA.p.Set(p.x / P, p.y / P);
			d.base.localFrameB.p.Set(dx * c - dy * s, dx * s + dy * c);
			return { joint: B.b2CreateRevoluteJoint(wid, d) };
		},
		passOverL: function (h, on) {
			(h.shapes || []).forEach(function (s) { var f = B.b2Shape_GetFilter(s); f.maskBits = on ? 0xFFFFFFFF & ~L_CAT : 0xFFFFFFFF; B.b2Shape_SetFilter(s, f); });
		},
		// The drag: Box2D v3's motor joint, a linear spring (frequency, damping, force) from a frame on
		// the ground that follows the pointer to the grab point on the body; it doesn't hold rotation,
		// so the body hangs and swings.
		drag: function (h, p, d) {
			var o = pose(h), dx = p.x / P - o.x, dy = p.y / P - o.y, c = Math.cos(-o.a), s = Math.sin(-o.a), m = B.b2Body_GetMass(h.id);
			var def = B.b2DefaultMotorJointDef();
			def.base.bodyIdA = ground; def.base.bodyIdB = h.id;
			def.base.localFrameA.p.Set(p.x / P, p.y / P);
			def.base.localFrameB.p.Set(dx * c - dy * s, dx * s + dy * c);
			def.linearHertz = d.k; def.linearDampingRatio = d.c; def.maxSpringForce = d.force * m * V.gravity / P;
			def.angularHertz = 0; def.maxSpringTorque = 0; def.maxVelocityForce = 0; def.maxVelocityTorque = 0;
			B.b2Body_SetAwake(h.id, true);
			return { joint: B.b2CreateMotorJoint(wid, def), b: h };
		},
		dragTarget: function (j, p) {
			var t = new B.b2Transform(); t.p.Set(p.x / P, p.y / P); t.q = rot(0);
			B.b2Joint_SetLocalFrameA(j.joint, t);
			B.b2Body_SetAwake(j.b.id, true);
		},
		removeJoint: function (j) { B.b2DestroyJoint(j.joint); },
		overlapsBox: function (w, h, x, y, a, skip) {
			var box = LF_COMMON.corners(x, y, w, h, a);
			if (statics.some(function (poly) { return LF_COMMON.overlap(box, poly); })) return true;
			return dyn.some(function (d) {
				if (d === skip || !d.boxes) return false;
				var o = pose(d);
				return d.boxes.some(function (r) {
					var c = Math.cos(o.a), s = Math.sin(o.a);
					return LF_COMMON.overlap(box, LF_COMMON.corners(o.x * P + r.x * c - r.y * s, o.y * P + r.x * s + r.y * c, r.w, r.h, o.a));
				});
			});
		},
		step: function () {
			B.b2World_Step(wid, 1 / 60, V.substeps || 4);
		}
	};
})();
