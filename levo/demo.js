/*
 * Levo demo: a fake Mac desktop with Levo's menubar popover, playable with fake data.
 *
 * Everything the popover shows comes from LEVO_DEMO below, so its pieces can be
 * swapped for the app's own later. The desktop uses only what the browser already
 * knows (time, date, time zone, language, battery, appearance, device family).
 * Nothing leaves the browser, and nothing asks for permission.
 *
 * Mount: <div id="levo-demo"></div>, then LevoDemo.mount(el). The page can call
 * LevoDemo.open(), LevoDemo.setAlert(gb) and LevoDemo.setAgent(name).
 */
(function () {
	"use strict";

	// The one data object. Sizes in GB, CPU and GPU in percent.
	var LEVO_DEMO = {
		app: "Finder",
		menus: ["File", "Edit", "View", "Go", "Window", "Help"],
		agent: "Claude Code",
		disk: {
			name: "Macintosh HD",
			total: 460,
			free: 16,
			alert: 20,
			today: -6,
			used: [
				{ id: "system", label: "macOS", gb: 58, color: "grey" },
				{ id: "apps", label: "Apps", gb: 96, color: "blue" },
				{ id: "developer", label: "Developer", gb: 118, color: "purple" },
				{ id: "documents", label: "Documents", gb: 87, color: "cyan" },
				{ id: "media", label: "Photos and media", gb: 50, color: "magenta" }
			]
		},
		memory: { total: 24, other: 6.7, warn: 85 },
		cpu: { cores: 8, other: 42, warn: 80 },
		gpu: { other: 0, warn: 80 },
		findings: [
			{ id: "xcode", title: "Xcode build data", icon: "hammer", tile: "blue", smart: true,
				location: "~/Library/Developer/Xcode", lastUsed: "12 days ago", verdict: "Rebuilds on next build", good: true,
				items: [
					{ name: "DerivedData/Levo", gb: 6.8 },
					{ name: "DerivedData/Elevate", gb: 4.9 },
					{ name: "DerivedData/Context", gb: 2.5 }
				] },
			{ id: "sims", title: "Simulators", icon: "phone", tile: "grey", smart: true,
				location: "~/Library/Developer/CoreSimulator", lastUsed: "3 weeks ago", verdict: "Unused devices, runtimes kept", good: true,
				items: [
					{ name: "iPhone 17 Pro", gb: 2.1 },
					{ name: "iPad Air", gb: 1.9 },
					{ name: "iPhone 16e", gb: 1.7 },
					{ name: "iPhone SE", gb: 1.5 },
					{ name: "Apple Watch Series 11", gb: 1.4 },
					{ name: "Apple TV 4K", gb: 1.2 }
				] },
			{ id: "worktrees", title: "Agent worktrees", icon: "branch", tile: "purple", smart: false, tag: "Review",
				location: "~/Developer/.worktrees", lastUsed: "2 days ago", verdict: "Two have unmerged work", good: false,
				items: [
					{ name: "fix-login", gb: 2.3 },
					{ name: "settings-pass", gb: 1.9 },
					{ name: "ui-cleanup", gb: 1.2 },
					{ name: "tmp-copy", gb: 0.7 }
				] },
			{ id: "packages", title: "Package caches", icon: "box", tile: "orange", smart: true,
				location: "~/Library/Caches", lastUsed: "Today", verdict: "Downloads again when needed", good: true,
				items: [
					{ name: "npm", gb: 1.2 },
					{ name: "pnpm store", gb: 0.9 },
					{ name: "Homebrew", gb: 0.6 },
					{ name: "SwiftPM", gb: 0.4 },
					{ name: "pip", gb: 0.3 }
				] },
			{ id: "browsers", title: "Browser caches", icon: "globe", tile: "cyan", smart: true,
				location: "~/Library/Caches", lastUsed: "Today", verdict: "Rebuilds as you browse", good: true,
				items: [
					{ name: "Chrome", gb: 0.7 },
					{ name: "Safari", gb: 0.4 }
				] }
		],
		processes: [
			{ id: "node", name: "node", icon: "hex", tile: "green", note: "Idle build server · 3 h", verdict: "Quit", cpu: 84, gpu: 0, mem: 1.9 },
			{ id: "xcode", name: "Xcode", icon: "hammer", tile: "blue", verdict: "Keep", cpu: 31, gpu: 1, mem: 3.2 },
			{ id: "windowserver", name: "WindowServer", icon: "window", tile: "dark", verdict: "System", system: true, cpu: 12, gpu: 4, mem: 0.8 },
			{ id: "slack", name: "Slack", icon: "hash", tile: "magenta", cpu: 6, gpu: 1, mem: 0.9 },
			{ id: "chrome", name: "Google Chrome", icon: "globe", tile: "yellow", cpu: 5, gpu: 2, mem: 2.6 },
			{ id: "simulator", name: "Simulator", icon: "phone", tile: "grey", verdict: "Keep", cpu: 4, gpu: 0, mem: 2.1 }
		],
		notification: { title: "Disk below {alert}", body: "{ready} ready to free" },
		cleaned: { title: "Freed {freed}", body: "{free} free on {disk}" },
		timing: { notify: 1800, teaser: 4200 }
	};

	// Icons on a 16 grid, stroked, from the app's round 3 designs.
	var ICONS = {
		drive: '<rect x="1.75" y="4.25" width="12.5" height="7.5" rx="2"/><path d="M4 8h4.5"/><circle cx="11.5" cy="8" r=".6" fill="currentColor"/>',
		hammer: '<path d="M9 2.6l4.4 4.4-1.6 1.6-1.3-1.3-5.9 5.9a1.15 1.15 0 0 1-1.6-1.6l5.9-5.9L7.6 4.4z"/>',
		phone: '<rect x="4.25" y="1.75" width="7.5" height="12.5" rx="2"/><path d="M7 12h2"/>',
		branch: '<circle cx="4.5" cy="3.5" r="1.6"/><circle cx="4.5" cy="12.5" r="1.6"/><circle cx="11.5" cy="5" r="1.6"/><path d="M4.5 5.1v5.8M11.5 6.6c0 3.2-7 1.8-7 4.3"/>',
		box: '<path d="M2.5 5L8 2.5 13.5 5v6L8 13.5 2.5 11z"/><path d="M2.5 5L8 7.5 13.5 5M8 7.5v6"/>',
		globe: '<circle cx="8" cy="8" r="6"/><ellipse cx="8" cy="8" rx="2.6" ry="6"/><path d="M2 8h12"/>',
		hex: '<path d="M8 1.8l5.4 3.1v6.2L8 14.2 2.6 11.1V4.9z"/>',
		window: '<rect x="1.75" y="2.75" width="12.5" height="10.5" rx="1.8"/><path d="M1.75 5.75h12.5"/>',
		hash: '<path d="M6.2 2.5l-1.2 11M11 2.5l-1.2 11M2.8 6h11M2.2 10h11"/>',
		chevDown: '<path d="M4.5 6.5L8 10l3.5-3.5"/>',
		chevRight: '<path d="M6.5 4L10.5 8l-4 4"/>',
		chevLeft: '<path d="M9.5 4L5.5 8l4 4"/>',
		check: '<path d="M3.5 8.4l2.9 2.9 6.1-6.6"/>',
		dash: '<path d="M4.5 8h7"/>',
		switch2: '<path d="M7.2 5H14M2 11h6.8"/><circle cx="4.6" cy="5" r="2.3"/><circle cx="11.4" cy="11" r="2.3"/>',
		trash: '<path d="M2.8 4.5h10.4M6.4 4.5V2.8h3.2v1.7M4.3 4.5l.7 9h6l.7-9"/>',
		folder: '<path d="M1.75 4.5a1 1 0 0 1 1-1h3.4l1.5 1.5h5.6a1 1 0 0 1 1 1v6.25a1 1 0 0 1-1 1H2.75a1 1 0 0 1-1-1z"/>',
		pin: '<path d="M10.5 2l3.5 3.5-2 .8-2.4 2.4.3 2.7-1 1L6.6 9.1 3 12.8M6.6 9.1L3.6 6.1l1-1 2.7.3 2.4-2.4z"/>',
		checkCircle: '<circle cx="8" cy="8" r="6"/><path d="M5.3 8.2l1.9 1.9 3.5-3.8"/>',
		refresh: '<path d="M13 8a5 5 0 1 1-1.47-3.53"/><path d="M12 1.8v2.9H9.1"/>',
		pause: '<circle cx="8" cy="8" r="6"/><path d="M6.6 5.8v4.4M9.4 5.8v4.4"/>',
		gear: '<circle cx="8" cy="8" r="4.1"/><circle cx="8" cy="8" r="1.6"/><path d="M8 1.6v2.3M8 12.1v2.3M1.6 8h2.3M12.1 8h2.3M3.5 3.5l1.6 1.6M10.9 10.9l1.6 1.6M3.5 12.5l1.6-1.6M10.9 5.1l1.6-1.6" stroke-width="1.9"/>',
		power: '<path d="M8 2v5.2"/><path d="M4.7 4.3a5 5 0 1 0 6.6 0"/>',
		xCircle: '<circle cx="8" cy="8" r="6"/><path d="M5.8 5.8l4.4 4.4M10.2 5.8l-4.4 4.4"/>',
		speed: '<path d="M2.6 11.2a6 6 0 1 1 10.8 0"/><path d="M8 9.2l2.6-3.2"/>',
		info: '<circle cx="8" cy="8" r="6"/><path d="M8 7.3v3.7"/><circle cx="8" cy="5" r=".4" fill="currentColor"/>',
		search: '<circle cx="7" cy="7" r="4.6"/><path d="M10.4 10.4L14 14"/>',
		terminal: '<rect x="1.75" y="2.75" width="12.5" height="10.5" rx="2"/><path d="M4.6 6l2 2-2 2M8.4 10.2h3"/>',
		shield: '<path d="M8 1.8l5 1.9v4.1c0 3.1-2.1 5.2-5 6.4-2.9-1.2-5-3.3-5-6.4V3.7z"/>',
		wand: '<path d="M2.5 13.5l7.3-7.3M8.6 5l1.4-1.4 2.4 2.4L11 7.4z"/><path d="M12.5 1.8v2M11.5 2.8h2M13.8 9v1.6M13 9.8h1.6M5 2v1.6M4.2 2.8h1.6"/>',
		lock: '<rect x="3.25" y="7" width="9.5" height="7" rx="1.6"/><path d="M5.4 7V5a2.6 2.6 0 0 1 5.2 0v2"/>',
		memory: '<rect x="1.75" y="4.25" width="12.5" height="6.5" rx="1.2"/><path d="M4.5 10.75v2M8 10.75v2M11.5 10.75v2M5 7.5h6"/>',
		cpu: '<rect x="4" y="4" width="8" height="8" rx="1.6"/><rect x="6.4" y="6.4" width="3.2" height="3.2" rx=".5"/><path d="M6 1.8V4M10 1.8V4M6 12v2.2M10 12v2.2M1.8 6H4M1.8 10H4M12 6h2.2M12 10h2.2"/>',
		gpu: '<rect x="1.75" y="4.25" width="12.5" height="7.5" rx="1.6"/><circle cx="10.2" cy="8" r="2"/><path d="M4.2 6.8v2.4M3.5 11.75v2"/>',
		reset: '<path d="M3 8a5 5 0 1 0 1.47-3.53"/><path d="M4 1.8v2.9h2.9"/>',
		plus: '<path d="M8 3v10M3 8h10"/>',
		sparkle: '<path d="M8 1.8c.5 3.4 2.8 5.7 6.2 6.2-3.4.5-5.7 2.8-6.2 6.2-.5-3.4-2.8-5.7-6.2-6.2 3.4-.5 5.7-2.8 6.2-6.2z"/>',
		eyeOff: '<path d="M2 8s2.2-4.5 6-4.5S14 8 14 8s-2.2 4.5-6 4.5S2 8 2 8z"/><circle cx="8" cy="8" r="1.8"/><path d="M2.5 13.5l11-11"/>',
		bolt: '<path d="M8.8 1.8L4 9h3.6l-.8 5.2L11.6 7H8z"/>',
		user: '<circle cx="8" cy="5.5" r="2.6"/><path d="M3 14c.6-2.8 2.6-4.2 5-4.2s4.4 1.4 5 4.2"/>',
		cloudOff: '<path d="M4.5 12.5h6.8a2.7 2.7 0 0 0 .5-5.35A4 4 0 0 0 4.3 6.4 3 3 0 0 0 4.5 12.5z"/><path d="M2.5 2.5l11 11"/>',
		key: '<circle cx="5.5" cy="10.5" r="3"/><path d="M7.6 8.4L13.5 2.5M11.5 4.5l1.6 1.6M10 6l1.2 1.2"/>',
		laptop: '<rect x="3" y="3.25" width="10" height="7" rx="1.2"/><path d="M1.5 12.75h13"/>',
		broom: '<path d="M10.5 1.8L7.6 7.2"/><path d="M5.2 7.2h5.6l1.4 7H3.8z"/><path d="M6.4 10.2v4M8 10.2v4M9.6 10.2v4"/>'
	};

	var TILES = {
		blue: ["#5AA9FF", "#2F7EF0"], grey: ["#8E8E93", "#636366"], purple: ["#B49BFF", "#8360F0"],
		orange: ["#FFA94D", "#F07F12"], cyan: ["#5ED0F5", "#1FA4D6"], green: ["#6BDDA6", "#2DB872"],
		dark: ["#4A4A4D", "#2E2E31"], magenta: ["#F06BC0", "#CF2F98"], indigo: ["#7C8CFF", "#4F5FE8"],
		yellow: ["#FFD25C", "#F2AE12"], teal: ["#5FD3C7", "#1FAE9F"], red: ["#FF7A7A", "#E5484D"]
	};

	var MARK = "M136.236384,259.751092 C136.222025,206.68225 248.484288,129.019969 410.305916,70.1516247 C572.127544,11.2832803 743.45648,-14.2207732 828.576849,7.88774474 C913.697219,29.9962627 891.541097,94.2453291 774.486384,164.741092 C757.896384,174.731092 743.796384,197.231092 743.796384,216.601092 L743.796384,304.251092 C743.810742,357.319933 631.54848,434.982215 469.726851,493.850559 C307.905223,552.718903 136.576288,578.222957 51.4559182,556.114439 C-33.6644514,534.005921 -11.5083293,469.756855 105.546384,399.261092 C122.136384,389.271092 136.236384,366.771092 136.236384,347.401092 L136.236384,259.751092 Z";

	var APPLE = '<svg class="lv-apple" viewBox="0 0 14 17" aria-hidden="true"><path fill="currentColor" d="M11.6 9c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.8-3.2.8-.7 0-1.7-.8-2.8-.7C3 4.3 1.7 5.1 1 6.4c-1.5 2.6-.4 6.4 1.1 8.5.7 1 1.5 2.2 2.6 2.1 1-.04 1.4-.7 2.7-.7 1.2 0 1.6.7 2.7.7 1.1 0 1.8-1 2.5-2.1.8-1.2 1.1-2.3 1.2-2.4-.03 0-2.2-.8-2.2-3.5zM9.5 2.8c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.5 1.3-.5.6-1 1.6-.9 2.6 1 .1 1.9-.5 2.5-1.2z"/></svg>';

	var LANG = (navigator.languages && navigator.languages[0]) || navigator.language || "en-NZ";
	var REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
	var num1 = safeFormat({ maximumFractionDigits: 1 });
	var num0 = safeFormat({ maximumFractionDigits: 0 });

	function safeFormat(opts) {
		try { return new Intl.NumberFormat(LANG, opts); } catch (e) { return new Intl.NumberFormat("en-NZ", opts); }
	}
	function gb(v) {
		var r = Math.round(v * 10) / 10;
		return (Math.abs(r) >= 100 ? num0.format(Math.round(r)) : num1.format(r)) + " GB";
	}
	function pct(v) { return num0.format(Math.round(v)) + " %"; }
	function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
	function fill(t, vars) { return t.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; }); }

	function icon(name, size, cls) {
		return '<svg class="lv-i' + (cls ? " " + cls : "") + '" width="' + size + '" height="' + size + '" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + "</svg>";
	}
	function tile(color, name, size) {
		var c = TILES[color] || TILES.grey;
		return '<span class="lv-tile' + (size ? " lv-tile-" + size : "") + '" style="--t1:' + c[0] + ";--t2:" + c[1] + '">' + icon(name, size === "lg" ? 16 : 12) + "</span>";
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
	function fmt(opts) {
		try { return new Intl.DateTimeFormat(LANG, opts); } catch (e) { return new Intl.DateTimeFormat("en-NZ", opts); }
	}
	var fDay = fmt({ weekday: "short", day: "numeric", month: "short" });
	var fTime = fmt({ hour: "numeric", minute: "2-digit" });
	var fLong = fmt({ weekday: "long", day: "numeric", month: "long" });

	// State.
	var S, root, pop, note, scene, timers = [], inView = false, played = false, toastTimer = null;

	function fresh() {
		var d = JSON.parse(JSON.stringify(LEVO_DEMO));
		d.findings.forEach(function (f) { f.items.forEach(function (it) { it.on = !!f.smart; }); });
		return {
			disk: d.disk, mem: d.memory, cpu: d.cpu, gpu: d.gpu,
			findings: d.findings, procs: d.processes,
			sort: "cpu", sel: { type: "finding", id: d.findings[0].id },
			open: {}, info: {}, select: "Smartly",
			freeShown: d.disk.free, alerted: false, popOpen: false, quit: false,
			panel: null, sheet: false, menu: false, undo: null, agent: S ? S.agent : d.agent,
			cleanedNote: null
		};
	}

	// Derived numbers.
	function readyGB() { return S.findings.reduce(function (a, f) { return a + f.items.reduce(function (b, it) { return b + it.gb; }, 0); }, 0); }
	function tickedGB() { return S.findings.reduce(function (a, f) { return a + f.items.reduce(function (b, it) { return b + (it.on ? it.gb : 0); }, 0); }, 0); }
	function tickedCount() { return S.findings.reduce(function (a, f) { return a + f.items.filter(function (it) { return it.on; }).length; }, 0); }
	function fState(f) {
		var n = f.items.filter(function (it) { return it.on; }).length;
		return n === 0 ? "off" : n === f.items.length ? "on" : "mixed";
	}
	function fSize(f) { return f.items.reduce(function (a, it) { return a + it.gb; }, 0); }
	function usedGB() { return S.disk.used.reduce(function (a, u) { return a + u.gb; }, 0); }
	function memUsed() { return S.mem.other + S.procs.reduce(function (a, p) { return a + p.mem; }, 0); }
	function cpuPct() { return (S.cpu.other + S.procs.reduce(function (a, p) { return a + p.cpu; }, 0)) / S.cpu.cores; }
	function gpuPct() { return S.gpu.other + S.procs.reduce(function (a, p) { return a + p.gpu; }, 0); }
	function low() { return S.disk.free < S.disk.alert; }
	function find(id) { return S.findings.filter(function (f) { return f.id === id; })[0]; }
	function proc(id) { return S.procs.filter(function (p) { return p.id === id; })[0]; }

	// ---------------------------------------------------------------- Markup

	function sceneHTML() {
		return '' +
		'<div class="lv-scene" data-mode="desk" role="region" aria-label="Levo, running on a Mac">' +
			'<div class="lv-wall" data-act="desk"></div>' +
			'<div class="lv-menubar">' +
				'<div class="lv-mb-left">' + APPLE + '<b>' + esc(LEVO_DEMO.app) + '</b>' +
					LEVO_DEMO.menus.map(function (m) { return '<span class="lv-mb-menu">' + m + "</span>"; }).join("") +
				'</div>' +
				'<div class="lv-mb-right">' +
					'<button type="button" class="lv-mb-levo" data-act="toggle" aria-label="Levo" aria-expanded="false">' + mark("lv-mb-mark") + '<span class="lv-mb-num" data-mbnum></span></button>' +
					'<span class="lv-mb-item" aria-hidden="true"><svg class="lv-wifi" viewBox="0 0 18 13"><path d="M1.2 4.6a11.2 11.2 0 0 1 15.6 0M3.8 7.2a7.5 7.5 0 0 1 10.4 0M6.4 9.8a3.8 3.8 0 0 1 5.2 0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="9" cy="11.8" r="1.1" fill="currentColor"/></svg></span>' +
					'<span class="lv-mb-item lv-mb-batt" data-batt aria-hidden="true"><span class="lv-mb-pct" data-battpct></span><span class="lv-batt"><i data-battfill></i><svg class="lv-batt-bolt" viewBox="0 0 16 16" hidden data-battbolt><path d="M8.8 1.8L4 9h3.6l-.8 5.2L11.6 7H8z" fill="currentColor"/></svg></span></span>' +
					'<span class="lv-mb-item lv-mb-clock"><span class="lv-mb-day" data-day></span><span data-time></span></span>' +
				'</div>' +
			'</div>' +
			'<div class="lv-widgets" aria-hidden="true">' +
				'<div class="lv-widget lv-w-clock"><span class="lv-w-city" data-city></span><span class="lv-w-time" data-wtime></span><span class="lv-w-date" data-wdate></span></div>' +
				'<div class="lv-widget lv-w-batt"><span class="lv-w-ring" data-ring><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" class="lv-ring-bg"/><circle cx="32" cy="32" r="27" class="lv-ring-fg" data-ringfg/></svg><span class="lv-w-ringglyph" data-ringglyph></span></span><span class="lv-w-dev" data-dev></span><span class="lv-w-level" data-level></span></div>' +
			'</div>' +
			'<button type="button" class="lv-note" data-act="note" aria-live="polite">' +
				'<img class="lv-note-icon" src="img/icon-96.png" width="38" height="38" alt="">' +
				'<span class="lv-note-text"><span class="lv-note-top"><b data-ntitle></b><span class="lv-note-when">now</span></span><span data-nbody></span></span>' +
			'</button>' +
			'<div class="lv-popwrap">' + popHTML() + '</div>' +
		'</div>';
	}

	function gaugeHTML(id, label) {
		var lines = "";
		for (var i = 0; i < 26; i++) {
			var a = (135 + i * 10.8) * Math.PI / 180;
			var c = Math.cos(a), s = Math.sin(a);
			lines += '<line x1="' + (23 + 16.5 * c).toFixed(2) + '" y1="' + (23 + 16.5 * s).toFixed(2) + '" x2="' + (23 + 22 * c).toFixed(2) + '" y2="' + (23 + 22 * s).toFixed(2) + '"/>';
		}
		return '<div class="lv-gauge" data-gauge="' + id + '">' +
			'<div class="lv-dial"><svg viewBox="0 0 46 46" aria-hidden="true">' + lines + '</svg><span class="lv-dial-num"><span data-gnum></span><small>%</small></span></div>' +
			'<span class="lv-g-label">' + label + '</span><span class="lv-g-sub" data-gsub></span></div>';
	}

	function popHTML() {
		var ticks = "";
		for (var i = 0; i < 40; i++) ticks += '<i class="lv-tick" data-i="' + i + '"></i>';
		return '' +
		'<div class="lv-pop" role="dialog" aria-label="Levo" tabindex="-1">' +
			'<div class="lv-scroll">' +
				'<section class="lv-disk">' +
					'<div class="lv-dhead">' + icon("drive", 16, "lv-sec") + '<b>' + esc(S.disk.name) + '</b><span class="lv-sec lv-num">' + gb(S.disk.total) + '</span><span class="lv-flex"></span><span class="lv-alert"><i></i><span data-alert></span></span></div>' +
					'<div class="lv-hero"><span class="lv-free lv-num" data-free></span><span class="lv-sec">free</span><span class="lv-flex"></span><span class="lv-tag" data-today></span></div>' +
					'<div class="lv-dbar" data-dbar><div class="lv-ticks">' + ticks + '</div><i class="lv-thr" data-thr></i><span class="lv-tip" data-tip hidden></span></div>' +
					'<div class="lv-legend"><span><i class="lv-sw lv-sw-used"></i>Used <b class="lv-num" data-lused></b></span><span><i class="lv-sw lv-sw-ready"></i>Ready <b class="lv-num" data-lready></b></span><span><i class="lv-sw lv-sw-free"></i>Free <b class="lv-num" data-lfree></b></span></div>' +
				'</section>' +
				'<div class="lv-sep"></div>' +
				'<section class="lv-gauges">' + gaugeHTML("memory", "Memory") + gaugeHTML("cpu", "CPU") + gaugeHTML("gpu", "GPU") + '</section>' +
				'<div class="lv-sep"></div>' +
				'<div class="lv-sh"><span>Ready to free</span><span class="lv-sh-r"><span class="lv-num" data-ready></span><button type="button" class="lv-dd" data-act="smartmenu" aria-haspopup="menu"><span data-selectlabel>Smartly</span>' + icon("chevDown", 12, "lv-sec") + '</button></span></div>' +
				'<div class="lv-list" data-findings></div>' +
				'<div class="lv-sh"><span>Processes</span><span class="lv-seg" role="tablist">' +
					['memory', 'cpu', 'gpu'].map(function (k) { return '<button type="button" role="tab" data-act="sort" data-sort="' + k + '">' + (k === "memory" ? "Memory" : k.toUpperCase()) + '</button>'; }).join("") +
				'</span></div>' +
				'<div class="lv-list" data-procs></div>' +
				'<div style="height:8px"></div>' +
			'</div>' +
			'<div class="lv-actions">' +
				'<div class="lv-act-left" data-actleft></div>' +
				'<div class="lv-act-right"><button type="button" class="lv-primary" data-act="primary"><span data-plabel></span>' + caps(["↵"]) + '</button><span class="lv-bsep"></span>' +
				'<button type="button" class="lv-kbtn" data-act="panel" aria-label="Actions">' + icon("switch2", 15, "lv-sec") + caps(["⌘", "K"]) + '</button></div>' +
			'</div>' +
			'<div class="lv-panel" data-panel hidden></div>' +
			'<div class="lv-menu" data-smart hidden></div>' +
			'<div class="lv-sheet" data-sheet hidden></div>' +
		'</div>';
	}

	// ---------------------------------------------------------------- Render

	function $(sel, el) { return (el || root).querySelector(sel); }
	function $$(sel, el) { return Array.prototype.slice.call((el || root).querySelectorAll(sel)); }

	function render() {
		renderDisk(S.freeShown);
		renderBar();
		renderGauges();
		renderFindings();
		renderProcs();
		renderActions();
		renderMenubar();
	}

	function renderDisk(free) {
		$("[data-alert]").textContent = "Alert " + gb(S.disk.alert);
		$("[data-free]").textContent = gb(free);
		var t = $("[data-today]");
		var today = S.disk.today;
		t.textContent = (today > 0 ? "+" : "−") + gb(Math.abs(today)) + " today";
		t.className = "lv-tag " + (today > 0 ? "lv-tag-green" : low() ? "lv-tag-orange" : "");
		$("[data-lused]").textContent = gb(usedGB());
		$("[data-lready]").textContent = gb(readyGB());
		$("[data-lfree]").textContent = gb(free);
		$("[data-ready]").textContent = gb(readyGB());
		$(".lv-sw-free").classList.toggle("is-low", low());
	}

	// One tick is a fortieth of the disk. Each takes the colour of whatever fills it.
	function segments() {
		var segs = S.disk.used.map(function (u) { return { id: u.id, label: u.label, gb: u.gb, kind: "used", color: TILES[u.color][0] }; });
		var ready = readyGB();
		if (ready > 0) segs.push({ id: "ready", label: "Ready to free", gb: ready, kind: "ready" });
		segs.push({ id: "free", label: "Free", gb: Math.max(0, S.disk.total - usedGB() - ready), kind: "free" });
		var at = 0;
		segs.forEach(function (s) { s.from = at; at += s.gb; s.to = at; });
		return segs;
	}
	function segColor(s) {
		if (s.kind === "used") return s.color;
		if (s.kind === "ready") return "var(--lv-ready)";
		return low() ? "var(--lv-free-low)" : "var(--lv-free)";
	}
	function renderBar(stagger) {
		var segs = segments(), per = S.disk.total / 40;
		$$(".lv-tick").forEach(function (el, i) {
			var a = i * per, b = a + per, parts = [];
			segs.forEach(function (s) {
				var o = Math.min(b, s.to) - Math.max(a, s.from);
				if (o > 0.001) parts.push({ s: s, f: o / per });
			});
			var main = parts.slice().sort(function (x, y) { return y.f - x.f; })[0].s;
			var last = parts[parts.length - 1].s;
			el.dataset.seg = main.id;
			el.dataset.kind = last.kind === "free" && parts.length === 1 ? "free" : main.kind;
			el.classList.toggle("is-low", last.kind === "free" && low());
			var bg;
			if (parts.length === 1) bg = main.kind === "free" ? "" : segColor(main);
			else {
				var p = 0, stops = [];
				parts.forEach(function (x) { var c = segColor(x.s); stops.push(c + " " + (p * 100).toFixed(1) + "%", c + " " + ((p + x.f) * 100).toFixed(1) + "%"); p += x.f; });
				bg = "linear-gradient(90deg," + stops.join(",") + ")";
			}
			el.style.transitionDelay = stagger ? ((i - 30) * 45) + "ms" : "0ms";
			if (bg.indexOf("gradient") >= 0) { el.style.backgroundColor = ""; el.style.backgroundImage = bg; }
			else { el.style.backgroundImage = "none"; el.style.backgroundColor = bg; }
		});
		$("[data-thr]").style.left = ((S.disk.total - S.disk.alert) / S.disk.total * 100) + "%";
	}

	function setGauge(id, value, sub, warn) {
		var g = $('[data-gauge="' + id + '"]');
		var on = Math.round(Math.max(0, Math.min(100, value)) / 100 * 26);
		var hot = value >= warn;
		$$("line", g).forEach(function (l, i) { l.setAttribute("class", i < on ? (hot ? "on hot" : "on") : ""); });
		$("[data-gnum]", g).textContent = num0.format(Math.round(value));
		$("[data-gsub]", g).textContent = sub;
	}
	function renderGauges() {
		var mu = memUsed(), g = gpuPct();
		setGauge("memory", mu / S.mem.total * 100, num1.format(Math.round(mu * 10) / 10) + " of " + num0.format(S.mem.total) + " GB", S.mem.warn);
		setGauge("cpu", cpuPct(), S.cpu.cores + " cores", S.cpu.warn);
		setGauge("gpu", g, g < 20 ? "Idle" : "In use", S.gpu.warn);
	}

	function checkbox(state, act, id, item) {
		return '<button type="button" class="lv-cb" role="checkbox" aria-checked="' + (state === "on" ? "true" : state === "mixed" ? "mixed" : "false") + '" data-act="' + act + '" data-id="' + id + '"' + (item != null ? ' data-item="' + item + '"' : "") + ' aria-label="Tick">' +
			(state === "on" ? icon("check", 12) : state === "mixed" ? icon("dash", 12) : "") + "</button>";
	}

	function renderFindings() {
		var el = $("[data-findings]");
		if (!S.findings.length) {
			el.innerHTML = '<div class="lv-empty">' + icon("checkCircle", 16) + "<span>Nothing to free</span></div>";
			return;
		}
		el.innerHTML = S.findings.map(function (f) {
			var sel = S.sel && S.sel.type === "finding" && S.sel.id === f.id;
			var st = fState(f), size = fSize(f);
			var h = '<div class="lv-row lv-frow' + (sel ? " is-sel" : "") + (S.open[f.id] ? " is-open" : "") + '" data-act="frow" data-id="' + f.id + '">' +
				checkbox(st, "tick", f.id) + tile(f.tile, f.icon) +
				'<span class="lv-title">' + esc(f.title) + '</span><span class="lv-subt">' + f.items.length + (f.items.length === 1 ? " item" : " items") + '</span><span class="lv-flex"></span>' +
				(f.tag ? '<span class="lv-tag lv-tag-yellow">' + f.tag + "</span>" : "") +
				'<span class="lv-size lv-num">' + gb(size) + '</span>' +
				'<button type="button" class="lv-info' + (S.info[f.id] ? " is-on" : "") + '" data-act="info" data-id="' + f.id + '" aria-label="Info">' + icon("info", 14) + "</button>" +
			"</div>";
			if (S.open[f.id]) {
				h += '<div class="lv-items">' + f.items.map(function (it, i) {
					return '<div class="lv-row lv-irow" data-act="titem" data-id="' + f.id + '" data-item="' + i + '">' + checkbox(it.on ? "on" : "off", "titem", f.id, i) +
						'<span class="lv-iname">' + esc(it.name) + '</span><span class="lv-flex"></span><span class="lv-size lv-num">' + gb(it.gb) + "</span></div>";
				}).join("") + "</div>";
			}
			if (S.info[f.id]) {
				h += '<div class="lv-detail"><div class="lv-detail-h">' + esc(f.title) + "</div>" +
					detailRow("Location", esc(f.location)) +
					detailRow("Last used", esc(f.lastUsed)) +
					detailRow("Checked by", esc(S.agent)) +
					detailRow("Verdict", '<span class="' + (f.good ? "lv-good" : "lv-warn") + '">' + esc(f.verdict) + "</span>") +
				"</div>";
			}
			return h;
		}).join("");
	}
	function detailRow(k, v) { return '<div class="lv-drow"><span>' + k + "</span><span>" + v + "</span></div>"; }

	function renderProcs() {
		var key = S.sort === "memory" ? "mem" : S.sort;
		var list = S.procs.slice().sort(function (a, b) { return b[key] - a[key]; }).slice(0, 4);
		$$("[data-sort]").forEach(function (b) { var on = b.dataset.sort === S.sort; b.classList.toggle("is-on", on); b.setAttribute("aria-selected", on); });
		$("[data-procs]").innerHTML = list.map(function (p) {
			var sel = S.sel && S.sel.type === "proc" && S.sel.id === p.id;
			var v = key === "mem" ? gb(p.mem) : pct(p[key]);
			var tag = "";
			if (p.verdict === "Quit") tag = '<button type="button" class="lv-tag lv-tag-red" data-act="quit" data-id="' + p.id + '">Quit</button>';
			else if (p.verdict) tag = '<span class="lv-tag">' + p.verdict + "</span>";
			return '<div class="lv-row lv-prow' + (sel ? " is-sel" : "") + '" data-act="prow" data-id="' + p.id + '">' + tile(p.tile, p.icon) +
				'<span class="lv-title">' + esc(p.name) + "</span>" + (p.note ? '<span class="lv-note-red">' + esc(p.note) + "</span>" : "") +
				'<span class="lv-flex"></span>' + tag + '<span class="lv-size lv-num lv-pval">' + v + "</span></div>";
		}).join("");
	}

	function primary() {
		if (S.sel && S.sel.type === "proc") {
			var p = proc(S.sel.id);
			if (p) return p.system ? { label: "System process", act: null } : { label: "Quit " + p.name, act: "quitSel" };
		}
		var t = tickedGB();
		return t > 0 ? { label: "Clean " + gb(t), act: "clean" } : { label: "Clean", act: null };
	}
	function renderActions() {
		var p = primary(), btn = $('[data-act="primary"]');
		$("[data-plabel]").textContent = p.label;
		btn.disabled = !p.act;
		if (!toastTimer && !S.undo) $("[data-actleft]").innerHTML = mark("lv-act-mark") + "<span>Levo</span>";
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

	// ---------------------------------------------------------------- Desktop, from the browser

	function tickClock() {
		var now = new Date();
		var day = fDay.format(now).replace(/,/g, "");
		var time = fTime.format(now);
		$("[data-day]").textContent = day;
		$("[data-time]").textContent = time;
		$("[data-wtime]").textContent = time;
		$("[data-wdate]").textContent = fLong.format(now);
	}
	function battery() {
		var dev = deviceFamily();
		$("[data-dev]").textContent = dev;
		var show = function (level, charging) {
			var pc = Math.round(level * 100);
			$("[data-battfill]").style.width = Math.max(8, pc) + "%";
			$("[data-battpct]").textContent = pc + " %";
			$("[data-battbolt]").hidden = !charging;
			$("[data-level]").textContent = pc + " %";
			$("[data-ringfg]").style.strokeDashoffset = (169.6 * (1 - level)).toFixed(1);
			$("[data-ringglyph]").innerHTML = charging ? icon("bolt", 18) : "";
		};
		$("[data-battfill]").style.width = "78%";
		$("[data-ringfg]").style.strokeDashoffset = "0";
		$("[data-ringglyph]").innerHTML = icon("laptop", 20);
		if (navigator.getBattery) {
			navigator.getBattery().then(function (b) {
				var up = function () { show(b.level, b.charging); };
				up();
				b.addEventListener("levelchange", up);
				b.addEventListener("chargingchange", up);
			}, function () {});
		}
	}

	// ---------------------------------------------------------------- Layout

	var DESK_W = 1200, COMPACT_W = 400;
	function layout() {
		var w = root.clientWidth;
		if (!w) return;
		var compact = w < 760;
		scene.dataset.mode = compact ? "compact" : "desk";
		var z = compact ? Math.min(1.15, w / COMPACT_W) : Math.min(1, w / DESK_W);
		scene.style.zoom = z;
		if (!compact) {
			var b = $(".lv-mb-levo"), wrap = $(".lv-popwrap");
			var cx = b.offsetLeft + b.offsetWidth / 2;
			wrap.style.left = Math.max(12, Math.min(DESK_W - 372, cx - 180)) + "px";
		} else {
			$(".lv-popwrap").style.left = "";
		}
	}

	// ---------------------------------------------------------------- Actions

	function later(fn, ms) { var t = setTimeout(fn, REDUCED ? Math.min(ms, 300) : ms); timers.push(t); return t; }

	function showNote(title, body, ms) {
		$("[data-ntitle]").textContent = title;
		$("[data-nbody]").textContent = body;
		note.classList.add("is-in");
		if (ms) later(hideNote, ms);
	}
	function hideNote() { note.classList.remove("is-in"); }

	function start() {
		if (played) return;
		played = true;
		later(function () {
			S.alerted = true;
			renderMenubar();
			layout();
			if (!S.popOpen) showNote(fill(LEVO_DEMO.notification.title, { alert: gb(S.disk.alert) }), fill(LEVO_DEMO.notification.body, { ready: gb(readyGB()) }));
			later(function () { if (!S.touched) openPop(); }, LEVO_DEMO.timing.teaser);
		}, LEVO_DEMO.timing.notify);
	}

	function openPop() {
		if (S.popOpen) return;
		S.popOpen = true;
		S.alerted = true;
		hideNote();
		scene.classList.add("is-open");
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
		$("[data-smart]").hidden = true;
		$("[data-sheet]").hidden = true;
		pop.classList.remove("has-sheet");
	}

	function toast(kind, title, action) {
		clearTimeout(toastTimer);
		var el = $("[data-actleft]");
		el.innerHTML = '<span class="lv-toast lv-toast-' + kind + '"><i class="lv-toast-dot"></i><b>' + esc(title) + "</b>" +
			(action ? '<button type="button" class="lv-toast-btn" data-act="' + action.act + '">' + action.label + "</button>" : "") + "</span>";
		toastTimer = setTimeout(function () { toastTimer = null; S.undo = null; renderActions(); }, action ? 9000 : 2600);
	}

	function tick(id, item) {
		var f = find(id);
		if (!f) return;
		if (item != null) f.items[item].on = !f.items[item].on;
		else { var on = fState(f) !== "on"; f.items.forEach(function (it) { it.on = on; }); }
		S.select = "Custom";
		$("[data-selectlabel]").textContent = "Custom";
		renderFindings(); renderActions();
	}

	function selectAll(mode) {
		S.findings.forEach(function (f) { f.items.forEach(function (it) { it.on = mode === "All" ? true : mode === "None" ? false : !!f.smart; }); });
		S.select = mode;
		$("[data-selectlabel]").textContent = mode;
		renderFindings(); renderActions();
	}

	function askClean() {
		if (tickedGB() <= 0) return;
		closeOverlays();
		var groups = S.findings.filter(function (f) { return fState(f) !== "off"; }).length;
		var n = tickedCount();
		var sh = $("[data-sheet]");
		sh.innerHTML = '<div class="lv-sheet-card" role="alertdialog" aria-label="Clean">' +
			'<img src="img/icon-96.png" width="44" height="44" alt="">' +
			"<b>Clean " + gb(tickedGB()) + "?</b>" +
			"<p>" + n + (n === 1 ? " item" : " items") + " in " + groups + (groups === 1 ? " group" : " groups") + ". Anything that can’t be rebuilt goes to the Trash.</p>" +
			'<div class="lv-sheet-btns"><button type="button" class="lv-btn" data-act="cancel">Cancel</button><button type="button" class="lv-btn lv-btn-primary" data-act="confirm">Clean</button></div>' +
		"</div>";
		sh.hidden = false;
		S.sheet = true;
		pop.classList.add("has-sheet");
		setTimeout(function () { var c = $('[data-act="confirm"]', sh); if (c && inView) c.focus({ preventScroll: true }); }, 30);
	}

	function snapshot() { return JSON.stringify({ disk: S.disk, findings: S.findings, procs: S.procs, freeShown: S.freeShown, select: S.select }); }
	function restore(snap) {
		var o = JSON.parse(snap);
		S.disk = o.disk; S.findings = o.findings; S.procs = o.procs; S.freeShown = o.freeShown; S.select = o.select;
		$("[data-selectlabel]").textContent = S.select;
		S.cleanedNote = null;
		renderBar(true);
		render();
	}

	function clean() {
		closeOverlays();
		var freed = tickedGB();
		if (freed <= 0) return;
		S.undo = snapshot();
		var rows = $$(".lv-frow").filter(function (r) { var f = find(r.dataset.id); return f && fState(f) === "on"; });
		rows.forEach(function (r) { r.classList.add("is-going"); });
		$$(".lv-items, .lv-detail").forEach(function (r) { r.classList.add("is-going"); });
		later(function () {
			var from = S.disk.free;
			S.findings.forEach(function (f) { f.items = f.items.filter(function (it) { return !it.on; }); });
			S.findings = S.findings.filter(function (f) { return f.items.length; });
			S.open = {}; S.info = {};
			S.disk.free = Math.round((from + freed) * 10) / 10;
			S.disk.today = Math.round((S.disk.today + freed) * 10) / 10;
			S.sel = S.findings[0] ? { type: "finding", id: S.findings[0].id } : null;
			renderFindings();
			renderBar(true);
			countFree(from, S.disk.free);
			renderActions();
			renderMenubar();
			toast("good", "Freed " + gb(freed), { act: "undo", label: "Undo" });
			S.cleanedNote = [fill(LEVO_DEMO.cleaned.title, { freed: gb(freed) }), fill(LEVO_DEMO.cleaned.body, { free: gb(S.disk.free), disk: S.disk.name })];
		}, 380);
	}

	function countFree(from, to) {
		var t0 = performance.now(), dur = REDUCED ? 1 : 1100;
		var step = function (t) {
			var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
			S.freeShown = from + (to - from) * e;
			renderDisk(Math.round(S.freeShown * 10) / 10);
			if (k < 1) requestAnimationFrame(step);
			else { S.freeShown = to; renderDisk(to); }
		};
		requestAnimationFrame(step);
	}

	function quit(id) {
		var p = proc(id);
		if (!p || p.system) return;
		closeOverlays();
		S.undo = snapshot();
		var row = $('.lv-prow[data-id="' + id + '"]');
		if (row) row.classList.add("is-going");
		later(function () {
			S.procs = S.procs.filter(function (x) { return x.id !== id; });
			if (S.sel && S.sel.id === id) S.sel = S.findings[0] ? { type: "finding", id: S.findings[0].id } : null;
			renderProcs(); renderGauges(); renderActions();
			S.undo = null;
			toast("good", "Quit " + p.name);
		}, 320);
	}

	// The ⌘K panel.
	function panelItems() {
		var sel = S.sel, items = [], title;
		if (sel && sel.type === "proc" && proc(sel.id)) {
			var p = proc(sel.id);
			title = p.name;
			if (!p.system) {
				items.push({ icon: "xCircle", label: "Quit " + p.name, keys: ["↵"], run: function () { quit(p.id); } });
				items.push({ icon: "xCircle", label: "Force Quit", keys: ["⌥", "⌘", "Q"], red: true, run: function () { quit(p.id); } });
			}
			items.push({ icon: "pin", label: "Always Keep", keys: ["⌘", "D"], run: function () { p.verdict = "Keep"; renderProcs(); toast("info", "Keeping " + p.name); } });
			items.push({ icon: "speed", label: "Show in Activity Monitor", keys: ["⌘", "↵"], run: function () { toast("info", "Opens Activity Monitor"); } });
		} else {
			var f = sel && find(sel.id);
			title = f ? f.title : "Levo";
			if (tickedGB() > 0) items.push({ icon: "trash", label: "Clean " + gb(tickedGB()), keys: ["↵"], run: askClean });
			if (f) {
				items.push({ icon: "folder", label: "Show in Finder", keys: ["⌘", "↵"], run: function () { toast("info", "Opens " + f.location); } });
				items.push({ icon: "pin", label: "Always Keep", keys: ["⌘", "D"], run: function () { keep(f.id); } });
			}
		}
		items.push(null);
		items.push({ icon: "checkCircle", label: "Select", sub: true, run: function () { S.panel = "select"; drawPanel(); } });
		items.push({ icon: "refresh", label: "Analyse Now", keys: ["⌘", "R"], run: analyse });
		items.push({ icon: "pause", label: "Pause Alerts for 1 Hour", keys: ["⌘", "P"], run: function () { toast("info", "Alerts paused for 1 hour"); } });
		items.push(null);
		items.push({ icon: "gear", label: "Settings…", keys: ["⌘", ","], run: function () { closePop(); var s = document.getElementById("settings"); if (s) s.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" }); } });
		items.push({ icon: "power", label: "Quit Levo", keys: ["⌘", "Q"], run: quitLevo });
		return { title: title, items: items };
	}
	function selectItems() {
		return { title: "Select", back: true, items: ["Smartly", "All", "None"].map(function (m) {
			return { icon: S.select === m ? "check" : null, label: m, run: function () { selectAll(m); } };
		}) };
	}
	var panelAt = 0, panelList = [];
	function drawPanel(filter) {
		var el = $("[data-panel]");
		var data = S.panel === "select" ? selectItems() : panelItems();
		var q = (filter || "").toLowerCase();
		var list = data.items.filter(function (it) { return !q || (it && it.label.toLowerCase().indexOf(q) >= 0); });
		while (list.length && list[0] === null) list.shift();
		panelList = list.filter(Boolean);
		panelAt = Math.min(panelAt, Math.max(0, panelList.length - 1));
		var n = -1;
		el.innerHTML = '<div class="lv-ph">' + (data.back ? '<button type="button" class="lv-back" data-act="pback" aria-label="Back">' + icon("chevLeft", 12) + "</button>" : "") + esc(data.title) + "</div>" +
			'<div class="lv-pitems" role="menu">' + list.map(function (it) {
				if (!it) return '<div class="lv-psep"></div>';
				n++;
				return '<button type="button" role="menuitem" class="lv-pitem' + (n === panelAt ? " is-sel" : "") + (it.red ? " is-red" : "") + '" data-act="pitem" data-n="' + n + '">' +
					'<span class="lv-pi-icon">' + (it.icon ? icon(it.icon, 16) : "") + "</span><span>" + esc(it.label) + '</span><span class="lv-flex"></span>' +
					(it.sub ? icon("chevRight", 12, "lv-sec") : it.keys ? caps(it.keys, "lv-cap-sm") : "") + "</button>";
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
		S.menu = false; $("[data-smart]").hidden = true;
		S.panel = "main"; panelAt = 0;
		drawPanel();
	}
	function runPanel(i) {
		var it = panelList[i];
		if (!it) return;
		if (it.sub) { it.run(); return; }
		S.panel = null; $("[data-panel]").hidden = true;
		it.run();
	}

	function keep(id) {
		S.undo = snapshot();
		var f = find(id);
		S.findings = S.findings.filter(function (x) { return x.id !== id; });
		S.sel = S.findings[0] ? { type: "finding", id: S.findings[0].id } : null;
		render();
		toast("info", "Keeping " + f.title, { act: "undo", label: "Undo" });
	}
	function analyse() {
		var el = $("[data-actleft]");
		clearTimeout(toastTimer);
		toastTimer = 1;
		el.innerHTML = '<span class="lv-toast lv-toast-busy"><i class="lv-spin"></i><b>Asking ' + esc(S.agent) + "…</b></span>";
		later(function () { toastTimer = null; toast("good", "Up to date"); }, 1600);
	}
	function quitLevo() {
		closePop();
		var b = $(".lv-mb-levo");
		b.classList.add("is-gone");
		later(function () { b.classList.remove("is-gone"); }, 1800);
	}

	function smartMenu() {
		var el = $("[data-smart]");
		if (S.menu) { S.menu = false; el.hidden = true; return; }
		S.panel = null; $("[data-panel]").hidden = true;
		S.menu = true;
		var btn = $('[data-act="smartmenu"]');
		el.style.top = (btn.offsetTop + btn.offsetHeight + 4 - $(".lv-scroll").scrollTop) + "px";
		el.innerHTML = ["Smartly", "All", "None"].map(function (m) {
			return '<button type="button" class="lv-mitem" data-act="smartpick" data-mode="' + m + '"><span class="lv-mcheck">' + (S.select === m ? icon("check", 12) : "") + "</span>" + m + "</button>";
		}).join("");
		el.hidden = false;
	}

	// ---------------------------------------------------------------- Events

	function onClick(e) {
		var t = e.target.closest("[data-act]");
		if (!t || !root.contains(t)) return;
		var act = t.dataset.act, id = t.dataset.id;
		S.touched = true;
		if (act !== "panel" && act !== "pitem" && act !== "pback" && S.panel && !t.closest("[data-panel]")) { S.panel = null; $("[data-panel]").hidden = true; if (act === "frow" || act === "prow") return; }
		if (act !== "smartmenu" && act !== "smartpick" && S.menu) { S.menu = false; $("[data-smart]").hidden = true; }
		switch (act) {
			case "toggle": S.popOpen ? closePop() : openPop(); break;
			case "note": openPop(); break;
			case "desk": closePop(); break;
			case "tick": e.stopPropagation(); tick(id); break;
			case "titem": e.stopPropagation(); tick(id, +t.dataset.item); break;
			case "info": e.stopPropagation(); S.info[id] = !S.info[id]; S.sel = { type: "finding", id: id }; renderFindings(); renderActions(); break;
			case "frow":
				var was = S.sel && S.sel.id === id && S.sel.type === "finding";
				S.sel = { type: "finding", id: id };
				if (was || !S.open[id]) S.open[id] = !S.open[id];
				renderFindings(); renderProcs(); renderActions(); break;
			case "prow": S.sel = { type: "proc", id: id }; renderFindings(); renderProcs(); renderActions(); break;
			case "quit": e.stopPropagation(); quit(id); break;
			case "sort": S.sort = t.dataset.sort; renderProcs(); break;
			case "primary": var p = primary(); if (p.act === "clean") askClean(); else if (p.act === "quitSel") quit(S.sel.id); break;
			case "panel": togglePanel(); break;
			case "pitem": runPanel(+t.dataset.n); break;
			case "pback": S.panel = "main"; panelAt = 0; drawPanel(); break;
			case "smartmenu": smartMenu(); break;
			case "smartpick": S.menu = false; $("[data-smart]").hidden = true; selectAll(t.dataset.mode); break;
			case "cancel": closeOverlays(); break;
			case "confirm": clean(); break;
			case "undo": clearTimeout(toastTimer); toastTimer = null; if (S.undo) { var u = S.undo; S.undo = null; restore(u); toast("info", "Undone"); } break;
		}
	}

	function onKey(e) {
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
		if (S.sheet && k === "Enter") { e.preventDefault(); clean(); return; }
		var focusIn = root.contains(document.activeElement) || document.activeElement === document.body;
		if (k === "Enter" && focusIn && !S.sheet && !mod) {
			var a = document.activeElement;
			if (a && a !== document.body && a.matches("button") && !a.matches('[data-act="primary"]')) return;
			e.preventDefault();
			var p = primary();
			if (p.act === "clean") askClean(); else if (p.act === "quitSel") quit(S.sel.id);
		}
	}

	function onHoverBar(e) {
		var tk = e.target.closest(".lv-tick"), tip = $("[data-tip]");
		if (!tk) { tip.hidden = true; $$(".lv-tick").forEach(function (x) { x.classList.remove("is-dim"); }); return; }
		var id = tk.dataset.seg, s = segments().filter(function (x) { return x.id === id; })[0];
		if (!s) return;
		$$(".lv-tick").forEach(function (x) { x.classList.toggle("is-dim", x.dataset.seg !== id); });
		tip.textContent = s.label + "  " + gb(s.gb);
		tip.hidden = false;
		var bar = $("[data-dbar]");
		var x = tk.offsetLeft + tk.offsetWidth / 2;
		tip.style.left = Math.max(tip.offsetWidth / 2, Math.min(bar.offsetWidth - tip.offsetWidth / 2, x)) + "px";
	}

	// ---------------------------------------------------------------- Public

	function mount(el) {
		root = el;
		S = fresh();
		root.innerHTML = sceneHTML();
		scene = $(".lv-scene");
		pop = $(".lv-pop");
		note = $(".lv-note");
		$("[data-city]").textContent = city() || "Local time";
		tickClock();
		setInterval(tickClock, 1000);
		battery();
		render();
		layout();
		root.addEventListener("click", onClick);
		document.addEventListener("keydown", onKey);
		var bar = $("[data-dbar]");
		bar.addEventListener("mousemove", onHoverBar);
		bar.addEventListener("mouseleave", function () { onHoverBar({ target: bar }); });
		if (window.ResizeObserver) new ResizeObserver(layout).observe(root);
		else window.addEventListener("resize", layout);
		if (window.IntersectionObserver) {
			new IntersectionObserver(function (es) {
				es.forEach(function (en) { inView = en.isIntersecting; if (inView) start(); });
			}, { threshold: 0.25 }).observe(root);
		} else { inView = true; start(); }
		// Scrolling is waiting too: the popover opens as a teaser.
		var onScroll = function () {
			if (window.scrollY > 40 && played && !S.popOpen && !S.touched) { openPop(); window.removeEventListener("scroll", onScroll); }
		};
		window.addEventListener("scroll", onScroll, { passive: true });
	}

	window.LevoDemo = {
		data: LEVO_DEMO,
		icons: ICONS,
		icon: icon,
		tile: tile,
		mark: mark,
		mount: mount,
		open: function () { S.touched = true; openPop(); },
		setAlert: function (v) { S.disk.alert = v; render(); },
		setAgent: function (name) { S.agent = name; renderFindings(); }
	};
})();
