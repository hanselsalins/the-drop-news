# The Drop — Design System

Two complete, isolated design systems for A/B testing visual direction across all four age bands (8–10, 11–13, 14–16, 17–20).

---

## Quick Switch

```bash
bash design-system/switch.sh a   # → System A (Cyber Editorial)
bash design-system/switch.sh b   # → System B (Refined Minimalism)
```

Lovable reads from `design-system/active/`.

---

## System A — Cyber Editorial

**Fonts:** Fredoka · Baloo 2 · Syne · Urbanist · Outfit

| Band | Ages | Style | Mood |
|------|------|-------|------|
| 1 | 8–10 | Claymorphism | Warm excitement, festival colours (Holi palette) |
| 2 | 11–13 | Vibrant Glassmorphism | Social-native, WhatsApp-familiar |
| 3 | 14–16 | Exaggerated Minimalism | Dark indigo, editorial, GenZ |
| 4 | 17–20 | Cyber Editorial | The Verge × Wired, electric cyan + magenta |

**Showcase:** `system-a/showcase.html`

---

## System B — Refined Minimalism

**Fonts:** Baloo 2 · Fredoka · Plus Jakarta Sans · Newsreader · Inter

| Band | Ages | Style | Mood |
|------|------|-------|------|
| 1 | 8–10 | Claymorphism | Warm indigo palette, saffron accents |
| 2 | 11–13 | Soft Flat | Blue/clean, generous whitespace |
| 3 | 14–16 | Vibrant Block | Rose/black dark mode, bold type |
| 4 | 17–20 | Refined Minimalism | Gold/near-black, Newsreader serif, editorial gravitas |

**Showcase:** `system-b/showcase.html`

---

## Directory Structure

```
design-system/
├── active/               ← What Lovable reads (copy of current system)
│   ├── MASTER.md
│   ├── pages/
│   │   ├── band-8-10.md
│   │   ├── band-11-13.md
│   │   ├── band-14-16.md
│   │   └── band-17-20.md
│   └── showcase.html
├── system-a/             ← System A source (Cyber Editorial)
│   ├── MASTER.md
│   ├── pages/
│   └── showcase.html
├── system-b/             ← System B source (Refined Minimalism)
│   ├── MASTER.md
│   ├── pages/
│   └── showcase.html
├── switch.sh             ← Switcher script
└── README.md             ← This file
```

---

## Key Differences

| Dimension | System A | System B |
|-----------|----------|----------|
| 8–10 heading font | Fredoka | Baloo 2 |
| 8–10 palette | Holi coral/yellow/teal | Warm indigo/saffron |
| 14–16 style | Dark indigo (Exaggerated Minimalism) | Dark rose/black (Vibrant Block) |
| 17–20 heading | Urbanist sans-serif | Newsreader serif (italic) |
| 17–20 accent | Electric cyan `#00D4FF` | Deep gold `#C9A84C` |
| 17–20 body font | Outfit | Inter |
| Overall feel | Electric, cyber, editorial | Warm, refined, print-adjacent |
