/*
 * The Levo page: the price, appearance, the load sequence and arrivals, the
 * feature symbols and their hovers, the hint, and the Settings preview. The
 * menubar demo lives in demo.js, its menus in menus.js.
 */
(function () {
	"use strict";

	// The price, in one place. When it rises, change amount and nothing else.
	var PRICE = { amount: "$5", term: "Lifetime" };

	var root = document.documentElement;
	var D = window.LevoDemo;
	var sym = D.sym, tile = D.tile;
	var media = window.matchMedia("(prefers-color-scheme: dark)");
	var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
	function all(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
	function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

	all("[data-buy]").forEach(function (a) { a.textContent = "Buy for " + PRICE.amount; });
	all("[data-price]").forEach(function (el) { el.textContent = PRICE.amount; });
	all("[data-term]").forEach(function (el) { el.textContent = PRICE.term; });
	all("[data-price-line]").forEach(function (el) { el.hidden = false; });

	// Symbols placed in the markup.
	all("[data-sym]").forEach(function (el) { el.innerHTML = sym(el.dataset.sym, +el.dataset.size || 16); });

	// Appearance: follows the system unless chosen, stored the way the rest of the site stores it.
	function applyTheme() {
		var t = root.getAttribute("data-theme");
		root.classList.toggle("dark", t ? t === "dark" : media.matches);
	}
	if (media.addEventListener) media.addEventListener("change", applyTheme);
	var toggle = document.querySelector("[data-theme-toggle]");
	if (toggle) toggle.addEventListener("click", function () {
		var next = root.classList.contains("dark") ? "light" : "dark";
		var stored = next === (media.matches ? "dark" : "light") ? null : next;
		if (stored) root.setAttribute("data-theme", stored); else root.removeAttribute("data-theme");
		try { if (stored) localStorage.setItem("theme", stored); else localStorage.removeItem("theme"); } catch (e) {}
		applyTheme();
	});

	// Download and Buy are placeholders until the links exist.
	document.addEventListener("click", function (e) {
		var a = e.target.closest && e.target.closest("a[data-placeholder]");
		if (a && /^\[/.test(a.getAttribute("href"))) e.preventDefault();
	});

	// The feature symbols: every state the hover moves through, stacked.
	all(".grid li").forEach(function (li) {
		var names = li.dataset.s.split(" ");
		li.insertAdjacentHTML("afterbegin", '<span class="fx fx-' + li.dataset.fx + '" aria-hidden="true">' +
			names.map(function (n, i) { return '<span class="fx-s fx-s' + i + '">' + sym(n, 34) + "</span>"; }).join("") + "</span>");
	});

	// Load: the page arrives in order, then each block rises as it comes into view.
	requestAnimationFrame(function () { root.classList.add("loaded"); });
	var rv = all(".rv");
	if (!reduced && window.IntersectionObserver) {
		var io = new IntersectionObserver(function (es) {
			es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
		}, { rootMargin: "0px 0px -8% 0px" });
		rv.forEach(function (el) { io.observe(el); });
	} else rv.forEach(function (el) { el.classList.add("in"); });

	// The circle draws itself each time it comes into view.
	var circled = document.querySelector(".circled");
	if (circled && window.IntersectionObserver) {
		new IntersectionObserver(function (es) {
			es.forEach(function (en) { circled.classList.toggle("drawn", en.isIntersecting); });
		}, { threshold: 1 }).observe(circled);
	} else if (circled) circled.classList.add("drawn");

	D.mount(document.getElementById("levo-demo"));

	// The hint under the demo changes once the popover has been opened.
	var hint = document.querySelector("[data-hint]");
	document.getElementById("levo-demo").addEventListener("levo:open", function () {
		if (hint && fine) hint.innerHTML = "Psst&hellip; press &#8984;K up there";
	});
	if (hint && !fine) hint.innerHTML = "Psst&hellip; tap anything up there";

	// ------------------------------------------------------------ Settings preview

	var sw = function (on) { return '<button type="button" class="st-switch" role="switch" aria-checked="' + !!on + '"><i></i></button>'; };
	var pop = function (v, s) { return '<span class="st-pop">' + (s ? sym(s, 13) : "") + "<b>" + esc(v) + "</b>" + sym("chevron.down", 10, "st-sec") + "</span>"; };
	var step = function (v, unit, id, min, max, by) {
		return '<span class="st-stepper"><span class="st-field" data-step="' + (id || "") + '" data-v="' + v + '" data-min="' + (min || 0) + '" data-max="' + (max || 999) + '" data-by="' + (by || 1) + '"><b>' + v + '</b><span class="st-arrows"><button type="button" data-dir="1" aria-label="More"></button><button type="button" data-dir="-1" aria-label="Less"></button>' + sym("chevron.up.chevron.down", 10) + "</span></span>" + (unit ? '<span class="st-unit">' + unit + "</span>" : "") + "</span>";
	};
	var row = function (label, control) { return '<div class="st-row"><span class="st-label">' + label + '</span><span class="st-ctl">' + control + "</span></div>"; };
	var card = function (rows) { return '<div class="st-card">' + rows.join("") + "</div>"; };
	var title = function (t) { return '<div class="st-title">' + t + "</div>"; };

	var AGENTS = [
		{ id: "claude", name: "Claude Code", tint: "#C96442" },
		{ id: "codex", name: "Codex", tint: "#3A7BD5" },
		{ id: "gemini", name: "Gemini CLI", tint: "#7C5CE0" }
	];
	var agent = "claude";

	var PANES = {
		general: function () {
			return card([
				row("Launch at Login", sw(true)),
				row("Levo Hotkey", '<span class="st-hotkey">⌥ ⌘ L</span><span class="st-round">' + sym("arrow.counterclockwise", 12) + "</span>"),
				row("Check Every", pop("1 min")),
				row("Notifications", sw(true))
			]) + title("Appearance") + card([
				row("Menubar Icon", pop("Outline")),
				row("Text Size", '<span class="st-seg st-aa"><button type="button">Aa</button><button type="button" class="is-on">Aa</button><button type="button">Aa</button></span>')
			]);
		},
		agent: function () {
			return '<div class="st-card st-agents">' + AGENTS.map(function (a) {
				return '<button type="button" class="st-agent' + (a.id === agent ? " is-on" : "") + '" data-agent="' + a.id + '" style="--tint:' + a.tint + '"><span class="st-term"><span class="st-dots"><i></i><i></i><i></i></span><code><span>❯</span> ' + a.id + '</code><i class="st-line"></i></span><span class="st-cap">' + (a.id === agent ? "<i></i>" : "") + esc(a.name) + "</span></button>";
			}).join("") + '<span class="st-agent st-custom"><span class="st-term">' + sym("plus", 16) + '</span><span class="st-cap">Custom</span></span></div>' +
			card([
				row("Model", pop("Default", "sparkle")),
				row("Cleanup Level", '<span class="st-seg"><button type="button">Careful</button><button type="button" class="is-on">Balanced</button><button type="button">Thorough</button></span>'),
				row("Limits", step(3, "min", "", 1, 30) + step(20, "turns", "", 5, 100, 5) + step(6, "a day", "", 1, 48)),
				row("Test", '<span class="st-ok" data-test>' + sym("checkmark.circle.fill", 12) + 'Ready · 4.2 s</span><button type="button" class="st-button" data-run>Run Test</button>')
			]) + title("Background") + card([
				row("Analyse Before Alerting", sw(true)),
				row("Pause on Battery Below", step(20, "%", "", 5, 80, 5) + sw(true)),
				row("Add Levo’s Read-only Tools to My Agent", sw(false))
			]);
		},
		protected: function () {
			return title("Your Folders") + card([
				row(sym("folder.fill", 14, "st-sec") + "~/Documents/Clients", '<span class="st-sec">Never indexed</span>'),
				row(sym("folder.fill", 14, "st-sec") + "~/Pictures/Shoots", '<span class="st-sec">Never indexed</span>'),
				row('<span class="st-link">Add Folder…</span>', "")
			]) + title("Never Touched") + card(["Photos", "Mail", "Messages", "iCloud Drive", "Keychains", "~/.ssh"].map(function (n) {
				return row(n, sym("lock.fill", 12, "st-sec"));
			}));
		},
		autoclean: function () {
			return card([
				row("Auto-clean", sw(false)),
				row("When Free Space Is Below", step(10, "GB", "", 5, 100, 5)),
				row("Categories", pop("Regenerable")),
				row("At Most", step(1, "a day", "", 1, 6))
			]);
		},
		access: function () {
			return card([
				row("Full Disk Access", '<span class="st-ok">' + sym("checkmark.circle.fill", 12) + 'Granted</span><button type="button" class="st-button">Open Settings</button>'),
				row("Notifications", '<span class="st-ok">' + sym("checkmark.circle.fill", 12) + "Allowed</span>")
			]);
		},
		disk: function () {
			return card([
				row("Alert Below", step(diskAlert, "GB", "alert", 5, 200, 5)),
				row("Or Below", step(5, "%", "", 1, 50)),
				row("Analyse Early", step(25, "% above", "", 0, 100, 5)),
				row("Notifications", sw(true))
			]);
		},
		memory: function () {
			return card([row("Alert At Pressure", pop("Warning")), row("For", step(5, "min", "", 1, 60)), row("Notifications", sw(true))]);
		},
		cpu: function () {
			return card([row("Total Above", step(80, "%", "", 10, 100, 5)), row("One Process Above", step(90, "%", "", 10, 800, 10)), row("For", step(5, "min", "", 1, 60)), row("Notifications", sw(true))]);
		},
		gpu: function () {
			return card([row("Above", step(80, "%", "", 10, 100, 5)), row("For", step(5, "min", "", 1, 60)), row("Notifications", sw(false))]);
		}
	};

	// The app's Settings panes, with its own symbols and tints.
	var NAV = [
		[["general", "General", "grey", "gearshape.fill"], ["agent", "Agent", "purple", "apple.terminal.fill"], ["protected", "Protected", "green", "checkmark.shield.fill"], ["autoclean", "Auto-clean", "orange", "wand.and.stars", "Pro"], ["access", "Access", "blue", "lock.fill"]],
		[["disk", "Disk", "dark", "internaldrive.fill"], ["memory", "Memory", "teal", "memorychip.fill"], ["cpu", "CPU", "indigo", "cpu.fill"], ["gpu", "GPU", "magenta", "display"]]
	];
	var pane = "agent", diskAlert = D.data.disk.alert;

	function drawSettings() {
		var el = document.getElementById("levo-settings");
		if (!el) return;
		el.innerHTML = '<div class="st-win">' +
			'<aside class="st-side">' +
				'<div class="st-lights" aria-hidden="true"><i></i><i></i><i></i></div>' +
				'<div class="st-search">' + sym("magnifyingglass", 12) + "<span>Search</span></div>" +
				'<div class="st-account"><img src="img/icon-96.png" width="32" height="32" alt=""><span><b>Levo</b><small>Lifetime licence</small></span></div>' +
				NAV.map(function (group) {
					return '<div class="st-group">' + group.map(function (n) {
						return '<button type="button" class="st-nav' + (n[0] === pane ? " is-on" : "") + '" data-pane="' + n[0] + '">' + tile(n[2], n[3]) + "<span>" + n[1] + "</span>" + (n[4] ? '<span class="st-pro">' + n[4] + "</span>" : "") + "</button>";
					}).join("") + "</div>";
				}).join("") +
			"</aside>" +
			'<div class="st-main"><div class="st-bar"><span class="st-backfwd" aria-hidden="true">' + sym("chevron.left", 12) + "<i></i>" + sym("chevron.right", 12) + "</span></div>" +
			'<div class="st-pane">' + PANES[pane]() + "</div></div>" +
		"</div>";
	}

	document.addEventListener("click", function (e) {
		var host = document.getElementById("levo-settings");
		if (!host || !host.contains(e.target)) return;
		var t;
		if ((t = e.target.closest("[data-pane]"))) { pane = t.dataset.pane; drawSettings(); return; }
		if ((t = e.target.closest(".st-switch"))) { t.setAttribute("aria-checked", t.getAttribute("aria-checked") !== "true"); return; }
		if ((t = e.target.closest(".st-seg button"))) {
			all("button", t.parentNode).forEach(function (b) { b.classList.toggle("is-on", b === t); });
			return;
		}
		if ((t = e.target.closest("[data-agent]"))) {
			agent = t.dataset.agent;
			D.setAgent(AGENTS.filter(function (x) { return x.id === agent; })[0].name);
			drawSettings();
			return;
		}
		if ((t = e.target.closest("[data-dir]"))) {
			var f = t.closest("[data-step]");
			var v = Math.max(+f.dataset.min, Math.min(+f.dataset.max, +f.dataset.v + (+t.dataset.dir) * (+f.dataset.by)));
			f.dataset.v = v;
			f.querySelector("b").textContent = v;
			if (f.dataset.step === "alert") { diskAlert = v; D.setAlert(v); }
			return;
		}
		if ((t = e.target.closest("[data-run]"))) {
			var out = host.querySelector("[data-test]");
			out.className = "st-busy";
			out.innerHTML = '<i class="lv-spin"></i>Testing…';
			setTimeout(function () {
				out.className = "st-ok";
				out.innerHTML = sym("checkmark.circle.fill", 12) + "Ready · " + (3 + Math.random() * 2).toFixed(1) + " s";
			}, 1400);
		}
	});

	drawSettings();
})();
