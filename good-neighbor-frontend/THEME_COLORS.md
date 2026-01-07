# Good Neighbor Color Palette

This document describes the color palette used in the Good Neighbor application, based on `public/color_palette.png`.

## Primary Colors

### Primary (Dark Forest Green)
- **Base**: `#1B5E37` - Primary brand color for main actions, buttons, and links
- **Usage**: Primary buttons, links, active states, brand elements
- **Shades**: 50-900 available via Tailwind (`primary-50` to `primary-900`)

### Accent (Vibrant Lime Green)
- **Base**: `#8DC63F` - Accent color for highlights, success states, positive indicators
- **Usage**: Success messages, positive balance indicators, highlights
- **Shades**: 50-900 available via Tailwind (`accent-50` to `accent-900`)

### Warning (Bright Orange)
- **Base**: `#E67E22` - Warning and alert color
- **Usage**: Warnings, debt indicators, important alerts
- **Shades**: 50-900 available via Tailwind (`warning-50` to `warning-900`)

## Neutral Colors

### Neutral (Grey Scale)
- **Light**: `#F9FBF9` - Very light grey/off-white for backgrounds
- **Dark**: `#2D3436` - Dark charcoal grey for text
- **Usage**: 
  - Backgrounds: `neutral-50` (#F9FBF9)
  - Text: `neutral-900` (#2D3436)
  - Borders: `neutral-200`, `neutral-300`
- **Shades**: 50-900 available via Tailwind (`neutral-50` to `neutral-900`)

### White
- **Pure White**: `#FFFFFF`
- **Usage**: Card backgrounds, contrast elements

## Color Usage Guidelines

### Buttons
- **Primary Actions**: `bg-primary-600 hover:bg-primary-700 text-white`
- **Secondary Actions**: `bg-neutral-100 hover:bg-neutral-200 text-neutral-900`
- **Success Actions**: `bg-accent-500 hover:bg-accent-600 text-white`
- **Warning Actions**: `bg-warning-500 hover:bg-warning-600 text-white`

### Text
- **Primary Text**: `text-neutral-900`
- **Secondary Text**: `text-neutral-600`
- **Muted Text**: `text-neutral-500`
- **Links**: `text-primary-600 hover:text-primary-700`

### Backgrounds
- **Page Background**: `bg-neutral-50`
- **Card Background**: `bg-white`
- **Hover States**: `hover:bg-neutral-50` or `hover:bg-primary-50`

### Status Indicators
- **Success/Positive**: `text-accent-600 bg-accent-50`
- **Warning/Debt**: `text-warning-600 bg-warning-50`
- **Error**: Use standard red colors (not in palette, but needed for errors)

## Tailwind Classes

All colors are available as Tailwind utility classes:
- `bg-primary-{shade}`, `text-primary-{shade}`, `border-primary-{shade}`
- `bg-accent-{shade}`, `text-accent-{shade}`, `border-accent-{shade}`
- `bg-warning-{shade}`, `text-warning-{shade}`, `border-warning-{shade}`
- `bg-neutral-{shade}`, `text-neutral-{shade}`, `border-neutral-{shade}`

Where `{shade}` is: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900


