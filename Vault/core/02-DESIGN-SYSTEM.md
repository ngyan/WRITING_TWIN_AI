# Design System — Writing Twin AI

> **Source:** Designed for AI-native + professional credibility.
> **Note for Claude Code:** Use these tokens. Never hardcode colors or spacing.
> **Targets:** Next.js web app + Chrome extension popup + (later) mobile.

---

## 🎨 Brand Position

- **Feels like:** A confident editor sitting next to you, not a chatbot.
- **NOT like:** Grammarly (too friendly green), Notion AI (too purple), ChatGPT (too generic).
- **Differentiation:** Deep ink + warm amber. Professional with a human pulse.

---

## 🎨 Color Palette

```ts
// app/lib/design/colors.ts
export const colors = {
  // Primary — ink, authority, intelligence
  primary: {
    50:  '#F0F1FF',
    100: '#E0E2FF',
    200: '#C5C8FF',
    300: '#9BA0FF',
    400: '#6B71F5',
    500: '#4F46E5',   // Primary brand
    600: '#3F37C9',
    700: '#312AA8',
    800: '#252087',
    900: '#1A1666',
  },

  // Accent — warmth, the "human" in AI
  accent: {
    50:  '#FFF8F1',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F59E0B',   // Accent — Humanize button glow
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  // Neutrals — surface and structure
  neutral: {
    0:   '#FFFFFF',
    50:  '#FAFAFB',
    100: '#F4F5F7',
    200: '#E8EAED',
    300: '#D2D5DA',
    400: '#A1A5AE',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#0F172A',   // True ink
  },

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error:   '#EF4444',
  info:    '#3B82F6',

  // Tone-specific (chips in tone selector)
  tones: {
    casual:      '#06B6D4',  // Cyan — relaxed
    professional:'#4F46E5',  // Primary indigo
    executive:   '#0F172A',  // Ink black
    friendly:    '#F59E0B',  // Amber
    direct:      '#DC2626',  // Red — confident
    diplomatic:  '#7C3AED',  // Purple — measured
  },
} as const;
```

---

## 🔤 Typography

```ts
// app/lib/design/typography.ts
// Headings: Inter (Variable) — modern, sharp, professional
// Body: Inter (regular) — same family for cohesion
// Mono (for diffs in rewrite preview): JetBrains Mono

export const typography = {
  fontFamily: {
    sans: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, ui-monospace, monospace',
  },
  fontSize: {
    xs:   ['12px', { lineHeight: '16px', letterSpacing: '0.01em' }],
    sm:   ['13px', { lineHeight: '20px' }],
    base: ['15px', { lineHeight: '24px' }],
    lg:   ['17px', { lineHeight: '28px' }],
    xl:   ['20px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
    '2xl':['24px', { lineHeight: '32px', letterSpacing: '-0.02em' }],
    '3xl':['30px', { lineHeight: '36px', letterSpacing: '-0.02em' }],
    '4xl':['36px', { lineHeight: '40px', letterSpacing: '-0.025em' }],
    '5xl':['48px', { lineHeight: '52px', letterSpacing: '-0.03em' }],
  },
  fontWeight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
};
```

---

## 📐 Spacing, Radius, Shadow

```ts
// Tailwind defaults are mostly fine. Override these:
export const radius = {
  sm:   '6px',
  md:   '10px',   // Default for cards
  lg:   '14px',   // Default for modals
  xl:   '20px',
  pill: '9999px',
};

export const shadow = {
  // Subtle, never heavy. Glassy.
  xs:  '0 1px 2px rgba(15, 23, 42, 0.04)',
  sm:  '0 2px 4px rgba(15, 23, 42, 0.06)',
  md:  '0 4px 12px rgba(15, 23, 42, 0.08)',
  lg:  '0 12px 32px rgba(15, 23, 42, 0.12)',
  // Brand glow for primary CTAs
  glow:'0 0 0 4px rgba(79, 70, 229, 0.15), 0 8px 24px rgba(79, 70, 229, 0.25)',
};

// Spacing scale = Tailwind default (4px increments). Don't reinvent.
```

---

## 🧩 Component Patterns

### Primary Button — "Humanize"
```tsx
// 44px height, primary fill, glow on hover, amber pulse on click
<button className="
  h-11 px-5 rounded-pill
  bg-primary-500 text-white font-semibold text-sm
  shadow-md hover:shadow-glow
  transition-all duration-150
  active:scale-[0.98]
">
  ✨ Humanize
</button>
```

### Tone Selector Chip
```tsx
<button className="
  px-3 h-7 rounded-pill
  text-xs font-medium
  border border-neutral-200
  data-[active=true]:bg-primary-500 data-[active=true]:text-white data-[active=true]:border-primary-500
  hover:border-primary-300
">
  Professional
</button>
```

### Rewrite Preview Card (Diff View)
```
┌─────────────────────────────────────────┐
│ Original              │ Humanized       │
│ ─────────────────     │ ─────────────── │
│ neutral-700 text      │ neutral-900     │
│ neutral-50 bg         │ accent-50 bg    │
│                       │ subtle glow     │
└─────────────────────────────────────────┘
Side-by-side on desktop, stacked on mobile.
Use mono font for clearer diff perception.
```

### Empty State
- Illustration: minimal line-art of a pen + glowing dot
- Headline: 2xl semibold
- Subtext: base neutral-500
- CTA: pill primary

---

## 🌗 Dark Mode

```ts
// Tailwind: dark: variant
// Background: neutral-900
// Surface: neutral-800
// Text: neutral-50 (primary), neutral-300 (secondary)
// Primary: lighten to primary-400 for sufficient contrast
// Accent: stays amber — pops on dark
```

---

## 🎬 Motion

```ts
// Use Framer Motion for the web app, CSS transitions for the extension (size budget)
export const motion = {
  // Standard easing
  ease: [0.22, 1, 0.36, 1],   // ease-out-expo, feels premium
  // Durations
  fast:    120,   // micro-interactions
  base:    200,   // default
  slow:    400,   // page transitions
  // Humanize button — amber pulse
  pulse: { duration: 800, scale: [1, 1.02, 1] },
};
```

---

## 🧱 Chrome Extension Constraints

- **Total CSS budget:** < 30 KB (no Tailwind in build — use inline styles or tiny CSS)
- **Total JS budget:** < 150 KB
- **No external fonts** — use system stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`
- **No animations > 200ms** — Gmail will feel sluggish otherwise
- **Always shadow DOM** — never leak styles into Gmail's DOM

---

## ♿ Accessibility (Day 1)

- All buttons reach contrast ratio 4.5:1 minimum on background
- Focus rings: 2px solid primary-500 with 2px offset
- Keyboard shortcut for Humanize: `Cmd/Ctrl + Shift + H` (configurable)
- Screen reader announces rewrite completion: `aria-live="polite"`

---

## 📦 Where These Tokens Live

| Location | What |
|---|---|
| `frontend/src/lib/design/tokens.ts` | All TS exports above |
| `frontend/tailwind.config.ts` | Tailwind theme extends from tokens.ts |
| `extension/src/styles/tokens.css` | CSS variables for extension (size budget) |
| Figma | Mirror tokens — name with same keys for traceability |
