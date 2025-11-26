'use client'
import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, useCallback, useEffect } from 'react'
import { WheelNumberInput } from '@/components/ui/wheel-number-input'
import { WheelSelect } from '@/components/ui/wheel-select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/wheel-demo')({
  component: WheelDemo,
})
interface WheelInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  min?: number;
  max?: number;
  step?: number;
  initialValue?: number;
  // onChange will work like shadcn's Input, returning string
  onChange?: (value: string) => void;
}
const WheelInput2: React.FC<WheelInputProps> = ({
  min = 0,
  max = 59,
  step = 1,
  initialValue = 0,
  onChange,
  ...props
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const numberListRef = useRef<HTMLDivElement>(null);
  const [offsetY, setOffsetY] = useState(0); // This will control translateY
  const [currentValue, setCurrentValue] = useState(initialValue);
  const itemHeightRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  const allNumbers = Array.from(
    { length: (max - min) / step + 1 },
    (_, i) => min + i * step
  );
  const displayNumbers = Array(5).fill(allNumbers).flat();

  // Calculate the closest valid offset and snap to it
  const snapToOffset = useCallback(
    (currentOffset: number) => {
      if (itemHeightRef.current === 0) return currentOffset;

      const itemCenterOffset = itemHeightRef.current / 2;
      const centeredOffset = currentOffset - itemCenterOffset; // Adjust so center aligns with 0
      const nearestItemIndex = Math.round(centeredOffset / itemHeightRef.current);
      const snappedOffset = nearestItemIndex * itemHeightRef.current + itemCenterOffset;

      // Ensure the snapped offset is within reasonable bounds
      // This is crucial for the "infinite" loop effect
      const totalListHeight = displayNumbers.length * itemHeightRef.current;
      const halfTotalHeight = totalListHeight / 2; // Roughly center of the duplicated list

      // To keep the "virtual" current value within the 0-allNumbers.length range
      // Map current offset back to a number index within the original allNumbers array
      const scrollProgress = -snappedOffset; // Negative because translateY moves content up
      const itemsScrolled = scrollProgress / itemHeightRef.current;
      const normalizedIndex =
        ((itemsScrolled + halfTotalHeight / itemHeightRef.current) %
          allNumbers.length) +
        allNumbers.length; // Add allNumbers.length to handle negative modulo
      const actualValueIndex = Math.round(normalizedIndex) % allNumbers.length;
      const newValue = allNumbers[actualValueIndex];

      setCurrentValue(newValue);
      onChange?.(newValue.toString());

      return snappedOffset;
    },
    [allNumbers, displayNumbers.length, onChange]
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    const numberList = numberListRef.current;
    if (!viewport || !numberList) return;

    // Measure item height
    const firstItem = numberList.querySelector(".number-item");
    if (firstItem) {
      itemHeightRef.current = firstItem.clientHeight;

      // Initialize offset to initialValue
      const initialIndex = allNumbers.indexOf(initialValue);
      if (initialIndex !== -1) {
        const middleSetOffset =
          Math.floor(displayNumbers.length / 2 / allNumbers.length) *
          allNumbers.length;
        const initialRelativeOffset =
          (middleSetOffset + initialIndex) * itemHeightRef.current;
        // Adjust for centering in viewport (viewport height / 2 - item height / 2)
        const viewportCenterOffset =
          viewport.clientHeight / 2 - itemHeightRef.current / 2;
        setOffsetY(-initialRelativeOffset + viewportCenterOffset);
      }
    }

    let isDragging = false;
    let startY = 0;
    let initialOffsetY = 0;
    let lastMoveTime = 0;
    let lastMoveOffset = 0;
    let velocity = 0;
    let animationId: number;

    const animateInertia = () => {
      if (!isDragging && Math.abs(velocity) > 0.1) {
        velocity *= 0.95; // Apply friction
        let newOffset = offsetY + velocity;

        // Apply boundary checks/looping logic here if needed
        // For infinite scroll, calculate the actual position within the loop
        const totalListHeight = displayNumbers.length * itemHeightRef.current;
        const halfTotalListHeight = totalListHeight / 2;

        // Keep the translateY value within a manageable range for smooth looping
        // This is the tricky part: when an item goes off screen, "teleport" it
        // A common strategy is to keep the current `offsetY` centered around `0`
        // or a specific range, and when it goes too far, jump it by `totalListHeight`
        if (newOffset > itemHeightRef.current) {
            newOffset -= totalListHeight;
        } else if (newOffset < -(totalListHeight - itemHeightRef.current)) {
            newOffset += totalListHeight;
        }


        setOffsetY(newOffset);
        animationId = requestAnimationFrame(animateInertia);
      } else if (!isDragging && Math.abs(velocity) <= 0.1) {
        // When inertia stops, snap to nearest
        setOffsetY((prev) => snapToOffset(prev));
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      startY = e.clientY;
      initialOffsetY = offsetY; // Store current offset to calculate delta from
      velocity = 0; // Reset velocity
      cancelAnimationFrame(animationId); // Stop any ongoing inertia animation
      viewport.style.cursor = "grabbing";
      viewport.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaY = e.clientY - startY; // Raw delta from start
      let newOffset = initialOffsetY + deltaY;

      // Calculate instantaneous velocity
      const currentTime = performance.now();
      const timeDelta = currentTime - lastMoveTime;
      if (timeDelta > 0) {
        const moveDelta = newOffset - lastMoveOffset;
        velocity = moveDelta / timeDelta * 10; // Adjust multiplier for feel
      }
      lastMoveTime = currentTime;
      lastMoveOffset = newOffset;

      setOffsetY(newOffset); // Update state to re-render with new transform
    };

    const handlePointerUp = () => {
      if (!isDragging) return;
      isDragging = false;
      viewport.style.cursor = "grab";
      // Start inertia animation if there's velocity
      if (Math.abs(velocity) > 0.5) {
        animationId = requestAnimationFrame(animateInertia);
      } else {
        // If no significant velocity, just snap
        setOffsetY((prev) => snapToOffset(prev));
      }
      velocity = 0; // Reset velocity after ending
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); // Prevent page scroll
      const scrollAmount = e.deltaY; // Use deltaY for scroll
      let newOffset = offsetY - scrollAmount; // Subtract to move list up on scroll down

      setOffsetY(newOffset); // Temporarily update offset
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(() => {
        setOffsetY((prev) => snapToOffset(prev)); // Snap after a short delay/debounce
      });
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });
    viewport.addEventListener("pointerdown", handlePointerDown);
    viewport.addEventListener("pointermove", handlePointerMove);
    viewport.addEventListener("pointerup", handlePointerUp);
    viewport.addEventListener("pointerleave", handlePointerUp);

    return () => {
      viewport.removeEventListener("wheel", handleWheel);
      viewport.removeEventListener("pointerdown", handlePointerDown);
      viewport.removeEventListener("pointermove", handlePointerMove);
      viewport.removeEventListener("pointerup", handlePointerUp);
      viewport.removeEventListener("pointerleave", handlePointerUp);
      cancelAnimationFrame(animationId);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [offsetY, snapToOffset, allNumbers, initialValue, displayNumbers.length]);

  return (
    <div
      className="wheel-input-wrapper"
      tabIndex={0}
      role="spinbutton"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={currentValue}
      aria-label={`${props.id || "Number"} picker`}
      {...props}
    >
      <div className="wheel-container">
        <div className="wheel-viewport" ref={viewportRef}>
          <div
            className="number-list"
            ref={numberListRef}
            style={{ transform: `translateY(${offsetY}px)` }}
          >
            {displayNumbers.map((num, index) => (
              <div key={index} className="number-item">
                {String(num).padStart(2, "0")}
              </div>
            ))}
          </div>
        </div>
        <div className="selection-overlay" />
      </div>
      <input
        type="hidden"
        value={currentValue.toString()}
        name={props.name || props.id}
      />
    </div>
  );
};
export const WheelInput: React.FC<WheelInputProps> = ({
  min = 0,
  max = 59,
  step = 1,
  initialValue = 0,
  onChange,
  ...props
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [currentValue, setCurrentValue] = useState(initialValue);
  const itemHeightRef = useRef(0);

  // Generate numbers for the wheel (e.g., 0-59)
  const allNumbers = Array.from(
    { length: (max - min) / step + 1 },
    (_, i) => min + i * step
  );
  // Duplicate for a smooth "infinite" scroll effect
  const displayNumbers = Array(5).fill(allNumbers).flat(); // 5 repetitions

  const snapToNearestItem = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || itemHeightRef.current === 0) return;

    const scrollTop = viewport.scrollTop;
    const padding = 48; // Must match paddingTop in the render

    // Calculate which item is currently centered
    // Account for padding: scrollTop is measured from the top of scrollable content (including padding)
    const centerPosition = scrollTop + viewport.clientHeight / 2 - padding;
    const centerIndex = Math.round(centerPosition / itemHeightRef.current);

    // Snap to that centered item
    const newScrollTop = centerIndex * itemHeightRef.current + padding - viewport.clientHeight / 2;

    viewport.scrollTo({
      top: newScrollTop,
      behavior: "smooth",
    });

    // Map the centered index back to actual value range
    let actualValueIndex = centerIndex % allNumbers.length;
    // Handle negative modulo
    if (actualValueIndex < 0) {
      actualValueIndex += allNumbers.length;
    }
    const newValue = allNumbers[actualValueIndex];
    setCurrentValue(newValue);
    onChange?.(newValue.toString());
  }, [allNumbers, onChange]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    // Measure item height on mount - use a small delay to ensure DOM is ready
    setTimeout(() => {
      const firstItem = viewport.querySelector("div > div");
      if (firstItem) {
        itemHeightRef.current = firstItem.clientHeight;
        const padding = 48; // Must match paddingTop in the render

        // Initialize scroll position to initialValue
        const initialIndex = allNumbers.indexOf(initialValue);
        if (initialIndex !== -1) {
          // Scroll to one of the duplicated sets that contains initialValue
          // Use the middle set (set 2 of 5, so offset by 2 * allNumbers.length)
          const middleSetOffset = 2 * allNumbers.length;
          const targetIndex = middleSetOffset + initialIndex;

          // Center the item in the viewport, accounting for padding
          viewport.scrollTop =
            targetIndex * itemHeightRef.current + padding - viewport.clientHeight / 2 + itemHeightRef.current / 2;
        }
      }
    }, 0);


    let isScrolling: NodeJS.Timeout | null = null;
    let isDragging = false;
    let startY = 0;
    let currentY = 0;

    const handleScroll = () => {
      // For debouncing scroll end
      if (isScrolling) {
        clearTimeout(isScrolling);
      }
      isScrolling = setTimeout(() => {
        if (!isDragging) { // Only snap if not actively dragging
          snapToNearestItem();
        }
      }, 150); // Adjust debounce time
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); // Prevent page scroll
      viewport.scrollTop += e.deltaY;
      handleScroll(); // Trigger scroll logic
    };

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      startY = e.clientY;
      viewport.style.cursor = "grabbing";
      viewport.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      currentY = e.clientY;
      const deltaY = startY - currentY; // Invert for natural drag direction
      viewport.scrollTop += deltaY;
      startY = currentY; // Update startY for continuous dragging
      handleScroll(); // Trigger scroll logic
    };

    const handlePointerUp = () => {
      if (!isDragging) return;
      isDragging = false;
      viewport.style.cursor = "grab";
      snapToNearestItem();
    };

    viewport.addEventListener("scroll", handleScroll);
    viewport.addEventListener("wheel", handleWheel, { passive: false });
    viewport.addEventListener("pointerdown", handlePointerDown);
    viewport.addEventListener("pointermove", handlePointerMove);
    viewport.addEventListener("pointerup", handlePointerUp);
    viewport.addEventListener("pointerleave", handlePointerUp); // Handle drag out of bounds

    return () => {
      viewport.removeEventListener("scroll", handleScroll);
      viewport.removeEventListener("wheel", handleWheel);
      viewport.removeEventListener("pointerdown", handlePointerDown);
      viewport.removeEventListener("pointermove", handlePointerMove);
      viewport.removeEventListener("pointerup", handlePointerUp);
      viewport.removeEventListener("pointerleave", handlePointerUp);
      if (isScrolling) clearTimeout(isScrolling);
    };
  }, [snapToNearestItem, allNumbers, initialValue, displayNumbers.length]);

  return (
    <div
      className="relative select-none"
      tabIndex={0}
      role="spinbutton"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={currentValue}
      aria-label={`${props.id || "Number"} picker`}
      {...props}
    >
      <div className="relative h-32 w-20 rounded-lg border bg-background overflow-hidden">
        <div
          ref={viewportRef}
          className="h-full w-full overflow-y-scroll cursor-grab active:cursor-grabbing"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Add padding equal to half viewport height minus half item height to allow scrolling items to center */}
          <div style={{ paddingTop: '48px', paddingBottom: '48px' }}>
            {displayNumbers.map((num, index) => (
              <div
                key={index}
                className="h-8 flex items-center justify-center text-lg font-medium"
              >
                {String(num).padStart(2, "0")}
              </div>
            ))}
          </div>
        </div>
        {/* Selection indicator */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-8 border-y-2 border-primary/20 bg-primary/5 pointer-events-none" />
        {/* Fade edges */}
        <div className="absolute inset-x-0 top-0 h-12 bg-linear-to-b from-background to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-background to-transparent pointer-events-none" />
      </div>
      {/* Hidden input to potentially integrate with forms better */}
      <input
        type="hidden"
        value={currentValue.toString()}
        name={props.name || props.id}
      />
    </div>
  );
};
function WheelDemo() {
  const [numberValue, setNumberValue] = useState(30)
  const [measure, setMeasure] = useState<'repetitions' | 'time'>('repetitions')

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Wheel Picker Components</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
        {/* WheelNumberInput */}
        <Card>
          <CardHeader>
            <CardTitle>WheelNumberInput</CardTitle>
            <CardDescription>
              Number picker with range support
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <WheelNumberInput
              value={numberValue}
              onChange={setNumberValue}
              min={1}
              max={999}
              step={1}
            />
            <div className="text-sm text-muted-foreground">
              Value: <span className="font-mono font-bold">{numberValue}</span>
            </div>
            <div className="text-xs text-muted-foreground text-center">
              min={1}, max={999}, step={1}
            </div>
          </CardContent>
        </Card>

        {/* WheelSelect */}
        <Card>
          <CardHeader>
            <CardTitle>WheelSelect</CardTitle>
            <CardDescription>
              Generic option picker (like reps/sec)
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <WheelSelect
              value={measure}
              onChange={setMeasure}
              options={['repetitions', 'time'] as const}
              formatOption={(opt) => opt === 'repetitions' ? 'reps' : 'sec'}
            />
            <div className="text-sm text-muted-foreground">
              Value: <span className="font-mono font-bold">{measure}</span>
            </div>
            <div className="text-xs text-muted-foreground text-center">
              options: ['repetitions', 'time']
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Usage Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-semibold mb-2">Interactions:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>Desktop:</strong> Mouse wheel or click & drag up/down</li>
              <li><strong>Mobile/PWA:</strong> Swipe up/down to change value</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold mb-2">Features:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Transform-based animation (smooth & reliable)</li>
              <li>2-digit number formatting (01, 02, 03...)</li>
              <li>Fade edges for iOS-like appearance</li>
              <li>Selection indicator highlight</li>
              <li>Respects min/max boundaries</li>
              <li>Supports ref forwarding</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold mb-2">WheelNumberInput Usage:</p>
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`import { WheelNumberInput } from '@/components/ui/wheel-number-input'

const [value, setValue] = useState(30)

<WheelNumberInput
  value={value}
  onChange={setValue}
  min={1}
  max={999}
  step={1}
/>`}
            </pre>
          </div>

          <div>
            <p className="font-semibold mb-2">WheelSelect Usage:</p>
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`import { WheelSelect } from '@/components/ui/wheel-select'

const [measure, setMeasure] = useState<'repetitions' | 'time'>('repetitions')

<WheelSelect
  value={measure}
  onChange={setMeasure}
  options={['repetitions', 'time'] as const}
  formatOption={(opt) => opt === 'repetitions' ? 'reps' : 'sec'}
/>

// Or with string options:
const [color, setColor] = useState('red')
<WheelSelect
  value={color}
  onChange={setColor}
  options={['red', 'green', 'blue']}
/>`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
