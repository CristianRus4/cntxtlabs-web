---
name: Cntxt Labs
description: After ia.net. A slim bar, big bold names, short taglines, full-width bands, one pill to press.
colors:
  bg-light: "#F7F7F7"
  text-light: "#222222"
  muted-light: "#6B6B74"
  rule-light: "#D6D6D6"
  band-light: "#EDEDED"
  bg-dark: "#070707"
  text-dark: "#F0F0F0"
  muted-dark: "#7A7A84"
  rule-dark: "#2A2A2A"
  band-dark: "#121212"
  ink-band: "#070707 (light) / #000000 (dark)"
  accent: "#00B2FF"
typography:
  family: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif"
  body: "17px, 18px from 60rem wide; line-height 1.6"
  display: "clamp(2.6rem, 1.5rem + 4vw, 4.3rem), 700, -0.03em, line-height 1.04"
  tagline: "clamp(1.15rem, 1rem + 0.7vw, 1.5rem), 400"
  lead: "1.28rem"
  heading: "1.4rem, 700"
  small: "0.85 to 0.9rem: captions and the footer"
layout:
  wide: "64rem: bar, hero, bands, cards, footer"
  measure: "40rem: running text"
  gutter: "1.5rem"
---

# Design System: Cntxt Labs

## Overview

**Inspiration: ia.net.** A slim bar, then each thing said once, large and plainly: a name in bold, a short line under it, one button, and the product itself. The palette and the cyan come from iA too, so the move from the first version of the site was one of structure, not colour.

Personality is still discovered, not displayed. The company describes itself with a different word on every load, New Zealand thinks highly of itself on hover, the footer counts back to 2017, and a few things happen if you type. None of that is announced.

## Colours

- **Paper** `#F7F7F7` and **Ink** `#222222` in light; **Void** `#070707` and `#F0F0F0` in dark.
- **Band** `#EDEDED` / `#121212`: the soft grey behind alternate sections and screenshot strips.
- **Ink band** `#070707` (pure black in dark mode): the dark sections. It redefines the colour tokens locally, so anything inside, buttons included, turns over by itself.
- **Quiet** `#6B6B74` / `#7A7A84`: captions, stat labels, blurbs, the footer line.
- **Signal cyan** `#00B2FF`: hover, focus and selection only. Never a fill.

## Typography

The system font, no webfont. One reading size for text; names are set large (`.display`), the line under a name is a step up (`.tagline`), the opening paragraph of a page is a step up (`.lead`), and section headings are bold at 1.4rem. Captions and the footer step down.

## Layout

- **Bar** (`.bar`): sticky, 3rem tall, the mark and Cntxt Labs on the left, Apps / About / Contact on the right. Inner pages add the page name after a slash, as iA does. A hairline appears under it once the page scrolls.
- **Hero** (`.hero`): centred. On an app page: icon, name, tagline, buttons.
- **Page head** (`.page-head`): left aligned, for pages that are mostly words (About, Contact): a small bold label, then the name large.
- **Band** (`.band`): full width, centred. One per app on the home page, alternating grey and ink, with three screenshots running off the bottom edge. `.words` for a band without pictures, `.plain` for one on the page colour.
- **Strip** (`.strip-band`): an app's screenshots in a row that scrolls sideways when it has to.
- **Prose** (`.prose`): a 40rem column. Inline links are underlined.
- **Cards** (`.cards`): a grid for a collection of apps.
- **Footer** (`.site-footer`): link columns, then the colophon under a dashed rule that walks.

## Components

- **Button:** a small pill (padding 0.38em 0.95em) in the ink colour with the label in the paper colour. `.quiet` is a tint of the ink, for the second action. No captions. Hover leans in (scale 1.03), press gives (0.97). On touch screens the hit area is a little larger than the pill. The only round things are buttons, cards and app icons.
- **Download button** (`.button.download`), after trysundrop.app: with a fine pointer, hovering or focusing the pill grows it upward into a 13.5 by 15.75rem card of the same colour holding the app's App Store QR code (`img/<app>/qr.svg`) and "Scan with your iPhone". It springs open and settles back without the spring. The card carries the one large soft shadow on the site. On touch screens it is a plain link.
- **App icon:** the App Store artwork, rounded at 22.5%.
- **Screenshots:** the App Store screenshots, `img/<app>/1.webp` to `6.webp`, 600px wide, rounded.
- **Reveal:** inline text that opens on hover or keyboard focus. Without a pointer, a tap opens it and the words wrap like the rest of the sentence; hover styles never apply on touch, because iOS leaves :hover stuck.
- **Numbers:** three large figures on the home page that count up on arrival, and again when pointed at or tapped.
- **Menu:** Command K, Control K or `/`. A full-page `<dialog>`: what you type over the dashed rule, then the list, with `>` marking the line you are on.
- **Appearance:** follows the system unless chosen in the menu, stored as `data-theme` on `html` and restored in the head before first paint.
- **404:** self-contained, with a small copy of the bar, hero and button. Do not point it at `styles.css`.

## Motion

- The hero and page head rise in, 80ms apart.
- Further down, a band's contents rise into place as they scroll into view, where the browser supports scroll-driven animation.
- Between pages the bar stays still and the rest crossfades, where the browser supports view transitions.
- Nothing loops on its own except the footer rule, which runs on the compositor.
- Everything stops under `prefers-reduced-motion`.

## Do's and Don'ts

**Do**
- Say what an app is and why it exists, in a name, a line and a paragraph or two.
- Keep one primary button per section.
- Use real screenshots and icons from the App Store listing.
- Respect `prefers-reduced-motion`.

**Don't**
- Load a webfont, add gradients, or use the cyan as a fill.
- Add shadows beyond the hairline under the bar and the open QR card.
- Announce the easter eggs.
