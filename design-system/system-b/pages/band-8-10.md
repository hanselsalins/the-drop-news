# Band Override · Ages 8–10 · Kids (System B)
Overrides: system-b/MASTER.md Band 1 section

## Font Note
- Heading: **Baloo 2** (rounder, warmer — familiar to Indian readers; slightly more structured than Fredoka)
- Body: **Nunito** (round strokes, wide apertures — excellent for early/second-language readers)
- Fallback chain: Baloo 2 → Fredoka; Nunito → Outfit

## Active Overrides
- Body font size: 20px minimum
- Touch targets: 56px
- Border width on all interactive elements: 3px solid
- Radius: 32px cards, 999px buttons
- Shadow type: Claymorphism (hard offset) — not drop-shadow
- Background: `#F5F3FF` lavender cream (warm, non-clinical)

## Color Overrides
```css
--drop-primary:   #4F46E5;   /* Warm indigo */
--drop-secondary: #F59E0B;   /* Saffron amber */
--drop-accent:    #10B981;   /* Emerald reward */
--drop-accent2:   #EC4899;   /* Pink wonder */
--drop-bg:        #F5F3FF;
--drop-text:      #1E1B4B;
--drop-border:    #C4B5FD;
```

## Claymorphism Shadows
```css
--shadow-clay: 4px 4px 0px 0px rgba(79,70,229,0.2), 0 8px 24px rgba(79,70,229,0.15);
--shadow-card: 6px 6px 0px 0px #C4B5FD, 0 12px 32px rgba(0,0,0,0.06);
--shadow-btn:  4px 4px 0px 0px #3730A3;
```

## Page-specific: Article Feed
- Card stack layout (single column, full-width cards on mobile)
- Wonder Question box: `background:#EC4899; color:#FFF; border-radius:24px; padding:20px`
- Emoji allowed in article body text, wonder questions, and category badges
- Reading time shown as: "⏱ 2 minutes" not "2 min read"
- Category badges: indigo pill with white Baloo 2 Bold text

## Page-specific: Article Detail
- Font size body: 1.25rem (20px)
- Line height: 1.85
- Max column width: 52ch (shorter lines aid second-language readers)
- Inline word explanations: `<span style="border-bottom:2px dotted #4F46E5; cursor:help;">`
- Pull quotes: Baloo 2 700, saffron amber colour `#F59E0B`
