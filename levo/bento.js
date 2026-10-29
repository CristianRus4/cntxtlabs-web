/*
 * The bento below the Mac. Every tile is the popover's own component, built by demo.js
 * (LevoDemo.parts) in the popover's tokens (.lv-kit), laid out at its real size, so it is
 * crisp at any scale. Only real app icons are pictures. Nothing here is clickable.
 *
 * Each tile rises in as it scrolls into view (getleft-web's reveal: 24px, 400ms fade,
 * 70ms stagger), then plays a little: the green ticks fill and the tip walks the bar's
 * sections, the gauges sweep round, a tick changes, the actions sheet rises, the cleanup
 * level moves, the agent changes. Leaving the view resets a tile, so it plays again.
 * Less motion: the end state at once, fades only.
 *
 * The first tile, Auto mode: free space over a few days drifts down to the limit; when it
 * touches it, Levo cleans and the line steps back up. It plays once each time it comes into view.
 */
(function () {
	"use strict";

	var root = document.getElementById("bento");
	var grid = root && root.querySelector(".bt-grid");
	var D = window.LevoDemo || {};
	var P = D.parts;
	if (!grid || !P) return;

	var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	var sym = D.sym, tile = D.tile;
	function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
	function kit(cls, html) { return '<div class="lv-kit bt-kit"><div class="lv-pop bt-pop ' + cls + '">' + html + "</div></div>"; }
	function words(t) { return t.split(" ").map(function (x) { return '<span class="lv-w">' + esc(x) + "</span>"; }).join(""); }
	function chip(inner) { return '<span class="lv-chip">' + inner + "</span>"; }

	// ---------------------------------------------------------------- Auto mode

	var AUTO = { limit: (D.data && D.data.disk && D.data.disk.alert) || 20, start: 31, back: 32, days: 5, hit: 3.35, step: 0.12 };
	var DAYS = (function () {
		var out = [], d = new Date();
		var f = new Intl.DateTimeFormat("en-NZ", { weekday: "short" });
		for (var i = AUTO.days - 1; i >= 0; i--) out.push(f.format(new Date(d.getTime() - i * 864e5)));
		return out;
	})();
	function ease(u) { return u * u * (3 - 2 * u); }
	// Free space (GB) at t days: a slow drift down with a daily rhythm, Levo's step at the limit, then the drift again.
	function freeAt(t) {
		var wob = function (x) { return Math.sin(x * Math.PI * 2) * 0.55; };
		if (t <= AUTO.hit) return AUTO.limit + (AUTO.start - AUTO.limit) * (1 - t / AUTO.hit) + wob(t) * (1 - t / AUTO.hit);
		if (t <= AUTO.hit + AUTO.step) return AUTO.limit + (AUTO.back - AUTO.limit) * ease((t - AUTO.hit) / AUTO.step);
		var u = (t - AUTO.hit - AUTO.step) / (AUTO.days - AUTO.hit - AUTO.step);
		return AUTO.back - 2.6 * u + wob(t) * 0.6 * u;
	}
	var CW = 600, CH = 200, LO = 14, HI = 36;
	function cx(t) { return t / AUTO.days * CW; }
	function cy(v) { return CH - (v - LO) / (HI - LO) * CH; }
	function path() {
		var d = "";
		for (var i = 0; i <= 240; i++) { var t = i / 240 * AUTO.days; d += (i ? "L" : "M") + cx(t).toFixed(1) + " " + cy(freeAt(t)).toFixed(1); }
		return d;
	}
	function gbText(v) { return Math.round(v) + " GB"; }
	function autoHTML() {
		var groups = ((D.data && D.data.groups) || []).filter(function (g) { return g.items.every(function (it) { return it.level === 1; }); });
		var shown = groups.length <= 2 ? groups : groups.slice(0, 1), more = groups.length - shown.length;
		var chips = shown.map(function (g, i) {
			return chip(tile(g.tile, g.symbol, "chip") + "<span>" + esc(g.title) + "</span>") + (i === shown.length + (more ? 1 : 0) - 2 ? words("and") : "");
		}).join("") + (more ? chip("<span>" + more + " more</span>") : "");
		var ticks = "";
		for (var i = 0; i < 60; i++) ticks += "<i></i>";
		var limY = cy(AUTO.limit), hitX = cx(AUTO.hit + AUTO.step);
		return '<div class="bt-auto-card">' +
				kit("bt-auto-pop",
					'<div class="lv-dhead lv-namerow"><span class="lv-sec">' + sym("laptopcomputer", 14) + '</span><b>MacBook Pro</b><span class="lv-flex"></span><span class="bt-auto-on">Auto mode</span></div>' +
					'<div class="lv-sep"></div>' +
					'<section class="lv-disk"><div class="lv-hero"><span class="lv-free lv-num" data-autofree>' + gbText(AUTO.start) + '</span><span class="lv-sec">free</span></div>' +
					'<div class="lv-dbar"><div class="lv-ticks bt-auto-ticks" data-autoticks>' + ticks + "</div></div></section>" +
					'<div class="lv-sep"></div>' +
					'<div class="lv-sum"><p class="lv-sline">' + chip("<span>Auto mode</span>") + words("keeps") + chip("<span>" + gbText(AUTO.limit) + "</span>") + words("free: it cleans") + chips + words("on its own.") + "</p></div>") +
			"</div>" +
			'<div class="bt-auto-chart">' +
				'<svg viewBox="0 0 ' + CW + " " + CH + '" preserveAspectRatio="none" aria-hidden="true">' +
					'<defs><clipPath id="bt-auto-clip"><rect data-autoclip x="-4" y="-20" width="0" height="' + (CH + 40) + '"/></clipPath></defs>' +
					'<line class="bt-auto-limit" x1="0" x2="' + CW + '" y1="' + limY.toFixed(1) + '" y2="' + limY.toFixed(1) + '" vector-effect="non-scaling-stroke"/>' +
					'<path class="bt-auto-line" clip-path="url(#bt-auto-clip)" d="' + path() + '" vector-effect="non-scaling-stroke"/>' +
				"</svg>" +
				'<span class="bt-auto-dot" data-autodot></span>' +
				'<span class="bt-auto-lim" style="top:' + (limY / CH * 100).toFixed(2) + '%">' + gbText(AUTO.limit) + "</span>" +
				'<span class="bt-auto-freed" data-autofreed style="left:' + (hitX / CW * 100).toFixed(2) + "%;top:" + (cy(AUTO.back) / CH * 100).toFixed(2) + '%">Freed ' + gbText(AUTO.back - AUTO.limit) + "</span>" +
				'<div class="bt-auto-days">' + DAYS.map(function (d) { return "<span>" + esc(d) + "</span>"; }).join("") + "</div>" +
			"</div>";
	}
	// The line drawn up to t days, its dot, the free number and the bar's free ticks.
	function autoFrame(el, t) {
		var v = freeAt(t);
		el.querySelector("[data-autoclip]").setAttribute("width", (cx(t) + 4).toFixed(1));
		var dot = el.querySelector("[data-autodot]");
		dot.style.left = (cx(t) / CW * 100).toFixed(2) + "%";
		dot.style.top = (cy(v) / CH * 100).toFixed(2) + "%";
		el.querySelector("[data-autofree]").textContent = gbText(v);
		el.classList.toggle("is-freed", t >= AUTO.hit + AUTO.step * 0.5);
		var ticks = el.querySelectorAll("[data-autoticks] i"), free = Math.round(v / 245 * 60 * 2.2);
		for (var i = 0; i < ticks.length; i++) ticks[i].className = i >= ticks.length - free ? "is-free" : i < 30 ? "is-data" : i < 38 ? "is-sys" : "is-apps";
	}
	function autoPlay(t) {
		var el = t.el;
		if (REDUCED) { autoFrame(el, AUTO.days); el.classList.add("is-done"); return; }
		autoFrame(el, 0);
		var dur = 5200, t0 = null, gen = t.gen;
		// Calm: an ease-in-out over the whole run, slower while the line drifts.
		(function step(now) {
			if (gen !== t.gen) return;
			if (t0 === null) t0 = now;
			var u = Math.min(1, (now - t0) / dur);
			autoFrame(el, AUTO.days * (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2));
			if (u < 1) requestAnimationFrame(step); else el.classList.add("is-done");
		})(performance.now());
	}

	// ---------------------------------------------------------------- The other tiles

	// The disk: the green ticks fill, then the tip walks the bar's sections.
	function diskPlay(t) {
		var el = t.el, tip = el.querySelector(".lv-tip"), ticks = Array.prototype.slice.call(el.querySelectorAll(".lv-tick"));
		var greens = ticks.filter(function (x) { return x.dataset.seg === "can"; });
		var secs = P.sections().filter(function (s) { return s.id !== "free"; });
		var show = function (k) {
			var s = secs[k % secs.length], mine = ticks.filter(function (x) { x.classList.toggle("is-dim", x.dataset.seg !== s.id); return x.dataset.seg === s.id; });
			if (!mine.length) return;
			tip.innerHTML = "<b>" + esc(s.label) + "</b> " + esc(s.size);
			var was = tip.hidden;
			tip.hidden = false;
			var bar = tip.parentNode, x = (mine[0].offsetLeft + mine[mine.length - 1].offsetLeft + mine[mine.length - 1].offsetWidth) / 2;
			tip.style.left = Math.round(Math.max(0, Math.min(bar.offsetWidth - tip.offsetWidth, x - tip.offsetWidth / 2))) + "px";
			tip.classList.toggle("is-moving", !was);
		};
		if (REDUCED) { show(0); return; }
		greens.forEach(function (x) { x.style.backgroundColor = ""; x.dataset.seg = "free"; });
		greens.forEach(function (x, k) { t.later(function () { x.dataset.seg = "can"; x.style.backgroundColor = "var(--lv-ready)"; }, 400 + k * 40); });
		var k = 0;
		t.every(function () { show(k++); }, 2400, 1300);
	}
	function diskReset(el) {
		var tip = el.querySelector(".lv-tip");
		tip.hidden = true;
		Array.prototype.forEach.call(el.querySelectorAll(".lv-tick"), function (x) { x.classList.remove("is-dim"); });
	}
	// The gauges sweep round to their values.
	function gaugesPlay(t) {
		if (REDUCED) return;
		Array.prototype.forEach.call(t.el.querySelectorAll(".lv-gauge"), function (g) {
			var lines = Array.prototype.slice.call(g.querySelectorAll("line.on"));
			lines.forEach(function (l) { l.classList.remove("on"); });
			lines.forEach(function (l, i) { t.later(function () { l.classList.add("on"); }, 200 + i * 34); });
		});
	}
	// A row's tick changes, and back.
	function listPlay(t) {
		var rows = t.el.querySelectorAll(".lv-grow"), row = rows[2] || rows[0];
		if (!row || REDUCED) return;
		var box = row.querySelector(".lv-cb"), was = box.outerHTML;
		var flip = function (on) {
			var tmp = document.createElement("div");
			tmp.innerHTML = P.checkbox(on);
			box.replaceWith(tmp.firstChild);
			box = row.querySelector(".lv-cb");
		};
		var on = box.getAttribute("aria-checked") === "true";
		t.every(function () { on = !on; flip(on); }, 2600, 1400);
		t.onReset = function () { var tmp = document.createElement("div"); tmp.innerHTML = was; box.replaceWith(tmp.firstChild); };
	}
	// The actions sheet rises over the dimmed popover, and settles back.
	function actionsPlay(t) {
		var el = t.el;
		if (REDUCED) { el.classList.add("is-open"); return; }
		t.later(function () { el.classList.add("is-open"); }, 900);
		t.every(function () {
			el.classList.remove("is-open");
			t.later(function () { el.classList.add("is-open"); }, 1200);
		}, 6400, 5300);
	}
	// The cleanup level moves along, and the sentence follows.
	var LEVELS = [["Careful", "A careful"], ["Balanced", "A balanced"], ["Aggressive", "An aggressive"], ["Everything", "Everything"]];
	function levelAmounts() {
		var groups = (D.data && D.data.groups) || [];
		return LEVELS.map(function (l, n) {
			var cap = n === 3 ? 4 : n + 1, sum = 0;
			groups.forEach(function (g) { g.items.forEach(function (it) { if (it.level > 0 && it.level <= cap) sum += it.gb; }); });
			return Math.round(sum) + " GB";
		});
	}
	function levelsHTML() {
		var amounts = levelAmounts();
		return kit("bt-levels",
			'<div class="bt-levels-in"><span class="lv-seg">' + LEVELS.map(function (l, i) { return '<button type="button" tabindex="-1" class="' + (i === 1 ? "is-on" : "") + '">' + l[0] + "</button>"; }).join("") + "</span>" +
			'<p class="lv-sline" data-levelline>' + levelLine(1, amounts) + "</p></div>");
	}
	function levelLine(i, amounts) {
		return LEVELS[i][0] === "Everything" ? chip("<span>Everything</span>") + words("frees") + chip("<span>" + amounts[i] + "</span>")
			: words(LEVELS[i][1].split(" ")[0]) + chip("<span>" + LEVELS[i][1].split(" ")[1] + "</span>") + words("clean up frees") + chip("<span>" + amounts[i] + "</span>");
	}
	function levelsPlay(t) {
		if (REDUCED) return;
		var btns = t.el.querySelectorAll(".lv-seg button"), line = t.el.querySelector("[data-levelline]"), amounts = levelAmounts(), i = 1;
		t.every(function () {
			i = (i + 1) % LEVELS.length;
			Array.prototype.forEach.call(btns, function (b, k) { b.classList.toggle("is-on", k === i); });
			line.innerHTML = levelLine(i, amounts);
		}, 2200, 1500);
	}
	// The agents Levo works with, one chosen; the choice moves along.
	var AGENTS = [["Claude Code", "orange", "Signed in"], ["Codex", "blue", "Signed in"], ["Gemini CLI", "indigo", "Not signed in"], ["Cursor CLI", "dark", "Signed in"], ["opencode", "grey", "Not installed"], ["Custom", "grey", ""]];
	function agentsHTML() {
		return '<div class="lv-kit bt-kit"><div class="bt-agents">' + AGENTS.map(function (a, i) {
			return '<div class="bt-agent' + (i === 0 ? " is-on" : "") + '">' + tile(a[1], a[0] === "Custom" ? "terminal" : "apple.terminal.fill", "lg") +
				'<span class="bt-agent-t"><b>' + esc(a[0]) + "</b>" + (a[2] ? "<small>" + esc(a[2]) + "</small>" : "") + "</span>" +
				'<span class="bt-agent-r">' + sym("checkmark.circle.fill", 15) + "</span></div>";
		}).join("") + "</div></div>";
	}
	function agentsPlay(t) {
		if (REDUCED) return;
		var cards = t.el.querySelectorAll(".bt-agent"), order = [0, 1, 3], k = 0;
		t.every(function () {
			k = (k + 1) % order.length;
			Array.prototype.forEach.call(cards, function (c, i) { c.classList.toggle("is-on", i === order[k]); });
		}, 2600, 1800);
	}

	var TILES = [
		{ id: "auto", label: "Auto mode", cls: "bt-auto", inner: autoHTML, play: autoPlay },
		{ id: "disk", label: "Disk by category", inner: function () { return kit("bt-disk", P.disk()); }, play: diskPlay, reset: diskReset },
		{ id: "gauges", label: "Memory, CPU, GPU", inner: function () { return kit("bt-gauges", P.gauges()); }, play: gaugesPlay },
		{ id: "list", label: "What can go", inner: function () { return kit("bt-list", '<div class="lv-scroll">' + P.list(5) + "</div>"); }, play: listPlay },
		{ id: "confirm", label: "Confirm first", inner: function () { return kit("bt-confirm", '<div class="lv-sheet lv-bsheet lv-confirm is-in bt-sheet">' + P.confirm() + "</div>"); } },
		{ id: "actions", label: "Keyboard first", inner: function () {
			// The whole popover, as the app's: name, gauges, disk, the sentence and the action bar.
			var top = P.disk().replace('<div class="lv-sep"></div>', '<div class="lv-sep"></div>' + P.gauges() + '<div class="lv-sep"></div>') + '<div class="lv-sep"></div>';
			return kit("bt-actions", top + '<div class="lv-scroll"><div class="lv-sum">' + P.summary() + '</div></div><div class="lv-actions">' + P.actionBar() + "</div>" +
				'<div class="lv-scrim bt-scrim"></div><div class="lv-panel lv-bsheet bt-panel">' + P.panel() + "</div>");
		}, play: actionsPlay },
		{ id: "agents", label: "Your own agent", inner: agentsHTML, play: agentsPlay },
		{ id: "levels", label: "Cleanup levels", inner: levelsHTML, play: levelsPlay }
	];

	grid.innerHTML = TILES.map(function (k) {
		return '<article class="bt-tile bt-shot" data-tile="' + k.id + '"><h3 class="bt-label">' + k.label + "</h3>" +
			'<div class="bt-stage' + (k.cls ? " " + k.cls : "") + '" aria-hidden="true">' + k.inner() + "</div></article>";
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
		if (this.onReset) { this.onReset(); this.onReset = null; }
		if (this.kind.reset) this.kind.reset(this.el);
		var el = this.el;
		el.classList.add("bt-still");
		el.classList.remove("is-play", "is-open", "is-freed", "is-done");
		void el.offsetWidth;
		el.classList.remove("bt-still");
	};

	var tiles = Array.prototype.map.call(grid.querySelectorAll(".bt-tile"), function (el) { return new Tile(el); });
	var byEl = new Map(tiles.map(function (t) { return [t.el, t]; }));
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

	// A tile plays once it is well in view, and resets when it has left, to play again on the way back.
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
