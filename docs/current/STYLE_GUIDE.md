# Provider Portal UI/UX Style Guide

**Version**: 1.0.0
**Last Updated**: January 7, 2026 at 16:00 UTC
**Status**: Active

---

## Overview

This style guide defines the visual design standards for the Provider Portal application. All new code MUST follow these guidelines to ensure consistency with the console-ui codebase and facilitate future codebase merging.

---

## Color Palette

### Primary Colors (Rialtic Blue)
Use for primary actions, active navigation, and main CTAs.

| Token | Hex | Usage |
|-------|-----|-------|
| `primary-50` | `#E8EAF7` | Light backgrounds, hover states |
| `primary-100` | `#C6CAEB` | Borders, subtle highlights |
| `primary-300` | `#6F7CCD` | Lighter accents |
| `primary-500` | `#3F52BC` | Default primary |
| `primary-600` | `#3848A4` | Buttons, active states |
| `primary-700` | `#2F3D8A` | Hover states on buttons |
| `primary-900` | `#1C214B` | Dark text on light backgrounds |

```html
<!-- Primary button example -->
<button class="bg-primary-600 hover:bg-primary-700 text-white">
  Primary Action
</button>
```

### Secondary Colors (Cyan)
Use for secondary actions, links, and informational elements.

| Token | Hex | Usage |
|-------|-----|-------|
| `secondary-50` | `#E1F5FD` | Info backgrounds |
| `secondary-100` | `#A3E0F9` | Light accents |
| `secondary-500` | `#00ABEE` | Default secondary |
| `secondary-600` | `#009DDF` | Links, secondary buttons |
| `secondary-700` | `#0E93C8` | Hover states |

```html
<!-- Secondary info box -->
<div class="bg-secondary-50 border border-secondary-200 p-4">
  Info content
</div>
```

### Neutral Colors (Grays)
Use for text, backgrounds, borders, and general UI elements.

| Token | Hex | Usage |
|-------|-----|-------|
| `neutral-50` | `#F5F6F8` | Page backgrounds |
| `neutral-100` | `#EBEFF2` | Card backgrounds, alternating rows |
| `neutral-200` | `#DCE1EA` | Borders, dividers |
| `neutral-300` | `#CDD4E1` | Disabled borders |
| `neutral-400` | `#B4BFD2` | Disabled text, placeholders |
| `neutral-500` | `#9BAAC4` | Secondary text |
| `neutral-600` | `#8590A3` | Labels, captions |
| `neutral-700` | `#707683` | Body text |
| `neutral-900` | `#293446` | Headings, primary text |

```html
<!-- Text hierarchy -->
<h1 class="text-neutral-900">Heading</h1>
<p class="text-neutral-700">Body text</p>
<span class="text-neutral-500">Secondary text</span>
```

### Success Colors (Green)
Use for success states, positive metrics, and confirmations.

| Token | Hex | Usage |
|-------|-----|-------|
| `success-50` | `#F0F9F7` | Success backgrounds |
| `success-100` | `#D1ECE6` | Light success accents |
| `success-500` | `#00A788` | Success icons, indicators |
| `success-600` | `#00856D` | Success text |
| `success-700` | `#2B695B` | Darker success text |

```html
<!-- Success alert -->
<div class="bg-success-50 border border-success-200 text-success-700">
  Operation completed successfully
</div>
```

### Error Colors (Red)
Use for errors, destructive actions, and critical alerts.

| Token | Hex | Usage |
|-------|-----|-------|
| `error-light` | `#FCF1F3` | Error backgrounds |
| `error-100` | `#F9E2E7` | Light error accents |
| `error-300` | `#E99AAB` | Error borders |
| `error-500` | `#DC627D` | Error text, icons |
| `error` | `#E45D7B` | Default error |
| `error-dark` | `#CB3F5E` | Hover states |
| `error-700` | `#BD2949` | Dark error text |

```html
<!-- Error state -->
<div class="bg-error-light border border-error-300 text-error-700">
  Error message
</div>
```

### Warning Colors (Yellow/Orange)
Use for warnings, cautions, and attention-needed states.

| Token | Hex | Usage |
|-------|-----|-------|
| `warning-50` | `#FEF9F1` | Warning backgrounds |
| `warning-100` | `#FCEDD4` | Light warning accents |
| `warning-300` | `#F6BD60` | Warning indicators |
| `warning-500` | `#CD830C` | Warning text |
| `warning-700` | `#935E09` | Dark warning text |

---

## Typography

### Font Families

| Family | Variable | Usage |
|--------|----------|-------|
| Poppins | `font-display` | Headings, display text |
| Nunito | `font-fixed` | Tables, numbers, monospace |
| System | default | Body text |

### Typography Shortcuts

Use these semantic shortcuts instead of raw Tailwind classes:

| Shortcut | Usage | Example |
|----------|-------|---------|
| `text-large-1` | Hero headings | Page titles on landing |
| `text-large-2` | Major section headings | Dashboard headers |
| `text-large-3` | Section headings | Card titles |
| `text-large-4` | Sub-section headings | Panel headers |
| `text-large-5` | Minor headings | List headers |
| `h1` | Page titles | Main page heading |
| `h2` | Section titles | Card headers |
| `h3` | Subsection titles | Table headers |
| `subtitle-1` | Large subtitles | Section descriptions |
| `subtitle-2` | Small subtitles | Card descriptions |
| `body-1` | Body text | Main content |
| `body-2` | Small body text | Secondary content |
| `table-numbers-1` | Table numbers | Large table values |
| `table-numbers-2` | Small table numbers | Compact table values |

```html
<!-- Typography examples -->
<h1 class="h1 text-neutral-900">Dashboard</h1>
<p class="body-1 text-neutral-700">Welcome back</p>
<span class="subtitle-2 text-neutral-500">Last updated today</span>
```

---

## Component Shortcuts

### Buttons

| Shortcut | Usage |
|----------|-------|
| `btn` | Base button styles |
| `btn-filled` | Primary filled button |
| `btn-outlined` | Secondary outlined button |
| `btn-text` | Tertiary text button |
| `btn-icon` | Icon-only button |

```html
<!-- Button examples -->
<button class="btn btn-filled">Primary Action</button>
<button class="btn btn-outlined">Secondary Action</button>
<button class="btn-text">Learn More</button>
```

### Forms

| Shortcut | Usage |
|----------|-------|
| `form-input` | Standard form input |
| `form-input-error` | Input with error state |
| `input-invalid` | Invalid input styling |

```html
<!-- Form example -->
<input type="text" class="form-input" placeholder="Enter value" />
<input type="text" class="form-input form-input-error" />
```

### Cards

```html
<!-- Card example -->
<div class="card p-6">
  Card content
</div>
```

### Checkboxes & Radio Buttons

```html
<!-- Checkbox -->
<input type="checkbox" class="checkbox" />

<!-- Radio -->
<input type="radio" class="radio" />
```

---

## Layout Patterns

### Page Structure

```html
<div class="p-6 space-y-6 flex-1 overflow-auto">
  <!-- Page header -->
  <div class="flex justify-between items-center">
    <h1 class="h1 text-neutral-900">Page Title</h1>
    <div class="flex gap-4">
      <!-- Actions -->
    </div>
  </div>

  <!-- Content -->
  <div class="grid grid-cols-3 gap-6">
    <!-- Cards/Sections -->
  </div>
</div>
```

### Metric Cards

```html
<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
  <div class="flex items-start justify-between">
    <div>
      <div class="subtitle-2 text-neutral-600 mb-2">Metric Label</div>
      <div class="text-3xl font-semibold text-neutral-900">Value</div>
      <div class="body-2 text-neutral-500 mt-1">Description</div>
    </div>
    <Icon name="heroicons:chart-bar" class="w-10 h-10 text-secondary-500" />
  </div>
</div>
```

### Data Tables

```html
<table class="min-w-full divide-y divide-neutral-200">
  <thead class="bg-neutral-50">
    <tr>
      <th class="px-6 py-3 text-left subtitle-2 text-neutral-600 uppercase tracking-wider">
        Column
      </th>
    </tr>
  </thead>
  <tbody class="bg-white divide-y divide-neutral-200">
    <tr class="hover:bg-neutral-50">
      <td class="px-6 py-4 body-1 text-neutral-900">
        Value
      </td>
    </tr>
  </tbody>
</table>
```

---

## Icons

Use Heroicons as the primary icon set:

```html
<Icon name="heroicons:check-circle" class="w-5 h-5 text-success-500" />
<Icon name="heroicons:x-circle" class="w-5 h-5 text-error-500" />
<Icon name="heroicons:exclamation-triangle" class="w-5 h-5 text-warning-500" />
```

### Icon Collections Available

| Collection | Prefix | Usage |
|------------|--------|-------|
| Heroicons | `heroicons:` | Primary icons |
| Heroicons Solid | `heroicons-solid:` | Filled variants |
| Fluent | `fluent:` | Microsoft-style icons |
| Phosphor | `ph:` | Alternative icons |

---

## Status Indicators

### Claim Status

| Status | Background | Text | Border |
|--------|------------|------|--------|
| Paid/Approved | `bg-success-100` | `text-success-700` | `border-success-300` |
| Denied | `bg-error-100` | `text-error-700` | `border-error-300` |
| Pending | `bg-warning-100` | `text-warning-700` | `border-warning-300` |
| In Progress | `bg-secondary-100` | `text-secondary-700` | `border-secondary-300` |

```html
<!-- Status badge examples -->
<span class="px-2 py-1 rounded-full bg-success-100 text-success-700 text-xs font-medium">
  Paid
</span>
<span class="px-2 py-1 rounded-full bg-error-100 text-error-700 text-xs font-medium">
  Denied
</span>
```

---

## Prohibited Patterns

### DO NOT USE:

| Prohibited | Use Instead |
|------------|-------------|
| `gray-*` | `neutral-*` |
| `green-*` | `success-*` |
| `red-*` | `error-*` |
| `blue-*` (for accents) | `secondary-*` |
| `indigo-*` | `primary-*` |
| `yellow-*` | `warning-*` |
| Raw Tailwind text sizes | Typography shortcuts (`h1`, `body-1`, etc.) |
| Inline styles | UnoCSS utility classes |

---

## Accessibility

- Maintain minimum 4.5:1 contrast ratio for text
- Use semantic HTML elements
- Include proper ARIA labels
- Ensure keyboard navigation works
- Test with screen readers

---

## Migration Notes

When updating existing code:

1. Replace all Tailwind color classes with Rialtic tokens
2. Use typography shortcuts where possible
3. Use component shortcuts (btn, card, form-input)
4. Ensure hover/focus states use matching color families

---

## References

- [console-ui Theme](../../../console-ui/packages/theme/) - Source of truth for design tokens
- [UnoCSS Documentation](https://unocss.dev/) - CSS framework
- [Heroicons](https://heroicons.com/) - Icon library
