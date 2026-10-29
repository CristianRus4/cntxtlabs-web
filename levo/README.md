# levo/

The Levo product page, at cntxtlabs.co/levo.

It is the one page on the site with its own design, by Cristian's choice: a full
product page rather than the classic 600px text column. It does not load
`styles.css` or `site.js`. Everything it needs lives here.

```
index.html               the page: the Mac, then Agents, Settings, and the price
levo.css                 the page's design
levo.js                  LEVO (price, links), appearance, arrivals, the agents' chips and install prompt
demo.css                 the full-screen desk, the Levo window, dock, lock screen and popover
demo.js                  the menubar demo, and the one data object it plays from
menus.css, menus.js      the menubar menus, Control Centre, and the desktop windows (Finder, TextEdit, System Settings), resizable
settings.css, settings.js the app's Settings window, at the app's own sizes, as LevoSettings.mount(el, opts)
bento.css, bento.js       the tiles below the Mac: close-ups of the app (disk bar, gauges, Summary, holds, Trash, levels, the confirm sheet) and big-number facts, animated as they scroll in
mobile.css, mobile.js     the phone page (760 px and narrower): .m-top (the hero, a menubar slice with the popover) and .m-end (agents, price); #bento sits between
img/shots/               the popover and Settings as still images for phones, rendered from the demo, light and dark
agents.md                for an agent: what Levo is, why it's safe, and how to install it
llms.txt                 a short index for language models
img/icon-*.png           the app icon at 256 and 96 px
img/dock/                the dock's app icons in light and dark (and Levo's, from the app), rendered on a Mac; swap the folder to change the set
img/symbols/             SF Symbols as SVG, and symbols.js, the bundle the page uses
tools/                   export-symbols.swift, export-dock-icons.swift (swift tools/export-dock-icons.swift, from levo/), and the symbol list
```

## Symbols

Every symbol on the page and in the demo is a real SF Symbol, exported as a
vector on a Mac. `tools/symbols.txt` lists them; `swift tools/export-symbols.swift`
exports them all, or `swift tools/export-symbols.swift <name>` adds one. It writes
`img/symbols/<name>.svg` and rebuilds `img/symbols/symbols.js`, which the page
inlines in `currentColor` through `LevoDemo.sym(name, size)`. The demo uses the
app's own symbol names (its `GroupIcon` and Settings panes). This is a mockup of
Mac software, the use Apple's SF Symbols terms allow; no symbol is used as a logo.
The Levo mark is the brand's own drawing.

## The demo

`demo.js` holds `LEVO_DEMO`, the single data object behind the popover: the disk,
its categories, the findings and their items, the processes, and the notification
text. Swap its values, icons or tile colours for the app's own and the demo
follows. The page calls `LevoDemo.mount(el)`, and the Settings preview talks to it
through `LevoDemo.setAlert(gb)` and `LevoDemo.setAgent(name)`.

The desktop shows only what the browser already knows: the time, the date, the
city from the time zone, the language, the battery where the browser allows it,
the appearance and the device family. It asks for nothing, and nothing leaves the
browser.

The first screen is the Mac in a rounded frame under a sticky navbar (Levo,
Agents, Price, Download), its own menubar along the frame's top edge, and the Levo window (the app, Applications, the
price and Download) sits on the desktop. Closed, it comes back from the mounted
"Levo" disk image on the desktop. Desktop icons sit loosely and can be dragged;
they never land on the widgets, the windows, the popover or each other, and
reset on reload. The popover uses the app's own sizes (360 pt wide, text scale 1),
taken from its code.

Below 760px wide the page is a phone page instead, nothing to operate: the
name, price and buttons, then a slice of a Mac (the wallpaper, the menubar
drawn live with Levo's mark and the visitor's time, and the popover as a still
from img/shots/ that opens under Levo's item when it comes into view; re-render
it from the demo when the popover changes), then #bento, then the same agent
chips and toast (mobile.js moves #levo-agents in), then the price again. On
scroll, as on getleft.app: the hero text drifts up at 0.45 speed and fades over
220px, the Mac slice grows from 94% to full width, blocks rise 24px as they
arrive, the chips one by one, the last icon turns upright; the bar with
Download comes in once the hero's buttons fade and steps aside for the last
ones. Less motion: fades only.

The desktop works: Old Installers opens in Finder, the notes in TextEdit, and
the zip unzips into a folder. Control Centre's Dark Mode, or System Settings ›
Appearance, switches the whole page, and is never saved: a reload follows the
device again.

A laptop shows its real battery level and state; a Mac the browser reports as
having no battery (100 % and charging, with no charge time) shows no battery
item and a calendar widget instead. Browsers that don't report a battery show
neither.

The popover follows the app's round 5 design (Levo/design/renders/R5): the
disk bar in 60 ticks with 2 pt gaps, the gauges whose word frees them, rows
with ⓘ bubbles on hover, processes Levo won't quit dimmed with the reason on
hover, Clean up ⌘⌫, the first-time "You're in Charge" step, then the confirm
list.

It plays forever: Clean up, then Analyse now (in the empty list or the ⌘K panel)
and every item grows back. Levo can't be removed: Quit, dragging the menubar icon
out or the dock icon to the Trash all bring it back, with one quiet line the
second time. Desktop icons that belong to a cleanup item fly to the Trash when it
is cleaned and return with it. Apple menu › Lock Screen shows the visitor's own
time and unlocks on a click or a key.

## Motion

Studied from tryklack.com and tryalcove.com (their CSS and JS, and a screen
recording), then re-created, not copied:

- **Arrivals:** blocks below rise 16px and fade in as they scroll into view.
- **Hovers:** 300ms is the default; small distances (2 to 6px). Symbols act out
  their meaning: agents' terminals draw on, and each Settings pane's tile moves
  its own way (the gear turns, the shield and chip pop, the wand wiggles, the
  lock and display hop, the drive slides), springs on
  `cubic-bezier(.34,1.56,.64,1)`.
- **Hand-drawn circle** (around the price): `stroke-dasharray` 500, drawn to 0 over
  800ms `ease-in` after 500ms, each time it scrolls into view.
- **Ghost cursor:** after the load a macOS pointer selects a file, drags the Levo
  window a little and clicks the notification, which opens Levo. Eased curved moves,
  a press on each click. The visitor's first move, touch or key hands over: it
  fades out for the visit. With less motion there is no ghost; the popover is open.
- **First screen:** the wallpaper fades in, the menubar drops in at 150ms, the
  widgets and icons rise at 350 to 450ms, the dock rises at 550ms (400ms
  ease-out, as Alcove's unlock), the Levo window springs in at 750ms; the alert
  arrives at 1.5s and the popover opens on its own at 2.7s.
- **Dock:** macOS magnification by distance to the pointer, labels scale from 90%
  over 200ms, a click bounces the icon twice.
- **Less motion** (`prefers-reduced-motion`): fades only, no rises, tilts, springs,
  bounces or nudges. Neither reference site does this; this page does.

## Settings section

Switched off for now: `SHOW_SETTINGS` in `levo.js`. Set it to `true` to bring it back; settings.js and settings.css are kept.

## Price and links

`LEVO` at the top of `levo.js` holds the price, the term, the download link and
the checkout link. The Levo window, the Buy and Download buttons and the agents'
install prompt all read from it. When the price rises, change `price` and
nothing else. The page never says when or by how much the price rises, or how
many licences are left at a price.

`[DOWNLOAD LINK]` and `[BUY LINK]` are placeholders until the real download and
the Lemon Squeezy checkout exist; until then the buttons do nothing.
`agents.md` is a static file for agents, so it carries `[DOWNLOAD LINK]` too:
replace it in both places (`grep -rn "DOWNLOAD LINK" levo/`).

## Agents

Clicking an agent's chip copies a short prompt that has that agent read
`agents.md`, download Levo, check it is signed and notarised by Cntxt Labs (team
ID `5X94H5ZCD4`), move it to /Applications, open it, and leave the welcome window
to the person. `agents.md` holds the full plain explanation; the page itself
carries names, labels, numbers and the price only.

## The popover

The demo shows the app's Summary layout (round 10, SummarySection.swift): the
five-part disk bar (System Data, Your Data, Apps, Ready to free, Free; only the
green fills), the gauges, then "A balanced clean up frees 33.7 GB: Xcode build
data, Simulators and emulators and 5 more." The level word is a menu (Careful,
Balanced, Aggressive, Everything); the amount, "5 more" and the empty space open
the full breakdown, and the sentence holds still while ticking there. A metric
past its limit adds "Free up GPU, it's at 88%." The Command K panel and every
confirm are bottom sheets that grow the popover if needed. The Expanded lists
are still in the code (the breakdown).
