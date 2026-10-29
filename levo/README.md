# levo/

The Levo product page, at cntxtlabs.co/levo.

It is the one page on the site with its own design, by Cristian's choice: a full
product page rather than the classic 600px text column. It does not load
`styles.css` or `site.js`. Everything it needs lives here.

```
index.html               the page
levo.css                 the page's design
levo.js                  price, appearance, load and arrival, feature symbols, the Settings preview
demo.css                 the fake Mac desktop, dock, lock screen and popover
demo.js                  the menubar demo, and the one data object it plays from
menus.css, menus.js      the menubar menus (Apple, Finder, File to Help, Wi-Fi, battery, clock)
img/icon-*.png           the app icon at 256 and 96 px
img/dock/                the company's own app icons, for the dock
img/symbols/             SF Symbols as SVG, and symbols.js, the bundle the page uses
tools/                   export-symbols.swift and the list of symbols it exports
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

Below 760px wide the scene switches to a compact layout: the menubar and the
popover, without the widgets, desktop icons or dock.

It plays forever: Clean up, then Analyse now (in the empty list or the ⌘K panel)
and every item grows back. Levo can't be removed: Quit, dragging the menubar icon
out or the dock icon to the Trash all bring it back, with one quiet line the
second time. Desktop icons that belong to a cleanup item fly to the Trash when it
is cleaned and return with it. The lock screen shows the visitor's own time and
unlocks on a click, a key or after a moment.

## Motion

Studied from tryklack.com and tryalcove.com (their CSS and JS, and a screen
recording), then re-created, not copied:

- **Load:** a 150ms step between groups (they use 200ms): nav fades over 700ms,
  then the headline rises 32px with a 2° tilt, then the words, the buttons and the
  hero rise 20px. Each takes 500ms with `ease`. No blur on load.
- **Arrivals:** blocks below rise 16px and fade in as they scroll into view.
- **Hovers:** 300ms is the default; small distances (2 to 6px). Each feature
  symbol acts out its meaning: the gauge needle sweeps through three states, the
  terminal draws on, the bell rings and gains its badge, the square ticks with a
  spring (`cubic-bezier(.34,1.56,.64,1)`), the trash hops and fills, the shield
  locks, the person shakes, the cloud floats.
- **Hand-drawn circle:** one SVG path, `stroke-dasharray` 500, drawn to 0 over
  800ms `ease-in` after 500ms, each time it scrolls into view.
- **Hint:** "Psst…" in 14px bold at 40% ink under the demo; its arrow nudges 4px
  every 4 seconds.
- **Lock screen:** fades over 400 to 450ms while the dock rises from below
  (400ms ease-out) and the menubar settles 100ms later.
- **Dock:** macOS magnification by distance to the pointer, labels scale from 90%
  over 200ms, a click bounces the icon twice.
- **Footer:** the name in huge type, filled with a gradient from 10% ink to
  nothing and cut off by its box. Hidden on phones.
- **Less motion** (`prefers-reduced-motion`): fades only, no rises, tilts, springs,
  bounces or nudges. Neither reference site does this; this page does.

## Price

Levo is a lifetime licence. Its price lives in one place, `PRICE` at the top of
`levo.js`; the Buy buttons and the price line read from it. When the price
rises, change `amount` there and nothing else. The page never says when or by
how much the price rises, or how many licences are left at a price.

## Placeholders

`[DOWNLOAD LINK]` and `[BUY LINK]` in `index.html` wait for the real download and
the Lemon Squeezy checkout. Until then the buttons do nothing.
