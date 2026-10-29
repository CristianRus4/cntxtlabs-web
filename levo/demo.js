/*
 * Levo demo: a fake Mac desktop with Levo's menubar popover (the app's round 5
 * design), playable with fake data, forever: clean, then Analyse now and it all
 * grows back.
 *
 * Everything the popover shows comes from LEVO_DEMO below, so its pieces can be
 * swapped for the app's own later. Symbols are real SF Symbols, exported by
 * tools/export-symbols.swift into img/symbols/symbols.js. The desktop uses only
 * what the browser already knows (time, date, time zone, language, battery,
 * appearance, device family). Nothing leaves the browser, and nothing asks for
 * permission.
 *
 * Mount: <div id="levo-demo"></div>, then LevoDemo.mount(el). The page can call
 * LevoDemo.open(), LevoDemo.setAlert(gb) and LevoDemo.setAgent(name).
 * The menubar menus live in menus.js (LevoMenus), attached here when present.
 */
(function () {
	"use strict";

	// The one data object. Sizes in GB, CPU and GPU in percent.
	// An item's level is the first cleanup level that ticks it: 1 Careful,
	// 2 Balanced, 3 Thorough, 0 never (the guard says no).
	var LEVO_DEMO = {
		app: "Finder",
		menus: [["file", "File"], ["edit", "Edit"], ["view", "View"], ["go", "Go"], ["window", "Window"], ["help", "Help"]],
		agent: "Claude Code",
		computer: "MacBook Pro",
		disk: {
			name: "Macintosh HD",
			total: 460,
			free: 16,
			alert: 20,
			used: [
				{ id: "system", label: "System Data", gb: 64, color: ["#3D5AFE", "#7C8CFF"] },
				{ id: "apps", label: "Apps", gb: 96, color: ["#1F7AE0", "#4FA3F8"] },
				{ id: "developer", label: "Developer", gb: 101, color: ["#6A3DEC", "#A485FF"] },
				{ id: "documents", label: "Documents", gb: 70, color: ["#D99A00", "#FFC531"] },
				{ id: "media", label: "Photos and Media", gb: 44, color: ["#C2307E", "#EC5FA8"] },
				{ id: "other", label: "Other", gb: 29, color: ["#9A6A43", "#C99A72"] }
			]
		},
		memory: { total: 24, other: 5.5 },
		cpu: { cores: 8, other: 42 },
		gpu: { other: 0 },
		levels: ["Careful", "Balanced", "Aggressive"],
		level: "Balanced",
		groups: [
			{ id: "xcode", about: ["Compiled code, indexes and previews Xcode keeps for your projects.", "Xcode makes it from your source code, which stays untouched.", "Xcode rebuilds it on the next build; that build takes longer."], title: "Xcode build data", symbol: "hammer.fill", tile: "blue", changed: "12 days ago",
				location: "~/Library/Developer/Xcode", verdict: "Rebuilds on next build", good: true,
				items: [{ name: "DerivedData/Levo", gb: 6.8, level: 1 }, { name: "DerivedData/Elevate", gb: 4.9, level: 1 }, { name: "DerivedData/Context", gb: 2.5, level: 1 }] },
			{ id: "sims", about: ["Simulator devices you haven\u2019t opened in weeks.", "Their apps and data are test copies; the runtimes stay.", "Xcode makes a fresh device when you need one."], title: "Simulators and emulators", symbol: "iphone", tile: "grey", changed: "3 weeks ago",
				location: "~/Library/Developer/CoreSimulator", verdict: "Unused devices, runtimes kept", good: true,
				items: [{ name: "iPhone 17 Pro", gb: 2.1, level: 2 }, { name: "iPad Air", gb: 1.9, level: 2 }, { name: "iPhone 16e", gb: 1.7, level: 2 }, { name: "iPhone SE", gb: 1.5, level: 2 }, { name: "Apple Watch Series 11", gb: 1.4, level: 2 }, { name: "Apple TV 4K", gb: 1.2, level: 2 }] },
			{ id: "worktrees", about: ["Copies of your repos that coding agents made to work in.", "Two still have unmerged work, so they stay unticked.", "Merged ones go with git worktree remove."], title: "Agent worktrees", symbol: "arrow.triangle.branch", tile: "purple", tag: "Review", changed: "2 days ago",
				location: "~/Developer/.worktrees", verdict: "Two have unmerged work", good: false,
				items: [{ name: "fix-login", gb: 2.3, level: 0 }, { name: "settings-pass", gb: 1.9, level: 0 }, { name: "ui-cleanup", gb: 1.2, level: 3 }, { name: "tmp-copy", gb: 0.7, level: 3 }] },
			{ id: "downloads", about: ["Installers and archives you already used.", "The apps they installed stay installed.", "They go to the Trash, so you can get them back."], title: "Downloads and installers", symbol: "arrow.down.circle.fill", tile: "green", changed: "5 months ago",
				location: "~/Desktop, ~/Downloads", verdict: "Installed long ago", good: true,
				trash: true, items: [{ name: "Old Installers", gb: 2.4, level: 2, desk: "installers" }, { name: "project-final-v2.zip", gb: 1.1, level: 2, desk: "zip" }, { name: "Downloads/Setup.dmg", gb: 0.8, level: 2 }] },
			{ id: "packages", about: ["Packages that npm, pnpm, Homebrew, SwiftPM and pip keep.", "Your projects keep their own copies.", "They download again the next time you install."], title: "Package caches", symbol: "shippingbox.fill", tile: "orange", changed: "today",
				location: "~/Library/Caches", verdict: "Downloads again when needed", good: true,
				items: [{ name: "npm", gb: 1.2, level: 1 }, { name: "pnpm store", gb: 0.9, level: 1 }, { name: "Homebrew", gb: 0.6, level: 1 }, { name: "SwiftPM", gb: 0.4, level: 1 }, { name: "pip", gb: 0.3, level: 1 }] },
			{ id: "browsers", about: ["Pages and images your browsers saved to load faster.", "Bookmarks, history and passwords aren\u2019t in it.", "It fills again as you browse."], title: "Browser caches", symbol: "globe", tile: "cyan", changed: "today",
				location: "~/Library/Caches", verdict: "Rebuilds as you browse", good: true,
				items: [{ name: "Chrome", gb: 0.7, level: 1 }, { name: "Safari", gb: 0.4, level: 1 }] },
			{ id: "logs", about: ["Crash reports and logs from apps and the simulator.", "Nothing reads them unless something breaks.", "New ones are written as things happen."], title: "Logs and crash reports", symbol: "doc.text.fill", tile: "grey", changed: "yesterday",
				location: "~/Library/Logs", verdict: "Old reports nobody reads", good: true,
				items: [{ name: "DiagnosticReports", gb: 0.6, level: 2 }, { name: "CoreSimulator logs", gb: 0.3, level: 2 }] }
		],
		processes: [
			// Rows Levo won't quit are dimmed; why sits behind the ⓘ on hover.
			// Apps show their own icon (img/apps/, rendered from the installed app, light and dark);
			// processes with no app get the neutral tile, as Levo shows them.
			{ id: "node", name: "node", symbol: "terminal", tile: "grey", why: "An idle build server, running for 3 hours. Safe to quit.", safe: true, cpu: 84, gpu: 0, mem: 1.9 },
			{ id: "xcode", name: "Xcode", app: "xcode", why: "Open with your projects. Quitting closes them.", cpu: 31, gpu: 1, mem: 3.2 },
			{ id: "vm", name: "VirtualMachine", symbol: "terminal", tile: "grey", why: "macOS needs it, so Levo won\u2019t quit it.", system: true, cpu: 3, gpu: 0, mem: 1.2 },
			{ id: "windowserver", name: "WindowServer", symbol: "terminal", tile: "grey", why: "macOS needs it, so Levo won\u2019t quit it.", system: true, cpu: 12, gpu: 4, mem: 0.8 },
			{ id: "claude", name: "Claude", app: "claude", why: "Open with one window.", cpu: 6, gpu: 1, mem: 0.9 },
			{ id: "safari", name: "Safari", app: "safari", why: "Open with four tabs.", cpu: 5, gpu: 2, mem: 2.6 },
			{ id: "cursor", name: "Cursor", app: "cursor", why: "An editor with two projects open.", cpu: 4, gpu: 0, mem: 2.1 }
		],
		// Desktop icons, in a column from the top left (below the widgets when they show).
		desktop: [
			{ id: "shot", kind: "shot", name: "Screenshot 2026-10-12 at 9.41.22 am.png", col: 0, row: 0 },
			{ id: "installers", kind: "folder", name: "Old Installers", col: 1, row: 0 },
			{ id: "zip", kind: "zip", name: "project-final-v2.zip", col: 0, row: 1 },
			{ id: "notes", kind: "doc", name: "notes (3).txt", col: 1, row: 1 },
			{ id: "unzipped", kind: "folder", name: "project-final-v2", col: 0, row: 2, later: true },
			{ id: "dmg", kind: "volume", name: "Levo", col: 1, row: 2 }
		],
		// The dock, from img/dock/ (one folder, so the set can be swapped).
		dock: [
			{ id: "finder", name: "Finder", img: "img/dock/finder.png" },
			{ id: "safari", name: "Safari", img: "img/dock/safari.png" },
			{ id: "mail", name: "Mail", img: "img/dock/mail.png" },
			{ id: "messages", name: "Messages", img: "img/dock/messages.png" },
			{ id: "notes", name: "Notes", img: "img/dock/notes.png" },
			{ id: "music", name: "Music", img: "img/dock/music.png" },
			{ id: "photos", name: "Photos", img: "img/dock/photos.png" },
			{ id: "calendar", name: "Calendar", img: "img/dock/calendar.png" },
			{ id: "settings", name: "System Settings", img: "img/dock/settings.png" },
			{ id: "terminal", name: "Terminal", img: "img/dock/terminal.png" },
			{ id: "levo", name: "Levo", img: "img/dock/levo.png" },
			{ id: "trash", name: "Trash", img: "img/dock/trash-empty.png", full: "img/dock/trash-full.png" }
		],
		notification: { title: "Disk below {alert}", body: "{ready} ready to clean up" },
		cleaned: { title: "Freed {freed}", body: "{free} free on {disk}" },
		quip: "Still here.",
		timing: { notify: 1500, open: 2700 }
	};

	var TILES = {
		blue: ["#5AA9FF", "#2F7EF0"], grey: ["#8E8E93", "#636366"], purple: ["#B49BFF", "#8360F0"],
		orange: ["#FFA94D", "#F07F12"], cyan: ["#5ED0F5", "#1FA4D6"], green: ["#6BDDA6", "#2DB872"],
		dark: ["#4A4A4D", "#2E2E31"], magenta: ["#F06BC0", "#CF2F98"], indigo: ["#7C8CFF", "#4F5FE8"],
		yellow: ["#FFD25C", "#F2AE12"], teal: ["#5FD3C7", "#1FAE9F"], red: ["#FF7A7A", "#E5484D"]
	};
	// The gauges' arc, from the app's TickGauge.
	var ARC = ["#4FA3F8", "#59D499", "#FFC531", "#FF9217", "#FF6363"];

	var MARK = "M136.236384,259.751092 C136.222025,206.68225 248.484288,129.019969 410.305916,70.1516247 C572.127544,11.2832803 743.45648,-14.2207732 828.576849,7.88774474 C913.697219,29.9962627 891.541097,94.2453291 774.486384,164.741092 C757.896384,174.731092 743.796384,197.231092 743.796384,216.601092 L743.796384,304.251092 C743.810742,357.319933 631.54848,434.982215 469.726851,493.850559 C307.905223,552.718903 136.576288,578.222957 51.4559182,556.114439 C-33.6644514,534.005921 -11.5083293,469.756855 105.546384,399.261092 C122.136384,389.271092 136.236384,366.771092 136.236384,347.401092 L136.236384,259.751092 Z";

	var LANG = (navigator.languages && navigator.languages[0]) || navigator.language || "en-NZ";
	var REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
	var num1 = numFormat({ maximumFractionDigits: 1 });
	var num0 = numFormat({ maximumFractionDigits: 0 });
	var TICKS = 60;

	function numFormat(opts) {
		try { return new Intl.NumberFormat(LANG, opts); } catch (e) { return new Intl.NumberFormat("en-NZ", opts); }
	}
	function gb(v) {
		var r = Math.round(v * 10) / 10;
		return (Math.abs(r) >= 100 ? num0.format(Math.round(r)) : num1.format(r)) + " GB";
	}
	function pct(v) { return num0.format(Math.round(v)) + " %"; }
	function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
	function fill(t, vars) { return t.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; }); }
	function sum(a, f) { return a.reduce(function (n, x) { return n + f(x); }, 0); }

	// A real SF Symbol, inline, in currentColor. size is the point size; the
	// symbols were exported at 16 pt, so proportions stay the symbol's own.
	function sym(name, size, cls) {
		var s = (window.LEVO_SYMBOLS || {})[name];
		var k = (size || 16) / 16;
		if (!s) return '<span class="lv-sym' + (cls ? " " + cls : "") + '" style="width:' + (size || 16) + "px;height:" + (size || 16) + 'px" aria-hidden="true"></span>';
		return '<svg class="lv-sym' + (cls ? " " + cls : "") + '" width="' + (s.w * k).toFixed(2) + '" height="' + (s.h * k).toFixed(2) + '" viewBox="0 0 ' + s.w + " " + s.h + '" fill="currentColor" aria-hidden="true">' + s.body + "</svg>";
	}
	function tile(color, name, size) {
		var c = TILES[color] || TILES.grey;
		return '<span class="lv-tile' + (size ? " lv-tile-" + size : "") + '" style="--t1:' + c[0] + ";--t2:" + c[1] + '">' + sym(name, size === "lg" ? 15 : size === "sm" ? 9 : 13) + "</span>";
	}
	function mark(cls) {
		return '<svg class="lv-mark' + (cls ? " " + cls : "") + '" viewBox="0 0 882 564" aria-hidden="true"><path transform="translate(0.98 0)" d="' + MARK + '" vector-effect="non-scaling-stroke"/></svg>';
	}
	function caps(keys, cls) {
		return '<span class="lv-caps">' + keys.map(function (k) { return '<span class="lv-cap' + (cls ? " " + cls : "") + '">' + k + "</span>"; }).join("") + "</span>";
	}

	// What the browser knows about this visitor, without asking.
	function city() {
		var tz = "";
		try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
		if (!tz || tz.indexOf("/") < 0) return "";
		return tz.split("/").pop().replace(/_/g, " ");
	}
	function deviceFamily() {
		var ua = navigator.userAgent || "";
		var p = (navigator.userAgentData && navigator.userAgentData.platform) || "";
		if (/mac/i.test(p)) return "Mac";
		if (/windows/i.test(p)) return "PC";
		if (/android/i.test(p)) return "Android";
		if (/chrome ?os/i.test(p)) return "Chromebook";
		if (/linux/i.test(p)) return "PC";
		if (/iPhone/.test(ua)) return "iPhone";
		if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "iPad";
		if (/Android/.test(ua)) return "Android";
		if (/Windows/.test(ua)) return "PC";
		return "Mac";
	}
	function dtf(opts) {
		try { return new Intl.DateTimeFormat(LANG, opts); } catch (e) { return new Intl.DateTimeFormat("en-NZ", opts); }
	}
	var fDay = dtf({ weekday: "short", day: "numeric", month: "short" });
	var fTime = dtf({ hour: "numeric", minute: "2-digit" });
	var fLong = dtf({ weekday: "long", day: "numeric", month: "long" });
	var fWidget = dtf({ weekday: "long", day: "numeric", month: "short" });

	// ---------------------------------------------------------------- State

	var S, root, pop, note, scene, timers = [], inView = false, played = false, toastTimer = null, batt = null;

	function fresh() {
		var d = JSON.parse(JSON.stringify(LEVO_DEMO));
		var st = {
			disk: d.disk, mem: d.memory, cpu: d.cpu, gpu: d.gpu,
			groups: d.groups, procs: d.processes, level: d.level,
			sort: "cpu", sel: { type: "group", id: d.groups[0].id },
			open: {}, info: {}, more: false,
			freeShown: d.disk.free, alerted: false, popOpen: false, locked: false, unzipped: false,
			panel: null, sheet: false, menu: false, undo: null, agent: S ? S.agent : d.agent,
			cleanedNote: null, freed: null, analysing: false, trashFull: false, attempts: 0, quipped: false
		};
		applyLevel(st.groups, st.level);
		return st;
	}
	function applyLevel(groups, level) {
		if (level === "Selected") return;
		var n = LEVO_DEMO.levels.indexOf(level) + 1;
		groups.forEach(function (g) { g.items.forEach(function (it) {
			it.on = level === "All" ? it.level > 0 : level === "None" ? false : it.level > 0 && it.level <= n;
		}); });
	}

	function readyGB() { return sum(S.groups, function (g) { return sum(g.items, function (it) { return it.gb; }); }); }
	function tickedGB() { return sum(S.groups, function (g) { return sum(g.items, function (it) { return it.on ? it.gb : 0; }); }); }
	function tickedCount() { return sum(S.groups, function (g) { return g.items.filter(function (it) { return it.on; }).length; }); }
	function gState(g) {
		var n = g.items.filter(function (it) { return it.on; }).length;
		return n === 0 ? "off" : n === g.items.length ? "on" : "mixed";
	}
	function gSize(g) { return sum(g.items, function (it) { return it.gb; }); }
	function usedGB() { return sum(S.disk.used, function (u) { return u.gb; }); }
	function memUsed() { return S.mem.other + sum(S.procs, function (p) { return p.mem; }); }
	function cpuPct() { return (S.cpu.other + sum(S.procs, function (p) { return p.cpu; })) / S.cpu.cores; }
	function gpuPct() { return S.gpu.other + sum(S.procs, function (p) { return p.gpu; }); }
	function low() { return S.disk.free < S.disk.alert; }
	function group(id) { return S.groups.filter(function (g) { return g.id === id; })[0]; }
	function proc(id) { return S.procs.filter(function (p) { return p.id === id; })[0]; }
	function dark() { return document.documentElement.classList.contains("dark"); }

	// ---------------------------------------------------------------- Markup

	function sceneHTML() {
		return '' +
		'<div class="lv-scene is-intro" data-mode="desk" role="region" aria-label="Levo, running on a Mac">' +
			'<div class="lv-wall" data-act="desk"></div>' +
			'<div class="lv-icons" data-icons></div>' +
			'<div class="lv-widgets" aria-hidden="true">' +
				'<div class="lv-widget lv-w-clock"><span class="lv-w-city" data-city></span><span class="lv-w-date" data-wdate></span><span class="lv-w-time" data-wtime></span></div>' +
				'<div class="lv-widget lv-w-batt" data-wbatt hidden><span class="lv-w-ring"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" class="lv-ring-bg"/><circle cx="32" cy="32" r="27" class="lv-ring-fg" data-ringfg/></svg><span class="lv-w-ringglyph" data-ringglyph></span></span><span class="lv-w-dev" data-dev></span><span class="lv-w-level" data-level></span></div>' +
				'<div class="lv-widget lv-w-cal" data-wcal></div>' +
			'</div>' +
			'<div class="lv-dock" data-dock></div>' +
			lwinHTML() +
			'<div class="lv-menubar">' +
				'<div class="lv-mb-left">' +
					'<button type="button" class="lv-mb-btn lv-mb-apple" data-menu="apple" aria-label="Apple menu">' + sym("applelogo", 15) + '</button>' +
					'<button type="button" class="lv-mb-btn lv-mb-app" data-menu="app">' + esc(LEVO_DEMO.app) + '</button>' +
					LEVO_DEMO.menus.map(function (m) { return '<button type="button" class="lv-mb-btn lv-mb-menu" data-menu="' + m[0] + '">' + m[1] + "</button>"; }).join("") +
				'</div>' +
				'<div class="lv-mb-right">' +
					'<button type="button" class="lv-mb-levo" data-act="toggle" aria-label="Levo" aria-expanded="false">' + mark("lv-mb-mark") + '<span class="lv-mb-num" data-mbnum></span></button>' +
					'<button type="button" class="lv-mb-btn lv-mb-item" data-menu="wifi" aria-label="Wi-Fi"><span data-wifi>' + sym("wifi", 15) + '</span></button>' +
					'<button type="button" class="lv-mb-btn lv-mb-item lv-mb-batt" data-menu="battery" aria-label="Battery" hidden><span class="lv-mb-pct" data-battpct></span><span class="lv-batt" data-battsym>' + sym("battery.100percent", 15) + '</span></button>' +
					'<button type="button" class="lv-mb-btn lv-mb-item" data-menu="control" aria-label="Control Centre">' + sym("switch.2", 14) + '</button>' +
					'<button type="button" class="lv-mb-btn lv-mb-item lv-mb-clock" data-menu="clock"><span class="lv-mb-day" data-day></span><span data-time></span></button>' +
				'</div>' +
			'</div>' +
			'<button type="button" class="lv-note" data-act="note" aria-live="polite">' +
				'<img class="lv-note-icon" src="img/icon-96.png" width="38" height="38" alt="">' +
				'<span class="lv-note-text"><span class="lv-note-top"><b data-ntitle></b><span class="lv-note-when">now</span></span><span data-nbody></span></span>' +
			'</button>' +
			'<div class="lv-popwrap">' + popHTML() + '</div>' +
			'<span class="lv-quip" data-quip hidden></span>' +
			'<div class="lv-lock" data-act="unlock" aria-hidden="true">' +
				'<span class="lv-lock-date" data-ldate></span><span class="lv-lock-time" data-ltime></span>' +
				'<span class="lv-lock-who"><span class="lv-lock-avatar">' + sym("person.crop.circle", 30) + '</span><span>Click to unlock</span></span>' +
			'</div>' +
		'</div>';
	}

	function gaugeHTML(id, label) {
		var lines = "";
		for (var i = 0; i < 26; i++) {
			var a = (135 + i * 10.8) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
			lines += '<line x1="' + (32 + 23 * c).toFixed(2) + '" y1="' + (32 + 23 * s).toFixed(2) + '" x2="' + (32 + 30.5 * c).toFixed(2) + '" y2="' + (32 + 30.5 * s).toFixed(2) + '" style="--on:' + arcColor(i / 25) + '"/>';
		}
		return '<div class="lv-gauge" data-gauge="' + id + '">' +
			'<div class="lv-dial"><svg viewBox="0 0 64 64" aria-hidden="true">' + lines + '</svg><span class="lv-dial-num"><span data-gnum></span><small>%</small></span><i class="lv-spin lv-dial-spin" hidden></i></div>' +
			'<button type="button" class="lv-g-label" data-act="free" data-metric="' + id + '" data-label="' + label + '" data-hover="' + (id === "memory" ? "Free memory" : "Free " + label) + '"></button></div>';
	}
	function arcColor(p) {
		var s = Math.min(1, Math.max(0, p)) * (ARC.length - 1), i = Math.min(ARC.length - 2, Math.floor(s)), m = s - i;
		var a = hex(ARC[i]), b = hex(ARC[i + 1]);
		return "rgb(" + [0, 1, 2].map(function (k) { return Math.round(a[k] + (b[k] - a[k]) * m); }).join(",") + ")";
	}
	function hex(h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); }

	function popHTML() {
		var ticks = "";
		for (var i = 0; i < TICKS; i++) ticks += '<i class="lv-tick" data-i="' + i + '"></i>';
		return '' +
		'<div class="lv-pop" role="dialog" aria-label="Levo" tabindex="-1">' +
			'<section class="lv-disk">' +
				'<div class="lv-dhead"><span class="lv-sec" data-devsym>' + sym("desktopcomputer", 14) + '</span><b data-devname>Mac</b></div>' +
				'<div class="lv-hero"><span class="lv-free lv-num" data-free></span><span class="lv-sec">free</span><span class="lv-flex"></span><span class="lv-can lv-num" data-can></span></div>' +
				'<div class="lv-dbar" data-dbar><div class="lv-ticks">' + ticks + '</div><span class="lv-tip" data-tip hidden></span></div>' +
			'</section>' +
			'<div class="lv-sep"></div>' +
			'<section class="lv-gauges">' + gaugeHTML("memory", "Memory") + gaugeHTML("cpu", "CPU") + gaugeHTML("gpu", "GPU") + '</section>' +
			'<div class="lv-freed" data-freed hidden></div>' +
			'<div class="lv-sep"></div>' +
			'<div class="lv-scroll">' +
				'<div class="lv-sh"><span>Ready to free</span><span class="lv-sh-r"><span class="lv-sh-note" data-ready></span><button type="button" class="lv-dd" data-act="levelmenu" aria-haspopup="menu"><span data-levellabel></span>' + sym("chevron.down", 9, "lv-sec") + '</button></span></div>' +
				'<div class="lv-list" data-groups></div>' +
				'<div class="lv-sep lv-sep-in"></div>' +
				'<div class="lv-sh"><span>Processes</span><span class="lv-seg" role="tablist">' +
					['memory', 'cpu', 'gpu'].map(function (k) { return '<button type="button" role="tab" data-act="sort" data-sort="' + k + '">' + (k === "memory" ? "Memory" : k.toUpperCase()) + '</button>'; }).join("") +
				'</span></div>' +
				'<div class="lv-list" data-procs></div>' +
				'<div style="height:8px"></div>' +
			'</div>' +
			'<div class="lv-actions">' +
				'<div class="lv-act-left" data-actleft></div>' +
				'<div class="lv-act-right"><button type="button" class="lv-primary" data-act="primary"><span data-plabel></span><span data-pcaps></span></button>' +
				'<button type="button" class="lv-kbtn" data-act="panel" aria-label="Actions" title="Actions ⌘K">' + sym("switch.2", 13, "lv-sec") + '</button></div>' +
			'</div>' +
			'<div class="lv-panel" data-panel hidden></div>' +
			'<div class="lv-menu" data-levels hidden></div>' +
			'<div class="lv-sheet" data-sheet hidden></div>' +
			'<div class="lv-bubble" data-bubbletip hidden></div>' +
		'</div>';
	}

	function iconHTML(ic) {
		var art;
		if (ic.kind === "folder") art = '<span class="lv-ic-folder">' + sym("folder.fill", 54) + "</span>";
		else if (ic.kind === "zip") art = '<span class="lv-ic-page lv-ic-zip"><i></i><b>ZIP</b></span>';
		else if (ic.kind === "doc") art = '<span class="lv-ic-page lv-ic-txt"><i></i><em></em><em></em><em></em><b>TXT</b></span>';
		else if (ic.kind === "volume") art = '<span class="lv-ic-vol"><img class="lv-dk-l" src="img/desk/levo-volume.png" width="64" height="64" alt="" draggable="false"><img class="lv-dk-d" src="img/desk/levo-volume-dark.png" width="64" height="64" alt="" draggable="false"></span>';
		else art = '<span class="lv-ic-shot"><i></i></span>';
		return '<button type="button" class="lv-ic' + (ic.later ? " is-hidden" : "") + '" data-icon="' + ic.id + '" style="--col:' + ic.col + ";--row:" + ic.row + '">' + art + '<span class="lv-ic-name">' + esc(ic.name) + "</span></button>";
	}
	// The Levo window on the desktop: the app, Applications, the price and Download.
	// A disk image window, as a Mac app arrives. On a phone it is a plain card.
	function lwinHTML() {
		return '<div class="lv-lwin" data-lwin role="dialog" aria-label="Levo">' +
			'<div class="lv-lwin-bar"><span class="lv-lights"><button type="button" data-act="lwinclose" aria-label="Close">' + sym("xmark", 7) + '</button><button type="button" data-act="lwinmin" aria-label="Minimise">' + sym("minus", 7) + '</button><button type="button" tabindex="-1" aria-hidden="true">' + sym("plus", 7) + '</button></span><b>Levo</b></div>' +
			'<div class="lv-lwin-body">' +
				'<button type="button" class="lv-lwin-app" data-act="lwinapp" aria-label="Levo"><img src="img/icon-256.png" width="104" height="104" alt="" draggable="false"><span>Levo</span></button>' +
				'<svg class="lv-lwin-arrow" viewBox="0 0 120 24" aria-hidden="true"><path d="M4 12h98"/><path d="M98 4l10 8-10 8"/></svg>' +
				'<span class="lv-lwin-apps" data-lwinapps><span class="lv-lwin-folder">' + sym("folder.fill", 84) + '<span class="lv-lwin-a">' + sym("app.badge", 26) + '</span></span><span>Applications</span></span>' +
			'</div>' +
			'<div class="lv-lwin-foot"><span class="lv-lwin-price"><b data-lprice></b><span data-lterm></span></span><span class="lv-flex"></span>' +
				'<a class="lv-lbtn" data-lbuy href="#">Buy</a><a class="lv-lbtn lv-lbtn-primary" data-ldownload href="#">Download</a></div>' +
		'</div>' +
		'<p class="lv-hint" aria-hidden="true">' + sym("cursorarrow", 12, "lv-hint-arrow") + '<span data-hint></span></p>';
	}
	function dockHTML() {
		return '<div class="lv-dock-shelf"></div>' + LEVO_DEMO.dock.map(function (d) {
			var dark = d.img.replace(/\.png$/, "-dark.png");
			var art = d.full ? '<img src="' + d.img + '" alt="" draggable="false">' :
				'<img class="lv-dk-l" src="' + d.img + '" alt="" draggable="false"><img class="lv-dk-d" src="' + dark + '" alt="" draggable="false">';
			return (d.id === "trash" ? '<span class="lv-dock-sep"></span>' : "") +
				'<button type="button" class="lv-dk" data-dock="' + d.id + '" aria-label="' + esc(d.name) + '"><span class="lv-dk-lift"><span class="lv-dk-art">' + art + '</span></span><span class="lv-dk-label">' + esc(d.name) + '</span><i class="lv-dk-dot"></i></button>';
		}).join("");
	}

	// ---------------------------------------------------------------- Render

	function $(sel, el) { return (el || root).querySelector(sel); }
	function $$(sel, el) { return Array.prototype.slice.call((el || root).querySelectorAll(sel)); }

	function render() {
		renderDisk(S.freeShown);
		renderBar();
		renderGauges();
		renderGroups();
		renderProcs();
		renderActions();
		renderMenubar();
		renderIcons();
	}

	function renderDisk(free) {
		$("[data-free]").textContent = gb(free);
		var t = tickedGB();
		$("[data-can]").innerHTML = t > 0 ? "<b>" + gb(t) + "</b>\u2009to clean up" : "";
		$("[data-ready]").innerHTML = S.analysing ? '<i class="lv-spin"></i>Analysing' : readyGB() > 0 ? gb(readyGB()) : "";
		$("[data-levellabel]").textContent = LEVO_DEMO.levels.indexOf(S.level) >= 0 ? "Smartly" : S.level;
	}

	// The disk in ticks. Each tick is wholly one category's colour, shared out by
	// size with at least one tick for every category present (the app's rule):
	// what's in use, then what a clean would free, in green, then free space.
	function segments() {
		var unticked = readyGB() - tickedGB(), d = dark() ? 1 : 0;
		var segs = S.disk.used.map(function (u) {
			return { id: u.id, label: u.label, gb: u.gb + (u.id === "developer" ? unticked : 0), color: u.color[d] };
		});
		var t = tickedGB();
		if (t > 0) segs.push({ id: "can", label: "Can free", gb: t, color: "var(--lv-ready)" });
		segs.push({ id: "free", label: "Free", gb: Math.max(0, S.disk.total - sum(segs, function (s) { return s.gb; })), color: "" });
		return segs;
	}
	function allocate(segs, n) {
		var present = segs.filter(function (s) { return s.gb > 0.05; });
		var total = sum(present, function (s) { return s.gb; });
		var raw = present.map(function (s) { return s.gb / total * n; });
		var count = raw.map(function (r) { return Math.max(1, Math.floor(r)); });
		var order = raw.map(function (r, i) { return { i: i, f: r - Math.floor(r) }; }).sort(function (a, b) { return b.f - a.f; });
		var used = sum(count, function (c) { return c; }), k = 0;
		while (used < n) { count[order[k % order.length].i]++; used++; k++; }
		while (used > n) { var m = count.indexOf(Math.max.apply(null, count)); count[m]--; used--; }
		var out = [];
		present.forEach(function (s, i) { for (var j = 0; j < count[i]; j++) out.push(s); });
		return out;
	}
	function renderBar(sweep) {
		var owners = allocate(segments(), TICKS);
		$$(".lv-tick").forEach(function (el, i) {
			var s = owners[i];
			el.dataset.seg = s.id;
			el.style.transitionDelay = sweep ? Math.max(0, (i - 26) * 24) + "ms" : "0ms";
			el.style.backgroundColor = s.color;
		});
	}

	function setGauge(id, value) {
		var g = $('[data-gauge="' + id + '"]');
		var on = Math.round(Math.max(0, Math.min(100, value)) / 100 * 26);
		$$("line", g).forEach(function (l, i) { l.classList.toggle("on", i < on); });
		$("[data-gnum]", g).textContent = num0.format(Math.round(value));
	}
	function renderGauges() {
		setGauge("memory", memUsed() / S.mem.total * 100);
		setGauge("cpu", cpuPct());
		setGauge("gpu", gpuPct());
	}

	function checkbox(state, act, id, item) {
		return '<button type="button" class="lv-cb" role="checkbox" aria-checked="' + (state === "on" ? "true" : state === "mixed" ? "mixed" : "false") + '" data-act="' + act + '" data-id="' + id + '"' + (item != null ? ' data-item="' + item + '"' : "") + ' aria-label="Tick">' +
			(state === "on" ? sym("checkmark", 10) : state === "mixed" ? sym("minus", 10) : "") + "</button>";
	}

	function renderGroups() {
		var el = $("[data-groups]");
		if (!S.groups.length) {
			el.innerHTML = '<div class="lv-empty"><span>' + (S.analysing ? "Looking for what can go" : "Nothing to clean") + "</span>" +
				(S.analysing ? "" : '<button type="button" class="lv-link" data-act="analyse">Analyse now</button>') + "</div>";
			return;
		}
		var shown = S.more ? S.groups : S.groups.slice(0, 5);
		el.innerHTML = shown.map(function (g) {
			var sel = S.sel && S.sel.type === "group" && S.sel.id === g.id;
			var h = '<div class="lv-row lv-grow' + (sel ? " is-sel" : "") + (S.open[g.id] ? " is-open" : "") + (g.isNew ? " is-new" : "") + '" data-act="grow" data-id="' + g.id + '">' +
				checkbox(gState(g), "tick", g.id) + tile(g.tile, g.symbol) +
				'<span class="lv-gtext"><span class="lv-title">' + esc(g.title) + '</span><span class="lv-subt">' + g.items.length + (g.items.length === 1 ? " item" : " items") + " · changed " + esc(g.changed) + "</span></span>" +
				'<span class="lv-flex"></span>' +
				'<button type="button" class="lv-info" data-act="info" data-bubble="g:' + g.id + '" aria-label="Info">' + sym("info.circle", 13) + "</button>" +
				'<span class="lv-size lv-num" data-size="' + g.id + '">' + gb(g.shown != null ? g.shown : gSize(g)) + "</span>" +
				'<span class="lv-chev">' + sym("chevron.right", 10) + "</span>" +
			"</div>";
			if (S.open[g.id]) {
				h += '<div class="lv-items">' + g.items.map(function (it, i) {
					return '<div class="lv-row lv-irow" data-act="titem" data-id="' + g.id + '" data-item="' + i + '">' + checkbox(it.on ? "on" : "off", "titem", g.id, i) +
						'<span class="lv-iname">' + esc(it.name) + '</span><span class="lv-flex"></span><span class="lv-size lv-num">' + gb(it.gb) + '</span><span class="lv-chev-gap"></span></div>';
				}).join("") + "</div>";
			}
			return h;
		}).join("") + (S.groups.length > 5 ? '<div class="lv-row lv-more" data-act="more"><span>' + (S.more ? "Show less" : "Show more") + "</span></div>" : "");
	}
	function detailRow(k, v) { return '<div class="lv-drow"><span>' + k + "</span><span>" + v + "</span></div>"; }

	function renderProcs() {
		var key = S.sort === "memory" ? "mem" : S.sort;
		var list = S.procs.slice().sort(function (a, b) { return b[key] - a[key]; }).slice(0, 4);
		$$("[data-sort]").forEach(function (b) { var on = b.dataset.sort === S.sort; b.classList.toggle("is-on", on); b.setAttribute("aria-selected", on); });
		$("[data-procs]").innerHTML = list.map(function (p) {
			var sel = S.sel && S.sel.type === "proc" && S.sel.id === p.id;
			var v = key === "mem" ? gb(p.mem) : pct(p[key]);
			var art = p.app ? '<span class="lv-picon"><img class="lv-dk-l" src="img/apps/' + p.app + '.png" width="20" height="20" alt=""><img class="lv-dk-d" src="img/apps/' + p.app + '-dark.png" width="20" height="20" alt=""></span>' : tile(p.tile, p.symbol);
			return '<div class="lv-row lv-prow' + (sel ? " is-sel" : "") + (p.system ? " is-dim" : "") + (p.isNew ? " is-new" : "") + '" data-act="prow" data-id="' + p.id + '">' + art +
				'<span class="lv-title">' + esc(p.name) + '</span><span class="lv-flex"></span>' +
				'<button type="button" class="lv-info" data-act="info" data-bubble="p:' + p.id + '" aria-label="Info">' + sym("info.circle", 13) + "</button>" +
				'<span class="lv-size lv-num lv-pval">' + v + "</span></div>";
		}).join("");
	}

	function primary() {
		if (S.sel && S.sel.type === "proc") {
			var p = proc(S.sel.id);
			if (p && !p.system) return { label: "Quit " + p.name, keys: ["↵"], act: "quitSel" };
			if (p) return { label: "Clean up", keys: ["⌘", "⌫"], act: null };
		}
		var t = tickedGB();
		return { label: "Clean up", keys: ["⌘", "⌫"], act: t > 0 ? "clean" : null };
	}
	function renderActions() {
		var p = primary(), btn = $('[data-act="primary"]');
		$("[data-plabel]").textContent = p.label;
		$("[data-pcaps]").innerHTML = caps(p.keys, "lv-cap-sm");
		btn.disabled = !p.act;
		if (!toastTimer) $("[data-actleft]").innerHTML = '<span class="lv-checked">' + (S.analysing ? "Checking" : "Checked just now") + "</span>";
	}

	function renderMenubar() {
		var b = $(".lv-mb-levo"), state = "normal";
		if (S.alerted && low()) state = "alert";
		else if (S.alerted && readyGB() > 0) state = "ready";
		b.dataset.state = state;
		$("[data-mbnum]").textContent = state === "alert" ? gb(S.disk.free) : "";
		b.classList.toggle("is-open", S.popOpen);
		b.setAttribute("aria-expanded", S.popOpen);
	}

	// Desktop icons that belong to a cleanup item go when it is cleaned and come back with it.
	function renderIcons() {
		var live = {};
		S.groups.forEach(function (g) { g.items.forEach(function (it) { if (it.desk) live[it.desk] = true; }); });
		var owned = {};
		LEVO_DEMO.groups.forEach(function (g) { g.items.forEach(function (it) { if (it.desk) owned[it.desk] = true; }); });
		var dock = $("[data-dock]"), trash = $('[data-dock="trash"]');
		var tx = dock.offsetLeft - dock.offsetWidth / 2 + (trash ? trash.offsetLeft + trash.offsetWidth / 2 : 0), ty = dock.offsetTop + 30;
		$$("[data-icon]").forEach(function (el) {
			var id = el.dataset.icon;
			el.style.setProperty("--tx", (tx - el.offsetLeft - 46) + "px");
			el.style.setProperty("--ty", (ty - el.offsetTop - 30) + "px");
			el.classList.toggle("is-gone", !!owned[id] && !live[id]);
		});
	}

	// ---------------------------------------------------------------- Desktop, from the browser

	function tickClock() {
		var now = new Date();
		var time = fTime.format(now);
		$("[data-day]").textContent = fDay.format(now).replace(/,/g, "");
		$("[data-time]").textContent = time;
		$("[data-wtime]").textContent = time;
		$("[data-wdate]").textContent = fWidget.format(now).replace(/,/g, "");
		$("[data-ltime]").textContent = time.replace(/\s?[AaPp]\.?[Mm]\.?$/, "");
		$("[data-ldate]").textContent = fLong.format(now);
	}
	// The battery, as macOS shows it: a laptop shows its level and state; a Mac
	// with no battery shows no battery item, and the widget becomes a calendar.
	// Browsers report a desktop Mac as 100 % and charging with no charge time.
	var power = "unknown";
	function battery() {
		var item = $(".lv-mb-batt"), wb = $("[data-wbatt]"), wc = $("[data-wcal]");
		var device = function () {
			var laptop = power === "laptop";
			$("[data-devsym]").innerHTML = sym(laptop ? "laptopcomputer" : power === "desktop" ? "macmini.fill" : "desktopcomputer", 14);
			$("[data-devname]").textContent = laptop ? "MacBook Pro" : power === "desktop" ? "Mac mini" : "Mac";
			$("[data-dev]").textContent = laptop ? "MacBook Pro" : "Mac";
			item.hidden = !laptop;
			wb.hidden = !laptop;
			wc.hidden = laptop;
			layout();
		};
		var show = function (b) {
			var desk = b.charging && b.level === 1 && b.chargingTime === 0 && b.dischargingTime === Infinity;
			power = desk ? "desktop" : "laptop";
			batt = desk ? null : { level: b.level, charging: b.charging };
			if (!desk) {
				var pc = Math.round(b.level * 100);
				// The menubar battery is the real SF Symbol for the level, with the bolt only while charging.
				var steps = [0, 25, 50, 75, 100], step = steps.reduce(function (best, v) { return Math.abs(v - b.level * 100) < Math.abs(best - b.level * 100) ? v : best; }, 100);
				$("[data-battsym]").innerHTML = sym(b.charging ? "battery.100percent.bolt" : "battery." + step + "percent", 15);
				$("[data-battpct]").textContent = pc + " %";
				$("[data-level]").textContent = pc + " %";
				$("[data-ringfg]").style.strokeDashoffset = (169.6 * (1 - b.level)).toFixed(1);
				$("[data-ringglyph]").innerHTML = b.charging ? sym("bolt.fill", 16) : sym("laptopcomputer", 18);
				$("[data-ringfg]").classList.toggle("is-low", b.level <= 0.2 && !b.charging);
			}
			device();
		};
		device();
		if (navigator.getBattery) navigator.getBattery().then(function (b) {
			var up = function () { show(b); };
			up();
			b.addEventListener("levelchange", up);
			b.addEventListener("chargingchange", up);
		}, function () {});
	}
	function calendar() {
		var now = new Date(), y = now.getFullYear(), m = now.getMonth(), today = now.getDate();
		var first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
		var start = (first + 6) % 7, cells = "";
		var wd = dtf({ weekday: "narrow" });
		for (var k = 0; k < 7; k++) cells += '<i class="lv-cal-wd">' + wd.format(new Date(2024, 0, 1 + k)) + "</i>";
		for (var e = 0; e < start; e++) cells += "<i></i>";
		for (var d = 1; d <= days; d++) cells += '<i' + (d === today ? ' class="is-today"' : "") + ">" + d + "</i>";
		$("[data-wcal]").innerHTML = '<span class="lv-cal-m">' + esc(dtf({ month: "long" }).format(now)) + '</span><span class="lv-cal-g">' + cells + "</span>";
	}

	// ---------------------------------------------------------------- Layout

	// The desk fills the first screen at its own size; a phone gets the compact cards.
	function layout() {
		var w = root.clientWidth;
		if (!w) return;
		var compact = w < 760;
		scene.dataset.mode = compact ? "compact" : "desk";
		scene.style.zoom = "";
		var wrap = $(".lv-popwrap"), W = scene.offsetWidth, H = scene.offsetHeight;
		if (compact) { wrap.style.left = ""; return; }
		var b = $(".lv-mb-levo");
		var cx = b.offsetLeft + b.offsetWidth / 2;
		var popLeft = Math.max(12, Math.min(W - 372, cx - 180));
		wrap.style.left = popLeft + "px";
		var widgets = W >= 1180;
		scene.classList.toggle("no-widgets", !widgets);
		// The Levo window sits in the open space between the icons and the popover.
		var win = $("[data-lwin]"), left = widgets ? 380 : 236, right = popLeft - 28;
		var ww = win.offsetWidth, wh = win.offsetHeight;
		var x = Math.round(Math.max(left, left + (right - left - ww) / 2));
		var y = Math.round(Math.max(64, Math.min(H - wh - 190, (H - wh) / 2 - 40)));
		if (!S.lwinMoved) { win.style.left = x + "px"; win.style.top = y + "px"; }
		var hint = $(".lv-hint");
		var dock = $("[data-dock]");
		hint.style.left = (W / 2) + "px";
		hint.style.top = (dock.offsetTop - 34) + "px";
		placeIcons(widgets);
		placeDmg();
		renderIcons();
	}

	// Desktop icons sit loosely, like a real messy desktop: a jittered column from
	// the top left, never over the widgets, the windows, the popover or each other.
	// They can be dragged; positions reset on reload.
	var IC_W = 92, IC_H = 104;
	function rectOf(el) { return el && !el.hidden && el.offsetWidth ? { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight } : null; }
	function hits(a, b, pad) { pad = pad || 0; return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y; }
	function blockers(except) {
		var out = [], wg = $(".lv-widgets"), pw = $(".lv-popwrap");
		if (!scene.classList.contains("no-widgets")) out.push(rectOf(wg));
		out.push({ x: pw.offsetLeft, y: pw.offsetTop, w: pw.offsetWidth, h: $(".lv-pop").offsetHeight });
		out.push(rectOf($("[data-lwin]")));
		out.push({ x: 0, y: $("[data-dock]").offsetTop - 50, w: scene.offsetWidth, h: 200 });
		$$(".lv-ic").forEach(function (el) { if (el !== except && !el.classList.contains("is-hidden") && el.style.left) out.push({ x: el.offsetLeft, y: el.offsetTop, w: IC_W, h: IC_H }); });
		return out.filter(Boolean);
	}
	function freeSpot(el, x0, y0) {
		var bl = blockers(el), W = scene.offsetWidth;
		for (var ring = 0; ring < 40; ring++) {
			for (var k = 0; k < Math.max(1, ring * 8); k++) {
				var a = ring ? k / (ring * 8) * Math.PI * 2 : 0, x = Math.round(x0 + Math.cos(a) * ring * 14), y = Math.round(y0 + Math.sin(a) * ring * 14);
				var me = { x: x, y: y, w: IC_W, h: IC_H };
				if (x < 8 || y < 38 || x + IC_W > W - 8) continue;
				if (!bl.some(function (b) { return hits(me, b, 6); })) return { x: x, y: y };
			}
		}
		return { x: x0, y: y0 };
	}
	// A real messy desktop: files scattered at uneven spots over the left part of
	// the screen (fresh each load), and the mounted disk image at the top right,
	// where macOS puts volumes, or just left of the popover when it would be covered.
	function placeIcons(widgets) {
		if (S.iconsPlaced) return;
		S.iconsPlaced = true;
		var W = scene.offsetWidth, H = scene.offsetHeight, win = rectOf($("[data-lwin]"));
		var pw = $(".lv-popwrap"), popLeft = pw.offsetLeft;
		$$(".lv-ic").forEach(function (el) { el.style.left = ""; });
		var dmg = placeDmg();
		var top = widgets ? 236 : 44, bottom = $("[data-dock]").offsetTop - 64 - IC_H;
		var right = Math.max(220, Math.min((win ? win.x : W / 2) - IC_W - 10, popLeft - IC_W - 20));
		$$(".lv-ic").forEach(function (el) {
			if (el === dmg) return;
			var best = null;
			for (var tries = 0; tries < 60 && !best; tries++) {
				var x = Math.round(16 + Math.random() * Math.max(10, right - 16));
				var y = Math.round(top + Math.random() * Math.max(10, bottom - top));
				var me = { x: x, y: y, w: IC_W, h: IC_H };
				if (!blockers(el).some(function (b) { return hits(me, b, 18); })) best = { x: x, y: y };
			}
			if (!best) best = freeSpot(el, 30, top);
			el.style.left = best.x + "px";
			el.style.top = best.y + "px";
		});
	}
	// The mounted disk image: top right under the menubar, or just left of the
	// popover's column when the popover would cover it. Follows the popover until dragged.
	function placeDmg() {
		var dmg = $('[data-icon="dmg"]');
		if (!dmg || S.dmgMoved) return dmg;
		var W = scene.offsetWidth, popLeft = $(".lv-popwrap").offsetLeft;
		var dx = W - IC_W - 14;
		if (dx + IC_W > popLeft - 8) dx = popLeft - IC_W - 14;
		dmg.style.left = dx + "px";
		dmg.style.top = "40px";
		return dmg;
	}
	function dragIcon(el, e) {
		var x0 = e.clientX, y0 = e.clientY, l0 = el.offsetLeft, t0 = el.offsetTop, moved = false;
		var mv = function (ev) {
			var dx = ev.clientX - x0, dy = ev.clientY - y0;
			if (!moved && Math.abs(dx) + Math.abs(dy) < 5) return;
			if (!moved) { moved = true; S.dragged = true; if (el.dataset.icon === "dmg") S.dmgMoved = true; el.classList.add("is-dragging"); $$(".lv-ic").forEach(function (x) { x.classList.toggle("is-sel", x === el); }); }
			el.style.left = (l0 + dx) + "px";
			el.style.top = (t0 + dy) + "px";
		};
		var up = function () {
			document.removeEventListener("pointermove", mv);
			document.removeEventListener("pointerup", up);
			if (!moved) return;
			el.classList.remove("is-dragging");
			var me = { x: el.offsetLeft, y: el.offsetTop, w: IC_W, h: IC_H };
			var W = scene.offsetWidth, H = scene.offsetHeight;
			var bad = me.x < 0 || me.y < 32 || me.x + IC_W > W || me.y + IC_H > H || blockers(el).some(function (b) { return hits(me, b, 2); });
			if (bad) {
				var p = freeSpot(el, Math.max(8, Math.min(W - IC_W - 8, me.x)), Math.max(40, me.y));
				el.classList.add("is-snapping");
				el.style.left = p.x + "px";
				el.style.top = p.y + "px";
				later(function () { el.classList.remove("is-snapping"); }, 360);
			}
			renderIcons();
			setTimeout(function () { S.dragged = false; }, 0);
		};
		document.addEventListener("pointermove", mv);
		document.addEventListener("pointerup", up);
	}

	// ---------------------------------------------------------------- Timeline

	function later(fn, ms) { var t = setTimeout(fn, REDUCED ? Math.min(ms, 300) : ms); timers.push(t); return t; }

	function unlock() {
		if (!S.locked) return;
		S.locked = false;
		scene.classList.remove("is-locked");
		scene.classList.add("is-unlocking");
		later(function () { scene.classList.remove("is-unlocking"); }, 1400);
		later(alertNow, LEVO_DEMO.timing.notify);
	}
	function alertNow() {
		S.alerted = true;
		renderMenubar();
		layout();
		placeDmg();
		if (!S.popOpen) showNote(fill(LEVO_DEMO.notification.title, { alert: gb(S.disk.alert) }), fill(LEVO_DEMO.notification.body, { ready: gb(tickedGB()) }));
	}
	// Load: the desk comes in (CSS, while .is-intro), the alert arrives, then the popover opens on its own.
	function start() {
		if (played) return;
		played = true;
		later(function () { scene.classList.remove("is-intro"); }, 1600);
		later(alertNow, LEVO_DEMO.timing.notify);
		later(function () { if (!S.popOpen && !scene.dataset.menu) openPop(); }, LEVO_DEMO.timing.open);
	}

	function showNote(title, body, ms) {
		$("[data-ntitle]").textContent = title;
		$("[data-nbody]").textContent = body;
		note.classList.add("is-in");
		if (ms) later(hideNote, ms);
	}
	function hideNote() { note.classList.remove("is-in"); }

	function openPop() {
		if (S.popOpen || S.gone) return;
		if (S.locked) unlock();
		if (scene.dataset.mode === "compact") { S.popOpen = true; scene.classList.add("is-open"); renderMenubar(); return; }
		if (window.LevoMenus && LevoMenus.close) LevoMenus.close();
		S.popOpen = true;
		S.alerted = true;
		hideNote();
		scene.classList.add("is-open");
		root.dispatchEvent(new CustomEvent("levo:open"));
		renderMenubar();
		layout();
	}
	function closePop() {
		if (!S.popOpen) return;
		S.popOpen = false;
		closeOverlays();
		scene.classList.remove("is-open");
		renderMenubar();
		if (S.cleanedNote) { var n = S.cleanedNote; S.cleanedNote = null; later(function () { showNote(n[0], n[1], 4200); }, 350); }
	}
	function closeOverlays() {
		S.panel = null; S.menu = false; S.sheet = false;
		$("[data-panel]").hidden = true;
		$("[data-levels]").hidden = true;
		$("[data-sheet]").hidden = true;
		hideBubble();
	}

	function toast(kind, title, action, ms) {
		clearTimeout(toastTimer);
		$("[data-actleft]").innerHTML = '<span class="lv-toast lv-toast-' + kind + '">' + sym(kind === "good" ? "checkmark.circle.fill" : "info.circle", 13, "lv-toast-sym") + "<b>" + esc(title) + "</b>" +
			(action ? '<button type="button" class="lv-toast-btn" data-act="' + action.act + '">' + action.label + "</button>" : "") + "</span>";
		toastTimer = setTimeout(function () { toastTimer = null; S.undo = null; renderActions(); }, ms || (action ? 9000 : 2600));
	}

	// ---------------------------------------------------------------- Actions

	function tick(id, item) {
		var g = group(id);
		if (!g) return;
		if (item != null) g.items[item].on = !g.items[item].on;
		else { var on = gState(g) !== "on"; g.items.forEach(function (it) { it.on = on; }); }
		S.level = "Selected";
		renderGroups(); renderDisk(S.freeShown); renderBar(); renderActions();
	}
	function chooseLevel(level) {
		S.level = level;
		applyLevel(S.groups, level);
		renderGroups(); renderDisk(S.freeShown); renderBar(); renderActions();
	}

	// Clean up: the app's confirm, inside the popover. The first time, the
	// acceptance step; then what goes, what is removed and what goes to the Trash.
	var accepted = false;
	function askClean() {
		if (tickedGB() <= 0) return;
		closeOverlays();
		var sh = $("[data-sheet]");
		sh.className = "lv-sheet lv-confirm";
		if (!accepted) {
			sh.innerHTML = '<div class="lv-gate">' +
				'<img src="img/dock/trash-full.png" width="64" height="64" alt="">' +
				"<b>You\u2019re in Charge</b>" +
				"<p>Levo never deletes anything without your permission. Take care, and check what\u2019s ticked before you clean. Your own files go to the Trash.</p>" +
				'<label class="lv-gate-box"><button type="button" class="lv-cb" role="checkbox" aria-checked="false" data-act="accept-tick"></button><span>I understand, and accept that Levo isn\u2019t responsible for what I choose to delete.</span></label>' +
			"</div>" + confirmBar("Accept", false);
		} else {
			var rows = [], removed = 0, trashed = 0;
			S.groups.forEach(function (g) { g.items.forEach(function (it) {
				if (!it.on) return;
				if (g.trash) trashed += it.gb; else removed += it.gb;
				rows.push('<div class="lv-crow">' + tile(g.tile, g.symbol, "sm") + '<span class="lv-cname">' + esc(it.name) + '</span><span class="lv-flex"></span>' + (g.trash ? sym("trash", 11, "lv-sec") : "") + '<span class="lv-size lv-num">' + gb(it.gb) + "</span></div>");
			}); });
			sh.innerHTML = '<div class="lv-chead"><b>Clean up ' + gb(tickedGB()) + "</b><span>" +
				(removed > 0 ? '<span class="lv-sec">Removed</span> <b>' + gb(removed) + "</b>" : "") +
				(trashed > 0 ? '<span class="lv-sec">To the Trash</span> <b>' + gb(trashed) + "</b>" : "") + "</span></div>" +
				'<div class="lv-sep"></div><div class="lv-clist">' + rows.join("") + "</div>" + confirmBar("Clean", true);
		}
		sh.hidden = false;
		S.sheet = true;
	}
	function confirmBar(label, on) {
		return '<div class="lv-actions lv-cbar"><span class="lv-flex"></span>' +
			'<button type="button" class="lv-primary lv-cancel" data-act="cancel">Cancel' + caps(["esc"], "lv-cap-sm lv-cap-ring") + "</button>" +
			'<button type="button" class="lv-primary" data-act="confirm"' + (on ? "" : " disabled") + ">" + label + caps(["\u21b5"], "lv-cap-sm") + "</button></div>";
	}
	function confirmNow() {
		if (!S.sheet) return;
		if (!accepted) {
			var box = $('[data-act="accept-tick"]');
			if (!box || box.getAttribute("aria-checked") !== "true") return;
			accepted = true;
			askClean();
			return;
		}
		clean();
	}

	// The ⓘ bubble: a group's what, why and how it comes back; a process's reason.
	function bubble(btn, toggle) {
		var tip = $("[data-bubbletip]"), key = btn.dataset.bubble;
		if (toggle && !tip.hidden && tip.dataset.key === key) { tip.hidden = true; return; }
		var kind = key.slice(0, 1), id = key.slice(2), title, body;
		if (kind === "g") { var g = group(id); if (!g) return; title = g.title; body = (g.about || []).map(function (t) { return "<p>" + esc(t) + "</p>"; }).join(""); }
		else { var p = proc(id); if (!p) return; title = p.name; body = "<p>" + esc(p.why || "") + "</p>"; }
		tip.innerHTML = "<b>" + esc(title) + "</b>" + body;
		tip.dataset.key = key;
		tip.hidden = false;
		var scroll = $(".lv-scroll"), row = btn.closest(".lv-row");
		var top = row.offsetTop - scroll.scrollTop + row.offsetHeight + 4;
		var x = Math.min(pop.offsetWidth - tip.offsetWidth - 8, Math.max(8, btn.offsetLeft + row.offsetLeft + btn.offsetWidth / 2 - 40));
		if (top + tip.offsetHeight > pop.offsetHeight - 8) top = row.offsetTop - scroll.scrollTop - tip.offsetHeight - 4;
		tip.style.top = top + "px";
		tip.style.left = x + "px";
		tip.style.setProperty("--ax", (btn.offsetLeft + row.offsetLeft + btn.offsetWidth / 2 - x) + "px");
	}
	function hideBubble() { var tip = $("[data-bubbletip]"); if (tip) tip.hidden = true; }

	function snapshot() { return JSON.stringify({ disk: S.disk, groups: S.groups, procs: S.procs, freeShown: S.freeShown, level: S.level, trashFull: S.trashFull }); }
	function restore(snap) {
		var o = JSON.parse(snap);
		S.disk = o.disk; S.groups = o.groups; S.procs = o.procs; S.freeShown = o.freeShown; S.level = o.level; S.trashFull = o.trashFull;
		S.cleanedNote = null;
		renderBar(true);
		render();
		renderTrash();
	}

	function clean() {
		closeOverlays();
		var freed = tickedGB();
		if (freed <= 0) return;
		S.undo = snapshot();
		$$(".lv-grow").forEach(function (r) { var g = group(r.dataset.id); if (g && gState(g) === "on") r.classList.add("is-going"); });
		$$(".lv-items, .lv-detail").forEach(function (r) { r.classList.add("is-going"); });
		var trashed = S.groups.some(function (g) { return g.items.some(function (it) { return it.on && it.desk; }); });
		later(function () {
			var from = S.disk.free;
			S.groups.forEach(function (g) { g.items = g.items.filter(function (it) { return !it.on; }); });
			S.groups = S.groups.filter(function (g) { return g.items.length; });
			S.open = {}; S.info = {};
			S.disk.free = Math.round((from + freed) * 10) / 10;
			S.sel = S.groups[0] ? { type: "group", id: S.groups[0].id } : null;
			if (trashed) { S.trashFull = true; renderTrash(true); }
			if (!S.groups.some(function (g) { return g.items.some(function (it) { return it.desk === "installers"; }); }) && window.LevoMenus && LevoMenus.closeWindow) LevoMenus.closeWindow("installers");
			renderGroups();
			renderBar(true);
			countFree(from, S.disk.free);
			renderActions();
			renderMenubar();
			renderIcons();
			toast("good", "Freed " + gb(freed), { act: "undo", label: "Undo" });
			S.cleanedNote = [fill(LEVO_DEMO.cleaned.title, { freed: gb(freed) }), fill(LEVO_DEMO.cleaned.body, { free: gb(S.disk.free), disk: S.disk.name })];
		}, 380);
	}

	function countFree(from, to, done) {
		var t0 = performance.now(), dur = REDUCED ? 1 : 1100;
		var step = function (t) {
			var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
			S.freeShown = from + (to - from) * e;
			renderDisk(Math.round(S.freeShown * 10) / 10);
			if (k < 1) requestAnimationFrame(step);
			else { S.freeShown = to; renderDisk(to); if (done) done(); }
		};
		requestAnimationFrame(step);
	}

	// Analyse now: a short analysing state, then the junk grows back, so the demo
	// can be played forever.
	function analyse() {
		if (S.analysing) return;
		closeOverlays();
		S.analysing = true;
		S.undo = null;
		clearTimeout(toastTimer);
		toastTimer = 1;
		$("[data-actleft]").innerHTML = '<span class="lv-toast lv-toast-busy"><i class="lv-spin"></i><b>Asking ' + esc(S.agent) + "…</b></span>";
		renderDisk(S.freeShown);
		renderGroups();
		later(regrow, 1700);
	}
	function regrow() {
		var base = fresh(), from = S.disk.free;
		var had = {};
		S.groups.forEach(function (g) { had[g.id] = g.items.length; });
		var hadProc = {};
		S.procs.forEach(function (p) { hadProc[p.id] = true; });
		base.groups.forEach(function (g) { if (!had[g.id]) { g.isNew = true; g.shown = 0; } });
		base.procs.forEach(function (p) { if (!hadProc[p.id]) p.isNew = true; });
		S.groups = base.groups;
		S.procs = base.procs;
		S.level = base.level;
		S.disk.free = base.disk.free;
		S.analysing = false;
		S.freed = null;
		$("[data-freed]").hidden = true;
		S.sel = { type: "group", id: S.groups[0].id };
		toastTimer = null;
		renderGroups();
		renderProcs();
		renderGauges();
		renderBar(true);
		renderActions();
		renderIcons();
		$$(".lv-grow.is-new, .lv-prow.is-new").forEach(function (r, i) { r.style.animationDelay = (i * 70) + "ms"; });
		growSizes();
		countFree(from, S.disk.free, function () { renderMenubar(); });
		toast("good", "Found " + gb(tickedGB()) + " again");
		S.groups.forEach(function (g) { delete g.isNew; });
		S.procs.forEach(function (p) { delete p.isNew; });
		later(function () { if (!S.popOpen && low()) alertNow(); }, 600);
	}
	function growSizes() {
		var t0 = performance.now(), dur = REDUCED ? 1 : 900;
		var targets = S.groups.filter(function (g) { return g.shown != null; });
		var step = function (t) {
			var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
			targets.forEach(function (g) {
				var el = $('[data-size="' + g.id + '"]');
				if (el) el.textContent = gb(gSize(g) * e);
			});
			if (k < 1) requestAnimationFrame(step);
			else targets.forEach(function (g) { delete g.shown; });
		};
		requestAnimationFrame(step);
	}

	function quit(id) {
		var p = proc(id);
		if (!p || p.system) return;
		closeOverlays();
		var row = $('.lv-prow[data-id="' + id + '"]');
		if (row) row.classList.add("is-going");
		later(function () {
			S.procs = S.procs.filter(function (x) { return x.id !== id; });
			if (S.sel && S.sel.id === id) S.sel = S.groups[0] ? { type: "group", id: S.groups[0].id } : null;
			renderProcs(); renderGauges(); renderActions();
			toast("good", "Quit " + p.name);
		}, 320);
	}

	// A gauge's word frees it: quit what the agent marked safe for that metric.
	function freeMetric(metric) {
		var key = metric === "memory" ? "mem" : metric;
		var g = $('[data-gauge="' + metric + '"]');
		var spin = $(".lv-dial-spin", g);
		spin.hidden = false;
		later(function () {
			spin.hidden = true;
			var go = S.procs.filter(function (p) { return p.safe && p[key] > (key === "mem" ? 0.5 : 2); });
			var line = $("[data-freed]");
			if (!go.length) {
				line.innerHTML = sym("checkmark.circle", 12, "lv-sec") + "<span>Nothing to quit</span>" + '<button type="button" class="lv-x" data-act="freedx" aria-label="Dismiss">' + sym("xmark", 8) + "</button>";
			} else {
				var est = key === "mem" ? gb(sum(go, function (p) { return p.mem; })) : pct(sum(go, function (p) { return p[key]; }) / (key === "cpu" ? S.cpu.cores : 1)) + " " + metric.toUpperCase();
				S.procs = S.procs.filter(function (p) { return go.indexOf(p) < 0; });
				line.innerHTML = sym("checkmark.circle.fill", 12, "lv-good") + "<span>Quit " + esc(go.map(function (p) { return p.name; }).join(", ")) + " · about " + est + "</span>" + '<button type="button" class="lv-x" data-act="freedx" aria-label="Dismiss">' + sym("xmark", 8) + "</button>";
				renderProcs(); renderGauges(); renderActions();
			}
			line.hidden = false;
		}, 650);
	}

	// Levo can't be removed: Quit, drag it out of the menubar, or drag the dock
	// icon to the Trash, and it comes back. The second time, one quiet line.
	function comeBack(el, cls) {
		S.attempts++;
		el.classList.add(cls || "is-gone");
		later(function () {
			el.classList.remove(cls || "is-gone");
			el.classList.add("is-back");
			later(function () { el.classList.remove("is-back"); }, 600);
			if (S.attempts === 2 && !S.quipped) { S.quipped = true; quip(el); }
		}, 1000);
	}
	function quip(el) {
		var q = $("[data-quip]");
		q.textContent = LEVO_DEMO.quip;
		var x = el.offsetLeft + el.offsetWidth / 2, y;
		if (el.closest(".lv-menubar")) { x = el.offsetLeft + (el.offsetParent === $(".lv-menubar") ? 0 : el.parentNode.offsetLeft) + el.offsetWidth / 2; y = 34; }
		else { var d = $("[data-dock]"); x = d.offsetLeft + el.offsetLeft + el.offsetWidth / 2; y = d.offsetTop - 34; }
		q.style.left = x + "px";
		q.style.top = y + "px";
		q.hidden = false;
		later(function () { q.hidden = true; }, 2600);
	}
	function quitLevo() {
		closePop();
		S.gone = true;
		var b = $(".lv-mb-levo");
		comeBack(b);
		later(function () { S.gone = false; }, 1000);
	}

	// The ⌘K panel.
	function panelItems() {
		var sel = S.sel, items = [], title;
		if (sel && sel.type === "proc" && proc(sel.id)) {
			var p = proc(sel.id);
			title = p.name;
			if (!p.system) {
				items.push({ symbol: "xmark.circle", label: "Quit " + p.name, keys: ["↵"], run: function () { quit(p.id); } });
				items.push({ symbol: "xmark.circle", label: "Force Quit", keys: ["⌥", "⌘", "Q"], red: true, run: function () { quit(p.id); } });
			}
			items.push({ symbol: "pin", label: "Always Keep", keys: ["⌘", "D"], run: function () { p.verdict = "Keep"; p.safe = false; renderProcs(); toast("info", "Keeping " + p.name); } });
			items.push({ symbol: "gauge.with.dots.needle.33percent", label: "Show in Activity Monitor", keys: ["⌘", "↵"], run: function () { toast("info", "Opens Activity Monitor"); } });
		} else {
			var g = sel && group(sel.id);
			title = g ? g.title : "Levo";
			if (tickedGB() > 0) items.push({ symbol: "trash", label: "Clean Up " + gb(tickedGB()), keys: ["⌘", "⌫"], run: askClean });
			if (g) {
				items.push({ symbol: "folder", label: "Show in Finder", keys: ["⌘", "↵"], run: function () { toast("info", "Opens " + g.location.split(",")[0]); } });
				items.push({ symbol: "pin", label: "Always Keep", keys: ["⌘", "D"], run: function () { keep(g.id); } });
			}
		}
		items.push(null);
		items.push({ symbol: "checkmark.circle", label: "Select", sub: true, run: function () { S.panel = "select"; drawPanel(); } });
		items.push({ symbol: "arrow.clockwise", label: "Analyse Now", keys: ["⌘", "R"], run: analyse });
		items.push({ symbol: "pause.circle", label: "Pause Alerts for 1 Hour", keys: ["⌘", "P"], run: function () { toast("info", "Alerts paused for 1 hour"); } });
		items.push(null);
		items.push({ symbol: "gearshape", label: "Settings…", keys: ["⌘", ","], run: function () { closePop(); var s = document.getElementById("settings"); if (s) s.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" }); } });
		items.push({ symbol: "power", label: "Quit Levo", keys: ["⌘", "Q"], run: quitLevo });
		return { title: title, items: items };
	}
	// Select: Smartly (Careful, Balanced, Aggressive), All, None, Selected. As in the app.
	function selectItems() {
		var smart = S.panel === "smartly";
		var list = smart ? LEVO_DEMO.levels : ["Smartly", null, "All", "None", "Selected"];
		return { title: smart ? "Smartly" : "Select", back: true, items: list.map(function (m) {
			if (m === null) return null;
			if (m === "Smartly") return { symbol: LEVO_DEMO.levels.indexOf(S.level) >= 0 ? "checkmark" : null, label: "Smartly", sub: true, run: function () { S.panel = "smartly"; panelAt = 0; drawPanel(); } };
			return { symbol: S.level === m ? "checkmark" : null, label: m, disabled: m === "Selected" && S.level !== "Selected", run: function () { if (m !== "Selected") chooseLevel(m); } };
		}) };
	}
	var panelAt = 0, panelList = [];
	function drawPanel(filter) {
		var el = $("[data-panel]");
		var data = S.panel === "select" || S.panel === "smartly" ? selectItems() : panelItems();
		var q = (filter || "").toLowerCase();
		var list = data.items.filter(function (it) { return !q ? true : it && it.label.toLowerCase().indexOf(q) >= 0; });
		while (list.length && list[0] === null) list.shift();
		panelList = list.filter(Boolean);
		panelAt = Math.min(panelAt, Math.max(0, panelList.length - 1));
		var n = -1;
		el.innerHTML = '<div class="lv-ph">' + (data.back ? '<button type="button" class="lv-back" data-act="pback" aria-label="Back">' + sym("chevron.left", 9) + "</button>" : "") + esc(data.title) + "</div>" +
			'<div class="lv-pitems" role="menu">' + list.map(function (it) {
				if (!it) return '<div class="lv-psep"></div>';
				n++;
				return '<button type="button" role="menuitem" class="lv-pitem' + (n === panelAt ? " is-sel" : "") + (it.red ? " is-red" : "") + '"' + (it.disabled ? " disabled" : "") + ' data-act="pitem" data-n="' + n + '">' +
					'<span class="lv-pi-icon">' + (it.symbol ? sym(it.symbol, 13) : "") + "</span><span>" + esc(it.label) + '</span><span class="lv-flex"></span>' +
					(it.sub ? sym("chevron.right", 9, "lv-sec") : it.keys ? caps(it.keys, "lv-cap-sm") : "") + "</button>";
			}).join("") + (panelList.length ? "" : '<div class="lv-pnone">No actions</div>') + "</div>" +
			'<div class="lv-psearch"><input type="text" data-psearch placeholder="Search for actions…" aria-label="Search for actions" value="' + esc(filter || "") + '"></div>';
		el.hidden = false;
		var input = $("[data-psearch]", el);
		input.addEventListener("input", function () { panelAt = 0; drawPanel(input.value); });
		if (inView) { input.focus({ preventScroll: true }); input.setSelectionRange(input.value.length, input.value.length); }
	}
	function togglePanel() {
		if (S.sheet) return;
		if (S.panel) { S.panel = null; $("[data-panel]").hidden = true; return; }
		S.menu = false; $("[data-levels]").hidden = true;
		S.panel = "main"; panelAt = 0;
		drawPanel();
	}
	function runPanel(i) {
		var it = panelList[i];
		if (!it || it.disabled) return;
		if (it.sub) { it.run(); return; }
		S.panel = null; $("[data-panel]").hidden = true;
		it.run();
	}

	function keep(id) {
		S.undo = snapshot();
		var g = group(id);
		S.groups = S.groups.filter(function (x) { return x.id !== id; });
		S.sel = S.groups[0] ? { type: "group", id: S.groups[0].id } : null;
		render();
		toast("info", "Keeping " + g.title, { act: "undo", label: "Undo" });
	}

	function levelMenu() {
		var el = $("[data-levels]");
		if (S.menu) { S.menu = false; el.hidden = true; return; }
		S.panel = null; $("[data-panel]").hidden = true;
		S.menu = true;
		var btn = $('[data-act="levelmenu"]');
		el.style.top = (btn.offsetTop + btn.offsetHeight + 4 - $(".lv-scroll").scrollTop) + "px";
		var item = function (m, dis) {
			return '<button type="button" class="lv-mitem"' + (dis ? " disabled" : "") + ' data-act="levelpick" data-level="' + m + '"><span class="lv-mcheck">' + (S.level === m ? sym("checkmark", 10) : "") + "</span>" + m + "</button>";
		};
		var smart = LEVO_DEMO.levels.indexOf(S.level) >= 0;
		el.innerHTML = '<div class="lv-msub"><button type="button" class="lv-mitem" data-act="smartly" aria-haspopup="menu"><span class="lv-mcheck">' + (smart ? sym("checkmark", 10) : "") + '</span>Smartly<span class="lv-flex"></span>' + sym("chevron.right", 8, "lv-sec") + "</button>" +
			'<div class="lv-menu lv-menu-side">' + LEVO_DEMO.levels.map(function (m) { return item(m); }).join("") + "</div></div>" +
			'<div class="lv-msep"></div>' + item("All") + item("None") + item("Selected", S.level !== "Selected");
		el.hidden = false;
	}

	// ---------------------------------------------------------------- Trash, dock, drag

	function renderTrash(bump) {
		var t = $('[data-dock="trash"]');
		t.classList.toggle("is-full", !!S.trashFull);
		var d = LEVO_DEMO.dock.filter(function (x) { return x.id === "trash"; })[0];
		$("img", t).src = S.trashFull ? d.full : d.img;
		if (bump) { t.classList.remove("is-bounce"); void t.offsetWidth; t.classList.add("is-bump"); later(function () { t.classList.remove("is-bump"); }, 500); }
	}
	function bounce(el) {
		el.classList.remove("is-bounce");
		void el.offsetWidth;
		el.classList.add("is-bounce", "is-running");
		later(function () { el.classList.remove("is-bounce"); }, 1500);
	}

	// macOS magnification: each icon grows with the pointer's closeness.
	function onDockMove(e) {
		if (scene.dataset.mode === "compact") return;
		var dock = $("[data-dock]"), z = parseFloat(scene.style.zoom) || 1;
		var x = (e.clientX - dock.getBoundingClientRect().left) / (dockZoomFix() ? z : 1);
		$$(".lv-dk").forEach(function (el) {
			var c = el.offsetLeft + el.offsetWidth / 2, d = Math.abs(x - c);
			el.style.setProperty("--mag", (1 + 0.55 * Math.max(0, 1 - d / 130)).toFixed(3));
		});
	}
	function onDockLeave() { $$(".lv-dk").forEach(function (el) { el.style.setProperty("--mag", "1"); }); }
	// Browsers that apply CSS zoom to getBoundingClientRect report zoomed pixels.
	var zoomFix = null;
	function dockZoomFix() {
		if (zoomFix === null) {
			var z = parseFloat(scene.style.zoom) || 1, w = scene.getBoundingClientRect().width;
			zoomFix = Math.abs(w - scene.offsetWidth * z) < Math.abs(w - scene.offsetWidth);
		}
		return zoomFix;
	}

	// Dragging Levo out of the menubar or onto the Trash: it bounces back.
	function dragBack(el, e, isDock) {
		var x0 = e.clientX, y0 = e.clientY, moved = false, z = dockZoomFix() ? (parseFloat(scene.style.zoom) || 1) : 1;
		var over = false;
		var move = function (ev) {
			var dx = (ev.clientX - x0) / (parseFloat(scene.style.zoom) || 1), dy = (ev.clientY - y0) / (parseFloat(scene.style.zoom) || 1);
			if (!moved && Math.abs(dx) + Math.abs(dy) < 6) return;
			if (!moved) { moved = true; el.classList.add("is-dragging"); S.dragged = true; }
			el.style.transform = "translate(" + dx + "px," + dy + "px)";
			if (isDock) {
				var t = $('[data-dock="trash"]'), r = t.getBoundingClientRect();
				over = ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top - 20 * z && ev.clientY <= r.bottom;
				t.classList.toggle("is-target", over);
			} else el.classList.toggle("is-out", dy > 26);
		};
		var up = function () {
			document.removeEventListener("pointermove", move);
			document.removeEventListener("pointerup", up);
			if (!moved) return;
			var out = isDock ? over : el.classList.contains("is-out");
			el.classList.remove("is-dragging", "is-out");
			$('[data-dock="trash"]').classList.remove("is-target");
			el.classList.add("is-snap");
			el.style.transform = "";
			later(function () { el.classList.remove("is-snap"); }, 520);
			if (out) {
				S.attempts++;
				if (S.attempts === 2 && !S.quipped) { S.quipped = true; later(function () { quip(el); }, 450); }
			}
			setTimeout(function () { S.dragged = false; }, 0);
		};
		document.addEventListener("pointermove", move);
		document.addEventListener("pointerup", up);
	}

	// ---------------------------------------------------------------- Events

	function onClick(e) {
		var t = e.target.closest("[data-act], [data-dock], [data-icon]");
		if (!t || !root.contains(t)) return;
		S.touched = true;
		if (S.dragged) return;
		if (t.dataset.dock) { dockClick(t); return; }
		if (t.dataset.icon) {
			$$(".lv-ic").forEach(function (x) { x.classList.toggle("is-sel", x === t); });
			if (e.detail >= 2) openFile(t.dataset.icon);
			return;
		}
		var act = t.dataset.act, id = t.dataset.id;
		if (act !== "panel" && act !== "pitem" && act !== "pback" && S.panel && !t.closest("[data-panel]")) { S.panel = null; $("[data-panel]").hidden = true; if (act === "grow" || act === "prow") return; }
		if (act !== "levelmenu" && act !== "levelpick" && act !== "smartly" && S.menu) { S.menu = false; $("[data-levels]").hidden = true; }
		switch (act) {
			case "toggle": S.popOpen ? closePop() : openPop(); break;
			case "lwinclose": lwin(false, "close"); break;
			case "lwinmin": lwin(false, "min"); break;
			case "note": openPop(); break;
			case "unlock": unlock(); break;
			case "desk": closePop(); $$(".lv-ic").forEach(function (x) { x.classList.remove("is-sel"); }); break;
			case "tick": e.stopPropagation(); tick(id); break;
			case "titem": e.stopPropagation(); tick(id, +t.dataset.item); break;
			case "info": e.stopPropagation(); bubble(t, true); break;
			case "grow":
				S.sel = { type: "group", id: id };
				S.open[id] = !S.open[id];
				renderGroups(); renderProcs(); renderActions(); break;
			case "more": S.more = !S.more; renderGroups(); break;
			case "prow": if (proc(id) && proc(id).system) break; S.sel = { type: "proc", id: id }; renderGroups(); renderProcs(); renderActions(); break;
			case "quit": e.stopPropagation(); quit(id); break;
			case "sort": S.sort = t.dataset.sort; renderProcs(); break;
			case "free": freeMetric(t.dataset.metric); break;
			case "freedx": $("[data-freed]").hidden = true; break;
			case "primary": var p = primary(); if (p.act === "clean") askClean(); else if (p.act === "quitSel") quit(S.sel.id); break;
			case "panel": togglePanel(); break;
			case "pitem": runPanel(+t.dataset.n); break;
			case "pback": S.panel = S.panel === "smartly" ? "select" : "main"; panelAt = 0; drawPanel(); break;
			case "levelmenu": levelMenu(); break;
			case "smartly": e.stopPropagation(); t.parentNode.classList.toggle("is-open"); return;
			case "levelpick": if (t.dataset.level === "Selected") { S.menu = false; $("[data-levels]").hidden = true; break; } S.menu = false; $("[data-levels]").hidden = true; chooseLevel(t.dataset.level); break;
			case "cancel": closeOverlays(); break;
			case "confirm": confirmNow(); break;
			case "accept-tick": var on = t.getAttribute("aria-checked") !== "true"; t.setAttribute("aria-checked", on); t.innerHTML = on ? sym("checkmark", 10) : ""; $('[data-act="confirm"]').disabled = !on; break;
			case "analyse": analyse(); break;
			case "undo": clearTimeout(toastTimer); toastTimer = null; if (S.undo) { var u = S.undo; S.undo = null; restore(u); toast("info", "Undone"); } break;
		}
	}
	function dockClick(el) {
		var id = el.dataset.dock, M = window.LevoMenus;
		if (id === "levo") { bounce(el); openPop(); return; }
		if (id === "trash") { el.classList.add("is-bump"); later(function () { el.classList.remove("is-bump"); }, 500); return; }
		bounce(el);
		if (!M || !M.window) return;
		if (id === "settings") later(function () { M.window("settings", { id: "settings" }); }, 500);
		if (id === "finder") later(function () { if (S.lwinClosed) lwin(true); else openFile("installers"); }, 400);
		if (id === "notes") later(function () { openFile("notes"); }, 500);
		if (id === "terminal") later(function () { var a = document.getElementById("agents"); if (a) a.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" }); }, 500);
	}

	// The Levo window closes or minimises like a Finder window; Finder in the dock brings it back.
	function lwin(show, how) {
		var w = $("[data-lwin]"), hint = $(".lv-hint");
		S.lwinClosed = !show;
		w.classList.remove("is-closing", "is-minimising", "is-opening");
		if (show && !w.hidden && !w.classList.contains("is-closing")) { w.classList.remove("is-opening"); void w.offsetWidth; w.classList.add("is-opening"); return; }
		if (show) { w.hidden = false; void w.offsetWidth; w.classList.add("is-opening"); later(function () { w.classList.remove("is-opening"); }, 500); return; }
		w.classList.add(how === "min" ? "is-minimising" : "is-closing");
		hint.style.opacity = "0";
		later(function () { w.hidden = true; w.classList.remove("is-closing", "is-minimising"); }, how === "min" ? 420 : 200);
	}

	// Desktop files open in Finder or TextEdit windows (menus.js), and the zip unzips.
	function openFile(id) {
		var M = window.LevoMenus, C = (M && M.content) || {};
		if (!M || !M.window) return;
		var at = function (dx, dy) { var w = $("[data-lwin]"); return { x: (parseFloat(w.style.left) || 300) + dx, y: (parseFloat(w.style.top) || 120) + dy }; };
		if (id === "installers") {
			var el = $('[data-icon="installers"]');
			if (el && el.classList.contains("is-gone")) return;
			var p = at(-60, 40);
			M.window("finder", { id: "installers", title: "Old Installers", x: p.x, y: p.y, w: 560, h: 340, items: C.installers || [] });
		} else if (id === "notes") {
			var q = at(40, 70);
			M.window("textedit", { id: "notes", title: "notes (3).txt", x: q.x, y: q.y, w: 420, h: 300, text: C.notes || "" });
		} else if (id === "unzipped") {
			var u = at(0, 90);
			M.window("finder", { id: "unzipped", title: "project-final-v2", x: u.x, y: u.y, w: 560, h: 340, items: C.unzipped || [] });
		} else if (id === "zip") unzip();
		else if (id === "dmg") lwin(true);
	}
	function unzip() {
		var zip = $('[data-icon="zip"]'), out = $('[data-icon="unzipped"]');
		if (!zip || zip.classList.contains("is-gone")) return;
		if (S.unzipped) { openFile("unzipped"); return; }
		zip.classList.add("is-unzipping");
		later(function () {
			zip.classList.remove("is-unzipping");
			S.unzipped = true;
			var p = freeSpot(out, zip.offsetLeft + 18, zip.offsetTop + 40);
			out.style.left = p.x + "px"; out.style.top = p.y + "px";
			out.classList.remove("is-hidden");
			out.classList.add("is-born");
			$$(".lv-ic").forEach(function (x) { x.classList.toggle("is-sel", x === out); });
			later(function () { out.classList.remove("is-born"); }, 700);
		}, 900);
	}

	function onKey(e) {
		if (scene.dataset.menu) return;
		if (S.locked && inView && (e.key === "Enter" || e.key === " ") && root.contains(document.activeElement)) { unlock(); return; }
		if (!S.popOpen || !inView) return;
		var k = e.key, mod = e.metaKey || e.ctrlKey;
		var inPanel = S.panel && document.activeElement && document.activeElement.matches("[data-psearch]");
		if (mod && (k === "k" || k === "K")) { e.preventDefault(); togglePanel(); return; }
		if (k === "Escape") {
			e.preventDefault();
			if (S.panel || S.menu || S.sheet) closeOverlays(); else closePop();
			return;
		}
		if (S.panel && (k === "ArrowDown" || k === "ArrowUp")) {
			e.preventDefault();
			panelAt = (panelAt + (k === "ArrowDown" ? 1 : -1) + panelList.length) % panelList.length;
			$$(".lv-pitem").forEach(function (b, i) { b.classList.toggle("is-sel", i === panelAt); });
			return;
		}
		if (S.panel && k === "Enter") { e.preventDefault(); runPanel(panelAt); return; }
		if (inPanel) return;
		if (S.sheet && k === "Enter") { e.preventDefault(); confirmNow(); return; }
		if (mod && k === "Backspace" && !S.sheet) { e.preventDefault(); askClean(); return; }
		var focusIn = root.contains(document.activeElement) || document.activeElement === document.body;
		if (k === "Enter" && focusIn && !S.sheet && !mod) {
			var a = document.activeElement;
			if (a && a !== document.body && a.matches("button") && !a.matches('[data-act="primary"]')) return;
			var p = primary();
			if (p.act === "quitSel") { e.preventDefault(); quit(S.sel.id); }
		}
	}

	function onHoverBar(e) {
		var tk = e.target.closest && e.target.closest(".lv-tick"), tip = $("[data-tip]");
		if (!tk) { tip.hidden = true; $$(".lv-tick").forEach(function (x) { x.classList.remove("is-dim"); }); return; }
		var id = tk.dataset.seg, s = segments().filter(function (x) { return x.id === id; })[0];
		if (!s) return;
		$$(".lv-tick").forEach(function (x) { x.classList.toggle("is-dim", x.dataset.seg !== id); });
		tip.innerHTML = "<b>" + esc(s.label) + "</b> " + gb(s.gb);
		tip.hidden = false;
		var bar = $("[data-dbar]"), x = tk.offsetLeft + tk.offsetWidth / 2;
		tip.style.left = Math.max(tip.offsetWidth / 2, Math.min(bar.offsetWidth - tip.offsetWidth / 2, x)) + "px";
	}

	// ---------------------------------------------------------------- Public

	// Opts from the page: price, term, download, buy, hint, setTheme(mode), theme().
	var OPTS = {};
	function mount(el, opts) {
		OPTS = opts || {};
		root = el;
		S = fresh();
		root.innerHTML = sceneHTML();
		scene = $(".lv-scene");
		pop = $(".lv-pop");
		note = $(".lv-note");
		$("[data-icons]").innerHTML = LEVO_DEMO.desktop.map(iconHTML).join("");
		$("[data-dock]").innerHTML = dockHTML();
		$("[data-city]").textContent = city() || "Local time";
		tickClock();
		setInterval(tickClock, 1000);
		calendar();
		battery();
		render();
		layout();
		if (scene.dataset.mode === "compact") openPop();
		if (REDUCED) scene.classList.add("is-reduced");
		root.addEventListener("click", onClick);
		document.addEventListener("keydown", onKey);
		var bubbleTimer = null;
		pop.addEventListener("pointerover", function (ev) {
			var b = ev.target.closest && ev.target.closest("[data-bubble]");
			if (b && ev.pointerType === "mouse") { clearTimeout(bubbleTimer); bubble(b); }
		});
		pop.addEventListener("pointerout", function (ev) {
			var b = ev.target.closest && ev.target.closest("[data-bubble]");
			if (b && ev.pointerType === "mouse") bubbleTimer = setTimeout(hideBubble, 160);
		});
		$(".lv-scroll").addEventListener("scroll", hideBubble, { passive: true });
		var bar = $("[data-dbar]");
		bar.addEventListener("mousemove", onHoverBar);
		bar.addEventListener("mouseleave", function () { onHoverBar({ target: bar }); });
		var dock = $("[data-dock]");
		dock.addEventListener("mousemove", onDockMove);
		dock.addEventListener("mouseleave", onDockLeave);
		$$(".lv-ic").forEach(function (ic) { ic.addEventListener("pointerdown", function (ev) { if (ev.button === 0) dragIcon(ic, ev); }); });
		$('[data-dock="levo"]').addEventListener("pointerdown", function (ev) { if (ev.button === 0) dragBack(ev.currentTarget, ev, true); });
		$(".lv-mb-levo").addEventListener("pointerdown", function (ev) { if (ev.button === 0) dragBack(ev.currentTarget, ev, false); });
		$$(".lv-dk img").forEach(function (img) {
			var gone = function () { img.closest(".lv-dk").hidden = true; };
			if (img.complete && !img.naturalWidth) gone(); else img.addEventListener("error", gone);
		});
		if (window.ResizeObserver) new ResizeObserver(function () { zoomFix = null; layout(); }).observe(root);
		else window.addEventListener("resize", layout);
		if (window.IntersectionObserver) {
			new IntersectionObserver(function (es) {
				es.forEach(function (en) { inView = en.isIntersecting; if (inView) start(); });
			}, { threshold: 0.25 }).observe(root);
		} else { inView = true; start(); }
		if (window.LevoMenus) LevoMenus.attach({ scene: scene, hooks: {
			battery: function () { return batt; },
			device: deviceFamily,
			disk: function () { return { name: S.disk.name, total: S.disk.total, free: S.disk.free }; },
			closeLevo: closePop,
			openLevo: function () { S.touched = true; openPop(); },
			emptyTrash: function () { var had = S.trashFull; S.trashFull = false; renderTrash(had); return had; },
			revealGroup: function (id) {
				S.touched = true; openPop();
				if (group(id)) { S.sel = { type: "group", id: id }; S.open[id] = true; if (S.groups.map(function (g) { return g.id; }).indexOf(id) >= 5) S.more = true; renderGroups(); renderActions(); }
			},
			symbol: sym,
			setTheme: function (m) { if (OPTS.setTheme) OPTS.setTheme(m); },
			theme: function () { return OPTS.theme ? OPTS.theme() : "auto"; },
			lock: function () {
				closePop();
				S.locked = true;
				scene.classList.add("is-locked");
			}
		} });
		scene.addEventListener("lvm:open", hideNote);
		setupLevoWindow();
		scene.addEventListener("lvm:wifi", function (ev) { $("[data-wifi]").innerHTML = sym(ev.detail && ev.detail.on === false ? "wifi.slash" : "wifi", 15); });
	}

	// The Levo window: price and links from the page; double-click the app to open
	// Levo; drag it onto Applications to download; drag the window by its title bar.
	function setupLevoWindow() {
		var win = $("[data-lwin]");
		$("[data-lprice]").textContent = OPTS.price || "";
		$("[data-lterm]").textContent = OPTS.term || "";
		var dl = $("[data-ldownload]"), buy = $("[data-lbuy]");
		dl.href = OPTS.download || "#";
		buy.href = OPTS.buy || "#";
		buy.textContent = OPTS.price ? "Buy for " + OPTS.price : "Buy";
		[dl, buy].forEach(function (a) { if (/^\[|^#$/.test(a.getAttribute("href"))) a.setAttribute("data-placeholder", ""); });
		$("[data-hint]").innerHTML = OPTS.hint || "";
		var app = $('[data-act="lwinapp"]'), apps = $("[data-lwinapps]");
		app.addEventListener("dblclick", function () { S.touched = true; openPop(); });
		app.addEventListener("pointerdown", function (e) {
			if (e.button !== 0) return;
			var x0 = e.clientX, y0 = e.clientY, moved = false, over = false;
			var mv = function (ev) {
				var dx = ev.clientX - x0, dy = ev.clientY - y0;
				if (!moved && Math.abs(dx) + Math.abs(dy) < 6) return;
				moved = true; S.dragged = true;
				app.classList.add("is-dragging");
				app.style.transform = "translate(" + dx + "px," + dy + "px)";
				var r = apps.getBoundingClientRect();
				over = ev.clientX > r.left && ev.clientX < r.right && ev.clientY > r.top && ev.clientY < r.bottom;
				apps.classList.toggle("is-target", over);
			};
			var up = function () {
				document.removeEventListener("pointermove", mv);
				document.removeEventListener("pointerup", up);
				app.classList.remove("is-dragging");
				app.classList.add("is-snap");
				app.style.transform = "";
				later(function () { app.classList.remove("is-snap"); }, 500);
				apps.classList.remove("is-target");
				if (over) dl.click();
				setTimeout(function () { S.dragged = false; }, 0);
			};
			document.addEventListener("pointermove", mv);
			document.addEventListener("pointerup", up);
		});
		var bar = $(".lv-lwin-bar");
		bar.addEventListener("pointerdown", function (e) {
			if (e.button !== 0 || scene.dataset.mode === "compact") return;
			var x0 = e.clientX, y0 = e.clientY, l0 = parseFloat(win.style.left) || 0, t0 = parseFloat(win.style.top) || 0;
			var mv = function (ev) {
				S.lwinMoved = true;
				win.style.left = Math.max(-200, Math.min(scene.offsetWidth - 120, l0 + ev.clientX - x0)) + "px";
				win.style.top = Math.max(30, Math.min(scene.offsetHeight - 60, t0 + ev.clientY - y0)) + "px";
				$(".lv-hint").style.opacity = "0";
			};
			var up = function () { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); };
			document.addEventListener("pointermove", mv);
			document.addEventListener("pointerup", up);
		});
	}

	window.LevoDemo = {
		data: LEVO_DEMO,
		sym: sym,
		tile: tile,
		mark: mark,
		mount: mount,
		open: function () { S.touched = true; openPop(); },
		unlock: function () { unlock(); },
		analyse: function () { analyse(); },
		setAlert: function (v) { S.disk.alert = v; render(); },
		setAgent: function (name) { S.agent = name; renderGroups(); }
	};
})();
