/*
 * The footer physics test: shared helpers for adapters whose engines lack a convenient overlap
 * query or mouse joint (Box2D v3, p2.js). Overlap is a separating-axis test on convex outlines in
 * pixels; the drag and the lean are a damped spring at a point, applied as impulses each step.
 */
(function () {
	"use strict";
	function corners(cx, cy, w, h, a) {
		var c = Math.cos(a), s = Math.sin(a), hw = w / 2, hh = h / 2;
		return [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(function (p) { return { x: cx + p[0] * c - p[1] * s, y: cy + p[0] * s + p[1] * c }; });
	}
	function axes(poly) {
		var out = [];
		for (var i = 0; i < poly.length; i++) {
			var p = poly[i], q = poly[(i + 1) % poly.length], dx = q.x - p.x, dy = q.y - p.y, l = Math.hypot(dx, dy);
			if (l > 1e-6) out.push({ x: -dy / l, y: dx / l });
		}
		return out;
	}
	function separated(A, B) {
		var list = axes(A).concat(axes(B));
		for (var i = 0; i < list.length; i++) {
			var n = list[i], a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
			A.forEach(function (p) { var d = p.x * n.x + p.y * n.y; if (d < a0) a0 = d; if (d > a1) a1 = d; });
			B.forEach(function (p) { var d = p.x * n.x + p.y * n.y; if (d < b0) b0 = d; if (d > b1) b1 = d; });
			if (a1 <= b0 || b1 <= a0) return true;
		}
		return false;
	}
	window.LF_COMMON = {
		corners: corners,
		overlap: function (A, B) { return !separated(A, B); },
		// A damped spring pulling a body's local point to a target: frequency hz, damping ratio z,
		// capped at max (an impulse per second, in the engine's units). Returns the impulse to apply.
		spring: function (mass, err, vel, hz, z, dt, max) {
			var w = 2 * Math.PI * hz, ix = mass * (w * w * err.x - 2 * z * w * vel.x) * dt, iy = mass * (w * w * err.y - 2 * z * w * vel.y) * dt;
			var l = Math.hypot(ix, iy), cap = max * dt;
			if (l > cap) { ix *= cap / l; iy *= cap / l; }
			return { x: ix, y: iy };
		}
	};
})();
