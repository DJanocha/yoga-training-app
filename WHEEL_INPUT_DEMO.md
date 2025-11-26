# Wheel Number Input Component

iOS-style wheel picker for number input, inspired by iPhone timer/alarm pickers.

## Files Created

1. **`/src/components/ui/wheel-number-input.tsx`** - The main component
2. **`/src/routes/wheel-demo.tsx`** - Demo page showing all variants
3. **Updated:** `/src/components/SequenceBuilder.tsx` - Now uses WheelNumberInput

## Demo

Visit `/wheel-demo` in your browser to see all three variants side-by-side.

## Features

✅ **Scroll Support** - Mouse wheel scrolling (captured, won't bubble to page)
✅ **Drag Support** - Click and drag up/down (works on web and PWA)
✅ **Touch Support** - Swipe up/down on mobile/PWA
✅ **Visual Feedback** - Selection highlight, fade edges, opacity gradient
✅ **Boundaries** - Respects min/max values
✅ **Step Control** - Customizable step size
✅ **3 Variants** - Compact, Large, Minimal

## Variants

### Compact (default)
- Size: `h-32 w-20`
- Text: `text-lg` / `text-2xl` (selected)
- Best for: General use, balanced size/readability

### Large
- Size: `h-40 w-24`
- Text: `text-xl` / `text-3xl` (selected)
- Best for: Touch-heavy interfaces, primary controls

### Minimal
- Size: `h-24 w-16`
- Text: `text-base` / `text-xl` (selected)
- Best for: Compact UIs, space-constrained layouts

## Usage

```tsx
import { WheelNumberInput } from '@/components/ui/wheel-number-input'

function MyComponent() {
  const [value, setValue] = useState(30)

  return (
    <WheelNumberInput
      value={value}
      onChange={setValue}
      min={1}
      max={999}
      step={1}
      variant="compact"
    />
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | required | Current value |
| `onChange` | `(value: number) => void` | required | Value change handler |
| `min` | `number` | `1` | Minimum value |
| `max` | `number` | `999` | Maximum value |
| `step` | `number` | `1` | Step increment |
| `variant` | `'compact' \| 'large' \| 'minimal'` | `'compact'` | Size variant |
| `className` | `string` | - | Additional CSS classes |

## How It Works

### Desktop (Mouse)
- **Scroll**: Use mouse wheel to increment/decrement
- **Drag**: Click and drag up/down to change value
- All scroll events are captured (won't scroll the page)

### Mobile/PWA (Touch)
- **Swipe**: Swipe up to increase, down to decrease
- Smooth tracking with visual feedback
- Touch events are handled with `touchmove` prevention

### Implementation Details

1. **Drag Sensitivity**: 20px = 1 step
2. **Visible Range**: Shows ±2 values around current (5 total)
3. **Opacity Fade**: Fades non-selected values based on distance
4. **Selection Indicator**: Centered highlight box with border
5. **Edge Gradients**: Top/bottom fade for iOS-like appearance

## Current Integration

The component is now used in:
- SequenceBuilder exercise picker (replaces +/- buttons)

Note: The old increment/decrement button code is still present but unused.

## To Clean Up (when ready to commit)

Remove these unused items from SequenceBuilder:
- `holdIntervalRef`, `isHoldingRef` refs
- `startHoldRepeat`, `stopHoldRepeat` functions
- `incrementValue`, `decrementValue` functions
- `Minus` icon import
- Plus/Minus button dependencies

## Testing Checklist

- [ ] Mouse wheel scrolling works (desktop)
- [ ] Click and drag works (desktop)
- [ ] Touch swipe works (mobile/PWA)
- [ ] Respects min/max boundaries
- [ ] Visual feedback is smooth
- [ ] No page scroll when using wheel
- [ ] All 3 variants render correctly
- [ ] Works in both SequenceBuilder and workout execution
