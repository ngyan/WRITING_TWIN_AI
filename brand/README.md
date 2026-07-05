# Writing Twin AI — Brand Mark Assets

Production logo package for writingtwinai.com. Monochrome, no gradients, favicon-first.

## The mark

Two speech bubbles sharing a wall: a **solid** bubble (your voice) and an **outlined** twin
(the AI). Three ascending dots inside the outlined bubble are the "memory / learning" cue —
they read as a typing indicator and a learning curve at once. The asymmetry is intentional: it
signals intelligence rather than a generic two-bubble chat app.

## Files

| File | Use |
|---|---|
| `icon.svg` | **Master icon.** Uses `currentColor` — inherits text color, adapts to light/dark automatically. Use this in-app. |
| `favicon.svg` | Favicon-optimized geometry (bolder strokes, fills the canvas). Also `currentColor`. |
| `icon-black.svg` / `icon-white.svg` | Explicit-color SVGs for contexts that don't cascade `currentColor`. |
| `wordmark.svg` | Horizontal lockup (mark + "Writing Twin AI"). `currentColor`. |
| `icon-black-{16..512}.png` | Black mark, transparent bg. For light surfaces. |
| `icon-white-{16..512}.png` | White mark, transparent bg. For dark surfaces. |
| `favicon.ico` | Multi-resolution (16/32/48) ICO. Black mark. |
| `apple-touch-icon.png` | 180×180, white mark on dark rounded tile. |
| `manifest-snippet.json` | PWA web-manifest icons block. |
| `chrome-extension-manifest-snippet.json` | MV3 `icons` + `action.default_icon` block. |

## Web favicon setup

Drop the PNGs + favicon.ico + favicon.svg into your `public/` (or `/icons/`) folder and add to `<head>`:

```html
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#111111">
```

The SVG favicon is the primary; `.ico` is the legacy fallback. The SVG uses `currentColor`,
so to make the tab favicon respond to the OS theme, add inside `favicon.svg`:

```html
<style>
  :root { color: #111; }
  @media (prefers-color-scheme: dark) { :root { color: #fff; } }
</style>
```

(Or just ship `icon-black-32.png` / `icon-white-32.png` and switch via `<link media>`.)

## Using the mark in React / components

Because `icon.svg` uses `currentColor`, you can color it with CSS:

```jsx
import Mark from './icon.svg?react';   // SVGR / vite-plugin-svgr
<Mark style={{ color: 'var(--fg)', width: 32, height: 32 }} />
```

```css
.logo { color: #111; }
@media (prefers-color-scheme: dark) { .logo { color: #fff; } }
```

## Wordmark typography

The lockup is set in SF Pro Display / Inter, weight 600, tight tracking (-0.5), with "AI" in
small tracked caps (letter-spacing 2.4, 55% opacity). If you re-typeset it, match those values.
Recommended web font: **Inter** or **Geist**.

## Clear space & minimum size

- Clear space: keep padding ≥ the height of one bubble tail on all sides.
- Minimum icon size: 16px (favicon). Below that the dots merge — don't go smaller.
- Don't recolor with gradients, add shadows, rotate, or place the two bubbles apart.

## Color

Primary is monochrome: `#111111` on light, `#FFFFFF` on dark.
Optional brand accent (use sparingly, e.g. marketing tiles): indigo `#3730A3`.
