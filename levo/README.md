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
bento.css, bento.js       the tiles below the Mac, each the popover's own component built by demo.js (LevoDemo.parts) in its tokens (.lv-kit), so crisp at any scale: Auto mode's chart, the disk, gauges, the list, the confirm sheet, the actions sheet, the agents and the cleanup levels
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
install prompt all read from it. The live price comes from `priceURL` (the
price Worker's price.json, CORS open); `price` is the fallback if it fails. The
price section shows the price with "once", "Lifetime licence for 2 Macs. No
subscription.", a bar of the ten tiers ($4.99 to $49.99, step $5, from
`tiers`) with the current one lit, "Then" the next tier, and "Up $5 every 10
licences." (the owner's call, 2026-10-30). How many licences are left is not
shown: the Worker doesn't give it. `left` and the hidden `[data-left]` line are
ready for "N left at $4.99" if the owner wants it.

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

The demo shows the app's Summary layout in round 13's order (PopoverView.swift):
the Mac's name (with "Auto mode" in plain orange at its end while it's on), a
divider, the gauges, a divider, free space, "to clean up" and the five-part
disk bar (macOS's order and palette as the app since round 14: Your Data red,
Apps orange, System Data yellow, Ready to free green, Free faint; only the
green fills). The green amount and the bar's green are everything Levo can
clean, the sum of every listed group, as the app since f39f443; ticking
changes only the sentence's amount. Then a divider, then "A balanced clean up frees 33 GB: Xcode build data, Simulators and
4 more.", then the status line and the action bar. The status line counts up while it
works ("Scanning disk… 62%", then "Analysing… 40%"), and "Checked just now"
analyses on a click. The menubar mark is 17 pt wide, as the app's. The level word is a menu (Careful, Balanced, Aggressive, Everything);
the amount, "4 more" and the empty space open the full breakdown, and the
sentence holds still while ticking there. The Command K panel and every confirm
are bottom sheets that grow the popover if needed. The Expanded lists are still
in the code (the breakdown). The phone stills in img/shots are element
screenshots of the popover at 3x, corners masked; re-render them when it changes.

## Auto mode

Auto mode (the app's name; it used to be auto-clean) keeps free space above the
limit on its own. In the demo, "Turn on Auto mode" in the Command K panel
switches it: the "Auto mode" pill shows beside
the Mac's name, and "Auto mode keeps 20 GB free: it cleans Xcode build data
and 2 more on its own." takes the cleanup sentence's place (as the app: two
groups by name, or one and "N more"); if free space is
under the limit Levo cleans those groups with no click. The groups are the ones
whose every item is level 1. The first bento tile shows the same name row and
sentence beside a few days of free space drifting down to the limit, where
Levo cleans and the line steps back up ("Freed 12 GB"), once each time it
comes into view. agents.md, llms.txt and features_Levo.txt on the demo's
desktop say Auto mode too.

## macOS realism

The desktop follows macOS Tahoe (macOS 26). Apple publishes no point values for
it, so sizes come from Apple's macOS pages and screenshots plus community
measurements: 26 pt window corners, toolbar controls in glass capsules, 13 pt menu corners with SF Symbols
beside standard items, Liquid Glass widgets and notifications with a lit rim.
Real icons are rendered from this Mac through IconServices:
`swift tools/export-dock-icons.swift` (the dock's apps, light and dark, and the
Levo disk image) and `swift tools/export-desk-icons.swift` (folder, txt, zip,
pdf, png, psd, dmg, pkg and app document icons; macOS gives the same image in
light and dark for document types, so there is one file each; plus, at 128 pt,
the Applications folder for the installer window, this Mac's own icon for About
This Mac on a Mac mini and for power alerts, and a MacBook Pro and an iMac from
CoreTypes.bundle). Nothing on the desktop is drawn by hand: Force Quit and
Battery list apps with their own icons, Go to Folder rows use the real folder,
and Finder's alerts show Finder's icon. desk.css holds
the desktop's Tahoe styling; menus.js and menus.css the menus, Finder windows and
Control Centre.

Finder windows follow Levo/design/refs/finder-ref (light and dark), style only:
a 170 pt sidebar down the window's left (Recents, Shared; Favourites:
Applications, Downloads, Desktop, Documents; Locations: iCloud Drive, AirDrop;
Tags), 32 pt rows of 13 pt text with blue outline symbols, then back and
forward, the title, the view, group, actions and search capsules, 64 pt icons
with blue sizes, and "N items, X GB available". Never the owner's own folders.

The Trash: drag a desktop file or a Finder item onto the dock's Trash, press
Command Delete, or right-click › Move to Trash. It flies in, the Trash icon fills
(CoreTypes.bundle's TrashIcon and FullTrashIcon), and the popover gains a Trash
row sized by what's in it, placed by size. Clicking the Trash opens its window
with Empty; emptying asks first, the icons shrink away, the space comes back
and the icon empties. A clean's Trash-bound items show there too, already
counted as freed. LevoMenus has updateWindow(id, patch) and
contextMenu(x, y, items) for this, and hooks trashItem, dragItem and dropItem.

## Website round 8

- The simulated screen is sized by the viewport's height (about 90 %, less the
  navbar and the gap above), 16:10, at most 1440 px wide, so a 1280 × 720
  window shows all of it. It is laid out at its final pixel size: no transform
  on the screen, the dock, labels or tips, and the system font with
  antialiasing, so its text is as crisp as the page's. Below 1100 px wide the
  installer window is smaller and the desktop drops its two least useful files.
- The popover follows the app's round 15: the bar runs Your Data, System Data,
  Apps, Ready, Free; the tip moves by section; a clicked word shows no hover
  look until the pointer leaves; Clean up is an icon-only button at the name
  row's end while Auto mode is off ("Clean up ⌘⌫" on hover), and the action
  bar's keycap buttons are quieter; "33 GB ready".
- The menus follow macOS 26 (Levo/design/refs/macos-menus, git-ignored):
  Apple's words in Title Case, icons only where macOS shows them, 24 pt rows,
  12 pt corners, inset separators, one glyph per modifier. View, Window and File
  wake for the front Finder window; Go's places open Finder windows; Edit ›
  Undo puts the last move to the Trash back. The demo's user is Alex Rivers.
- The notification has 18 px corners and macOS's round close button on hover.
  Control Centre has no Auto mode. Mail in the dock writes to support.
- The footer: support, Privacy, Terms and Cntxt Labs, small, over a huge faint
  "Levo" the page's bottom edge clips. Privacy and Terms are placeholders in
  levo.js until their pages exist.

## Website round 9

- The popover follows the app's round 16: nothing at the name row's end while
  Auto mode is off (Clean up lives in the action bar, with the Command K
  panel's keycaps); while it's on, "Auto mode" as an orange Liquid Glass
  capsule with its limit and scope on hover. Gauge ticks take their own colour
  along the arc, set as each line's stroke.
- "Click here": "click" over "here" in handwriting above the simulator, three
  short rays on each side, and a short soft arc from under the words to Levo's
  menubar icon (levo.js places the tip). The arrow and rays draw on, the cue
  bobs while the rays pulse, and it fades once the icon is clicked.
  Phones have no simulator, so no arrow.
- The installer is a normal desktop window (LevoMenus.window "custom", id
  levo-dmg): front on a click, resizable, dragged by its title bar, working
  lights; the disk image or Finder in the dock reopens it where it was.
- Text files open in TextEdit; TextEdit joins the dock with its running dot
  while a text window is open, and names the menubar while in front.
- Auto mode is told with the product's own UI: the popover's bar fills day by
  day, Levo cleans at the limit, and a notification says what it freed.
- The footer runs on Matter.js 0.20.0 (cdnjs, pinned with its integrity hash,
  loaded only near the footer). "Levo" is set in the rounded heavy face
  (ui-rounded, with the page's fallbacks), huge, its lower part under the
  page's bottom edge, its ink fading from the letters' top to nothing at the
  edge. The letters are drawn on one canvas, and each collider is the convex
  hull of the same glyph drawn the same way (full shape, whatever the fade), so
  the drawing and the colliders can't disagree in any browser. A resize
  (debounced) or the fonts loading rebuilds both; every body is then moved and
  scaled with the letters, kept inside the walls, lifted clear of the letters,
  and left to gravity. The levo assets carry ?v= so a cached mix can't return.
- The full Trash, about one and a half files tall, stands centred on the e's
  round top, wobbles, and after a push (repeated a little firmer if it rocks
  back) tips towards "vo". Files in the bin aren't bodies: past about 70
  degrees of tilt they come out at the rim one at a time with the bin's own
  velocity and a small nudge out of the opening, quicker the further it turns
  over, and only into open space, so some may stay in. A file dropped into the
  upright bin goes in, and the bin turns full.
- Everything is grabbed at the exact point under the pointer (a soft spring
  with a little damping), so things hang and swing; mouse and touch alike. A
  gentle settle tips anything at rest onto its nearest flat side. Double-click
  stands the bin up. Reduced motion: no physics, the bin on its side on the e,
  files on the other letters.
- The page has no visible scrollbar (html only; the simulator's own scroll
  areas are untouched).
