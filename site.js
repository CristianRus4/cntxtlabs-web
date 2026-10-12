/* cntxt · cntxtlabs.co
   The one script every page shares. Loaded with defer from the head, so it
   runs once the page is parsed. It sits at the site root, which is how it
   knows where home is from any page. 404.html keeps its own. */

(function () {
	var script = document.currentScript;
	var HOME = script ? new URL("./", script.src).href : "/";
	var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	var root = document.documentElement;

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
		if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
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

	// On a phone there is no hover, so a tap opens a reveal.
	if (window.matchMedia("(hover: none)").matches) {
		document.querySelectorAll(".reveals").forEach(function (el) {
			if (el.classList.contains("titlelink")) return;
			el.addEventListener("click", function (e) {
				if (el.querySelector(".grow-wide") && !el.querySelector(".grow:not(.grow-wide)")) return;
				if (e.target.closest && e.target.closest("a") && !el.matches("a")) return;
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

	console.log(
		"%cCntxt Labs%c\nA software company, based in New Zealand.\n\n" +
		"This page is static HTML, one stylesheet and one small script. No framework,\n" +
		"no trackers, no third party requests. The whole site in one file, for machines:\n" +
		"https://cntxtlabs.co/llms.txt\n\n" +
		"Something to build? info@cntxtlabs.co\n",
		"font-weight:700;font-size:15px", "font-weight:400;font-size:12px"
	);
})();
