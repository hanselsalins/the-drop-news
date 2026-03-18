# The Drop — Master Design System B
**Youth News App · India · Ages 8–20**
Generated: 2026-03-18

---

## Overview

Design System B is an alternative visual direction. It emphasises warmth and legibility for younger bands, transitioning to refined editorial minimalism for older readers. Each band is fully isolated — tokens, typography, motion, and component rules never cross band boundaries.

---

## Band 1 · Ages 8–10 · "Kids"

### Identity
- Style: Claymorphism — soft 3D, chunky, bubbly, toy-like
- Mood: Warm, playful, safe, welcoming
- India context: Warm indigo + saffron palette — festival energy without being overstimulating

### Color Tokens
```css
--drop-primary:      #4F46E5;   /* Warm indigo — main brand */
--drop-secondary:    #F59E0B;   /* Saffron amber — joy */
--drop-accent:       #10B981;   /* Emerald — success/reward */
--drop-accent2:      #EC4899;   /* Pink — wonder */
--drop-bg:           #F5F3FF;   /* Lavender cream — safe base */
--drop-surface:      #FFFFFF;
--drop-surface-alt:  #EDE9FE;
--drop-text:         #1E1B4B;   /* Deep indigo — high contrast */
--drop-text-muted:   #6D5FBB;
--drop-border:       #C4B5FD;
--drop-error:        #EF4444;
--drop-success:      #10B981;
```

### Typography
- **Heading:** Baloo 2 (Google Fonts) — rounder, structured, perfect for youngest Indian readers
- **Body:** Nunito (rounded, warm — familiar and friendly)
- **Install:** `@fontsource/baloo-2` + `@fontsource/nunito`

```css
--font-heading: 'Baloo 2', 'Fredoka', cursive;
--font-body:    'Nunito', 'Outfit', sans-serif;

--text-hero:   clamp(2.5rem, 8vw, 4.5rem);
--text-h1:     clamp(2rem, 6vw, 3.5rem);
--text-h2:     clamp(1.5rem, 4vw, 2.25rem);
--text-body:   1.25rem;   /* 20px minimum for kids */
--text-small:  1rem;
--line-height: 1.8;
--letter-space: 0.01em;
```

### Spacing & Radius
```css
--space-xs:  8px;
--space-sm:  12px;
--space-md:  20px;
--space-lg:  32px;
--space-xl:  52px;

--radius-sm:  14px;
--radius-md:  22px;
--radius-lg:  32px;
--radius-full: 999px;
```

### Shadows (Claymorphism)
```css
--shadow-clay:  4px 4px 0px 0px rgba(79,70,229,0.2), 0 8px 24px rgba(79,70,229,0.15);
--shadow-card:  6px 6px 0px 0px #C4B5FD, 0 12px 32px rgba(0,0,0,0.06);
--shadow-btn:   4px 4px 0px 0px #3730A3;
--shadow-btn-hover: 2px 2px 0px 0px #3730A3;
```

### Motion
```css
--duration-fast:   150ms;
--duration-normal: 250ms;
--duration-slow:   400ms;
--ease-bounce:     cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-out:        cubic-bezier(0.16, 1, 0.3, 1);
```
- Button press: scale(0.95) translateY(2px) — 150ms ease-bounce
- Card hover: translateY(-4px) — 250ms ease-out
- Page entry: fade-in + slideUp 24px — 400ms staggered
- **Respect prefers-reduced-motion: reduce all to opacity-only**

### Component Rules
- **Touch targets:** 56px minimum
- **Buttons:** Bold border (3px solid), clay shadow, rounded-full, font-weight 700
- **Cards:** White surface, clay shadow, 32px radius, thick coloured top-border
- **Icons:** SVG only — Lucide icons at 28px
- **Category badges:** Pill shape, solid fill, Baloo 2 Bold, uppercase

### Anti-patterns
- No dark mode for this band
- No thin fonts (min weight 600 for all UI text)
- No more than 4 colours on screen at once
- No auto-playing video or audio

---

## Band 2 · Ages 11–13 · "Tweens"

### Identity
- Style: Soft Flat — clean cards, bold colour blocks, generous whitespace
- Mood: Bright, friendly, energetic, approachable
- India context: Clean WhatsApp-familiar UI, bold fills over gradients

### Color Tokens
```css
--drop-primary:      #2563EB;   /* Bold blue */
--drop-secondary:    #0EA5E9;   /* Sky blue */
--drop-accent:       #8B5CF6;   /* Purple pop */
--drop-accent2:      #F59E0B;   /* Amber */
--drop-bg:           #F0F9FF;   /* Ice blue — fresh base */
--drop-surface:      #FFFFFF;
--drop-surface-alt:  #E0F2FE;
--drop-text:         #0C2340;   /* Deep blue-black */
--drop-text-muted:   #475569;
--drop-border:       #BAE6FD;
--drop-error:        #EF4444;
--drop-success:      #10B981;
```

### Typography
- **Heading:** Fredoka (rounder, energetic — step up from Baloo 2 for this band)
- **Body:** Outfit (clean and efficient, easy to scan)
- **Install:** `@fontsource/fredoka` + `@fontsource/outfit`

```css
--font-heading: 'Fredoka', 'Baloo 2', cursive;
--font-body:    'Outfit', 'Nunito', sans-serif;

--text-hero:   clamp(2rem, 7vw, 4rem);
--text-h1:     clamp(1.75rem, 5vw, 3rem);
--text-h2:     clamp(1.375rem, 3.5vw, 2rem);
--text-body:   1.0625rem;   /* 17px */
--text-small:  0.875rem;
--line-height: 1.65;
```

### Spacing & Radius
```css
--space-xs:  6px;
--space-sm:  10px;
--space-md:  16px;
--space-lg:  28px;
--space-xl:  48px;

--radius-sm:  8px;
--radius-md:  14px;
--radius-lg:  20px;
--radius-full: 999px;
```

### Shadows
```css
--shadow-card:       0 2px 12px rgba(37,99,235,0.10), 0 1px 3px rgba(0,0,0,0.05);
--shadow-btn:        0 4px 14px rgba(37,99,235,0.30);
--shadow-card-hover: 0 8px 28px rgba(37,99,235,0.14);
```

### Motion
```css
--duration-fast:   120ms;
--duration-normal: 220ms;
--duration-slow:   360ms;
--ease-spring:     cubic-bezier(0.175, 0.885, 0.32, 1.275);
--ease-smooth:     cubic-bezier(0.25, 0.46, 0.45, 0.94);
```

### Component Rules
- **Cards:** White surface, 1px `#BAE6FD` border, 20px radius, bold coloured top-border per category
- **Buttons:** Filled blue or outlined; pill shape, Fredoka Bold
- **Navigation:** Bottom tab bar (mobile-first), white background
- **Touch targets:** 48px minimum

### Anti-patterns
- No serif fonts
- No dark backgrounds
- No pure black text — use `#0C2340`

---

## Band 3 · Ages 14–16 · "Teens"

### Identity
- Style: Vibrant Block — bold, high-contrast, block layouts, strong typographic hierarchy
- Mood: Confident, edgy, social-aware, shareable
- India context: The Instagram-native who reads news between reels

### Color Tokens
```css
--drop-primary:      #F43F5E;   /* Rose red — bold brand */
--drop-secondary:    #FB7185;   /* Soft rose */
--drop-accent:       #6366F1;   /* Indigo electric */
--drop-accent2:      #FBBF24;   /* Amber highlight */
--drop-bg:           #0F0F13;   /* Near-black */
--drop-bg-card:      #1A1A22;   /* Dark card surface */
--drop-bg-elevated:  #252530;   /* Hover/active */
--drop-text:         #F8F8FC;   /* Near-white */
--drop-text-muted:   #9CA3AF;
--drop-border:       rgba(244,63,94,0.18);
--drop-border-solid: #2E2E3C;
--drop-error:        #EF4444;
--drop-success:      #34D399;
```

### Typography
- **Heading:** Plus Jakarta Sans (`@fontsource/plus-jakarta-sans`) — modern, strong, editorial
- **Body:** Inter (`@fontsource/inter`) — the most legible body font for dense reading
- **Install:** `@fontsource/plus-jakarta-sans` + `@fontsource/inter`

```css
--font-heading: 'Plus Jakarta Sans', 'DM Sans', sans-serif;
--font-body:    'Inter', 'Outfit', sans-serif;

--text-hero:   clamp(2.75rem, 9vw, 6rem);
--text-h1:     clamp(2rem, 6vw, 4rem);
--text-h2:     clamp(1.5rem, 4vw, 2.5rem);
--text-body:   1rem;
--text-small:  0.875rem;
--line-height: 1.6;
--letter-space-heading: -0.03em;
--letter-space-label:   0.06em;
--font-weight-hero: 800;
```

### Spacing & Radius
```css
--space-xs:  4px;
--space-sm:  8px;
--space-md:  16px;
--space-lg:  32px;
--space-xl:  64px;

--radius-sm:  6px;
--radius-md:  10px;
--radius-lg:  16px;
--radius-full: 999px;
```

### Background
```css
background: #0F0F13;
/* Card */
background: #1A1A22;
border: 1px solid #2E2E3C;
```

### Shadows
```css
--shadow-card:       0 4px 20px rgba(0,0,0,0.5);
--shadow-card-hover: 0 12px 40px rgba(244,63,94,0.2), inset 0 1px 0 rgba(255,255,255,0.06);
--shadow-accent:     0 4px 24px rgba(244,63,94,0.35);
```

### Motion
```css
--duration-fast:   100ms;
--duration-normal: 200ms;
--duration-slow:   340ms;
--ease-sharp:      cubic-bezier(0.4, 0, 0.2, 1);
--ease-enter:      cubic-bezier(0, 0, 0.2, 1);
```

### Component Rules
- **Cards:** `#1A1A22` surface, 10px radius, 1px `#2E2E3C` border, rose left-accent on hover
- **Buttons:** Filled rose or outlined; pill or sharp rect, Plus Jakarta Sans Bold uppercase
- **Breaking badge:** Rose red pill with animation
- **Touch targets:** 44px minimum

### Anti-patterns
- No light backgrounds (always dark)
- No serif fonts
- No large radius (max 16px)
- No emoji in UI chrome

---

## Band 4 · Ages 17–20 · "Young Adults"

### Identity
- Style: Refined Minimalism — editorial print aesthetic brought to dark digital canvas
- Mood: Sophisticated, premium, thoughtful — news worth reading twice
- India context: The university student who subscribes to The Hindu and checks Bloomberg

### Color Tokens
```css
--drop-primary:      #F5E6C8;   /* Warm gold parchment — headlines */
--drop-secondary:    #D4B896;   /* Muted gold — subheads */
--drop-accent:       #C9A84C;   /* Deep gold — CTAs, links, active */
--drop-accent2:      #E8D5A3;   /* Pale gold — hover states */
--drop-bg:           #111118;   /* Near-black warm — premium base */
--drop-bg-elevated:  #1A1A24;   /* Cards, surface 1 */
--drop-bg-raised:    #222230;   /* Surface 2 — active/hover */
--drop-surface:      #1A1A24;
--drop-text:         #F5E6C8;   /* Warm gold-white — headlines */
--drop-text-body:    #C8C8D8;   /* Cool grey — body */
--drop-text-muted:   #666680;
--drop-border:       rgba(201,168,76,0.15);   /* Thin gold edge */
--drop-border-solid: #2A2A38;
--drop-error:        #EF4444;
--drop-success:      #6EE7B7;
```

### Typography
- **Heading:** Newsreader (`@fontsource/newsreader`) — elegant serif, brings editorial gravitas
- **Body:** Inter (`@fontsource/inter`) — maximum legibility for long-form reading
- **Install:** `@fontsource/newsreader` + `@fontsource/inter`

```css
--font-heading: 'Newsreader', 'Georgia', serif;
--font-body:    'Inter', 'DM Sans', sans-serif;

--text-hero:   clamp(2.5rem, 7vw, 5.5rem);
--text-h1:     clamp(2rem, 5vw, 3.75rem);
--text-h2:     clamp(1.5rem, 3.5vw, 2.5rem);
--text-body:   1.0625rem;     /* 17px */
--text-small:  0.875rem;
--line-height: 1.75;
--line-length: 68ch;
--letter-space-heading: -0.02em;
--letter-space-label:   0.1em;
--font-weight-hero: 700;
--font-style-hero:  italic;   /* Serif italic for drama */
```

### Spacing & Radius
```css
--space-xs:  4px;
--space-sm:  8px;
--space-md:  16px;
--space-lg:  32px;
--space-xl:  64px;
--space-2xl: 96px;

--radius-sm:  6px;
--radius-md:  12px;
--radius-lg:  18px;
--radius-full: 999px;
```

### Shadows
```css
--shadow-card:       0 4px 24px rgba(0,0,0,0.5);
--shadow-card-hover: 0 12px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,168,76,0.12);
--shadow-gold-glow:  0 4px 32px rgba(201,168,76,0.15);
```

### Motion
```css
--duration-fast:   120ms;
--duration-normal: 250ms;
--duration-slow:   400ms;
--ease-smooth:     cubic-bezier(0.25, 0.46, 0.45, 0.94);
--ease-enter:      cubic-bezier(0, 0, 0.2, 1);
```
- Card hover: translateY(-4px) + gold border glow — 250ms smooth
- Image load: opacity 0→1 + scale(1.02→1) — 400ms
- **No bounce or spring. Smooth fade/slide only. Respect prefers-reduced-motion.**

### Component Rules
- **Cards:** `#1A1A24` surface, 12px radius, 1px `rgba(201,168,76,0.15)` border, gold top-border per category
- **Buttons:** Filled gold (`#C9A84C`, dark text) for primary; outlined for secondary; pill shape
- **Category labels:** Uppercase + coloured dot, 0.1em tracking, Inter 500
- **Reading progress:** 1px gold bar at top of viewport
- **Touch targets:** 44px minimum

### Anti-patterns
- No pure black backgrounds — minimum `#111118`
- No sans-serif headings (this band uses serif exclusively for headings)
- No bounce animations
- No flat greyscale — gold accent always present

---

## Shared Tokens (All Bands)

```css
/* Z-index scale */
--z-base:    1;
--z-raised:  10;
--z-overlay: 20;
--z-modal:   30;
--z-toast:   40;
--z-nav:     50;

/* Breakpoints */
--bp-sm:  375px;
--bp-md:  768px;
--bp-lg:  1024px;
--bp-xl:  1440px;

/* Transitions */
--transition-colors:    color 200ms, background-color 200ms, border-color 200ms, box-shadow 200ms;
--transition-transform: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
```

## Band Selection (Runtime)

```typescript
export const AGE_BAND = {
  '8-10':  'kids',
  '11-13': 'tweens',
  '14-16': 'teens',
  '17-20': 'young-adults',
} as const;

// Apply via data attribute on <html> or root div
// <html data-band="young-adults">
// CSS: [data-band="young-adults"] { /* Band 4 tokens */ }
```

---

## Accessibility Baseline (All Bands)

| Requirement | Bands 1–2 | Bands 3–4 |
|-------------|-----------|-----------|
| Text contrast | 4.5:1 min | 7:1 target |
| Touch targets | 56px / 48px | 44px |
| Focus rings | 3px offset, brand colour | 2px offset, accent colour |
| Font size min | 20px body | 16px body |
| Reduced motion | Scale to opacity only | Already near-zero |
| Keyboard nav | Tab order = visual order | Tab order = visual order |
