/*
 * The Levo page: appearance, arrival, the step and fact icons, and the Settings
 * preview. The menubar demo itself lives in demo.js.
 */
(function () {
	"use strict";

	var root = document.documentElement;
	var D = window.LevoDemo;
	var media = window.matchMedia("(prefers-color-scheme: dark)");
	var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

	// Icons for the steps and the facts.
	Array.prototype.forEach.call(document.querySelectorAll(".steps li"), function (li) {
		li.insertAdjacentHTML("afterbegin", D.tile(li.dataset.tile, li.dataset.icon, "lg"));
	});
	Array.prototype.forEach.call(document.querySelectorAll(".facts li"), function (li) {
		li.insertAdjacentHTML("afterbegin", '<span class="fact-icon">' + D.icon(li.dataset.icon, 20) + "</span>");
	});

	// Arrival: each block rises a little as it comes into view.
	var rv = document.querySelectorAll(".rv");
	if (!reduced && window.IntersectionObserver) {
		var io = new IntersectionObserver(function (es) {
			es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
		}, { rootMargin: "0px 0px -8% 0px" });
		Array.prototype.forEach.call(rv, function (el) { io.observe(el); });
	} else {
		Array.prototype.forEach.call(rv, function (el) { el.classList.add("in"); });
	}

	D.mount(document.getElementById("levo-demo"));

	// ------------------------------------------------------------ Settings preview

	var icon = D.icon, tile = D.tile;
	function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

	var sw = function (on, id) { return '<button type="button" class="st-switch" role="switch" aria-checked="' + !!on + '" data-sw="' + (id || "") + '"><i></i></button>'; };
	var pop = function (v, ic) { return '<span class="st-pop">' + (ic ? icon(ic, 14) : "") + "<b>" + esc(v) + "</b>" + icon("chevDown", 12, "st-sec") + "</span>"; };
	var step = function (v, unit, id, min, max, by) {
		return '<span class="st-stepper"><span class="st-field" data-step="' + (id || "") + '" data-v="' + v + '" data-min="' + (min || 0) + '" data-max="' + (max || 999) + '" data-by="' + (by || 1) + '"><b>' + v + '</b><span class="st-arrows"><button type="button" data-dir="1" aria-label="More">' + icon("chevDown", 10, "st-up") + '</button><button type="button" data-dir="-1" aria-label="Less">' + icon("chevDown", 10) + "</button></span></span>" + (unit ? '<span class="st-unit">' + unit + "</span>" : "") + "</span>";
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
				row("Levo Hotkey", '<span class="st-hotkey">⌥ ⌘ L</span><span class="st-round">' + icon("reset", 14) + "</span>"),
				row("Check Every", pop("1 min")),
				row("Notifications", sw(true))
			]) + title("Appearance") + card([
				row("Menubar Icon", pop("Outline")),
				row("Text Size", '<span class="st-seg st-aa"><button type="button">Aa</button><button type="button" class="is-on">Aa</button><button type="button">Aa</button></span>')
			]);
		},
		agent: function () {
			return '<div class="st-card st-agents">' + AGENTS.map(function (a) {
				return '<button type="button" class="st-agent' + (a.id === agent ? " is-on" : "") + '" data-agent="' + a.id + '" style="--tint:' + a.tint + '"><span class="st-term"><span class="st-dots"><i></i><i></i><i></i></span><code><span>❯</span> ' + a.id + "</code><i class=\"st-line\"></i></span><span class=\"st-cap\">" + (a.id === agent ? "<i></i>" : "") + esc(a.name) + "</span></button>";
			}).join("") + '<span class="st-agent st-custom"><span class="st-term">' + icon("plus", 18) + '</span><span class="st-cap">Custom</span></span></div>' +
			card([
				row("Model", pop("Default", "sparkle")),
				row("Effort", '<span class="st-seg" data-seg><button type="button">Low</button><button type="button" class="is-on">Medium</button><button type="button">High</button></span>'),
				row("Limits", step(3, "min", "", 1, 30) + step(20, "turns", "", 5, 100, 5) + step(6, "a day", "", 1, 48)),
				row("Test", '<span class="st-ok" data-test>' + icon("checkCircle", 14) + "Ready · 4.2 s</span><button type=\"button\" class=\"st-button\" data-run>Run Test</button>")
			]) + title("Background") + card([
				row("Analyse Before Alerting", sw(true)),
				row("Pause on Battery Below", step(20, "%", "", 5, 80, 5) + sw(true)),
				row("Add Levo’s Read-only Tools to My Agent", sw(false))
			]);
		},
		protected: function () {
			return title("Your Folders") + card([
				row(icon("folder", 16, "st-sec") + "~/Documents/Clients", '<span class="st-sec">Never indexed</span>'),
				row(icon("folder", 16, "st-sec") + "~/Pictures/Shoots", '<span class="st-sec">Never indexed</span>'),
				row('<span class="st-link">Add Folder…</span>', "")
			]) + title("Never Touched") + card(["Photos", "Mail", "Messages", "iCloud Drive", "Keychains", "~/.ssh"].map(function (n) {
				return row(n, icon("lock", 14, "st-sec"));
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
				row("Full Disk Access", '<span class="st-ok">' + icon("checkCircle", 14) + 'Granted</span><button type="button" class="st-button">Open Settings</button>'),
				row("Notifications", '<span class="st-ok">' + icon("checkCircle", 14) + "Allowed</span>")
			]);
		},
		disk: function () {
			return card([
				row("Alert Below", step(D.data.disk.alert, "GB", "alert", 5, 200, 5)),
				row("Or Below", step(5, "%", "", 1, 50)),
				row("Analyse Early", step(25, "% above", "", 0, 100, 5)),
				row("Notifications", sw(true))
			]);
		},
		memory: function () {
			return card([
				row("Alert At Pressure", pop("Warning")),
				row("For", step(5, "min", "", 1, 60)),
				row("Notifications", sw(true))
			]);
		},
		cpu: function () {
			return card([
				row("Total Above", step(80, "%", "", 10, 100, 5)),
				row("One Process Above", step(90, "%", "", 10, 800, 10)),
				row("For", step(5, "min", "", 1, 60)),
				row("Notifications", sw(true))
			]);
		},
		gpu: function () {
			return card([
				row("Above", step(80, "%", "", 10, 100, 5)),
				row("For", step(5, "min", "", 1, 60)),
				row("Notifications", sw(false))
			]);
		}
	};

	var NAV = [
		[["general", "General", "grey", "gear"], ["agent", "Agent", "purple", "terminal"], ["protected", "Protected", "green", "shield"], ["autoclean", "Auto-clean", "orange", "wand", "Pro"], ["access", "Access", "blue", "lock"]],
		[["disk", "Disk", "dark", "drive"], ["memory", "Memory", "teal", "memory"], ["cpu", "CPU", "indigo", "cpu"], ["gpu", "GPU", "magenta", "gpu"]]
	];
	var pane = "agent", diskAlert = D.data.disk.alert;

	function drawSettings() {
		var el = document.getElementById("levo-settings");
		if (!el) return;
		el.innerHTML = '<div class="st-win">' +
			'<aside class="st-side">' +
				'<div class="st-lights" aria-hidden="true"><i></i><i></i><i></i></div>' +
				'<div class="st-search">' + icon("search", 14) + "<span>Search</span></div>" +
				'<div class="st-account"><img src="img/icon-96.png" width="32" height="32" alt=""><span><b>Levo</b><small>Licensed</small></span></div>' +
				NAV.map(function (group) {
					return '<div class="st-group">' + group.map(function (n) {
						return '<button type="button" class="st-nav' + (n[0] === pane ? " is-on" : "") + '" data-pane="' + n[0] + '">' + tile(n[2], n[3]) + "<span>" + n[1] + "</span>" + (n[4] ? '<span class="st-pro">' + n[4] + "</span>" : "") + "</button>";
					}).join("") + "</div>";
				}).join("") +
			"</aside>" +
			'<div class="st-main"><div class="st-bar"><span class="st-backfwd" aria-hidden="true">' + icon("chevLeft", 14) + "<i></i>" + icon("chevRight", 14) + "</span></div>" +
			'<div class="st-pane">' + PANES[pane]() + "</div></div>" +
		"</div>";
		var alertStep = el.querySelector('[data-step="alert"]');
		if (alertStep) { alertStep.dataset.v = diskAlert; alertStep.querySelector("b").textContent = diskAlert; }
	}

	document.addEventListener("click", function (e) {
		var host = document.getElementById("levo-settings");
		if (!host || !host.contains(e.target)) return;
		var t;
		if ((t = e.target.closest("[data-pane]"))) { pane = t.dataset.pane; drawSettings(); return; }
		if ((t = e.target.closest(".st-switch"))) { t.setAttribute("aria-checked", t.getAttribute("aria-checked") !== "true"); return; }
		if ((t = e.target.closest(".st-seg button"))) {
			Array.prototype.forEach.call(t.parentNode.children, function (b) { b.classList.toggle("is-on", b === t); });
			return;
		}
		if ((t = e.target.closest("[data-agent]"))) {
			agent = t.dataset.agent;
			var a = AGENTS.filter(function (x) { return x.id === agent; })[0];
			D.setAgent(a.name);
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
				out.innerHTML = icon("checkCircle", 14) + "Ready · " + (3 + Math.random() * 2).toFixed(1) + " s";
			}, 1400);
		}
	});

	drawSettings();
})();
