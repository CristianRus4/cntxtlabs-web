/*
 * The bento below the Mac: tiles that each show one piece of the app, drawn as
 * HTML replicas at the app's own sizes (round 7: Popover/, Design/Raycast.swift,
 * Design/LevoMotion.swift), and a few facts as type. Nothing here is clickable.
 *
 * Each tile rises in as it scrolls into view (getleft-web's reveal: 24px, 5 %
 * threshold, 10 % bottom margin), then its content plays: the bar fills tick by
 * tick, the gauges sweep, the Summary's chips pop in, the hold's tag appears, an
 * item flies to the Trash, the level glides, the sheet rises. Leaving the view
 * resets a tile, so it plays again next time. Less motion: the end state, faded in.
 *
 * Every replica's panel is laid out at 1 pt = 1 px and scaled to its tile with
 * CSS zoom (fit(), below), so the app's sizes stay exact relative to each other.
 */
(function () {
	"use strict";

	var D = window.LevoDemo;
	var root = document.getElementById("bento");
	if (!D || !root) return;

	var sym = D.sym;
	var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	var LANG = (navigator.languages && navigator.languages[0]) || navigator.language || "en-NZ";
	var formats = {};
	function fmt(v, digits) {
		if (!formats[digits]) {
			try { formats[digits] = new Intl.NumberFormat(LANG, { minimumFractionDigits: digits, maximumFractionDigits: digits }); }
			catch (e) { formats[digits] = new Intl.NumberFormat("en-NZ", { minimumFractionDigits: digits, maximumFractionDigits: digits }); }
		}
		return formats[digits].format(v);
	}
	// LevoFormat.bytes: decimal units, one decimal under 10, none from 10 up.
	function bytes(gb) {
		if (gb >= 1) return fmt(gb, gb < 10 ? 1 : 0) + " GB";
		var mb = gb * 1000;
		return fmt(mb, mb < 10 ? 1 : 0) + " MB";
	}
	// While counting, the digits of the final value, so the width stays put.
	function counter(final) { var d = final < 10 ? 1 : 0; return function (v) { return fmt(v, d) + " GB"; }; }
	function $(sel, el) { return (el || root).querySelector(sel); }
	function $$(sel, el) { return Array.prototype.slice.call((el || root).querySelectorAll(sel)); }
	function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

	// ---------------------------------------------------------------- The app's pieces

	// IconTile (Raycast.swift): a squircle, radius size / 4, its colour lightened 8 % at the top, a white glyph at 60 %.
	function iconTile(symbol, tone, size) {
		return '<span class="bt-ic" style="--s:' + size + "px;--c:var(--t-" + tone + ')">' + sym(symbol, size * 0.6) + "</span>";
	}
	// RCCheckbox: 14 square, radius 4, an fg 20 % ring; ticked or mixed adds fg 6 % and the glyph at fg 80 %.
	function checkbox(start, end, delay) {
		return '<span class="bt-cb" data-start="' + (start || "off") + '" data-end="' + (end || start || "off") + '"' +
			(delay != null ? ' style="--cd:' + delay + 'ms"' : "") + ">" +
			'<i class="bt-cb-on">' + sym("checkmark", 8.5) + '</i><i class="bt-cb-mix">' + sym("minus", 8.5) + "</i></span>";
	}
	// Keycap: small (18, 10 pt, radius 5) or medium (20, 11.5 pt, radius 6); prominent (fg 10 %) or framed (fg 20 % ring).
	function caps(keys, cls) {
		return '<span class="bt-caps">' + keys.map(function (k) { return '<span class="bt-cap ' + cls + '">' + k + "</span>"; }).join("") + "</span>";
	}
	// The popover's action bar: the status line, the primary action with its keycaps, and ⌘K's switch.2.
	function actionBar(status) {
		return '<div class="bt-bar"><span class="bt-status">' + status + '</span><span class="bt-flex"></span>' +
			'<span class="bt-q bt-act"><b>Clean up</b>' + caps(["⌘", "⌫"], "bt-cap-sm") + "</span>" +
			'<span class="bt-q bt-sec">' + sym("switch.2", 14) + "</span></div>";
	}
	// RCSectionHeader with the Select menu's quiet label.
	function sectionHeader(title) {
		return '<div class="bt-head"><span>' + title + '</span><span class="bt-flex"></span>' +
			'<span class="bt-quiet">Smartly' + sym("chevron.down", 8) + "</span></div>";
	}
	// GroupRow: tick, icon, name over "3 items · changed 2 days ago", size, chevron (turned when open).
	function groupRow(o) {
		return '<div class="bt-grow' + (o.cls ? " " + o.cls : "") + '">' + checkbox(o.check, o.checkEnd, o.checkDelay) +
			iconTile(o.symbol, o.tone, 20) +
			'<span class="bt-gtext"><span class="bt-gname">' + esc(o.name) + '</span><span class="bt-gsub" data-sub>' + esc(o.sub) + "</span></span>" +
			'<span class="bt-flex"></span><span class="bt-size" data-size>' + bytes(o.gb) + "</span>" +
			'<span class="bt-chev' + (o.open ? " is-open" : "") + '">' + sym("chevron.right", 10) + "</span></div>";
	}
	// FindingRow: indented under the group's icon; tick, name, size, and room for the chevron.
	function findingRow(o) {
		return '<div class="bt-frow' + (o.cls ? " " + o.cls : "") + '"' + (o.style ? ' style="' + o.style + '"' : "") + ">" +
			checkbox(o.check, o.checkEnd, o.checkDelay) + midName(o.name) + '<span class="bt-flex"></span>' +
			(o.tag ? '<span class="bt-tag">' + esc(o.tag) + "</span>" : "") +
			'<span class="bt-size">' + bytes(o.gb) + '</span><span class="bt-chev-room"></span></div>';
	}
	// A finding's name truncates in the middle (truncationMode(.middle)): the head gives way, the last 7 letters stay.
	function midName(name) {
		var cut = Math.max(0, name.length - 7);
		return '<span class="bt-fname bt-mid"><span>' + esc(name.slice(0, cut)) + "</span><span>" + esc(name.slice(cut)) + "</span></span>";
	}
	function pop(inner, cls) { return '<div class="bt-pop' + (cls ? " " + cls : "") + '">' + inner + "</div>"; }

	// The disk: 60 ticks, each wholly one category's colour (DiskCategoryBar.allocate: largest remainders, at least
	// one tick each), in the breakdown's order: used, then what can be freed in green, then free in grey. Sizes from
	// the demo above (460 GB, 16 GB free, 33.7 GB ticked at Balanced).
	var DISK = [["developer", 107.1], ["apps", 96], ["documents", 70], ["system", 64], ["media", 44], ["other", 29], ["ready", 33.7], ["free", 16.2]];
	var FREE_GB = 16, CAN_GB = 33.7;
	function allocate(segs, n) {
		var total = segs.reduce(function (s, x) { return s + x[1]; }, 0);
		var exact = segs.map(function (s) { return s[1] / total * n; });
		var counts = exact.map(function (e) { return Math.max(1, Math.floor(e)); });
		var left = n - counts.reduce(function (s, c) { return s + c; }, 0);
		var order = exact.map(function (e, i) { return i; }).sort(function (a, b) { return (exact[b] % 1) - (exact[a] % 1); });
		for (var k = 0; left > 0; k++, left--) counts[order[k % order.length]]++;
		while (left < 0) { var m = counts.indexOf(Math.max.apply(null, counts)); counts[m]--; left++; }
		var out = [];
		segs.forEach(function (s, i) { for (var j = 0; j < counts[i]; j++) out.push(s[0]); });
		return out;
	}
	function diskSection(filled) {
		var ticks = allocate(DISK, 60).map(function (kind, i) {
			return '<i style="--c:var(--dk-' + kind + ");--d:" + (i * 22) + 'ms"></i>';
		}).join("");
		return '<div class="bt-disk"><div class="bt-dhead"><span class="bt-sec" data-devsym-copy>' + sym("laptopcomputer", 13) + "</span><b data-devname-copy>MacBook Pro</b></div>" +
			'<div class="bt-hero"><span class="bt-free">' + bytes(FREE_GB) + '</span><span class="bt-sec">free</span><span class="bt-flex"></span>' +
			'<span class="bt-can"><b data-can>' + (filled ? bytes(CAN_GB) : counter(CAN_GB)(0)) + "</b><span>to clean up</span></span></div>" +
			'<div class="bt-ticks' + (filled ? " is-full" : "") + '">' + ticks + "</div></div>";
	}

	// TickGauge: 26 ticks round 270°, from 0.75 to 1 of the radius, stroked size / 28 with round caps; lit ticks take the
	// blue → green → yellow → orange → red arc colour at their place, the rest fg 10 % (12 % dark). 64 pt in the popover.
	var ARC = ["#4FA3F8", "#59D499", "#FFC531", "#FF9217", "#FF6363"];
	function arc(p) {
		var s = Math.min(1, Math.max(0, p)) * (ARC.length - 1), i = Math.min(ARC.length - 2, Math.floor(s)), m = s - i;
		var a = hex(ARC[i]), b = hex(ARC[i + 1]);
		return "rgb(" + [0, 1, 2].map(function (k) { return Math.round(a[k] + (b[k] - a[k]) * m); }).join(",") + ")";
	}
	function hex(h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); }
	// Memory, CPU and GPU as the demo computes them: 18.2 of 24 GB, 187 % over 8 cores, 8 %.
	var GAUGES = [["Memory", 76], ["CPU", 23], ["GPU", 8]];
	function gaugesRow(lit) {
		return '<div class="bt-gauges">' + GAUGES.map(function (g, gi) {
			var lines = "";
			for (var i = 0; i < 26; i++) {
				var p = i / 25, a = (135 + 270 * p) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
				lines += '<line x1="' + (32 + 23.25 * c).toFixed(2) + '" y1="' + (32 + 23.25 * s).toFixed(2) + '" x2="' + (32 + 31 * c).toFixed(2) + '" y2="' + (32 + 31 * s).toFixed(2) + '" style="--on:' + arc(p) + '"' +
					(lit && i < Math.round(g[1] / 100 * 26) ? ' class="on"' : "") + "/>";
			}
			return (gi ? '<i class="bt-vsep"></i>' : "") + '<div class="bt-gauge"><div class="bt-dial"><svg viewBox="0 0 64 64">' + lines + "</svg>" +
				'<span class="bt-dnum"><span class="bt-dn"><span data-v>' + (lit ? g[1] : 0) + "</span><small>%</small></span></span></div>" +
				'<span class="bt-q bt-glabel">' + g[0] + "</span></div>";
		}).join("") + "</div>";
	}

	// The Summary sentence (SummarySection, AppModel+Summary): the groups the ticks would clean, biggest first; with
	// more than three it names two, then "N more". Then what the free plan would quit for the busiest metric.
	function summaryWords(animated) {
		var i = 0;
		function words(text) { return text.split(" ").map(function (w) { return '<span class="bt-w" style="--i:' + (i++) + '">' + w + "</span>"; }).join(""); }
		function chip(title, gb, icon, glue) {
			var n = i++;
			return '<span class="bt-glue" style="--i:' + n + '"><span class="bt-chip' + (icon ? "" : " bt-chip-bare") + '">' + (icon || "") +
				"<b>" + esc(title) + "</b>" + (gb != null ? '<span class="bt-sec" data-count="' + gb + '">' + (animated ? counter(gb)(0) : bytes(gb)) + "</span>" : "") + "</span>" +
				(glue ? '<span class="bt-punct">' + glue + "</span>" : "") + "</span>";
		}
		var disk = words("Levo can clean up") +
			chip("Xcode build data", 14.2, iconTile("hammer.fill", "blue", 15), ",") +
			chip("Simulators and emulators", 9.8, iconTile("iphone", "gray", 15)) +
			words("and") + chip("4 more", null, null, ".");
		var quit = chip("node", null, iconTile("terminal", "sysgray", 15)) + words("can quit, freeing about") +
			'<span class="bt-w bt-strong" style="--i:' + (i++) + '">' + bytes(1.9) + " of memory.</span>";
		return '<div class="bt-sum"><div class="bt-flow">' + disk + '</div><div class="bt-flow">' + quit + "</div></div>" +
			'<span class="bt-q bt-showall" style="--i:' + i + '">Show all</span>';
	}

	// ---------------------------------------------------------------- Tiles

	var TILES = {
		// 1. The disk bar filling with its category colours.
		disk: {
			width: 360, zmax: 1.45,
			html: function () { return pop(diskSection(false), "bt-cut-bottom"); },
			play: function (t) {
				t.el.classList.add("is-play");
				var n = $("[data-can]", t.el);
				t.count(n, 0, CAN_GB, 60 * 22 + 300, counter(CAN_GB), function () { n.textContent = bytes(CAN_GB); });
			},
			reset: function (t) { $("[data-can]", t.el).textContent = counter(CAN_GB)(0); }
		},

		// 2. Memory, CPU and GPU sweeping round, one after another (LevoMotion.stagger), then drifting as live values do.
		gauges: {
			width: 360, zmax: 1.45,
			html: function () { return pop(gaugesRow(false), "bt-cut-bottom"); },
			play: function (t) {
				var dials = $$(".bt-gauge", t.el), now = GAUGES.map(function () { return 0; });
				function to(gi, v, ms) {
					var from = now[gi], g = dials[gi], lines = $$("line", g), num = $("[data-v]", g);
					now[gi] = v;
					t.tween(ms, function (k) {
						var x = from + (v - from) * k, on = Math.round(x / 100 * 26);
						lines.forEach(function (l, i) { l.classList.toggle("on", i < on); });
						num.textContent = Math.round(x);
					});
				}
				GAUGES.forEach(function (g, gi) { t.later(function () { to(gi, g[1], 1000); }, 80 * (gi + 1)); });
				if (REDUCED) return;
				var drift = [[77, 24, 11], [76, 27, 9], [77, 21, 7], [76, 23, 8]], k = 0;
				t.every(function () { var d = drift[k++ % drift.length]; d.forEach(function (v, gi) { to(gi, v, 700); }); }, 3200, 1800);
			},
			reset: function (t) {
				$$(".bt-gauge", t.el).forEach(function (g) {
					$$("line", g).forEach(function (l) { l.classList.remove("on"); });
					$("[data-v]", g).textContent = "0";
				});
			}
		},

		// 3. The Summary popover's sentences: words in, chips pop, sizes count.
		summary: {
			width: 360, zmax: 1.3, vpad: 40,
			html: function () { return pop('<div class="bt-sumwrap">' + summaryWords(true) + "</div>" + actionBar("Checked just now")); },
			play: function (t) {
				t.el.classList.add("is-play");
				$$("[data-count]", t.el).forEach(function (n) {
					var gb = +n.dataset.count, i = +n.closest(".bt-glue").style.getPropertyValue("--i");
					t.later(function () { t.count(n, 0, gb, 700, counter(gb), function () { n.textContent = bytes(gb); }); }, i * 45 + 120);
				});
			},
			reset: function (t) { $$("[data-count]", t.el).forEach(function (n) { n.textContent = counter(+n.dataset.count)(0); }); }
		},

		// 4. A hold: the guard keeps a folder an installed tool uses, and names the tool (Guard.hold, "Used by …").
		hold: {
			width: 360, zmax: 1.35,
			html: function () {
				return pop('<div class="bt-list">' + sectionHeader("Ready to free") +
					groupRow({ name: "Project dependencies", sub: "3 items · changed 2 days ago", symbol: "shippingbox.fill", tone: "orange", gb: 2.87, check: "off", checkEnd: "mixed", checkDelay: 900, open: true }) +
					'<div class="bt-items">' +
					findingRow({ name: "levo-site/node_modules", gb: 1.4, check: "off", checkEnd: "on", checkDelay: 700, style: "--i:0" }) +
					findingRow({ name: "opencode/node_modules", gb: 0.86, check: "off", tag: "Used by opencode", cls: "is-held", style: "--i:1" }) +
					findingRow({ name: "notes-app/node_modules", gb: 0.61, check: "off", checkEnd: "on", checkDelay: 800, style: "--i:2" }) +
					"</div></div>", "bt-cut-bottom");
			},
			play: function (t) { t.el.classList.add("is-play"); },
			reset: function () {}
		},

		// 5. The Trash row: a cleaned item goes to the Trash, which Levo lists and never ticks.
		trash: {
			width: 360, zmax: 1.35,
			html: function () {
				return pop('<div class="bt-list">' + sectionHeader("Ready to free") +
					groupRow({ name: "Downloads and installers", sub: "3 items · changed 5 months ago", symbol: "arrow.down.circle.fill", tone: "blue", gb: 4.3, check: "on", open: true, cls: "bt-dl" }) +
					'<div class="bt-items">' +
					'<div class="bt-collapse"><div>' + findingRow({ name: "Old Installers", gb: 2.4, check: "on", cls: "bt-fly" }) + "</div></div>" +
					findingRow({ name: "project-final-v2.zip", gb: 1.1, check: "on" }) +
					findingRow({ name: "Downloads/Setup.dmg", gb: 0.8, check: "on" }) +
					"</div>" +
					groupRow({ name: "Trash", sub: "2 items · changed today", symbol: "trash.fill", tone: "gray", gb: 1.6, check: "off", cls: "bt-bin" }) +
					"</div>", "bt-cut-bottom");
			},
			play: function (t) {
				var el = t.el, dl = $(".bt-dl", el), bin = $(".bt-bin", el), slot = $(".bt-collapse", el), row = $(".bt-fly", el);
				function end() {
					slot.classList.add("is-gone");
					$("[data-sub]", dl).textContent = "2 items · changed 5 months ago";
					$("[data-sub]", bin).textContent = "3 items · changed today";
				}
				if (REDUCED) { end(); $("[data-size]", dl).textContent = bytes(1.9); $("[data-size]", bin).textContent = bytes(4); return; }
				function run() {
					var ghost = row.cloneNode(true);
					ghost.classList.add("bt-ghost");
					slot.parentNode.parentNode.appendChild(ghost);
					t.nodes.push(ghost);
					end();
					// From the row's place to the Trash tile's centre, measured in the panel's own (unzoomed) points:
					// header 33 + group 38 puts the row at 71; the Trash row ends up at 127, its icon centre 48 from the left.
					var a = ghost.animate([
						{ transform: "none", opacity: 1 },
						{ transform: "translate(-4px, 18px) scale(.82)", opacity: 1, offset: 0.4 },
						{ transform: "translate(-15px, 61px) scale(.18)", opacity: 0 }
					], { duration: 760, easing: "cubic-bezier(.45, 0, .2, 1)", fill: "forwards" });
					a.onfinish = function () { if (ghost.parentNode) ghost.parentNode.removeChild(ghost); };
					t.later(function () {
						bin.classList.remove("is-bump"); void bin.offsetWidth; bin.classList.add("is-bump");
						t.count($("[data-size]", bin), 1.6, 4, 520, counter(1.6), function (n) { n.textContent = bytes(4); });
					}, 620);
					t.count($("[data-size]", dl), 4.3, 1.9, 520, counter(1.9), function (n) { n.textContent = bytes(1.9); });
				}
				t.later(run, 700);
				// Gently, again: hold, fade back to the start, play once more.
				t.every(function () {
					el.classList.add("is-rewind");
					t.later(function () { TILES.trash.reset(t); el.classList.remove("is-rewind"); t.later(run, 600); }, 320);
				}, 5200, 5200);
			},
			reset: function (t) {
				var el = t.el, dl = $(".bt-dl", el), bin = $(".bt-bin", el);
				$(".bt-collapse", el).classList.remove("is-gone");
				$("[data-sub]", dl).textContent = "3 items · changed 5 months ago";
				$("[data-sub]", bin).textContent = "2 items · changed today";
				$("[data-size]", dl).textContent = bytes(4.3);
				$("[data-size]", bin).textContent = bytes(1.6);
				bin.classList.remove("is-bump");
			}
		},

		// 6. The cleanup levels (Settings › Agent › Cleanup Level: RCSegmented, 28 tall, no track at rest).
		levels: {
			width: 392, zmax: 1.5,
			html: function () {
				var levels = ["Careful", "Balanced", "Aggressive"];
				return pop('<div class="bt-card"><div class="bt-srow"><span class="bt-slabel">Cleanup level<span class="bt-q bt-info">' + sym("info.circle", 12) + "</span></span>" +
					'<span class="bt-flex"></span><span class="bt-seg" data-level="1"><i class="bt-thumb"></i>' +
					levels.map(function (l, i) { return '<span class="bt-segi" data-i="' + i + '">' + l + "</span>"; }).join("") + "</span></div></div>", "bt-win");
			},
			play: function (t) {
				if (REDUCED) return;
				var seg = $(".bt-seg", t.el), steps = [0, 1, 2, 1], k = 0;
				t.every(function () { seg.dataset.level = steps[k++ % steps.length]; }, 1700, 600);
			},
			reset: function (t) { $(".bt-seg", t.el).dataset.level = "1"; }
		},

		// 7. The bottom sheet (PopoverSheet): it rises from the popover's bottom edge over the dimmed content. This one is
		// a group's Clean step (CleanConfirmView): its name and size, what is removed, the items, Cancel and Clean.
		sheet: {
			width: 360, zmax: 1.12, vpad: 44,
			html: function () {
				var items = [["DerivedData/Levo", 6.8], ["DerivedData/Elevate", 4.9], ["DerivedData/Context", 2.5]];
				var sheet = '<div class="bt-sheet"><div class="bt-shead"><b>Clean Xcode build data · ' + bytes(14.2) + "</b>" +
					'<span class="bt-parts"><span class="bt-part"><span class="bt-sec">Removed</span><b>' + bytes(14.2) + "</b></span></span></div>" +
					'<div class="bt-sep"></div><div class="bt-slist">' + items.map(function (it) {
						return '<div class="bt-srow2"><span class="bt-fname">' + it[0] + '</span><span class="bt-flex"></span><span class="bt-ssize">' + bytes(it[1]) + "</span></div>";
					}).join("") + "</div>" +
					'<div class="bt-bar bt-bar-sheet"><span class="bt-flex"></span>' +
					'<span class="bt-q bt-cancel">Cancel' + caps(["esc"], "bt-cap-fr") + "</span>" +
					'<span class="bt-q bt-act"><b>Clean</b>' + caps(["↵"], "bt-cap-md") + "</span></div></div>";
				return pop(diskSection(true) + '<div class="bt-sep"></div>' + gaugesRow(true) + '<div class="bt-sep"></div>' +
					'<div class="bt-sumwrap">' + summaryWords(false) + "</div>" + actionBar("Checked just now") +
					'<div class="bt-scrim"></div>' + sheet, "bt-pop-sheet");
			},
			play: function (t) {
				var el = t.el;
				if (REDUCED) { el.classList.add("is-open"); return; }
				t.later(function () { el.classList.add("is-open"); }, 900);
				t.every(function () {
					el.classList.remove("is-open");
					t.later(function () { el.classList.add("is-open"); }, 1700);
				}, 5600, 900 + 3900);
			},
			reset: function (t) { t.el.classList.remove("is-open"); }
		}
	};

	// Facts count up from zero where there is something to count, once.
	function playFact(t) {
		var n = $("[data-fact]", t.el), to = +n.dataset.fact;
		if (to < 2 || t.counted) return;
		t.counted = true;
		t.count(n, 0, to, 800, function (v) { return String(Math.round(v)); }, function () { n.textContent = String(to); });
	}

	// ---------------------------------------------------------------- Running a tile

	function Tile(el) {
		this.el = el;
		this.kind = TILES[el.dataset.tile];
		this.gen = 0;
		this.timers = [];
		this.nodes = [];
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
	// k from 0 to 1 over ms, eased like the app's snappy springs settle (ease-out cubic).
	Tile.prototype.tween = function (ms, step, done) {
		var gen = this.gen, self = this, start = null;
		if (REDUCED) { step(1); if (done) done(); return; }
		function frame(ts) {
			if (gen !== self.gen) return;
			if (start == null) start = ts;
			var p = Math.min(1, (ts - start) / ms);
			step(1 - Math.pow(1 - p, 3));
			if (p < 1) requestAnimationFrame(frame); else if (done) done();
		}
		requestAnimationFrame(frame);
	};
	Tile.prototype.count = function (node, from, to, ms, format, done) {
		this.tween(ms, function (k) { node.textContent = format(from + (to - from) * k); }, function () { if (done) done(node); });
	};
	Tile.prototype.play = function () {
		if (this.playing) return;
		this.playing = true;
		if (this.kind) this.kind.play(this); else if (this.el.classList.contains("bt-fact")) playFact(this);
	};
	Tile.prototype.reset = function () {
		if (!this.playing) return;
		this.playing = false;
		this.gen++;
		this.timers.forEach(clearTimeout);
		this.timers = [];
		this.nodes.forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
		this.nodes = [];
		var el = this.el;
		el.classList.add("bt-still");
		el.classList.remove("is-play", "is-open", "is-rewind");
		if (this.kind) this.kind.reset(this);
		void el.offsetWidth;
		el.classList.remove("bt-still");
	};

	// Each panel is drawn at the app's points and zoomed to fit its tile, up to the tile's own close-up.
	function fit(tile) {
		var stage = $(".bt-stage", tile.el), panel = stage && $(".bt-pop", stage);
		if (!panel) return;
		var phone = window.innerWidth <= 760, pad = phone ? 14 : 28;
		var z = Math.min(tile.kind.zmax * (phone ? 0.85 : 1), (stage.clientWidth - pad * 2) / tile.kind.width);
		if (!phone) {
			// In the grid, the tile's height counts too: a panel that bleeds off the bottom may lose its last 16 points.
			panel.style.zoom = "1";
			var h = panel.offsetHeight - (panel.classList.contains("bt-cut-bottom") ? 16 : 0);
			z = Math.min(z, (stage.clientHeight - (tile.kind.vpad || 14)) / h);
		}
		panel.style.zoom = Math.max(0.5, z).toFixed(3);
	}

	// ---------------------------------------------------------------- Mount

	var tiles = $$(".bt-tile").map(function (el) {
		var t = new Tile(el);
		var stage = $(".bt-stage", el);
		if (t.kind && stage) { stage.innerHTML = t.kind.html(); fit(t); }
		return t;
	});
	var byEl = new Map(tiles.map(function (t) { return [t.el, t]; }));
	if (!REDUCED && window.IntersectionObserver) $$("[data-fact]").forEach(function (n) { if (+n.dataset.fact >= 2) n.textContent = "0"; });
	root.classList.add("is-ready");

	if (window.ResizeObserver) {
		var ro = new ResizeObserver(function (es) { es.forEach(function (en) { var t = byEl.get(en.target.closest(".bt-tile")); if (t && t.kind) fit(t); }); });
		tiles.forEach(function (t) { var s = $(".bt-stage", t.el); if (s) ro.observe(s); });
	} else {
		window.addEventListener("resize", function () { tiles.forEach(function (t) { if (t.kind) fit(t); }); });
	}

	// Less motion: every tile shows its end state at once and keeps it; only the arrival fades.
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

	// Content plays once a tile is well in view, and resets when it has left, to play again on the way back.
	var stageIn = new IntersectionObserver(function (es) {
		es.forEach(function (en) {
			var t = byEl.get(en.target);
			if (!t || REDUCED) return;
			if (en.isIntersecting && en.intersectionRatio >= 0.4) {
				var wait = t.el.classList.contains("is-in") && t.arrived ? 0 : 260;
				t.arrived = true;
				t.later(function () { t.play(); }, wait);
			} else if (!en.isIntersecting) {
				t.reset();
				t.gen++;
			}
		});
	}, { threshold: [0, 0.4] });

	tiles.forEach(function (t) { arrive.observe(t.el); stageIn.observe(t.el); });
})();

// Name the same Mac as the demo above (it decides from the browser's battery report).
document.addEventListener("DOMContentLoaded", function () {
	var name = document.querySelector("[data-devname]"), symbol = document.querySelector("[data-devsym]");
	Array.prototype.forEach.call(document.querySelectorAll("[data-devname-copy]"), function (el) { if (name) el.textContent = name.textContent; });
	Array.prototype.forEach.call(document.querySelectorAll("[data-devsym-copy]"), function (el) { if (symbol) el.innerHTML = symbol.innerHTML; });
});
