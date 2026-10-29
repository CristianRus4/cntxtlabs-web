/*
 * The footer: the year, the legal links from levo.js's one place, and the wordmark rising
 * into place once the end of the page comes into view.
 */
(function () {
	"use strict";
	var root = document.querySelector("[data-lf]");
	if (!root) return;
	var year = root.querySelector("[data-lf-year]");
	if (year) year.textContent = String(new Date().getFullYear());
	if (!window.IntersectionObserver) { root.classList.add("is-in"); return; }
	new IntersectionObserver(function (es, io) {
		es.forEach(function (en) { if (en.isIntersecting) { root.classList.add("is-in"); io.disconnect(); } });
	}, { threshold: 0.35 }).observe(root);
})();
