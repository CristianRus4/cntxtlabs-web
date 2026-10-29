/*
 * The footer's menubar: a fake Mac's free space drifts down as it fills, then
 * Levo cleans and it jumps back up with a quick green; the Trash in the mini
 * dock fills and empties with it. Real local time. Paused off screen; static
 * with prefers-reduced-motion.
 */
(function () {
	"use strict";
	var root = document.querySelector("[data-lf]");
	if (!root) return;

	var freeEl = root.querySelector("[data-lf-free]");
	var levoEl = root.querySelector("[data-lf-levo]");
	var clockEl = root.querySelector("[data-lf-clock]");
	var trashEl = root.querySelector("[data-lf-trash]");
	var yearEl = root.querySelector("[data-lf-year]");
	if (yearEl) yearEl.textContent = String(new Date().getFullYear());

	var reduce = matchMedia("(prefers-reduced-motion: reduce)");
	var narrow = matchMedia("(max-width: 760px)");

	var LOW = 11.8, TICK = 2200;
	var free = 16.4, sinceClean = 9, timer = 0, tween = 0, visible = false;

	function show(v) { freeEl.textContent = v.toFixed(1) + " GB"; }

	function clock() {
		if (!clockEl) return;
		var d = new Date();
		var t = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
		clockEl.textContent = narrow.matches ? t : d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }).replace(/,/g, "") + "  " + t;
	}

	function trash() { trashEl && trashEl.classList.toggle("is-empty", sinceClean < 3); }

	function clean() {
		var from = free, to = free + 18 + Math.random() * 9, t0 = performance.now();
		levoEl.classList.add("is-clean");
		sinceClean = 0; trash();
		cancelAnimationFrame(tween);
		(function step(now) {
			var k = Math.min(1, (now - t0) / 700), e = 1 - Math.pow(1 - k, 3);
			free = from + (to - from) * e;
			show(free);
			if (k < 1) tween = requestAnimationFrame(step);
			else setTimeout(function () { levoEl.classList.remove("is-clean"); }, 650);
		})(t0);
	}

	function tick() {
		if (free <= LOW) { clean(); return; }
		free = Math.max(LOW, free - (0.1 + Math.random() * 0.4));
		sinceClean++; trash();
		show(free);
	}

	function run() {
		clearInterval(timer); timer = 0;
		if (visible && !reduce.matches && !document.hidden) timer = setInterval(tick, TICK);
	}

	show(free); trash(); clock();
	setInterval(clock, 15000);
	narrow.addEventListener && narrow.addEventListener("change", clock);
	reduce.addEventListener && reduce.addEventListener("change", run);
	document.addEventListener("visibilitychange", run);

	if ("IntersectionObserver" in window) {
		new IntersectionObserver(function (es) { visible = es[0].isIntersecting; run(); }, { rootMargin: "80px" }).observe(root);
	} else { visible = true; run(); }
})();
