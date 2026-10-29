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
 * While a menu is open the scene has data-menu="open". Events on the scene:
 * lvm:open and lvm:close ({ menu }), lvm:wifi ({ on }).
 * Everything is positioned in design px (offsetLeft/offsetTop), so CSS zoom is fine.
 */
(function () {
	"use strict";

	var LANG = (navigator.languages && navigator.languages[0]) || navigator.language || "en-NZ";
	var SUB_DELAY = 150;
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
		"minus": '<path d="M4 8h8" stroke-width="2"/>'
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
	function sym(name, size, cls) {
		var svg = "";
		var f = hook("symbol");
		if (f) { try { svg = String(f(name, size) || ""); } catch (e) { svg = ""; } }
		if (svg.indexOf("<svg") < 0) {
			svg = FALLBACK[name] ? '<svg viewBox="0 0 16 16" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="' + (size > 40 ? 0.7 : 1.5) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + FALLBACK[name] + "</svg>" : "";
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

	var MENUS = {
		apple: function () {
			return [
				D("About This Mac", "", { act: openAbout }),
				SEP,
				D("System Settings…"),
				D("App Store…"),
				SEP,
				D("Recent Items", "", { sub: recentItems }),
				SEP,
				D("Force Quit…", "⌥⌘⎋", { act: openForceQuit }),
				SEP,
				D("Sleep", "", { act: function () { dim(); } }),
				D("Restart…", "", { act: function () { power("restart"); } }),
				D("Shut Down…", "", { act: function () { power("shutdown"); } }),
				SEP,
				D("Lock Screen", "⌃⌘Q", { act: function () { if (hook("lock")) call("lock"); else dim(); } }),
				D("Log Out…", "⇧⌘Q", { act: function () { power("logout"); } })
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
				D("Services", "", { sub: function () { return [off("No Services Apply"), D("Services Settings…")]; } }),
				SEP,
				D("Hide Finder", "⌘H"),
				D("Hide Others", "⌥⌘H"),
				off("Show All")
			];
		},
		file: function () {
			return [
				D("New Finder Window", "⌘N"),
				D("New Folder", "⇧⌘N"),
				off("New Folder with Selection", "⌃⌘N"),
				D("New Smart Folder", "⌥⌘N"),
				D("New Tab", "⌘T"),
				off("Open", "⌘O"),
				off("Open With", "", { sub: function () { return []; } }),
				D("Close Window", "⌘W"),
				SEP,
				D("Get Info", "⌘I"),
				off("Rename"),
				off("Compress"),
				off("Duplicate", "⌘D"),
				off("Make Alias", "⌃⌘A"),
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
				D("Select All", "⌘A"),
				SEP,
				D("Show Clipboard"),
				SEP,
				D("Start Dictation…"),
				D("Emoji & Symbols", "fn E")
			];
		},
		view: function () {
			return [
				radio("view", "icons", "as Icons", "⌘1"),
				radio("view", "list", "as List", "⌘2"),
				radio("view", "columns", "as Columns", "⌘3"),
				radio("view", "gallery", "as Gallery", "⌘4"),
				SEP,
				check("stacks", "Use Stacks", "⌃⌘0"),
				D("Sort By", "", { sub: sortBy }),
				D("Clean Up"),
				SEP,
				toggle("sidebar", "Hide Sidebar", "Show Sidebar", "⌃⌘S"),
				toggle("preview", "Hide Preview", "Show Preview", "⇧⌘P"),
				SEP,
				toggle("toolbar", "Hide Toolbar", "Show Toolbar", "⌥⌘T"),
				toggle("pathbar", "Hide Path Bar", "Show Path Bar", "⌥⌘P"),
				toggle("statusbar", "Hide Status Bar", "Show Status Bar", "⌘/"),
				SEP,
				D("Enter Full Screen", "⌃⌘F")
			];
		},
		go: function () {
			return [
				off("Back", "⌘["),
				off("Forward", "⌘]"),
				off("Enclosing Folder", "⌘↑"),
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
				D("Recent Folders", "", { sub: function () {
					return [D("Downloads"), D("Developer"), D("Caches"), SEP, D("Clear Menu")];
				} }),
				SEP,
				D("Go to Folder…", "⇧⌘G", { act: openGoTo }),
				D("Connect to Server…", "⌘K")
			];
		},
		window: function () {
			return [
				off("Minimize", "⌘M"),
				off("Zoom"),
				off("Move & Resize", "", { sub: function () { return []; } }),
				off("Fill", "fn⌃F"),
				off("Center"),
				SEP,
				D("Cycle Through Windows", "⌘`"),
				SEP,
				D("Bring All to Front")
			];
		},
		help: helpMenu,
		wifi: wifiMenu,
		battery: batteryMenu,
		clock: clockMenu
	};
	var NAMES = { apple: "Apple", app: "Finder", file: "File", edit: "Edit", view: "View", go: "Go", window: "Window", help: "Help" };
	var SOFT = { wifi: 1, battery: 1, clock: 1 };

	function recentItems() {
		return [
			{ header: "Applications" }, D("Xcode"), D("Terminal"), D("System Settings"),
			{ header: "Documents" }, D("Project Plan.pages"), D("Invoice 0412.pdf"), D("Screenshot 2026-10-28 at 9.41.12 am.png"),
			SEP, D("Clear Menu")
		];
	}
	function sortBy() {
		return [
			radio("sort", "none", "None", "⌃⌥⌘0"),
			check("snap", "Snap to Grid"),
			SEP,
			radio("sort", "name", "Name", "⌃⌥⌘1"),
			radio("sort", "kind", "Kind", "⌃⌥⌘2"),
			radio("sort", "opened", "Date Last Opened", "⌃⌥⌘3"),
			radio("sort", "added", "Date Added", "⌃⌥⌘4"),
			radio("sort", "modified", "Date Modified", "⌃⌥⌘5"),
			radio("sort", "created", "Date Created"),
			radio("sort", "size", "Size", "⌃⌥⌘6"),
			radio("sort", "tags", "Tags", "⌃⌥⌘7")
		];
	}

	// Help: a search field over the menu definitions above, as macOS does.
	function helpMenu() {
		return {
			head: '<div class="lvm-hsearch"><span>Search</span><label class="lvm-field">' + sym("magnifyingglass", 12, "lvm-field-glass") +
				'<input type="text" data-lvm-help spellcheck="false" autocomplete="off" aria-label="Search Help"></label></div>',
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
				d.push({ header: "Menu Items" });
				hits.slice(0, 6).forEach(function (h) {
					d.push({ label: h.def.label, disabled: h.def.disabled, after: '<span class="lvm-path">' + esc(h.path) + "</span>", act: h.def.act });
				});
			}
			if (topics.length) {
				d.push({ header: "Help Topics" });
				topics.slice(0, 4).forEach(function (t) {
					d.push(t.levo
						? { label: "Levo", icon: levoIcon("lvm-levo-icon"), levo: true, act: function () { call("openLevo"); } }
						: { label: t.label, icon: sym("doc.text.fill", 13, "lvm-ic") });
				});
			}
			if (!hits.length && !topics.length) d.push({ block: '<div class="lvm-none">No results</div>' });
			d.push(SEP);
		}
		d.push(D("macOS Help"), D("Tips for Your Mac"), D("New to Mac"), D("See What’s New in macOS Tahoe"));
		return d;
	}

	// Wi-Fi, macOS 26 style: switch, known network, other networks.
	function wifiMenu() {
		var on = st.wifi;
		var d = [{
			html: '<span class="lvm-label lvm-bold">Wi-Fi</span><span class="lvm-switch' + (on ? " is-on" : "") + '" role="switch" aria-checked="' + on + '"><i></i></span>',
			keep: true, cls: "lvm-row-head", act: toggleWifi
		}];
		d.push(SEP, { header: "Known Network", dim: !on });
		d.push({ html: net(WIFI_HOME, true), cls: "lvm-net", disabled: !on });
		d.push({ header: "Other Networks", dim: !on });
		WIFI_OTHER.forEach(function (n) { d.push({ html: net(n, false), cls: "lvm-net", disabled: !on }); });
		d.push(SEP, D("Other…", "", { disabled: !on }), D("Wi-Fi Settings…"));
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
		var src = !b || b.charging ? "Power Adapter" : "Battery";
		var d = [
			{ block: '<div class="lvm-row-title"><b>Battery</b>' + (lvl ? '<span class="lvm-sec lvm-num">' + lvl + "</span>" : "") + "</div>" +
				'<div class="lvm-row-note">Power Source: ' + src + "</div>" }
		];
		d.push(SEP, { header: "Using Significant Energy" });
		var hungry = APPS.filter(function (a) { return a.energy && running(a.id); });
		if (hungry.length) hungry.forEach(function (a) { d.push({ label: a.name, icon: '<span class="lvm-app">' + sym(a.sym, 12) + "</span>" }); });
		else d.push({ block: '<div class="lvm-none">No Apps Using Significant Energy</div>' });
		d.push(SEP, D("Battery Settings…"));
		return { defs: d };
	}

	// The clock: date, time and this month, in the visitor's locale.
	function clockMenu() {
		return { defs: [{ block: '<div class="lvm-clock" data-lvm-clock></div>' }, SEP, D("Date & Time Settings…")], after: drawClock };
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
				(d.icon || "") +
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
		if (!L.items.length && !s.head) m.appendChild(el("div", "lvm-none lvm-empty", ""));
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
			'<button type="button" class="lvm-btn">More Info…</button>');
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
			'<div class="lvm-tb" data-lvm-drag>' + lights(true) + '<span class="lvm-tb-title">Force Quit Applications</span></div>' +
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
		b.textContent = levo ? "Levo is fine." : fqSel === "finder" ? "Relaunch" : "Force Quit";
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
		shutdown: { t: "Are you sure you want to shut down your computer now?", b: "If you do nothing, the computer will shut down automatically in {n} seconds.", ok: "Shut Down", sym: "power" },
		logout: { t: "Are you sure you want to quit all apps and log out now?", b: "If you do nothing, you will be logged out automatically in {n} seconds.", ok: "Log Out", sym: "power" }
	};
	FALLBACK.power = '<path d="M8 2v5.2"/><path d="M4.7 4.3a5 5 0 1 0 6.6 0"/>';
	function power(kind) {
		var p = POWER[kind], n = 60;
		alertBox({ sym: p.sym, title: p.t, body: p.b.replace("{n}", n), ok: p.ok, check: "Reopen windows when logging back in", onOk: function () { dim(); } });
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
		if (!layer || !layer.contains(t)) return;
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

	// A press outside an open menu closes it; inside the scene, macOS eats that click.
	function onDown(e) {
		var t = e.target;
		swallow = false;
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
	}
	function onClickCapture(e) {
		if (!swallow) return;
		swallow = false;
		e.stopPropagation();
		e.preventDefault();
	}

	function startDrag(e, w) {
		var s = scale(), x0 = e.clientX, y0 = e.clientY, l0 = w.offsetLeft, t0 = w.offsetTop;
		var ws = +w.dataset.scale || 1;
		var ww = w.offsetWidth * ws, wh = w.offsetHeight * ws;
		e.preventDefault();
		function mv(ev) {
			w.style.left = clamp(l0 + (ev.clientX - x0) / s, 40 - ww, W() - 40) + "px";
			w.style.top = clamp(t0 + (ev.clientY - y0) / s, 30, Hh() - 30) + "px";
		}
		function up() { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); }
		document.addEventListener("pointermove", mv);
		document.addEventListener("pointerup", up);
		void wh;
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
		if (lastWin && wins[lastWin]) {
			if (k === "Escape") { stop(e); closeWin(lastWin); return; }
			if (lastWin === "fq") {
				if (k === "ArrowDown" || k === "ArrowUp") { stop(e); fqMove(k === "ArrowDown" ? 1 : -1); }
				else if (k === "Enter") { stop(e); fqGo(); }
			}
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
	function onResize() { if (openId) closeMenu(); }

	// ---------------------------------------------------------------- Public

	function detach() {
		closeMenu(true);
		Object.keys(wins).forEach(function (k) { if (wins[k] && wins[k].nodeType) closeWin(k); });
		wins = {};
		listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
		listeners = [];
		if (layer) layer.remove();
		layer = null;
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
		return api;
	}

	var api = {
		attach: attach,
		detach: detach,
		open: function (id) { if (scene) openMenu(id); },
		close: function () { closeMenu(); },
		isOpen: function () { return !!openId; }
	};
	window.LevoMenus = api;
})();
