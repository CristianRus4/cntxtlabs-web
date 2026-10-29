/*
 * Levo demo: the menubar menus. The Apple menu, Finder and its menus, Wi-Fi,
 * Battery and the clock open macOS 26 menus inside the scene, with a few small jokes.
 *
 * demo.js renders the menubar (buttons with data-menu) and calls
 * LevoMenus.attach({ scene, hooks }). Every hook is optional:
 *   battery()      -> { level: 0..1, charging } or null
 *   device()       -> "Mac", "iMac", "Mac mini"...
 *   disk()         -> { name, total, free } in GB, live
 *   closeLevo()    -> closes Levo's popover (called when a menu opens)
 *   openLevo()     -> opens Levo's popover
 *   emptyTrash()   -> empties the Trash tile; true if there was something in it
 *   revealGroup(id)-> opens the popover on a cleanup group ("xcode", "sims"...)
 *   symbol(n, px)  -> inline SVG of an SF Symbol
 *   lock()         -> shows the demo's lock screen (else the screen dims)
 *   levoIcon       -> URL of Levo's app icon (default img/icon-96.png)
 *
 *   theme()        -> "auto" | "light" | "dark";  setTheme(mode) switches it
 *
 * Desktop windows: LevoMenus.window(kind, opts) with kind "finder", "textedit",
 * "custom" or "settings" returns the window element; closeWindow(id); windows()
 * lists open ids, frontmost first. LevoMenus.content holds the desktop files' text.
 *
 * While a menu is open the scene has data-menu="open". Events on the scene:
 * lvm:open and lvm:close ({ menu }), lvm:wifi ({ on }),
 * lvm:window ({ id, kind, action: "open" | "focus" | "close", reason }).
 * Everything is positioned in design px (offsetLeft/offsetTop), so CSS zoom is fine.
 */
(function () {
	"use strict";

	var LANG = (navigator.languages && navigator.languages[0]) || navigator.language || "en-NZ";
	var SUB_DELAY = 150;
	function REDUCED() { return !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); }
	var ORDER = "⌃⌥⇧⌘";

	// Placeholders on a 16 grid, used only until demo.js passes hooks.symbol.
	var FALLBACK = {
		"wifi": '<path d="M1.6 6.2a9 9 0 0 1 12.8 0M4 8.7a5.6 5.6 0 0 1 8 0"/><path d="M8 13.4L5.9 11.2a3 3 0 0 1 4.2 0z" fill="currentColor"/>',
		"lock.fill": '<rect x="3.5" y="7" width="9" height="7" rx="1.6" fill="currentColor" stroke="none"/><path d="M5.6 7V5.3a2.4 2.4 0 0 1 4.8 0V7"/>',
		"checkmark": '<path d="M3.2 8.6l3 3 6.6-7.2" stroke-width="1.9"/>',
		"chevron.right": '<path d="M6 3.5L10.5 8 6 12.5" stroke-width="1.8"/>',
		"chevron.left": '<path d="M10 3.5L5.5 8l4.5 4.5" stroke-width="1.8"/>',
		"magnifyingglass": '<circle cx="7" cy="7" r="4.6"/><path d="M10.4 10.4L14 14"/>',
		"bolt.fill": '<path d="M9 1.5L3.8 9h3.7l-.7 5.5L12.2 7H8.4z" fill="currentColor" stroke="none"/>',
		"battery.100percent": '<rect x="1.5" y="4.5" width="11.5" height="7" rx="2"/><rect x="3" y="6" width="8.5" height="4" rx=".8" fill="currentColor" stroke="none"/><path d="M14.6 7v2"/>',
		"laptopcomputer": '<rect x="3" y="3" width="10" height="7.5" rx="1"/><path d="M1 12.75h14"/>',
		"desktopcomputer": '<rect x="1.5" y="2" width="13" height="9" rx="1.2"/><path d="M6.5 11v2.5h3V11M5 13.75h6"/>',
		"macmini.fill": '<rect x="1.5" y="6" width="13" height="4.5" rx="1.4"/><path d="M4 10.5v1M12 10.5v1"/>',
		"calendar": '<rect x="2" y="3" width="12" height="11" rx="2"/><path d="M2 6.5h12M5 1.8v2.4M11 1.8v2.4"/>',
		"folder": '<path d="M1.75 4.5a1 1 0 0 1 1-1h3.4l1.5 1.5h5.6a1 1 0 0 1 1 1v6.25a1 1 0 0 1-1 1H2.75a1 1 0 0 1-1-1z"/>',
		"folder.fill": '<path d="M1.75 4.5a1 1 0 0 1 1-1h3.4l1.5 1.5h5.6a1 1 0 0 1 1 1v6.25a1 1 0 0 1-1 1H2.75a1 1 0 0 1-1-1z" fill="currentColor"/>',
		"globe": '<circle cx="8" cy="8" r="6"/><ellipse cx="8" cy="8" rx="2.6" ry="6"/><path d="M2 8h12"/>',
		"hammer.fill": '<path d="M9 2.6l4.4 4.4-1.6 1.6-1.3-1.3-5.9 5.9a1.15 1.15 0 0 1-1.6-1.6l5.9-5.9L7.6 4.4z"/>',
		"iphone": '<rect x="4.25" y="1.75" width="7.5" height="12.5" rx="2"/><path d="M7 12h2"/>',
		"app.dashed": '<rect x="2.5" y="2.5" width="11" height="11" rx="3"/>',
		"trash": '<path d="M2.8 4.5h10.4M6.4 4.5V2.8h3.2v1.7M4.3 4.5l.7 9h6l.7-9"/>',
		"doc.text.fill": '<path d="M4 1.75h5l3 3v9.5H4z"/><path d="M9 1.75v3h3M6 8.5h4M6 11h4"/>',
		"xmark": '<path d="M4.5 4.5l7 7M11.5 4.5l-7 7" stroke-width="2"/>',
		"minus": '<path d="M4 8h8" stroke-width="2"/>',
		"plus": '<path d="M8 3.5v9M3.5 8h9" stroke-width="2"/>',
		"bluetooth": '<path d="M4.6 5.2l6.4 5.6L8 13.4V2.6l3 2.6-6.4 5.6"/>',
		"moon.fill": '<path d="M13 9.6A5.6 5.6 0 0 1 6.4 3a5.6 5.6 0 1 0 6.6 6.6z" fill="currentColor"/>',
		"circle.lefthalf.filled": '<circle cx="8" cy="8" r="5.8"/><path d="M8 2.2a5.8 5.8 0 0 0 0 11.6z" fill="currentColor"/>',
		"sun.max.fill": '<circle cx="8" cy="8" r="2.8" fill="currentColor"/><path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1"/>',
		"speaker.wave.2.fill": '<path d="M2.5 6h2.2L8 3.2v9.6L4.7 10H2.5z" fill="currentColor"/><path d="M10.4 5.8a3 3 0 0 1 0 4.4M12.2 4a5.6 5.6 0 0 1 0 8"/>',
		"dot.radiowaves.left.and.right": '<circle cx="8" cy="8" r="1.4" fill="currentColor"/><path d="M5.4 5.4a3.7 3.7 0 0 0 0 5.2M10.6 5.4a3.7 3.7 0 0 1 0 5.2M3.4 3.4a6.5 6.5 0 0 0 0 9.2M12.6 3.4a6.5 6.5 0 0 1 0 9.2"/>',
		"internaldrive": '<rect x="1.75" y="4.25" width="12.5" height="7.5" rx="2"/><path d="M4 8h4.5"/><circle cx="11.5" cy="8" r=".6" fill="currentColor"/>',
		"gearshape.fill": '<circle cx="8" cy="8" r="4.1"/><circle cx="8" cy="8" r="1.6"/>',
		"clock.arrow.circlepath": '<circle cx="8" cy="8" r="5.8"/><path d="M8 4.8V8l2.2 1.4"/>',
		"arrow.down.circle.fill": '<circle cx="8" cy="8" r="5.8"/><path d="M8 4.8v6M5.6 8.6L8 11l2.4-2.4"/>',
		"dock.rectangle": '<rect x="1.75" y="2.75" width="12.5" height="10.5" rx="2"/><path d="M4.5 10.5h7"/>',
		"bell.fill": '<path d="M4 11V7.4a4 4 0 0 1 8 0V11l1.2 1.2H2.8z" fill="currentColor"/><path d="M6.6 13.6a1.5 1.5 0 0 0 2.8 0"/>',
		"hand.raised": '<path d="M5 8.5V4a1 1 0 0 1 2 0v3.5V3a1 1 0 0 1 2 0v4.5V4a1 1 0 0 1 2 0v6a4 4 0 0 1-8 0V8a1 1 0 0 1 2 0z"/>',
		"person.crop.circle": '<circle cx="8" cy="8" r="6"/><circle cx="8" cy="6.6" r="2"/><path d="M4.4 12.2c.8-1.5 2-2.2 3.6-2.2s2.8.7 3.6 2.2"/>',
		"photo.fill": '<rect x="1.75" y="3" width="12.5" height="10" rx="2"/><path d="M2.5 12l3.5-4 3 3 2-2 2.5 3"/>',
		"switch.2": '<path d="M7.2 5H14M2 11h6.8"/><circle cx="4.6" cy="5" r="2.3"/><circle cx="11.4" cy="11" r="2.3"/>',
		"chevron.up.chevron.down": '<path d="M5 6.2L8 3.5l3 2.7M5 9.8l3 2.7 3-2.7"/>',
		"airplayaudio": '<path d="M4.3 12.2a5.8 5.8 0 1 1 7.4 0"/><path d="M8 9.8l3 3.7H5z" fill="currentColor"/>',
		"square.grid.2x2": '<rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1"/><rect x="9" y="2.5" width="4.5" height="4.5" rx="1"/><rect x="2.5" y="9" width="4.5" height="4.5" rx="1"/><rect x="9" y="9" width="4.5" height="4.5" rx="1"/>'
	};

	var DEVICES = {
		mac: { sym: "laptopcomputer", name: "MacBook Pro", sub: "14-inch, 2024" },
		imac: { sym: "desktopcomputer", name: "iMac", sub: "24-inch, 2024" },
		mini: { sym: "macmini.fill", name: "Mac mini", sub: "2024" }
	};

	var FOLDERS = [
		"~/Desktop", "~/Documents", "~/Downloads", "~/Movies", "~/Music", "~/Pictures", "~/Public",
		"~/Developer", "~/Developer/.worktrees", "~/Developer/Levo",
		"~/Library", "~/Library/Application Support", "~/Library/Caches", "~/Library/Caches/Homebrew",
		"~/Library/Caches/com.apple.Safari", "~/Library/Containers", "~/Library/Developer",
		"~/Library/Developer/CoreSimulator", "~/Library/Developer/CoreSimulator/Devices",
		"~/Library/Developer/Xcode", "~/Library/Developer/Xcode/Archives", "~/Library/Developer/Xcode/DerivedData",
		"~/Library/Logs", "~/Library/Preferences",
		"/Applications", "/Library", "/System", "/Users", "/Volumes"
	];
	var RECENT_FOLDERS = ["~/Downloads", "~/Developer", "~/Library/Caches"];
	var TERRITORY = [
		["~/library/developer/xcode/deriveddata", "xcode"],
		["~/library/developer/coresimulator", "sims"],
		["~/developer/.worktrees", "worktrees"],
		["~/library/caches", "packages"]
	];

	var TOPICS = [
		{ label: "Levo", levo: true, words: ["levo", "disk", "clean", "space", "memory", "storage", "full", "cpu", "gpu", "ram", "free up"] },
		{ label: "Free up storage space on Mac", words: ["storage", "space", "disk", "free", "full"] },
		{ label: "Empty the Trash on Mac", words: ["trash", "empty", "bin", "delete"] },
		{ label: "Force an app to quit on Mac", words: ["force", "quit", "frozen", "stuck", "hang"] },
		{ label: "Connect to the internet with Wi-Fi", words: ["wi-fi", "wifi", "network", "internet"] },
		{ label: "Check your Mac notebook's battery", words: ["battery", "power", "charge", "charging"] },
		{ label: "Go to a folder by typing its path", words: ["folder", "path", "go to"] }
	];

	var WIFI_HOME = "Cntxt Labs";
	var WIFI_OTHER = ["Pretty Fly for a Wi-Fi", "Spark-5G-7A2C", "Tell My Wi-Fi Love Her", "Hide Yo Kids, Hide Yo Wi-Fi", "TP-Link_3F10"];

	// Running apps, shared by Force Quit and Battery. Names only, never icons.
	var APPS = [
		{ id: "finder", name: "Finder", sym: "folder.fill" },
		{ id: "chrome", name: "Google Chrome", sym: "globe", energy: true },
		{ id: "levo", name: "Levo", levo: true },
		{ id: "simulator", name: "Simulator", sym: "iphone" },
		{ id: "xcode", name: "Xcode", sym: "hammer.fill", energy: true }
	];

	var scene, hooks = {}, layer, levels = [], openId = null, openBtn = null;
	var subTimer = 0, subOwner = -1, flashTimer = 0, busy = false, swallow = false, clockTimer = 0, aboutTimer = 0;
	var wins = {}, lastWin = null, listeners = [];
	var st;

	function freshState() {
		return {
			view: "icons", sort: "none", snap: false, stacks: false, sidebar: true, preview: false,
			toolbar: true, pathbar: false, statusbar: false, wifi: true, cal: 0, reopen: true,
			bt: true, airdrop: true, focus: false, bright: 1, vol: 0.55, accent: "multi", tint: true, scroll: 0,
			running: APPS.map(function (a) { return a.id; })
		};
	}

	// ---------------------------------------------------------------- Helpers

	function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
	function hook(name) { return hooks && typeof hooks[name] === "function" ? hooks[name] : null; }
	function call(name, arg) {
		var f = hook(name);
		if (!f) return undefined;
		try { return f(arg); } catch (e) { if (window.console) console.warn("LevoMenus hook " + name, e); return undefined; }
	}
	// One name or a list of names, tried in order through hooks.symbol, then the placeholders.
	function sym(name, size, cls) {
		var names = Array.isArray(name) ? name : [name], svg = "", f = hook("symbol");
		for (var i = 0; f && i < names.length && svg.indexOf("<svg") < 0; i++) {
			try { svg = String(f(names[i], size) || ""); } catch (e) { svg = ""; }
		}
		if (svg.indexOf("<svg") < 0) {
			var fb = "";
			for (var j = 0; j < names.length && !fb; j++) fb = FALLBACK[names[j]] || "";
			svg = fb ? '<svg viewBox="0 0 16 16" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="' + (size > 40 ? 0.7 : 1.5) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + fb + "</svg>" : "";
		}
		return '<span class="lvm-sym' + (cls ? " " + cls : "") + '" aria-hidden="true">' + svg + "</span>";
	}
	function fmt(opts) {
		try { return new Intl.DateTimeFormat(LANG, opts); } catch (e) { return new Intl.DateTimeFormat("en-NZ", opts); }
	}
	function numFmt(max) {
		try { return new Intl.NumberFormat(LANG, { maximumFractionDigits: max }); } catch (e) { return new Intl.NumberFormat("en-NZ", { maximumFractionDigits: max }); }
	}
	function gb(v) { return numFmt(v < 10 ? 1 : 0).format(v) + " GB"; }
	function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
	function W() { return scene.offsetWidth || 1200; }
	function Hh() { return scene.offsetHeight || 792; }
	function offsetIn(el) {
		var x = 0, y = 0;
		while (el && el !== scene) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
		return { x: x, y: y };
	}
	function scale() {
		var w = scene.offsetWidth;
		return w ? scene.getBoundingClientRect().width / w || 1 : 1;
	}
	function fire(type, detail) {
		try { scene.dispatchEvent(new CustomEvent(type, { detail: detail })); } catch (e) {}
	}
	function disk() {
		var d = call("disk") || {};
		return { name: d.name || "Macintosh HD", total: d.total != null ? d.total : 460, free: d.free != null ? d.free : 16 };
	}
	function device() {
		var d = String(call("device") || "Mac").toLowerCase();
		if (/mini/.test(d)) return DEVICES.mini;
		if (/imac|studio|desktop/.test(d)) return DEVICES.imac;
		return DEVICES.mac;
	}
	function levoIcon(cls) {
		var src = typeof hooks.levoIcon === "string" ? hooks.levoIcon : "img/icon-96.png";
		return '<img class="' + cls + '" src="' + esc(src) + '" alt="" width="16" height="16" draggable="false">';
	}
	function running(id) { return st.running.indexOf(id) >= 0; }
	function el(tag, cls, html) {
		var e = document.createElement(tag);
		if (cls) e.className = cls;
		if (html != null) e.innerHTML = html;
		return e;
	}

	// Shortcut glyphs, modifiers in macOS order (⌃⌥⇧⌘), the key in its own column.
	function keysHTML(k) {
		if (!k) return "";
		var fn = false, mods = [], rest = k;
		if (/^fn\s*/.test(rest)) { fn = true; rest = rest.replace(/^fn\s*/, ""); }
		while (rest.length > 1 && ORDER.indexOf(rest.charAt(0)) >= 0) { mods.push(rest.charAt(0)); rest = rest.slice(1); }
		rest = rest.replace(/^\s+/, "");
		if (/^fn\s+/.test(rest)) { fn = true; rest = rest.replace(/^fn\s+/, ""); }
		mods.sort(function (a, b) { return ORDER.indexOf(a) - ORDER.indexOf(b); });
		return '<span class="lvm-keys">' + (fn ? '<span class="lvm-fn">fn</span>' : "") +
			'<span class="lvm-mods">' + mods.join("") + '</span><span class="lvm-key' + (rest.length > 1 ? " is-word" : "") + '">' + esc(rest) + "</span></span>";
	}

	// ---------------------------------------------------------------- Menu definitions

	var SEP = { sep: true };
	function D(label, keys, extra) {
		var d = { label: label, keys: keys || "" };
		if (extra) for (var k in extra) d[k] = extra[k];
		return d;
	}
	function off(label, keys, extra) { var d = D(label, keys, extra); d.disabled = true; return d; }
	function radio(key, val, label, keys) {
		return D(label, keys, { checked: st[key] === val, act: function () { st[key] = val; } });
	}
	function toggle(key, on, offLabel, keys) {
		return D(st[key] ? on : offLabel, keys, { act: function () { st[key] = !st[key]; } });
	}
	function check(key, label, keys) {
		return D(label, keys, { checked: st[key], act: function () { st[key] = !st[key]; } });
	}

	// macOS 26 menus show an SF Symbol beside most standard items, in a column of
	// its own after the checkmark. Each entry lists the symbol Tahoe uses first,
	// then a stand-in from img/symbols while the first isn't exported; a missing
	// symbol leaves the column empty, as Tahoe does for items without one.
	// ["flip"] mirrors the symbol (Redo is Undo's arrow, mirrored).
	var MENU_ICONS = {
		"System Settings…": ["gearshape"], "App Store…": ["app.badge"], "Recent items": ["clock", "clock.arrow.circlepath"],
		"Force quit…": ["xmark.octagon", "xmark.circle"], "Sleep": ["moon", "moon.fill"], "Restart…": ["restart", "arrow.clockwise"],
		"Shut down…": ["power"], "Lock screen": ["lock"], "Log out…": ["rectangle.portrait.and.arrow.right", "person.crop.circle"],
		"About Finder": ["info.circle"], "Settings…": ["gearshape"], "Empty Trash…": ["trash"], "Hide Finder": ["eye.slash"],
		"New Finder window": ["macwindow.badge.plus", "macwindow"], "New folder": ["folder.badge.plus", "folder"], "New tab": ["plus.square.on.square"],
		"Open": ["arrow.up.forward.app"], "Close window": ["xmark"], "Get info": ["info.circle"], "Rename": ["pencil"],
		"Compress": ["archivebox"], "Duplicate": ["plus.square.on.square"], "Quick Look": ["eye"], "Move to Trash": ["trash"],
		"Find": ["magnifyingglass"], "Tags…": ["tag"],
		"Undo": ["arrow.uturn.backward"], "Redo": ["arrow.uturn.forward", "flip:arrow.uturn.backward"], "Cut": ["scissors"],
		"Copy": ["doc.on.doc"], "Paste": ["document.on.clipboard", "doc.on.clipboard"], "Select all": ["checkmark.circle"],
		"Start dictation…": ["mic"], "Emoji & symbols": ["face.smiling"],
		"as icons": ["square.grid.2x2"], "as list": ["list.bullet"], "as columns": ["rectangle.split.3x1"], "as gallery": ["rectangle.grid.1x2"],
		"Show sidebar": ["sidebar.left"], "Hide sidebar": ["sidebar.left"], "Enter full screen": ["arrow.up.left.and.arrow.down.right"],
		"Back": ["chevron.left"], "Forward": ["chevron.right"], "Enclosing folder": ["arrow.up.left"],
		"Recents": ["clock", "clock.arrow.circlepath"], "Documents": ["doc"], "Desktop": ["menubar.dock.rectangle", "dock.rectangle"],
		"Downloads": ["arrow.down.circle"], "Home": ["house"], "Computer": ["desktopcomputer"], "AirDrop": ["dot.radiowaves.left.and.right"],
		"Network": ["network", "globe"], "iCloud Drive": ["icloud"], "Applications": ["square.grid.2x2"], "Utilities": ["hammer", "hammer.fill"],
		"Go to folder…": ["folder"], "Connect to server…": ["server.rack"],
		"Minimise": ["minus.rectangle", "minus"], "Bring all to front": ["macwindow.on.rectangle", "macwindow"]
	};
	function menuIcon(label) {
		var list = MENU_ICONS[label];
		if (!list) return "";
		var html = "";
		for (var i = 0; i < list.length && html.indexOf("<svg") < 0; i++) {
			var flip = list[i].indexOf("flip:") === 0;
			html = sym(flip ? list[i].slice(5) : list[i], 13, "lvm-mi" + (flip ? " is-flip" : ""));
		}
		return html.indexOf("<svg") < 0 ? "" : html;
	}

	var MENUS = {
		apple: function () {
			return [
				D("About this Mac", "", { act: openAbout }),
				SEP,
				D("System Settings…", "", { act: function () { openWindow("settings", { id: "settings" }); } }),
				D("App Store…"),
				SEP,
				D("Recent items", "", { sub: recentItems }),
				SEP,
				D("Force quit…", "⌥⌘⎋", { act: openForceQuit }),
				SEP,
				D("Sleep", "", { act: function () { blackout(); } }),
				D("Restart…", "", { act: function () { power("restart"); } }),
				D("Shut down…", "", { act: function () { power("shutdown"); } }),
				SEP,
				D("Lock screen", "⌃⌘Q", { act: function () { if (hook("lock")) call("lock"); else dim(); } }),
				D("Log out…", "⇧⌘Q", { act: function () { power("logout"); } })
			];
		},
		app: function () {
			return [
				D("About Finder"),
				SEP,
				D("Settings…", "⌘,"),
				SEP,
				D("Empty Trash…", "⇧⌘⌫", { act: askEmptyTrash }),
				SEP,
				D("Services", "", { sub: function () { return [off("No services apply"), D("Services settings…")]; } }),
				SEP,
				D("Hide Finder", "⌘H"),
				D("Hide others", "⌥⌘H"),
				off("Show all")
			];
		},
		file: function () {
			return [
				D("New Finder window", "⌘N"),
				D("New folder", "⇧⌘N"),
				off("New folder with selection", "⌃⌘N"),
				D("New smart folder", "⌥⌘N"),
				D("New tab", "⌘T"),
				off("Open", "⌘O"),
				off("Open with", "", { sub: function () { return []; } }),
				D("Close window", "⌘W"),
				SEP,
				D("Get info", "⌘I"),
				off("Rename"),
				off("Compress"),
				off("Duplicate", "⌘D"),
				off("Make alias", "⌃⌘A"),
				off("Quick Look", "⌘Y"),
				SEP,
				off("Move to Trash", "⌘⌫"),
				SEP,
				D("Find", "⌘F"),
				D("Tags…")
			];
		},
		edit: function () {
			return [
				off("Undo", "⌘Z"),
				off("Redo", "⇧⌘Z"),
				SEP,
				off("Cut", "⌘X"),
				off("Copy", "⌘C"),
				off("Paste", "⌘V"),
				D("Select all", "⌘A"),
				SEP,
				D("Show clipboard"),
				SEP,
				D("Start dictation…"),
				D("Emoji & symbols", "fn E")
			];
		},
		view: function () {
			return [
				radio("view", "icons", "as icons", "⌘1"),
				radio("view", "list", "as list", "⌘2"),
				radio("view", "columns", "as columns", "⌘3"),
				radio("view", "gallery", "as gallery", "⌘4"),
				SEP,
				check("stacks", "Use stacks", "⌃⌘0"),
				D("Sort by", "", { sub: sortBy }),
				D("Clean up"),
				SEP,
				toggle("sidebar", "Hide sidebar", "Show sidebar", "⌃⌘S"),
				toggle("preview", "Hide preview", "Show preview", "⇧⌘P"),
				SEP,
				toggle("toolbar", "Hide toolbar", "Show toolbar", "⌥⌘T"),
				toggle("pathbar", "Hide path bar", "Show path bar", "⌥⌘P"),
				toggle("statusbar", "Hide status bar", "Show status bar", "⌘/"),
				SEP,
				D("Enter full screen", "⌃⌘F")
			];
		},
		go: function () {
			return [
				off("Back", "⌘["),
				off("Forward", "⌘]"),
				off("Enclosing folder", "⌘↑"),
				SEP,
				D("Recents", "⇧⌘F"),
				D("Documents", "⇧⌘O"),
				D("Desktop", "⇧⌘D"),
				D("Downloads", "⌥⌘L"),
				D("Home", "⇧⌘H"),
				D("Computer", "⇧⌘C"),
				D("AirDrop", "⇧⌘R"),
				D("Network", "⇧⌘K"),
				D("iCloud Drive", "⇧⌘I"),
				D("Applications", "⇧⌘A"),
				D("Utilities", "⇧⌘U"),
				SEP,
				D("Recent folders", "", { sub: function () {
					return [D("Downloads"), D("Developer"), D("Caches"), SEP, D("Clear menu")];
				} }),
				SEP,
				D("Go to folder…", "⇧⌘G", { act: openGoTo }),
				D("Connect to server…", "⌘K")
			];
		},
		window: function () {
			return [
				off("Minimise", "⌘M"),
				off("Zoom"),
				off("Move & resize", "", { sub: function () { return []; } }),
				off("Fill", "fn⌃F"),
				off("Center"),
				SEP,
				D("Cycle through windows", "⌘`"),
				SEP,
				D("Bring all to front")
			];
		},
		help: helpMenu,
		wifi: wifiMenu,
		battery: batteryMenu,
		clock: clockMenu,
		control: controlMenu
	};
	var NAMES = { apple: "Apple", app: "Finder", file: "File", edit: "Edit", view: "View", go: "Go", window: "Window", help: "Help" };
	var SOFT = { wifi: 1, battery: 1, clock: 1, control: 1 };

	function recentItems() {
		return [
			{ header: "Applications" }, D("Xcode"), D("Terminal"), D("System Settings"),
			{ header: "Documents" }, D("Project Plan.pages"), D("Invoice 0412.pdf"), D("Screenshot 2026-10-28 at 9.41.12 am.png"),
			SEP, D("Clear menu")
		];
	}
	function sortBy() {
		return [
			radio("sort", "none", "None", "⌃⌥⌘0"),
			check("snap", "Snap to grid"),
			SEP,
			radio("sort", "name", "Name", "⌃⌥⌘1"),
			radio("sort", "kind", "Kind", "⌃⌥⌘2"),
			radio("sort", "opened", "Date last opened", "⌃⌥⌘3"),
			radio("sort", "added", "Date added", "⌃⌥⌘4"),
			radio("sort", "modified", "Date modified", "⌃⌥⌘5"),
			radio("sort", "created", "Date created"),
			radio("sort", "size", "Size", "⌃⌥⌘6"),
			radio("sort", "tags", "Tags", "⌃⌥⌘7")
		];
	}

	// Help: a search field over the menu definitions above, as macOS does.
	function helpMenu() {
		return {
			head: '<div class="lvm-hsearch"><span>Search</span><label class="lvm-field">' + sym("magnifyingglass", 12, "lvm-field-glass") +
				'<input type="text" data-lvm-help spellcheck="false" autocomplete="off" aria-label="Search help"></label></div>',
			defs: helpDefs("")
		};
	}
	function helpDefs(q) {
		var d = [];
		q = q.replace(/^\s+|\s+$/g, "").toLowerCase();
		if (q) {
			var hits = [];
			["app", "file", "edit", "view", "go", "window", "apple"].forEach(function (id) {
				walk(MENUS[id](), NAMES[id] === "Apple" ? "Apple menu" : NAMES[id]);
			});
			function walk(defs, path) {
				defs.forEach(function (x) {
					if (!x.label) return;
					if (x.label.toLowerCase().indexOf(q) >= 0 && !x.sub) hits.push({ def: x, path: path });
					if (x.sub && !x.disabled) walk(x.sub(), path + " › " + x.label);
				});
			}
			var topics = TOPICS.filter(function (t) {
				return t.label.toLowerCase().indexOf(q) >= 0 || (q.length > 1 && t.words.some(function (w) { return w.indexOf(q) === 0 || q.indexOf(w) === 0; }));
			});
			if (hits.length) {
				d.push({ header: "Menu items" });
				hits.slice(0, 6).forEach(function (h) {
					d.push({ label: h.def.label, disabled: h.def.disabled, after: '<span class="lvm-path">' + esc(h.path) + "</span>", act: h.def.act });
				});
			}
			if (topics.length) {
				d.push({ header: "Help topics" });
				topics.slice(0, 4).forEach(function (t) {
					d.push(t.levo
						? { label: "Levo", icon: levoIcon("lvm-levo-icon"), levo: true, act: function () { call("openLevo"); } }
						: { label: t.label, icon: sym("doc.text.fill", 13, "lvm-ic") });
				});
			}
			if (!hits.length && !topics.length) d.push({ block: '<div class="lvm-none">No results</div>' });
			d.push(SEP);
		}
		d.push(D("macOS Help"), D("Tips for your Mac"), D("New to Mac"), D("See what’s new in macOS Tahoe"));
		return d;
	}

	// Wi-Fi, macOS 26 style: switch, known network, other networks.
	function wifiMenu() {
		var on = st.wifi;
		var d = [{
			html: '<span class="lvm-label lvm-bold">Wi-Fi</span><span class="lvm-switch' + (on ? " is-on" : "") + '" role="switch" aria-checked="' + on + '"><i></i></span>',
			keep: true, cls: "lvm-row-head", act: toggleWifi
		}];
		d.push(SEP, { header: "Known network", dim: !on });
		d.push({ html: net(WIFI_HOME, true), cls: "lvm-net", disabled: !on });
		d.push({ header: "Other networks", dim: !on });
		WIFI_OTHER.forEach(function (n) { d.push({ html: net(n, false), cls: "lvm-net", disabled: !on }); });
		d.push(SEP, D("Other…", "", { disabled: !on }), D("Wi-Fi settings…"));
		return { defs: d };
	}
	function net(name, home) {
		return '<span class="lvm-net-ic' + (home ? " is-on" : "") + '">' + sym("wifi", 13) + '</span><span class="lvm-label' + (home ? " lvm-bold" : "") + '">' + esc(name) + "</span>" + sym("lock.fill", 11, "lvm-net-lock");
	}
	function toggleWifi() {
		st.wifi = !st.wifi;
		fire("lvm:wifi", { on: st.wifi });
	}

	function batteryMenu() {
		var b = call("battery");
		var lvl = b && typeof b.level === "number" ? numFmt(0).format(Math.round(b.level * 100)) + " %" : "";
		var src = !b || b.charging ? "Power adapter" : "Battery";
		var d = [
			{ block: '<div class="lvm-row-title"><b>Battery</b>' + (lvl ? '<span class="lvm-sec lvm-num">' + lvl + "</span>" : "") + "</div>" +
				'<div class="lvm-row-note">Power source: ' + src + "</div>" }
		];
		d.push(SEP, { header: "Using significant energy" });
		var hungry = APPS.filter(function (a) { return a.energy && running(a.id); });
		if (hungry.length) hungry.forEach(function (a) { d.push({ label: a.name, icon: '<span class="lvm-app">' + sym(a.sym, 12) + "</span>" }); });
		else d.push({ block: '<div class="lvm-none">No apps using significant energy</div>' });
		d.push(SEP, D("Battery settings…"));
		return { defs: d };
	}

	// The clock: date, time and this month, in the visitor's locale.
	function clockMenu() {
		return { defs: [{ block: '<div class="lvm-clock" data-lvm-clock></div>' }, SEP, D("Date & time settings…")], after: drawClock };
	}
	function firstDay() {
		try {
			var loc = new Intl.Locale(LANG);
			var wi = loc.getWeekInfo ? loc.getWeekInfo() : loc.weekInfo;
			if (wi && wi.firstDay) return wi.firstDay % 7;
		} catch (e) {}
		return /-(US|CA|JP|BR|MX|IL|PH|KR|TW|HK|IN|ZA)$/i.test(LANG) || LANG === "en" ? 0 : 1;
	}
	function drawClock() {
		var box = layer && layer.querySelector("[data-lvm-clock]");
		if (!box) return;
		var now = new Date();
		var first = firstDay();
		var view = new Date(now.getFullYear(), now.getMonth() + st.cal, 1);
		var start = new Date(view);
		start.setDate(1 - ((view.getDay() - first + 7) % 7));
		var narrow = fmt({ weekday: "narrow" });
		var heads = "";
		for (var i = 0; i < 7; i++) heads += "<span>" + esc(narrow.format(new Date(2026, 1, 1 + ((first + i) % 7)))) + "</span>";
		var days = "";
		for (var j = 0; j < 42; j++) {
			var dt = new Date(start.getFullYear(), start.getMonth(), start.getDate() + j);
			var isToday = dt.toDateString() === now.toDateString();
			days += '<span class="' + (dt.getMonth() !== view.getMonth() ? "is-out" : "") + (isToday ? " is-today" : "") + '">' + dt.getDate() + "</span>";
		}
		box.innerHTML =
			'<div class="lvm-clock-date">' + esc(fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now)) + "</div>" +
			'<div class="lvm-clock-time">' + esc(fmt({ hour: "numeric", minute: "2-digit" }).format(now)) + "</div>" +
			'<div class="lvm-cal"><div class="lvm-cal-head"><b>' + esc(fmt({ month: "long", year: "numeric" }).format(view)) + "</b>" +
				'<span class="lvm-cal-nav"><button type="button" data-lvm-cal="-1" aria-label="Previous month">' + sym("chevron.left", 10) + '</button>' +
				'<button type="button" data-lvm-cal="0" aria-label="Today" class="lvm-cal-dot"><i></i></button>' +
				'<button type="button" data-lvm-cal="1" aria-label="Next month">' + sym("chevron.right", 10) + "</button></span></div>" +
				'<div class="lvm-cal-grid lvm-cal-wd">' + heads + '</div><div class="lvm-cal-grid">' + days + "</div></div>";
	}

	// ---------------------------------------------------------------- Rendering menus

	function itemHTML(d, i, soft) {
		var cls = "lvm-item" + (d.disabled ? " is-off" : "") + (d.sub ? " lvm-has-sub" : "") + (d.cls ? " " + d.cls : "") + (d.levo ? " lvm-levo" : "");
		var inner;
		if (d.html) inner = d.html;
		else {
			inner = (soft ? "" : '<span class="lvm-check">' + (d.checked ? sym("checkmark", 11) : "") + "</span>") +
				(d.icon || (soft ? "" : '<span class="lvm-mic">' + menuIcon(d.label) + "</span>")) +
				'<span class="lvm-label">' + esc(d.label) + "</span>" +
				(d.after || "") +
				(d.sub ? sym("chevron.right", 10, "lvm-chev") : keysHTML(d.keys));
		}
		return '<div class="' + cls + '" role="menuitem" data-i="' + i + '"' + (d.disabled ? ' aria-disabled="true"' : "") + ">" + inner + "</div>";
	}
	function fillLevel(L, defs) {
		L.defs = defs;
		var html = "", n = 0, items = [];
		defs.forEach(function (d) {
			if (d.sep) html += '<div class="lvm-sep" role="separator"></div>';
			else if (d.header) html += '<div class="lvm-head' + (d.dim ? " is-off" : "") + '">' + esc(d.header) + "</div>";
			else if (d.block) html += '<div class="lvm-block">' + d.block + "</div>";
			else { html += itemHTML(d, n, L.soft); items.push(d); n++; }
		});
		L.body.innerHTML = html;
		L.items = items.map(function (d, i) { return { def: d, el: L.body.querySelector('[data-i="' + i + '"]') }; });
		L.hi = -1;
	}
	function makeLevel(spec, opts) {
		var s = Array.isArray(spec) ? { defs: spec } : spec;
		var m = el("div", "lvm-menu" + (opts.soft ? " lvm-soft" : "") + (opts.id ? " lvm-m-" + opts.id : "") + (opts.instant ? " is-instant" : ""));
		m.setAttribute("role", "menu");
		if (s.head) m.appendChild(el("div", "lvm-mhead", s.head));
		var body = el("div", "lvm-body");
		m.appendChild(body);
		var L = { el: m, body: body, items: [], hi: -1, soft: !!opts.soft, id: opts.id, after: s.after };
		fillLevel(L, s.defs);
		if (!L.items.length && !s.head && !s.defs.some(function (d) { return d.block; })) m.appendChild(el("div", "lvm-none lvm-empty", ""));
		layer.appendChild(m);
		m.addEventListener("pointerleave", function () {
			var idx = levels.indexOf(L);
			if (idx < 0) return;
			var child = levels[idx + 1];
			if (child && L.hi >= 0 && L.items[L.hi].def.sub) return;
			clearTimeout(subTimer);
			if (!child) setHi(L, -1);
		});
		m.addEventListener("pointerenter", function () {
			var idx = levels.indexOf(L);
			if (subOwner >= 0 && subOwner < idx) { clearTimeout(subTimer); subOwner = -1; }
			var parent = levels[idx - 1];
			if (parent && L.parentIndex != null) setHi(parent, L.parentIndex);
		});
		if (s.after) s.after(L);
		return L;
	}

	function setHi(L, i, fromKey) {
		if (L.hi >= 0 && L.items[L.hi]) L.items[L.hi].el.classList.remove("is-hi");
		L.hi = i;
		if (i >= 0 && L.items[i]) {
			var e = L.items[i].el;
			e.classList.add("is-hi");
			if (fromKey) {
				var m = L.el, top = e.offsetTop, bot = top + e.offsetHeight;
				if (top < m.scrollTop) m.scrollTop = top - 5;
				else if (bot > m.scrollTop + m.clientHeight) m.scrollTop = bot - m.clientHeight + 5;
			}
		}
	}
	function enabled(L, i) { var it = L.items[i]; return it && !it.def.disabled; }
	function moveHi(L, dir) {
		var n = L.items.length;
		if (!n) return;
		var i = L.hi;
		for (var k = 0; k < n; k++) {
			i = i < 0 ? (dir > 0 ? 0 : n - 1) : (i + dir + n) % n;
			if (enabled(L, i)) { setHi(L, i, true); return; }
		}
	}

	function buttons() {
		return Array.prototype.filter.call(scene.querySelectorAll(".lv-menubar [data-menu]"), function (b) { return b.offsetWidth > 0; });
	}
	function btnFor(id) { return scene.querySelector('.lv-menubar [data-menu="' + id + '"]'); }

	function openMenu(id, opts) {
		opts = opts || {};
		var fn = MENUS[id];
		var b = btnFor(id);
		if (!fn || !b) return;
		var switching = !!openId;
		closeMenu(true);
		ensureLayer();
		var L = makeLevel(fn(), { id: id, soft: SOFT[id], instant: switching });
		levels = [L];
		openId = id;
		openBtn = b;
		b.classList.add("lvm-on");
		b.setAttribute("aria-expanded", "true");
		scene.dataset.menu = "open";
		placeMain(L, b);
		call("closeLevo");
		if (id === "help") {
			var inp = L.el.querySelector("[data-lvm-help]");
			if (inp) { inp.addEventListener("input", onHelpInput); try { inp.focus({ preventScroll: true }); } catch (e) { inp.focus(); } }
		}
		if (id === "clock") clockTimer = setInterval(drawClock, 1000);
		if (opts.first) moveHi(L, 1);
		if (!switching) fire("lvm:open", { menu: id });
	}
	function placeMain(L, b) {
		var m = L.el, x = offsetIn(b).x;
		m.style.maxHeight = Math.max(120, Hh() - 38) + "px";
		m.style.left = clamp(x, 4, Math.max(4, W() - m.offsetWidth - 4)) + "px";
		m.style.top = "30px";
	}
	function closeMenu(silent) {
		clearTimeout(subTimer);
		clearTimeout(flashTimer);
		clearInterval(clockTimer);
		busy = false;
		var was = openId;
		levels.forEach(function (L) { L.el.remove(); });
		levels = [];
		if (openBtn) { openBtn.classList.remove("lvm-on"); openBtn.setAttribute("aria-expanded", "false"); }
		openBtn = null;
		openId = null;
		if (scene) delete scene.dataset.menu;
		if (was && !silent) fire("lvm:close", { menu: was });
	}
	function closeFrom(n) {
		while (levels.length > n) levels.pop().el.remove();
	}
	function openSub(L, i, first) {
		clearTimeout(subTimer);
		var idx = levels.indexOf(L);
		if (idx < 0) return;
		var it = L.items[i];
		if (!it || !it.def.sub || it.def.disabled) return;
		if (levels[idx + 1] && levels[idx + 1].parentIndex === i) { if (first) moveHi(levels[idx + 1], 1); return; }
		closeFrom(idx + 1);
		setHi(L, i);
		var S = makeLevel(it.def.sub(), { instant: true });
		S.parentIndex = i;
		levels.push(S);
		var pl = L.el.offsetLeft, pt = L.el.offsetTop, pw = L.el.offsetWidth, sw = S.el.offsetWidth;
		var left = pl + pw - 4;
		if (left + sw > W() - 4) left = pl - sw + 4;
		if (left < 4) left = clamp(pl + 24, 4, W() - sw - 4);
		S.el.style.maxHeight = Math.max(120, Hh() - 38) + "px";
		var top = pt + it.el.offsetTop - L.el.scrollTop - 5;
		S.el.style.left = left + "px";
		S.el.style.top = clamp(top, 30, Math.max(30, Hh() - S.el.offsetHeight - 6)) + "px";
		if (first) moveHi(S, 1);
	}

	function activate(L, i) {
		var it = L.items[i];
		if (!it || it.def.disabled || busy) return;
		var d = it.def;
		if (d.sub) { openSub(L, i, true); return; }
		if (d.keep) {
			if (d.act) d.act();
			var top = levels[0];
			if (top === L && MENUS[openId]) {
				var hi = L.hi, s = MENUS[openId]();
				fillLevel(L, s.defs || s);
				if (s.after) s.after(L);
				setHi(L, hi);
			}
			return;
		}
		busy = true;
		var e = it.el;
		e.classList.remove("is-hi");
		flashTimer = setTimeout(function () {
			e.classList.add("is-hi");
			flashTimer = setTimeout(function () {
				flashTimer = 0;
				closeMenu();
				if (d.act) d.act();
			}, 70);
		}, 60);
	}

	function onHelpInput(e) {
		var L = levels[0];
		if (!L || openId !== "help") return;
		var q = e.target.value;
		fillLevel(L, helpDefs(q));
		if (q.replace(/\s/g, "")) {
			var lv = -1;
			L.items.forEach(function (it, i) { if (it.def.levo) lv = i; });
			if (lv >= 0) setHi(L, lv); else moveHi(L, 1);
		}
	}

	// ---------------------------------------------------------------- Windows and panels

	function ensureLayer() {
		if (layer && layer.parentNode === scene) return;
		layer = el("div", "lvm-layer");
		scene.appendChild(layer);
	}
	function lights(active) {
		return '<span class="lvm-lights">' +
			'<button type="button" class="lvm-light lvm-close" data-lvm="close" aria-label="Close">' + sym("xmark", 8) + "</button>" +
			'<span class="lvm-light' + (active ? " lvm-min" : "") + '">' + (active ? sym("minus", 8) : "") + "</span>" +
			'<span class="lvm-light"></span></span>';
	}
	function makeWin(key, cls, html) {
		closeWin(key);
		ensureLayer();
		var w = el("div", "lvm-win " + cls, html);
		w.setAttribute("role", "dialog");
		w.dataset.lvmWin = key;
		layer.appendChild(w);
		wins[key] = w;
		lastWin = key;
		raise(w);
		return w;
	}
	var zTop = 1;
	function raise(w) { w.style.zIndex = ++zTop; }
	function placeCentre(w, top) {
		var s = Math.min(1, (W() - 24) / w.offsetWidth, (Hh() - 48) / w.offsetHeight);
		w.style.transformOrigin = "0 0";
		w.style.scale = s < 1 ? String(s) : "";
		w.dataset.scale = s;
		var ww = w.offsetWidth * s, wh = w.offsetHeight * s;
		w.style.left = Math.round((W() - ww) / 2) + "px";
		w.style.top = Math.round(top != null ? Math.min(top, Hh() - wh - 8) : Math.max(40, (Math.min(Hh(), 792) - wh) / 2 - 10)) + "px";
	}
	function closeWin(key) {
		var w = wins[key];
		if (!w) return;
		w.remove();
		delete wins[key];
		if (key === "about") clearInterval(aboutTimer);
		if (key === "alert" && wins.alertTimer) { clearInterval(wins.alertTimer); delete wins.alertTimer; }
		if (lastWin === key) lastWin = null;
	}

	function openAbout() {
		var dv = device();
		var w = makeWin("about", "lvm-about",
			'<div class="lvm-tb" data-lvm-drag>' + lights(false) + "</div>" +
			'<div class="lvm-about-img">' + sym(dv.sym, 104) + "</div>" +
			'<div class="lvm-about-name">' + esc(dv.name) + "</div>" +
			'<div class="lvm-about-sub">' + esc(dv.sub) + "</div>" +
			'<dl class="lvm-rows">' +
				"<dt>Chip</dt><dd>Apple M4 Pro</dd>" +
				"<dt>Memory</dt><dd>24 GB</dd>" +
				'<dt>Startup disk</dt><dd data-lvm-disk></dd>' +
				'<dt>Storage</dt><dd data-lvm-storage></dd>' +
				"<dt>Serial number</dt><dd>N0R00M4M0R3</dd>" +
				"<dt>macOS</dt><dd>Tahoe 26.1</dd>" +
			"</dl>" +
			'<button type="button" class="lvm-btn">More info…</button>');
		drawStorage();
		aboutTimer = setInterval(drawStorage, 1000);
		placeCentre(w);
	}
	function drawStorage() {
		var w = wins.about;
		if (!w) return;
		var d = disk();
		w.querySelector("[data-lvm-disk]").textContent = d.name;
		w.querySelector("[data-lvm-storage]").innerHTML = esc(gb(d.free) + " available of " + gb(d.total)) +
			(d.free >= 40 ? '<span class="lvm-wink">Suspiciously healthy.</span>' : "");
	}

	var fqSel = "finder";
	function openForceQuit() {
		if (!running(fqSel)) fqSel = st.running[0];
		var w = makeWin("fq", "lvm-fq",
			'<div class="lvm-tb" data-lvm-drag>' + lights(true) + '<span class="lvm-tb-title">Force quit applications</span></div>' +
			'<div class="lvm-fq-body"><p>If an app doesn’t respond for a while, select its name and click Force Quit.</p>' +
			'<div class="lvm-fq-list" role="listbox"></div>' +
			'<p class="lvm-fq-foot">You can open this window by pressing Command + Option + Escape.</p>' +
			'<div class="lvm-fq-btns"><button type="button" class="lvm-btn" data-lvm="fq-go"></button></div></div>');
		drawFQ();
		placeCentre(w, 90);
	}
	function drawFQ() {
		var w = wins.fq;
		if (!w) return;
		w.querySelector(".lvm-fq-list").innerHTML = APPS.filter(function (a) { return running(a.id); }).map(function (a) {
			return '<div class="lvm-fq-row' + (a.id === fqSel ? " is-sel" : "") + '" role="option" data-lvm="fq-pick" data-app="' + a.id + '">' +
				(a.levo ? levoIcon("lvm-levo-icon") : '<span class="lvm-app">' + sym(a.sym, 12) + "</span>") + "<span>" + esc(a.name) + "</span></div>";
		}).join("");
		var b = w.querySelector('[data-lvm="fq-go"]');
		var levo = fqSel === "levo";
		b.textContent = levo ? "Levo is fine." : fqSel === "finder" ? "Relaunch" : "Force quit";
		b.disabled = levo;
		b.classList.toggle("lvm-btn-primary", !levo);
	}
	function fqMove(dir) {
		var list = st.running;
		var i = list.indexOf(fqSel);
		fqSel = list[clamp(i + dir, 0, list.length - 1)];
		drawFQ();
	}
	function fqGo() {
		if (fqSel === "levo") return;
		if (fqSel === "finder") { dim(0.35, 300); return; }
		var i = st.running.indexOf(fqSel);
		st.running.splice(i, 1);
		fqSel = st.running[Math.min(i, st.running.length - 1)];
		drawFQ();
	}

	// A macOS alert: centred, app-modal inside the scene.
	function alertBox(o) {
		var shield = makeWin("alert", "lvm-shield",
			'<div class="lvm-alert" role="alertdialog" aria-label="' + esc(o.title) + '">' +
				'<div class="lvm-alert-ic">' + sym(o.sym || "exclamationmark.triangle.fill", 44) + "</div>" +
				'<b class="lvm-alert-t">' + esc(o.title) + "</b>" +
				(o.body ? '<p class="lvm-alert-b" data-lvm-ab>' + esc(o.body) + "</p>" : "") +
				(o.check ? '<label class="lvm-alert-check"><span class="lvm-cb' + (st.reopen ? " is-on" : "") + '" data-lvm="alert-check">' + sym("checkmark", 9) + "</span>" + esc(o.check) + "</label>" : "") +
				'<div class="lvm-alert-btns">' +
					(o.cancel !== false ? '<button type="button" class="lvm-btn" data-lvm="alert-no">Cancel</button>' : "") +
					'<button type="button" class="lvm-btn lvm-btn-primary" data-lvm="alert-ok">' + esc(o.ok || "OK") + "</button>" +
				"</div></div>");
		shield.style.zIndex = 900;
		wins.alertOk = o.onOk || null;
		var card = shield.firstChild;
		var s = Math.min(1, (W() - 24) / card.offsetWidth);
		if (s < 1) card.style.scale = String(s);
	}
	function alertDone(ok) {
		var fn = wins.alertOk;
		wins.alertOk = null;
		closeWin("alert");
		if (ok && fn) fn();
	}

	function askEmptyTrash() {
		alertBox({
			sym: "trash",
			title: "Are you sure you want to permanently erase the items in the Trash?",
			body: "You can’t undo this action.",
			ok: "Empty Trash",
			onOk: function () {
				var had = call("emptyTrash");
				if (had === false) setTimeout(function () {
					alertBox({ sym: "trash", title: "The Trash is already empty.", ok: "OK", cancel: false });
				}, 120);
			}
		});
	}

	var POWER = {
		restart: { t: "Are you sure you want to restart your computer now?", b: "If you do nothing, the computer will restart automatically in {n} seconds.", ok: "Restart", sym: "power" },
		shutdown: { t: "Are you sure you want to shut down your computer now?", b: "If you do nothing, the computer will shut down automatically in {n} seconds.", ok: "Shut down", sym: "power" },
		logout: { t: "Are you sure you want to quit all apps and log out now?", b: "If you do nothing, you will be logged out automatically in {n} seconds.", ok: "Log out", sym: "power" }
	};
	FALLBACK.power = '<path d="M8 2v5.2"/><path d="M4.7 4.3a5 5 0 1 0 6.6 0"/>';
	function power(kind) {
		var p = POWER[kind], n = 60;
		alertBox({ sym: p.sym, title: p.t, body: p.b.replace("{n}", n), ok: p.ok, check: "Reopen windows when logging back in", onOk: function () { if (kind === "logout") dim(); else blackout(); } });
		wins.alertTimer = setInterval(function () {
			n--;
			var b = wins.alert && wins.alert.querySelector("[data-lvm-ab]");
			if (!b) return;
			if (n <= 0) { alertDone(true); return; }
			b.textContent = p.b.replace("{n}", n);
		}, 1000);
	}

	// The screen goes dark for a moment and comes back.
	function dim(level, ms) {
		ensureLayer();
		var d = el("div", "lvm-dim");
		layer.appendChild(d);
		void d.offsetWidth;
		d.style.opacity = level || 0.94;
		setTimeout(function () { d.style.opacity = 0; setTimeout(function () { d.remove(); }, 260); }, ms || 800);
	}

	// Sleep, Restart and Shut down: the screen fades to black, stays black for two
	// seconds and comes back. With reduced motion it cuts to black and back.
	var blackTimer = 0;
	function blackout() {
		ensureLayer();
		if (layer.querySelector(".lvm-black")) return;
		var d = el("div", "lvm-dim lvm-black"), still = REDUCED();
		if (still) d.style.transition = "none";
		layer.appendChild(d);
		void d.offsetWidth;
		d.style.opacity = 1;
		clearTimeout(blackTimer);
		blackTimer = setTimeout(function () {
			d.style.opacity = 0;
			setTimeout(function () { d.remove(); }, still ? 0 : 260);
		}, (still ? 0 : 250) + 2000);
	}

	// Go to Folder: a field with suggestions from a small fake tree.
	var goSel = 0, goList = [];
	function openGoTo() {
		var w = makeWin("goto", "lvm-goto",
			'<label class="lvm-goto-field">' + sym("folder", 16, "lvm-goto-ic") +
				'<input type="text" data-lvm-goto spellcheck="false" autocomplete="off" aria-label="Go to Folder" placeholder="Go to Folder"></label>' +
			'<div class="lvm-goto-list" role="listbox"></div>');
		var inp = w.querySelector("input");
		inp.addEventListener("input", function () { goSel = 0; drawGoTo(); });
		drawGoTo();
		placeCentre(w, 96);
		try { inp.focus({ preventScroll: true }); } catch (e) { inp.focus(); }
	}
	function norm(p) {
		p = p.replace(/^\s+|\s+$/g, "").replace(/\/+$/, "");
		if (/^\/Users\/[^/]+/i.test(p)) p = "~" + p.replace(/^\/Users\/[^/]+/i, "");
		return p;
	}
	function drawGoTo(err) {
		var w = wins.goto;
		if (!w) return;
		var q = norm(w.querySelector("input").value).toLowerCase();
		if (!q) goList = RECENT_FOLDERS.slice();
		else {
			var starts = FOLDERS.filter(function (f) { return f.toLowerCase().indexOf(q) === 0; });
			var has = FOLDERS.filter(function (f) { return starts.indexOf(f) < 0 && f.toLowerCase().indexOf(q) >= 0; });
			goList = starts.concat(has).slice(0, 7);
		}
		goSel = clamp(goSel, 0, Math.max(0, goList.length - 1));
		w.querySelector(".lvm-goto-list").innerHTML = (err ? '<div class="lvm-goto-err">The folder can’t be found.</div>' : "") +
			goList.map(function (f, i) {
				return '<div class="lvm-goto-row' + (i === goSel ? " is-hi" : "") + '" role="option" data-lvm="goto-pick" data-i="' + i + '">' + sym("folder.fill", 15, "lvm-goto-f") + "<span>" + esc(f) + "</span></div>";
			}).join("");
	}
	function goTo(path) {
		var p = norm(path);
		var lower = p.toLowerCase();
		var known = !p || FOLDERS.some(function (f) { return f.toLowerCase() === lower; });
		if (!known && !/^~?\/?$/.test(p)) {
			var inTerritory = TERRITORY.some(function (t) { return lower.indexOf(t[0]) === 0; });
			if (!inTerritory) { drawGoTo(true); return; }
		}
		closeWin("goto");
		for (var i = 0; i < TERRITORY.length; i++) {
			if (lower.indexOf(TERRITORY[i][0]) === 0) { call("revealGroup", TERRITORY[i][1]); return; }
		}
	}
	function goToCurrent() {
		var w = wins.goto;
		if (!w) return;
		goTo(goList[goSel] || w.querySelector("input").value);
	}

	// ---------------------------------------------------------------- Appearance (hooks.theme / hooks.setTheme)

	function isDark() { return document.documentElement.classList.contains("dark"); }
	function curTheme() {
		var t = call("theme");
		return t === "auto" || t === "light" || t === "dark" ? t : isDark() ? "dark" : "light";
	}
	function setTheme(mode) {
		if (hook("setTheme")) call("setTheme", mode);
		else {
			var dark = mode === "dark" || (mode === "auto" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
			document.documentElement.classList.toggle("dark", dark);
		}
		refreshTheme();
	}
	function refreshTheme() {
		var t = curTheme();
		if (wlayer) Array.prototype.forEach.call(wlayer.querySelectorAll("[data-lvm-theme]"), function (c) {
			var on = c.dataset.lvmTheme === t;
			c.classList.toggle("is-on", on);
			c.setAttribute("aria-checked", on);
		});
		if (openId === "control") drawCC();
	}

	// ---------------------------------------------------------------- Control Centre

	function controlMenu() {
		return { defs: [{ block: '<div class="lvm-cc" data-lvm-ccbox></div>' }], after: drawCC };
	}
	function ccRow(key, on, label, sub, symName) {
		return '<div class="lvm-cc-row"><button type="button" class="lvm-cc-btn' + (on ? " is-on" : "") + '" data-lvm-cc="' + key + '" aria-pressed="' + on + '" aria-label="' + esc(label) + '">' + sym(symName, 14) + "</button>" +
			'<span class="lvm-cc-txt"><b>' + esc(label) + "</b><small>" + esc(sub) + "</small></span></div>";
	}
	function slider(key, symName, label) {
		var v = st[key];
		return '<div class="lvm-slider" data-lvm-slider="' + key + '" role="slider" tabindex="0" aria-label="' + label + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(v * 100) + '">' +
			'<i style="width:' + (v * 100).toFixed(1) + '%"></i>' + sym(symName, 12, "lvm-slider-ic") + "</div>";
	}
	function drawCC() {
		var box = layer && layer.querySelector("[data-lvm-ccbox]");
		if (!box) return;
		var dark = isDark(), spin = st.spin;
		st.spin = false;
		box.innerHTML =
			'<div class="lvm-cc-grid">' +
				'<div class="lvm-cc-mod lvm-cc-conn">' +
					ccRow("wifi", st.wifi, "Wi-Fi", st.wifi ? WIFI_HOME : "Off", "wifi") +
					ccRow("bt", st.bt, "Bluetooth", st.bt ? "On" : "Off", "bluetooth") +
					ccRow("airdrop", st.airdrop, "AirDrop", st.airdrop ? "Contacts only" : "Off", "dot.radiowaves.left.and.right") +
				"</div>" +
				'<div class="lvm-cc-col">' +
					'<button type="button" class="lvm-cc-mod lvm-cc-tile' + (st.focus ? " is-focus" : "") + '" data-lvm-cc="focus" aria-pressed="' + st.focus + '">' +
						'<span class="lvm-cc-btn' + (st.focus ? " is-on" : "") + '">' + sym("moon.fill", 14) + '</span><span class="lvm-cc-txt"><b>' + (st.focus ? "Do not disturb" : "Focus") + "</b>" + (st.focus ? "<small>On</small>" : "") + "</span></button>" +
					'<button type="button" class="lvm-cc-mod lvm-cc-tile" data-lvm-cc="dark" aria-pressed="' + dark + '">' +
						'<span class="lvm-cc-btn lvm-cc-dark' + (dark ? " is-on" : "") + (spin ? " is-spin" : "") + '">' + sym("circle.lefthalf.filled", 15) + '</span><span class="lvm-cc-txt"><b>Dark mode</b><small>' + (dark ? "On" : "Off") + "</small></span></button>" +
				"</div>" +
				'<div class="lvm-cc-mod lvm-cc-wide"><b>Display</b>' + slider("bright", "sun.max.fill", "Display brightness") + "</div>" +
				'<div class="lvm-cc-mod lvm-cc-wide"><b>Sound</b><div class="lvm-cc-sound">' + slider("vol", "speaker.wave.2.fill", "Volume") +
					'<span class="lvm-cc-air">' + sym("airplayaudio", 14) + "</span></div></div>" +
			"</div>";
	}
	function ccToggle(key) {
		if (key === "wifi") { toggleWifi(); drawCC(); return; }
		if (key === "dark") {
			st.spin = true;
			setTheme(isDark() ? "light" : "dark");
			return;
		}
		st[key] = !st[key];
		drawCC();
	}
	function setSlider(key, v) {
		st[key] = clamp(v, 0, 1);
		var s = layer && layer.querySelector('[data-lvm-slider="' + key + '"]');
		if (s) { s.firstChild.style.width = (st[key] * 100).toFixed(1) + "%"; s.setAttribute("aria-valuenow", Math.round(st[key] * 100)); }
		if (key === "bright") drawBright();
	}
	// The display slider really dims the screen, down to a dim glow.
	function drawBright() {
		ensureLayer();
		var b = layer.querySelector(".lvm-bright");
		if (!b) { b = el("div", "lvm-bright"); layer.appendChild(b); }
		b.style.opacity = ((1 - st.bright) * 0.72).toFixed(3);
	}
	function slideFrom(e, s) {
		var r = s.getBoundingClientRect();
		setSlider(s.dataset.lvmSlider, r.width ? (e.clientX - r.left) / r.width : 0);
	}
	function startSlide(e, s) {
		e.preventDefault();
		slideFrom(e, s);
		function mv(ev) { slideFrom(ev, s); }
		function up() { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); }
		document.addEventListener("pointermove", mv);
		document.addEventListener("pointerup", up);
	}

	// ---------------------------------------------------------------- Desktop windows (LevoMenus.window)

	var wlayer = null, gwins = {}, gOrder = [], gCount = 0, gTimer = 0, gFocus = false, ptrType = "mouse";

	function ensureWLayer() {
		if (wlayer && wlayer.parentNode === scene) return;
		wlayer = el("div", "lvm-wlayer");
		scene.appendChild(wlayer);
	}
	function wLights() {
		return '<span class="lvm-lights lvm-wlights">' +
			'<button type="button" class="lvm-light lvm-close" data-lvm-w="close" aria-label="Close">' + sym("xmark", 8) + "</button>" +
			'<button type="button" class="lvm-light lvm-min" data-lvm-w="min" aria-label="Minimise">' + sym("minus", 8) + "</button>" +
			'<button type="button" class="lvm-light lvm-zoom" data-lvm-w="zoom" aria-label="Zoom">' + sym("plus", 8) + "</button></span>";
	}
	function size(v) {
		if (typeof v === "string") return v;
		if (typeof v !== "number" || !(v >= 0)) return "";
		if (v >= 1) return gb(v);
		if (v >= 0.001) return numFmt(0).format(v * 1000) + " MB";
		return numFmt(0).format(Math.max(1, v * 1e6)) + " KB";
	}
	function ext(name) {
		var m = /\.([a-z0-9]{1,5})$/i.exec(name || "");
		return m ? m[1].toUpperCase() : "";
	}

	// File icons: macOS's own, rendered from this Mac by tools/export-desk-icons.swift.
	// macOS draws document and folder icons the same in light and dark, so one file each.
	var FILE_ICONS = { folder: "folder", dmg: "dmg", pkg: "pkg", app: "app", zip: "zip", txt: "txt", pdf: "pdf", psd: "psd", png: "png", jpg: "png", jpeg: "png", heic: "png", gif: "png" };
	function fileIcon(it) {
		var k = it.kind || "doc", x = ext(it.name).toLowerCase();
		var name = k === "folder" ? "folder" : FILE_ICONS[x] || FILE_ICONS[k] || (k === "image" ? "png" : "doc");
		return '<img class="lvm-ic-real" src="img/desk/' + name + '.png" width="64" height="64" alt="" draggable="false">';
	}

	var BUILD = {
		finder: function (o) {
			var side = [
				["Recents", ["clock", "clock.arrow.circlepath"]],
				["Applications", ["square.grid.2x2", "app.dashed"]],
				["Desktop", ["menubar.dock.rectangle", "dock.rectangle"]],
				["Documents", ["doc", "doc.text.fill"]],
				["Downloads", ["arrow.down.circle", "arrow.down.circle.fill"]]
			];
			return {
				w: 640, h: 400, toolbar: true,
				html:
					'<aside class="lvm-side" data-lvm-drag><div class="lvm-side-top"></div><div class="lvm-side-head">Favourites</div>' +
						side.map(function (s) {
							return '<div class="lvm-side-row' + (o.sidebar === s[0] ? " is-sel" : "") + '">' + sym(s[1], 14, "lvm-side-ic") + "<span>" + s[0] + "</span></div>";
						}).join("") + "</aside>" +
					'<div class="lvm-wmain">' +
						'<div class="lvm-wtb" data-lvm-drag><span class="lvm-cap"><button type="button" class="is-dim" aria-label="Back">' + sym("chevron.left", 13) + '</button><button type="button" class="is-dim" aria-label="Forward">' + sym("chevron.right", 13) + "</button></span>" +
							'<b class="lvm-wtitle">' + esc(o.title || "Untitled") + '</b><span class="lvm-flex"></span>' +
							'<span class="lvm-cap lvm-cap-view"><button type="button" aria-label="View">' + sym("square.grid.2x2", 14) + sym("chevron.down", 8, "lvm-cap-chev") + '</button></span><span class="lvm-cap"><button type="button" aria-label="Search">' + sym("magnifyingglass", 14) + "</button></span></div>" +
						'<div class="lvm-fw-grid" role="listbox" aria-label="' + esc(o.title || "") + '">' +
							(o.items || []).map(function (it, i) {
								var hid = it.kind === "hidden" || it.hidden;
								return '<div class="lvm-fi' + (hid ? " is-hidden" : "") + '" role="option" data-lvm-fi="' + i + '">' +
									'<span class="lvm-fi-art">' + fileIcon(hid && it.kind === "hidden" ? { name: it.name, kind: "doc" } : it) + "</span>" +
									'<span class="lvm-fi-name">' + esc(it.name) + "</span>" +
									(size(it.size) ? '<span class="lvm-fi-size">' + esc(size(it.size)) + "</span>" : "") + "</div>";
							}).join("") +
						"</div>" +
						'<div class="lvm-fw-status" data-lvm-status></div>' +
					"</div>",
				after: function (w) { drawStatus(w, o); }
			};
		},
		textedit: function (o) {
			return {
				w: 460, h: 340,
				html:
					'<div class="lvm-wbar" data-lvm-drag><span class="lvm-wbar-title">' + esc(o.title || "Untitled") + '<span class="lvm-te-edited" hidden>Edited</span></span></div>' +
					'<div class="lvm-te-doc" spellcheck="false"></div>',
				after: function (w) {
					var d = w.querySelector(".lvm-te-doc");
					d.textContent = o.text || "";
					try { d.contentEditable = "plaintext-only"; } catch (e) { d.contentEditable = "true"; }
					if (d.contentEditable !== "plaintext-only") d.contentEditable = "true";
					d.addEventListener("input", function () { w.querySelector(".lvm-te-edited").hidden = false; });
				}
			};
		},
		custom: function (o) {
			var clear = o.titlebar === "transparent";
			return {
				w: 480, h: 320, toolbar: !!o.toolbar, cls: clear ? "is-clear" : "",
				html:
					(clear ? '<div class="lvm-wdrag" data-lvm-drag></div>'
						: o.toolbar ? '<div class="lvm-wtb lvm-wtb-solo" data-lvm-drag><b class="lvm-wtitle">' + esc(o.title || "") + "</b></div>"
						: '<div class="lvm-wbar" data-lvm-drag><span class="lvm-wbar-title">' + esc(o.title || "") + "</span></div>") +
					'<div class="lvm-wbody" data-lvm-body>' + (o.html || "") + "</div>"
			};
		},
		settings: function (o) {
			var panes = [
				["Wi-Fi", "blue", "wifi"], ["Bluetooth", "blue", "bluetooth"], ["Network", "blue", "globe"], ["Battery", "green", "battery.100percent"], 0,
				["General", "grey", "gearshape.fill"], ["Appearance", "black", "circle.lefthalf.filled"], ["Control Centre", "grey", "switch.2"],
				["Desktop & Dock", "black", "dock.rectangle"], ["Displays", "blue", "sun.max.fill"], ["Wallpaper", "cyan", "photo.fill"], 0,
				["Notifications", "red", "bell.fill"], ["Sound", "pink", "speaker.wave.2.fill"], ["Focus", "indigo", "moon.fill"], 0,
				["Lock screen", "black", "lock.fill"], ["Privacy & security", "blue", "hand.raised"]
			];
			var cards = [["auto", "Auto"], ["light", "Light"], ["dark", "Dark"]];
			var accents = ["multi", "blue", "purple", "pink", "red", "orange", "yellow", "green", "graphite"];
			return {
				w: 690, h: 500, toolbar: true,
				html:
					'<aside class="lvm-side" data-lvm-drag><div class="lvm-side-top"></div>' +
						'<div class="lvm-ss-search">' + sym("magnifyingglass", 11) + "<span>Search</span></div>" +
						'<div class="lvm-ss-user"><span class="lvm-ss-avatar">' + sym("person.crop.circle", 22) + '</span><span><b>Sign in</b><small>with your Apple Account</small></span></div>' +
						'<div class="lvm-ss-list">' + panes.map(function (p) {
							if (!p) return '<div class="lvm-ss-gap"></div>';
							return '<div class="lvm-side-row' + (p[0] === "Appearance" ? " is-sel" : "") + '"><span class="lvm-ss-tile lvm-t-' + p[1] + '">' + sym(p[2], 11) + "</span><span>" + esc(p[0]) + "</span></div>";
						}).join("") + "</div></aside>" +
					'<div class="lvm-wmain">' +
						'<div class="lvm-wtb" data-lvm-drag><span class="lvm-cap"><button type="button" class="is-dim" aria-label="Back">' + sym("chevron.left", 13) + '</button><button type="button" class="is-dim" aria-label="Forward">' + sym("chevron.right", 13) + '</button></span><b class="lvm-wtitle">Appearance</b></div>' +
						'<div class="lvm-ss-body">' +
							'<div class="lvm-ss-group">' +
								'<div class="lvm-ss-row lvm-ss-ap"><span>Appearance</span><div class="lvm-ap" role="radiogroup" aria-label="Appearance">' +
									cards.map(function (c) {
										return '<button type="button" class="lvm-ap-card" role="radio" data-lvm-theme="' + c[0] + '"><span class="lvm-ap-pic lvm-ap-' + c[0] + '"><i></i></span><span class="lvm-ap-cap">' + c[1] + "</span></button>";
									}).join("") + "</div></div>" +
								'<div class="lvm-ss-row"><span>Accent colour</span><div class="lvm-dots">' +
									accents.map(function (a) { return '<button type="button" class="lvm-dot lvm-a-' + a + (st.accent === a ? " is-on" : "") + '" data-lvm-accent="' + a + '" aria-label="' + a + '"></button>'; }).join("") + "</div></div>" +
								'<div class="lvm-ss-row"><span>Highlight colour</span><span class="lvm-pop">Accent colour' + sym("chevron.up.chevron.down", 10) + "</span></div>" +
								'<div class="lvm-ss-row"><span>Sidebar icon size</span><span class="lvm-pop">Medium' + sym("chevron.up.chevron.down", 10) + "</span></div>" +
								'<div class="lvm-ss-row"><span>Allow wallpaper tinting in windows</span><button type="button" class="lvm-switch lvm-switch-lg' + (st.tint ? " is-on" : "") + '" data-lvm-tint role="switch" aria-checked="' + st.tint + '"><i></i></button></div>' +
							"</div>" +
							'<div class="lvm-ss-group"><div class="lvm-ss-row lvm-ss-radios"><span>Show scroll bars</span><div>' +
								["Automatically based on mouse or trackpad", "When scrolling", "Always"].map(function (r, i) {
									return '<button type="button" class="lvm-radio' + (st.scroll === i ? " is-on" : "") + '" data-lvm-scroll="' + i + '"><i></i>' + esc(r) + "</button>";
								}).join("") + "</div></div></div>" +
						"</div>" +
					"</div>",
				after: function () { refreshTheme(); }
			};
		}
	};

	function drawStatus(w, o) {
		var s = w.querySelector("[data-lvm-status]");
		if (!s) return;
		var n = (o.items || []).length;
		s.textContent = n + (n === 1 ? " item, " : " items, ") + gb(disk().free) + " available";
	}
	function tickWindows() {
		Object.keys(gwins).forEach(function (id) { if (gwins[id].kind === "finder") drawStatus(gwins[id].el, gwins[id].o); });
	}

	function openWindow(kind, o) {
		o = o || {};
		if (!scene || !BUILD[kind]) return null;
		ensureWLayer();
		var id = String(o.id || kind + "-" + (++gCount));
		if (gwins[id]) { focusWin(id); gFocus = true; return gwins[id].el; }
		var spec = BUILD[kind](o, id);
		var w = el("div", "lvm-win lvm-w lvm-w-" + kind + (spec.toolbar ? " has-toolbar" : "") + (spec.cls ? " " + spec.cls : ""), wLights() + spec.html);
		w.dataset.lvmGw = id;
		w.setAttribute("role", "dialog");
		w.setAttribute("aria-label", o.title || (kind === "settings" ? "System Settings" : kind));
		var ww = Math.round(Math.min(o.w || spec.w, W() - 16)), hh = Math.round(Math.min(o.h || spec.h, Hh() - 46));
		w.style.width = ww + "px";
		w.style.height = hh + "px";
		if (ww < 520) w.classList.add("is-narrow");
		var n = gOrder.length;
		var x = o.x != null ? o.x : (W() - ww) / 2 + n * 24;
		var y = o.y != null ? o.y : Math.max(44, (Hh() - hh) / 2 - 40) + n * 24;
		w.style.left = Math.round(clamp(x, 8, Math.max(8, W() - ww - 8))) + "px";
		w.style.top = Math.round(clamp(y, 38, Math.max(38, Hh() - hh - 8))) + "px";
		w.insertAdjacentHTML("beforeend", ["n", "s", "e", "w", "nw", "ne", "sw", "se"].map(function (d) {
			return '<i class="lvm-rz lvm-rz-' + d + '" data-lvm-rz="' + d + '" aria-hidden="true"></i>';
		}).join(""));
		wlayer.appendChild(w);
		var mins = MIN_SIZE[kind] || MIN_SIZE.custom;
		gwins[id] = {
			el: w, kind: kind, o: o, esc: o.esc != null ? !!o.esc : kind !== "custom",
			minW: kind === "custom" && o.minW ? o.minW : mins[0], minH: kind === "custom" && o.minH ? o.minH : mins[1]
		};
		if (spec.after) spec.after(w, id);
		gOrder.unshift(id);
		gFocus = true;
		lastWin = null;
		stack();
		if (!gTimer) gTimer = setInterval(tickWindows, 1000);
		fire("lvm:window", { id: id, kind: kind, action: "open" });
		return w;
	}
	function stack() {
		var n = gOrder.length;
		gOrder.forEach(function (id, i) {
			var g = gwins[id];
			g.el.style.zIndex = n - i;
			g.el.classList.toggle("is-key", i === 0);
		});
	}
	function focusWin(id) {
		var i = gOrder.indexOf(id);
		if (i < 0) return;
		if (i > 0) { gOrder.splice(i, 1); gOrder.unshift(id); fire("lvm:window", { id: id, kind: gwins[id].kind, action: "focus" }); }
		stack();
	}
	function closeWindow(id, reason) {
		var g = gwins[id];
		if (!g) return false;
		delete gwins[id];
		gOrder.splice(gOrder.indexOf(id), 1);
		var w = g.el;
		w.removeAttribute("data-lvm-gw");
		w.style.pointerEvents = "none";
		if (reason === "minimise") {
			var dock = scene.querySelector(".lv-dock"), tx = W() / 2, ty = Hh() - 30;
			if (dock && dock.offsetWidth) { var p = offsetIn(dock); tx = p.x + dock.offsetWidth / 2; ty = p.y + dock.offsetHeight / 2; }
			var cx = w.offsetLeft + w.offsetWidth / 2, cy = w.offsetTop + w.offsetHeight / 2;
			w.classList.add("is-minimising");
			if (!REDUCED()) w.style.transform = "translate(" + Math.round(tx - cx) + "px," + Math.round(ty - cy) + "px) scale(.06)";
			w.style.opacity = "0";
			setTimeout(function () { w.remove(); }, 460);
		} else w.remove();
		if (!gOrder.length) { clearInterval(gTimer); gTimer = 0; gFocus = false; }
		stack();
		fire("lvm:window", { id: id, kind: g.kind, action: "close", reason: reason || "api" });
		if (typeof g.o.onClose === "function") { try { g.o.onClose(reason || "api"); } catch (e) {} }
		return true;
	}
	// Resizing from any edge or corner, clamped to the scene and the kind's minimum size.
	var MIN_SIZE = { finder: [420, 260], textedit: [300, 200], settings: [560, 360], custom: [300, 200] };
	function startResize(e, w, dir, g) {
		e.preventDefault();
		e.stopPropagation();
		var h = e.target, s = scale(), x0 = e.clientX, y0 = e.clientY;
		var l0 = w.offsetLeft, t0 = w.offsetTop, w0 = w.offsetWidth, h0 = w.offsetHeight;
		var minW = Math.min(g.minW, W() - 16), minH = Math.min(g.minH, Hh() - 46);
		var pid = e.pointerId;
		try { h.setPointerCapture(pid); } catch (err) {}
		wlayer.classList.add("is-resizing");
		wlayer.dataset.rz = dir;
		g.zoomed = null;
		function mv(ev) {
			if (ev.pointerId !== pid) return;
			if (ev.pointerType === "mouse" && !(ev.buttons & 1)) { up(ev); return; }
			var dx = (ev.clientX - x0) / s, dy = (ev.clientY - y0) / s;
			var l = l0, t = t0, ww = w0, hh = h0;
			if (dir.indexOf("e") >= 0) ww = clamp(w0 + dx, minW, W() - l0);
			if (dir.indexOf("s") >= 0) hh = clamp(h0 + dy, minH, Hh() - t0);
			if (dir.indexOf("w") >= 0) { l = clamp(l0 + dx, 0, l0 + w0 - minW); ww = l0 + w0 - l; }
			if (dir.indexOf("n") >= 0) { t = clamp(t0 + dy, 30, t0 + h0 - minH); hh = t0 + h0 - t; }
			w.style.left = Math.round(l) + "px";
			w.style.top = Math.round(t) + "px";
			w.style.width = Math.round(ww) + "px";
			w.style.height = Math.round(hh) + "px";
			w.classList.toggle("is-narrow", ww < 520);
		}
		function up(ev) {
			if (ev.pointerId !== pid) return;
			try { h.releasePointerCapture(pid); } catch (err) {}
			h.removeEventListener("pointermove", mv);
			h.removeEventListener("pointerup", up);
			h.removeEventListener("pointercancel", up);
			wlayer.classList.remove("is-resizing");
			delete wlayer.dataset.rz;
		}
		h.addEventListener("pointermove", mv);
		h.addEventListener("pointerup", up);
		h.addEventListener("pointercancel", up);
	}

	function zoomWin(id) {
		var g = gwins[id];
		if (!g) return;
		var w = g.el;
		w.classList.add("is-zooming");
		setTimeout(function () { w.classList.remove("is-zooming"); }, 300);
		if (g.zoomed) {
			var r = g.zoomed;
			g.zoomed = null;
			w.style.left = r[0] + "px"; w.style.top = r[1] + "px"; w.style.width = r[2] + "px"; w.style.height = r[3] + "px";
		} else {
			g.zoomed = [w.offsetLeft, w.offsetTop, w.offsetWidth, w.offsetHeight];
			var bottom = Hh() - 8, dock = scene.querySelector(".lv-dock");
			if (dock && dock.offsetWidth) bottom = Math.min(bottom, offsetIn(dock).y - 8);
			w.style.left = "8px"; w.style.top = "38px";
			w.style.width = (W() - 16) + "px"; w.style.height = Math.max(200, bottom - 38) + "px";
		}
		w.classList.toggle("is-narrow", parseInt(w.style.width, 10) < 520);
	}
	function frontEsc() {
		for (var i = 0; i < gOrder.length; i++) if (gwins[gOrder[i]].esc) return gOrder[i];
		return null;
	}
	function levoOpen() { return scene.classList.contains("is-open") || call("levoOpen") === true; }
	function onDbl(e) {
		var fi = e.target.closest && e.target.closest(".lvm-fi");
		if (!fi || !wlayer || !wlayer.contains(fi)) return;
		openItem(fi);
	}
	function openItem(fi) {
		var w = fi.closest(".lvm-w"), g = w && gwins[w.dataset.lvmGw];
		if (!g) return;
		var it = (g.o.items || [])[+fi.dataset.lvmFi];
		if (it && typeof g.o.onOpen === "function") { try { g.o.onOpen(it); } catch (err) { if (window.console) console.warn("LevoMenus onOpen", err); } }
	}

	// ---------------------------------------------------------------- Desktop content

	var CONTENT = {
		installers: [
			{ name: "Setup-3.2.1.dmg", kind: "dmg", size: 0.612 },
			{ name: "Setup-3.2.1 (1).dmg", kind: "dmg", size: 0.612 },
			{ name: "Install (2).pkg", kind: "pkg", size: 0.418 },
			{ name: "FontPack-2019.pkg", kind: "pkg", size: 0.34 },
			{ name: "DisplayDriver-v11.4.pkg", kind: "pkg", size: 0.236 },
			{ name: "PrinterUtility_5.0.8.dmg", kind: "dmg", size: 0.182 }
		],
		notes: [
			"things to do",
			"",
			"- reply to the landlord about the tap",
			"- rename project-final-v2 to something actually final",
			"- oat milk. not the other one",
			"- work out why the disk is full",
			"- clean the disk next week",
			"- clean the disk next week (for real this time)",
			"- stop saving screenshots to the desktop",
			"- put this list somewhere I'll see it"
		].join("\n"),
		unzipped: [
			{ name: "__MACOSX", kind: "folder" },
			{ name: "old", kind: "folder" },
			{ name: "final.psd", kind: "image", size: 0.482 },
			{ name: "final-FINAL.psd", kind: "image", size: 0.507 },
			{ name: "final-FINAL-use-this-one.psd", kind: "image", size: 0.519 },
			{ name: "final-FINAL-use-this-one (1).psd", kind: "image", size: 0.519 },
			{ name: "feedback round 4.pdf", kind: "doc", size: 0.0012 },
			{ name: "notes.txt", kind: "txt", size: 0.000004 },
			{ name: ".DS_Store", kind: "hidden", size: 0.000006 }
		]
	};

	// ---------------------------------------------------------------- Events

	function itemFrom(t) {
		var it = t.closest && t.closest(".lvm-item");
		if (!it) return null;
		var m = it.closest(".lvm-menu");
		for (var k = 0; k < levels.length; k++) if (levels[k].el === m) return { L: levels[k], i: +it.dataset.i };
		return null;
	}

	function onOver(e) {
		if (e.pointerType && e.pointerType !== "mouse") return;
		var b = e.target.closest && e.target.closest(".lv-menubar [data-menu]");
		if (b && openId && !busy && b.dataset.menu !== openId && scene.contains(b)) { openMenu(b.dataset.menu, { first: levels[0] && levels[0].hi >= 0 }); return; }
		var h = itemFrom(e.target);
		if (!h || busy) return;
		var L = h.L, i = h.i, idx = levels.indexOf(L);
		if (L.hi === i) return;
		setHi(L, enabled(L, i) || L.items[i].def.sub ? i : -1);
		clearTimeout(subTimer);
		subOwner = idx;
		var d = L.items[i].def;
		if (d.sub && !d.disabled) subTimer = setTimeout(function () { openSub(L, i); }, SUB_DELAY);
		else if (levels.length > idx + 1) subTimer = setTimeout(function () { closeFrom(idx + 1); }, SUB_DELAY);
	}

	function onClick(e) {
		var t = e.target;
		var b = t.closest && t.closest(".lv-menubar [data-menu]");
		if (b && scene.contains(b)) {
			e.preventDefault();
			if (busy) return;
			if (openId === b.dataset.menu) closeMenu(); else openMenu(b.dataset.menu);
			return;
		}
		if (wlayer && wlayer.contains(t)) { onWinClick(e, t); return; }
		if (!layer || !layer.contains(t)) return;
		var cc = t.closest("[data-lvm-cc]");
		if (cc) { ccToggle(cc.dataset.lvmCc); return; }
		var h = itemFrom(t);
		if (h) { activate(h.L, h.i); return; }
		var cal = t.closest("[data-lvm-cal]");
		if (cal) { var v = +cal.dataset.lvmCal; st.cal = v ? st.cal + v : 0; drawClock(); return; }
		var a = t.closest("[data-lvm]");
		if (!a) return;
		switch (a.dataset.lvm) {
			case "close": var w = a.closest(".lvm-win"); if (w) closeWin(w.dataset.lvmWin); break;
			case "fq-pick": fqSel = a.dataset.app; drawFQ(); break;
			case "fq-go": fqGo(); break;
			case "alert-ok": alertDone(true); break;
			case "alert-no": alertDone(false); break;
			case "alert-check": st.reopen = !st.reopen; a.classList.toggle("is-on", st.reopen); break;
			case "goto-pick": goTo(goList[+a.dataset.i] || ""); break;
		}
	}

	function onWinClick(e, t) {
		var w = t.closest(".lvm-w");
		var id = w && w.dataset.lvmGw;
		if (!id || !gwins[id]) return;
		var b = t.closest("[data-lvm-w]");
		if (b) { var a = b.dataset.lvmW; if (a === "close") closeWindow(id, "close"); else if (a === "min") closeWindow(id, "minimise"); else zoomWin(id); return; }
		var fi = t.closest(".lvm-fi");
		var grid = t.closest(".lvm-fw-grid");
		if (grid) {
			var was = fi && fi.classList.contains("is-sel");
			Array.prototype.forEach.call(grid.querySelectorAll(".lvm-fi"), function (x) { x.classList.toggle("is-sel", x === fi); });
			if (fi && was && ptrType !== "mouse") openItem(fi);
			return;
		}
		var th = t.closest("[data-lvm-theme]");
		if (th) { setTheme(th.dataset.lvmTheme); return; }
		var ac = t.closest("[data-lvm-accent]");
		if (ac) { st.accent = ac.dataset.lvmAccent; Array.prototype.forEach.call(w.querySelectorAll("[data-lvm-accent]"), function (x) { x.classList.toggle("is-on", x === ac); }); return; }
		var sw = t.closest("[data-lvm-tint]");
		if (sw) { st.tint = !st.tint; sw.classList.toggle("is-on", st.tint); sw.setAttribute("aria-checked", st.tint); return; }
		var rd = t.closest("[data-lvm-scroll]");
		if (rd) { st.scroll = +rd.dataset.lvmScroll; Array.prototype.forEach.call(w.querySelectorAll("[data-lvm-scroll]"), function (x) { x.classList.toggle("is-on", x === rd); }); }
	}

	// A press outside an open menu closes it; inside the scene, macOS eats that click.
	function onDown(e) {
		var t = e.target;
		swallow = false;
		ptrType = e.pointerType || "mouse";
		var sl = t.closest && t.closest("[data-lvm-slider]");
		if (sl && layer && layer.contains(sl)) { startSlide(e, sl); return; }
		var gw = wlayer && wlayer.contains(t) && t.closest(".lvm-w");
		var inLayer = layer && layer.contains(t);
		if (openId) {
			var inMenu = t.closest && t.closest(".lvm-menu");
			var onBtn = t.closest && t.closest(".lv-menubar [data-menu]");
			if (!inMenu && !onBtn) {
				closeMenu();
				var levo = t.closest && t.closest(".lv-mb-levo");
				if (!levo && scene.contains(t) && !inLayer) swallow = true;
			}
		}
		if (wins.goto && !(t.closest && t.closest(".lvm-goto"))) closeWin("goto");
		var w = inLayer && t.closest(".lvm-win");
		if (w && w.dataset.lvmWin) { lastWin = w.dataset.lvmWin; if (w.dataset.lvmWin !== "alert") raise(w); }
		else if (!(t.closest && t.closest(".lvm-menu"))) lastWin = wins.alert ? "alert" : null;
		if (w && (t.closest("[data-lvm-drag]")) && !t.closest("button")) startDrag(e, w);
		var rz = gw && t.closest("[data-lvm-rz]");
		if (rz && gwins[gw.dataset.lvmGw] && (e.button === 0 || e.pointerType !== "mouse")) {
			gFocus = true;
			lastWin = null;
			focusWin(gw.dataset.lvmGw);
			startResize(e, gw, rz.dataset.lvmRz, gwins[gw.dataset.lvmGw]);
			return;
		}
		if (gw && gw.dataset.lvmGw) {
			gFocus = true;
			lastWin = null;
			focusWin(gw.dataset.lvmGw);
			if (t.closest("[data-lvm-drag]") && !t.closest("button, input, textarea, select, a, [contenteditable], .lvm-fi, [data-lvm-nodrag]") && e.button === 0) startDrag(e, gw);
		} else if (!inLayer) gFocus = false;
	}
	function onClickCapture(e) {
		if (!swallow) return;
		swallow = false;
		e.stopPropagation();
		e.preventDefault();
	}

	function startDrag(e, w) {
		var s = scale(), x0 = e.clientX, y0 = e.clientY, l0 = w.offsetLeft, t0 = w.offsetTop;
		var ww = w.offsetWidth * (+w.dataset.scale || 1), h = e.target, pid = e.pointerId;
		e.preventDefault();
		try { h.setPointerCapture(pid); } catch (err) {}
		if (wlayer) wlayer.classList.add("is-dragging");
		function mv(ev) {
			if (ev.pointerId !== pid) return;
			if (ev.pointerType === "mouse" && !(ev.buttons & 1)) { up(ev); return; }
			w.style.left = clamp(l0 + (ev.clientX - x0) / s, 40 - ww, W() - 40) + "px";
			w.style.top = clamp(t0 + (ev.clientY - y0) / s, 30, Hh() - 30) + "px";
		}
		function up(ev) {
			if (ev.pointerId !== pid) return;
			try { h.releasePointerCapture(pid); } catch (err) {}
			h.removeEventListener("pointermove", mv);
			h.removeEventListener("pointerup", up);
			h.removeEventListener("pointercancel", up);
			if (wlayer) wlayer.classList.remove("is-dragging");
		}
		h.addEventListener("pointermove", mv);
		h.addEventListener("pointerup", up);
		h.addEventListener("pointercancel", up);
	}

	function stop(e) { e.stopPropagation(); e.preventDefault(); }

	function onKey(e) {
		var k = e.key;
		if (openId) {
			e.stopPropagation();
			if (busy) { e.preventDefault(); return; }
			var top = levels[levels.length - 1], first = levels[0];
			var inInput = e.target && e.target.matches && e.target.matches("[data-lvm-help]");
			if (k === "Escape") { e.preventDefault(); closeMenu(); return; }
			var sld = e.target && e.target.closest && e.target.closest("[data-lvm-slider]");
			if (sld && (k === "ArrowLeft" || k === "ArrowRight")) { e.preventDefault(); setSlider(sld.dataset.lvmSlider, st[sld.dataset.lvmSlider] + (k === "ArrowRight" ? 0.0625 : -0.0625)); return; }
			if (k === "ArrowDown" || k === "ArrowUp") { e.preventDefault(); moveHi(top, k === "ArrowDown" ? 1 : -1); return; }
			if (k === "ArrowRight") {
				if (inInput && e.target.value) return;
				e.preventDefault();
				if (top.hi >= 0 && top.items[top.hi].def.sub && !top.items[top.hi].def.disabled) { openSub(top, top.hi, true); return; }
				step(1, top.hi >= 0 || first.hi >= 0);
				return;
			}
			if (k === "ArrowLeft") {
				if (inInput && e.target.value) return;
				e.preventDefault();
				if (levels.length > 1) { closeFrom(levels.length - 1); return; }
				step(-1, first.hi >= 0);
				return;
			}
			if (k === "Enter" || (k === " " && !inInput)) {
				e.preventDefault();
				if (top.hi >= 0) activate(top, top.hi);
				else if (!inInput) closeMenu();
				return;
			}
			if (k === "Tab") { e.preventDefault(); return; }
			// Type to jump, as macOS does.
			if (!inInput && k.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
				e.preventDefault();
				var c = k.toLowerCase(), n = top.items.length;
				for (var j = 1; j <= n; j++) {
					var idx = ((top.hi < 0 ? -1 : top.hi) + j + n) % n;
					var lab = (top.items[idx].def.label || "").toLowerCase();
					if (lab.charAt(0) === c && enabled(top, idx)) { setHi(top, idx, true); break; }
				}
			}
			return;
		}
		if (wins.alert) {
			e.stopPropagation();
			if (k === "Escape") { e.preventDefault(); if (wins.alert.querySelector('[data-lvm="alert-no"]')) alertDone(false); else alertDone(true); }
			else if (k === "Enter") { e.preventDefault(); alertDone(true); }
			else if (k !== "Tab") e.preventDefault();
			return;
		}
		if (wins.goto) {
			e.stopPropagation();
			if (k === "Escape") { stop(e); closeWin("goto"); }
			else if (k === "Enter") { stop(e); goToCurrent(); }
			else if (k === "ArrowDown" || k === "ArrowUp") {
				stop(e);
				if (goList.length) { goSel = (goSel + (k === "ArrowDown" ? 1 : -1) + goList.length) % goList.length; drawGoTo(); }
			} else if (k === "Tab") {
				stop(e);
				if (goList[goSel]) { var inp = wins.goto.querySelector("input"); inp.value = goList[goSel] + "/"; drawGoTo(); }
			}
			return;
		}
		var tg = e.target;
		var editable = tg && tg.nodeType === 1 && (tg.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName));
		if (editable && wlayer && wlayer.contains(tg)) {
			e.stopPropagation();
			if (k !== "Escape") return;
		}
		if (lastWin && wins[lastWin]) {
			if (k === "Escape") { stop(e); closeWin(lastWin); return; }
			if (lastWin === "fq") {
				if (k === "ArrowDown" || k === "ArrowUp") { stop(e); fqMove(k === "ArrowDown" ? 1 : -1); }
				else if (k === "Enter") { stop(e); fqGo(); }
			}
			return;
		}
		if (gFocus && k === "Escape" && !levoOpen()) {
			var f = frontEsc();
			if (f) { stop(e); if (editable) tg.blur(); closeWindow(f, "esc"); }
		}
	}
	function step(dir, first) {
		var bs = buttons();
		var i = bs.indexOf(openBtn);
		if (i < 0 || !bs.length) return;
		var nb = bs[(i + dir + bs.length) % bs.length];
		openMenu(nb.dataset.menu, { first: first });
	}

	function on(target, type, fn, opts) {
		target.addEventListener(type, fn, opts);
		listeners.push([target, type, fn, opts]);
	}
	function onResize() {
		if (openId) closeMenu();
		gOrder.forEach(function (id) {
			var w = gwins[id].el;
			w.style.left = clamp(w.offsetLeft, 40 - w.offsetWidth, Math.max(8, W() - 60)) + "px";
			w.style.top = clamp(w.offsetTop, 30, Math.max(30, Hh() - 40)) + "px";
		});
	}
	var themeObs = null;

	// ---------------------------------------------------------------- Public

	function detach() {
		closeMenu(true);
		Object.keys(wins).forEach(function (k) { if (wins[k] && wins[k].nodeType) closeWin(k); });
		wins = {};
		listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
		listeners = [];
		Object.keys(gwins).forEach(function (id) { closeWindow(id, "api"); });
		clearInterval(gTimer); gTimer = 0;
		if (themeObs) themeObs.disconnect();
		themeObs = null;
		if (layer) layer.remove();
		if (wlayer) wlayer.remove();
		layer = null;
		wlayer = null;
		scene = null;
	}

	function attach(opts) {
		opts = opts || {};
		if (!opts.scene) return null;
		if (scene) detach();
		scene = opts.scene;
		hooks = opts.hooks || {};
		st = freshState();
		ensureLayer();
		buttons().forEach(function (b) { b.setAttribute("aria-haspopup", "menu"); b.setAttribute("aria-expanded", "false"); });
		on(scene, "click", onClick);
		on(scene, "pointerover", onOver);
		on(document, "pointerdown", onDown, true);
		on(document, "click", onClickCapture, true);
		on(window, "keydown", onKey, true);
		on(window, "resize", onResize);
		on(scene, "dblclick", onDbl);
		if (window.MutationObserver) {
			themeObs = new MutationObserver(refreshTheme);
			themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
		}
		return api;
	}

	var api = {
		attach: attach,
		detach: detach,
		open: function (id) { if (scene) openMenu(id); },
		close: function () { closeMenu(); },
		isOpen: function () { return !!openId; },
		window: function (kind, opts) { return openWindow(kind, opts); },
		closeWindow: function (id) { return closeWindow(String(id), "api"); },
		windows: function () { return gOrder.slice(); },
		content: CONTENT
	};
	window.LevoMenus = api;
})();
