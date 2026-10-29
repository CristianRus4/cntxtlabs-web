# levo/

The Levo product page, at cntxtlabs.co/levo.

It is the one page on the site with its own design, by Cristian's choice: a full
product page rather than the classic 600px text column. It does not load
`styles.css` or `site.js`. Everything it needs lives here.

```
index.html     the page
levo.css       the page's design
levo.js        appearance, arrival, step icons, the Settings preview
demo.css       the fake Mac desktop and the popover
demo.js        the menubar demo, and the one data object it plays from
img/           the app icon at 256 and 96 px
```

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
popover, without the widgets.

## Placeholders

`[DOWNLOAD LINK]`, `[BUY LINK]` and `[PRICE]` in `index.html` wait for the real
download, checkout and price. Until then the buttons do nothing.
