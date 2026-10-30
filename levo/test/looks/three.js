/*
 * The footer physics test's 3D looks (D2 to D5): Three.js 0.186.1 (jsDelivr, pinned). The rounded
 * glyphs are traced from the same raster the colliders come from (marching squares), extruded with
 * a soft bevel, and lit by a soft key light from the top-left plus ambient light, with real soft
 * shadows. The camera is orthographic with an oblique tilt (depth goes back and up a little to the
 * right, as in D1), so the 2D physics lines up pixel for pixel. The bin and files cast their shadows
 * through textured planes at the middle of the letters' top faces; the icons themselves stay the
 * page's own crisp images on top. Only the letters' canvas fades towards the page's bottom.
 */
(function () {
	"use strict";
	var SRC = "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js";
	var T = null, loading = null;
	function load() { return loading || (loading = import(SRC).then(function (m) { T = m; })); }

	// ---------------------------------------------------------------- Outlines from a raster

	// Closed contours where the mask crosses half, as loops of points in pixels (marching squares).
	function trace(alpha, w, h) {
		function v(x, y) { return x < 0 || y < 0 || x >= w || y >= h ? 0 : alpha[(y * w + x) * 4 + 3] / 255; }
		var segs = [], keyOf = function (p) { return (Math.round(p.x * 100)) + "," + (Math.round(p.y * 100)); };
		function lerp(x0, y0, a0, x1, y1, a1) { var t = (0.5 - a0) / (a1 - a0 || 1e-6); return { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t }; }
		for (var y = -1; y < h; y++) {
			for (var x = -1; x < w; x++) {
				var a = v(x, y), b = v(x + 1, y), c = v(x + 1, y + 1), d = v(x, y + 1);
				var k = (a >= 0.5 ? 8 : 0) | (b >= 0.5 ? 4 : 0) | (c >= 0.5 ? 2 : 0) | (d >= 0.5 ? 1 : 0);
				if (k === 0 || k === 15) continue;
				var T0 = lerp(x, y, a, x + 1, y, b), R = lerp(x + 1, y, b, x + 1, y + 1, c), B = lerp(x, y + 1, d, x + 1, y + 1, c), L = lerp(x, y, a, x, y + 1, d);
				var center = (a + b + c + d) / 4 >= 0.5;
				switch (k) {
					case 1: case 14: segs.push([L, B]); break;
					case 2: case 13: segs.push([B, R]); break;
					case 3: case 12: segs.push([L, R]); break;
					case 4: case 11: segs.push([T0, R]); break;
					case 6: case 9: segs.push([T0, B]); break;
					case 7: case 8: segs.push([L, T0]); break;
					case 5: if (center) { segs.push([L, T0]); segs.push([B, R]); } else { segs.push([L, B]); segs.push([T0, R]); } break;
					case 10: if (center) { segs.push([T0, R]); segs.push([L, B]); } else { segs.push([L, T0]); segs.push([B, R]); } break;
				}
			}
		}
		var ends = {};
		segs.forEach(function (s, i) { [0, 1].forEach(function (e) { var k2 = keyOf(s[e]); (ends[k2] = ends[k2] || []).push(i); }); });
		var used = new Uint8Array(segs.length), loops = [];
		for (var i = 0; i < segs.length; i++) {
			if (used[i]) continue;
			used[i] = 1;
			var loop = [segs[i][0], segs[i][1]], cur = segs[i][1];
			for (var guard = 0; guard < segs.length; guard++) {
				var list = ends[keyOf(cur)] || [], next = -1;
				for (var j = 0; j < list.length; j++) if (!used[list[j]]) { next = list[j]; break; }
				if (next < 0) break;
				used[next] = 1;
				var s2 = segs[next], far = keyOf(s2[0]) === keyOf(cur) ? s2[1] : s2[0];
				loop.push(far); cur = far;
			}
			if (loop.length > 8) loops.push(loop);
		}
		return loops;
	}
	function simplify(p, tol) {
		if (p.length < 3) return p.slice();
		var a = p[0], b = p[p.length - 1], dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, far = 0, at = 0;
		for (var i = 1; i < p.length - 1; i++) { var d = Math.abs(dy * p[i].x - dx * p[i].y + b.x * a.y - b.y * a.x) / len; if (d > far) { far = d; at = i; } }
		if (far <= tol) return [a, b];
		return simplify(p.slice(0, at + 1), tol).slice(0, -1).concat(simplify(p.slice(at), tol));
	}
	function closedSimplify(loop, tol) { var half = loop.length >> 1; return simplify(loop.slice(0, half + 1), tol).slice(0, -1).concat(simplify(loop.slice(half), tol).slice(0, -1)); }
	function inside(pt, poly) {
		var c = false;
		for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
			if ((poly[i].y > pt.y) !== (poly[j].y > pt.y) && pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x) c = !c;
		}
		return c;
	}

	// Smooth normals across faces that meet at less than `deg` degrees (rounded sides read as round),
	// keeping sharper edges crisp. ExtrudeGeometry is non-indexed, so this groups by position.
	function smooth(geo, deg) {
		geo.computeVertexNormals();
		var pos = geo.attributes.position, nor = geo.attributes.normal, n = pos.count, cos = Math.cos(deg * Math.PI / 180), groups = new Map();
		for (var i = 0; i < n; i++) {
			var k = Math.round(pos.getX(i) * 20) + "," + Math.round(pos.getY(i) * 20) + "," + Math.round(pos.getZ(i) * 20);
			var g = groups.get(k); if (!g) groups.set(k, g = []); g.push(i);
		}
		var out = new Float32Array(n * 3);
		groups.forEach(function (g) {
			g.forEach(function (i) {
				var ax = nor.getX(i), ay = nor.getY(i), az = nor.getZ(i), sx = 0, sy = 0, sz = 0;
				g.forEach(function (j) { var bx = nor.getX(j), by = nor.getY(j), bz = nor.getZ(j); if (ax * bx + ay * by + az * bz >= cos) { sx += bx; sy += by; sz += bz; } });
				var l = Math.hypot(sx, sy, sz) || 1;
				out[i * 3] = sx / l; out[i * 3 + 1] = sy / l; out[i * 3 + 2] = sz / l;
			});
		});
		geo.setAttribute("normal", new T.BufferAttribute(out, 3));
	}

	// ---------------------------------------------------------------- The scene

	var LOOKS = {
		d2: { name: "soft studio", make: function (light) { return new T.MeshStandardMaterial({ color: light ? 0xF1F1F3 : 0x2A2A2F, roughness: 0.78, metalness: 0 }); } },
		d3: { name: "matte clay", make: function (light) { return new T.MeshLambertMaterial({ color: light ? 0xE7E5E2 : 0x37373B }); } },
		d4: { name: "frosted glass", make: function (light, depth) { return new T.MeshPhysicalMaterial({ color: light ? 0xF6F8FA : 0x3B4048, transmission: 0.65, roughness: 0.42, thickness: depth, ior: 1.25, metalness: 0 }); } },
		d5: { name: "soft satin", make: function (light) { return new T.MeshPhysicalMaterial({ color: light ? 0xE9E8EC : 0x2E2E34, roughness: 0.34, metalness: 0, sheen: 1, sheenRoughness: 0.45, sheenColor: new T.Color(0xffffff), clearcoat: 0.35, clearcoatRoughness: 0.35 }); } }
	};

	function Look3D(opts) {
		this.o = opts; this.ready = false; this.textures = {}; this.proxies = new Map();
	}
	Look3D.prototype.init = function () {
		var self = this;
		return load().then(function () {
			var o = self.o;
			self.renderer = new T.WebGLRenderer({ antialias: true, alpha: false });
			self.renderer.shadowMap.enabled = true;
			self.renderer.shadowMap.type = T.VSMShadowMap;
			self.renderer.outputColorSpace = T.SRGBColorSpace;
			var cv = self.renderer.domElement;
			cv.className = "lf-word3d";
			cv.setAttribute("aria-hidden", "true");
			o.stage.insertBefore(cv, o.word.nextSibling);
			self.ready = true;
		});
	};
	// The letters: traced, extruded, lit; the floor that takes shadows; the light and camera.
	Look3D.prototype.build = function (g) {
		if (!this.ready) return;
		var o = this.o, W = g.W, H = g.H, D = g.depth, light = !document.documentElement.classList.contains("dark");
		var dpr = Math.min(2, window.devicePixelRatio || 1);
		this.renderer.setPixelRatio(dpr);
		this.renderer.setSize(W, H, false);
		var cv = this.renderer.domElement;
		cv.style.width = W + "px"; cv.style.height = H + "px";
		this.renderer.setClearColor(light ? 0xF7F7F7 : 0x070707, 1);
		var scene = this.scene = new T.Scene();
		// Camera: orthographic over the stage (world x = page x, world y = -page y), sheared so depth
		// (-z) goes up and a little to the right on screen.
		var cam = this.camera = new T.OrthographicCamera(0, W, 0, -H, -6000, 6000);
		cam.position.set(0, 0, 0);
		cam.updateMatrixWorld();
		cam.updateProjectionMatrix();
		var shear = new T.Matrix4().set(1, 0, -g.ux, 0, 0, 1, -g.uy, 0, 0, 0, 1, 0, 0, 0, 0, 1);
		cam.projectionMatrix.multiply(shear);
		cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
		// Light: soft and from the top-left, a little in front; and ambient for the shadowed sides.
		scene.add(new T.HemisphereLight(0xffffff, light ? 0xe4e4e8 : 0x26262b, light ? 1.75 : 1.05));
		var key = this.key = new T.DirectionalLight(0xffffff, light ? 1.55 : 1.45);
		key.position.set(W * 0.2 - W * 1.3, -g.top + H * 0.95, H * 0.55);
		key.target.position.set(W * 0.45, -g.top - H * 0.2, -D);
		scene.add(key); scene.add(key.target);
		key.castShadow = true;
		key.shadow.mapSize.set(2048, 2048);
		var sc = key.shadow.camera; sc.left = -W; sc.right = W; sc.top = H * 1.4; sc.bottom = -H * 1.4; sc.near = 1; sc.far = H * 6 + W * 2;
		key.shadow.bias = -0.0006; key.shadow.normalBias = 0.8; key.shadow.radius = 14; key.shadow.blurSamples = 20;
		// Letters from the glyphs' own raster.
		var mask = document.createElement("canvas"); mask.width = W; mask.height = H;
		var m = mask.getContext("2d", { willReadFrequently: true });
		m.font = g.font; m.fillStyle = "#000";
		g.glyphs.forEach(function (gl) { m.fillText(gl.ch, gl.x, g.base); });
		var loops = trace(m.getImageData(0, 0, W, H).data, W, H).map(function (l) { return closedSimplify(l, 0.6); }).filter(function (l) { return l.length > 4; });
		var shapes = [];
		loops.forEach(function (l, i) {
			var depth = loops.filter(function (q, j) { return j !== i && inside(l[0], q); }).length;
			if (depth % 2) return;
			var sh = new T.Shape(l.map(function (p) { return new T.Vector2(p.x, -p.y); }));
			loops.forEach(function (q, j) { if (j !== i && inside(q[0], l) && loops.filter(function (r, k) { return k !== j && inside(q[0], r); }).length === depth + 1) sh.holes.push(new T.Path(q.map(function (p) { return new T.Vector2(p.x, -p.y); }))); });
			shapes.push(sh);
		});
		var bevel = Math.min(D * 0.28, 5);
		var geo = new T.ExtrudeGeometry(shapes, { depth: D, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: 4, curveSegments: 6 });
		geo.translate(0, 0, -D - bevel);
		smooth(geo, 50);
		var mat = LOOKS[o.look].make(light, D);
		var mesh = new T.Mesh(geo, mat);
		mesh.castShadow = true; mesh.receiveShadow = true;
		scene.add(mesh);
		// The floor: the page's bottom edge as a ground that only shows shadows.
		// Only as deep as the letters, so its far edge doesn't show above them through the tilt.
		var floor = new T.Mesh(new T.PlaneGeometry(W * 3, D * 2.2), new T.ShadowMaterial({ opacity: light ? 0.08 : 0.25 }));
		floor.rotation.x = -Math.PI / 2;
		floor.position.set(W / 2, -g.floor, -D * 0.6);
		floor.receiveShadow = true;
		scene.add(floor);
		this.g = g;
		this.proxies.forEach(function (p) { scene.add(p.mesh); });
		cv.style.webkitMaskImage = cv.style.maskImage = "linear-gradient(to bottom, #000 " + Math.round(g.top - D) + "px, rgba(0,0,0,.85) " + Math.round(g.top + (H - g.top) * 0.35) + "px, transparent " + H + "px)";
		this.render();
	};
	Look3D.prototype.texture = function (src) {
		if (!this.textures[src]) { var t = new T.TextureLoader().load(src, this.render.bind(this)); t.colorSpace = T.SRGBColorSpace; this.textures[src] = t; }
		return this.textures[src];
	};
	// A body's shadow caster: a plane the size of its image with the image's alpha, invisible itself.
	Look3D.prototype.proxy = function (key, src, size) {
		var p = this.proxies.get(key);
		if (!p) {
			var tex = this.texture(src);
			var mat = new T.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.5, colorWrite: false, depthWrite: false });
			var mesh = new T.Mesh(new T.PlaneGeometry(1, 1), mat);
			mesh.castShadow = true;
			mesh.customDepthMaterial = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, map: tex, alphaTest: 0.5 });
			p = { mesh: mesh, src: src };
			this.proxies.set(key, p);
			if (this.scene) this.scene.add(mesh);
		}
		if (p.src !== src) { var t2 = this.texture(src); p.mesh.material.map = t2; p.mesh.customDepthMaterial.map = t2; p.mesh.material.needsUpdate = true; p.mesh.customDepthMaterial.needsUpdate = true; p.src = src; }
		p.mesh.scale.set(size, size, 1);
		return p;
	};
	// Place a caster where its body is on screen, at the middle of the letters' top faces.
	Look3D.prototype.place = function (key, src, size, x, y, angle, visible) {
		if (!this.ready || !this.g) return;
		var p = this.proxy(key, src, size), z = -this.g.depth * 0.55;
		p.mesh.visible = visible;
		p.mesh.position.set(x + this.g.ux * z, -y + this.g.uy * z, z);
		p.mesh.rotation.z = -angle;
	};
	Look3D.prototype.render = function () { if (this.ready && this.scene) this.renderer.render(this.scene, this.camera); };
	window.LF_LOOK3D = { create: function (opts) { return new Look3D(opts); }, names: { d2: "soft studio", d3: "matte clay", d4: "frosted glass", d5: "soft satin" } };
})();
