/*
 * Levo's Settings window, round 5, as a playable preview.
 * window.LevoSettings.mount(el, opts) draws it into el. Nothing persists.
 * Panes, labels, symbols, tints and the ⓘ texts follow the app
 * (App/Sources/Levo/Settings); the look follows the R5 renders.
 */
(function () {
	"use strict";

	// ------------------------------------------------------------ the app's panes

	// id, title, symbol, tint [light, dark], has a header, has a switch
	var PANES = {
		licence: { title: "Licence", symbol: "key.fill", tint: ["#8E8E93", "#8E8E93"] },
		general: { title: "General", symbol: "gearshape.fill", tint: ["#8E8E93", "#8E8E93"] },
		agent: { title: "Agent", symbol: "apple.terminal.fill", tint: ["#6A3DEC", "#A485FF"], header: true, sw: "analyse" },
		protected: { title: "Protected", symbol: "checkmark.shield.fill", tint: ["#138AF2", "#56C2FF"], header: true },
		autoClean: { title: "Auto-clean", symbol: "wand.and.stars", tint: ["#C75D07", "#FF9217"], header: true, sw: "autoClean" },
		access: { title: "Access", symbol: "lock.fill", tint: ["#5E6AD2", "#5E6AD2"] },
		disk: { title: "Disk", symbol: "internaldrive.fill", tint: ["#1F7AE0", "#1F7AE0"], header: true, sw: "diskWatch" },
		memory: { title: "Memory", symbol: "memorychip.fill", tint: ["#F8A300", "#FFC531"], header: true, sw: "memWatch" },
		cpu: { title: "CPU", symbol: "cpu.fill", tint: ["#B12424", "#FF6363"], header: true, sw: "cpuWatch" },
		gpu: { title: "GPU", symbol: "display", tint: ["#9A1B6E", "#CF2F98"], header: true, sw: "gpuWatch" }
	};
	var PRIMARY = ["general", "agent", "protected", "autoClean", "access"];
	var METRICS = ["disk", "memory", "cpu", "gpu"];

	// What the sidebar's search also matches (SettingsWindow.swift).
	var KEYWORDS = {
		licence: ["key", "activate", "deactivate", "unlock", "buy", "licensed", "levo"],
		general: ["login", "launch", "check", "interval", "notifications", "appearance", "theme", "dark", "light", "text size", "menubar", "icon", "mark", "free space", "popover", "compact", "expanded", "gauges", "show", "welcome", "tour"],
		agent: ["claude", "codex", "gemini", "cli", "model", "effort", "limits", "time", "steps", "runs", "day", "test", "turns", "battery", "background", "tools", "custom", "command", "cleanup", "level", "careful", "balanced", "aggressive"],
		protected: ["folders", "never", "recent", "keep", "kept", "processes", "index", "privacy", "roots"],
		autoClean: ["automatic", "delete", "clean", "groups", "regenerable", "rate", "pro", "unlock"],
		access: ["full disk access", "notifications", "permission", "privacy"],
		disk: ["free", "space", "storage", "threshold", "watch", "early", "analysing", "gb"],
		memory: ["pressure", "ram", "warning", "critical", "threshold", "watch"],
		cpu: ["processor", "load", "process", "threshold", "watch"],
		gpu: ["graphics", "load", "process", "threshold", "watch"]
	};

	// The ⓘ texts, from the app.
	var INFO = {
		"agent.about": "Levo asks the agent you choose what’s filling your disk or loading your Mac. When on, it starts as a limit gets close, so the answer is ready when the alert comes.",
		"protected.about": "Levo never looks in, suggests or cleans anything here, and your agent never sees it.",
		"autoClean.about": "When on, Levo frees what you chose without asking whenever free space drops below your limit, then tells you what it freed. Needs a licence.",
		"disk.about": "When on, Levo watches free space on your startup disk and alerts you below your limit, with what’s safe to free already found.",
		"memory.about": "When on, Levo alerts you when memory stays under pressure, with what’s using it already found.",
		"cpu.about": "When on, Levo alerts you when the processor stays busy, with what’s keeping it busy already found.",
		"gpu.about": "When on, Levo alerts you when the graphics stay busy, with what’s keeping them busy already found.",

		launch: "Opens Levo when you log in, so it keeps watching without you starting it.",
		dock: "Puts Levo’s icon in the Dock as well as the menu bar. Clicking it opens Levo.",
		checkEvery: "How often Levo reads disk space, memory, CPU and GPU. Shorter catches problems sooner; longer uses a little less energy.",
		notifications: "Lets Levo alert you when a limit is crossed. Disk, Memory, CPU and GPU each have their own switch too.",
		welcome: "The short tour Levo shows on its first launch.",
		appearance: "Light, dark, or the same as your Mac.",
		textSize: "The size of the text in Levo’s menu bar window.",
		menubarIcon: "Outline shows the mark outlined. Mark shows it filled. Mark + Free Space also shows how much disk is free.",
		popover: "Compact shows the disk and what’s ready to free. Expanded adds memory, CPU and GPU gauges.",
		showInPopover: "The gauges the Expanded popover shows beside the disk. Compact shows the disk only.",

		command: "The command Levo runs as your agent. Levo fills in {prompt_file} with the task and {mcp_config} with its read-only tools.",
		model: "The model your agent uses for Levo. Default keeps the agent’s own choice.",
		effort: "How hard the agent thinks. Higher can find more, but takes longer and uses more of your agent plan.",
		test: "Gives your agent a tiny task to check it works with Levo. The arrow looks for installed agents again.",
		cleanup: "How far Levo goes when it picks what to clean. Careful leaves anything touched in the past week. Aggressive may also clean build data used an hour ago. Balanced sits between them.",
		timePerRun: "The longest one run may take. Levo stops the agent after this.",
		steps: "How many steps the agent may take in one run, like reading a folder or checking a process.",
		runs: "The most times Levo starts your agent in a day. Once reached, Levo waits until tomorrow.",
		battery: "Holds agent runs while your Mac is on battery and its charge is below this level.",
		tools: "Lets you ask your agent, in its own terminal, what’s filling your disk or slowing your Mac. The tools can only read, never delete.",

		folders: "Levo never looks in these folders, never suggests or cleans anything in them, and hides them from your agent.",
		kept: "Processes you chose to always keep. Levo never offers to quit them.",
		keepWithin: "Anything changed this recently is kept, even if it looks safe to remove. Files you or your tools are still using stay put.",
		alsoIndex: "Levo looks through your home folder. Add other places, like a second drive, to look there too.",
		always: "Places Levo never touches, whatever your settings: things like your photos, mail, passwords and keys.",

		acFree: "Auto-clean starts when free space falls below this.",
		acEvery: "The shortest time between two auto-cleans.",
		acGain: "Skips a clean that would free less than this.",
		what: "The kinds of items auto-clean may free. Your own files, protected folders and anything in use are never cleaned.",
		regen: "Only items that come back on their own when needed, like caches and build files. Picking groups below replaces this.",

		fda: "Lets Levo see every folder when it looks for space to free. Without it, some folders are skipped.",
		notifAccess: "Lets Levo alert you when a limit is crossed. If alerts don’t show, turn them on in System Settings.",

		diskFree: "Levo alerts you when free space falls below this, in GB or as a share of the disk.",
		early: "Starts finding what to free while you’re still this far above your limit, so the answer is ready at the alert.",
		pressure: "Warning: macOS is squeezing memory and may slow down. Critical: apps may stall until something quits.",
		forMinutes: "How long the level must last before Levo alerts you. Short spikes are ignored.",
		cpuTotal: "Levo alerts you when the processor as a whole stays busier than this.",
		cpuProc: "Levo alerts you when one app stays busier than this. 100 % is one full core, so it can go past 100 %.",
		gpuTotal: "Levo alerts you when the graphics as a whole stay busier than this.",
		gpuProc: "Levo alerts you when one app keeps the graphics busier than this.",

		status: "Free watches your Mac and suggests what to free. A licence adds Clean and Auto-clean.",
		activation: "Deactivate to free this Mac’s place, so you can use the key on another Mac.",
		key: "The licence key from your purchase email. Levo keeps it in your Keychain."
	};

	// Every agent Levo knows (agents.json), with its tile colours (PictureCards.swift).
	// The render's Mac has claude, cursor-agent and opencode installed.
	var AGENTS = [
		{ id: "claude", name: "Claude Code", bin: "claude", found: true, effort: true, glow: "#D97757", prompt: "#FF9217" },
		{ id: "cursor", name: "Cursor CLI", bin: "cursor-agent", found: true },
		{ id: "opencode", name: "opencode", bin: "opencode", found: true, glow: "#7B8494", prompt: "#C7CDD6" },
		{ id: "codex", name: "Codex", bin: "codex", effort: true, glow: "#56C2FF", prompt: "#56C2FF" },
		{ id: "gemini", name: "Gemini CLI", bin: "gemini", glow: "#A485FF", prompt: "#A485FF" },
		{ id: "antigravity", name: "Antigravity CLI", bin: "agy", glow: "#6B7CF0", prompt: "#8C9BFF" },
		{ id: "copilot", name: "GitHub Copilot CLI", bin: "copilot", glow: "#9A6CF0", prompt: "#B794FF" },
		{ id: "qwen", name: "Qwen Code", bin: "qwen", glow: "#7A70F0", prompt: "#9C94FF" },
		{ id: "kimi", name: "Kimi CLI", bin: "kimi", glow: "#4F8DF5", prompt: "#7FB0FF" },
		{ id: "grok", name: "Grok CLI", bin: "grok", effort: true }
	];

	var MENUS = {
		checkEvery: ["1 min", "5 min", "10 min", "15 min", "30 min", "1 hour"],
		appearance: ["System", "Light", "Dark"],
		menubarIcon: ["Outline", "Mark", "Mark + free space"],
		model: ["Default", "Custom…"],
		pressure: ["Warning", "Critical"]
	};

	var NEVER = [
		["Mail", "~/Library/Mail"], ["Messages", "~/Library/Messages"], ["iCloud Drive", "~/Library/Mobile Documents"],
		["Keychains", "~/Library/Keychains"], ["SSH", "~/.ssh"], ["GnuPG", "~/.gnupg"], ["AWS", "~/.aws"],
		["Kubernetes", "~/.kube"], ["GitHub CLI", "~/.config/gh"], ["Docker credentials", "~/.docker/config.json"],
		["netrc", "~/.netrc"], ["System", "/System"]
	];
	// What ＋ adds, in turn (the web can't open a folder picker).
	var SAMPLE_FOLDERS = ["~/Documents/Clients", "~/Pictures/Shoots", "~/Movies/Finals", "~/Music/Stems"];
	var SAMPLE_ROOTS = ["/Volumes/Work", "/Volumes/Archive", "/Volumes/Projects"];
	var GROUPS = ["Agent worktrees", "Browser caches", "Package caches", "Simulators", "Xcode build data"];
	var DISCLAIMER = "Auto-clean deletes files without asking you first, so be careful. Review what’s ticked before you turn it on. Items Levo removes directly, like caches and build files, can’t be restored; your own files go to the Trash. Levo is not responsible for deleted files.";

	var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

	function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

	// ------------------------------------------------------------ mount

	function mount(host, opts) {
		opts = opts || {};
		var symFn = opts.sym || function () { return ""; };
		function sym(name, size, cls) { return symFn(name, size, "ls-i" + (cls ? " " + cls : "")); }

		var S = {
			pane: PANES[opts.pane] ? opts.pane : "general",
			view: "list",
			query: "",
			licensed: true,
			theme: "System",
			test: null,
			detecting: false,
			sheet: null,
			keyField: "",
			acceptedAt: null,
			addFolder: 0,
			addRoot: 0,
			v: {
				launch: true, dock: false, notifications: true, checkEvery: "10 min",
				appearance: "System", textSize: 1, menubarIcon: "Outline", popover: "expanded",
				showMemory: true, showCPU: true, showGPU: true,
				agent: "claude", analyse: true, model: "Default", customModel: "", effort: "default", cleanup: "balanced",
				customCommand: "", timePerRun: 10, steps: 40, runs: 12, pauseBattery: true, batteryBelow: 20, tools: false,
				folders: [], kept: [
					["Claude Helper (Renderer)", "/Applications/Claude.app/Cont…acOS/Claude Helper (Renderer)"],
					["Xcode", "/Applications/Xcode.app/Contents/MacOS/Xcode"]
				], keepWithin: 24, roots: [],
				autoClean: false, acFree: 5, acUnit: "pct", acEvery: 6, acGain: 1, acRegen: true, acGroups: [],
				diskWatch: true, diskFree: Math.round(+opts.alert) || 20, diskUnit: "gb", diskNotify: true, early: 25,
				memWatch: true, pressure: "Warning", memFor: 5, memNotify: true,
				cpuWatch: true, cpuTotal: 90, cpuProc: 90, cpuFor: 5, cpuNotify: true,
				gpuWatch: true, gpuTotal: 90, gpuProc: 90, gpuFor: 5, gpuNotify: true
			}
		};
		var V = S.v;

		// Stepper ranges: [min, max, step]
		var RANGES = {
			timePerRun: [1, 60, 1], steps: [5, 200, 5], runs: [1, 100, 1], batteryBelow: [5, 100, 5],
			keepWithin: [1, 720, 1], acFree: [1, 2000, 1], acEvery: [1, 168, 1], acGain: [1, 500, 1],
			diskFree: [1, 2000, 1], early: [0, 100, 5], memFor: [1, 120, 1],
			cpuTotal: [10, 100, 5], cpuProc: [10, 800, 10], cpuFor: [1, 120, 1],
			gpuTotal: [10, 100, 5], gpuProc: [10, 800, 10], gpuFor: [1, 120, 1]
		};
		// A free-space limit in % goes up to 90.
		function range(k) {
			var r = RANGES[k];
			if ((k === "acFree" && V.acUnit === "pct") || (k === "diskFree" && V.diskUnit === "pct")) return [1, 90, 1];
			return r;
		}
		function digitsWidth(k) { return String(range(k)[1]).length * 8 + 4; }
		// What locks what: a section with data-lock="name" is dimmed and off while LOCKS[name]() is true.
		var LOCKS = {
			popover: function () { return V.popover === "compact"; },
			battery: function () { return !V.pauseBattery; },
			licence: function () { return !S.licensed; },
			diskWatch: function () { return !V.diskWatch; },
			memWatch: function () { return !V.memWatch; },
			cpuWatch: function () { return !V.cpuWatch; },
			gpuWatch: function () { return !V.gpuWatch; }
		};

		host.classList.add("ls-host");
		host.innerHTML = '<div class="ls-win" data-view="list"></div>';
		var win = host.firstChild;

		// ---------------------------------------------------------- pieces

		function tile(id, big) {
			var p = PANES[id];
			return '<span class="ls-tile' + (big ? " ls-tile-lg" : "") + '" data-anim="' + id + '" style="--t:' + p.tint[0] + ";--td:" + p.tint[1] + '">' + sym(p.symbol, big ? 33.6 : 12) + "</span>";
		}
		function info(id, title) {
			return '<button type="button" class="ls-info" data-info="' + id + '" data-title="' + esc(title) + '" aria-label="About ' + esc(title) + '">' + sym("info.circle", 12) + "</button>";
		}
		function label(title, infoId) {
			return '<span class="ls-label"><span>' + esc(title) + "</span>" + (infoId ? info(infoId, title) : "") + "</span>";
		}
		function sw(k, title) {
			return '<button type="button" class="ls-switch" role="switch" data-k="' + k + '" aria-checked="' + !!V[k] + '" aria-label="' + esc(title) + '"></button>';
		}
		function pop(k, icon) {
			return '<button type="button" class="ls-pop" data-pop="' + k + '" aria-haspopup="menu">' + (icon ? sym(icon, 13) : "") + "<b>" + esc(V[k]) + "</b>" + sym("chevron.down", 9, "ls-chev") + "</button>";
		}
		function seg(k, items, cls) {
			return '<span class="ls-seg' + (cls ? " " + cls : "") + '" data-seg="' + k + '" role="radiogroup">' + items.map(function (it) {
				var on = String(V[k]) === String(it[0]);
				return '<button type="button" role="radio" data-v="' + it[0] + '" aria-checked="' + on + '"' + (it[2] ? ' style="font-size:' + it[2] + 'px"' : "") + ">" + esc(it[1]) + "</button>";
			}).join("") + "</span>";
		}
		function step(k, unit, title) {
			var r = range(k);
			return '<span class="ls-step"><span class="ls-field" data-step="' + k + '" tabindex="0" role="spinbutton" aria-label="' + esc(title || k) + '" aria-valuenow="' + V[k] + '" aria-valuemin="' + r[0] + '" aria-valuemax="' + r[1] + '">' +
				'<b style="width:' + digitsWidth(k) + 'px">' + V[k] + "</b>" +
				'<span class="ls-arrows"><button type="button" tabindex="-1" data-d="1" aria-hidden="true">' + sym("chevron.up", 7) + '</button><button type="button" tabindex="-1" data-d="-1" aria-hidden="true">' + sym("chevron.down", 7) + "</button></span></span>" +
				(unit ? '<span class="ls-unit">' + esc(unit) + "</span>" : "") + "</span>";
		}
		function token(text, act, disabled) {
			return '<button type="button" class="ls-token" data-act="' + act + '"' + (disabled ? " disabled" : "") + ">" + esc(text) + "</button>";
		}
		function status(text, tone) { return '<span class="ls-status' + (tone ? " ls-" + tone : "") + '">' + esc(text) + "</span>"; }
		function check(k, title) {
			return '<span class="ls-checkrow"><button type="button" class="ls-check" role="checkbox" data-k="' + k + '" aria-checked="' + !!V[k] + '" aria-label="' + esc(title) + '">' + sym("checkmark", 8.5) + '</button><span class="ls-checklabel" data-k="' + k + '">' + esc(title) + "</span></span>";
		}
		function row(title, infoId, controls, below, cls) {
			return '<div class="ls-row' + (cls ? " " + cls : "") + '"><div class="ls-row-main">' + label(title, infoId) + '<span class="ls-ctl">' + (controls || "") + "</span></div>" + (below ? '<div class="ls-below">' + below + "</div>" : "") + "</div>";
		}
		function card(rows, cls, lock) {
			return '<div class="ls-card' + (cls ? " " + cls : "") + '"' + (lock ? ' data-lock="' + lock + '"' : "") + ">" + rows.join("") + "</div>";
		}
		function section(title, infoId, rows, lock) {
			return '<div class="ls-section">' + (title ? '<div class="ls-stitle"><span>' + esc(title) + "</span>" + (infoId ? info(infoId, title) : "") + "</div>" : "") + card(rows, "", lock) + "</div>";
		}
		function linkRow(title, value, pane) {
			return '<button type="button" class="ls-row ls-link" data-go="' + pane + '"><span class="ls-label"><span>' + esc(title) + '</span></span><span class="ls-ctl">' + (value ? status(value) : "") + sym("chevron.right", 11, "ls-chev") + "</span></button>";
		}
		function listCard(title, infoId, items, addAct, removeKey, icon) {
			return '<div class="ls-card ls-list"><div class="ls-list-head">' + label(title, infoId) +
				(addAct ? '<button type="button" class="ls-plus" data-act="' + addAct + '" aria-label="Add folder">' + sym("plus", 13) + "</button>" : "") + "</div>" +
				items.map(function (it, i) {
					return '<div class="ls-item">' + '<span class="ls-item-ic">' + sym(icon || "folder", 13) + "</span>" + '<span class="ls-item-title">' + esc(it[0]) + "</span>" +
						(it[1] ? '<span class="ls-item-detail">' + esc(it[1]) + "</span>" : "") +
						(removeKey ? '<button type="button" class="ls-minus" data-remove="' + removeKey + '" data-i="' + i + '" aria-label="Remove ' + esc(it[0]) + '">' + sym("minus", 12) + "</button>" : "") + "</div>";
				}).join("") + "</div>";
		}

		// ---------------------------------------------------------- pictures

		function popoverPicture(layout) {
			var ticks = "";
			for (var i = 0; i < 20; i++) ticks += "<i" + (i === 19 ? ' class="o"' : i >= 17 ? ' class="g"' : "") + "></i>";
			var ex = layout === "expanded";
			return '<span class="ls-pic ls-pic-pop"><span class="ls-mini' + (ex ? " ls-mini-ex" : "") + '"><span class="ls-ticks">' + ticks + "</span>" +
				(ex ? '<span class="ls-dials"><i></i><i></i><i></i></span>' : "") +
				'<i class="ls-ln" style="width:34px"></i><i class="ls-ln" style="width:29px"></i><i class="ls-ln" style="width:31px"></i>' + (ex ? '<i class="ls-ln" style="width:25px"></i>' : "") +
				'<span class="ls-flex"></span><i class="ls-mbar"></i></span></span>';
		}
		function agentPicture(a) {
			var glow = a.glow || "#8E8E93", prompt = a.prompt || "#E5E5EA";
			return '<span class="ls-pic ls-pic-agent" style="--glow:' + glow + '"><span class="ls-term"><span class="ls-dots"><i></i><i></i><i></i></span><code><span style="color:' + prompt + '">❯</span> ' + esc(a.bin) + '</code><i class="ls-termbar"></i></span></span>';
		}
		function pictureCard(caption, chosen, picture, attrs, dot, dim) {
			return '<button type="button" class="ls-pcard' + (chosen ? " is-on" : "") + (dim ? " is-dim" : "") + '" ' + attrs + ' aria-pressed="' + chosen + '">' + picture +
				'<span class="ls-caption">' + (dot ? "<i></i>" : "") + esc(caption) + "</span></button>";
		}

		// ---------------------------------------------------------- panes

		var BUILD = {
			licence: function () {
				var free = !S.licensed;
				return '<div class="ls-lic"><img src="' + esc(opts.iconUrl || "img/icon-96.png") + '" width="66" height="66" alt=""><b>Levo</b></div>' +
					section("Licence", null, [row("Status", "status", free ? status("Free") : status("Active", "green"))]) +
					section("This Mac", null, [free ?
						row("Key", "key", '<input class="ls-input ls-key" type="password" placeholder="XXXX-XXXX-XXXX-XXXX" value="' + esc(S.keyField) + '" aria-label="Key">' + token("Activate", "activate", !S.keyField.trim())) :
						row("Activation", "activation", '<button type="button" class="ls-textbtn ls-red" data-act="deactivate">Deactivate</button>')]);
			},
			general: function () {
				return section(null, null, [
					row("Launch at login", "launch", sw("launch", "Launch at login")),
					row("Show in Dock", "dock", sw("dock", "Show in Dock")),
					row("Check every", "checkEvery", pop("checkEvery")),
					row("Notifications", "notifications", sw("notifications", "Notifications")),
					row("Welcome", "welcome", token("Show", "welcome"))
				]) + section("Appearance", null, [
					row("Appearance", "appearance", pop("appearance")),
					row("Text size", "textSize", seg("textSize", [[0, "Aa", 11], [1, "Aa", 13], [2, "Aa", 16]], "ls-seg-aa")),
					row("Menubar icon", "menubarIcon", pop("menubarIcon")),
					'<div class="ls-row ls-row-pics"><div class="ls-row-main">' + label("Popover", "popover") + '<span class="ls-pics">' +
						pictureCard("Compact", V.popover === "compact", popoverPicture("compact"), 'data-layout="compact"') +
						pictureCard("Expanded", V.popover === "expanded", popoverPicture("expanded"), 'data-layout="expanded"') +
					"</span></div></div>"
				]) + section("Show in popover", "showInPopover", [
					row("Memory", null, sw("showMemory", "Memory")),
					row("CPU", null, sw("showCPU", "CPU")),
					row("GPU", null, sw("showGPU", "GPU"))
				], "popover");
			},
			agent: function () {
				var a = agentById(V.agent), custom = V.agent === "custom";
				var cards = AGENTS.slice().sort(function (x, y) { return (y.found ? 1 : 0) - (x.found ? 1 : 0); });
				var picker = '<div class="ls-picker"><div class="ls-scroller">' + cards.map(function (c) {
					return pictureCard(c.name, V.agent === c.id, agentPicture(c), 'data-agent="' + c.id + '"', c.found, !c.found);
				}).join("") + "</div>" +
					pictureCard("Custom", custom, '<span class="ls-pic ls-pic-custom"><span>' + sym("plus", 16) + "</span></span>", 'data-agent="custom"') + "</div>";
				var top = [picker];
				if (custom) top.push(row("Command", "command", '<input class="ls-input ls-mono ls-cmd" placeholder="agent --prompt {prompt_file} --mcp {mcp_config}" value="' + esc(V.customCommand) + '" aria-label="Command">'));
				var main = [];
				if (!custom) {
					main.push(row("Model", "model", (V.model !== "Default" ? '<input class="ls-input ls-model" placeholder="Model" value="' + esc(V.customModel) + '" aria-label="Model">' : "") + pop("model", "sparkle")));
					if (a && a.effort) main.push(row("Effort", "effort", seg("effort", [["default", "Default"], ["low", "Low"], ["medium", "Medium"], ["high", "High"]])));
				}
				main.push(row("Test", "test", '<span class="ls-test">' + testStatus() + "</span>" +
					'<button type="button" class="ls-round" data-act="detect" aria-label="Look for agents again"' + (S.detecting ? " disabled" : "") + ">" + sym("arrow.clockwise", 12) + "</button>" +
					token("Run test", "test", S.test === "testing" || (a && !a.found && !custom))));
				return card(top, "ls-card-picker") + section(null, null, main) +
					section(null, null, [row("Cleanup level", "cleanup", seg("cleanup", [["careful", "Careful"], ["balanced", "Balanced"], ["aggressive", "Aggressive"]]))]) +
					section("Limits", null, [
						row("Time per run", "timePerRun", step("timePerRun", "min", "Time per run")),
						row("Steps per run", "steps", step("steps", "", "Steps per run")),
						row("Runs per day", "runs", step("runs", "", "Runs per day"))
					]) + section("Background", null, [
						row("Pause on battery", "battery", sw("pauseBattery", "Pause on battery"),
							'<span class="ls-lockable" data-lock="battery"><span class="ls-sub">Below</span>' + step("batteryBelow", "%", "Pause on battery below") + "</span>"),
						row("Add Levo’s read-only tools to my agent", "tools", sw("tools", "Add Levo’s read-only tools to my agent"))
					]);
			},
			protected: function () {
				return listCard("Protected folders", "folders", V.folders.map(function (f) { return [f]; }), "addFolder", "folders") +
					(V.kept.length ? listCard("Kept processes", "kept", V.kept, null, "kept", "terminal") : "") +
					section(null, null, [row("Keep what changed within", "keepWithin", step("keepWithin", "h", "Hours"))]) +
					listCard("Also index", "alsoIndex", V.roots.map(function (f) { return [f]; }), "addRoot", "roots") +
					listCard("Always protected", "always", NEVER, null, null, "lock");
			},
			autoClean: function () {
				var out = "";
				if (!S.licensed) out += '<div class="ls-section">' + card([linkRow("Licence", "Free", "licence")]) + "</div>";
				if (S.acceptedAt) out += section(null, null, [row("Accepted", null, status(S.acceptedAt + " · 1.0"))]);
				return out + '<div class="ls-lockable" data-lock="licence">' + section("When", null, [
					row("Free below", "acFree", diskLimit("acFree", "acUnit")),
					row("At most every", "acEvery", step("acEvery", "h", "Hours")),
					row("Only when it frees", "acGain", step("acGain", "GB", "Gigabytes"))
				]) + section("What", "what", [row("Regenerable only", "regen", sw("acRegen", "Regenerable only"))].concat(GROUPS.map(function (g, i) {
					return row(g, null, '<button type="button" class="ls-switch" role="switch" data-group="' + i + '" aria-checked="' + (V.acGroups.indexOf(g) >= 0) + '" aria-label="' + esc(g) + '"></button>');
				}))) + "</div>";
			},
			access: function () {
				return section(null, null, [
					row("Full Disk Access", "fda", status("Allowed", "green") + token("Open", "open")),
					row("Notifications", "notifAccess", status("Allowed", "green") + token("Open", "open"))
				]);
			},
			disk: function () {
				return section(null, null, [row(opts.volume || "Macintosh HD", null, status((opts.free != null ? opts.free : "32 GB") + " free"))]) +
					section(null, null, [
						row("Free below", "diskFree", diskLimit("diskFree", "diskUnit"), check("diskNotify", "Send a notification")),
						row("Start analysing early", "early", step("early", "%", "Start analysing early"))
					], "diskWatch") +
					'<div class="ls-section">' + card([linkRow("Auto-clean", V.autoClean ? "On" : "Off", "autoClean")]) + "</div>";
			},
			memory: function () {
				return section(null, null, [row("Now", null, status((opts.memory || "32 GB") + " · Normal"))]) +
					section(null, null, [
						row("Pressure", "pressure", pop("pressure")),
						row("For", "forMinutes", step("memFor", "min", "Minutes"), check("memNotify", "Send a notification"))
					], "memWatch");
			},
			cpu: function () { return load("cpu", opts.cpu != null ? opts.cpu : 30); },
			gpu: function () { return load("gpu", opts.gpu != null ? opts.gpu : 62); }
		};
		function load(m, now) {
			return section(null, null, [row("Now", null, status(now + " %"))]) +
				section(null, null, [
					row("Total above", m + "Total", step(m + "Total", "%", "Total above")),
					row("One process above", m + "Proc", step(m + "Proc", "%", "One process above")),
					row("For", "forMinutes", step(m + "For", "min", "Minutes"), check(m + "Notify", "Send a notification"))
				], m + "Watch");
		}
		function diskLimit(k, unitKey) {
			return step(k, "", "Free below") + seg(unitKey, [["gb", "GB"], ["pct", "%"]]);
		}
		function agentById(id) { for (var i = 0; i < AGENTS.length; i++) if (AGENTS[i].id === id) return AGENTS[i]; return null; }
		function testStatus() {
			var a = agentById(V.agent);
			if (S.test === "testing" || S.detecting) return '<i class="ls-spin" aria-label="Testing"></i>';
			if (S.test) return '<span class="ls-tag ls-green">' + sym("checkmark.circle", 11) + esc(S.test) + "</span>";
			if (V.agent === "custom" || (a && a.found)) return status("Detected", "green");
			return status("Not installed", "orange");
		}

		// ---------------------------------------------------------- the window

		function matches(id, q) {
			q = q.trim().toLowerCase();
			if (!q) return true;
			return PANES[id].title.toLowerCase().indexOf(q) >= 0 || KEYWORDS[id].some(function (k) { return k.indexOf(q) >= 0; });
		}
		function navRow(id) {
			var pro = id === "autoClean" && !S.licensed;
			return '<button type="button" class="ls-nav' + (S.pane === id ? " is-on" : "") + '" data-pane="' + id + '"' + (matches(id, S.query) ? "" : " hidden") + ">" + tile(id) +
				'<span class="ls-navtitle">' + PANES[id].title + "</span>" + (pro ? '<span class="ls-pro">Pro</span>' : "") + sym("chevron.right", 11, "ls-navchev") + "</button>";
		}
		function sidebar() {
			var groups = [PRIMARY, METRICS].map(function (g) {
				var any = g.some(function (id) { return matches(id, S.query); });
				return '<div class="ls-group"' + (any ? "" : " hidden") + ">" + g.map(navRow).join("") + "</div>";
			}).join("");
			return '<div class="ls-lights" aria-hidden="true"><i class="ls-l-close"></i><i class="ls-l-min"></i><i class="ls-l-zoom"></i></div>' +
				'<label class="ls-search">' + sym("magnifyingglass", 12) + '<input type="text" placeholder="Search" value="' + esc(S.query) + '" aria-label="Search settings" spellcheck="false" autocomplete="off">' +
				'<button type="button" class="ls-clear" data-act="clear" aria-label="Clear"' + (S.query ? "" : " hidden") + ">" + sym("xmark.circle.fill", 12) + "</button></label>" +
				'<div class="ls-navwrap">' +
				'<button type="button" class="ls-account' + (S.pane === "licence" ? " is-on" : "") + '" data-pane="licence"' + (matches("licence", S.query) ? "" : " hidden") + '><img src="' + esc(opts.iconUrl || "img/icon-96.png") + '" width="26" height="26" alt=""><span><b>Levo</b><small>' + (S.licensed ? "Licensed" : "Free") + "</small></span>" + sym("chevron.right", 11, "ls-navchev") + "</button>" +
				groups + "</div>";
		}
		function bar() {
			var p = PANES[S.pane], about = INFO[S.pane + ".about"];
			return '<button type="button" class="ls-back" data-act="back" aria-label="Settings">' + sym("chevron.left", 14) + "</button>" +
				'<span class="ls-bartitle">' + esc(p.title) + "</span>" +
				'<span class="ls-baractions">' + (about ? info(S.pane + ".about", p.title) : "") + (p.sw ? sw(p.sw, p.title) : "") + "</span>";
		}
		function page() {
			var p = PANES[S.pane];
			return (p.header ? '<div class="ls-head">' + tile(S.pane, true) + "<h3>" + esc(p.title) + "</h3></div>" : "") + BUILD[S.pane]();
		}

		function render() {
			win.innerHTML = '<aside class="ls-side">' + sidebar() + "</aside>" +
				'<section class="ls-main" aria-label="' + esc(PANES[S.pane].title) + '"><div class="ls-bar">' + bar() + '</div><div class="ls-scroll"><div class="ls-page' + (PANES[S.pane].header ? " has-head" : "") + '">' + page() + "</div></div></section>" +
				'<div class="ls-layer"></div>';
			sync();
		}
		function renderSidebar() {
			var side = win.querySelector(".ls-side"), nav = side.querySelector(".ls-navwrap");
			var tmp = document.createElement("div");
			tmp.innerHTML = sidebar();
			side.replaceChild(tmp.querySelector(".ls-navwrap"), nav);
			side.querySelector(".ls-clear").hidden = !S.query;
		}
		function renderPane(keepScroll) {
			var main = win.querySelector(".ls-main"), sc = main.querySelector(".ls-scroll"), top = sc.scrollTop;
			main.querySelector(".ls-bar").innerHTML = bar();
			main.setAttribute("aria-label", PANES[S.pane].title);
			var pg = sc.firstChild;
			pg.className = "ls-page" + (PANES[S.pane].header ? " has-head" : "") + (keepScroll ? "" : " is-new");
			pg.innerHTML = page();
			sc.scrollTop = keepScroll ? top : 0;
			sync();
			onScroll();
		}
		function go(id) {
			closeLayer();
			S.pane = id;
			S.view = "pane";
			win.dataset.view = "pane";
			renderSidebar();
			renderPane(false);
		}

		// Bring every control in the DOM in line with the state.
		function sync() {
			all("[data-k]").forEach(function (el) {
				if (el.classList.contains("ls-checklabel")) return;
				el.setAttribute("aria-checked", !!V[el.dataset.k]);
			});
			all("[data-group]").forEach(function (el) { el.setAttribute("aria-checked", V.acGroups.indexOf(GROUPS[+el.dataset.group]) >= 0); });
			all("[data-seg]").forEach(function (g) {
				all("button", g).forEach(function (b) { b.setAttribute("aria-checked", String(V[g.dataset.seg]) === b.dataset.v); });
			});
			all("[data-step]").forEach(function (f) {
				var k = f.dataset.step, b = f.querySelector("b");
				b.textContent = V[k];
				b.style.width = digitsWidth(k) + "px";
				f.setAttribute("aria-valuenow", V[k]);
				f.setAttribute("aria-valuemax", range(k)[1]);
			});
			all("[data-pop]").forEach(function (b) { b.querySelector("b").textContent = V[b.dataset.pop]; });
			all("[data-lock]").forEach(function (el) {
				var on = LOCKS[el.dataset.lock] && LOCKS[el.dataset.lock]();
				el.classList.toggle("is-locked", !!on);
				all("button:not(.ls-info), input, [data-step]", el).forEach(function (c) {
					if (c.tagName === "SPAN") c.setAttribute("tabindex", on ? "-1" : "0");
					else c.disabled = !!on || c.hasAttribute("data-off");
				});
			});
			var p = PANES[S.pane];
			if (p.sw === "autoClean") all('.ls-bar [data-k="autoClean"]').forEach(function (b) { b.disabled = !S.licensed; });
			var t = S.theme === "Light" ? "light" : S.theme === "Dark" ? "dark" : (document.documentElement.classList.contains("dark") ? "dark" : "light");
			win.dataset.theme = t;
		}
		function all(sel, root) { return Array.prototype.slice.call((root || win).querySelectorAll(sel)); }

		// ---------------------------------------------------------- layer: bubble, menu, sheet

		var layerKind = null, bubbleFor = null, pinned = false, showT = 0, hideT = 0;
		function layer() { return win.querySelector(".ls-layer"); }
		function closeLayer() {
			clearTimeout(showT); clearTimeout(hideT);
			var l = layer();
			if (!l) return;
			if (layerKind === "menu" && menuFor) menuFor.setAttribute("aria-expanded", "false");
			l.innerHTML = "";
			l.className = "ls-layer";
			layerKind = null; bubbleFor = null; pinned = false; menuFor = null;
		}
		// An element's box in the window's own (unscaled) pixels.
		function rel(el) {
			var w = win.getBoundingClientRect(), r = el.getBoundingClientRect(), k = w.width / win.offsetWidth || 1;
			return { left: (r.left - w.left) / k, top: (r.top - w.top) / k, right: (r.right - w.left) / k, bottom: (r.bottom - w.top) / k, width: r.width / k, height: r.height / k };
		}
		function place(el, anchor, below) {
			var W = win.offsetWidth, H = win.offsetHeight, a = rel(anchor);
			var bw = el.offsetWidth, bh = el.offsetHeight, pad = 8;
			var cx = a.left + a.width / 2;
			var x = Math.max(pad, Math.min(W - bw - pad, cx - bw / 2));
			var y = a.bottom + 6;
			var flip = below === false || (y + bh > H - pad && a.top - 6 - bh > pad);
			if (flip) y = a.top - 6 - bh;
			el.style.left = x + "px";
			el.style.top = y + "px";
			el.style.setProperty("--ax", (cx - x) + "px");
			el.classList.toggle("is-up", !!flip);
		}
		function showBubble(btn, pin) {
			if (bubbleFor === btn) { if (pin) pinned = true; return; }
			closeLayer();
			var l = layer();
			l.innerHTML = '<div class="ls-bubble" role="tooltip"><b>' + esc(btn.dataset.title) + "</b><p>" + esc(INFO[btn.dataset.info] || "") + "</p></div>";
			l.className = "ls-layer is-bubble";
			layerKind = "bubble"; bubbleFor = btn; pinned = !!pin;
			place(l.firstChild, btn);
		}

		var menuFor = null;
		function openMenu(btn) {
			closeLayer();
			var k = btn.dataset.pop, items = MENUS[k], l = layer();
			l.innerHTML = '<div class="ls-menu" role="menu">' + items.map(function (it) {
				var on = V[k] === it;
				return '<button type="button" role="menuitemradio" aria-checked="' + on + '" data-item="' + esc(it) + '">' + (on ? sym("checkmark", 11) : "<i></i>") + "<span>" + esc(it) + "</span></button>";
			}).join("") + "</div>";
			l.className = "ls-layer is-menu";
			layerKind = "menu"; menuFor = btn;
			btn.setAttribute("aria-expanded", "true");
			var m = l.firstChild, W = win.offsetWidth, H = win.offsetHeight, a = rel(btn);
			var x = Math.max(8, Math.min(W - m.offsetWidth - 8, a.right - m.offsetWidth + 4));
			var y = a.bottom + 4;
			if (y + m.offsetHeight > H - 8) y = Math.max(8, a.top - 4 - m.offsetHeight);
			m.style.left = x + "px"; m.style.top = y + "px";
			var cur = m.querySelector('[aria-checked="true"]') || m.querySelector("button");
			if (cur) cur.focus({ preventScroll: true });
		}
		function chooseMenu(item) {
			var k = menuFor.dataset.pop, btn = menuFor;
			V[k] = item;
			closeLayer();
			btn.focus({ preventScroll: true });
			if (k === "appearance") S.theme = item;
			if (k === "model") { renderPane(true); return; }
			sync();
		}

		function openSheet() {
			closeLayer();
			S.sheet = { accepted: false, typed: "" };
			var l = layer();
			l.className = "ls-layer is-sheet";
			layerKind = "sheet";
			l.innerHTML = '<div class="ls-dim"></div><div class="ls-sheet" role="dialog" aria-modal="true" aria-label="Turn on Auto-clean"><p>' + esc(DISCLAIMER) + "</p>" +
				'<div class="ls-form"><label class="ls-frow"><button type="button" class="ls-check ls-check-lg" role="checkbox" data-ack aria-checked="false">' + sym("checkmark", 10) + "</button><span>I accept</span></label>" +
				'<label class="ls-frow"><span>Type confirm</span><input class="ls-confirm" type="text" placeholder="confirm" spellcheck="false" autocomplete="off" aria-label="Type confirm"></label></div>' +
				'<div class="ls-sheetbtns"><button type="button" class="ls-btn" data-act="sheetCancel">Cancel</button><button type="button" class="ls-btn ls-btn-go" data-act="sheetOk" disabled>Turn on</button></div></div>';
			var c = l.querySelector("[data-ack]");
			if (c) c.focus({ preventScroll: true });
		}
		function sheetValid() { return S.sheet && S.sheet.accepted && S.sheet.typed.trim().toLowerCase() === "confirm"; }
		function closeSheet(ok) {
			if (ok) {
				V.autoClean = true;
				S.acceptedAt = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
			}
			S.sheet = null;
			closeLayer();
			if (ok) renderPane(true); else sync();
			var t = win.querySelector('.ls-bar [data-k="autoClean"]');
			if (t) t.focus({ preventScroll: true });
		}

		// ---------------------------------------------------------- events

		function nudge(f, d) {
			var k = f.dataset.step, r = range(k);
			V[k] = Math.max(r[0], Math.min(r[1], V[k] + d * r[2]));
			f.querySelector("b").textContent = V[k];
			f.setAttribute("aria-valuenow", V[k]);
			if (k === "diskFree" && V.diskUnit === "gb" && opts.setAlert) opts.setAlert(V[k]);
		}

		var hold = 0, holdT = 0;
		function stopHold() { clearTimeout(holdT); clearInterval(hold); hold = 0; }

		win.addEventListener("pointerdown", function (e) {
			win.classList.add("is-key");
			var d = e.target.closest("[data-d]");
			if (d && !d.closest(".is-locked")) {
				e.preventDefault();
				var f = d.closest("[data-step]");
				f.focus({ preventScroll: true });
				nudge(f, +d.dataset.d);
				stopHold();
				holdT = setTimeout(function () { hold = setInterval(function () { nudge(f, +d.dataset.d); }, 70); }, 380);
			}
		});
		win.addEventListener("pointerup", stopHold);
		win.addEventListener("pointercancel", stopHold);
		win.addEventListener("pointerleave", stopHold);
		document.addEventListener("pointerdown", onOutside, true);
		function onOutside(e) {
			if (!win.contains(e.target)) {
				win.classList.remove("is-key");
				if (layerKind === "bubble" || layerKind === "menu") closeLayer();
			}
		}

		win.addEventListener("click", function (e) {
			var t = e.target, el;
			if (layerKind === "menu" && !t.closest(".ls-menu")) { closeLayer(); if (t.closest("[data-pop]")) return; }
			if ((el = t.closest(".ls-menu [data-item]"))) { chooseMenu(el.dataset.item); return; }
			if (layerKind === "bubble" && !t.closest(".ls-info") && !t.closest(".ls-bubble")) closeLayer();

			if ((el = t.closest(".ls-info"))) {
				if (bubbleFor === el && pinned) closeLayer(); else showBubble(el, true);
				return;
			}
			if ((el = t.closest("[data-pane]"))) { go(el.dataset.pane); return; }
			if ((el = t.closest("[data-go]"))) { go(el.dataset.go); return; }
			if (t.closest("[data-d]")) return;
			if (t.closest(".is-locked")) return;

			if ((el = t.closest("[data-ack]"))) {
				S.sheet.accepted = !S.sheet.accepted;
				el.setAttribute("aria-checked", S.sheet.accepted);
				layer().querySelector('[data-act="sheetOk"]').disabled = !sheetValid();
				return;
			}
			if ((el = t.closest(".ls-frow")) && !t.closest("input") && el.querySelector("[data-ack]")) { el.querySelector("[data-ack]").click(); return; }

			if ((el = t.closest("[data-group]"))) {
				var g = GROUPS[+el.dataset.group], i = V.acGroups.indexOf(g);
				if (i >= 0) V.acGroups.splice(i, 1); else V.acGroups.push(g);
				V.acRegen = V.acGroups.length === 0;
				sync();
				return;
			}
			if ((el = t.closest("[data-k]"))) {
				var k = el.dataset.k;
				if (el.disabled) return;
				if (k === "autoClean" && !V.autoClean) { openSheet(); return; }
				V[k] = !V[k];
				if (k === "acRegen" && V.acRegen) V.acGroups = [];
				if (k === "acRegen" && !V.acRegen && !V.acGroups.length) V.acRegen = true;
				if (k === "autoClean" && !V.autoClean) S.acceptedAt = null;
				if (k === "autoClean") { renderPane(true); return; }
				sync();
				return;
			}
			if ((el = t.closest("[data-seg] button"))) {
				var sk = el.parentNode.dataset.seg, v = el.dataset.v;
				V[sk] = /^\d+$/.test(v) ? +v : v;
				if ((sk === "acUnit" || sk === "diskUnit") && v === "pct") {
					var fk = sk === "acUnit" ? "acFree" : "diskFree";
					V[fk] = Math.min(V[fk], 90);
				}
				if (sk === "diskUnit" && v === "gb" && opts.setAlert) opts.setAlert(V.diskFree);
				sync();
				return;
			}
			if ((el = t.closest("[data-pop]"))) { openMenu(el); return; }
			if ((el = t.closest("[data-layout]"))) {
				V.popover = el.dataset.layout;
				all("[data-layout]").forEach(function (b) { var on = b.dataset.layout === V.popover; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", on); });
				sync();
				return;
			}
			if ((el = t.closest("[data-agent]"))) {
				var id = el.dataset.agent;
				if (id !== V.agent) {
					V.agent = id;
					S.test = null;
					var a = agentById(id);
					if (a && !a.effort) V.effort = "default";
					if (opts.setAgent) opts.setAgent(a ? a.name : "Custom");
					var sc = win.querySelector(".ls-scroller"), sx = sc ? sc.scrollLeft : 0;
					renderPane(true);
					sc = win.querySelector(".ls-scroller");
					if (sc) sc.scrollLeft = sx;
				}
				return;
			}
			if ((el = t.closest("[data-remove]"))) {
				V[el.dataset.remove].splice(+el.dataset.i, 1);
				renderPane(true);
				return;
			}
			if ((el = t.closest("[data-act]"))) { act(el.dataset.act, el); return; }
			if ((el = t.closest(".ls-checklabel"))) { var cb = el.parentNode.querySelector(".ls-check"); if (cb && !cb.disabled) cb.click(); }
		});

		function act(name, el) {
			if (name === "back") {
				S.view = "list";
				win.dataset.view = "list";
				closeLayer();
				var n = win.querySelector('.ls-side [data-pane="' + S.pane + '"]');
				if (n) n.focus({ preventScroll: true });
			} else if (name === "clear") {
				S.query = "";
				var inp = win.querySelector(".ls-search input");
				inp.value = "";
				renderSidebar();
				inp.focus();
			} else if (name === "test") {
				S.test = "testing";
				updateTest();
				setTimeout(function () {
					S.test = "Ready · " + (3.2 + Math.random() * 2.4).toFixed(1) + " s";
					updateTest();
				}, 1600);
			} else if (name === "detect") {
				S.detecting = true;
				S.test = null;
				updateTest();
				setTimeout(function () { S.detecting = false; updateTest(); }, 900);
			} else if (name === "addFolder") {
				var f = SAMPLE_FOLDERS[S.addFolder++ % SAMPLE_FOLDERS.length];
				if (V.folders.indexOf(f) < 0) V.folders.push(f);
				renderPane(true);
			} else if (name === "addRoot") {
				var r = SAMPLE_ROOTS[S.addRoot++ % SAMPLE_ROOTS.length];
				if (V.roots.indexOf(r) < 0) V.roots.push(r);
				renderPane(true);
			} else if (name === "sheetCancel") {
				closeSheet(false);
			} else if (name === "sheetOk") {
				if (sheetValid()) closeSheet(true);
			} else if (name === "deactivate") {
				S.licensed = false;
				V.autoClean = false;
				S.acceptedAt = null;
				renderSidebar();
				renderPane(true);
			} else if (name === "activate") {
				if (!S.keyField.trim()) return;
				S.licensed = true;
				S.keyField = "";
				renderSidebar();
				renderPane(true);
			} else if (name === "welcome") {
				if (opts.welcome) opts.welcome();
			}
		}
		function updateTest() {
			var box = win.querySelector(".ls-test");
			if (!box) return;
			box.innerHTML = testStatus();
			var run = win.querySelector('[data-act="test"]'), a = agentById(V.agent);
			if (run) run.disabled = S.test === "testing" || (a && !a.found && V.agent !== "custom");
			var det = win.querySelector('[data-act="detect"]');
			if (det) det.disabled = S.detecting;
		}

		win.addEventListener("input", function (e) {
			var t = e.target;
			if (t.closest(".ls-search")) {
				S.query = t.value;
				renderSidebar();
			} else if (t.classList.contains("ls-confirm")) {
				S.sheet.typed = t.value;
				layer().querySelector('[data-act="sheetOk"]').disabled = !sheetValid();
			} else if (t.classList.contains("ls-key")) {
				S.keyField = t.value;
				var b = win.querySelector('[data-act="activate"]');
				if (b) b.disabled = !t.value.trim();
			} else if (t.classList.contains("ls-cmd")) {
				V.customCommand = t.value;
			} else if (t.classList.contains("ls-model")) {
				V.customModel = t.value;
			}
		});

		win.addEventListener("keydown", function (e) {
			var t = e.target, el;
			if (e.key === "Escape") {
				if (layerKind === "sheet") { closeSheet(false); e.preventDefault(); return; }
				if (layerKind === "menu") { var b = menuFor; closeLayer(); if (b) b.focus({ preventScroll: true }); e.preventDefault(); return; }
				if (layerKind) { closeLayer(); e.preventDefault(); return; }
				if (S.view === "pane" && isPhone()) { act("back"); e.preventDefault(); }
				return;
			}
			if (layerKind === "sheet" && e.key === "Enter" && sheetValid()) { closeSheet(true); e.preventDefault(); return; }
			if (layerKind === "sheet" && e.key === "Tab") {
				var f = all(".ls-sheet button:not([disabled]), .ls-sheet input", layer());
				var i = f.indexOf(document.activeElement);
				if (e.shiftKey && i <= 0) { f[f.length - 1].focus(); e.preventDefault(); }
				else if (!e.shiftKey && i === f.length - 1) { f[0].focus(); e.preventDefault(); }
				return;
			}
			if (layerKind === "menu" && (el = t.closest(".ls-menu"))) {
				var items = all("button", el), at = items.indexOf(t);
				if (e.key === "ArrowDown" || e.key === "ArrowUp") {
					items[(at + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length].focus();
					e.preventDefault();
				} else if (e.key === "Enter" || e.key === " ") { chooseMenu(t.dataset.item); e.preventDefault(); }
				return;
			}
			if ((el = t.closest("[data-step]")) && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
				if (!el.closest(".is-locked")) nudge(el, e.key === "ArrowUp" ? 1 : -1);
				e.preventDefault();
				return;
			}
			if (t.closest(".ls-search") && e.key === "Enter") {
				var first = win.querySelector(".ls-side [data-pane]:not([hidden])");
				if (first) go(first.dataset.pane);
				e.preventDefault();
				return;
			}
			if (t.closest(".ls-search") && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
				var vis = all(".ls-side [data-pane]:not([hidden])").map(function (n) { return n.dataset.pane; });
				if (!vis.length) return;
				var idx = vis.indexOf(S.pane) + (e.key === "ArrowDown" ? 1 : -1);
				go(vis[Math.max(0, Math.min(vis.length - 1, idx))]);
				e.preventDefault();
				return;
			}
			if (t.classList.contains("ls-key") && e.key === "Enter") { act("activate"); e.preventDefault(); }
		});

		// Hover opens an ⓘ's bubble; leaving closes it unless it was clicked open.
		win.addEventListener("pointerover", function (e) {
			if (e.pointerType !== "mouse") return;
			var b = e.target.closest(".ls-info");
			if (b) {
				clearTimeout(hideT);
				if (layerKind === "menu" || layerKind === "sheet") return;
				if (bubbleFor === b) return;
				clearTimeout(showT);
				showT = setTimeout(function () { showBubble(b, false); }, bubbleFor ? 0 : 140);
			} else if (e.target.closest(".ls-bubble")) {
				clearTimeout(hideT);
			}
		});
		win.addEventListener("pointerout", function (e) {
			if (e.pointerType !== "mouse") return;
			var from = e.target.closest(".ls-info, .ls-bubble");
			if (!from || (e.relatedTarget && from.contains(e.relatedTarget))) return;
			clearTimeout(showT);
			if (layerKind === "bubble" && !pinned) hideT = setTimeout(closeLayer, 120);
		});
		win.addEventListener("focusin", function (e) {
			win.classList.add("is-key");
			var b = e.target.closest(".ls-info");
			if (b && e.target.matches(":focus-visible") && layerKind !== "sheet") showBubble(b, false);
		});
		win.addEventListener("focusout", function (e) {
			if (e.target.closest(".ls-info") && layerKind === "bubble" && !pinned) closeLayer();
		});

		// The phone bar shows the title once the big one scrolls away.
		function isPhone() { return win.offsetWidth < 760; }
		function onScroll() {
			var sc = win.querySelector(".ls-scroll"), head = win.querySelector(".ls-head h3");
			var show = !head || sc.scrollTop > head.offsetTop + head.offsetHeight - 52;
			win.classList.toggle("is-scrolled", show);
			if (layerKind === "bubble" || layerKind === "menu") closeLayer();
		}

		// Follow the page's theme while Appearance is System.
		var mo = new MutationObserver(sync);
		mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

		// The app's window is 900 by 640 pt. Where the page is narrower, the whole window scales as one.
		var WIN_W = 900, WIN_H = 640;
		function fit() {
			var hw = host.clientWidth;
			if (!hw) return;
			if (hw < 760) { win.style.transform = ""; host.style.height = ""; win.classList.remove("is-scaled"); return; }
			var k = Math.min(1, hw / WIN_W);
			win.classList.toggle("is-scaled", k < 1);
			win.style.transform = k < 1 ? "scale(" + k + ")" : "";
			host.style.height = k < 1 ? Math.round(WIN_H * k) + "px" : "";
			if (layerKind === "bubble" || layerKind === "menu") closeLayer();
		}
		var ro = window.ResizeObserver ? new ResizeObserver(fit) : null;
		if (ro) ro.observe(host); else window.addEventListener("resize", fit);

		render();
		fit();
		win.querySelector(".ls-scroll").addEventListener("scroll", onScroll, { passive: true });
		onScroll();
		if (opts.pane) { S.view = "pane"; win.dataset.view = "pane"; }

		return {
			el: win,
			show: function (id) { if (PANES[id]) go(id); },
			setAlert: function (gb) { V.diskFree = Math.round(+gb) || V.diskFree; sync(); },
			destroy: function () {
				mo.disconnect();
				if (ro) ro.disconnect(); else window.removeEventListener("resize", fit);
				host.style.height = "";
				document.removeEventListener("pointerdown", onOutside, true);
				stopHold();
				host.innerHTML = "";
				host.classList.remove("ls-host");
			}
		};
	}

	window.LevoSettings = { mount: mount };
})();
