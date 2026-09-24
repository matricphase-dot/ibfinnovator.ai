# Design — IBF (Innovator Bridge Foundry)

A locked design system for the IBF Platform. Every page redesign reads this file before emitting code. Do not regenerate per page — extend or amend this file when the system needs to grow.

/* Hallmark · genre: editorial · macrostructure: long-document · design-system: design.md · designed-as-app */

## Genre
**Editorial** (Warm Literary / Foundry / Craft Aesthetic)

## Macrostructure Family
- **Marketing pages:** Long Document (`macrostructures/02-long-document.md`) with Narrative Specimen (`macrostructures/10-specimen.md`).
- **Auth pages:** Focused Editorial Card (`components/ft6-letter-close.md` + minimal single-column frame).
- **App pages:** Workbench (`macrostructures/05-workbench.md`) with sidebar rail.

## Theme Tokens
- `--base`:          `#F5F1EA` (warm paper cream, `oklch(95.8% 0.012 85)`)
- `--surface`:       `#EBE5DA` (tinted warm paper surface, `oklch(91.8% 0.015 85)`)
- `--hairline`:      `#E0D8C8` (warm rule hairline, `oklch(87.2% 0.018 85)`)
- `--ink`:           `#1A1816` (deep carbon black ink, `oklch(20.5% 0.008 60)`)
- `--muted`:         `#6B655B` (warm secondary slate ink, `oklch(51.2% 0.014 75)`)
- `--accent`:        `#C4553B` (terracotta ember, `oklch(54.6% 0.165 38)`)
- `--accent-hover`:  `#A8442E` (deep terracotta, `oklch(47.8% 0.165 38)`)
- `--deep`:          `#3D5A4C` (forest evergreen)
- `--color-focus`:   `#C4553B` (terracotta 2px focus ring)

## Typography
- **Display font:** `Fraunces`, Georgia, serif (optical size 9..144, weight 500, letter-spacing: -0.02em)
- **Body font:** `Inter`, -apple-system, sans-serif (weights 400, 500, 600, line-height: 1.6)
- **Monospace Eyebrow:** `IBM Plex Mono`, monospace (weight 500, tracking: 0.16em, uppercase, font-size: 11px)
- **Type scale anchor:** Headline `clamp(40px, 6vw, 68px)`, Section title `clamp(28px, 4vw, 40px)`, Body `16px`.

## Spacing & Geometry
- **Radius:** Unified `2px` crisp architectural border-radius throughout (`--radius: 2px`).
- **Rule width:** Exactly `1px` (`var(--hairline)`).
- **Focus ring:** `outline: 2px solid var(--accent); outline-offset: 1px;` (instant appearance, no transition).
- **Viewport clipping:** `overflow-x: clip;` on `html` and `body`.

## CTA Voice
- **Primary CTA:** Solid terracotta fill (`var(--accent)`), cream text (`var(--base)`), `padding: 13px 22px`, 2px radius, `:hover` deep terracotta, `:focus-visible` ring.
- **Secondary CTA:** Hairline border (`1px solid var(--ink)`), transparent fill, ink text, `:hover` inverts to ink fill and base text.
- **Clickable affordances:** Single-line text only (`white-space: nowrap`), minimum 44px tap target height.

## Navigation & Footer Archetypes
- **Nav:** Hallmark N1b (Editorial masthead) with wordmark-left, asymmetric route links, and action cluster right.
- **Footer:** Hallmark Ft1 (Mast-headed colophon) with brand mission statement, categorical index, and copyright rule.

## What All Pages Must Share
1. No disconnected dark sci-fi or neon cyan themes; every page belongs to the warm editorial paper system.
2. High-contrast typography adhering strictly to WCAG AA 4.5:1 for body and 3:1 for display.
3. No fake placeholder boxes in production. Real content or handcrafted UI specimens only.
4. Consistent 2px border radius, never mixed with 16px pill cards.
