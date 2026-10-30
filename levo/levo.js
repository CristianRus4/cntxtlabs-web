/*
 * The Levo page: the price, appearance, the load sequence and arrivals, the
 * feature symbols and their hovers, the navbar, and the Settings preview. The
 * menubar demo lives in demo.js, its menus in menus.js.
 */
(function () {
	"use strict";

	// Price and links, in one place. The buttons, the Levo window, the desktop notes and
	// the agents' install prompt all read from here. The price is the fallback; the live
	// price (priceURL) replaces it once it loads. It rises $5 every 10 licences, $4.99 to $49.99.
	var LEVO = {
		price: "$4.99",
		priceURL: "https://levo-price-live.cristianrus.workers.dev/levo/price.json",
		tiers: { first: 4.99, step: 5, last: 49.99, every: 10 },
		left: null, // "N left at $4.99" once the Worker gives the count and the owner wants it shown
		term: "once",
		download: "https://github.com/CristianRus4/cntxtlabs-web/releases/download/levo-v2026.11/Levo.dmg",
		buy: "https://buy.polar.sh/polar_cl_ACu47aORELy2GDDlJLR8s8ygIUCYfSlPLDwVu0696R3",
		agents: "https://cntxtlabs.co/levo/agents.md",
		privacy: "../levo/legal/#privacy",
		terms: "../levo/legal/#terms",
		team: "5X94H5ZCD4"
	};

	var root = document.documentElement;
	var D = window.LevoDemo;
	var sym = D.sym, tile = D.tile;
	var media = window.matchMedia("(prefers-color-scheme: dark)");
	var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
	function all(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
	function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
	function placeholder(url) { return /^\[/.test(url); }

	all("[data-term]").forEach(function (el) { el.textContent = LEVO.term; });
	all("[data-buy]").forEach(function (a) { a.href = LEVO.buy; if (placeholder(LEVO.buy)) a.setAttribute("data-placeholder", ""); });

	// The price and everything that names it: the big price, the Buy buttons, the Levo window in
	// the demo, and the tiers (ten rising columns, those passed and the current one in the accent, its price above, the ends under).
	function money(n) { return "$" + n.toFixed(2); }
	function showPrice() {
		var T = LEVO.tiers, now = parseFloat(LEVO.price.replace(/[^0-9.]/g, ""));
		var steps = Math.round((T.last - T.first) / T.step), at = Math.max(0, Math.min(steps, Math.round((now - T.first) / T.step)));
		all("[data-price], [data-lprice]").forEach(function (el) { el.textContent = LEVO.price; });
		all("[data-buy], [data-lbuy]").forEach(function (a) { a.textContent = "Buy for " + LEVO.price; });
		all("[data-tiers-bar]").forEach(function (bar) {
			var html = "";
			for (var i = 0; i <= steps; i++) {
				html += '<i style="--i:' + i + ";height:" + Math.round(18 + i / steps * 66) + 'px"' + (i < at ? ' class="is-past"' : i === at ? ' class="is-now"' : "") + ">" +
					(i === at ? "<b>" + LEVO.price + "</b>" : "") + "</i>";
			}
			bar.innerHTML = '<span class="tiers-steps">' + html + '</span><span class="tiers-ends"><span>' + money(T.first) + "</span><span>" + money(T.last) + "</span></span>";
			bar.setAttribute("aria-label", "The price rises from " + money(T.first) + " to " + money(T.last) + ". It is " + LEVO.price + " now.");
		});
		var next = at < steps ? money(T.first + (at + 1) * T.step) : null;
		all("[data-tiers-next]").forEach(function (el) { el.hidden = !next; });
		all("[data-next]").forEach(function (el) { el.textContent = next ? "Then " + next + "." : ""; });
		all("[data-left]").forEach(function (el) { el.hidden = !LEVO.left; el.textContent = LEVO.left || ""; });
		if (window.LevoDemo && demoOpts) demoOpts.price = LEVO.price;
	}
	var demoOpts = null;
	showPrice();
	// The live price, if it comes in time; otherwise the fallback stays.
	if (window.fetch) {
		var ctl = window.AbortController ? new AbortController() : null;
		if (ctl) setTimeout(function () { ctl.abort(); }, 5000);
		fetch(LEVO.priceURL, ctl ? { signal: ctl.signal } : {}).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
			var n = d && typeof d.price === "number" ? d.price : NaN;
			if (n >= LEVO.tiers.first && n <= LEVO.tiers.last) { LEVO.price = money(n); showPrice(); }
		}).catch(function () {});
	}
	all("[data-download]").forEach(function (a) { a.href = LEVO.download; if (placeholder(LEVO.download)) a.setAttribute("data-placeholder", ""); else a.setAttribute("download", ""); });
	all("[data-privacy]").forEach(function (a) { a.href = LEVO.privacy; if (placeholder(LEVO.privacy)) a.setAttribute("data-placeholder", ""); });
	all("[data-terms]").forEach(function (a) { a.href = LEVO.terms; if (placeholder(LEVO.terms)) a.setAttribute("data-placeholder", ""); });
	all("[data-sym]").forEach(function (el) { el.innerHTML = sym(el.dataset.sym, +el.dataset.size || 16); });

	// Appearance follows the system. The one switch is an easter egg (Control
	// Centre or System Settings in the demo), and it is never saved: a reload
	// follows the device again.
	function applyTheme() {
		var t = root.getAttribute("data-theme");
		root.classList.toggle("dark", t ? t === "dark" : media.matches);
	}
	function setTheme(mode) {
		if (mode === "light" || mode === "dark") root.setAttribute("data-theme", mode); else root.removeAttribute("data-theme");
		applyTheme();
	}
	function theme() { return root.getAttribute("data-theme") || "auto"; }
	if (media.addEventListener) media.addEventListener("change", applyTheme);

	// The navbar takes a material background once the page scrolls.
	var nav = document.querySelector("[data-nav]");
	if (nav) {
		var onScroll = function () { nav.classList.toggle("is-scrolled", window.scrollY > 4); };
		window.addEventListener("scroll", onScroll, { passive: true });
		onScroll();
	}

	// Download and Buy are placeholders until the links exist.
	// Download starts the real download at once (a normal browser download) and
	// plays it in the simulated Mac; while the link is a placeholder, only the animation.
	document.addEventListener("click", function (e) {
		var a = e.target.closest && e.target.closest("a[data-placeholder]");
		if (a) e.preventDefault();
		var dl = e.target.closest && e.target.closest("a[data-download]");
		if (dl && window.LevoDemo && LevoDemo.download) LevoDemo.download(dl);
	});

	// Arrivals: each block rises a little as it comes into view.
	var rv = all(".rv");
	if (!reduced && window.IntersectionObserver) {
		var io = new IntersectionObserver(function (es) {
			es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
		}, { rootMargin: "0px 0px -8% 0px" });
		rv.forEach(function (el) { io.observe(el); });
	} else rv.forEach(function (el) { el.classList.add("in"); });

	// The hand-drawn mark draws itself each time it comes into view.
	all(".circled").forEach(function (c) {
		if (!window.IntersectionObserver) { c.classList.add("drawn"); return; }
		new IntersectionObserver(function (es) {
			es.forEach(function (en) { c.classList.toggle("drawn", en.isIntersecting); });
		}, { threshold: 1 }).observe(c);
	});

	demoOpts = {
		price: LEVO.price, term: LEVO.term, download: LEVO.download, buy: LEVO.buy,
		setTheme: setTheme, theme: theme
	};
	D.mount(document.getElementById("levo-demo"), demoOpts);

	// "Click here": the arrow's tip sits just above the frame, over Levo's menubar icon; it fades
	// once the visitor clicks that icon.
	var cue = document.querySelector("[data-cue]");
	function placeCue() {
		var icon = document.querySelector(".lv-mb-levo .lv-mb-mark") || document.querySelector(".lv-mb-levo"), first = cue && cue.parentNode, scene = document.querySelector(".lv-scene");
		if (!cue || !icon || !scene || cue.classList.contains("is-done") || scene.dataset.mode !== "desk") return;
		var f = first.getBoundingClientRect(), r = icon.getBoundingClientRect(), sc = scene.getBoundingClientRect();
		var tipX = 151, tipY = 92; // the arrow's tip in the cue's own box (index.html's SVG)
		cue.style.left = Math.round(r.left + r.width / 2 - f.left - tipX) + "px";
		cue.style.top = Math.round(sc.top - f.top - tipY - 4) + "px";
		cue.classList.add("is-placed");
	}
	if (cue) {
		var settle = function () { requestAnimationFrame(placeCue); };
		window.addEventListener("resize", settle);
		if (document.fonts && document.fonts.ready) document.fonts.ready.then(settle);
		setTimeout(settle, 300);
		setTimeout(settle, 1800);
		document.addEventListener("click", function (e) {
			if (e.target.closest && e.target.closest(".lv-mb-levo")) { cue.classList.add("is-done"); setTimeout(function () { cue.hidden = true; }, 500); }
		});
	}

	// ------------------------------------------------------------ Agents

	// One click copies a short prompt that has the agent install Levo.
	var CLIS = [
		{ name: "Claude Code", cli: "claude", tile: "orange" },
		{ name: "Codex", cli: "codex", tile: "blue" },
		{ name: "Gemini CLI", cli: "gemini", tile: "indigo" },
		{ name: "Cursor CLI", cli: "cursor-agent", tile: "dark" },
		{ name: "GitHub Copilot CLI", cli: "copilot", tile: "purple" },
		{ name: "opencode", cli: "opencode", tile: "grey" },
		{ name: "Qwen Code", cli: "qwen", tile: "magenta" },
		{ name: "Kimi CLI", cli: "kimi", tile: "teal" },
		{ name: "Grok CLI", cli: "grok", tile: "red" },
		{ name: "Any CLI", cli: "your-agent", tile: "grey", any: true }
	];
	function prompt() {
		return "Install Levo, a Mac menubar app, for me.\n" +
			"1. Read " + LEVO.agents + " first.\n" +
			"2. Download Levo from " + LEVO.download + ".\n" +
			"3. Check it is signed and notarised by Cntxt Labs: run `spctl -a -vv` on Levo.app and confirm team ID " + LEVO.team + ". Stop and tell me if it isn't.\n" +
			"4. Move Levo.app to /Applications and open it.\n" +
			"5. Tell me to finish Levo's welcome window myself.\n" +
			"Change nothing else.";
	}
	function copy(text) {
		if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
		return new Promise(function (ok, no) {
			var t = document.createElement("textarea");
			t.value = text; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
			document.body.appendChild(t); t.select();
			try { document.execCommand("copy") ? ok() : no(); } catch (e) { no(e); }
			document.body.removeChild(t);
		});
	}
	// The round 2 layout: the CLIs as chips. A click copies the prompt; a toast says so.
	var toastTimer = null;
	function drawAgents() {
		var el = document.getElementById("levo-agents");
		if (!el) return;
		// The chips; a click copies the prompt and shows it.
		el.innerHTML = '<ul class="chips">' + CLIS.map(function (a, i) {
			return '<li><button type="button" class="chip' + (a.any ? " chip-any" : "") + '" data-ag="' + i + '" title="' + esc(a.name) + '"><span class="chip-p" aria-hidden="true">\u276f</span>' + esc(a.cli === "your-agent" ? "any CLI" : a.cli) + "</button></li>";
		}).join("") + '</ul><div class="toast" data-toast role="status" aria-live="polite" hidden></div>' +
			'<figure class="ag-prompt" data-prompt hidden><figcaption data-prompt-for></figcaption><pre data-prompt-text></pre></figure>';
	}
	function copyFor(a) {
		if (!a) return;
		var t = document.querySelector("[data-toast]");
		var said = a.any ? "your agent" : a.name;
		var done = function (ok) {
			clearTimeout(toastTimer);
			t.innerHTML = ok
				? sym("checkmark.circle.fill", 15, "toast-ok") + "<span><b>Copied.</b> Paste it into " + esc(said) + " and it\u2019ll do the rest.</span>"
				: sym("exclamationmark.triangle.fill", 15, "toast-warn") + "<span><b>Couldn\u2019t copy.</b></span>";
			t.hidden = false;
			t.classList.remove("in"); void t.offsetWidth; t.classList.add("in");
			toastTimer = setTimeout(function () { t.classList.remove("in"); setTimeout(function () { t.hidden = true; }, 250); }, 4200);
		};
		// What's on the clipboard, shown so the visitor sees what they paste.
		var box = document.querySelector("[data-prompt]");
		if (box) {
			box.querySelector("[data-prompt-for]").textContent = a.any ? "Any CLI" : a.name;
			box.querySelector("[data-prompt-text]").textContent = prompt();
			var first = box.hidden;
			box.hidden = false;
			if (first) { box.classList.remove("in"); void box.offsetWidth; box.classList.add("in"); }
			Array.prototype.forEach.call(document.querySelectorAll("[data-ag]"), function (x) { x.classList.toggle("is-on", x.dataset.ag === String(CLIS.indexOf(a))); });
		}
		copy(prompt()).then(function () { done(true); }, function () { done(false); });
	}
	document.addEventListener("click", function (e) {
		var b = e.target.closest && e.target.closest("[data-ag]");
		if (b) copyFor(CLIS[+b.dataset.ag]);
	});
	drawAgents();

	// ------------------------------------------------------------ Settings

	// The app's Settings window, round 5 (settings.js). Choosing an agent or the
	// disk alert there changes the demo above.
	// Switched off for now; set to true to bring the Settings section back.
	var SHOW_SETTINGS = false;
	var settingsSection = document.getElementById("settings");
	if (settingsSection) settingsSection.hidden = !SHOW_SETTINGS;
	if (SHOW_SETTINGS && window.LevoSettings) LevoSettings.mount(document.getElementById("levo-settings"), {
		sym: sym, tile: tile, iconUrl: "img/icon-96.png", pane: "agent",
		alert: D.data.disk.alert,
		setAgent: function (name) { D.setAgent(name); },
		setAlert: function (gb) { D.setAlert(gb); }
	});
})();
