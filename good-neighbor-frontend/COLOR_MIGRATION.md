# Color Migration Guide

This guide helps migrate from the old blue/teal theme to the new green/orange palette.

## Color Mapping

### Old → New

| Old Color | New Color | Usage |
|-----------|-----------|-------|
| `bg-gray-50` | `bg-neutral-50` | Page backgrounds |
| `bg-gray-100` | `bg-neutral-100` | Light backgrounds |
| `bg-gray-200` | `bg-neutral-200` | Borders, dividers |
| `text-gray-500` | `text-neutral-600` | Secondary text |
| `text-gray-600` | `text-neutral-700` | Secondary text |
| `text-gray-700` | `text-neutral-800` | Body text |
| `text-gray-900` | `text-neutral-900` | Headings, primary text |
| `border-gray-200` | `border-neutral-200` | Card borders |
| `border-gray-300` | `border-neutral-300` | Input borders |
| `bg-primary-600` | `bg-primary-600` | Primary buttons (now green) |
| `text-primary-600` | `text-primary-600` | Links (now green) |
| `bg-green-600` | `bg-accent-500` | Success states |
| `text-green-600` | `text-accent-600` | Success text |
| `bg-red-600` | `bg-warning-500` | Warning/debt (or keep red for errors) |
| `text-red-600` | `text-warning-600` | Warning text |

## Quick Find & Replace

Use these patterns in your editor:

1. **Backgrounds:**
   - `bg-gray-50` → `bg-neutral-50`
   - `bg-gray-100` → `bg-neutral-100`
   - `bg-white` → `bg-white` (stays the same)

2. **Text:**
   - `text-gray-500` → `text-neutral-600`
   - `text-gray-600` → `text-neutral-700`
   - `text-gray-700` → `text-neutral-800`
   - `text-gray-900` → `text-neutral-900`

3. **Borders:**
   - `border-gray-200` → `border-neutral-200`
   - `border-gray-300` → `border-neutral-300`

4. **Success/Positive:**
   - `bg-green-600` → `bg-accent-500`
   - `text-green-600` → `text-accent-600`
   - `bg-green-50` → `bg-accent-50`

5. **Warnings:**
   - `bg-red-600` → `bg-warning-500` (for debt/warnings)
   - `text-red-600` → `text-warning-600`
   - Keep `red` for actual errors (not in palette, but needed)

## New Color Classes Available

- `primary-{50-900}` - Dark Forest Green (#1B5E37)
- `accent-{50-900}` - Vibrant Lime Green (#8DC63F)
- `warning-{50-900}` - Bright Orange (#E67E22)
- `neutral-{50-900}` - Grey scale (#F9FBF9 to #2D3436)

## Examples

### Buttons
```jsx
// Primary button
<button className="bg-primary-600 hover:bg-primary-700 text-white">
  Submit
</button>

// Success button
<button className="bg-accent-500 hover:bg-accent-600 text-white">
  Approve
</button>

// Warning button
<button className="bg-warning-500 hover:bg-warning-600 text-white">
  Reject
</button>
```

### Cards
```jsx
<div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
  <h3 className="text-neutral-900 font-semibold">Title</h3>
  <p className="text-neutral-600">Content</p>
</div>
```

### Links
```jsx
<Link className="text-primary-600 hover:text-primary-700">
  Click here
</Link>
```


