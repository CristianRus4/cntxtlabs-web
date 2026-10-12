/* cntxt · cntxtlabs.co
   The one script every page shares. Loaded with defer from the head, so it
   runs once the page is parsed. It sits at the site root, which is how it
   knows where home is from any page. 404.html keeps its own. */

(function () {
	var script = document.currentScript;
	var HOME = script ? new URL("./", script.src).href : "/";
	var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	var root = document.documentElement;
	var EMAIL = "info@cntxtlabs.co";
	var typing = function (t) {
		return t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
	};

	// Copyright year.
	var y = new Date().getFullYear();
	document.querySelectorAll(".year").forEach(function (e) { e.textContent = y; });

	// What kind of company, decided fresh on every load. Click for another.
	var words = [
		"software", "product", "design-led", "creative", "meaningful",
		"frontier", "curious", "stubborn", "craft-first", "thoughtful",
		"small but busy", "ambitious", "restless", "inventive", "modern",
		"focused", "bold", "playful", "contrarian", "relentless"
	];
	// One load in twenty-five gets something it should not admit to.
	var rare = ["caffeinated", "nocturnal", "occasionally brilliant",
		"over-engineered", "jet-lagged"];
	var el = document.getElementById("descriptor");
	if (el) {
		var current = -1;
		var busy = false;
		var article = function (w) { return /^[aeiou]/i.test(w) ? "An" : "A"; };
		var pick = function () {
			if (Math.random() < 0.04) return rare[Math.floor(Math.random() * rare.length)];
			var i = current;
			while (i === current) i = Math.floor(Math.random() * words.length);
			current = i;
			return words[i];
		};
		var set = function (w) {
			var word = document.createElement("em");
			word.textContent = w;
			el.replaceChildren(document.createTextNode(article(w) + " "), word);
		};
		set(pick());

		// The old word lifts away and the new one rises into its place.
		var cycle = function (ev) {
			if (ev.type === "keydown" && ev.key !== "Enter" && ev.key !== " ") return;
			ev.preventDefault();
			if (reduce || !el.animate) { set(pick()); return; }
			if (busy) return;
			busy = true;
			el.animate([
				{ opacity: 1, transform: "none" },
				{ opacity: 0, transform: "translateY(-0.3em)" }
			], { duration: 110, easing: "ease-in" }).onfinish = function () {
				set(pick());
				el.animate([
					{ opacity: 0, transform: "translateY(0.35em)" },
					{ opacity: 1, transform: "none" }
				], { duration: 260, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }).onfinish = function () {
					busy = false;
				};
			};
		};
		el.addEventListener("click", cycle);
		el.addEventListener("keydown", cycle);
	}

	// The time where it is made, revealed with the rest of the footer line.
	var t = document.getElementById("nztime");
	if (t) {
		var tick = function () {
			var now = new Date().toLocaleTimeString("en-NZ", {
				timeZone: "Pacific/Auckland", hour: "numeric", minute: "2-digit"
			});
			t.textContent = ", where it is " + now.toLowerCase().replace(/\s/g, "");
		};
		tick();
		setInterval(tick, 20000);
	}

	// The mark follows the pointer. Only the mark is told, and at most once
	// a frame, so the rest of the page is never restyled by a moving mouse.
	var mark = document.querySelector(".mark");
	if (mark && !reduce && window.matchMedia("(hover: hover)").matches) {
		var px = 0, py = 0, queued = false;
		var look = function () {
			queued = false;
			var dx = px / window.innerWidth - 0.5;
			var dy = py / window.innerHeight - 0.5;
			mark.style.setProperty("--look-x", (dx * 10).toFixed(2) + "px");
			mark.style.setProperty("--look-y", (dy * 8).toFixed(2) + "px");
			mark.style.setProperty("--look-r", (dx * 14).toFixed(2) + "deg");
		};
		window.addEventListener("pointermove", function (e) {
			px = e.clientX;
			py = e.clientY;
			if (!queued) { queued = true; requestAnimationFrame(look); }
		}, { passive: true });
	}

	var flash = function (cls, ms) {
		root.classList.remove(cls);
		void root.offsetWidth;
		root.classList.add(cls);
		setTimeout(function () { root.classList.remove(cls); }, ms);
	};

	// Things you can type. Nothing is announced anywhere.
	var typed = "";
	var konami = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft",
		"ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
	var kAt = 0;
	var goTo = null;

	document.addEventListener("keydown", function (e) {
		if (e.metaKey || e.ctrlKey || e.altKey) return;
		if (typing(e.target)) return;

		// The old one. Turns the page over for a moment.
		if (e.key === konami[kAt] || (konami[kAt].length === 1 && e.key.toLowerCase() === konami[kAt])) {
			kAt++;
			if (kAt === konami.length) { kAt = 0; flash("flip", 8000); }
		} else {
			kAt = (e.key === konami[0]) ? 1 : 0;
		}

		if (e.key.length !== 1) return;
		var ch = e.key.toLowerCase();

		// g, then a letter, goes somewhere.
		if (goTo) {
			clearTimeout(goTo);
			goTo = null;
			var dest = { h: "", c: "contact/", a: "appstore/" };
			if (ch in dest) { window.location.href = HOME + dest[ch]; return; }
		}
		if (ch === "g") { goTo = setTimeout(function () { goTo = null; }, 900); return; }

		typed = (typed + ch).slice(-8);

		// The name of the company. Everything hiding shows itself.
		if (typed.slice(-5) === "cntxt") { typed = ""; flash("egg", 5200); return; }

		// Give the place its other name, for good.
		if (typed.slice(-4) === "kiwi") {
			typed = "";
			document.querySelectorAll(".strike").forEach(function (n) { n.textContent = "Aotearoa"; });
		}
	});

	// A press of the space bar at the end of the page, and it rains squares.
	// Anywhere else the space bar keeps its job and scrolls the page.
	// Every press starts its own fall. Old layers are capped so holding
	// the key down cannot pile up forever.
	var layers = [];
	var rain = function () {
		var layer = document.createElement("div");
		layer.className = "confetti";
		for (var i = 0; i < 150; i++) {
			var bit = document.createElement("i");
			var size = 5 + Math.random() * 7;
			bit.style.left = (Math.random() * 100).toFixed(2) + "vw";
			bit.style.width = bit.style.height = size.toFixed(1) + "px";
			bit.style.animationDuration = (1500 + Math.random() * 1500).toFixed(0) + "ms";
			bit.style.animationDelay = (Math.random() * 400).toFixed(0) + "ms";
			bit.style.opacity = (0.5 + Math.random() * 0.5).toFixed(2);
			bit.style.setProperty("--drift", ((Math.random() * 2 - 1) * 150).toFixed(0) + "px");
			bit.style.setProperty("--spin", (Math.random() * 900 - 450).toFixed(0) + "deg");
			layer.appendChild(bit);
		}
		document.body.appendChild(layer);
		layers.push(layer);
		while (layers.length > 6) layers.shift().remove();
		setTimeout(function () {
			layer.remove();
			var at = layers.indexOf(layer);
			if (at > -1) layers.splice(at, 1);
		}, 3600);
	};
	var atEnd = function () {
		return window.innerHeight + window.scrollY >= root.scrollHeight - 2;
	};

	document.addEventListener("keydown", function (e) {
		if (e.code !== "Space" && e.key !== " ") return;
		if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
		var t = e.target;
		if (typing(t)) return;
		if (t && t.closest && t.closest("[role='button'], button")) return;
		if (!atEnd()) return;
		e.preventDefault();
		if (!reduce) rain();
	});

	// Left alone long enough, the mark comes out on its own.
	var idle = null;
	var wake = function () {
		root.classList.remove("idle");
		clearTimeout(idle);
		idle = setTimeout(function () { root.classList.add("idle"); }, 90000);
	};
	["pointermove", "pointerdown", "keydown", "scroll", "touchstart"].forEach(function (ev) {
		window.addEventListener(ev, wake, { passive: true });
	});
	wake();

	// On a phone there is no hover, so a tap opens a reveal and another
	// closes it. The wordmark is also the link home: the first tap says its
	// name in full and the second follows it. On the home page, where the
	// link would only reload the page, it just opens and closes.
	if (window.matchMedia("(hover: none)").matches) {
		document.querySelectorAll(".reveals").forEach(function (el) {
			el.addEventListener("click", function (e) {
				if (el.matches("a")) {
					var here = el.href.split("#")[0] === window.location.href.split("#")[0];
					if (!here && el.classList.contains("open")) return;
					e.preventDefault();
					el.classList.toggle("open");
					return;
				}
				if (e.target.closest && e.target.closest("a")) return;
				el.classList.toggle("open");
			});
		});
	}

	// Home page figures. They count up on arrival, and again when pointed at.
	(function () {
		var day = 86400000;
		var since = function (y, m, d) {
			return Math.max(0, Math.floor((Date.now() - Date.UTC(y, m, d)) / day));
		};

		// Month on month growth, scheduled out to the end of 2028.
		var growth = {
			"2026-08": 22, "2026-09": 14, "2026-10": 31, "2026-11": 9, "2026-12": 27,
			"2027-01": 18, "2027-02": 11, "2027-03": 24, "2027-04": 7, "2027-05": 16,
			"2027-06": 29, "2027-07": 12, "2027-08": 21, "2027-09": 9, "2027-10": 17,
			"2027-11": 26, "2027-12": 13,
			"2028-01": 15, "2028-02": 8, "2028-03": 19, "2028-04": 11, "2028-05": 23,
			"2028-06": 9, "2028-07": 14, "2028-08": 18, "2028-09": 7, "2028-10": 16,
			"2028-11": 21, "2028-12": 12
		};
		var pct = (function () {
			var now = new Date();
			var key = now.getFullYear() + "-" + ("0" + (now.getMonth() + 1)).slice(-2);
			var keys = Object.keys(growth);
			var v = growth[key];
			if (v === undefined) v = growth[key < keys[0] ? keys[0] : keys[keys.length - 1]];
			return v;
		})();

		var figures = [
			// id, final value, how far back to count from, suffix
			// 1,760,542 on 20 August 2026, growing by 300 a day.
			["downloads", 1760542 + since(2026, 7, 20) * 300, 2400, ""],
			// 1,737 on 20 August 2026, growing by 8 a day.
			["contributions", 1737 + since(2026, 7, 20) * 8, 40, ""],
			["growth", pct, pct, "%"]
		];

		var fmt = function (n, suffix) { return n.toLocaleString("en-US") + suffix; };

		figures.forEach(function (f) {
			var id = f[0], total = f[1], back = f[2], suffix = f[3];
			var el = document.getElementById(id);
			if (!el) return;

			// Reserve the final width up front. Nothing after the number moves
			// while it counts, whatever the digits do.
			el.textContent = fmt(total, suffix);
			el.style.minWidth = el.getBoundingClientRect().width + "px";
			if (reduce) return;

			var running = false;
			var run = function () {
				if (running) return;
				running = true;
				var from = total - back, t0 = null, ms = 1400;
				requestAnimationFrame(function step(t) {
					if (t0 === null) t0 = t;
					var q = Math.min(1, (t - t0) / ms);
					var eased = 1 - Math.pow(1 - q, 3);
					el.textContent = fmt(Math.round(from + (total - from) * eased), suffix);
					if (q < 1) requestAnimationFrame(step);
					else running = false;
				});
			};

			run();

			// Point at one, or tap it, and it counts again.
			var metric = el.closest(".metric");
			if (metric) {
				metric.addEventListener("mouseenter", run);
				metric.addEventListener("click", run);
			}
		});
	})();

	// Appearance, if chosen by hand. The head of every page applies a stored
	// choice before anything is drawn; this keeps the browser bars in step.
	var metas = document.querySelectorAll('meta[name="theme-color"]');
	var system = [].map.call(metas, function (m) { return m.content; });
	var paint = function () {
		var t = root.getAttribute("data-theme");
		metas.forEach(function (m, i) {
			m.content = t ? (t === "dark" ? "#070707" : "#F7F7F7") : system[i];
		});
	};
	var looksDark = function () {
		var t = root.getAttribute("data-theme");
		return t ? t === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
	};
	var setTheme = function (t) {
		try {
			if (t) localStorage.setItem("theme", t);
			else localStorage.removeItem("theme");
		} catch (err) {}
		if (t) root.setAttribute("data-theme", t);
		else root.removeAttribute("data-theme");
		paint();
	};
	paint();

	// Copy, where the browser allows it. The button stays hidden otherwise.
	var copy = function (text) {
		return navigator.clipboard.writeText(text);
	};
	var canCopy = !!(navigator.clipboard && window.isSecureContext);
	document.querySelectorAll("[data-copy]").forEach(function (b) {
		if (!canCopy) return;
		(b.closest(".action") || b).hidden = false;
		var label = b.textContent;
		b.addEventListener("click", function () {
			copy(b.getAttribute("data-copy")).then(function () {
				b.textContent = "Copied";
				setTimeout(function () { b.textContent = label; }, 1600);
			}, function () {});
		});
	});

	// The menu. Command K, Control K or a slash, from anywhere. Type to
	// narrow it, arrows to move, return to go, escape to leave.
	var menu = null, input = null, list = null, shown = [], at = 0;
	var items = function () {
		var go = function (path) { return function () { window.location.href = HOME + path; }; };
		var out = [
			{ name: "Home", hint: "Apps", find: "index start", run: go("") },
			{ name: "About", hint: "Page", find: "company founder story", run: go("about/") },
			{ name: "Left", hint: "iPhone, iPad, Watch", find: "time habits", run: go("left/") },
			{ name: "SafePlate", hint: "Web, Android, iPhone", find: "food kitchen", run: go("safeplate/") },
			{ name: "KiwiCamping & AussieCamps", hint: "iPhone, iPad", find: "camping", run: go("camping/") },
			{ name: "KiwiCamping", hint: "New Zealand", find: "camping nz", run: go("kiwicamping/") },
			{ name: "AussieCamps", hint: "Australia", find: "camping", run: go("aussiecamps/") },
			{ name: "txtpod", hint: "iPhone, iPad, web", find: "podcast audio", run: go("txtpod/") },
			{ name: "NoSnus", hint: "iPhone, iPad", find: "quit pouches", run: go("nosnus/") },
			{ name: "Contact", hint: "Page", find: "email support press", run: go("contact/") },
			{ name: "Write an email", hint: EMAIL, find: "mail contact", run: function () { window.location.href = "mailto:" + EMAIL; } }
		];
		if (canCopy) out.push({ name: "Copy the email address", hint: EMAIL, find: "mail", run: function (li) {
			copy(EMAIL).then(function () {
				li.querySelector(".name").textContent = "Copied";
				setTimeout(close, 700);
			}, function () {});
			return true;
		} });
		var dark = looksDark();
		out.push({ name: dark ? "Light appearance" : "Dark appearance", hint: "Appearance", find: "theme mode colour color", run: function () { setTheme(dark ? "light" : "dark"); } });
		if (root.hasAttribute("data-theme")) out.push({ name: "Match the system appearance", hint: "Appearance", find: "theme mode auto", run: function () { setTheme(null); } });
		out.push({ name: "Apps on the App Store", hint: "Apple", find: "download ios", run: go("appstore/") });
		return out;
	};
	var select = function (i) {
		var rows = list.children;
		if (!shown.length) return;
		at = (i + shown.length) % shown.length;
		for (var n = 0; n < rows.length; n++) rows[n].setAttribute("aria-selected", n === at ? "true" : "false");
		input.setAttribute("aria-activedescendant", "menu-" + at);
		rows[at].scrollIntoView({ block: "nearest" });
	};
	var render = function () {
		var words = input.value.toLowerCase().split(/\s+/).filter(Boolean);
		shown = items().filter(function (it) {
			var hay = (it.name + " " + it.hint + " " + it.find).toLowerCase();
			return words.every(function (w) { return hay.indexOf(w) > -1; });
		});
		list.replaceChildren();
		shown.forEach(function (it, i) {
			var li = document.createElement("li");
			var name = document.createElement("span");
			var hint = document.createElement("span");
			li.id = "menu-" + i;
			li.setAttribute("role", "option");
			name.className = "name";
			name.textContent = it.name;
			hint.className = "hint";
			hint.textContent = it.hint;
			li.append(name, hint);
			li.addEventListener("pointermove", function () { if (at !== i) select(i); });
			li.addEventListener("click", function () { act(i); });
			list.appendChild(li);
		});
		if (!shown.length) {
			var none = document.createElement("li");
			none.className = "empty";
			none.textContent = "Nothing by that name. Try another word.";
			list.appendChild(none);
			input.removeAttribute("aria-activedescendant");
			return;
		}
		select(0);
	};
	var act = function (i) {
		var it = shown[i];
		if (!it) return;
		if (it.run(list.children[i]) !== true) close();
	};
	var build = function () {
		menu = document.createElement("dialog");
		menu.className = "menu";
		menu.setAttribute("aria-label", "Menu");
		var column = document.createElement("div");
		column.className = "menu-column";
		input = document.createElement("input");
		input.type = "text";
		input.placeholder = "Go to a page, or type what you need";
		input.setAttribute("aria-label", "Menu");
		input.setAttribute("role", "combobox");
		input.setAttribute("aria-expanded", "true");
		input.setAttribute("aria-controls", "menu-list");
		input.setAttribute("autocomplete", "off");
		input.setAttribute("spellcheck", "false");
		list = document.createElement("ul");
		list.id = "menu-list";
		list.setAttribute("role", "listbox");
		column.append(input, list);
		menu.appendChild(column);
		document.body.appendChild(menu);

		input.addEventListener("input", render);
		input.addEventListener("keydown", function (e) {
			if (e.key === "ArrowDown") { e.preventDefault(); select(at + 1); }
			else if (e.key === "ArrowUp") { e.preventDefault(); select(at - 1); }
			else if (e.key === "Enter") { e.preventDefault(); act(at); }
		});
		// A click on the empty page around the list puts it away.
		menu.addEventListener("click", function (e) {
			if (e.target === menu || e.target === column) close();
		});
	};
	var open = function () {
		if (!window.HTMLDialogElement) return;
		if (!menu) build();
		if (menu.open) return;
		input.value = "";
		render();
		menu.showModal();
		input.focus();
	};
	var close = function () {
		if (menu && menu.open) menu.close();
	};

	document.addEventListener("keydown", function (e) {
		var k = e.key && e.key.toLowerCase();
		if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && k === "k") {
			e.preventDefault();
			if (menu && menu.open) close(); else open();
			return;
		}
		if (k === "/" && !e.metaKey && !e.ctrlKey && !e.altKey && !typing(e.target)) {
			e.preventDefault();
			open();
		}
	});

	// Pages a pointer settles on are fetched ahead, so the next page is
	// already here when it is clicked. Chromium only; others ignore it.
	if (window.HTMLScriptElement && HTMLScriptElement.supports && HTMLScriptElement.supports("speculationrules")) {
		var rules = document.createElement("script");
		rules.type = "speculationrules";
		rules.textContent = JSON.stringify({
			prefetch: [{ where: { href_matches: "/*" }, eagerness: "moderate" }]
		});
		document.head.appendChild(rules);
	}

	console.log(
		"%cCntxt Labs%c\nA software company, based in New Zealand.\n\n" +
		"This page is static HTML, one stylesheet and one small script. No framework,\n" +
		"no trackers, no third party requests. The whole site in one file, for machines:\n" +
		"https://cntxtlabs.co/llms.txt\n\nPress / for the menu.\n\n" +
		"Something to build? info@cntxtlabs.co\n",
		"font-weight:700;font-size:15px", "font-weight:400;font-size:12px"
	);
})();
