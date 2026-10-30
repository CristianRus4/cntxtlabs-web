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
	function m(o) { var r = {}; for (var k in MATTER) r[k] = MATTER[k]; for (var j in o) r[j] = o[j]; return r; }
	function b(o) { var r = {}; for (var k in BOX) r[k] = BOX[k]; for (var j in o) r[j] = o[j]; return r; }
	window.LF_VARIANTS = [
		v("matter", "Matter · today's footer", m({})),
		v("matter", "Matter · settles and sleeps", m({ sleep: true, sleepFrames: 40, substeps: 2, posIter: 14, velIter: 10 })),
		v("matter", "Matter · heavy bin, slow pour", m({ binDensity: 4, pourEvery: 9, push: 0.7, hop: 0.5 })),
		v("matter", "Matter · grippy, files stay close", m({ fFile: 0.4, fLetter: 0.45, linDamp: 2 })),
		v("matter", "Matter · bouncy", m({ rFile: 0.35, rBin: 0.25, rLetter: 0.3 })),
		v("planck", "Planck · balanced", b({})),
		v("planck", "Planck · heavy bin, slow pour", b({ binDensity: 6, pourEvery: 9, push: 0.7, hop: 0.6 })),
		v("planck", "Planck · slippery, files spread far", b({ fFile: 0.05, fLetter: 0.08, linDamp: 0.1, angDamp: 0.2, push: 1.3 })),
		v("planck", "Planck · bouncy", b({ rFile: 0.4, rBin: 0.3, rLetter: 0.35 })),
		v("planck", "Planck · all at once", b({ pour: "pile", hop: 1.5, push: 1.2 }))
	];
})();
