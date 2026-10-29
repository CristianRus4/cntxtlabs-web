/*
 * The phone page (760px and narrower): the menubar slice (Levo's mark and the
 * visitor's time), the popover opening under it, the agent chips moved in, the
 * screenshots kept to the theme, the bar, the arrivals and the scroll motion.
 * levo.js fills the price and links ([data-price], [data-buy] and so on) and
 * owns the chips, the copy and the toast; this file only moves them.
 */
(function () {
	"use strict";

	var top = document.querySelector(".m-top");
	var end = document.querySelector(".m-end");
	if (!top) return;
	var root = document.documentElement;
	var D = window.LevoDemo;
	var phone = window.matchMedia("(max-width: 760px)");
	var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	var hasIO = "IntersectionObserver" in window;
	function all(sel) { return Array.prototype.slice.call(document.querySelectorAll(".m " + sel)); }
	function one(sel) { return document.querySelector(".m " + sel); }
	function onChange(mq, fn) { if (mq.addEventListener) mq.addEventListener("change", fn); else if (mq.addListener) mq.addListener(fn); }
	function clamp(n) { return n < 0 ? 0 : n > 1 ? 1 : n; }

	// The menubar: Levo's mark as the demo draws it, and the visitor's own time.
	var markSlot = one("[data-m-mark]");
	if (markSlot && D && D.mark) markSlot.innerHTML = D.mark("m-mb-mark");
	var timeEl = one("[data-m-time]");
	var fTime;
	try { fTime = new Intl.DateTimeFormat(navigator.language || "en-NZ", { hour: "numeric", minute: "2-digit" }); }
	catch (e) { fTime = new Intl.DateTimeFormat("en-NZ", { hour: "numeric", minute: "2-digit" }); }
	function tick() {
		if (timeEl) timeEl.textContent = fTime.format(new Date());
		setTimeout(tick, 60000 - Date.now() % 60000 + 50);
	}
	tick();

	// The agents. levo.js draws the chips and the toast into #levo-agents and
	// shows the first [data-toast] in the document, so the node itself moves:
	// into the phone page under 760px, back to the desktop section above it.
	var agents = document.getElementById("levo-agents");
	var slot = one("[data-m-agents]");
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

	// Arrivals, as on getleft.app: a 24px rise and a fade as each block comes
	// into view; the chips arrive one after another.
	var rv = all(".m-rv").concat(slot ? [slot] : []);
	if (hasIO) {
		var io = new IntersectionObserver(function (es) {
			es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
		}, { rootMargin: "0px 0px -10% 0px", threshold: 0.05 });
		rv.forEach(function (el) { io.observe(el); });
	} else rv.forEach(function (el) { el.classList.add("is-in"); });

	// The popover opens under Levo's item once the slice is in view, as the
	// desktop demo's does on its own.
	var mac = one("[data-m-mac]");
	var pop = one("[data-m-pop]");
	var levo = one("[data-m-levo]");
	function open() { if (levo) levo.classList.add("is-open"); if (pop) pop.classList.add("is-open"); }
	if (pop && hasIO) {
		var po = new IntersectionObserver(function (es) {
			if (!es[es.length - 1].isIntersecting) return;
			po.disconnect();
			setTimeout(open, reduced ? 150 : 700);
		}, { threshold: 0.2 });
		po.observe(mac || pop);
	} else open();

	// The bar comes in once the hero's buttons have scrolled off the top, and
	// steps aside while the last buttons are on screen. The hero text moves on
	// scroll, so the buttons' place is read from the layout, not the screen.
	var bar = one("[data-m-bar]");
	var ctas = one("[data-m-ctas]");
	var last = one("[data-m-end]");
	var near = false, barOn = false;
	function pageTop(el) { var y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; }
	function syncBar() {
		if (!bar || !ctas) return;
		// Past the buttons, or (with motion) once they have mostly faded.
		var limit = pageTop(ctas) + ctas.offsetHeight - 56;
		if (!reduced) limit = Math.min(limit, 160);
		var on = phone.matches && !near && (window.pageYOffset || 0) > limit;
		if (on === barOn) return;
		barOn = on;
		bar.classList.toggle("is-on", on);
		bar.inert = !on;
	}
	if (last && hasIO) new IntersectionObserver(function (es) {
		near = es[es.length - 1].isIntersecting;
		syncBar();
	}).observe(last);

	// Scroll motion (transforms and opacity only). The hero text drifts up at
	// half speed and fades (getleft.app's: 0.45 over 220px); the Mac slice
	// grows to full width as it rises over it; the last icon turns upright and
	// grows as it comes up the screen.
	var lift = one("[data-m-lift]");
	var art = one("[data-m-art] img");
	var ticking = false, settled = false;
	function motion() {
		if (!phone.matches) {
			if (lift) lift.style.cssText = "";
			if (mac) mac.style.transform = "";
			if (art) art.style.transform = "";
			settled = false;
			return;
		}
		var y = window.pageYOffset || 0;
		var vh = window.innerHeight || 800;
		if (y <= 480 || !settled) {
			settled = y > 480;
			var t = clamp((y - 10) / 220);
			if (lift) {
				lift.style.opacity = (1 - t).toFixed(3);
				lift.style.transform = "translate3d(0," + (Math.min(y, 300) * 0.45).toFixed(1) + "px,0)";
				lift.style.pointerEvents = t >= 1 ? "none" : "";
			}
			if (mac) mac.style.transform = "scale(" + (0.94 + 0.06 * clamp(y / 360)).toFixed(4) + ")";
		}
		if (art) {
			var r = art.parentNode.getBoundingClientRect();
			if (r.top > vh || r.bottom < 0) return;
			var k = clamp((vh - r.top) / (vh * 0.6));
			art.style.transform = "rotate(" + (-10 * (1 - k)).toFixed(2) + "deg) scale(" + (0.82 + 0.18 * k).toFixed(4) + ")";
		}
	}
	function frame() {
		ticking = false;
		syncBar();
		if (!reduced) motion();
	}
	function onScroll() { if (!ticking) { ticking = true; window.requestAnimationFrame(frame); } }
	frame();
	window.addEventListener("scroll", onScroll, { passive: true });
	window.addEventListener("resize", onScroll);
	onChange(phone, onScroll);
})();
