/*
 * The bento below the Mac: tiles that each show one piece of the real app, cut from
 * its own renders (Levo/design/renders, rounds 9 and 10; web copies in img/tiles,
 * light and dark, switched by html.dark). Nothing is redrawn and nothing is clickable.
 *
 * Each tile rises in as it scrolls into view (getleft-web's reveal: 24px, 400ms fade,
 * 70ms stagger), then its picture plays with transforms and opacity only: a slow zoom
 * settles, the disk bar wipes in, a hover tip fades in, a tick changes, the actions
 * sheet rises, the agents pan past. Leaving the view resets a tile, so it plays again.
 * Less motion: the end state at once, fades only.
 */
(function () {
	"use strict";

	var root = document.getElementById("bento");
	var grid = root && root.querySelector(".bt-grid");
	if (!grid) return;

	var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	// Every crop, at its @2x size. Each has a -light and a -dark copy.
	var IMG = {
		"disk": [704, 198], "disk-tip": [704, 198],
		"gauges": [704, 216],
		"list": [704, 570], "list-ticked": [704, 570],
		"confirm": [700, 720],
		"actions-base": [704, 628], "actions-dim": [704, 68], "actions-sheet": [704, 560],
		"agents": [1260, 266],
		"levels": [492, 112]
	};
	function pics(name) {
		var s = IMG[name];
		return ["light", "dark"].map(function (m) {
			return '<img class="bt-' + m + '" src="img/tiles/' + name + "-" + m + '.webp" width="' + s[0] + '" height="' + s[1] +
				'" alt="" loading="lazy" decoding="async" draggable="false">';
		}).join("");
	}
	// A layer of the frame: a whole crop, or a strip of one placed at its own row (top, in px of the base).
	function layer(name, cls, base, top) {
		var style = "";
		if (base) {
			var b = IMG[base], s = IMG[name];
			style = ' style="top:' + (top / b[1] * 100).toFixed(4) + "%;height:" + (s[1] / b[1] * 100).toFixed(4) + '%"';
		}
		return '<div class="bt-layer ' + cls + '"' + style + ">" + pics(name) + "</div>";
	}

	var TILES = [
		// Round 9's popover top (R9 summary) with its hover tip (R9 disk tip): the bar wipes in, then the tip shows.
		{ id: "disk", label: "Disk by category", base: "disk",
			inner: function () { return layer("disk", "bt-l-base") + '<div class="bt-wipe"><i></i></div>' + layer("disk-tip", "bt-l-alt"); },
			play: function (t) {
				t.el.classList.add("is-wiped");
				if (REDUCED) return;
				t.every(function () {
					t.el.classList.add("is-alt");
					t.later(function () { t.el.classList.remove("is-alt"); }, 2600);
				}, 6000, 1700);
			} },
		// Round 10's gauges (R10 metrics).
		{ id: "gauges", label: "Memory, CPU, GPU", base: "gauges",
			inner: function () { return layer("gauges", "bt-l-base"); } },
		// Round 10's Summary over Ready to free: Smartly's picks (R10 breakdown before), then one unticked (ticking).
		{ id: "list", label: "What can go", base: "list",
			inner: function () { return layer("list", "bt-l-base") + layer("list-ticked", "bt-l-alt"); },
			play: function (t) {
				if (REDUCED) { t.el.classList.add("is-alt"); return; }
				t.every(function () {
					t.el.classList.add("is-alt");
					t.later(function () { t.el.classList.remove("is-alt"); }, 2800);
				}, 5600, 1400);
			} },
		// Round 9's confirm sheet (R9 confirm grown).
		{ id: "confirm", label: "Confirm first", base: "confirm",
			inner: function () { return layer("confirm", "bt-l-base"); } },
		// Round 10's popover (R10 breakdown closed), then its actions sheet rising over it (R10 actions summary).
		{ id: "actions", label: "Keyboard first", base: "actions-base",
			inner: function () {
				return layer("actions-base", "bt-l-base") + layer("actions-dim", "bt-l-dim", "actions-base", 0) + layer("actions-sheet", "bt-l-sheet", "actions-base", 68);
			},
			play: function (t) {
				if (REDUCED) { t.el.classList.add("is-open"); return; }
				t.later(function () { t.el.classList.add("is-open"); }, 900);
				t.every(function () {
					t.el.classList.remove("is-open");
					t.later(function () { t.el.classList.add("is-open"); }, 1300);
				}, 6400, 900 + 4400);
			} },
		// Round 10's Settings, Agent: the agent cards, panned from Claude Code to Custom.
		{ id: "agents", label: "Your own agent", base: "agents", pan: true,
			inner: function () { return layer("agents", "bt-l-base"); },
			play: function (t) { if (!REDUCED) t.el.classList.add("is-panning"); } },
		// Round 10's Settings, Agent: the cleanup level.
		{ id: "levels", label: "Cleanup levels", base: "levels",
			inner: function () { return layer("levels", "bt-l-base"); } }
	];

	grid.innerHTML = TILES.map(function (k) {
		var s = IMG[k.base];
		return '<article class="bt-tile bt-shot" data-tile="' + k.id + '"><h3 class="bt-label">' + k.label + "</h3>" +
			'<div class="bt-stage" aria-hidden="true"><div class="bt-frame' + (k.pan ? " bt-pan" : "") + '" style="--w:' + s[0] + ";--h:" + s[1] + '">' +
			'<div class="bt-zoom">' + k.inner() + "</div></div></div></article>";
	}).join("");
	var byId = {};
	TILES.forEach(function (k) { byId[k.id] = k; });

	// ---------------------------------------------------------------- Running a tile

	function Tile(el) {
		this.el = el;
		this.kind = byId[el.dataset.tile];
		this.gen = 0;
		this.timers = [];
		this.playing = false;
	}
	Tile.prototype.later = function (fn, ms) {
		var gen = this.gen, self = this;
		this.timers.push(setTimeout(function () { if (gen === self.gen) fn(); }, ms));
	};
	Tile.prototype.every = function (fn, ms, first) {
		var gen = this.gen, self = this;
		function tick() { if (gen !== self.gen) return; fn(); self.timers.push(setTimeout(tick, ms)); }
		this.timers.push(setTimeout(tick, first != null ? first : ms));
	};
	Tile.prototype.play = function () {
		if (this.playing) return;
		this.playing = true;
		this.el.classList.add("is-play");
		if (this.kind.play) this.kind.play(this);
	};
	Tile.prototype.reset = function () {
		if (!this.playing) return;
		this.playing = false;
		this.gen++;
		this.timers.forEach(clearTimeout);
		this.timers = [];
		var el = this.el;
		el.classList.add("bt-still");
		el.classList.remove("is-play", "is-alt", "is-open", "is-wiped", "is-panning");
		void el.offsetWidth;
		el.classList.remove("bt-still");
	};

	// The agents pan by the picture's overflow: its width at the frame's height, less the frame's width.
	function measurePan(t) {
		var frame = t.el.querySelector(".bt-pan");
		if (!frame) return;
		var s = IMG[t.kind.base], w = frame.clientHeight * s[0] / s[1];
		frame.style.setProperty("--pan", Math.min(0, frame.clientWidth - w).toFixed(1) + "px");
	}

	var tiles = Array.prototype.map.call(grid.querySelectorAll(".bt-tile"), function (el) { return new Tile(el); });
	var byEl = new Map(tiles.map(function (t) { return [t.el, t]; }));
	tiles.forEach(measurePan);
	if (window.ResizeObserver) {
		var ro = new ResizeObserver(function () { tiles.forEach(measurePan); });
		tiles.forEach(function (t) { var f = t.el.querySelector(".bt-pan"); if (f) ro.observe(f); });
	}
	root.classList.add("is-ready");

	if (REDUCED) tiles.forEach(function (t) { t.play(); });
	if (!window.IntersectionObserver) {
		tiles.forEach(function (t) { t.el.classList.add("is-in"); t.play(); });
		return;
	}

	// Arrival, as getleft-web: once, from 5 % in view and 10 % up from the bottom. Tiles arriving together stagger.
	var arrive = new IntersectionObserver(function (es) {
		var n = 0;
		es.forEach(function (en) {
			if (!en.isIntersecting) return;
			en.target.style.setProperty("--rd", (REDUCED ? 0 : n++ * 70) + "ms");
			en.target.classList.add("is-in");
			arrive.unobserve(en.target);
		});
	}, { rootMargin: "0px 0px -10% 0px", threshold: 0.05 });

	// The picture plays once a tile is well in view, and resets when it has left, to play again on the way back.
	var stageIn = new IntersectionObserver(function (es) {
		es.forEach(function (en) {
			var t = byEl.get(en.target);
			if (!t || REDUCED) return;
			if (en.isIntersecting && en.intersectionRatio >= 0.35) {
				var wait = t.arrived ? 0 : 260;
				t.arrived = true;
				t.later(function () { t.play(); }, wait);
			} else if (!en.isIntersecting) {
				t.reset();
			}
		});
	}, { threshold: [0, 0.35] });

	tiles.forEach(function (t) { arrive.observe(t.el); stageIn.observe(t.el); });
})();
