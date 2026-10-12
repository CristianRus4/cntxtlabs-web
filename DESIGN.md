---
name: Cntxt Labs
description: A quiet studio site. System type, one size, weight for hierarchy.
colors:
  bg-light: "#F7F7F7"
  text-light: "#222222"
  muted-light: "#6B6B74"
  rule-light: "#D6D6D6"
  bg-dark: "#070707"
  text-dark: "#F0F0F0"
  muted-dark: "#7A7A84"
  rule-dark: "#2A2A2A"
  accent: "#00B2FF"
typography:
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.6
  heading:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.6
rounded:
  none: "0px"
spacing:
  line: "1.2em"
  group: "0.75em"
  section: "3em"
  page-x: "1.5em"
  page-y: "15em"
components:
  link:
    textColor: "{colors.text-light}"
    typography: "{typography.heading}"
  link-hover:
    textColor: "{colors.accent}"
  outlink:
    textColor: "{colors.text-light}"
    padding: "0.45em 0"
---

# Design System: Cntxt Labs

## Overview

**Creative North Star: "The writer's desk"**

Type after nelson.co: the system stack, one size, weight carries hierarchy, no font-smoothing override. Colour after iA Writer. The page is a column of sentences, not a marketing layout.

Personality is discovered, not displayed. Vowels hide in the wordmark, New Zealand unfolds, the year counts back to 2017. None of that is announced.

**Key Characteristics:**
- One type size. Weight 400 / 500 / 700 is the hierarchy. The footer is the one step down, at 13px.
- A 600px measure, left aligned, no cards, no rounded corners, no pill buttons.
- Cyan `#00B2FF` only on hover, focus, and selection.
- Flat. Depth is a dashed rule above the footer, nothing else.

## Colors

A paper field and a near-black field, with one accent used sparingly.

### Primary
- **Signal cyan** (#00B2FF): hover, focus, text selection. Rare on purpose.

### Neutral
- **Paper** (#F7F7F7) / **Ink** (#222222) in light.
- **Void** (#070707) / **Paper-on-dark** (#F0F0F0) in dark.
- **Quiet** (#6B6B74 light, #7A7A84 dark): the footer and hints in the menu. Meets WCAG AA.
- **Hairline** (#D6D6D6 / #2A2A2A): dashed footer rule.

**The One Voice Rule.** The accent is a reaction, never a fill.

## Typography

**Display Font:** system-ui stack (same as body)
**Body Font:** system-ui stack

**Character:** Nelson's one-size setting. The wordmark is 700, titles 500, running text 400. Nothing else.

### Hierarchy
- **Display / wordmark** (700, 15px, 1.6): the cntxt lockup.
- **Title** (500, 15px, 1.6): page names. Sit the next line against them (`margin-bottom: 0`).
- **Body** (400, 15px, 1.6): everything else. Measure ~600px, ~65–75ch.
- **Label** (500, 15px): links and product names.

**The One Size Rule.** Do not introduce a type scale. The footer at 13px is the only exception. Do not load a webfont.

## Layout

A single column, `max-width: calc(600px + 3em)`, padding 15em top (6.5em on small screens) and 1.5em sides. Flex column so the footer can sit at the bottom of short pages.

Rhythm: 0 between a title and its first line, 1.2em between paragraphs, 0.75em before a product list, 1.5em between products, 3em before the lead. Tight groups, then a real break.

No grid. No cards. Lists are unstyled.

## Elevation & Depth

None. No shadows, no blur on the page (blur is reserved for unpublished product names). The footer is separated by a dashed hairline.

## Shapes

**The Square Rule.** Radius is 0, except buttons, which are pills after iA, and the square a download button grows into. Icons are 24px strokes. The mark is the only custom shape.

## Components

- **Wordmark:** 700, vowels collapse into `.grow` until hover or the `cntxt` easter egg.
- **Link:** 500, no underline, cyan on hover and `:focus-visible` with a 1px dotted outline.
- **Button:** a small pill (padding 0.38em 0.95em) in the ink colour with the label in the paper colour, so it inverts in dark mode. `.quiet` is the secondary, in a tint of the ink. No captions. Each sits in `.action`, inside `.actions`. Hover leans in (scale 1.03), press gives (0.97). On touch screens the hit area is a little larger than the pill.
- **Download button** (`.button.download`), after getleft.app: with a fine pointer, hovering or focusing the pill fades its label and grows it upward into a square of its own width and colour, filled by the App Store QR code (`img/<app>/qr.svg`, used as a mask) in the label's colour: light on the dark pill, dark on the light one. Nothing around the button shifts. On touch screens it is a plain link.
- **Reveal:** inline text that opens on hover or keyboard focus. Without a pointer, a tap opens it and the words wrap like the rest of the sentence; hover styles never apply on touch, because iOS leaves :hover stuck. The wordmark opens on the first tap and follows its link on the second.
- **Blurred product:** unpublished only. Name and description as transparent text with a 7px `text-shadow`, not a link, not selectable.
- **Project row:** the name is the link, and its `::after` covers the row, so the description answers to it too.
- **Copy button:** a `.button.quiet` with `data-copy`, in an `.action` that stays hidden until the browser can copy.
- **Menu:** Command K, Control K or `/`. A full-page `<dialog>` in the same column: what you type over the dashed rule, then the list, with `>` marking the line you are on. Pages, the email, and the appearance.
- **Appearance:** follows the system unless chosen in the menu, stored as `data-theme` on `html` and restored in the head before first paint.
- **404:** self-contained. Do not point it at `styles.css`.

## Motion

- **Arrival:** each block rises 0.9em and fades in, 80ms apart. A project list hands its delay to its rows, which follow 55ms apart.
- **Between pages:** the masthead is already in place and does not animate again. Where the browser supports it, the pages crossfade.
- **Nothing loops on its own** except the footer rule, which runs on the compositor. The mark bobs while you hover it, or twice when it arrives on a phone.
- Every animation stops under `prefers-reduced-motion`.

## Hidden details

All text, all discovered rather than announced:

- **Descriptor:** clicking "A ___ company" backspaces the word and types the next one in behind a cyan caret.
- **Live lines** (`data-live`, `.grow-live`): Left's line and heading reveal how much of the year is already gone; txtpod's reveal how long the page would run as an episode, at 150 words a minute.
- **Sky:** the footer's New Zealand reveal says the time in Auckland and what the sun is doing there (dark, nearly light, just up, up, high, going down, just set), worked out from the date in the page.
- **Years:** pointing at or tapping the year in the footer counts it up from 2017.
- **Keys:** typing an app's or a page's name (left, txtpod, safeplate, camping, aussie, nosnus, ftnss, bites, notsobusy, about, contact, home) goes there. g then a letter: h home, l Left, t txtpod, s SafePlate, k camping, n NoSnus, b about, c contact, a App Store. Typing cntxt shows everything hidden; kiwi renames New Zealand; the Konami code turns the page over; space at the end of a page rains squares; / or Command K opens the menu.

## Do's and Don'ts

**Do**
- Keep the system stack and the 15px body.
- Let weight, not size, mark a title.
- Put new product rows in `.projects` with a `.desc`.
- Respect `prefers-reduced-motion`.

**Don't**
- Add Inter, Geist, cards, rounded buttons, gradients, or a second type size.
- Fill the compass, globe, or any icon button back in.
- Announce the easter eggs.
- Animate layout with bounce or elastic easing.
- Use the accent as a background.
