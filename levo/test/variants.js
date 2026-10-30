/*
 * The footer physics test's variants: an engine and what decides the feel. Gravity is pixels per
 * second squared; damping per second; drag is the engine's own joint (Matter: stiffness and damping;
 * Box2D family and Rapier: frequency in Hz, damping ratio, and force in body weights).
 */
(function () {
	"use strict";
	var base = {
		gravity: 1200, substeps: 1, fFile: 0.14, fBin: 0.3, fLetter: 0.2, rFile: 0.04, rBin: 0.03, rLetter: 0.04,
		binDensity: 2.4, linDamp: 0.4, angDamp: 0.6, sleep: true, pour: "stagger", pourEvery: 5, pourDeg: 45,
		push: 1, spill: 1, hop: 1, settle: false, cap: 7.5
	};
	function v(engine, name, o) { var r = { engine: engine, name: name }; for (var k in base) r[k] = base[k]; for (var j in o) r[j] = o[j]; return r; }
	var MATTER = { velIter: 8, posIter: 10, fFile: 0.12, binDensity: 1.9, linDamp: 1.2, sleep: false, settle: true, drag: { k: 0.06, c: 0.08 } };
	var BOX = { velIter: 10, posIter: 4, drag: { k: 3.5, c: 0.35, force: 260 } };
	var RAPIER = { velIter: 8, drag: { k: 4, c: 0.7, force: 30 } };
	function r(o) { var x = {}; for (var k in RAPIER) x[k] = RAPIER[k]; for (var j in o) x[j] = o[j]; return x; }
	var P2 = { velIter: 12, drag: { k: 4, c: 0.7, force: 30 } };
	function q(o) { var x = {}; for (var k in P2) x[k] = P2[k]; for (var j in o) x[j] = o[j]; return x; }
	var B3 = { substeps: 4, drag: { k: 4, c: 0.7, force: 30 } };
	function t(o) { var x = {}; for (var k in B3) x[k] = B3[k]; for (var j in o) x[j] = o[j]; return x; }
	function m(o) { var r = {}; for (var k in MATTER) r[k] = MATTER[k]; for (var j in o) r[j] = o[j]; return r; }
	function b(o) { var r = {}; for (var k in BOX) r[k] = BOX[k]; for (var j in o) r[j] = o[j]; return r; }
	// Built on #7 (Planck · heavy bin, slow pour): the same engine, weight and lean, each pouring more.
	var SEVEN = { binDensity: 6, pourEvery: 9, push: 0.7, hop: 0.6 };
	function s7(o) { var x = {}; for (var k in SEVEN) x[k] = SEVEN[k]; for (var j in o) x[j] = o[j]; return b(x); }
	// The throw, built on Box2D v3 · balanced: launch (flight time T in frames, start height h in bin
	// heights above the L's top, aim along the L's top towards its right shoulder, tilt and spin), the bin's weight and bounce, and how
	// readily the files fly out once it hits (release angle, interval, push, top speed).
	function thr(th, o) { var x = { throw: th, keepPour: 40, landEvery: 4, spill: 1.5, hop: 1.2 }; for (var k in o) x[k] = o[k]; return t(x); }
	window.LF_VARIANTS = [
		v("box2d3", "Throw 1 · lazy lob", thr({ T: 60, h: 1.2, aim: 0.55, run: 380, spin: 0 }, { rBin: 0.12, fling: 0.4, pourDeg: 45, pourEvery: 5, push: 0.9 })),
		v("box2d3", "Throw 2 · easy toss", thr({ T: 52, h: 1, aim: 0.5, run: 420, spin: 0.03 }, { rBin: 0.12, fling: 0.45, pourDeg: 40, pourEvery: 4, push: 1 })),
		v("box2d3", "Throw 3 · clips the L", thr({ T: 46, h: 0.8, aim: 0.6, run: 420, spin: -0.04 }, { rBin: 0.1, fling: 0.5, pourDeg: 40, pourEvery: 4, push: 1 })),
		v("box2d3", "Throw 4 · catches the edge, spins", thr({ T: 42, h: 0.7, aim: 0.65, run: 430, spin: 0.06 }, { rBin: 0.18, fling: 0.55, pourDeg: 35, pourEvery: 4, push: 1.1 })),
		v("box2d3", "Throw 5 · heavy, thuds", thr({ T: 40, h: 1.5, aim: 0.45, run: 440 }, { fling: 0.5, binDensity: 5, pourDeg: 35, pourEvery: 4, push: 1.2 })),
		v("box2d3", "Throw 6 · bouncy, tumbles", thr({ T: 36, h: 1.1, aim: 0.45, run: 420, spin: 0.08 }, { fling: 0.6, rBin: 0.3, pourDeg: 35, pourEvery: 3, push: 1.2 })),
		v("box2d3", "Throw 7 · light, flips", thr({ T: 32, h: 0.9, aim: 0.55, run: 400, spin: 0.1 }, { fling: 0.6, binDensity: 1.2, pourDeg: 30, pourEvery: 3, push: 1.4 })),
		v("box2d3", "Throw 8 · hard, ricochets", thr({ T: 26, h: 0.6, aim: 0.55, run: 340 }, { fling: 0.7, rBin: 0.4, pourDeg: 30, pourEvery: 2, push: 1.4, cap: 12 })),
		v("box2d3", "Throw 9 · heavy fastball", thr({ T: 22, h: 0.5, aim: 0.45, run: 360, spin: 0.12 }, { fling: 0.7, binDensity: 4, pourDeg: 25, pourEvery: 2, push: 1.5, cap: 12 })),
		v("box2d3", "Throw 10 · fastball, scatters everything", thr({ T: 18, h: 0.4, aim: 0.5, run: 380, spin: 0.1 }, { fling: 0.8, rBin: 0.45, pourDeg: 25, pourEvery: 2, push: 1.6, cap: 14 })),
		v("planck", "7a · faster pour", s7({ pourEvery: 4, push: 1 })),
		v("planck", "7b · keeps pouring after it lands", s7({ pourEvery: 4, push: 1, keepPour: 60, landEvery: 6, spill: 1.3 })),
		v("planck", "7c · starts earlier, stronger hop", s7({ pourEvery: 4, push: 1, keepPour: 60, landEvery: 6, spill: 1.3, pourDeg: 35, hop: 1 })),
		v("planck", "7d · rocks once on landing", s7({ pourEvery: 4, push: 1, keepPour: 60, landEvery: 6, spill: 1.3, pourDeg: 35, hop: 1, rock: 0.05 })),
		v("planck", "7e · most generous", s7({ pourEvery: 4, push: 1.15, keepPour: 50, landEvery: 4, spill: 1.8, pourDeg: 35, hop: 1.2, rock: 0.06 })),
		v("planck", "7e · with depth (ledges and shadows)", s7({ pourEvery: 4, push: 1.15, keepPour: 50, landEvery: 4, spill: 1.8, pourDeg: 35, hop: 1.2, rock: 0.06, depth: true })),
		v("matter", "Matter · today's footer", m({})),
		v("matter", "Matter · settles and sleeps", m({ sleep: true, sleepFrames: 40, substeps: 2, posIter: 14, velIter: 10 })),
		v("matter", "Matter · heavy bin, slow pour", m({ binDensity: 4, pourEvery: 9, push: 0.7, hop: 0.5 })),
		v("matter", "Matter · grippy, files stay close", m({ fFile: 0.4, fLetter: 0.45, linDamp: 2 })),
		v("matter", "Matter · bouncy", m({ rFile: 0.35, rBin: 0.25, rLetter: 0.3 })),
		v("planck", "Planck · balanced", b({})),
		v("planck", "Planck · heavy bin, slow pour", b({ binDensity: 6, pourEvery: 9, push: 0.7, hop: 0.6 })),
		v("planck", "Planck · slippery, files spread far", b({ fFile: 0.05, fLetter: 0.08, linDamp: 0.1, angDamp: 0.2, push: 1.3 })),
		v("planck", "Planck · bouncy", b({ rFile: 0.4, rBin: 0.3, rLetter: 0.35 })),
		v("planck", "Planck · all at once", b({ pour: "pile", hop: 1.5, push: 1.2 })),
		v("rapier", "Rapier · balanced", r({})),
		v("rapier", "Rapier · heavy bin, slow pour", r({ binDensity: 6, pourEvery: 9, push: 0.7, hop: 0.6 })),
		v("rapier", "Rapier · grippy, files stay close", r({ fFile: 0.45, fLetter: 0.5, linDamp: 1.2 })),
		v("rapier", "Rapier · bouncy", r({ rFile: 0.4, rBin: 0.3, rLetter: 0.35 })),
		v("rapier", "Rapier · floaty, soft drag", r({ gravity: 800, linDamp: 0.9, angDamp: 0.4, drag: { k: 2, c: 0.3, force: 20 } })),
		v("p2", "p2 · balanced", q({})),
		v("p2", "p2 · heavy bin, slow pour", q({ binDensity: 6, pourEvery: 9, push: 0.7, hop: 0.6 })),
		v("p2", "p2 · slippery, files spread far", q({ fFile: 0.05, fLetter: 0.08, linDamp: 0.1, angDamp: 0.2, push: 1.3 })),
		v("p2", "p2 · bouncy", q({ rFile: 0.4, rBin: 0.3, rLetter: 0.35 })),
		v("box2d3", "Box2D v3 · balanced", t({})),
		v("box2d3", "Box2D v3 · heavy bin, slow pour", t({ binDensity: 6, pourEvery: 9, push: 0.7, hop: 0.6 })),
		v("box2d3", "Box2D v3 · slippery, files spread far", t({ fFile: 0.05, fLetter: 0.08, linDamp: 0.1, angDamp: 0.2, push: 1.3 })),
		v("box2d3", "Box2D v3 · bouncy", t({ rFile: 0.4, rBin: 0.3, rLetter: 0.35 })),
		v("box2d3", "Box2D v3 · all at once, 8 substeps", t({ pour: "pile", hop: 1.5, push: 1.2, substeps: 8 }))
	];
})();
