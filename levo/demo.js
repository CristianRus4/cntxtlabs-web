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
				{ id: "system", label: "System data", gb: 64, color: ["#3D5AFE", "#7C8CFF"] },
				{ id: "apps", label: "Apps", gb: 96, color: ["#1F7AE0", "#4FA3F8"] },
				{ id: "developer", label: "Developer", gb: 79, color: ["#6A3DEC", "#A485FF"] },
				{ id: "documents", label: "Documents", gb: 70, color: ["#D99A00", "#FFC531"] },
				{ id: "media", label: "Photos and media", gb: 44, color: ["#C2307E", "#EC5FA8"] },
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
				items: [{ name: "DerivedData/Levo", gb: 6.8, level: 1 }, { name: "DerivedData/Elevate", gb: 4.9, level: 1 }, { name: "DerivedData/Context", gb: 1.8, level: 1 }] },
			{ id: "sims", about: ["Simulator devices you haven\u2019t opened in weeks.", "Their apps and data are test copies; the runtimes stay.", "Xcode makes a fresh device when you need one."], title: "Simulators", symbol: "iphone", tile: "grey", changed: "3 weeks ago",
				location: "~/Library/Developer/CoreSimulator", verdict: "Unused devices, runtimes kept", good: true,
				items: [{ name: "iPhone 17 Pro", gb: 2.1, level: 2 }, { name: "iPad Air", gb: 1.9, level: 2 }, { name: "iPhone 16e", gb: 1.7, level: 2 }, { name: "iPhone SE", gb: 1.5, level: 2 }, { name: "Apple Watch Series 11", gb: 1.4, level: 2 }, { name: "Apple TV 4K", gb: 1.2, level: 2 }] },
			{ id: "worktrees", about: ["Copies of your repos that coding agents made to work in.", "Two still have unmerged work, so they stay unticked.", "Merged ones go with git worktree remove."], title: "Agent worktrees", symbol: "arrow.triangle.branch", tile: "purple", tag: "Review", changed: "2 days ago",
				location: "~/Projects/.worktrees", verdict: "Two have unmerged work", good: false,
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
				items: [{ name: "DiagnosticReports", gb: 0.6, level: 2 }, { name: "CoreSimulator logs", gb: 0.3, level: 2 }] },
			{ id: "deps", about: ["Packages installed inside projects you haven\u2019t opened in months.", "Your code stays; only the downloaded packages go.", "They come back with the next install."], title: "Project dependencies", symbol: "shippingbox.fill", tile: "orange", changed: "3 months ago",
				location: "~/Projects", verdict: "Projects idle for months", good: true,
				items: [{ name: "levo-site/node_modules", gb: 2.9, level: 3 }, { name: "notes-app/node_modules", gb: 1.8, level: 3 }, { name: "old-prototype/node_modules", gb: 1.4, level: 3 }] },
			{ id: "appcaches", about: ["Caches that apps keep to start and load faster.", "Your messages, songs and settings aren\u2019t in them.", "Apps fill them again as you use them."], title: "App caches", symbol: "tray.full.fill", tile: "orange", changed: "today",
				location: "~/Library/Caches", verdict: "Apps rebuild them", good: true,
				items: [{ name: "Chat app cache", gb: 2.4, level: 3 }, { name: "Music cache", gb: 1.6, level: 3 }] },
			{ id: "backups", about: ["An old iPhone backup and an archive you made last year.", "Your current iPhone keeps its own newer backup.", "They go to the Trash, so you can get them back."], title: "Backups and archives", symbol: "archivebox.fill", tile: "grey", changed: "1 year ago",
				location: "~/Library/Application Support/MobileSync", verdict: "Only with Everything", good: false,
				trash: true, items: [{ name: "iPhone backup (2025)", gb: 9.6, level: 4 }, { name: "Old archives.zip", gb: 3.4, level: 4 }] }
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
			{ id: "ffmpeg", name: "ffmpeg", symbol: "terminal", tile: "grey", why: "A video export that finished an hour ago. Safe to quit.", safe: true, cpu: 6, gpu: 18, mem: 0.6 },
			{ id: "cursor", name: "Cursor", app: "cursor", why: "An editor with two projects open.", cpu: 4, gpu: 0, mem: 2.1 }
		],
		// Desktop icons, in a column from the top left (below the widgets when they show).
		desktop: [
			{ id: "shot", kind: "shot", name: "Screenshot 2026-10-12 at 9.41.22 am.png", col: 0, row: 0, roomy: true },
			{ id: "installers", kind: "folder", name: "Old Installers", col: 1, row: 0 },
			{ id: "zip", kind: "zip", name: "project-final-v2.zip", col: 0, row: 1, roomy: "tiny" },
			{ id: "notes", kind: "doc", name: "notes (3).txt", col: 1, row: 1, roomy: true },
			{ id: "prices", kind: "doc", name: "prices_Levo.txt", col: 0, row: 3 },
			{ id: "features", kind: "doc", name: "features_Levo.txt", col: 1, row: 3 },
			{ id: "unzipped", kind: "folder", name: "project-final-v2", col: 0, row: 2, later: true },
			{ id: "dmg", kind: "volume", name: "Levo", col: 1, row: 2 }
		],
		// The dock, from img/dock/ (one folder, so the set can be swapped).
		dock: [
			{ id: "finder", name: "Finder", img: "img/dock/finder.png", open: true },
			{ id: "safari", name: "Safari", img: "img/dock/safari.png", open: true },
			{ id: "mail", name: "Mail", img: "img/dock/mail.png" },
			{ id: "messages", name: "Messages", img: "img/dock/messages.png", open: true },
			{ id: "notes", name: "Notes", img: "img/dock/notes.png" },
			{ id: "music", name: "Music", img: "img/dock/music.png" },
			{ id: "photos", name: "Photos", img: "img/dock/photos.png", open: true },
			{ id: "calendar", name: "Calendar", img: "img/dock/calendar.png", open: true },
			{ id: "settings", name: "System Settings", img: "img/dock/settings.png", open: true },
			{ id: "terminal", name: "Terminal", img: "img/dock/terminal.png" },
			{ id: "elevate", name: "Elevate", img: "img/dock/elevate.png", open: true },
			{ id: "levo", name: "Levo", img: "img/dock/levo.png" },
			// In the dock only while a text window is open, as a running app that isn't kept there.
			{ id: "textedit", name: "TextEdit", img: "img/dock/textedit.png", transient: true },
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
		if (Math.abs(r) > 0 && Math.abs(r) < 1) return num0.format(Math.round(r * 1000)) + " MB";
		return (Math.abs(r) >= 10 ? num0.format(Math.round(r)) : num1.format(r)) + " GB";
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
			sort: "memory", sel: null, showAll: false, frozen: null, openChips: {}, working: null,
			open: {}, info: {}, more: false,
			freeShown: d.disk.free, alerted: false, popOpen: false, locked: false, unzipped: false,
			panel: null, sheet: false, menu: false, undo: null, agent: S ? S.agent : d.agent,
			cleanedNote: null, freed: null, analysing: false, trashFull: false, trash: [], binned: {}, kept: {}, auto: false, attempts: 0, quipped: false
		};
		applyLevel(st.groups, st.level);
		return st;
	}
	function applyLevel(groups, level) {
		if (level === "Selected") return;
		var n = LEVO_DEMO.levels.indexOf(level) + 1;
		groups.forEach(function (g) { g.items.forEach(function (it) {
			it.on = level === "All" ? it.level > 0 : level === "None" ? false : it.level > 0 && it.level <= Math.min(n, 3);
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
			'<div class="lv-note" data-act="note" role="button" tabindex="0" aria-live="polite">' +
				'<button type="button" class="lv-note-x" data-act="noteclose" aria-label="Close">' + sym("xmark", 8) + "</button>" +
				'<img class="lv-note-icon" src="img/icon-96.png" width="38" height="38" alt="">' +
				'<span class="lv-note-text"><span class="lv-note-top"><b data-ntitle></b><span class="lv-note-when">now</span></span><span data-nbody></span></span>' +
			'</div>' +
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
			// Each tick keeps its own colour along the arc (blue, green, yellow, orange, red), set as the
			// line's own stroke when lit, which every browser draws.
			lines += '<line x1="' + (32 + 23 * c).toFixed(2) + '" y1="' + (32 + 23 * s).toFixed(2) + '" x2="' + (32 + 30.5 * c).toFixed(2) + '" y2="' + (32 + 30.5 * s).toFixed(2) + '" data-c="' + arcColor(i / 25) + '"/>';
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
			'<div class="lv-dhead lv-namerow"><span class="lv-sec" data-devsym>' + sym("desktopcomputer", 14) + '</span><b data-devname>Mac</b><span class="lv-flex"></span>' +
				'<button type="button" class="lv-topclean" data-act="topclean" data-topclean data-tipkeys="\u2318\u232b">Clean up</button></div>' +
			'<div class="lv-sep"></div>' +
			'<section class="lv-gauges">' + gaugeHTML("memory", "Memory") + gaugeHTML("cpu", "CPU") + gaugeHTML("gpu", "GPU") + '</section>' +
			'<div class="lv-freed" data-freed hidden></div>' +
			'<div class="lv-sep"></div>' +
			'<section class="lv-disk">' +
				'<div class="lv-hero"><span class="lv-free lv-num" data-free></span><span class="lv-sec">free</span><span class="lv-flex"></span><span class="lv-can lv-num" data-can></span></div>' +
				'<div class="lv-dbar" data-dbar><div class="lv-ticks">' + ticks + '</div><span class="lv-tip" data-tip hidden></span></div>' +
			'</section>' +
			'<div class="lv-sep"></div>' +
			'<div class="lv-scroll">' +
				'<div class="lv-sum" data-summary data-act="sumspace"></div>' +
				'<div class="lv-breakdown" data-breakdown hidden>' +
				'<div class="lv-sh"><span>Ready to free</span><span class="lv-sh-r"><span class="lv-sh-note" data-ready></span><button type="button" class="lv-dd" data-act="levelmenu" aria-haspopup="menu"><span data-levellabel></span>' + sym("chevron.down", 9, "lv-sec") + '</button></span></div>' +
				'<div class="lv-list" data-groups></div>' +
				'<div class="lv-sep lv-sep-in"></div>' +
				'<div class="lv-sh"><span>Processes</span><span class="lv-seg" role="tablist">' +
					['memory', 'cpu', 'gpu'].map(function (k) { return '<button type="button" role="tab" data-act="sort" data-sort="' + k + '">' + (k === "memory" ? "Memory" : k.toUpperCase()) + '</button>'; }).join("") +
				'</span></div>' +
				'<div class="lv-list" data-procs></div>' +
				'</div>' +
				'<div style="height:8px"></div>' +
			'</div>' +
			'<div class="lv-actions">' +
				'<div class="lv-act-left" data-actleft></div>' +
				'<div class="lv-act-right"><button type="button" class="lv-primary" data-act="primary"><span data-plabel></span><span data-pcaps></span></button>' +
				'<button type="button" class="lv-kbtn" data-act="panel" aria-label="Actions" title="Actions ⌘K">' + sym("switch.2", 13, "lv-sec") + '</button></div>' +
			'</div>' +
			'<div class="lv-scrim" data-act="scrim" hidden></div>' +
			'<div class="lv-panel lv-bsheet" data-panel hidden></div>' +
			'<div class="lv-menu" data-levels hidden></div>' +
			'<div class="lv-sheet lv-bsheet" data-sheet hidden></div>' +
			'<div class="lv-bubble" data-bubbletip hidden></div>' +
		'</div>';
	}

	// macOS's own file icons (tools/export-desk-icons.swift); one image each, as macOS draws them the same in light and dark.
	var DESK_ICONS = { folder: "folder", zip: "zip", doc: "txt", dmg: "dmg", pkg: "pkg" };
	function iconHTML(ic) {
		var art;
		if (DESK_ICONS[ic.kind]) art = '<span class="lv-ic-real"><img src="img/desk/' + DESK_ICONS[ic.kind] + '.png" width="64" height="64" alt="" draggable="false"></span>';
		else if (ic.kind === "volume") art = '<span class="lv-ic-vol"><img class="lv-dk-l" src="img/desk/levo-volume.png" width="64" height="64" alt="" draggable="false"><img class="lv-dk-d" src="img/desk/levo-volume-dark.png" width="64" height="64" alt="" draggable="false"></span>';
		else art = '<span class="lv-ic-shot"><i></i></span>';
		return '<button type="button" class="lv-ic' + (ic.later ? " is-hidden" : "") + (ic.roomy === "tiny" ? " is-roomy-tiny" : ic.roomy ? " is-roomy" : "") + '" data-icon="' + ic.id + '" style="--col:' + ic.col + ";--row:" + ic.row + '">' + art + '<span class="lv-ic-name">' + esc(ic.name) + "</span></button>";
	}
	// The Levo window on the desktop: the app, Applications, the price and Download.
	// A disk image window, as a Mac app arrives. On a phone it is a plain card.
	function lwinHTML() {
		// The installer's contents: a normal desktop window (LevoMenus.window, like Finder's) holds them.
		return '<div class="lv-lwin-in">' +
			'<div class="lv-lwin-body">' +
				'<button type="button" class="lv-lwin-app" data-act="lwinapp" aria-label="Levo"><span class="lv-lwin-ic"><img class="lv-dk-l" src="img/dock/levo.png" width="96" height="96" alt="" draggable="false"><img class="lv-dk-d" src="img/dock/levo-dark.png" width="96" height="96" alt="" draggable="false"></span><span>Levo</span></button>' +
				'<svg class="lv-lwin-arrow" viewBox="0 0 120 24" aria-hidden="true"><path d="M4 12h98"/><path d="M98 4l10 8-10 8"/></svg>' +
				'<span class="lv-lwin-apps" data-lwinapps><span class="lv-lwin-ic"><img class="lv-lwin-folder" src="img/desk/applications.png" width="96" height="96" alt="" draggable="false"></span><span>Applications</span></span>' +
			'</div>' +
			'<div class="lv-lwin-foot"><span class="lv-lwin-price"><b data-lprice></b><span data-lterm></span></span><span class="lv-flex"></span>' +
				'<a class="lv-lbtn" data-lbuy href="#">Buy</a><a class="lv-lbtn lv-lbtn-primary" data-ldownload href="#">Download</a></div>' +
		'</div>';
	}
	// The installer: a desktop window from the same code as Finder's (menus.js), so it comes to
	// the front on a click, resizes from its edges, drags by its title bar, and its lights work.
	function lwinSize() { return scene.classList.contains("is-small") ? [352, 32 + 170 + 60] : [400, 32 + 196 + 60]; }
	function openInstaller(x, y) {
		var M = window.LevoMenus;
		if (!M || !M.window) return null;
		var open = M.windows().indexOf("levo-dmg") >= 0, sz = lwinSize();
		var w = M.window("custom", { id: "levo-dmg", title: "Levo", html: lwinHTML(), w: sz[0], h: sz[1], minW: 320, minH: 230, esc: false,
			x: x != null ? x : S.lwinAt ? S.lwinAt[0] : null, y: y != null ? y : S.lwinAt ? S.lwinAt[1] : null,
			onClose: function () { S.lwinClosed = true; S.lwinAt = [parseFloat(w.style.left) || 0, parseFloat(w.style.top) || 0]; } });
		if (!w) return null;
		S.lwinClosed = false;
		if (!open) {
			w.setAttribute("data-lwin", "");
			w.classList.add("lv-lwin-w");
			setupLevoWindow(w);
			var bar = w.querySelector("[data-lvm-drag]");
			if (bar) bar.addEventListener("pointerdown", function () { S.lwinMoved = true; });
			w.addEventListener("pointerdown", function (e) { if (e.target.closest(".lvm-rz")) S.lwinMoved = true; }, true);
		}
		return w;
	}
	function dockHTML() {
		return '<div class="lv-dock-shelf"></div>' + LEVO_DEMO.dock.map(function (d) {
			var dark = d.img.replace(/\.png$/, "-dark.png");
			var art = d.full ? '<img src="' + d.img + '" alt="" draggable="false">' :
				'<img class="lv-dk-l" src="' + d.img + '" alt="" draggable="false"><img class="lv-dk-d" src="' + dark + '" alt="" draggable="false">';
			return (d.id === "trash" ? '<span class="lv-dock-sep"></span>' +
				'<button type="button" class="lv-dk lv-dk-stack is-hidden" data-dock="downloads" aria-label="Downloads"><span class="lv-dk-lift"><span class="lv-dk-art"><img src="img/dock/downloads.png" alt="" draggable="false"><i class="lv-dl-bar" hidden><b></b></i></span></span><span class="lv-dk-label">Downloads</span><i class="lv-dk-dot"></i></button>' : "") +
				'<button type="button" class="lv-dk' + (d.open ? " is-running" : "") + (d.transient ? " lv-dk-stack is-hidden" : "") + '" data-dock="' + d.id + '" aria-label="' + esc(d.name) + '"><span class="lv-dk-lift"><span class="lv-dk-art">' + art + '</span></span><span class="lv-dk-label">' + esc(d.name) + '</span><i class="lv-dk-dot"></i></button>';
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
		$("[data-can]").innerHTML = t > 0 ? "<b>" + gb(t) + "</b>\u2009ready" : "";
		$("[data-ready]").innerHTML = S.analysing ? '<i class="lv-spin"></i>Analysing' : "";
		$("[data-levellabel]").textContent = LEVO_DEMO.levels.indexOf(S.level) >= 0 ? "Smartly" : S.level;
	}

	// The disk in ticks. Each tick is wholly one category's colour, shared out by
	// size with at least one tick for every category present (the app's rule):
	// what's in use, then what a clean would free, in green, then free space.
	// The app's five parts in its order (Gauges.swift DiskPart, round 15): Your Data, System Data,
	// Apps, Ready to free (what's ticked, in green) and Free. Unticked findings stay Your Data.
	// macOS's own storage palette, without its grey: System Data yellow, Your Data red, Apps orange.
	var PARTS = { system: ["#F2B800", "#FFD60A"], yourData: ["#FF3B30", "#FF453A"], apps: ["#FF9500", "#FF9F0A"] };
	function segments() {
		var unticked = readyGB() - tickedGB(), d = dark() ? 1 : 0;
		var part = function (id) { return sum(S.disk.used.filter(function (u) { return (u.id === "system" ? "system" : u.id === "apps" ? "apps" : "yourData") === id; }), function (u) { return u.gb; }); };
		var segs = [
			{ id: "yourData", label: "Your Data", gb: part("yourData") + unticked, color: PARTS.yourData[d] },
			{ id: "system", label: "System Data", gb: part("system"), color: PARTS.system[d] },
			{ id: "apps", label: "Apps", gb: part("apps"), color: PARTS.apps[d] }
		];
		var t = tickedGB();
		if (t > 0) segs.push({ id: "can", label: "Ready to free", gb: t, color: "var(--lv-ready)" });
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
	// Every tick shows at once; only the green fills, quickly, from its left (0.45 s).
	function renderBar(sweep) {
		var owners = allocate(segments(), TICKS), ticks = $$(".lv-tick");
		var greens = [];
		owners.forEach(function (s, i) { if (s.id === "can") greens.push(i); });
		ticks.forEach(function (el, i) {
			var s = owners[i], green = s.id === "can";
			el.dataset.seg = s.id;
			if (sweep && green && !REDUCED) { el.style.transition = "none"; el.style.backgroundColor = ""; }
			else { el.style.transition = ""; el.style.transitionDelay = "0ms"; el.style.backgroundColor = s.color; }
		});
		if (sweep && greens.length && !REDUCED) {
			void ticks[0].offsetWidth;
			greens.forEach(function (i, k) {
				var el = ticks[i];
				el.style.transition = "background-color .12s ease-out";
				el.style.transitionDelay = Math.round(k / greens.length * 450) + "ms";
				el.style.backgroundColor = "var(--lv-ready)";
			});
		}
	}

	function setGauge(id, value) {
		var g = $('[data-gauge="' + id + '"]');
		var on = Math.round(Math.max(0, Math.min(100, value)) / 100 * 26);
		$$("line", g).forEach(function (l, i) { l.classList.toggle("on", i < on); l.style.stroke = i < on ? l.getAttribute("data-c") : ""; });
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
		el.innerHTML = shown.map(groupHTML).join("") + (S.groups.length > 5 ? '<div class="lv-row lv-more" data-act="more"><span>' + (S.more ? "Show less" : "Show more") + "</span></div>" : "");
		renderSummary();
	}
	// A group's row, and its items when open: the lists and the Summary's open chips share it.
	function groupHTML(g) {
		{
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
		}
	}

	// ---------------------------------------------------------------- Summary (round 10, SummarySection.swift)

	// What the sentence says: how the ticks were chosen, what they free, the two
	// biggest ticked groups by name (three when that is all), and how many more.
	function sentence() {
		var all = S.groups.map(function (g) { return { g: g, gb: sum(g.items, function (it) { return it.on ? it.gb : 0; }) }; })
			.filter(function (x) { return x.gb > 0; }).sort(function (a, b) { return b.gb - a.gb; });
		var shown = all.length <= 3 ? all : all.slice(0, 2);
		// "N more" counts the ticked groups the sentence doesn't name, so each level changes it;
		// "More to choose from." follows when everything ticked is named but more is listed.
		var moreChip = all.length > shown.length, unnamed = moreChip ? all.length - shown.length : S.groups.length - shown.length;
		var lead = !all.length ? "nothing" : S.level === "All" ? "everything" : LEVO_DEMO.levels.indexOf(S.level) >= 0 ? "level" : "yours";
		return { lead: lead, level: S.level, groups: shown.map(function (x) { return x.g.id; }), unnamed: unnamed, moreChip: moreChip, moreChoices: !moreChip && unnamed > 0 };
	}
	function w(text) { return text.split(" ").map(function (x) { return '<span class="lv-w">' + esc(x) + "</span>"; }).join(""); }
	// After a click a word shows no hover look until the pointer leaves it (round 15); quietKey names it
	// across the sentence's redraw.
	var quietKey = null;
	function chipKey(act, extra) { var m = /data-id="([^"]*)"/.exec(extra || ""); return act + ":" + (m ? m[1] : ""); }
	function chip(act, label, extra, icon) {
		var key = chipKey(act, extra);
		return '<button type="button" class="lv-chip' + (key === quietKey ? " is-quiet" : "") + '" data-act="' + act + '" data-key="' + key + '"' + (extra || "") + ">" + (icon || "") + "<span>" + esc(label) + "</span></button>";
	}
	function renderSummary() {
		var el = $("[data-summary]");
		if (!el) return;
		// While the breakdown is open the sentence holds still; only the amount follows the ticks.
		var live = sentence(), st = S.showAll && S.frozen ? S.frozen : live;
		// While Auto mode is on its sentence says it all (round 13); manual cleaning stays in the bar and the breakdown.
		var h = S.auto ? autoLine() : '<p class="lv-sline">';
		var amount = '<span class="lv-gl">' + chip("sumall", gb(tickedGB()), ' style="min-width:' + (S.showAll && S.amountW ? S.amountW + "px" : "0") + '"') + '<span class="lv-w lv-p">:</span></span>';
		var level = function (word) { return chip("levelword", word, ' aria-haspopup="menu"'); };
		if (S.auto) {
		} else if (st.lead === "nothing") {
			h += S.groups.length ? level("Nothing") + w("to clean up.") : w(S.analysing ? "Looking for what can go." : "Nothing to clean up.");
		} else if (st.lead === "level") {
			h += w(st.level === "Aggressive" ? "An" : "A") + level(st.level.toLowerCase()) + w("clean up frees") + amount;
		} else if (st.lead === "everything") {
			h += level("Everything") + w("frees") + amount;
		} else {
			h += level("Your") + w("clean up frees") + amount;
		}
		if (st.lead !== "nothing" && !S.auto) {
			var count = st.groups.length + (st.moreChip ? 1 : 0);
			st.groups.forEach(function (id, i) {
				var g = group(id) || LEVO_DEMO.groups.filter(function (x) { return x.id === id; })[0];
				var punct = i < count - 2 ? "," : i === count - 1 ? "." : "";
				h += '<span class="lv-gl">' + chip("chip", g.title, ' data-id="' + id + '"' + (S.openChips[id] ? ' data-lit=""' : ""), tile(g.tile, g.symbol, "chip")) +
					(punct ? '<span class="lv-w lv-p">' + punct + "</span>" : "") + "</span>";
				if (i === count - 2) h += w("and");
			});
			if (st.moreChip) h += '<span class="lv-gl">' + chip("sumall", st.unnamed + " more", S.showAll ? ' data-lit=""' : "") + '<span class="lv-w lv-p">.</span></span>';
		}
		if (!S.auto) {
			if (st.moreChoices) h += w("More") + chip("sumall", "to choose", S.showAll ? ' data-lit=""' : "") + w("from.");
			h += "</p>";
		}
		// "Free up GPU, it's at 88%.": a metric past its limit; the phrase runs its free plan.
		if (SHOW_METRICS_LINE) over().forEach(function (o) {
			var working = S.working === o.metric;
			h += '<p class="lv-sline">' + '<span class="lv-gl">' + chip("free", working ? "Working…" : "Free up " + (o.metric === "memory" ? "memory" : o.metric.toUpperCase()), ' data-metric="' + o.metric + '"' + (working ? " disabled" : "")) +
				'<span class="lv-w lv-p">,</span></span>' + w("it’s at " + o.pct + "%.") + "</p>";
		});
		// Open chips show their rows in place, with their checkboxes.
		var ids = S.auto ? autoGroups().map(function (g) { return g.id; }) : st.lead === "nothing" ? [] : st.groups;
		var rows = ids.filter(function (id) { return S.openChips[id] && group(id); });
		if (rows.length && !S.showAll) h += '<div class="lv-chiprows">' + rows.map(function (id) { return groupHTML(group(id)); }).join("") + "</div>";
		el.innerHTML = h;
		var amt = $('[data-act="sumall"]', el);
		if (amt && !S.showAll) S.amountW = amt.offsetWidth;
		$("[data-breakdown]").hidden = !S.showAll;
	}
	// Auto mode: Levo and the agent keep the limit free on their own, with what can always go.
	function autoGroups() { return LEVO_DEMO.groups.filter(function (g) { return g.items.every(function (it) { return it.level === 1; }); }); }
	// As the app (SummarySection.autoModeWords): two groups by name, or one and "N more".
	function autoLine() {
		var gs = autoGroups(), shown = gs.length <= 2 ? gs : gs.slice(0, 1), more = gs.length - shown.length;
		var h = '<p class="lv-sline lv-autoline">' + chip("automode-open", "Auto mode") + w("keeps") + chip("automode-open", gb(S.disk.alert));
		if (!gs.length) return h + w("free.") + "</p>";
		h += w("free: it cleans");
		var count = shown.length + (more > 0 ? 1 : 0);
		shown.forEach(function (g, i) {
			h += chip("chip", g.title, ' data-id="' + g.id + '"' + (S.openChips[g.id] ? ' data-lit=""' : ""), tile(g.tile, g.symbol, "chip"));
			if (i === count - 2) h += w("and");
		});
		if (more > 0) h += chip("sumall", more + " more", S.showAll ? ' data-lit=""' : "");
		return h + w("on its own.") + "</p>";
	}
	function setAuto(on) {
		S.auto = !!on;
		renderActions();
		renderSummary();
		if (window.LevoMenus && LevoMenus.refresh) LevoMenus.refresh();
		toast("info", S.auto ? "Auto mode on" : "Auto mode off");
		if (S.auto) later(autoRun, REDUCED ? 600 : 1400);
	}
	// Below the limit, Auto mode cleans its groups with no click.
	function autoRun() {
		if (!S.auto || S.disk.free >= S.disk.alert) return;
		var ids = autoGroups().map(function (g) { return g.id; });
		clean(function (g) { return ids.indexOf(g.id) >= 0; }, "Auto mode freed");
	}

	// The app shows a metrics line when one is high; the demo leaves it out.
	var SHOW_METRICS_LINE = false;
	// Memory, CPU or GPU past its limit (Settings › Memory, CPU, GPU), the fullest first.
	function over() {
		var out = [], m = Math.round(memUsed() / S.mem.total * 100), c = Math.round(cpuPct()), g = Math.round(gpuPct());
		if (m >= 90) out.push({ metric: "memory", pct: m });
		if (c >= 80) out.push({ metric: "cpu", pct: c });
		if (g >= 80) out.push({ metric: "gpu", pct: g });
		return out.sort(function (a, b) { return b.pct - a.pct; });
	}
	function toggleAll() {
		S.showAll = !S.showAll;
		S.frozen = S.showAll ? sentence() : null;
		if (!S.showAll) S.amountW = 0;
		renderGroups(); renderProcs();
	}
	function levelWordMenu(btn) {
		var el = $("[data-levels]");
		if (S.menu === "word") { S.menu = false; el.hidden = true; return; }
		S.panel = null; $("[data-panel]").hidden = true;
		S.menu = "word";
		var b = btn.getBoundingClientRect(), pr = pop.getBoundingClientRect();
		el.style.top = Math.round(b.bottom - pr.top + 4) + "px";
		el.style.left = Math.max(8, Math.round(b.left - pr.left - 4)) + "px";
		el.style.right = "auto";
		el.innerHTML = LEVO_DEMO.levels.concat(["Everything"]).map(function (m) {
			var on = m === "Everything" ? S.level === "All" : S.level === m;
			return '<button type="button" class="lv-mitem" data-act="levelpick" data-level="' + (m === "Everything" ? "All" : m) + '"><span class="lv-mcheck">' + (on ? sym("checkmark", 10) : "") + "</span>" + m + "</button>";
		}).join("");
		el.hidden = false;
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
		var p = primary(), btn = $('[data-act="primary"]'), top = $("[data-topclean]");
		// The name row's button (round 16): "Clean up", tinted blue; while Auto mode is on, "Auto mode",
		// tinted orange, its limit and scope on hover.
		if (top) {
			top.textContent = S.auto ? "Auto mode" : "Clean up";
			top.classList.toggle("is-auto", !!S.auto);
			top.disabled = !S.auto && tickedGB() <= 0;
			top.setAttribute("data-tipkeys", S.auto ? gb(S.disk.alert) + " \u00b7 " + autoGroups().map(function (g) { return g.title; }).join(", ") : "\u2318\u232b");
		}
		$("[data-plabel]").textContent = p.label;
		$("[data-pcaps]").innerHTML = caps(p.keys, "lv-cap-sm");
		btn.disabled = !p.act;
		if (!toastTimer) $("[data-actleft]").innerHTML = S.analysing ? "" : '<button type="button" class="lv-checked" data-act="analyse">Checked just now</button>';
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
		var tx = dock.offsetLeft + (trash ? trash.offsetLeft + trash.offsetWidth / 2 : 0), ty = dock.offsetTop + 30;
		$$("[data-icon]").forEach(function (el) {
			var id = el.dataset.icon;
			el.style.setProperty("--tx", (tx - el.offsetLeft - 46) + "px");
			el.style.setProperty("--ty", (ty - el.offsetTop - 30) + "px");
			el.classList.toggle("is-gone", (!!owned[id] && !live[id] && !S.kept[id]) || !!S.binned[id]);
		});
	}

	// ---------------------------------------------------------------- Desktop, from the browser

	function tickClock() {
		var now = new Date();
		var time = fTime.format(now);
		$("[data-day]").textContent = fDay.format(now).replace(/,/g, "");
		$("[data-time]").textContent = time;
		var wt = $("[data-wtime]");
		if (wt.textContent !== time) { wt.textContent = time; fitTime(wt); }
		$("[data-wdate]").textContent = fWidget.format(now).replace(/,/g, "");
		$("[data-ltime]").textContent = time.replace(/\s?[AaPp]\.?[Mm]\.?$/, "");
		$("[data-ldate]").textContent = fLong.format(now);
	}
	// The battery, as macOS shows it: a laptop shows its level and state; a Mac
	// with no battery shows no battery item, and the widget becomes a calendar.
	// Browsers report a desktop Mac as 100 % and charging with no charge time.
	var power = "unknown";
	// The widget's time always fits inside the card's padding: the widest time of
	// this length ("12:58 PM" in tabular figures) sets the size, so it doesn't jump.
	function fitTime(el) {
		var box = el.parentNode, cs = getComputedStyle(box);
		var room = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
		if (room <= 0) return;
		var widest = fTime.format(new Date(2026, 0, 1, 12, 58));
		var probe = el.cloneNode();
		probe.textContent = widest.length >= el.textContent.length ? widest : el.textContent;
		probe.style.cssText = "position:absolute;visibility:hidden;font-size:100px;max-width:none;width:auto;margin:0";
		box.appendChild(probe);
		var w = probe.offsetWidth;
		box.removeChild(probe);
		if (w > 0) el.style.fontSize = Math.min(38, Math.floor(100 * room / w * 10) / 10) + "px";
	}

	function battery() {
		var item = $(".lv-mb-batt"), wb = $("[data-wbatt]"), wc = $("[data-wcal]");
		var device = function () {
			var laptop = power === "laptop";
			$("[data-devsym]").innerHTML = sym(laptop ? "laptopcomputer" : power === "desktop" ? "macmini.fill" : "desktopcomputer", 14);
			$("[data-devname]").textContent = laptop ? "MacBook Pro" : power === "desktop" ? "Mac mini" : "Mac";
			$("[data-dev]").textContent = laptop ? "MacBook Pro" : "Mac";
			// The page's other renders of the popover name the same Mac.
			Array.prototype.forEach.call(document.querySelectorAll("[data-devname-copy]"), function (el) { el.textContent = $("[data-devname]").textContent; });
			Array.prototype.forEach.call(document.querySelectorAll("[data-devsym-copy]"), function (el) { el.innerHTML = $("[data-devsym]").innerHTML; });
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
		if (widgets) fitTime($("[data-wtime]"));
		// The Levo window sits in the open space between the icons and the popover.
		// On a small screen the window is smaller and sits further left, so it clears the popover.
		var small = W < 1100;
		scene.classList.toggle("is-small", small);
		scene.classList.toggle("is-tiny", W < 920);
		var win = $("[data-lwin]"), left = widgets ? 380 : small ? 214 : 236, right = popLeft - 20;
		if (!win && !S.lwinClosed) win = openInstaller();
		var sz = lwinSize(), ww = win ? win.offsetWidth : sz[0], wh = win ? win.offsetHeight : sz[1];
		if (win && !S.lwinMoved && ww !== sz[0]) { win.style.width = sz[0] + "px"; win.style.height = sz[1] + "px"; ww = sz[0]; wh = sz[1]; }
		var x = Math.round(Math.max(Math.min(left, right - ww), left + (right - left - ww) / 2));
		var y = Math.round(Math.max(64, Math.min(H - wh - 190, (H - wh) / 2 - 40)));
		if (win && !S.lwinMoved) { win.style.left = x + "px"; win.style.top = y + "px"; }
		if (!S.lwinMoved) S.lwinAt = [x, y];
		var hint = null;
		var dock = $("[data-dock]");
		pop.style.maxHeight = Math.max(320, H - 48) + "px";
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
		if (!except || except.dataset.icon !== "dmg") out.push({ x: pw.offsetLeft, y: pw.offsetTop, w: pw.offsetWidth, h: $(".lv-pop").offsetHeight });
		out.push(rectOf($("[data-lwin]")));
		out.push({ x: 0, y: $("[data-dock]").offsetTop - 50, w: scene.offsetWidth, h: 200 });
		$$(".lv-ic").forEach(function (el) { if (el !== except && el.offsetWidth && !el.classList.contains("is-hidden") && el.style.left) out.push({ x: el.offsetLeft, y: el.offsetTop, w: IC_W, h: IC_H }); });
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
		var W = scene.offsetWidth, H = scene.offsetHeight, win = rectOf($("[data-lwin]"));
		// Once per screen size: a resize of more than a little places them afresh.
		if (S.iconsPlaced && Math.abs(S.iconsW - W) < 40 && Math.abs(S.iconsH - H) < 40) return;
		S.iconsPlaced = true; S.iconsW = W; S.iconsH = H;
		var pw = $(".lv-popwrap"), popLeft = pw.offsetLeft;
		$$(".lv-ic").forEach(function (el) { el.style.left = ""; });
		var dmg = placeDmg();
		var top = widgets ? 236 : 44, bottom = $("[data-dock]").offsetTop - (scene.classList.contains("is-small") ? 16 : 64) - IC_H;
		var right = Math.max(220, Math.min((win ? win.x : W / 2) - IC_W - 10, popLeft - IC_W - 20));
		// A small screen has no room to scatter: a loose grid down the left, as Finder's Clean Up does.
		var small = scene.classList.contains("is-small");
		$$(".lv-ic").forEach(function (el) {
			if (el === dmg || !el.offsetWidth) return;
			var best = null;
			for (var tries = 0; tries < (small ? 0 : 60) && !best; tries++) {
				var x = Math.round(16 + Math.random() * Math.max(10, right - 16));
				var y = Math.round(top + Math.random() * Math.max(10, bottom - top));
				var me = { x: x, y: y, w: IC_W, h: IC_H };
				if (!blockers(el).some(function (b) { return hits(me, b, 18); })) best = { x: x, y: y };
			}
			// No room at random: the first free slot of a loose grid from the top left, as Finder's Clean Up does.
			for (var gx = small ? 6 : 16; !best && gx + IC_W <= W - 8; gx += small ? 92 : 100) {
				for (var gy = top; !best && gy <= Math.max(top, bottom); gy += 108) {
					var slot = { x: gx, y: gy, w: IC_W, h: IC_H };
					if (!blockers(el).some(function (b) { return hits(slot, b, 4); })) best = { x: gx, y: gy };
				}
			}
			if (!best) best = freeSpot(el, 30, top);
			el.style.left = best.x + "px";
			el.style.top = best.y + "px";
		});
	}
	// The mounted disk image: top right under the menubar, or just left of the
	// popover's column when the popover would cover it. Follows the popover until dragged.
	// The mounted disk image sits in the top-trailing corner, where macOS puts
	// volumes: just under the menubar at the right edge, behind the notification.
	// Only the open popover may cover it.
	function placeDmg() {
		var dmg = $('[data-icon="dmg"]');
		if (!dmg || S.dmgMoved) return dmg;
		dmg.style.left = (scene.offsetWidth - IC_W - 4) + "px";
		dmg.style.top = "34px";
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
			if (el.dataset.icon !== "dmg") overTrash({ x: ev.clientX, y: ev.clientY });
		};
		var up = function (ev) {
			document.removeEventListener("pointermove", mv);
			document.removeEventListener("pointerup", up);
			if (!moved) return;
			el.classList.remove("is-dragging");
			var binIt = el.dataset.icon !== "dmg" && overTrash({ x: ev.clientX, y: ev.clientY });
			overTrash(null);
			if (binIt && trashDesk(el.dataset.icon)) { setTimeout(function () { S.dragged = false; }, 0); return; }
			var me = { x: el.offsetLeft, y: el.offsetTop, w: IC_W, h: IC_H };
			var W = scene.offsetWidth, H = scene.offsetHeight;
			var vol = el.dataset.icon === "dmg";
			if (vol) { me.x = Math.max(0, Math.min(W - IC_W, me.x)); me.y = Math.max(30, me.y); el.style.left = me.x + "px"; el.style.top = me.y + "px"; }
			var bad = (!vol && (me.x < 0 || me.y < 32 || me.x + IC_W > W)) || me.y + IC_H > H || blockers(el).some(function (b) { return hits(me, b, 2); });
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
		if (REDUCED) { S.alerted = true; openPop(); return; }
		if (scene.dataset.mode === "desk" && !S.touched) { later(runGhost, 1700); return; }
		later(alertNow, LEVO_DEMO.timing.notify);
		later(function () { if (!S.popOpen && !scene.dataset.menu) openPop(); }, LEVO_DEMO.timing.open);
	}

	// ---------------------------------------------------------------- The ghost cursor

	// After the load a macOS pointer shows the desktop working: it selects a file,
	// drags the Levo window a little, then clicks the notification, which opens
	// Levo. The moment the visitor moves their own pointer, touches or types, it
	// hands over: it fades out and doesn't come back this visit.
	var ghost = null;
	function runGhost() {
		if (S.touched || S.popOpen) { if (!S.alerted) alertNow(); return; }
		var g = document.createElement("div");
		g.className = "lv-ghost";
		g.setAttribute("aria-hidden", "true");
		g.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M5.2 2.6v17.1l4.1-4 2.6 6.1 3-1.3-2.6-6h5.7z" fill="#000" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg><i class="lv-ghost-ring"></i>';
		scene.appendChild(g);
		ghost = { el: g, x: scene.offsetWidth * 0.46, y: scene.offsetHeight * 0.78, timers: [], raf: 0, stopped: false, drag: null };
		place();
		requestAnimationFrame(function () { g.classList.add("is-in"); });
		var first = null;
		var handOver = function (e) {
			if (!ghost || ghost.stopped) return;
			if (e.type === "pointermove") {
				if (e.pointerType !== "mouse" || !e.isTrusted) return;
				if (!first) { first = [e.clientX, e.clientY]; return; }
				if (Math.abs(e.clientX - first[0]) + Math.abs(e.clientY - first[1]) < 5) return;
			}
			stopGhost();
		};
		["pointermove", "pointerdown", "touchstart", "keydown"].forEach(function (t) { document.addEventListener(t, handOver, { passive: true, capture: true }); });
		ghost.off = function () { ["pointermove", "pointerdown", "touchstart", "keydown"].forEach(function (t) { document.removeEventListener(t, handOver, { capture: true }); }); };

		var ic = $('[data-icon="installers"]'), win = $("[data-lwin]");
		var steps = [];
		if (ic && !ic.classList.contains("is-gone") && !ic.classList.contains("is-hidden")) {
			steps.push(function (next) { moveTo(ic.offsetLeft + 46, ic.offsetTop + 34, 900, next); });
			steps.push(function (next) { wait(380, next); });
			steps.push(function (next) { press(function () { $$(".lv-ic").forEach(function (x) { x.classList.toggle("is-sel", x === ic); }); }); wait(520, next); });
		}
		if (win && !win.hidden) {
			steps.push(function (next) { moveTo(win.offsetLeft + win.offsetWidth * 0.66, win.offsetTop + 22, 850, next); });
			steps.push(function (next) { wait(200, next); });
			steps.push(function (next) {
				ghost.el.classList.add("is-down");
				ghost.drag = { win: win, l: win.offsetLeft, t: win.offsetTop, x: ghost.x, y: ghost.y };
				S.lwinMoved = true;
				wait(140, next);
			});
			steps.push(function (next) { moveTo(ghost.x - 64, ghost.y + 34, 760, next); });
			steps.push(function (next) { ghost.el.classList.remove("is-down"); ghost.drag = null; wait(260, next); });
		}
		steps.push(function (next) { alertNow(); wait(950, next); });
		steps.push(function (next) { moveTo(note.offsetLeft + note.offsetWidth * 0.42, note.offsetTop + note.offsetHeight * 0.55, 1000, next); });
		steps.push(function (next) { wait(260, next); });
		steps.push(function (next) { press(function () { S.alerted = true; openPop(); }); wait(900, next); });
		steps.push(function (next) { moveTo(ghost.x - 46, ghost.y + 60, 520, next); });
		steps.push(function () { stopGhost(true); });
		var k = 0;
		(function go() { if (!ghost || ghost.stopped) return; var f = steps[k++]; if (f) f(go); })();
	}
	function place() {
		ghost.el.style.transform = "translate(" + ghost.x.toFixed(1) + "px," + ghost.y.toFixed(1) + "px)";
		if (ghost.drag) {
			var d = ghost.drag;
			d.win.style.left = (d.l + ghost.x - d.x) + "px";
			d.win.style.top = (d.t + ghost.y - d.y) + "px";
		}
	}
	function wait(ms, next) { ghost.timers.push(setTimeout(next, ms)); }
	// An eased move along a gentle curve, as a hand moves a mouse.
	function moveTo(x, y, ms, next) {
		var x0 = ghost.x, y0 = ghost.y, dx = x - x0, dy = y - y0, len = Math.hypot(dx, dy) || 1;
		var cx = x0 + dx * 0.5 - dy / len * len * 0.12, cy = y0 + dy * 0.5 + dx / len * len * 0.12;
		var t0 = performance.now();
		var step = function (t) {
			if (!ghost || ghost.stopped) return;
			var k = Math.min(1, (t - t0) / ms), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2, u = 1 - e;
			ghost.x = u * u * x0 + 2 * u * e * cx + e * e * x;
			ghost.y = u * u * y0 + 2 * u * e * cy + e * e * y;
			place();
			if (k < 1) ghost.raf = requestAnimationFrame(step); else next();
		};
		ghost.raf = requestAnimationFrame(step);
	}
	function press(fn) {
		var el = ghost.el;
		el.classList.remove("is-click"); void el.offsetWidth; el.classList.add("is-click");
		ghost.timers.push(setTimeout(fn, 120));
	}
	function stopGhost(done) {
		if (!ghost || ghost.stopped) return;
		ghost.stopped = true;
		cancelAnimationFrame(ghost.raf);
		ghost.timers.forEach(clearTimeout);
		ghost.drag = null;
		ghost.off();
		var el = ghost.el;
		el.classList.remove("is-in", "is-down");
		el.classList.add("is-out");
		setTimeout(function () { el.remove(); }, 500);
		// Handed over before the end: the notification waits for the visitor's own click.
		if (!done && !S.popOpen && !S.alerted) alertNow();
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
		hideSheets();
		$("[data-levels]").hidden = true;
		hideBubble();
	}

	// The status line (ActivityLine.swift): always plain secondary text.
	function toast(kind, title, action, ms) {
		clearTimeout(toastTimer);
		$("[data-actleft]").innerHTML = '<span class="lv-toast">' + esc(title) +
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
		renderGroups(); renderDisk(S.freeShown); renderBar(true); renderActions();
	}
	function chooseLevel(level) {
		S.level = level;
		if (LEVO_DEMO.levels.indexOf(level) >= 0) S.lastLevel = level;
		applyLevel(S.groups, level);
		renderGroups(); renderDisk(S.freeShown); renderBar(true); renderActions();
	}

	// Clean up: the app's confirm, inside the popover. The first time, the
	// acceptance step; then what goes, what is removed and what goes to the Trash.
	// The demo goes straight to the clean question (no first-time Accept step).
	var accepted = true;
	function askClean() {
		if (tickedGB() <= 0) return;
		closeOverlays();
		var sh = $("[data-sheet]");
		sh.className = "lv-sheet lv-bsheet lv-confirm";
		if (!accepted) {
			sh.innerHTML = '<div class="lv-gate">' +
				'<img src="img/dock/trash-full.png" width="64" height="64" alt="">' +
				"<b>You\u2019re in charge</b>" +
				"<p>Levo never deletes anything without your permission. Take care, and check what\u2019s ticked before you clean. Your own files go to the Trash.</p>" +
				'<label class="lv-gate-box"><button type="button" class="lv-cb" role="checkbox" aria-checked="false" data-act="accept-tick"></button><span>I understand, and accept that Levo isn\u2019t responsible for what I choose to delete.</span></label>' +
			"</div>" + confirmBar("Accept", false, ["\u21b5"]);
		} else {
			var rows = [];
			S.groups.forEach(function (g) { g.items.forEach(function (it) {
				if (!it.on) return;
				rows.push('<div class="lv-crow">' + tile(g.tile, g.symbol, "sm") + '<span class="lv-cname">' + esc(it.name) + '</span><span class="lv-flex"></span>' + (g.trash ? sym("trash", 11, "lv-sec") : "") + '<span class="lv-size lv-num">' + gb(it.gb) + "</span></div>");
			}); });
			sh.innerHTML = '<div class="lv-chead"><b>Clean up ' + gb(tickedGB()) + "?</b></div>" +
				'<div class="lv-sep"></div><div class="lv-clist">' + rows.join("") + "</div>" + confirmBar("Clean up", true, ["\u2318", "\u232b"]);
		}
		S.sheet = true;
		showSheet(sh);
	}
	function confirmBar(label, on, keys) {
		return '<div class="lv-actions lv-cbar"><span class="lv-flex"></span>' +
			'<button type="button" class="lv-primary lv-cancel" data-act="cancel">Cancel' + caps(["esc"], "lv-cap-sm lv-cap-ring") + "</button>" +
			'<button type="button" class="lv-primary" data-act="confirm"' + (on ? "" : " disabled") + ">" + label + caps(keys || ["\u21b5"], "lv-cap-sm") + "</button></div>";
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

	function snapshot() { return JSON.stringify({ disk: S.disk, groups: S.groups, procs: S.procs, freeShown: S.freeShown, level: S.level, trashFull: S.trashFull, trash: S.trash }); }
	function restore(snap) {
		var o = JSON.parse(snap);
		S.disk = o.disk; S.groups = o.groups; S.procs = o.procs; S.freeShown = o.freeShown; S.level = o.level; S.trashFull = o.trashFull; S.trash = o.trash || [];
		S.cleanedNote = null;
		renderBar(true);
		render();
		syncTrash();
	}

	// pick says what goes (the ticks by default); Auto mode passes its own groups and says so in the toast.
	function clean(pick, said) {
		closeOverlays();
		pick = pick || function (g, it) { return it.on; };
		var freed = Math.round(sum(S.groups, function (g) { return sum(g.items, function (it) { return pick(g, it) ? it.gb : 0; }); }) * 10) / 10;
		if (freed <= 0) return;
		S.undo = snapshot();
		$$(".lv-grow").forEach(function (r) { var g = group(r.dataset.id); if (g && g.items.every(function (it) { return pick(g, it); })) r.classList.add("is-going"); });
		if (!said) $$(".lv-items, .lv-detail").forEach(function (r) { r.classList.add("is-going"); });
		var binned = [], emptied = false;
		S.groups.forEach(function (g) { g.items.forEach(function (it) {
			if (!pick(g, it)) return;
			if (g.id === "trash") emptied = true;
			else if (g.trash) binned.push({ name: it.name.replace(/^.*\//, ""), kind: it.desk === "installers" ? "folder" : "", gb: it.gb, counted: true });
		}); });
		later(function () {
			var from = S.disk.free;
			S.groups.forEach(function (g) { g.items = g.items.filter(function (it) { return !pick(g, it); }); });
			S.groups = S.groups.filter(function (g) { return g.items.length; });
			S.open = {}; S.info = {};
			S.disk.free = Math.round((from + freed) * 10) / 10;
			S.sel = null; S.openChips = {};
			if (emptied) S.trash = S.trash.filter(function (x) { return x.counted; });
			if (binned.length || emptied) { S.trash = S.trash.concat(binned); syncTrash(true); }
			if (!S.groups.some(function (g) { return g.items.some(function (it) { return it.desk === "installers"; }); }) && window.LevoMenus && LevoMenus.closeWindow) LevoMenus.closeWindow("installers");
			renderGroups();
			renderBar(true);
			countFree(from, S.disk.free);
			renderActions();
			renderMenubar();
			renderIcons();
			toast("good", (said || "Freed") + " " + gb(freed), { act: "undo", label: "Undo" });
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
		renderDisk(S.freeShown);
		renderGroups();
		// The status line counts up, as the app's (round 14): "Scanning disk… 62%", then "Analysing… 40%".
		progressLine("Scanning disk…", REDUCED ? 1 : 700, function () {
			progressLine("Analysing…", REDUCED ? 1 : 1100, regrow);
		});
	}
	function progressLine(title, ms, done) {
		var el = $("[data-actleft]"), t0 = performance.now(), last = -1;
		var step = function (t) {
			var pct = Math.min(100, Math.floor((t - t0) / ms * 100));
			if (pct !== last) { last = pct; el.innerHTML = '<span class="lv-toast">' + esc(title) + (pct > 0 ? " " + pct + "%" : "") + "</span>"; }
			if (pct < 100) requestAnimationFrame(step); else done();
		};
		requestAnimationFrame(step);
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
		S.sel = null; S.openChips = {};
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
	// A metric's free plan (the gauge's word or the Summary's "Free up …"): Working…,
	// then quit what the agent marked safe, and say so in the status line.
	function freeMetric(metric) {
		if (S.working) return;
		var key = metric === "memory" ? "mem" : metric;
		var word = $('[data-gauge="' + metric + '"] .lv-g-label');
		S.working = metric;
		word.classList.add("is-working");
		renderSummary();
		later(function () {
			word.classList.remove("is-working");
			S.working = null;
			var go = S.procs.filter(function (p) { return p.safe && p[key] > (key === "mem" ? 0.5 : 2); });
			if (!go.length) toast("info", "Nothing to quit");
			else {
				var est = key === "mem" ? gb(sum(go, function (p) { return p.mem; })) : pct(sum(go, function (p) { return p[key]; }) / (key === "cpu" ? S.cpu.cores : 1)) + " " + metric.toUpperCase();
				S.procs = S.procs.filter(function (p) { return go.indexOf(p) < 0; });
				toast("good", "Quit " + go.map(function (p) { return p.name; }).join(", ") + " \u00b7 about " + est, null, 4200);
			}
			renderProcs(); renderGauges(); renderSummary(); renderActions();
		}, 900);
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
	// \u2318K (ActionPanel.swift, final): a full-width bottom sheet; the selected row's
	// actions under its name, then the shared ones, then the app's, then Close menu.
	// Nothing is highlighted on opening; arrows or the pointer pick, typing filters.
	function panelItems() {
		var sel = S.sel, items = [], title = null;
		if (sel && sel.type === "proc" && proc(sel.id)) {
			var p = proc(sel.id);
			title = p.name;
			if (!p.system) {
				items.push({ label: "Quit " + p.name, keys: ["\u21b5"], run: function () { quit(p.id); } });
				items.push({ label: "Force quit", keys: ["\u2325", "\u2318", "Q"], red: true, run: function () { quit(p.id); } });
			}
			items.push({ label: "Always keep", keys: ["\u2318", "D"], run: function () { p.verdict = "Keep"; p.safe = false; renderProcs(); toast("info", "Keeping " + p.name); } });
			items.push({ label: "Show in Activity Monitor", keys: ["\u2318", "\u21b5"], run: function () { toast("info", "Opens Activity Monitor"); } });
			items.push(null);
		} else if (sel && sel.type === "group" && group(sel.id)) {
			var g = group(sel.id), t = sum(g.items, function (it) { return it.on ? it.gb : 0; });
			title = g.title;
			items.push({ label: "Clean " + g.title, detail: gb(t), disabled: t <= 0, keys: ["\u21b5"], run: askClean });
			items.push({ label: "Show in Finder", keys: ["\u2318", "\u21b5"], run: function () { toast("info", "Opens " + g.location.split(",")[0]); } });
			items.push({ label: "Always keep", keys: ["\u2318", "D"], run: function () { keep(g.id); } });
			items.push(null);
		}
		if (S.groups.length) {
			items.push({ label: "Clean up", detail: gb(tickedGB()), disabled: tickedGB() <= 0, keys: ["\u2318", "\u232b"], run: askClean });
			items.push({ label: "Select", sub: true, run: function () { S.panel = "select"; panelAt = -1; drawPanel(); } });
		}
		items.push({ label: "Analyse now", keys: ["\u2318", "R"], run: analyse });
		items.push({ label: S.auto ? "Turn off Auto mode" : "Turn on Auto mode", run: function () { setAuto(!S.auto); } });
		items.push(S.paused ? { label: "Resume alerts", keys: ["\u2318", "P"], run: function () { S.paused = false; toast("info", "Alerts resumed"); } }
			: { label: "Pause alerts for 1 hour", keys: ["\u2318", "P"], run: function () { S.paused = true; toast("info", "Alerts paused for 1 hour"); } });
		items.push(null);
		items.push({ label: "Settings\u2026", keys: ["\u2318", ","], run: function () { closePop(); var a = document.getElementById("agents"); if (a) a.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" }); } });
		items.push({ label: "Quit Levo", keys: ["\u2318", "Q"], run: quitLevo });
		items.push(null);
		items.push({ label: "Close menu", keys: ["esc"], run: function () {} });
		return { title: title, items: items };
	}
	// Select: Smartly, All, None, Selected (the modes), as in the app.
	function selectItems() {
		var smart = LEVO_DEMO.levels.indexOf(S.level) >= 0;
		return { title: "Select", back: true, items: [
			{ label: "Smartly", checked: smart, run: function () { chooseLevel(S.lastLevel || LEVO_DEMO.level); } },
			{ label: "All", checked: S.level === "All", run: function () { chooseLevel("All"); } },
			{ label: "None", checked: S.level === "None", run: function () { chooseLevel("None"); } },
			{ label: "Selected", checked: S.level === "Selected", disabled: S.level !== "Selected", run: function () {} }
		] };
	}
	var panelAt = -1, panelList = [];
	function drawPanel(filter) {
		var el = $("[data-panel]");
		var data = S.panel === "select" ? selectItems() : panelItems();
		var q = (filter || "").toLowerCase();
		var list = data.items.filter(function (it) { return !q ? true : it && it.label.toLowerCase().indexOf(q) >= 0; });
		while (list.length && list[0] === null) list.shift();
		while (list.length && list[list.length - 1] === null) list.pop();
		list = list.filter(function (it, k) { return it || list[k - 1]; });
		panelList = list.filter(Boolean);
		if (q && panelAt < 0) panelAt = Math.max(0, panelList.findIndex(function (it) { return !it.disabled && !it.red; }));
		panelAt = Math.min(panelAt, panelList.length - 1);
		var n = -1;
		el.innerHTML = (data.title ? '<div class="lv-ph">' + (data.back ? '<button type="button" class="lv-back" data-act="pback" aria-label="Back">' + sym("chevron.left", 9) + "</button>" : "") + esc(data.title) + "</div>" : '<div class="lv-ph-gap"></div>') +
			'<div class="lv-pitems" role="menu">' + list.map(function (it) {
				if (!it) return '<div class="lv-psep"></div>';
				n++;
				return '<button type="button" role="menuitem" class="lv-pitem' + (n === panelAt ? " is-sel" : "") + (it.red ? " is-red" : "") + '"' + (it.disabled ? " disabled" : "") + ' data-act="pitem" data-n="' + n + '">' +
					"<span>" + esc(it.label) + "</span>" + (it.detail ? '<span class="lv-pdetail">' + esc(it.detail) + "</span>" : "") + '<span class="lv-flex"></span>' +
					(it.checked ? sym("checkmark", 11, "lv-sec") : "") +
					(it.sub ? sym("chevron.right", 9, "lv-sec") : it.keys ? caps(it.keys, "lv-cap-sm") : "") + "</button>";
			}).join("") + (panelList.length ? "" : '<div class="lv-pnone">No actions</div>') + "</div>" +
			'<div class="lv-psearch"><input type="text" data-psearch placeholder="Search for actions\u2026" aria-label="Search for actions" value="' + esc(filter || "") + '"></div>';
		var input = $("[data-psearch]", el);
		input.addEventListener("input", function () { panelAt = -1; drawPanel(input.value); });
		$$(".lv-pitem", el).forEach(function (b, k) { b.addEventListener("pointermove", function () { if (panelAt !== k) { panelAt = k; $$(".lv-pitem", el).forEach(function (x, m) { x.classList.toggle("is-sel", m === k); }); } }); });
		showSheet(el);
		if (inView) { input.focus({ preventScroll: true }); input.setSelectionRange(input.value.length, input.value.length); }
	}
	// The one bottom sheet (PopoverSheet.swift): it rises from the popover's bottom edge
	// over a dimmed popover, which grows if the sheet needs more room.
	function showSheet(el) {
		var scrim = $('[data-act="scrim"]');
		scrim.hidden = false;
		var wasOpen = !el.hidden;
		el.hidden = false;
		var need = el.offsetHeight + 8;
		pop.style.minHeight = Math.max(need, 0) + "px";
		if (!wasOpen) { el.classList.remove("is-in"); void el.offsetWidth; el.classList.add("is-in"); scrim.classList.remove("is-in"); void scrim.offsetWidth; scrim.classList.add("is-in"); }
	}
	function hideSheets() {
		var scrim = $('[data-act="scrim"]');
		scrim.hidden = true; scrim.classList.remove("is-in");
		$$(".lv-bsheet").forEach(function (x) { x.hidden = true; x.classList.remove("is-in"); });
		pop.style.minHeight = "";
	}
	function togglePanel() {
		if (S.sheet) return;
		if (S.panel) { S.panel = null; hideSheets(); return; }
		S.menu = false; $("[data-levels]").hidden = true;
		S.panel = "main"; panelAt = -1;
		drawPanel();
	}
	function runPanel(i) {
		var it = panelList[i];
		if (!it || it.disabled) return;
		if (it.sub) { it.run(); return; }
		S.panel = null; hideSheets();
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
		var btn = $('[data-act="levelmenu"]'), b = btn.getBoundingClientRect(), pr = pop.getBoundingClientRect();
		el.style.top = Math.round(b.bottom - pr.top + 4) + "px";
		el.style.left = ""; el.style.right = "";
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
	// What's in the Trash: files moved there from the desktop or a Finder window, and what a clean sent
	// there (counted: its space was freed already). The popover lists it as a Trash row sized by the rest.
	var TRASH_GROUP = { id: "trash", about: ["Files you moved to the Trash.", "You chose them yourself.", "Emptying the Trash frees their space for good."], title: "Trash", symbol: "trash.fill", tile: "grey", changed: "today", location: "~/.Trash", verdict: "Already in the Trash", good: true, items: [] };
	var DESK_GB = { shot: 0.004, notes: 0.000004, prices: 0.000001, features: 0.000002, unzipped: 2.4 };
	function binGB() { return Math.round(sum(S.trash, function (x) { return x.counted ? 0 : x.gb; }) * 1000) / 1000; }
	function syncTrash(bump) {
		var total = binGB(), g = group("trash");
		if (total <= 0) { if (g) S.groups = S.groups.filter(function (x) { return x.id !== "trash"; }); }
		else {
			// It sits in the list where its size puts it, moving as it grows.
			if (!g) g = JSON.parse(JSON.stringify(TRASH_GROUP));
			else S.groups = S.groups.filter(function (x) { return x !== g; });
			var at = S.groups.findIndex(function (x) { return sum(x.items, function (it) { return it.gb; }) < total; });
			S.groups.splice(at < 0 ? S.groups.length : at, 0, g);
			var on = g.items.length ? g.items[0].on : S.level !== "None";
			g.items = [{ name: "Trash", gb: Math.max(0.01, Math.round(total * 100) / 100), level: 1, on: on }];
		}
		S.trashFull = S.trash.length > 0;
		renderTrash(bump);
		renderGroups(); renderBar(); renderActions();
		if (window.LevoMenus && LevoMenus.updateWindow) LevoMenus.updateWindow("trash", { items: trashList() });
	}
	function trashList() { return S.trash.map(function (x) { return { name: x.name, kind: x.kind, size: x.gb }; }); }
	function openTrash() {
		var M = window.LevoMenus;
		if (!M || !M.window) return;
		later(function () { M.window("finder", { id: "trash", title: "Trash", trash: true, items: trashList() }); }, 300);
	}
	// The pointer over the dock's Trash (client px), lighting it as a drop target.
	function overTrash(p) {
		var t = $('[data-dock="trash"]');
		var on = false;
		if (p && t) { var r = t.getBoundingClientRect(); on = p.x >= r.left - 6 && p.x <= r.right + 6 && p.y >= r.top - 14 && p.y <= r.bottom + 6; }
		if (t) t.classList.toggle("is-target", on);
		return on;
	}
	function trashPoint() {
		var t = $('[data-dock="trash"]'), r = t.getBoundingClientRect(), sr = scene.getBoundingClientRect();
		return { x: r.left + r.width / 2 - sr.left, y: r.top + r.height / 2 - sr.top - 4 };
	}
	// A desktop file to the Trash: it flies in (CSS), the Trash fills and the popover's Trash row grows.
	function trashDesk(id) {
		var el = $('[data-icon="' + id + '"]');
		if (!el || id === "dmg" || el.classList.contains("is-gone")) return false;
		var info = LEVO_DEMO.desktop.filter(function (d) { return d.id === id; })[0];
		var gbs = DESK_GB[id] || 0, removed = [];
		S.groups.forEach(function (g) { g.items = g.items.filter(function (it) { if (it.desk === id) { gbs += it.gb; removed.push({ g: JSON.parse(JSON.stringify(g)), it: it }); return false; } return true; }); });
		S.groups = S.groups.filter(function (g) { return g.items.length || g.id === "trash"; });
		if (id === "installers" && S.installers) gbs = Math.max(gbs, sum(S.installers, function (x) { return x.size || 0; }));
		S.binned[id] = true;
		renderIcons();
		if (id === "installers" || id === "unzipped") { var M = window.LevoMenus; if (M && M.closeWindow) M.closeWindow(id); }
		later(function () {
			var entry = { name: info.name, kind: info.kind === "doc" ? "txt" : info.kind === "shot" ? "image" : info.kind, gb: Math.round(gbs * 1e6) / 1e6, desk: id };
			S.trash.push(entry);
			syncTrash(true);
			lastMove(entry, function () {
				S.binned[id] = false;
				removed.forEach(function (r) {
					var g = group(r.g.id);
					if (!g) { g = r.g; g.items = []; S.groups.push(g); }
					g.items.push(r.it);
				});
				renderIcons();
			});
		}, REDUCED ? 0 : 560);
		return true;
	}
	// An item from a Finder window to the Trash, flying from its icon (or where it was dropped).
	function trashWinItem(info, rect) {
		var list = info.window === "installers" ? S.installers : info.window === "unzipped" ? S.unzippedItems : null;
		if (!list || !info.item) return;
		var i = list.indexOf(info.item);
		if (i < 0) return;
		var sr = scene.getBoundingClientRect(), r = rect || (info.el && info.el.querySelector("img") && info.el.querySelector("img").getBoundingClientRect());
		var a = r ? { x: r.left + r.width / 2 - sr.left, y: r.top + r.height / 2 - sr.top } : trashPoint();
		var src = (info.el && info.el.querySelector("img") && info.el.querySelector("img").src) || info.src || "img/desk/doc.png";
		list.splice(i, 1);
		if (window.LevoMenus) LevoMenus.updateWindow(info.window, { items: list });
		var gbs = info.item.size || 0;
		// The folder on the desktop shrinks by what left it; it stays on the desktop even when empty.
		if (info.window === "installers") S.groups.forEach(function (g) {
			g.items.forEach(function (it) { if (it.desk === "installers") it.gb = Math.max(0, Math.round((it.gb - gbs) * 1000) / 1000); });
			g.items = g.items.filter(function (it) { if (it.desk === "installers" && it.gb <= 0.001) { S.kept.installers = true; return false; } return true; });
		});
		S.groups = S.groups.filter(function (g) { return g.items.length || g.id === "trash"; });
		flyArc(src, a, trashPoint(), { lift: 60, dur: 520, shrink: 0.6 }, function () {
			var entry = { name: info.item.name, kind: info.item.kind, gb: gbs };
			S.trash.push(entry);
			syncTrash(true);
			lastMove(entry, function () {
				list.splice(Math.min(i, list.length), 0, info.item);
				if (window.LevoMenus) LevoMenus.updateWindow(info.window, { items: list });
				if (info.window === "installers") S.groups.forEach(function (g) { g.items.forEach(function (it) { if (it.desk === "installers") it.gb = Math.round((it.gb + gbs) * 1000) / 1000; }); });
			});
		});
	}
	// Edit › Undo puts the last move to the Trash back, as Finder does ("Undo Move of “notes (3).txt”").
	var undoMove = null;
	function lastMove(entry, putBack) {
		undoMove = { label: "Move of \u201c" + entry.name + "\u201d", run: function () {
			var i = S.trash.indexOf(entry);
			if (i < 0) return;
			S.trash.splice(i, 1);
			putBack();
			syncTrash();
		} };
	}
	// Emptying: the Trash window's icons shrink away, the dock's Trash goes back to empty and the space comes back.
	function emptyTrash() {
		if (!S.trash.length) return false;
		var w = scene.querySelector('[data-lvm-gw="trash"]');
		if (w) Array.prototype.forEach.call(w.querySelectorAll(".lvm-fi"), function (x, i) { x.style.transitionDelay = (i * 40) + "ms"; x.classList.add("is-vanish"); });
		var from = S.disk.free, freed = binGB();
		later(function () {
			S.trash = [];
			S.disk.free = Math.round((from + freed) * 10) / 10;
			syncTrash(true);
			if (freed > 0.05) { countFree(from, S.disk.free); renderMenubar(); }
		}, REDUCED ? 0 : 420);
		return true;
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
		if (t.classList.contains("lv-chip")) { quietKey = t.dataset.key; t.classList.add("is-quiet"); }
		S.touched = true;
		if (S.dragged) return;
		if (t.dataset.dock) { dockClick(t); return; }
		if (t.dataset.icon) {
			$$(".lv-ic").forEach(function (x) { x.classList.toggle("is-sel", x === t); });
			if (e.detail >= 2) openFile(t.dataset.icon);
			return;
		}
		var act = t.dataset.act, id = t.dataset.id;
		if (act !== "panel" && act !== "pitem" && act !== "pback" && S.panel && !t.closest("[data-panel]")) { S.panel = null; hideSheets(); if (act !== "toggle") return; }
		if (act !== "levelmenu" && act !== "levelpick" && act !== "smartly" && act !== "levelword" && S.menu) { S.menu = false; $("[data-levels]").hidden = true; }
		switch (act) {
			case "toggle": S.popOpen ? closePop() : openPop(); break;
			case "note": openPop(); break;
			case "noteclose": e.stopPropagation(); hideNote(); break;
			case "unlock": unlock(); break;
			case "fanitem": var fi = S.downloads[+t.dataset.n]; closeFan(); if (fi && fi.levo) lwin(true); break;
			case "fanfinder": closeFan(); openFile("installers"); break;
			case "desk": closeFan(); closePop(); $$(".lv-ic").forEach(function (x) { x.classList.remove("is-sel"); }); break;
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
			case "sumall": e.stopPropagation(); toggleAll(); break;
			case "automode": case "automode-open": e.stopPropagation(); togglePanel(); break;
			case "topclean": if (S.auto) togglePanel(); else askClean(); break;
			case "sumspace": toggleAll(); break;
			case "chip": e.stopPropagation(); S.openChips[id] = !S.openChips[id]; if (S.openChips[id]) S.open[id] = true; renderSummary(); break;
			case "levelword": e.stopPropagation(); levelWordMenu(t); return;
			case "scrim": closeOverlays(); break;
			case "primary": var p = primary(); if (p.act === "clean") askClean(); else if (p.act === "quitSel") quit(S.sel.id); break;
			case "panel": togglePanel(); break;
			case "pitem": runPanel(+t.dataset.n); break;
			case "pback": S.panel = "main"; panelAt = -1; drawPanel(); break;
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
	// Right-click on a desktop icon: Finder's menu, with Move to Trash.
	function onContext(e) {
		var ic = e.target.closest && e.target.closest("[data-icon]");
		if (!ic || !root.contains(ic) || !window.LevoMenus || !LevoMenus.contextMenu) return;
		e.preventDefault();
		$$(".lv-ic").forEach(function (x) { x.classList.toggle("is-sel", x === ic); });
		var id = ic.dataset.icon, sr = scene.getBoundingClientRect();
		LevoMenus.contextMenu(e.clientX - sr.left, e.clientY - sr.top, [
			{ label: "Open", act: function () { openFile(id); } },
			null,
			id === "dmg" ? { label: "Eject \u201cLevo\u201d", keys: "⌘E", disabled: true } : { label: "Move to Trash", keys: "⌘⌫", act: function () { trashDesk(id); } },
			null,
			{ label: "Get info", keys: "⌘I", disabled: true },
			{ label: "Rename", disabled: true },
			{ label: "Compress", disabled: true },
			{ label: "Copy", disabled: true }
		]);
	}
	function dockClick(el) {
		var id = el.dataset.dock, M = window.LevoMenus;
		if (id === "levo") { bounce(el); openPop(); return; }
		if (id === "trash") { el.classList.add("is-bump"); later(function () { el.classList.remove("is-bump"); }, 500); openTrash(); return; }
		if (id === "downloads") { toggleFan(); return; }
		if (id === "textedit") { bounce(el); var M2 = window.LevoMenus, tw = M2 && M2.kinds().filter(function (k) { return k.kind === "textedit"; })[0]; if (tw) M2.focus(tw.id); return; }
		bounce(el);
		if (!M || !M.window) return;
		if (id === "settings") later(function () { M.window("settings", { id: "settings" }); }, 500);
		if (id === "finder") later(function () { if (S.lwinClosed) lwin(true); else openFile("installers"); }, 400);
		if (id === "notes") later(function () { openFile("notes"); }, 500);
		if (id === "mail") later(function () { window.location.href = "mailto:support@cntxtlabs.co?subject=Levo%20support%20%26%20feedback"; }, 400);
		if (id === "terminal") later(function () { var a = document.getElementById("agents"); if (a) a.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" }); }, 500);
	}

	// The Levo window closes or minimises like a Finder window; Finder in the dock brings it back.
	function lwin(show) {
		if (show) openInstaller();
		else if (window.LevoMenus) LevoMenus.closeWindow("levo-dmg");
	}

	// The two Levo notes on the desktop, written like quick notes. The price comes from the one value in levo.js.
	var NOTES = {
		prices: function () {
			return { title: "prices_Levo.txt", text: [
				"Levo price",
				"",
				"- " + (OPTS.price || "$5") + " right now",
				"- Lifetime licence, one payment",
				"- Scan and suggestions are free",
				"- Cleaning needs the licence",
				"- The price goes up over time, so earlier is cheaper"
			].join("\n") };
		},
		features: function () {
			return { title: "features_Levo.txt", text: [
				"Levo",
				"",
				"- Watches disk, memory, CPU and GPU against my limits",
				"- My own agent works out what's safe before the alert. Read-only, sandboxed",
				"- I tick what goes. My files go to the Trash",
				"- Holds anything a tool is still using",
				"- Protected folders stay out of it",
				"- Cleanup levels: careful, balanced, aggressive",
				"- Auto mode keeps " + gb(S.disk.alert) + " free and cleans on its own",
				"- No account, no server"
			].join("\n") };
		}
	};

	// Desktop files open in Finder or TextEdit windows (menus.js), and the zip unzips.
	function openFile(id) {
		var M = window.LevoMenus, C = (M && M.content) || {};
		if (!M || !M.window) return;
		var at = function (dx, dy) { var w = $("[data-lwin]"), p = w ? [w.offsetLeft, w.offsetTop] : S.lwinAt || [300, 120]; return { x: p[0] + dx, y: p[1] + dy }; };
		if (id === "installers") {
			var el = $('[data-icon="installers"]');
			if (el && el.classList.contains("is-gone")) return;
			var p = at(-60, 40);
			S.installers = S.installers || (C.installers || []).slice();
			M.window("finder", { id: "installers", title: "Old Installers", x: p.x, y: p.y, items: S.installers });
		} else if (id === "notes") {
			var q = at(40, 70);
			M.window("textedit", { id: "notes", title: "notes (3).txt", x: q.x, y: q.y, w: 420, h: 300, text: C.notes || "" });
		} else if (NOTES[id]) {
			var r = at(id === "prices" ? 90 : 130, id === "prices" ? 30 : 60), n = NOTES[id]();
			M.window("textedit", { id: id, title: n.title, x: r.x, y: r.y, w: 440, h: 320, text: n.text });
		} else if (id === "unzipped") {
			var u = at(0, 90);
			S.unzippedItems = S.unzippedItems || (C.unzipped || []).slice();
			M.window("finder", { id: "unzipped", title: "project-final-v2", x: u.x, y: u.y, items: S.unzippedItems });
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
		var k = e.key, mod = e.metaKey || e.ctrlKey;
		if (!S.popOpen && inView && mod && k === "Backspace") {
			var selIc = $(".lv-ic.is-sel"), tg = e.target;
			if (selIc && !(tg && (tg.isContentEditable || /^(INPUT|TEXTAREA)$/.test(tg.tagName))) && trashDesk(selIc.dataset.icon)) { e.preventDefault(); return; }
		}
		if (!S.popOpen || !inView) return;
		var inPanel = S.panel && document.activeElement && document.activeElement.matches("[data-psearch]");
		if (mod && (k === "k" || k === "K")) { e.preventDefault(); togglePanel(); return; }
		if (k === "Escape") {
			e.preventDefault();
			if (S.panel || S.menu || S.sheet) closeOverlays(); else closePop();
			return;
		}
		if (S.panel && (k === "ArrowDown" || k === "ArrowUp")) {
			e.preventDefault();
			panelAt = panelAt < 0 ? (k === "ArrowDown" ? 0 : panelList.length - 1) : (panelAt + (k === "ArrowDown" ? 1 : -1) + panelList.length) % panelList.length;
			$$(".lv-pitem").forEach(function (b, i) { b.classList.toggle("is-sel", i === panelAt); });
			return;
		}
		if (S.panel && k === "Enter") { e.preventDefault(); if (panelAt >= 0) runPanel(panelAt); return; }
		if (inPanel) return;
		if (S.sheet && (k === "Enter" || (mod && k === "Backspace"))) { e.preventDefault(); confirmNow(); return; }
		if (mod && k === "Backspace" && !S.sheet) { e.preventDefault(); askClean(); return; }
		var focusIn = root.contains(document.activeElement) || document.activeElement === document.body;
		if (k === "Enter" && focusIn && !S.sheet && !mod) {
			var a = document.activeElement;
			if (a && a !== document.body && a.matches("button") && !a.matches('[data-act="primary"]')) return;
			var p = primary();
			if (p.act === "quitSel") { e.preventDefault(); quit(S.sel.id); }
		}
	}

	// The tip follows sections, not ticks (round 15): it stays put across one section's ticks and
	// changes only when the pointer enters another, centred over that section.
	var tipSeg = null;
	function onHoverBar(e) {
		var tk = e.target.closest && e.target.closest(".lv-tick"), tip = $("[data-tip]");
		var id = tk ? tk.dataset.seg : null;
		if (!tk && e.target.closest && e.target.closest("[data-dbar]") && tipSeg && e.type !== "mouseleave") return;
		if (id === tipSeg) return;
		tipSeg = id;
		if (!tk) { tip.hidden = true; $$(".lv-tick").forEach(function (x) { x.classList.remove("is-dim"); }); return; }
		var s = segments().filter(function (x) { return x.id === id; })[0];
		if (!s) return;
		var mine = $$(".lv-tick").filter(function (x) { x.classList.toggle("is-dim", x.dataset.seg !== id); return x.dataset.seg === id; });
		tip.innerHTML = "<b>" + esc(s.label) + "</b> " + gb(s.gb);
		var bar = $("[data-dbar]"), first = mine[0], last = mine[mine.length - 1];
		var x = (first.offsetLeft + last.offsetLeft + last.offsetWidth) / 2;
		var fresh = tip.hidden;
		tip.hidden = false;
		// Whole pixels, no centring transform, so the text stays crisp.
		tip.style.left = Math.round(Math.max(0, Math.min(bar.offsetWidth - tip.offsetWidth, x - tip.offsetWidth / 2))) + "px";
		tip.classList.toggle("is-moving", !fresh);
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
		root.addEventListener("contextmenu", onContext);
		document.addEventListener("keydown", onKey);
		var bubbleTimer = null;
		pop.addEventListener("pointerout", function (ev) {
			if (!quietKey) return;
			var from = ev.target.closest && ev.target.closest(".lv-chip.is-quiet");
			if (from && !(ev.relatedTarget && from.contains(ev.relatedTarget))) { from.classList.remove("is-quiet"); quietKey = null; }
		});
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
		bar.addEventListener("mouseleave", function () { onHoverBar({ target: bar, type: "mouseleave" }); });
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
			device: function () { return power === "desktop" ? "Mac mini" : power === "laptop" ? "MacBook Pro" : deviceFamily(); },
			disk: function () { return { name: S.disk.name, total: S.disk.total, free: S.disk.free }; },
			closeLevo: closePop,
			openLevo: function () { S.touched = true; openPop(); },
			emptyTrash: function () { undoMove = null; return emptyTrash(); },
			undoLabel: function () { return undoMove && S.trash.length ? undoMove.label : null; },
			undo: function () { var u = undoMove; undoMove = null; if (u) u.run(); },
			trashItem: function (info) { trashWinItem(info); },
			dragItem: function (d) { overTrash(d.over ? d : null); },
			dropItem: function (d) { var on = overTrash(d); overTrash(null); if (on) trashWinItem(d, d.ghost); return on; },
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
		// TextEdit joins the dock, running, while one of its windows is open, and leaves with the last.
		scene.addEventListener("lvm:window", function () {
			var te = $('[data-dock="textedit"]'), M = window.LevoMenus;
			if (!te || !M || !M.kinds) return;
			var open = M.kinds().some(function (k) { return k.kind === "textedit"; }), was = !te.classList.contains("is-hidden");
			if (open && !was) { te.classList.remove("is-hidden"); te.classList.add("is-arriving", "is-running"); later(function () { te.classList.remove("is-arriving"); }, 500); }
			if (!open && was) { te.classList.add("is-hidden"); te.classList.remove("is-running"); }
		});
		scene.addEventListener("lvm:wifi", function (ev) { $("[data-wifi]").innerHTML = sym(ev.detail && ev.detail.on === false ? "wifi.slash" : "wifi", 15); });
		// The window manager is here now: place the installer window, and the icons around it.
		S.iconsPlaced = false;
		layout();
	}

	// ---------------------------------------------------------------- Downloads

	// A download, as macOS shows it: the Downloads stack appears in the dock (right
	// of the divider, before the Trash), Levo.dmg flies into it on an arc, a
	// progress bar fills on the stack, then it bounces. A click fans the recent
	// downloads out, Levo.dmg on top.
	var DOWNLOADS = [
		{ name: "Setup.dmg", icon: "dmg" },
		{ name: "Invoice-2026-10.pdf", icon: "pdf" },
		{ name: "project-final-v2.zip", icon: "zip" },
		{ name: "Screenshot 2026-10-12 at 9.41.22 am.png", icon: "png" }
	];
	function download(from) {
		if (!scene || scene.dataset.mode !== "desk") return;
		S.downloads = S.downloads || DOWNLOADS.slice();
		S.downloads = S.downloads.filter(function (d) { return !d.levo; });
		S.downloads.unshift({ name: "Levo.dmg", icon: "dmg", levo: true });
		closeFan();
		var st = $('[data-dock="downloads"]'), fresh = st.classList.contains("is-hidden");
		if (fresh) { st.classList.remove("is-hidden"); st.classList.add("is-arriving"); later(function () { st.classList.remove("is-arriving"); }, 500); }
		var sr = scene.getBoundingClientRect(), a;
		if (from && scene.contains(from) && from.getBoundingClientRect().width) {
			var fr = from.getBoundingClientRect();
			a = { x: fr.left + fr.width / 2 - sr.left, y: fr.top + fr.height / 2 - sr.top };
		} else a = { x: scene.offsetWidth / 2, y: 46 };
		later(function () {
			var r2 = st.getBoundingClientRect(), b = { x: r2.left + r2.width / 2 - sr.left, y: r2.top + r2.height / 2 - sr.top - 6 };
			flyArc("img/desk/dmg.png", a, b, { lift: 180, dur: 780, shrink: 0.45 }, function () { progress(st); });
		}, fresh ? 320 : 0);
	}
	// An icon flies along a quadratic arc from a to b (scene px), shrinking as it goes, then fades in the last moment.
	function flyArc(src, a, b, o, done) {
		var fly = document.createElement("img");
		fly.className = "lv-dl-fly";
		fly.src = src;
		fly.alt = "";
		scene.appendChild(fly);
		var c = { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - o.lift }, t0 = performance.now(), dur = REDUCED ? 1 : o.dur;
		var step = function (t) {
			var k = Math.min(1, (t - t0) / dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, u = 1 - e;
			var x = u * u * a.x + 2 * u * e * c.x + e * e * b.x, y = u * u * a.y + 2 * u * e * c.y + e * e * b.y;
			fly.style.transform = "translate(" + (x - 32).toFixed(1) + "px," + (y - 32).toFixed(1) + "px) scale(" + (1 - o.shrink * e).toFixed(3) + ")";
			fly.style.opacity = k > 0.92 ? String((1 - k) / 0.08) : "1";
			if (k < 1) requestAnimationFrame(step);
			else { fly.remove(); if (done) done(); }
		};
		requestAnimationFrame(step);
	}
	function progress(st) {
		var bar = $(".lv-dl-bar", st), fillEl = $("b", bar), t0 = performance.now(), dur = REDUCED ? 1 : 2600;
		bar.hidden = false;
		var step = function (t) {
			var k = Math.min(1, (t - t0) / dur);
			// Steady, with the small stalls a real download has.
			var v = k < 1 ? Math.min(1, k + Math.sin(k * 9) * 0.03) : 1;
			fillEl.style.width = (v * 100).toFixed(1) + "%";
			if (k < 1) requestAnimationFrame(step);
			else later(function () { bar.hidden = true; fillEl.style.width = "0"; bounce(st); st.classList.remove("is-running"); }, 220);
		};
		requestAnimationFrame(step);
	}
	function toggleFan() { if ($("[data-fan]")) closeFan(); else openFan(); }
	function closeFan() { var f = $("[data-fan]"); if (f) { f.classList.add("is-out"); setTimeout(function () { f.remove(); }, 180); } }
	function openFan() {
		var st = $('[data-dock="downloads"]');
		if (!st || st.classList.contains("is-hidden")) return;
		var list = (S.downloads || DOWNLOADS).slice(0, 6);
		var sr = scene.getBoundingClientRect(), r2 = st.getBoundingClientRect();
		var fan = document.createElement("div");
		fan.className = "lv-fan";
		fan.setAttribute("data-fan", "");
		fan.style.left = (r2.left + r2.width / 2 - sr.left) + "px";
		fan.style.top = (r2.top - sr.top - 6) + "px";
		fan.innerHTML = list.map(function (d, i) {
			// A gentle arc to the right, as the Dock's fan.
			var y = -(i + 1) * 64, x = Math.round(i * i * 4.5), rot = (i * 1.6).toFixed(1);
			return '<button type="button" class="lv-fan-item" data-act="fanitem" data-n="' + i + '" style="--x:' + x + "px;--y:" + y + "px;--r:" + rot + "deg;--i:" + i + '">' +
				'<span class="lv-fan-name">' + esc(d.name) + '</span><img src="img/desk/' + d.icon + '.png" width="52" height="52" alt=""></button>';
		}).join("") +
			'<button type="button" class="lv-fan-open" data-act="fanfinder" style="--x:' + Math.round(list.length * list.length * 4.5) + "px;--y:" + (-(list.length + 1) * 64 + 14) + 'px">Open in Finder</button>';
		scene.appendChild(fan);
	}

	// The Levo window: price and links from the page; double-click the app to open
	// Levo; drag it onto Applications to download; drag the window by its title bar.
	function setupLevoWindow(win) {
		if (!win) return;
		$("[data-lprice]", win).textContent = OPTS.price || "";
		$("[data-lterm]", win).textContent = OPTS.term || "";
		var dl = $("[data-ldownload]", win), buy = $("[data-lbuy]", win);
		dl.href = OPTS.download || "#";
		buy.href = OPTS.buy || "#";
		buy.textContent = OPTS.price ? "Buy for " + OPTS.price : "Buy";
		[dl, buy].forEach(function (a) { if (/^\[|^#$/.test(a.getAttribute("href"))) a.setAttribute("data-placeholder", ""); });
		if (!dl.hasAttribute("data-placeholder")) dl.setAttribute("download", "");
		dl.addEventListener("click", function () { download(dl); });
		var app = $('[data-act="lwinapp"]', win), apps = $("[data-lwinapps]", win);
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
	}

	// ---------------------------------------------------------------- Parts, for the tiles below the Mac
	// The popover's own markup, built from the demo's state, so each tile is the real component
	// (crisp at any scale) rather than a picture. Call after mount.
	var PARTS_API = {
		disk: function () {
			var owners = allocate(segments(), TICKS), t = tickedGB();
			return '<div class="lv-dhead lv-namerow"><span class="lv-sec">' + sym("laptopcomputer", 14) + '</span><b>MacBook Pro</b><span class="lv-flex"></span>' +
				'<span class="lv-topclean" aria-hidden="true">Clean up</span></div>' +
				'<div class="lv-sep"></div>' +
				'<section class="lv-disk"><div class="lv-hero"><span class="lv-free lv-num">' + gb(S.disk.free) + '</span><span class="lv-sec">free</span><span class="lv-flex"></span>' +
				'<span class="lv-can lv-num"><b>' + gb(t) + "</b>\u2009ready</span></div>" +
				'<div class="lv-dbar"><div class="lv-ticks">' + owners.map(function (o) {
					return '<i class="lv-tick" data-seg="' + o.id + '" style="background-color:' + (o.id === "can" ? "var(--lv-ready)" : o.color) + '"></i>';
				}).join("") + '</div><span class="lv-tip" hidden></span></div></section>';
		},
		// The sections the tip names, in the bar's order.
		sections: function () { return segments().map(function (x) { return { id: x.id, label: x.label, size: gb(x.gb) }; }); },
		gauges: function () {
			var vals = { memory: memUsed() / S.mem.total * 100, cpu: cpuPct(), gpu: gpuPct() };
			return '<section class="lv-gauges">' + [["memory", "Memory"], ["cpu", "CPU"], ["gpu", "GPU"]].map(function (g) {
				var on = Math.round(vals[g[0]] / 100 * 26), k = 0;
				return gaugeHTML(g[0], g[1]).replace(/<line ([^>]*?)data-c="([^"]+)"/g, function (m, a, c) { return k++ < on ? '<line class="on" style="stroke:' + c + '" ' + a + 'data-c="' + c + '"' : m; })
					.replace("<span data-gnum></span>", "<span data-gnum>" + num0.format(Math.round(vals[g[0]])) + "</span>");
			}).join("") + "</section>";
		},
		list: function (n) {
			return '<div class="lv-sh"><span>Ready to free</span><span class="lv-sh-r"><span class="lv-dd">Smartly' + sym("chevron.down", 9, "lv-sec") + "</span></span></div>" +
				'<div class="lv-list">' + S.groups.slice(0, n || 5).map(groupHTML).join("") + "</div>";
		},
		checkbox: function (on) { return checkbox(on ? "on" : "off", "", ""); },
		confirm: function () {
			var rows = [];
			S.groups.forEach(function (g) { g.items.forEach(function (it) {
				if (it.on && rows.length < 7) rows.push('<div class="lv-crow">' + tile(g.tile, g.symbol, "sm") + '<span class="lv-cname">' + esc(it.name) + '</span><span class="lv-flex"></span>' + (g.trash ? sym("trash", 11, "lv-sec") : "") + '<span class="lv-size lv-num">' + gb(it.gb) + "</span></div>");
			}); });
			return '<div class="lv-chead"><b>Clean up ' + gb(tickedGB()) + '?</b></div><div class="lv-sep"></div><div class="lv-clist">' + rows.join("") + "</div>" + confirmBar("Clean up", true, ["\u2318", "\u232b"]);
		},
		panel: function () {
			var items = panelItems().items, n = -1;
			while (items.length && items[items.length - 1] === null) items.pop();
			return '<div class="lv-ph-gap"></div><div class="lv-pitems">' + items.map(function (it) {
				if (!it) return '<div class="lv-psep"></div>';
				n++;
				return '<span class="lv-pitem' + (n === 0 ? " is-sel" : "") + '"' + (it.disabled ? " disabled" : "") + "><span>" + esc(it.label) + "</span>" + (it.detail ? '<span class="lv-pdetail">' + esc(it.detail) + "</span>" : "") +
					'<span class="lv-flex"></span>' + (it.sub ? sym("chevron.right", 9, "lv-sec") : it.keys ? caps(it.keys, "lv-cap-sm") : "") + "</span>";
			}).join("") + '</div><div class="lv-psearch"><span class="lv-psearch-ph">Search for actions\u2026</span></div>';
		},
		summary: function () {
			var el = document.createElement("div"), saved = $("[data-summary]");
			return saved ? saved.innerHTML : el.innerHTML;
		},
		actionBar: function () {
			return '<div class="lv-act-left"><span class="lv-checked">Checked just now</span></div><div class="lv-act-right"><span class="lv-primary"><span>Clean up</span>' + caps(["\u2318", "\u232b"], "lv-cap-sm") + '</span><span class="lv-kbtn">' + sym("switch.2", 13, "lv-sec") + "</span></div>";
		}
	};

	window.LevoDemo = {
		parts: PARTS_API,
		download: function (from) { download(from); },
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
