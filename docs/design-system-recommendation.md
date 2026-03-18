# The Drop — Complete Design System Recommendation

## Current State Audit

### What Exists Today
- **Fonts**: Fredoka (display), Outfit (body), Syne (unused), JetBrains Mono (unused)
- **Colors**: Single blue (#3B82F6) brand color + per-category accent colors
- **Themes**: `data-theme` attribute is set on `<html>` but **CSS doesn't use it** — kids and teens get identical styling
- **Styling**: 80% inline styles, 20% Tailwind — inconsistent, hard to maintain
- **Layout**: Mobile-first, 430px max-width, fixed bottom nav
- **Radius**: 18px default (too uniform)

### Key Problems
1. **No age differentiation** — An 8-year-old and a 19-year-old see the same UI
2. **Inline style sprawl** — Makes theming impossible, bloats components
3. **No design tokens** — Colors, spacing, radii hardcoded everywhere
4. **Single font pair** — Fredoka is great for kids, wrong for teens
5. **No dark mode** — Despite infrastructure existing in ThemeContext

---

## Recommended Architecture: CSS Custom Properties + `data-theme`

The `data-theme` attribute is already being set by ThemeContext. We just need CSS to respond to it.

```css
/* index.css — Theme tokens */
:root {
  /* Shared tokens (all age bands) */
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-xl: 28px;
  --shadow-card: 0 2px 8px rgba(0,0,0,0.06);
  --shadow-elevated: 0 8px 24px rgba(0,0,0,0.08);
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
  --max-width: 430px;
  --nav-height: 56px;
  --safe-bottom: env(safe-area-inset-bottom, 0px);
}

/* Category colors (shared across all themes) */
:root {
  --cat-world: #3B82F6;
  --cat-power: #EF4444;
  --cat-money: #F59E0B;
  --cat-tech: #8B5CF6;
  --cat-sports: #F97316;
  --cat-entertainment: #EC4899;
  --cat-environment: #14B8A6;
}
```

---

## Age Band 1: Kids (8-10)

### Design Philosophy
Warm, bubbly, safe. Everything feels like a friendly toy. Big touch targets, chunky elements, bright colors. No dark mode — kids need light, inviting interfaces.

### Style: Claymorphism
- Soft 3D, chunky, toy-like surfaces
- Thick borders (3px), double shadows, very rounded corners (20-28px)
- Feels like a physical object you can touch

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--primary` | `#4F46E5` | Headers, nav, active states |
| `--primary-light` | `#818CF8` | Hover states, secondary buttons |
| `--accent` | `#F97316` | CTAs, streaks, rewards, badges |
| `--accent-warm` | `#FBBF24` | Stars, achievements, highlights |
| `--bg` | `#EEF2FF` | Page background |
| `--bg-card` | `#FFFFFF` | Card surfaces |
| `--text` | `#1E1B4B` | Primary text |
| `--text-muted` | `#6366F1` | Secondary text, captions |
| `--border` | `#C7D2FE` | Card borders, dividers |
| `--success` | `#10B981` | Positive feedback |
| `--danger` | `#EF4444` | Errors (gentle, not scary) |

### Typography

| Element | Font | Weight | Size | Line Height |
|---------|------|--------|------|-------------|
| Display (app title) | Baloo 2 | 700 | 28px | 1.2 |
| Headline (section) | Fredoka | 700 | 22px | 1.3 |
| Card title | Fredoka | 600 | 16px | 1.3 |
| Body text | Nunito | 400 | 17px | 1.7 |
| Body bold | Nunito | 600 | 17px | 1.7 |
| Label/pill | Nunito | 700 | 11px | 1.0 |
| Caption | Nunito | 400 | 13px | 1.4 |

**Why Fredoka + Nunito over current Fredoka + Outfit**: Nunito's rounded letterforms match the claymorphism style. Outfit is too geometric for this age band.

```css
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@300;400;500;600;700&family=Baloo+2:wght@400;500;600;700&display=swap');
```

### Component Tokens

```css
[data-theme="kids"] {
  --font-display: 'Baloo 2', sans-serif;
  --font-heading: 'Fredoka', sans-serif;
  --font-body: 'Nunito', sans-serif;

  --primary: #4F46E5;
  --primary-light: #818CF8;
  --accent: #F97316;
  --accent-warm: #FBBF24;
  --bg: #EEF2FF;
  --bg-card: #FFFFFF;
  --text: #1E1B4B;
  --text-muted: #6366F1;
  --border: #C7D2FE;

  --radius-card: 24px;
  --radius-button: 16px;
  --radius-pill: 20px;
  --border-width: 3px;
  --shadow-card: 4px 4px 0px #C7D2FE;
  --shadow-card-active: 2px 2px 0px #C7D2FE;

  --font-size-body: 17px;
  --font-size-card-title: 16px;
  --min-touch-target: 52px; /* larger for small fingers */
}
```

### Key Effects
- **Card press**: On tap, card shifts down 2px (`translateY(2px)`) and shadow shrinks — feels like pressing a physical button
- **Reward animations**: Confetti burst on streak milestones, star particles on reactions
- **Page transitions**: Slide + slight scale (playful bounce easing)
- **Loading**: Bouncing dots, not spinners

### Anti-Patterns to Avoid
- No dark mode
- No complex data visualizations
- No small text (never below 13px)
- No skeleton loaders (use bouncing animations instead)
- No hover-dependent interactions

---

## Age Band 2: Tweens (11-13)

### Design Philosophy
Still fun but starting to feel grown-up. Transitional — not babyish, not trying to be adult. Bold colors, expressive but clean. Think Duolingo energy meets Google News simplicity.

### Style: Soft Flat + Playful Accents
- Clean flat surfaces with subtle rounded corners
- Selective use of bold accent colors and micro-interactions
- More whitespace than kids, less than teens

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--primary` | `#2563EB` | Headers, nav, links |
| `--primary-light` | `#60A5FA` | Hover states, pill backgrounds |
| `--accent` | `#F43F5E` | CTAs, alerts, trending badges |
| `--accent-warm` | `#FBBF24` | Streaks, achievements |
| `--bg` | `#F8FAFC` | Page background |
| `--bg-card` | `#FFFFFF` | Card surfaces |
| `--text` | `#0F172A` | Primary text |
| `--text-muted` | `#64748B` | Secondary text |
| `--border` | `#E2E8F0` | Card borders |
| `--success` | `#10B981` | Positive states |
| `--danger` | `#EF4444` | Errors |

### Typography

| Element | Font | Weight | Size | Line Height |
|---------|------|--------|------|-------------|
| Display | Fredoka | 700 | 26px | 1.2 |
| Headline | Fredoka | 600 | 20px | 1.3 |
| Card title | Fredoka | 600 | 15px | 1.3 |
| Body text | Outfit | 400 | 16px | 1.65 |
| Body bold | Outfit | 600 | 16px | 1.65 |
| Label/pill | Outfit | 700 | 11px | 1.0 |
| Caption | Outfit | 400 | 13px | 1.4 |

**Why keep Fredoka + Outfit here**: This is the current pairing and it works well for this age band. Fredoka is playful enough without being childish, Outfit is clean and readable.

```css
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap');
```

### Component Tokens

```css
[data-theme="tweens"] {
  --font-display: 'Fredoka', sans-serif;
  --font-heading: 'Fredoka', sans-serif;
  --font-body: 'Outfit', sans-serif;

  --primary: #2563EB;
  --primary-light: #60A5FA;
  --accent: #F43F5E;
  --accent-warm: #FBBF24;
  --bg: #F8FAFC;
  --bg-card: #FFFFFF;
  --text: #0F172A;
  --text-muted: #64748B;
  --border: #E2E8F0;

  --radius-card: 18px;
  --radius-button: 14px;
  --radius-pill: 16px;
  --border-width: 1.5px;
  --shadow-card: 0 2px 8px rgba(37, 99, 235, 0.06);
  --shadow-card-active: 0 1px 4px rgba(37, 99, 235, 0.1);

  --font-size-body: 16px;
  --font-size-card-title: 15px;
  --min-touch-target: 48px;
}
```

### Key Effects
- **Card hover**: Subtle lift (`translateY(-2px)`) + shadow increase
- **Reactions**: Quick pop animation on tap (scale 1 -> 1.2 -> 1)
- **Tab switch**: Underline slide animation
- **Loading**: Skeleton screens with shimmer

### Anti-Patterns to Avoid
- No claymorphism (too childish)
- No dark mode yet (optional at this age)
- No dense information layouts
- No tiny text (min 13px)

---

## Age Band 3: Teens (14-16)

### Design Philosophy
Bold, confident, contemporary. Inspired by Instagram/TikTok aesthetics but for news. High contrast, strong typography, editorial feel. This is where users start caring about looking "cool."

### Style: Vibrant Block-Based
- Bold geometric sections, high color contrast
- Editorial layout with strong visual hierarchy
- Dark mode available (teens love it)

### Color Palette — Light Mode

| Token | Hex | Usage |
|-------|-----|-------|
| `--primary` | `#E11D48` | Brand accent, category headers |
| `--primary-light` | `#FB7185` | Hover, secondary elements |
| `--accent` | `#2563EB` | CTAs, links, interactive |
| `--bg` | `#FAFAFA` | Page background |
| `--bg-card` | `#FFFFFF` | Card surfaces |
| `--text` | `#0F172A` | Primary text |
| `--text-muted` | `#64748B` | Secondary text |
| `--border` | `#E5E7EB` | Subtle borders |

### Color Palette — Dark Mode

| Token | Hex | Usage |
|-------|-----|-------|
| `--primary` | `#FB7185` | Brand accent |
| `--primary-light` | `#FDA4AF` | Hover states |
| `--accent` | `#60A5FA` | CTAs, links |
| `--bg` | `#0F0F0F` | Page background |
| `--bg-card` | `#1A1A1A` | Card surfaces |
| `--text` | `#F1F5F9` | Primary text |
| `--text-muted` | `#94A3B8` | Secondary text |
| `--border` | `#2A2A2A` | Subtle borders |

### Typography

| Element | Font | Weight | Size | Line Height |
|---------|------|--------|------|-------------|
| Display | Plus Jakarta Sans | 800 | 28px | 1.15 |
| Headline | Plus Jakarta Sans | 700 | 20px | 1.25 |
| Card title | Plus Jakarta Sans | 700 | 15px | 1.3 |
| Body text | Inter | 400 | 15px | 1.65 |
| Body bold | Inter | 600 | 15px | 1.65 |
| Label/pill | Inter | 600 | 11px | 1.0 |
| Caption | Inter | 400 | 12px | 1.4 |

**Why switch to Plus Jakarta Sans + Inter**: Teens need a more mature, editorial feel. Plus Jakarta Sans is modern and geometric (like what they see on Instagram). Inter is the industry standard for readability at small sizes.

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
```

### Component Tokens

```css
[data-theme="teens"] {
  --font-display: 'Plus Jakarta Sans', sans-serif;
  --font-heading: 'Plus Jakarta Sans', sans-serif;
  --font-body: 'Inter', sans-serif;

  --primary: #E11D48;
  --primary-light: #FB7185;
  --accent: #2563EB;
  --bg: #FAFAFA;
  --bg-card: #FFFFFF;
  --text: #0F172A;
  --text-muted: #64748B;
  --border: #E5E7EB;

  --radius-card: 14px;
  --radius-button: 10px;
  --radius-pill: 12px;
  --border-width: 1px;
  --shadow-card: 0 1px 3px rgba(0,0,0,0.06);
  --shadow-card-active: 0 1px 2px rgba(0,0,0,0.1);

  --font-size-body: 15px;
  --font-size-card-title: 15px;
  --min-touch-target: 44px;
}

[data-theme="teens"].dark {
  --primary: #FB7185;
  --primary-light: #FDA4AF;
  --accent: #60A5FA;
  --bg: #0F0F0F;
  --bg-card: #1A1A1A;
  --text: #F1F5F9;
  --text-muted: #94A3B8;
  --border: #2A2A2A;
  --shadow-card: 0 1px 3px rgba(0,0,0,0.2);
}
```

### Key Effects
- **Cards**: Clean elevation, no border (shadow only in light), subtle border in dark
- **Trending badge**: Pulse animation on breaking news
- **Reactions**: Haptic feedback (`navigator.vibrate(10)`) + scale pop
- **Swipe**: Horizontal card carousel for "Today's Drop"
- **Loading**: Skeleton screens with subtle shimmer

### Anti-Patterns to Avoid
- No bubbly/childish elements
- No thick borders
- No claymorphism
- No Comic Sans or rounded display fonts

---

## Age Band 4: Young Adults (17-20)

### Design Philosophy
Sophisticated, minimal, information-dense. This should feel like a premium news product — think The Economist meets Apple News. Users at this age want to be treated as adults.

### Style: Refined Minimalism
- Maximum whitespace, editorial typography
- Dark mode as default option
- Information density over decoration

### Color Palette — Light Mode

| Token | Hex | Usage |
|-------|-----|-------|
| `--primary` | `#171717` | Headers, nav, strong elements |
| `--primary-light` | `#404040` | Secondary headers |
| `--accent` | `#D4AF37` | CTAs, premium feel, highlights |
| `--bg` | `#FFFFFF` | Page background |
| `--bg-card` | `#FAFAFA` | Card surfaces |
| `--text` | `#171717` | Primary text |
| `--text-muted` | `#737373` | Secondary text |
| `--border` | `#E5E5E5` | Subtle borders |

### Color Palette — Dark Mode

| Token | Hex | Usage |
|-------|-----|-------|
| `--primary` | `#FAFAFA` | Headers |
| `--primary-light` | `#D4D4D4` | Secondary headers |
| `--accent` | `#D4AF37` | Accent (gold stays) |
| `--bg` | `#0A0A0A` | Page background |
| `--bg-card` | `#141414` | Card surfaces |
| `--text` | `#FAFAFA` | Primary text |
| `--text-muted` | `#A3A3A3` | Secondary text |
| `--border` | `#262626` | Subtle borders |

### Typography

| Element | Font | Weight | Size | Line Height |
|---------|------|--------|------|-------------|
| Display | Newsreader | 700 | 26px | 1.2 |
| Headline | Newsreader | 600 | 20px | 1.3 |
| Card title | Newsreader | 600 | 16px | 1.35 |
| Body text | Inter | 400 | 15px | 1.7 |
| Body bold | Inter | 500 | 15px | 1.7 |
| Label/pill | Inter | 500 | 11px | 1.0 |
| Caption | Inter | 400 | 12px | 1.4 |

**Why Newsreader + Inter**: Newsreader is a proper editorial serif — it signals "serious journalism" and "premium." Inter keeps body text clean and scannable. This is the combination used by top-tier news publications.

```css
@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap');
```

### Component Tokens

```css
[data-theme="young-adults"] {
  --font-display: 'Newsreader', Georgia, serif;
  --font-heading: 'Newsreader', Georgia, serif;
  --font-body: 'Inter', sans-serif;

  --primary: #171717;
  --primary-light: #404040;
  --accent: #D4AF37;
  --bg: #FFFFFF;
  --bg-card: #FAFAFA;
  --text: #171717;
  --text-muted: #737373;
  --border: #E5E5E5;

  --radius-card: 8px;
  --radius-button: 6px;
  --radius-pill: 8px;
  --border-width: 1px;
  --shadow-card: none;
  --shadow-card-active: none;

  --font-size-body: 15px;
  --font-size-card-title: 16px;
  --min-touch-target: 44px;
}

[data-theme="young-adults"].dark {
  --primary: #FAFAFA;
  --primary-light: #D4D4D4;
  --accent: #D4AF37;
  --bg: #0A0A0A;
  --bg-card: #141414;
  --text: #FAFAFA;
  --text-muted: #A3A3A3;
  --border: #262626;
}
```

### Key Effects
- **Cards**: Border-based separation (no shadow), clean divider lines
- **Transitions**: Minimal — opacity fades only (200ms)
- **Loading**: Thin progress bar at top (like Medium/Substack)
- **Reading**: Focus mode — article page strips all chrome, just text + image
- **Reactions**: Subtle, no pop animations — just color fill

### Anti-Patterns to Avoid
- No rounded/bubbly elements (radius max 8px)
- No bright/saturated primary colors
- No playful animations
- No emoji reactions (use text labels or minimal icons)
- No thick borders or shadows

---

## Comparison Matrix

| Property | Kids (8-10) | Tweens (11-13) | Teens (14-16) | Young Adults (17-20) |
|----------|-------------|----------------|---------------|----------------------|
| **Style** | Claymorphism | Soft Flat | Vibrant Block | Refined Minimalism |
| **Display Font** | Baloo 2 | Fredoka | Plus Jakarta Sans | Newsreader (serif) |
| **Body Font** | Nunito | Outfit | Inter | Inter |
| **Primary Color** | #4F46E5 (indigo) | #2563EB (blue) | #E11D48 (rose) | #171717 (black) |
| **Accent Color** | #F97316 (orange) | #F43F5E (rose) | #2563EB (blue) | #D4AF37 (gold) |
| **Background** | #EEF2FF (indigo tint) | #F8FAFC (cool gray) | #FAFAFA (neutral) | #FFFFFF (white) |
| **Card Radius** | 24px | 18px | 14px | 8px |
| **Button Radius** | 16px | 14px | 10px | 6px |
| **Border Width** | 3px | 1.5px | 1px | 1px |
| **Shadow** | Offset (clay) | Subtle blur | Minimal | None |
| **Body Font Size** | 17px | 16px | 15px | 15px |
| **Min Touch Target** | 52px | 48px | 44px | 44px |
| **Dark Mode** | No | No | Yes | Yes (default option) |
| **Animation Intensity** | High (bouncy) | Medium | Subtle | Minimal |

---

## Implementation Strategy

### Phase 1: Token Foundation
1. Define all CSS custom properties in `index.css` under `[data-theme]` selectors
2. Create Tailwind config extensions that reference CSS variables
3. Update ThemeContext to set proper 4-value theme (`kids` / `tweens` / `teens` / `young-adults`)

### Phase 2: Font Loading
1. Add all 4 font combinations via Google Fonts
2. Use `font-display: swap` for performance
3. Load age-specific fonts conditionally (reduce initial bundle)

### Phase 3: Component Migration
1. Replace inline styles with CSS variable references
2. Start with shared components (NewsCard, BottomNav, CategoryTabs)
3. Use Tailwind's arbitrary value syntax: `bg-[var(--bg)]`, `text-[var(--text)]`

### Phase 4: Dark Mode (Teens + Young Adults)
1. Add dark mode toggle in ProfilePage settings
2. Use `prefers-color-scheme` as default, allow manual override
3. Store preference in localStorage and user profile

---

## Mobile UX Requirements (All Age Bands)

| Rule | Requirement |
|------|------------|
| Touch targets | Min 44px (52px for kids) with 8px+ spacing |
| Tap delay | Add `touch-action: manipulation` globally |
| Pull-to-refresh | Use `overscroll-behavior: contain` to prevent accidental refresh |
| Font size | Never below 13px on any age band |
| Line height | 1.65-1.7 for body text (readability) |
| Keyboard | Use `inputmode` attributes on all form inputs |
| Focus states | Visible focus ring on all interactive elements |
| Reduced motion | Respect `prefers-reduced-motion: reduce` |
| Safe areas | Account for notch/home indicator with `env(safe-area-inset-*)` |
| Horizontal scroll | Prevent with `overflow-x: hidden` on body |

---

## Icon System Recommendation

Replace inline emoji usage with a consistent SVG icon library.

| Current | Replace With |
|---------|-------------|
| Emoji reactions | Custom SVG reaction icons (animated) |
| Category icons | Lucide Icons (consistent 24x24 viewBox) |
| Navigation icons | Lucide Icons |
| Badge/achievement icons | Custom SVG set (per age band style) |

**Why Lucide**: 1000+ icons, tree-shakeable, React-native support, consistent style. Already compatible with the Tailwind ecosystem.

```bash
npm install lucide-react
```
