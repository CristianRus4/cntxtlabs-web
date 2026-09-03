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
- One type size. Weight 400 / 500 / 700 is the hierarchy.
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
- **Quiet** (#6B6B74 light, #7A7A84 dark): footer only. Meets WCAG AA.
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

**The One Size Rule.** Do not introduce a type scale. Do not load a webfont.

## Layout

A single column, `max-width: calc(600px + 3em)`, padding 15em top (10em on small screens) and 1.5em sides. Flex column so the footer can sit at the bottom of short pages.

Rhythm: 0 between a title and its first line, 1.2em between paragraphs, 0.75em before a product list, 1.5em between products, 3em before the lead. Tight groups, then a real break.

No grid. No cards. Lists are unstyled.

## Elevation & Depth

None. No shadows, no blur on the page (blur is reserved for unpublished product names). The footer is separated by a dashed hairline.

## Shapes

**The Square Rule.** Radius is 0. Icons are 24px strokes. The mark is the only custom shape.

## Components

- **Wordmark:** 700, vowels collapse into `.grow` until hover or the `cntxt` easter egg.
- **Link:** 500, no underline, cyan on hover and `:focus-visible` with a 1px dotted outline.
- **Outlink:** stacked `> Download` / `> Website` lines, padded for a thumb.
- **Reveal:** inline text that opens on hover, keyboard focus, or a tap when there is no hover.
- **Blurred product:** name and description `filter: blur(3.5px)`, not a link, not selectable.
- **404:** self-contained. Do not point it at `styles.css`.

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
