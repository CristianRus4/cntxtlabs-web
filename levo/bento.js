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
	// The product's own UI, no chart: day by day the popover's disk bar fills and the green Ready
	// ticks grow; when free space reaches the limit, Levo cleans, the green clears, free space grows
	// back and a macOS notification slides in. Then the days go on, calmly, while it's in view.

	var AUTO = { limit: (D.data && D.data.disk && D.data.disk.alert) || 20, total: 245, sys: 32, apps: 46, free: 31, ready: 4, perDay: 3.4, grow: 2, day: 900 };
	var DAYNAMES = (function () {
		var f = new Intl.DateTimeFormat("en-NZ", { weekday: "short" }), out = [], d = new Date(2026, 9, 26);
		for (var i = 0; i < 7; i++) out.push(f.format(new Date(d.getTime() + i * 864e5)));
		return out;
	})();
	function gbText(v) { return Math.round(v) + " GB"; }
	function autoHTML() {
		var groups = ((D.data && D.data.groups) || []).filter(function (g) { return g.items.every(function (it) { return it.level === 1; }); });
		var shown = groups.length <= 2 ? groups : groups.slice(0, 1), more = groups.length - shown.length;
		var chips = shown.map(function (g, i) {
			return chip(tile(g.tile, g.symbol, "chip") + "<span>" + esc(g.title) + "</span>") + (i === shown.length + (more ? 1 : 0) - 2 ? words("and") : "");
		}).join("") + (more ? chip("<span>" + more + " more</span>") : "");
		var ticks = "";
		for (var i = 0; i < 60; i++) ticks += '<i class="lv-tick"></i>';
		return '<div class="bt-auto-card">' +
				kit("bt-auto-pop",
					'<div class="lv-dhead lv-namerow"><span class="lv-sec">' + sym("laptopcomputer", 14) + '</span><b>MacBook Pro</b><span class="lv-flex"></span><span class="lv-topclean is-auto">Auto mode</span></div>' +
					'<div class="lv-sep"></div>' +
					'<section class="lv-disk"><div class="lv-hero"><span class="lv-free lv-num" data-autofree>' + gbText(AUTO.free) + '</span><span class="lv-sec">free</span><span class="lv-flex"></span>' +
						'<span class="lv-can lv-num" data-autoready><b>' + gbText(AUTO.ready) + "</b> ready</span></div>" +
					'<div class="lv-dbar"><div class="lv-ticks" data-autoticks>' + ticks + "</div></div>" +
					'<div class="bt-auto-day"><span data-autoday>' + DAYNAMES[0] + "</span></div></section>" +
					'<div class="lv-sep"></div>' +
					'<div class="lv-sum"><p class="lv-sline">' + chip("<span>Auto mode</span>") + words("keeps") + chip("<span>" + gbText(AUTO.limit) + "</span>") + words("free: it cleans") + chips + words("on its own.") + "</p></div>") +
			"</div>" +
			// A slice of the Mac's screen, where the notification arrives.
			'<div class="bt-auto-screen"><div class="lv-kit bt-kit"><div class="bt-auto-menubar"><span class="bt-auto-mark">' + (D.mark ? D.mark("bt-auto-m") : "") + "</span>" +
				'<b data-automb>' + gbText(AUTO.free) + "</b></div>" +
				'<div class="lv-note bt-auto-note" data-autonote><img class="lv-note-icon" src="img/icon-96.png" width="38" height="38" alt="">' +
					'<span class="lv-note-text"><span class="lv-note-top"><b data-autonotetitle>Levo\u2019s Auto mode freed 12 GB</b><span class="lv-note-when">now</span></span><span data-autonotebody></span></span></div>' +
			"</div></div>";
	}
	// The bar's ticks in the app's order: Your Data, System Data, Apps, Ready, Free.
	function autoBar(el, st) {
		var parts = [["data", AUTO.total - AUTO.sys - AUTO.apps - st.ready - st.free], ["sys", AUTO.sys], ["apps", AUTO.apps], ["ready", st.ready], ["free", st.free]];
		var n = 60, count = parts.map(function (p) { return p[1] > 0.05 ? Math.max(1, Math.round(p[1] / AUTO.total * n)) : 0; });
		var used = count.reduce(function (a, b) { return a + b; }, 0);
		count[0] += n - used;
		var ticks = el.querySelectorAll("[data-autoticks] i"), k = 0;
		parts.forEach(function (p, i) { for (var j = 0; j < count[i]; j++) ticks[k++].className = "lv-tick is-" + p[0]; });
	}
	function autoShow(el, st) {
		autoBar(el, st);
		el.querySelector("[data-autofree]").textContent = gbText(st.free);
		el.querySelector("[data-automb]").textContent = gbText(st.free);
		el.querySelector("[data-autoready]").innerHTML = st.ready >= 0.5 ? "<b>" + gbText(st.ready) + "</b>\u2009ready" : "";
		el.querySelector("[data-autoday]").textContent = DAYNAMES[st.day % 7];
	}
	// The banner: "Levo's Auto mode freed 12 GB", "Cleaned Xcode build data and 2 more. 45 GB free now."
	// It names Levo for a visitor (in macOS the banner shows Levo's icon, so the app says just "Auto mode").
	function autoNote(el, freed, free) {
		var groups = ((D.data && D.data.groups) || []).filter(function (g) { return g.items.every(function (it) { return it.level === 1; }); }).map(function (g) { return g.title; });
		var what = groups.length <= 2 ? groups.join(" and ") : groups[0] + " and " + (groups.length - 1) + " more";
		el.querySelector("[data-autonotetitle]").textContent = "Levo\u2019s Auto mode freed " + gbText(freed);
		el.querySelector("[data-autonotebody]").textContent = "Cleaned " + what + ". " + gbText(free) + " free now.";
	}
	function autoPlay(t) {
		var el = t.el, note = el.querySelector("[data-autonote]");
		var st = { free: AUTO.free, ready: AUTO.ready, day: 0 };
		autoShow(el, st);
		if (REDUCED) {
			// The moment after a clean: the green cleared, the notification in.
			st = { free: AUTO.limit + 12, ready: 0.6, day: 4 };
			autoShow(el, st);
			autoNote(el, 12, st.free);
			note.classList.add("is-in");
			return;
		}
		// Numbers glide between days.
		var tween = function (from, to, ms) {
			var t0 = performance.now(), gen = t.gen;
			(function step(now) {
				if (gen !== t.gen) return;
				var u = Math.min(1, (now - t0) / ms), e = u * u * (3 - 2 * u);
				autoShow(el, { free: from.free + (to.free - from.free) * e, ready: from.ready + (to.ready - from.ready) * e, day: to.day });
				if (u < 1) requestAnimationFrame(step);
			})(t0);
		};
		var day = function () {
			var from = { free: st.free, ready: st.ready, day: st.day };
			st.day++;
			if (st.free - AUTO.perDay <= AUTO.limit) {
				// The limit: down to it, then Levo cleans what Auto mode may clean.
				st.free = AUTO.limit; st.ready += AUTO.grow;
				tween(from, st, 620);
				var freed = st.ready;
				t.later(function () {
					var before = { free: st.free, ready: st.ready, day: st.day };
					st.free += freed; st.ready = 0;
					tween(before, st, 1000);
					autoNote(el, freed, st.free);
					note.classList.add("is-in");
					t.later(function () { note.classList.remove("is-in"); }, 3600);
				}, 1100);
				t.later(day, AUTO.day + 3400);
				return;
			}
			st.free -= AUTO.perDay; st.ready += AUTO.grow;
			tween(from, st, 620);
			t.later(day, AUTO.day);
		};
		t.later(day, 600);
	}
	function autoReset(el) {
		el.querySelector("[data-autonote]").classList.remove("is-in");
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
			lines.forEach(function (l) { l.classList.remove("on"); l.style.stroke = ""; });
			lines.forEach(function (l, i) { t.later(function () { l.classList.add("on"); l.style.stroke = l.getAttribute("data-c"); }, 200 + i * 34); });
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
		{ id: "auto", label: "Auto mode", sub: "Cleans on its own before your disk runs low.", cls: "bt-auto", inner: autoHTML, play: autoPlay, reset: autoReset },
		{ id: "disk", label: "Disk by category", sub: "What fills your disk, and what can go.", inner: function () { return kit("bt-disk", P.disk()); }, play: diskPlay, reset: diskReset },
		{ id: "gauges", label: "Memory, CPU, GPU", sub: "What your Mac is working on, at a glance.", inner: function () { return kit("bt-gauges", P.gauges()); }, play: gaugesPlay },
		{ id: "list", label: "What can go", sub: "Each item with its size and why it\u2019s safe.", inner: function () { return kit("bt-list", '<div class="lv-scroll">' + P.list(5) + "</div>"); }, play: listPlay },
		{ id: "confirm", label: "Confirm first", sub: "Nothing is cleaned until you say so.", inner: function () { return kit("bt-confirm", '<div class="lv-sheet lv-bsheet lv-confirm is-in bt-sheet">' + P.confirm() + "</div>"); } },
		{ id: "actions", label: "Keyboard first", sub: "Every action is a keystroke away.", inner: function () {
			// The whole popover, as the app's: name, gauges, disk, the sentence and the action bar.
			var top = P.disk().replace('<div class="lv-sep"></div>', '<div class="lv-sep"></div>' + P.gauges() + '<div class="lv-sep"></div>') + '<div class="lv-sep"></div>';
			return kit("bt-actions", top + '<div class="lv-scroll"><div class="lv-sum">' + P.summary() + '</div></div><div class="lv-actions">' + P.actionBar() + "</div>" +
				'<div class="lv-scrim bt-scrim"></div><div class="lv-panel lv-bsheet bt-panel">' + P.panel() + "</div>");
		}, play: actionsPlay },
		{ id: "agents", label: "Your own agent", sub: "Your coding agent works out what\u2019s safe.", inner: agentsHTML, play: agentsPlay },
		{ id: "levels", label: "Cleanup levels", sub: "Choose how far a clean goes.", inner: levelsHTML, play: levelsPlay }
	];

	grid.innerHTML = TILES.map(function (k) {
		return '<article class="bt-tile bt-shot" data-tile="' + k.id + '">' +
			'<div class="bt-stage' + (k.cls ? " " + k.cls : "") + '" aria-hidden="true">' + k.inner() + "</div>" +
			'<div class="bt-cap"><h3 class="bt-label">' + k.label + '</h3><p class="bt-sub">' + k.sub + "</p></div></article>";
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
