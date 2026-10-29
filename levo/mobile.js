/*
 * The phone page (760px and narrower): the agent chips moved in, the screenshots
 * kept to the theme, the bar, the arrivals and the hero's scroll. levo.js fills
 * the price and links ([data-price], [data-buy] and so on) and owns the chips,
 * the copy and the toast; this file only moves them.
 */
(function () {
	"use strict";

	var block = document.querySelector(".m");
	if (!block) return;
	var root = document.documentElement;
	var phone = window.matchMedia("(max-width: 760px)");
	var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	function all(sel) { return Array.prototype.slice.call(block.querySelectorAll(sel)); }
	function onChange(mq, fn) { if (mq.addEventListener) mq.addEventListener("change", fn); else if (mq.addListener) mq.addListener(fn); }

	// The agents. levo.js draws the chips and the toast into #levo-agents and
	// shows the first [data-toast] in the document, so the node itself moves:
	// into the phone page under 760px, back to the desktop section above it.
	var agents = document.getElementById("levo-agents");
	var slot = block.querySelector("[data-m-agents]");
	var mark = document.createComment(" levo-agents ");
	function place() {
		if (!agents || !slot) return;
		if (phone.matches) {
			if (agents.parentNode === slot) return;
			agents.parentNode.insertBefore(mark, agents);
			slot.appendChild(agents);
		} else if (mark.parentNode) {
			mark.parentNode.insertBefore(agents, mark);
			mark.parentNode.removeChild(mark);
		}
	}
	place();
	onChange(phone, place);

	// Screenshots follow html.dark, which can change without the device's
	// appearance changing: the dark source is switched on or off by hand.
	var dark = all("source[data-dark]");
	function theme() {
		var on = root.classList.contains("dark");
		dark.forEach(function (s) { s.media = on ? "all" : "not all"; });
	}
	theme();
	new MutationObserver(theme).observe(root, { attributes: true, attributeFilter: ["class"] });

	// Arrivals, as on getleft.app: a short rise as each block comes into view.
	var rv = all(".m-rv");
	if (window.IntersectionObserver) {
		var io = new IntersectionObserver(function (es) {
			es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
		}, { rootMargin: "0px 0px -10% 0px", threshold: 0.05 });
		rv.forEach(function (el) { io.observe(el); });
	} else rv.forEach(function (el) { el.classList.add("is-in"); });

	// The bar comes in once the hero's buttons have scrolled off the top.
	var bar = block.querySelector("[data-m-bar]");
	var ctas = block.querySelector("[data-m-ctas]");
	if (bar && ctas && window.IntersectionObserver) {
		new IntersectionObserver(function (es) {
			var en = es[es.length - 1];
			var on = !en.isIntersecting && en.boundingClientRect.top < 0;
			bar.classList.toggle("is-on", on);
			bar.inert = !on;
		}).observe(ctas);
	}

	// The hero on scroll: the text drifts up slower than the page and fades,
	// the popover settles to full size as it rises over it.
	if (reduced) return;
	var lift = block.querySelector("[data-m-lift]");
	var pop = block.querySelector("[data-m-pop]");
	var ticking = false, settled = false;
	function clamp(n) { return n < 0 ? 0 : n > 1 ? 1 : n; }
	function frame() {
		ticking = false;
		if (!phone.matches) { lift.style.cssText = ""; pop.style.transform = ""; settled = false; return; }
		var y = window.pageYOffset || 0;
		if (y > 400) { if (settled) return; settled = true; } else settled = false;
		var t = clamp((y - 10) / 220);
		lift.style.opacity = (1 - t).toFixed(3);
		lift.style.transform = "translate3d(0," + (Math.min(y, 240) * 0.45).toFixed(1) + "px,0)";
		lift.style.pointerEvents = t >= 1 ? "none" : "";
		pop.style.transform = "scale(" + (0.94 + 0.06 * clamp(y / 320)).toFixed(4) + ")";
	}
	function onScroll() { if (!ticking) { ticking = true; window.requestAnimationFrame(frame); } }
	if (lift && pop) {
		frame();
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll);
		onChange(phone, onScroll);
	}
})();
