# The Drop — Master Design System
**Youth News App · India · Ages 8–20**
Generated: 2026-03-16

---

## Overview

The Drop uses four fully isolated design bands. Each band has its own CSS token set, typography, motion spec, and component rules. **Never mix tokens across bands.** The age_group from the user's profile determines which band is active at runtime.

---

## Band 1 · Ages 8–10 · "Big Bold Bright"

### Identity
- Style: Claymorphism — soft 3D, chunky, bubbly, toy-like
- Mood: Warm excitement, playful wonder, safe & welcoming
- India context: Vibrant festival colours (Holi palette — coral, yellow, teal, lime)

### Color Tokens
```css
--drop-primary:      #FF4B4B;   /* Hot coral — main brand */
--drop-secondary:    #FFD93D;   /* Sunny yellow — joy */
--drop-accent:       #06C48B;   /* Teal-mint — success/reward */
--drop-accent2:      #A259FF;   /* Violet — wonder */
--drop-bg:           #FFF8F0;   /* Warm cream — safe base */
--drop-surface:      #FFFFFF;
--drop-surface-alt:  #FFF0E6;
--drop-text:         #1A1035;   /* Near-black — high contrast */
--drop-text-muted:   #6B4E3D;
--drop-border:       #FFD5B8;
--drop-error:        #FF3B3B;
--drop-success:      #06C48B;
```

### Typography
- **Heading:** Fredoka (already installed — `@fontsource/fredoka`) — rounder, bubblier than Baloo 2, perfect for youngest readers
- **Body:** Outfit (already installed — `@fontsource/outfit`) — clean and friendly, consistent with other bands
- **Install:** `@fontsource/fredoka` + `@fontsource/outfit`

```css
--font-heading: 'Fredoka', 'Baloo 2', cursive;
--font-body:    'Outfit', 'Nunito', sans-serif;

/* Scale */
--text-hero:    clamp(2.5rem, 8vw, 4.5rem);   /* Article splash headline */
--text-h1:      clamp(2rem, 6vw, 3.5rem);
--text-h2:      clamp(1.5rem, 4vw, 2.25rem);
--text-body:    1.25rem;                        /* 20px minimum for kids */
--text-small:   1rem;
--line-height:  1.75;
--letter-space: 0.01em;
```

### Spacing & Radius
```css
--space-xs:  8px;
--space-sm:  12px;
--space-md:  20px;
--space-lg:  32px;
--space-xl:  52px;

--radius-sm:  12px;
--radius-md:  20px;
--radius-lg:  28px;
--radius-full: 999px;
```

### Shadows (Claymorphism)
```css
--shadow-clay:  4px 4px 0px 0px rgba(0,0,0,0.15), 0 8px 24px rgba(255,75,75,0.18);
--shadow-card:  6px 6px 0px 0px #FFB3A0, 0 12px 32px rgba(0,0,0,0.08);
--shadow-btn:   4px 4px 0px 0px #CC2E2E;
--shadow-btn-hover: 2px 2px 0px 0px #CC2E2E;
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
- **Touch targets:** 56px minimum (above WCAG 44px for small hands)
- **Buttons:** Bold border (3px solid), clay shadow, rounded-full, font-weight 700
- **Cards:** White surface, clay shadow, 28px radius, thick coloured top-border
- **Icons:** SVG only — Lucide icons at 28px. No emoji as icons.
- **Images:** Always with coloured border-frame (4px solid --drop-border)
- **Category badges:** Pill shape, solid fill, Fredoka Bold, uppercase

### Anti-patterns
- No dark mode for this band
- No thin fonts (min weight 600 for all UI text)
- No more than 4 colours on screen at once
- No auto-playing video or audio

---

## Band 2 · Ages 11–13 · "Cool & Connected"

### Identity
- Style: Vibrant Glassmorphism — frosted gradient panels, block layout, social-native
- Mood: Social belonging, relatable, energetic, a little aspirational
- India context: WhatsApp-familiar UI patterns, bold colour confidence

### Color Tokens
```css
--drop-primary:      #0A1628;   /* Deep navy */
--drop-secondary:    #0D2B4E;   /* Mid navy */
--drop-accent:       #1E90FF;   /* Electric blue */
--drop-accent2:      #00D4AA;   /* Teal — positive indicator */
--drop-bg:           #F4F6F9;   /* Off-white — light base */
--drop-surface:      #FFFFFF;
--drop-surface-dark: #0A1628;
--drop-text:         #0A1628;
--drop-text-muted:   #4A5568;
--drop-text-on-dark: #E8EDF4;
--drop-border:       #D1DCE8;
--drop-border-accent: #1E90FF;
--drop-error:        #E53E3E;
--drop-success:      #00D4AA;
```

### Background
```css
background: #F4F6F9;   /* Light mode — always light for this band */
/* Card surface */
background: #FFFFFF;
border: 1px solid #D1DCE8;
```

### Typography
- **Heading:** Baloo 2 (Google Fonts) — slightly more structured than Fredoka, perfect step up for tweens
- **Body:** Nunito (rounded, friendly — warmer feel than Outfit for this social-adjacent band)
- **Install:** `@fontsource/baloo-2` + `@fontsource/nunito`

```css
--font-heading: 'Baloo 2', 'Fredoka', cursive;
--font-body:    'Nunito', 'Outfit', sans-serif;

--text-hero:   clamp(2rem, 7vw, 4rem);
--text-h1:     clamp(1.75rem, 5vw, 3rem);
--text-h2:     clamp(1.375rem, 3.5vw, 2rem);
--text-body:   1.0625rem;   /* 17px */
--text-small:  0.875rem;
--line-height: 1.6;
--letter-space-heading: -0.02em;
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
--radius-lg:  22px;
--radius-full: 999px;
```

### Shadows
```css
--shadow-card:  0 2px 16px rgba(10,22,40,0.08), 0 1px 4px rgba(10,22,40,0.05);
--shadow-btn:   0 4px 16px rgba(30,144,255,0.3);
--shadow-card-hover: 0 8px 32px rgba(10,22,40,0.12), 0 2px 8px rgba(30,144,255,0.1);
```

### Motion
```css
--duration-fast:   120ms;
--duration-normal: 220ms;
--duration-slow:   380ms;
--ease-spring:     cubic-bezier(0.175, 0.885, 0.32, 1.275);
--ease-smooth:     cubic-bezier(0.25, 0.46, 0.45, 0.94);
```
- Story card swipe: translateX + fade — 220ms ease-smooth
- Like reaction: scale(1.4) + rotate(12deg) → scale(1) — 300ms spring
- Badge pulse: box-shadow glow breathe — 2s infinite

### Component Rules
- **Cards:** White surface, 1px `#D1DCE8` border, 22px radius, coloured top-border per category
- **Buttons:** Filled navy/electric blue or outlined; pill shape, Baloo 2 Bold
- **Navigation:** Bottom tab bar (mobile-first), white background
- **Tags/categories:** Coloured pill with emoji prefix (emoji allowed in content, not as icon buttons)
- **Reactions:** Emoji reactions allowed in article interactions only
- **Touch targets:** 48px minimum

### Anti-patterns
- No serif fonts
- No dark backgrounds (this band is always light mode)
- No pure black text — use `#0A1628` minimum

---

## Band 3 · Ages 14–16 · "Sharp & Aware"

### Identity
- Style: Exaggerated Minimalism — high contrast, oversized type, authoritative negative space
- Mood: Informed, serious-but-not-boring, slightly editorial, confident
- India context: The GenZ who reads Scroll.in and follows The Wire on Instagram

### Color Tokens
```css
--drop-primary:      #5C4EFA;   /* Electric indigo */
--drop-secondary:    #A78BFA;   /* Soft violet */
--drop-accent:       #22D3EE;   /* Cyan pop */
--drop-accent2:      #F472B6;   /* Hot pink */
--drop-bg:           #1E1B4B;   /* Deep indigo — dark base */
--drop-bg-end:       #2D2A6E;   /* Indigo surface — card base */
--drop-surface:      #2D2A6E;   /* Card surface */
--drop-surface-hover: #352F80;  /* Card hover state */
--drop-text:         #F0F0FF;   /* Near-white */
--drop-text-muted:   #A89EC9;
--drop-border:       rgba(255,255,255,0.12);
--drop-error:        #FF4D6D;
--drop-success:      #34D399;
```

### Typography
- **Heading:** Syne (already installed — `@fontsource/syne`) — geometric, confident
- **Body:** Outfit (already installed — `@fontsource/outfit`)

```css
--font-heading: 'Syne', 'Space Grotesk', sans-serif;
--font-body:    'Outfit', 'DM Sans', sans-serif;

--text-hero:   clamp(2.75rem, 9vw, 6rem);   /* Exaggerated */
--text-h1:     clamp(2rem, 6vw, 4rem);
--text-h2:     clamp(1.5rem, 4vw, 2.5rem);
--text-body:   1rem;          /* 16px */
--text-small:  0.875rem;
--line-height: 1.55;
--letter-space-heading: -0.04em;   /* Tight, confident */
--letter-space-label:   0.08em;    /* Uppercase labels */
--font-weight-hero: 800;
```

### Spacing & Radius
```css
--space-xs:  4px;
--space-sm:  8px;
--space-md:  16px;
--space-lg:  32px;
--space-xl:  64px;
--space-2xl: 96px;

--radius-sm:  4px;
--radius-md:  8px;
--radius-lg:  12px;
--radius-full: 999px;
/* No large radii — sharp corners signal maturity */
```

### Background Gradient
```css
background: linear-gradient(160deg, #1E1B4B 0%, #2D2A6E 55%, #1A184A 100%);
/* Card surface — solid indigo */
background: #2D2A6E;
border: 1px solid rgba(255,255,255,0.12);
```

### Shadows
```css
--shadow-card:       0 4px 24px rgba(30,27,75,0.5);
--shadow-card-hover: 0 12px 40px rgba(92,78,250,0.3), inset 0 1px 0 rgba(255,255,255,0.08);
--shadow-accent:     0 4px 24px rgba(92,78,250,0.4);
```

### Motion
```css
--duration-fast:   100ms;
--duration-normal: 200ms;
--duration-slow:   350ms;
--ease-sharp:      cubic-bezier(0.4, 0, 0.2, 1);   /* Material-style */
--ease-enter:      cubic-bezier(0, 0, 0.2, 1);
```
- Card hover: translateY(-4px) + violet accent bar reveal — 200ms sharp
- Hero text: clip-path reveal (left to right) — 600ms on load
- Category underline: scaleX(0→1) on hover — 200ms
- Subtle: no bounces, no spring — purposeful only

### Component Rules
- **Cards:** `#2D2A6E` surface, 8px radius, `rgba(255,255,255,0.12)` border, left accent bar on hover (violet/cyan)
- **Buttons:** Filled indigo (`#5C4EFA`) or outlined; rectangular, Syne SemiBold, uppercase labels
- **Category labels:** ALL CAPS, 0.08em letter-spacing, tiny dot separator
- **Breaking news:** Hot pink left-border strip on card (`#F472B6`)
- **Progress/reading time:** Thin progress bar in `#22D3EE` (cyan)
- **Touch targets:** 44px minimum

### Anti-patterns
- No bubbly/rounded corners (max 12px radius)
- No light backgrounds (this band is always dark)
- No emoji in UI chrome
- No playful fonts

---

## Band 4 · Ages 17–20 · "Cyber Editorial"

### Identity
- Style: Cyber Editorial — The Verge meets Wired meets a dark-mode news magazine
- Mood: Premium, sharp, electric — news that feels worth sharing; intelligence with edge
- India context: The 18-year-old who follows The Verge, Bloomberg, and Scroll.in simultaneously

### Color Tokens
```css
--drop-primary:      #FFFFFF;    /* Pure white — headlines */
--drop-secondary:    #B0BEC5;   /* Cool grey — body text */
--drop-accent:       #00D4FF;   /* Electric cyan — CTA, links, active states */
--drop-accent2:      #FF2D78;   /* Hot magenta — breaking news, highlights */
--drop-accent3:      #39FF85;   /* Neon green — live, trending badge */
--drop-bg:           #1A1A2E;   /* Deep cool charcoal — premium not gloomy */
--drop-bg-elevated:  #16213E;   /* Cards, surface 1 — blue-grey depth */
--drop-bg-raised:    #0F3460;   /* Surface 2 — darker accent bg */
--drop-surface:      #16213E;
--drop-text:         #FFFFFF;
--drop-text-body:    #B0BEC5;
--drop-text-muted:   #546E7A;
--drop-border:       rgba(0,212,255,0.12);    /* Thin cyan edge */
--drop-border-alt:   rgba(255,45,120,0.15);   /* Thin magenta edge */
--drop-border-solid: #253048;
--drop-error:        #FF2D78;
--drop-success:      #39FF85;
```

### Typography
- **Heading:** Urbanist (`@fontsource/urbanist`) — sleek, wide-set, premium feel; least overused in editorial contexts
- **Body:** Outfit (already installed — `@fontsource/outfit`)
- **Mono/data:** JetBrains Mono (already installed — `@fontsource/jetbrains-mono`)

```css
--font-heading: 'Urbanist', 'DM Sans', sans-serif;
--font-body:    'Outfit', 'DM Sans', sans-serif;
--font-mono:    'JetBrains Mono', 'Fira Code', monospace;

--text-hero:   clamp(2.5rem, 7vw, 5.5rem);
--text-h1:     clamp(2rem, 5vw, 3.75rem);
--text-h2:     clamp(1.5rem, 3.5vw, 2.5rem);
--text-body:   1.0625rem;     /* 17px */
--text-small:  0.875rem;
--line-height: 1.65;
--line-length: 68ch;
--letter-space-heading: -0.04em;
--letter-space-label:   0.08em;
--font-weight-hero: 800;
--font-weight-body: 400;
```

### Spacing & Radius
```css
--space-xs:  4px;
--space-sm:  8px;
--space-md:  16px;
--space-lg:  32px;
--space-xl:  64px;
--space-2xl: 96px;

--radius-sm:  8px;
--radius-md:  14px;
--radius-lg:  20px;
--radius-full: 999px;
```

### Shadows
```css
--shadow-card:        0 4px 24px rgba(0,0,0,0.4);
--shadow-card-hover:  0 12px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,212,255,0.15);
--shadow-cyan-glow:   0 4px 32px rgba(0,212,255,0.2);
--shadow-magenta-glow: 0 4px 32px rgba(255,45,120,0.22);
```

### Motion
```css
--duration-fast:   120ms;
--duration-normal: 250ms;
--duration-slow:   400ms;
--ease-smooth:     cubic-bezier(0.25, 0.46, 0.45, 0.94);
--ease-enter:      cubic-bezier(0, 0, 0.2, 1);
```
- Card hover: translateY(-5px) + 1px cyan border glow — 250ms smooth
- Image load: opacity 0→1 + scale(1.02→1) — 400ms ease-enter
- Accent border: opacity 0→1 fade on hover — 200ms
- Page entry: staggered fadeUp 20px — 400ms per card
- **No bounce/spring. Smooth fade/slide only. Respect prefers-reduced-motion.**

### Component Rules
- **Cards:** `#16213E` surface, 14px radius, 1px `rgba(0,212,255,0.12)` border, vivid top-border per category
- **Category colours:** World=#00D4FF · Science=#39FF85 · Politics=#FF2D78 · Tech=#A78BFA · Sport=#FF9500 · Money=#00D4AA
- **Buttons:** Filled cyan (`#00D4FF`, `#1A1A2E` text) for primary; `#16213E` outlined for secondary; pill shape
- **Category labels:** Syne 700 uppercase + coloured dot prefix, 0.08em tracking
- **Reading progress:** 2px cyan bar at top of viewport
- **Live/Trending badge:** Neon green pill (`#39FF85`, dark text) with animated pulse dot
- **Touch targets:** 44px minimum
- **Nav:** Top nav primary; bottom tab bar optional on mobile

### Anti-patterns
- No pure black backgrounds — use `#1A1A2E` minimum
- No serif fonts anywhere
- No gold/parchment
- No bounce animations
- No flat greyscale — always have a vibrant accent present

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
--transition-colors: color 200ms, background-color 200ms, border-color 200ms, box-shadow 200ms;
--transition-transform: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
```

## Band Selection (Runtime)

```typescript
export const AGE_BAND = {
  '8-10':  'big-bold-bright',
  '11-13': 'cool-connected',
  '14-16': 'sharp-aware',
  '17-20': 'editorial',
} as const;

// Apply via data attribute on <html> or root div
// <html data-band="editorial">
// CSS: [data-band="editorial"] { /* Band 4 tokens */ }
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
