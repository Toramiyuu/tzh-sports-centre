# Dark Mode Color System

**Never use hardcoded hex colors.** Always use theme-aware Tailwind classes.

## Theme Colors

The app has light/dark modes via `next-themes`. Colors are defined in `app/globals.css`.

| Variable | Light | Dark | Usage |
|----------|-------|------|-------|
| `primary` | `#1854d6` | `#3b82f6` | Brand color, CTAs |
| `background` | `#f5f8ff` | `#0a1628` | Page background |
| `foreground` | `#0a2540` | `#e2e8f0` | Body text |
| `card` | `#EDF1FD` | `#111f36` | Card backgrounds |
| `border` | `#B8C4E0` | `#2a4a6e` | Borders, dividers |
| `muted` | `#CDD6EE` | `#1a3150` | Subtle backgrounds |
| `secondary` | `#CDD6EE` | `#1a3150` | Secondary UI |

## Usage

```typescript
// ✅ Good - adapts to dark mode
<div className="bg-primary text-white" />
<div className="bg-card border-border text-foreground" />
<button className="bg-primary hover:bg-primary/90" />

// ❌ Bad - hardcoded, breaks dark mode
<div className="bg-[#1854d6] text-white" />
<div className="bg-[#EDF1FD] border-[#B8C4E0] text-[#0a2540]" />
<button className="bg-[#1854d6] hover:bg-[#2060e0]" />
```

## Opacity Modifiers

Use `/opacity` for transparency:

```typescript
<div className="bg-primary/10" />      // 10% opacity
<div className="hover:bg-primary/90" /> // 90% opacity on hover
```

## Common Patterns

```typescript
// Primary button
<Button className="bg-primary hover:bg-primary/90 text-white" />

// Card with border
<Card className="bg-card border-border" />

// Muted text
<p className="text-muted-foreground" />

// Disabled state
<button disabled className="bg-muted text-muted-foreground" />

// Selected state
<div className="bg-primary text-white" /> // selected
<div className="bg-card text-foreground" /> // unselected
```

## PWA Theme Color

The `<meta name="theme-color" />` in `app/layout.tsx` can stay hardcoded as `#1854d6` - it only affects the browser chrome color.

## Why

Hardcoded colors (`#1854d6`, `#0a2540`, etc.) don't adapt when the user switches to dark mode, causing:
- Invisible text (dark text on dark background)
- Poor contrast
- Broken UI elements

Theme-aware classes automatically adjust to the current color scheme.
