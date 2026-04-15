# Phase 01 — Design Tokens & Typography

- Priority: P0 (foundation — all other phases depend on this)
- Status: Implemented

## Overview

Replace the current neutral-gray design tokens with a medical-professional blue palette. Switch from Manrope to Inter for a cleaner, more clinical feel. Tighten border-radius for professional appearance.

## Current Issues Found

1. **Color identity is neutral/gray** — primary `oklch(0.53 0.082 241)` reads as desaturated steel-blue; no strong medical identity
2. **Sidebar is near-black** — `oklch(0.205 0.012 251)` feels generic dark; not branded
3. **Border radius too playful** — `0.95rem` (15px) cards/inputs feel consumer-app, not enterprise/medical
4. **Manrope font** — good but geometric; Inter is more neutral-professional and better for dense data tables
5. **Dark mode sidebar tokens** barely differ from light mode sidebar — low visual distinction
6. **Chart colors** are generic; no blue-family cohesion

## Implementation Steps

### 1. Update `app/globals.css` `:root` tokens

```css
:root {
  /* Core — Medical Blue palette */
  --background: oklch(0.985 0.002 230);        /* very light blue-gray */
  --foreground: oklch(0.22 0.02 245);           /* deep navy text */
  --card: oklch(0.995 0.001 230);               /* near-white card */
  --card-foreground: oklch(0.22 0.02 245);
  --popover: oklch(0.995 0.001 230);
  --popover-foreground: oklch(0.22 0.02 245);
  --primary: oklch(0.45 0.12 240);              /* #0369A1 sky-700 */
  --primary-foreground: oklch(0.99 0.001 230);
  --secondary: oklch(0.96 0.008 230);           /* light blue-gray */
  --secondary-foreground: oklch(0.30 0.02 245);
  --muted: oklch(0.965 0.006 230);
  --muted-foreground: oklch(0.52 0.015 245);
  --accent: oklch(0.55 0.11 235);               /* #0284C7 sky-600 */
  --accent-foreground: oklch(0.99 0.001 230);
  --destructive: oklch(0.58 0.2 25);
  --border: oklch(0.90 0.01 230);               /* blue-tinted border */
  --input: oklch(0.94 0.008 230);
  --ring: oklch(0.45 0.12 240);                 /* matches primary */

  /* Charts — blue-family cohesive */
  --chart-1: oklch(0.45 0.12 240);              /* primary blue */
  --chart-2: oklch(0.55 0.10 220);              /* teal-blue */
  --chart-3: oklch(0.60 0.12 200);              /* cyan */
  --chart-4: oklch(0.50 0.08 260);              /* indigo */
  --chart-5: oklch(0.65 0.10 180);              /* seafoam */

  --radius: 0.625rem;  /* 10px — professional, not playful */

  /* Sidebar — deep medical blue */
  --sidebar: oklch(0.22 0.06 235);              /* deep blue (not black) */
  --sidebar-foreground: oklch(0.94 0.005 230);
  --sidebar-primary: oklch(0.45 0.12 240);
  --sidebar-primary-foreground: oklch(0.98 0.001 230);
  --sidebar-accent: oklch(0.28 0.05 235);       /* slightly lighter blue */
  --sidebar-accent-foreground: oklch(0.96 0.004 230);
  --sidebar-border: oklch(0.32 0.04 235);
  --sidebar-ring: oklch(0.55 0.10 235);
}
```

### 2. Update `.dark` tokens

```css
.dark {
  --background: oklch(0.16 0.015 240);
  --foreground: oklch(0.95 0.004 230);
  --card: oklch(0.19 0.015 240);
  --card-foreground: oklch(0.95 0.004 230);
  --primary: oklch(0.62 0.10 235);
  --primary-foreground: oklch(0.15 0.015 240);
  --secondary: oklch(0.23 0.015 240);
  --secondary-foreground: oklch(0.95 0.004 230);
  --muted: oklch(0.22 0.015 240);
  --muted-foreground: oklch(0.72 0.01 230);
  --accent: oklch(0.65 0.08 225);
  --accent-foreground: oklch(0.15 0.015 240);
  --destructive: oklch(0.68 0.18 25);
  --border: oklch(1 0 0 / 0.10);
  --input: oklch(1 0 0 / 0.08);
  --ring: oklch(0.62 0.10 235);

  --chart-1: oklch(0.62 0.10 235);
  --chart-2: oklch(0.60 0.08 215);
  --chart-3: oklch(0.65 0.10 200);
  --chart-4: oklch(0.55 0.08 255);
  --chart-5: oklch(0.70 0.08 180);

  --sidebar: oklch(0.17 0.03 238);
  --sidebar-foreground: oklch(0.94 0.004 230);
  --sidebar-primary: oklch(0.35 0.06 235);
  --sidebar-primary-foreground: oklch(0.96 0.004 230);
  --sidebar-accent: oklch(0.22 0.025 238);
  --sidebar-accent-foreground: oklch(0.94 0.004 230);
  --sidebar-border: oklch(1 0 0 / 0.10);
  --sidebar-ring: oklch(0.62 0.10 235);
}
```

### 3. Update body gradient background

```css
body {
  background-image: linear-gradient(
    180deg,
    oklch(0.99 0.001 230) 0%,
    oklch(0.985 0.003 230) 55%,
    oklch(0.978 0.005 230) 100%
  );
}
```

### 4. Switch font from Manrope to Inter in `app/layout.tsx`

```tsx
import { Inter, IBM_Plex_Mono } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
```

Update `globals.css`:
```css
--font-sans: var(--font-inter);
```

### 5. Update `panel-surface` utility

```css
.panel-surface {
  border: 1px solid oklch(0.90 0.01 230 / 0.95);
  background: oklch(0.998 0.001 230 / 0.96);
  box-shadow: 0 12px 28px -20px rgb(12 74 110 / 0.12);
}
```

### 6. Update selection color

```css
::selection {
  background: oklch(0.55 0.11 235 / 0.22);
}
```

## Files to Modify

- `app/globals.css`
- `app/layout.tsx`

## Todo

- [x] Replace `:root` color tokens with medical blue palette
- [x] Replace `.dark` color tokens with dark medical blue palette
- [x] Update body gradient to blue-tinted
- [x] Reduce `--radius` from 0.95rem to 0.625rem
- [x] Switch font from Manrope to Inter
- [x] Update `--font-sans` CSS variable
- [x] Update `panel-surface` utility
- [x] Update selection color
- [x] Update scrollbar thumb colors to blue-tinted
- [x] Verify contrast ratios meet WCAG AA (4.5:1 body, 3:1 large text)
- [x] Test light and dark mode both look correct

## Success Criteria

- All pages render with strong medical blue identity
- Text contrast >= 4.5:1 on all surfaces
- Border radius feels professional/enterprise (not consumer)
- Font renders crisply in data tables at 13-14px
- Blue sidebar stands out as branded navigation
