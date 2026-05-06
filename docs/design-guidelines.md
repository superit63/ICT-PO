# Design Guidelines

**Project:** ICT-PO — Sale Stock & Purchase Order Management  
**Last Updated:** 2026-05-04  
**Design System:** shadcn/ui (base-nova) + Tailwind CSS 4.x

---

## Design Philosophy

**Principles:**
- **Clarity over decoration** — Information-dense interfaces with clear hierarchy
- **Consistency** — Reusable patterns across all pages
- **Accessibility** — WCAG 2.1 Level A compliance minimum
- **Performance** — Fast, responsive interactions
- **Mobile-first** — Responsive design for all screen sizes

**Target Users:**
- Sale managers working on desktop and tablet
- Occasional mobile access for quick status checks
- Users familiar with Excel-based workflows

---

## Color System

### OKLCH Color Space

All colors use OKLCH (Oklab Lightness Chroma Hue) for perceptual uniformity and better color manipulation.

**Format:** `oklch(lightness chroma hue)`

### Primary Colors

```css
--primary: oklch(0.45 0.12 240);              /* Blue */
--primary-foreground: oklch(0.99 0 0);        /* White */
```

**Usage:** Primary actions, active states, brand elements

**Examples:**
- Primary buttons
- Active navigation items
- Links
- Focus rings

---

### Secondary Colors

```css
--secondary: oklch(0.96 0.008 230);           /* Light gray */
--secondary-foreground: oklch(0.22 0.02 245); /* Dark gray */
```

**Usage:** Secondary actions, subtle backgrounds

**Examples:**
- Secondary buttons
- Card backgrounds
- Hover states
- Disabled states

---

### Status Colors

**Destructive (Red):**
```css
--destructive: oklch(0.58 0.2 25);            /* Red */
--destructive-foreground: oklch(0.99 0 0);    /* White */
```

**Usage:** Errors, dangerous actions, stockout status

---

**Success (Green):**
```css
--success: oklch(0.5 0.11 160);               /* Green */
```

**Usage:** Success messages, OK status, healthy stock

---

**Warning (Yellow):**
```css
--warning: oklch(0.62 0.15 75);               /* Yellow */
```

**Usage:** Warnings, low stock status

---

**Critical (Orange):**
```css
--critical: oklch(0.58 0.17 45);              /* Orange */
```

**Usage:** Critical alerts, critical stock status

---

### Neutral Colors

```css
--background: oklch(1 0 0);                   /* White */
--foreground: oklch(0.22 0.02 245);           /* Dark gray */
--muted: oklch(0.965 0.006 230);              /* Very light gray */
--muted-foreground: oklch(0.52 0.015 245);    /* Medium gray */
--accent: oklch(0.55 0.11 235);               /* Bright blue */
--accent-foreground: oklch(0.99 0 0);         /* White */
```

---

### Border & Ring Colors

```css
--border: oklch(0.92 0.006 230);              /* Light gray border */
--input: oklch(0.92 0.006 230);               /* Input border */
--ring: oklch(0.45 0.12 240);                 /* Focus ring (primary) */
```

---

### Sidebar Theme

Custom dark theme for navigation sidebar:

```css
--sidebar-background: oklch(0.22 0.06 235);   /* Dark blue-gray */
--sidebar-foreground: oklch(0.96 0.008 230);  /* Light gray */
--sidebar-border: oklch(0.28 0.05 235);       /* Medium blue-gray */
--sidebar-accent: oklch(0.35 0.08 235);       /* Accent blue-gray */
```

---

## Typography

### Font Families

**Sans-serif (Primary):**
```css
font-family: "Inter", sans-serif;
```

**Weights:** 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)

**Usage:** Body text, headings, UI elements

---

**Monospace (Code/Data):**
```css
font-family: "IBM Plex Mono", monospace;
```

**Weights:** 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)

**Usage:** Code snippets, data tables, numeric values

---

### Font Sizes

| Size | Tailwind Class | Pixels | Usage |
|------|---------------|--------|-------|
| **xs** | `text-xs` | 12px | Captions, labels |
| **sm** | `text-sm` | 14px | Body text, table cells |
| **base** | `text-base` | 16px | Default body text |
| **lg** | `text-lg` | 18px | Subheadings |
| **xl** | `text-xl` | 20px | Section headings |
| **2xl** | `text-2xl` | 24px | Page headings |
| **3xl** | `text-3xl` | 30px | Hero headings |

---

### Line Heights

- **Tight:** `leading-tight` (1.25) — Headings
- **Normal:** `leading-normal` (1.5) — Body text
- **Relaxed:** `leading-relaxed` (1.625) — Long-form content

---

### Font Weights

- **Normal:** `font-normal` (400) — Body text
- **Medium:** `font-medium` (500) — Emphasized text
- **Semibold:** `font-semibold` (600) — Subheadings
- **Bold:** `font-bold` (700) — Headings

---

## Spacing System

### Base Unit: 4px (0.25rem)

Tailwind spacing scale:

| Class | Pixels | Usage |
|-------|--------|-------|
| `gap-1` | 4px | Tight spacing |
| `gap-2` | 8px | Default gap |
| `gap-3` | 12px | Medium gap |
| `gap-4` | 16px | Large gap |
| `gap-6` | 24px | Section spacing |
| `gap-8` | 32px | Page section spacing |

---

### Component Spacing

**Card Padding:**
- Default: `px-5 py-5` (20px)
- Small: `px-4 py-4` (16px)

**Input Height:**
- Default: `h-10` (40px)
- Small: `h-8` (32px)
- Extra Small: `h-7` (28px)

**Button Padding:**
- Default: `px-4 py-2` (16px × 8px)
- Small: `px-3 py-1.5` (12px × 6px)
- Large: `px-6 py-3` (24px × 12px)

---

## Border Radius

### Scale

```css
--radius: 0.625rem; /* 10px base */
```

| Class | Pixels | Usage |
|-------|--------|-------|
| `rounded-sm` | 6px | Small elements |
| `rounded-md` | 8px | Medium elements |
| `rounded-lg` | 10px | Default (cards, inputs) |
| `rounded-xl` | 12.5px | Large elements |
| `rounded-2xl` | 15px | Extra large |
| `rounded-3xl` | 18px | Hero elements |
| `rounded-4xl` | 21px | Maximum |

**Default:** Most components use `rounded-xl` (12.5px)

---

## Shadows

### Elevation System

**Small (Subtle):**
```css
box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
```
**Usage:** Cards, inputs

---

**Medium (Default):**
```css
box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
```
**Usage:** Dropdowns, dialogs

---

**Large (Prominent):**
```css
box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
```
**Usage:** Modals, popovers

---

## Component Patterns

### Buttons

**Variants:**

**Default (Primary):**
```tsx
<Button variant="default">Primary Action</Button>
```
- Blue background
- White text
- Shadow on hover
- Used for primary actions

---

**Outline:**
```tsx
<Button variant="outline">Secondary Action</Button>
```
- Transparent background
- Border with primary color
- Used for secondary actions

---

**Ghost:**
```tsx
<Button variant="ghost">Tertiary Action</Button>
```
- Transparent background
- No border
- Hover background
- Used for tertiary actions

---

**Destructive:**
```tsx
<Button variant="destructive">Delete</Button>
```
- Red background
- White text
- Used for dangerous actions

---

**Sizes:**
- `size="xs"` — Extra small (24px height)
- `size="sm"` — Small (32px height)
- `size="default"` — Default (40px height)
- `size="lg"` — Large (48px height)
- `size="icon"` — Square icon button (40px)

---

### Cards

**Structure:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
    <CardAction>
      <Button>Action</Button>
    </CardAction>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
  <CardFooter>
    {/* Footer actions */}
  </CardFooter>
</Card>
```

**Variants:**
- `size="default"` — Standard padding (20px)
- `size="sm"` — Compact padding (16px)

---

### Badges

**Status Badges:**

```tsx
<Badge variant="default">OK</Badge>        {/* Blue */}
<Badge variant="secondary">Low</Badge>     {/* Gray */}
<Badge variant="destructive">Critical</Badge> {/* Red */}
```

**Custom Status Colors:**
```tsx
<Badge className="bg-success">Healthy</Badge>
<Badge className="bg-warning">Warning</Badge>
<Badge className="bg-critical">Critical</Badge>
```

---

### Tables

**Pattern:**
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column 1</TableHead>
      <TableHead>Column 2</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Data 1</TableCell>
      <TableCell>Data 2</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

**Features:**
- Hover states on rows
- Sticky headers (optional)
- Responsive overflow scrolling

---

### Forms

**Pattern:**
```tsx
<form onSubmit={handleSubmit}>
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="name">Name</Label>
      <Input
        id="name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
    </div>
    <Button type="submit">Submit</Button>
  </div>
</form>
```

**Validation States:**
- `aria-invalid="true"` — Error state (red border)
- `disabled` — Disabled state (gray, cursor not-allowed)

---

## Icons

### Icon Library: Lucide React

**Size Guidelines:**
- `size={16}` or `className="size-4"` — Small icons (buttons, labels)
- `size={20}` or `className="size-5"` — Default icons
- `size={24}` or `className="size-6"` — Large icons (headings)

**Common Icons:**
- **Navigation:** LayoutDashboard, Boxes, UsersRound, ClipboardList, TrendingUp, Lightbulb, Package, Settings
- **Actions:** Plus, PencilLine, Trash2, Download, Upload, Search, X, Menu, LogOut
- **Status:** CircleCheck, Info, TriangleAlert, OctagonX, Loader2
- **Expand/Collapse:** ChevronDown, ChevronRight, ChevronUp

**Usage:**
```tsx
import { Plus, Trash2 } from "lucide-react"

<Button>
  <Plus className="size-4 mr-2" />
  Add Product
</Button>
```

---

## Responsive Design

### Breakpoints

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| `sm:` | 640px | Small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Laptops |
| `xl:` | 1280px | Desktops |
| `2xl:` | 1536px | Large desktops |

---

### Mobile-First Approach

**Pattern:**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {/* Responsive grid */}
</div>
```

**Sidebar Navigation:**
- Mobile: Drawer overlay
- Desktop (lg:): Fixed sidebar

---

## Accessibility

### Semantic HTML

**Use proper elements:**
```tsx
// ✅ Correct
<button onClick={handleClick}>Submit</button>
<nav><a href="/dashboard">Dashboard</a></nav>

// ❌ Incorrect
<div onClick={handleClick}>Submit</div>
<div><span onClick={navigate}>Dashboard</span></div>
```

---

### ARIA Labels

**Icon-only buttons:**
```tsx
<Button aria-label="Delete product" onClick={handleDelete}>
  <Trash2 className="size-4" />
</Button>
```

**Form inputs:**
```tsx
<Label htmlFor="product-name">Product Name</Label>
<Input id="product-name" aria-required="true" />
```

---

### Keyboard Navigation

**Requirements:**
- All interactive elements must be keyboard accessible
- Tab order follows visual order
- Focus states visible (ring-3 ring-ring/20)
- Escape key closes dialogs
- Enter/Space activates buttons

---

### Color Contrast

**WCAG AA Compliance:**
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum

**Tested Combinations:**
- Primary on white: ✅ Pass
- Foreground on background: ✅ Pass
- Muted foreground on background: ✅ Pass

---

## Animation & Transitions

### Transition Timing

**Default:**
```css
transition: all 200ms ease-in-out;
```

**Classes:**
- `transition-colors` — Color transitions only
- `transition-all` — All properties
- `duration-200` — 200ms (default)
- `duration-300` — 300ms (slower)

---

### Animations

**Pulse (Loading):**
```tsx
<Skeleton className="animate-pulse" />
```

**Fade In:**
```tsx
<Dialog className="animate-in fade-in-0" />
```

**Slide In:**
```tsx
<Sheet className="animate-in slide-in-from-right" />
```

---

## Layout Patterns

### Page Layout

**Standard Page:**
```tsx
<div className="flex min-h-screen">
  <Sidebar />
  <main className="flex-1 p-6">
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Page Title</h1>
      {/* Page content */}
    </div>
  </main>
</div>
```

---

### Grid Layouts

**Responsive Grid:**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => (
    <Card key={item.id}>{/* Card content */}</Card>
  ))}
</div>
```

---

### Flex Layouts

**Horizontal Stack:**
```tsx
<div className="flex items-center gap-2">
  <Icon />
  <span>Label</span>
</div>
```

**Vertical Stack:**
```tsx
<div className="flex flex-col gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

---

## Status Indicators

### Stock Status Colors

| Status | Color | Badge | Usage |
|--------|-------|-------|-------|
| **OK** | Green | `bg-success` | Stock ≥ 3 pallets |
| **Low** | Yellow | `bg-warning` | Stock < 3 pallets |
| **Critical** | Orange | `bg-critical` | Stock < 1 pallet |
| **Stockout** | Red | `bg-destructive` | Stock < 0 |

**Visual Indicators:**
- 🟢 Green circle — OK
- 🟡 Yellow circle — Low
- 🟠 Orange circle — Critical
- 🔴 Red circle — Stockout

---

### Expiry Status Colors

| Status | Color | Condition |
|--------|-------|-----------|
| **Expired** | Red | Past expiry date |
| **Expiring Soon** | Orange | ≤ 30 days |
| **Expiring** | Yellow | ≤ 90 days |
| **Healthy** | Green | > 90 days |

---

## Loading States

### Skeleton Loaders

**Pattern:**
```tsx
{loading ? (
  <Skeleton className="h-10 w-full" />
) : (
  <div>{data}</div>
)}
```

**Common Skeletons:**
- Table rows: `<Skeleton className="h-12 w-full" />`
- Cards: `<Skeleton className="h-32 w-full" />`
- Text: `<Skeleton className="h-4 w-3/4" />`

---

### Loading Spinners

**Pattern:**
```tsx
import { Loader2 } from "lucide-react"

<Button disabled>
  <Loader2 className="size-4 mr-2 animate-spin" />
  Loading...
</Button>
```

---

## Empty States

### Pattern

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <PackageOpen className="size-12 text-muted-foreground mb-4" />
  <h3 className="text-lg font-semibold mb-2">No products found</h3>
  <p className="text-sm text-muted-foreground mb-4">
    Get started by adding your first product.
  </p>
  <Button onClick={handleAdd}>
    <Plus className="size-4 mr-2" />
    Add Product
  </Button>
</div>
```

---

## Toast Notifications

### Usage

```tsx
import { toast } from "sonner"

// Success
toast.success("Product created successfully")

// Error
toast.error("Failed to create product")

// Info
toast.info("Data is loading...")

// Warning
toast.warning("This action cannot be undone")
```

**Position:** Bottom-right  
**Duration:** 4 seconds (auto-dismiss)  
**Max Visible:** 3 toasts

---

## Best Practices

### Do's

✅ Use semantic HTML elements  
✅ Provide ARIA labels for icon-only buttons  
✅ Use consistent spacing (gap-2, gap-4, gap-6)  
✅ Use color tokens (primary, secondary, destructive)  
✅ Test keyboard navigation  
✅ Provide loading states  
✅ Show empty states with clear CTAs  
✅ Use toast notifications for feedback  

### Don'ts

❌ Don't use hardcoded colors (bg-blue-500)  
❌ Don't skip ARIA labels on interactive elements  
❌ Don't use divs for buttons  
❌ Don't mix spacing scales (gap-3 with gap-5)  
❌ Don't forget focus states  
❌ Don't use color alone to convey information  
❌ Don't create custom components when shadcn/ui has one  

---

## Future Enhancements

### Planned Improvements

- [ ] Dark mode implementation (next-themes already installed)
- [ ] Theme toggle UI component
- [ ] Custom color theme picker
- [ ] Animation library integration (Framer Motion)
- [ ] Storybook for component documentation
- [ ] Accessibility audit with axe-core
- [ ] Design tokens export for Figma

---

**Document Owner:** Design Team  
**Review Cycle:** Quarterly or on major design system changes
