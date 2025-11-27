'use client'
import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, useCallback, useEffect } from 'react'
import { WheelNumberInput } from '@/components/ui/wheel-number-input'
import { WheelSelect } from '@/components/ui/wheel-select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GameCounter } from '@/components/ui/game-counter'
import { GameTimer } from '@/components/ui/game-timer'
import { EquipmentGrid } from '@/components/ui/equipment-grid'

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
<GameLikeUIExamples/>
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
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>CUSTOM: GameCounter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">

<GameCounter value={10} onChange={console.log}/>


        </CardContent>
      </Card>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>CUSTOM: GameTimer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">

<GameTimer seconds={10} onChange={console.log}/>


        </CardContent>
      </Card>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>CUSTOM: Equipment grid</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">

<EquipmentGrid items={[{id: 1, name: 'Guma 15 kg', value: 15, unit: 'kg'}]} activeItems={[]} onToggle={() => {}}/>


        </CardContent>
      </Card>
    </div>
  )
}





function GameLikeUIExamples() {
  return (
    <div className="flex flex-row flex-wrap gap-6 p-6 md:p-12">
      {/* 1. Equipment: Basic 3x3 Backpack Grid */}
      <Card className="w-full md:w-[45%] lg:w-[30%]">
        <CardHeader>
          <CardTitle>1. Basic 3x3 Backpack</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="w-full flex flex-col items-center justify-start p-4 rounded-lg bg-yellow-900 shadow-xl border-4 border-yellow-950 relative overflow-hidden"
            style={{
              backgroundImage:
                "url('https://via.placeholder.com/300x400/8B4513/FFFFFF?text=Backpack+Texture')",
              backgroundSize: "cover",
            }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-8 bg-yellow-700 rounded-b-lg border-x-2 border-b-2 border-yellow-950"></div>
            <h3 className="text-white text-lg font-bold mb-4 mt-6 z-10">
              Inventory
            </h3>
            <div className="grid grid-cols-3 gap-2 p-3 bg-black/30 rounded-md border border-white/20 z-10">
              <div className="w-16 h-16 bg-gray-700/50 border border-gray-500 rounded flex items-center justify-center text-white text-xs">
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-1 py-1 rounded-full border-2 border-green-500 bg-green-700 text-white text-sm"
                >
                  <span>Guma 15 kg</span>
                </button>
              </div>
              <div className="w-16 h-16 bg-gray-700/50 border border-gray-500 rounded flex items-center justify-center text-white text-xs"></div>
              <div className="w-16 h-16 bg-gray-700/50 border border-gray-500 rounded flex items-center justify-center text-white text-xs"></div>
              <div className="w-16 h-16 bg-gray-700/50 border border-gray-500 rounded flex items-center justify-center text-white text-xs">
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-1 py-1 rounded-full border-2 border-transparent bg-muted text-muted-foreground opacity-50 text-sm"
                >
                  <span>Guma 25 kg</span>
                </button>
              </div>
              <div className="w-16 h-16 bg-gray-700/50 border border-gray-500 rounded flex items-center justify-center text-white text-xs"></div>
              <div className="w-16 h-16 bg-gray-700/50 border border-gray-500 rounded flex items-center justify-center text-white text-xs"></div>
              <div className="w-16 h-16 bg-gray-700/50 border border-gray-500 rounded flex items-center justify-center text-white text-xs"></div>
              <div className="w-16 h-16 bg-gray-700/50 border border-gray-500 rounded flex items-center justify-center text-white text-xs"></div>
              <div className="w-16 h-16 bg-gray-700/50 border border-gray-500 rounded flex items-center justify-center text-white text-xs"></div>
            </div>
            <p className="text-sm text-gray-300 mt-4 z-10">
              Drag items here to equip
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Equipment: Stylized Backpack with Top Flap */}
      <Card className="w-full md:w-[45%] lg:w-[30%]">
        <CardHeader>
          <CardTitle>2. Backpack with Top Flap</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="w-full flex flex-col items-center justify-start p-4 rounded-lg bg-amber-800 shadow-xl border-4 border-amber-950 relative overflow-hidden"
            style={{
              backgroundImage:
                "url('https://via.placeholder.com/300x400/7C3B0E/FFFFFF?text=Leather+Texture')",
              backgroundSize: "cover",
            }}
          >
            <div className="absolute top-0 w-full h-16 bg-amber-900 rounded-t-lg border-b-2 border-amber-950 flex items-center justify-center">
              <span className="text-white text-lg font-bold">Equipment</span>
            </div>
            <div className="grid grid-cols-3 gap-2 p-3 bg-black/40 rounded-md border border-white/30 z-10 mt-20">
              <div className="w-16 h-16 bg-gray-700/50 border border-gray-500 rounded flex items-center justify-center text-white text-xs">
                Guma 15 kg
              </div>
              <div className="w-16 h-16 bg-gray-700/50 border border-gray-500 rounded flex items-center justify-center text-white text-xs"></div>
              <div className="w-16 h-16 bg-gray-700/50 border border-gray-500 rounded flex items-center justify-center text-white text-xs"></div>
              <div className="w-16 h-16 bg-gray-700/50 border border-gray-500 rounded flex items-center justify-center text-white text-xs">
                Guma 25 kg
              </div>
              <div className="w-16 h-16 bg-gray-700/50 border border-gray-500 rounded flex items-center justify-center text-white text-xs"></div>
              <div className="w-16 h-16 bg-gray-700/50 border border-gray-500 rounded flex items-center justify-center text-white text-xs"></div>
              <div className="w-16 h-16 bg-gray-700/50 border border-gray-500 rounded flex items-center justify-center text-white text-xs"></div>
              <div className="w-16 h-16 bg-gray-700/50 border border-gray-500 rounded flex items-center justify-center text-white text-xs"></div>
              <div className="w-16 h-16 bg-gray-700/50 border border-gray-500 rounded flex items-center justify-center text-white text-xs"></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Equipment: Backpack with "Equipped" Status */}
      <Card className="w-full md:w-[45%] lg:w-[30%]">
        <CardHeader>
          <CardTitle>3. Backpack with "Equipped"</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full flex flex-col items-center justify-start p-4 rounded-lg bg-amber-800 shadow-xl border-4 border-amber-950 relative">
            <h3 className="text-white text-lg font-bold mb-4">Inventory</h3>
            <div className="grid grid-cols-3 gap-2 p-3 bg-black/40 rounded-md border border-white/30">
              <div className="w-16 h-16 bg-gray-700/50 border border-gray-500 rounded flex items-center justify-center text-white text-xs relative">
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-1 py-1 rounded-full border-2 border-green-500 bg-green-700 text-white text-sm"
                >
                  <span>Guma 15 kg</span>
                </button>
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1 rounded-full">
                  E
                </span>
              </div>
              <div className="w-16 h-16 bg-gray-700/50 border border-gray-500 rounded flex items-center justify-center text-white text-xs">
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-1 py-1 rounded-full border-2 border-transparent bg-muted text-muted-foreground opacity-50 text-sm"
                >
                  <span>Guma 25 kg</span>
                </button>
              </div>
              <div className="w-16 h-16 bg-gray-700/50 border border-gray-500 rounded flex items-center justify-center text-white text-xs"></div>
              <div className="w-16 h-16 bg-gray-700/50 border border-gray-500 rounded flex items-center justify-center text-white text-xs"></div>
              <div className="w-16 h-16 bg-gray-700/50 border border-gray-500 rounded flex items-center justify-center text-white text-xs"></div>
              <div className="w-16 h-16 bg-gray-700/50 border border-gray-500 rounded flex items-center justify-center text-white text-xs"></div>
              <div className="w-16 h-16 bg-gray-700/50 border border-gray-500 rounded flex items-center justify-center text-white text-xs"></div>
              <div className="w-16 h-16 bg-gray-700/50 border border-gray-500 rounded flex items-center justify-center text-white text-xs"></div>
              <div className="w-16 h-16 bg-gray-700/50 border border-gray-500 rounded flex items-center justify-center text-white text-xs"></div>
            </div>
            <p className="text-sm text-gray-300 mt-4">E = Equipped</p>
          </div>
        </CardContent>
      </Card>

      {/* 4. Timer: Classic Digital Clock with Wheels (Conceptual) */}
      <Card className="w-full md:w-[45%] lg:w-[30%]">
        <CardHeader>
          <CardTitle>4. Classic Digital Clock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full flex flex-col items-center justify-start p-4 rounded-lg bg-gray-800 shadow-xl border-4 border-gray-900">
            <div
              className="flex items-center justify-center gap-1 p-4 rounded-xl bg-gray-900 border-4 border-orange-400 shadow-inner"
              style={{
                backgroundImage:
                  "url('https://via.placeholder.com/200x100/333333/FFFFFF?text=Metal+Texture')",
                backgroundSize: "cover",
              }}
            >
              {/* Minutes Wheel */}
              <div
                className="relative"
                data-tsd-source="/src/routes/sequences/$id/execute.tsx:747:13"
              >
                <div
                  className="relative select-none touch-none cursor-grab"
                  tabIndex={0}
                  role="listbox"
                  aria-label="Minutes picker"
                >
                  <div
                    className="relative rounded-lg border-2 border-orange-500 bg-gray-700 overflow-hidden"
                    style={{ height: "120px", width: "60px" }}
                  >
                    <div
                      className="absolute w-full transition-transform duration-150 ease-out pointer-events-none"
                      style={{ top: "calc(50% - 72px)", transform: "translateY(0px)" }}
                    >
                      <div
                        className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-3xl font-bold text-white"
                        style={{ opacity: 0.75 }}
                      >
                        0
                      </div>
                      <div
                        className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-4xl font-bold text-white"
                        style={{ opacity: 1 }}
                      >
                        5
                      </div>
                      <div
                        className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-3xl font-bold text-white"
                        style={{ opacity: 0.75 }}
                      >
                        6
                      </div>
                    </div>
                    <div
                      className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-y-2 border-orange-400 bg-orange-700/20 pointer-events-none"
                      style={{ height: "48px" }}
                    ></div>
                    <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-gray-700 to-transparent pointer-events-none h-16"></div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-700 to-transparent pointer-events-none h-16"></div>
                  </div>
                </div>
              </div>

              <span className="text-6xl font-extrabold text-orange-400">:</span>

              {/* Seconds Wheel */}
              <div
                className="relative"
                data-tsd-source="/src/routes/sequences/$id/execute.tsx:747:13"
              >
                <div
                  className="relative select-none touch-none cursor-grab"
                  tabIndex={0}
                  role="listbox"
                  aria-label="Seconds picker"
                >
                  <div
                    className="relative rounded-lg border-2 border-orange-500 bg-gray-700 overflow-hidden"
                    style={{ height: "120px", width: "60px" }}
                  >
                    <div
                      className="absolute w-full transition-transform duration-150 ease-out pointer-events-none"
                      style={{ top: "calc(50% - 72px)", transform: "translateY(0px)" }}
                    >
                      <div
                        className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-3xl font-bold text-white"
                        style={{ opacity: 0.75 }}
                      >
                        5
                      </div>
                      <div
                        className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-4xl font-bold text-white"
                        style={{ opacity: 1 }}
                      >
                        0
                      </div>
                      <div
                        className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-3xl font-bold text-white"
                        style={{ opacity: 0.75 }}
                      >
                        1
                      </div>
                    </div>
                    <div
                      className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-y-2 border-orange-400 bg-orange-700/20 pointer-events-none"
                      style={{ height: "48px" }}
                    ></div>
                    <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-gray-700 to-transparent pointer-events-none h-16"></div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-700 to-transparent pointer-events-none h-16"></div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-300 mt-4">Time Remaining</p>
          </div>
        </CardContent>
      </Card>

      {/* 5. Timer: Steampunk-inspired Clock Face */}
      <Card className="w-full md:w-[45%] lg:w-[30%]">
        <CardHeader>
          <CardTitle>5. Steampunk Clock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full flex flex-col items-center justify-start p-4 rounded-lg bg-gray-800 shadow-xl border-4 border-gray-900">
            <div
              className="flex items-center justify-center gap-1 p-6 rounded-full bg-gray-900 border-8 border-amber-600 shadow-2xl relative"
              style={{
                backgroundImage:
                  "url('https://via.placeholder.com/200x200/444444/FFFFFF?text=Gear+Texture')",
                backgroundSize: "cover",
                width: "250px",
                height: "250px",
              }}
            >
              <div className="absolute inset-4 rounded-full border-4 border-amber-400 bg-black/30"></div>

              {/* Minutes Wheel */}
              <div
                className="relative z-10"
                data-tsd-source="/src/routes/sequences/$id/execute.tsx:747:13"
              >
                <div
                  className="relative select-none touch-none cursor-grab"
                  tabIndex={0}
                  role="listbox"
                  aria-label="Minutes picker"
                >
                  <div
                    className="relative rounded-lg border-2 border-amber-500 bg-gray-700 overflow-hidden"
                    style={{ height: "80px", width: "40px" }}
                  >
                    <div
                      className="absolute w-full transition-transform duration-150 ease-out pointer-events-none"
                      style={{ top: "calc(50% - 48px)", transform: "translateY(0px)" }}
                    >
                      <div
                        className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-xl font-bold text-white"
                        style={{ opacity: 0.75 }}
                      >
                        0
                      </div>
                      <div
                        className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-3xl font-bold text-white"
                        style={{ opacity: 1 }}
                      >
                        5
                      </div>
                      <div
                        className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-xl font-bold text-white"
                        style={{ opacity: 0.75 }}
                      >
                        6
                      </div>
                    </div>
                    <div
                      className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-y-2 border-amber-400 bg-amber-700/20 pointer-events-none"
                      style={{ height: "48px" }}
                    ></div>
                  </div>
                </div>
              </div>

              <span className="text-4xl font-extrabold text-amber-400 z-10">
                :
              </span>

              {/* Seconds Wheel */}
              <div
                className="relative z-10"
                data-tsd-source="/src/routes/sequences/$id/execute.tsx:747:13"
              >
                <div
                  className="relative select-none touch-none cursor-grab"
                  tabIndex={0}
                  role="listbox"
                  aria-label="Seconds picker"
                >
                  <div
                    className="relative rounded-lg border-2 border-amber-500 bg-gray-700 overflow-hidden"
                    style={{ height: "80px", width: "40px" }}
                  >
                    <div
                      className="absolute w-full transition-transform duration-150 ease-out pointer-events-none"
                      style={{ top: "calc(50% - 48px)", transform: "translateY(0px)" }}
                    >
                      <div
                        className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-xl font-bold text-white"
                        style={{ opacity: 0.75 }}
                      >
                        5
                      </div>
                      <div
                        className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-3xl font-bold text-white"
                        style={{ opacity: 1 }}
                      >
                        0
                      </div>
                      <div
                        className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-xl font-bold text-white"
                        style={{ opacity: 0.75 }}
                      >
                        1
                      </div>
                    </div>
                    <div
                      className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-y-2 border-amber-400 bg-amber-700/20 pointer-events-none"
                      style={{ height: "48px" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-300 mt-4">Time Capsule</p>
          </div>
        </CardContent>
      </Card>

      {/* 6. Timer: Minimalist Digital Timer */}
      <Card className="w-full md:w-[45%] lg:w-[30%]">
        <CardHeader>
          <CardTitle>6. Minimalist Digital Timer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full flex flex-col items-center justify-start p-4 rounded-lg bg-black shadow-lg border-2 border-emerald-500">
            <div className="flex items-center justify-center gap-1 p-3 rounded-md bg-zinc-900 border border-emerald-700">
              {/* Minutes Wheel (simplified) */}
              <div
                className="relative"
                data-tsd-source="/src/routes/sequences/$id/execute.tsx:747:13"
              >
                <div
                  className="relative rounded-lg bg-zinc-800 overflow-hidden"
                  style={{ height: "96px", width: "48px" }}
                >
                  <div
                    className="absolute w-full transition-transform duration-150 ease-out pointer-events-none"
                    style={{ top: "calc(50% - 60px)", transform: "translateY(0px)" }}
                  >
                    <div
                      className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-2xl font-bold text-emerald-400"
                      style={{ opacity: 0.5 }}
                    >
                      0
                    </div>
                    <div
                      className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-4xl font-bold text-emerald-400"
                      style={{ opacity: 1 }}
                    >
                      5
                    </div>
                    <div
                      className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-2xl font-bold text-emerald-400"
                      style={{ opacity: 0.5 }}
                    >
                      6
                    </div>
                  </div>
                  <div
                    className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-y-2 border-emerald-500 bg-emerald-900/20 pointer-events-none"
                    style={{ height: "48px" }}
                  ></div>
                </div>
              </div>

              <span className="text-5xl font-bold text-emerald-400">:</span>

              {/* Seconds Wheel (simplified) */}
              <div
                className="relative"
                data-tsd-source="/src/routes/sequences/$id/execute.tsx:747:13"
              >
                <div
                  className="relative rounded-lg bg-zinc-800 overflow-hidden"
                  style={{ height: "96px", width: "48px" }}
                >
                  <div
                    className="absolute w-full transition-transform duration-150 ease-out pointer-events-none"
                    style={{ top: "calc(50% - 60px)", transform: "translateY(0px)" }}
                  >
                    <div
                      className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-2xl font-bold text-emerald-400"
                      style={{ opacity: 0.5 }}
                    >
                      5
                    </div>
                    <div
                      className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-4xl font-bold text-emerald-400"
                      style={{ opacity: 1 }}
                    >
                      0
                    </div>
                    <div
                      className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-2xl font-bold text-emerald-400"
                      style={{ opacity: 0.5 }}
                    >
                      1
                    </div>
                  </div>
                  <div
                    className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-y-2 border-emerald-500 bg-emerald-900/20 pointer-events-none"
                    style={{ height: "48px" }}
                  ></div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-4">Time Left</p>
          </div>
        </CardContent>
      </Card>

      {/* 7. Counter: Scrollwheel on a Wooden Plaque */}
      <Card className="w-full md:w-[45%] lg:w-[30%]">
        <CardHeader>
          <CardTitle>7. Wooden Plaque Counter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center p-6 rounded-xl bg-amber-950 border-4 border-amber-700 shadow-lg">
            <h2 className="text-2xl md:text-4xl font-bold text-center mb-2 md:mb-4 text-white">
              Pull up
            </h2>
            <div className="relative p-2 rounded-lg bg-amber-800 border-4 border-amber-900 shadow-inner">
              <div
                className="relative select-none touch-none cursor-grab"
                tabIndex={0}
                role="listbox"
                aria-label="Repetition picker"
              >
                <div
                  className="relative rounded-lg bg-amber-900 overflow-hidden"
                  style={{ height: "192px", width: "96px" }}
                >
                  <div
                    className="absolute w-full transition-transform duration-150 ease-out pointer-events-none"
                    style={{ top: "calc(50% - 168px)", transform: "translateY(0px)" }}
                  >
                    <div
                      className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-2xl font-medium text-white"
                      style={{ opacity: 0.25 }}
                    >
                      2
                    </div>
                    <div
                      className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-2xl font-medium text-white"
                      style={{ opacity: 0.5 }}
                    >
                      3
                    </div>
                    <div
                      className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-2xl font-medium text-white"
                      style={{ opacity: 0.75 }}
                    >
                      4
                    </div>
                    <div
                      className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-4xl font-bold text-white"
                      style={{ opacity: 1 }}
                    >
                      5
                    </div>
                    <div
                      className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-2xl font-medium text-white"
                      style={{ opacity: 0.75 }}
                    >
                      6
                    </div>
                    <div
                      className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-2xl font-medium text-white"
                      style={{ opacity: 0.5 }}
                    >
                      7
                    </div>
                    <div
                      className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-2xl font-medium text-white"
                      style={{ opacity: 0.25 }}
                    >
                      8
                    </div>
                  </div>
                  <div
                    className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-y-2 border-yellow-600 bg-yellow-800/20 pointer-events-none"
                    style={{ height: "48px" }}
                  ></div>
                  <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-amber-900 to-transparent pointer-events-none h-16"></div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-amber-900 to-transparent pointer-events-none h-16"></div>
                </div>
              </div>
            </div>
            <p className="text-white md:text-lg mt-4 font-semibold">
              Repetitions
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 8. Counter: "Scoreboard" Style Wheel */}
      <Card className="w-full md:w-[45%] lg:w-[30%]">
        <CardHeader>
          <CardTitle>8. Scoreboard Style Counter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-black border-4 border-gray-700 shadow-2xl">
            <h2 className="text-2xl md:text-4xl font-bold text-center mb-2 md:mb-4 text-orange-400 uppercase tracking-wide">
              Current Goal
            </h2>
            <div className="relative p-4 rounded-xl bg-gray-800 border-4 border-gray-600 shadow-inner">
              <div
                className="relative select-none touch-none cursor-grab"
                tabIndex={0}
                role="listbox"
                aria-label="Repetition picker"
              >
                <div
                  className="relative rounded-lg bg-gray-900 overflow-hidden"
                  style={{ height: "192px", width: "96px" }}
                >
                  <div
                    className="absolute w-full transition-transform duration-150 ease-out pointer-events-none"
                    style={{ top: "calc(50% - 168px)", transform: "translateY(0px)" }}
                  >
                    <div
                      className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-2xl font-medium text-lime-400"
                      style={{ opacity: 0.25 }}
                    >
                      2
                    </div>
                    <div
                      className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-2xl font-medium text-lime-400"
                      style={{ opacity: 0.5 }}
                    >
                      3
                    </div>
                    <div
                      className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-2xl font-medium text-lime-400"
                      style={{ opacity: 0.75 }}
                    >
                      4
                    </div>
                    <div
                      className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-4xl font-bold text-lime-400"
                      style={{ opacity: 1 }}
                    >
                      5
                    </div>
                    <div
                      className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-2xl font-medium text-lime-400"
                      style={{ opacity: 0.75 }}
                    >
                      6
                    </div>
                    <div
                      className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-2xl font-medium text-lime-400"
                      style={{ opacity: 0.5 }}
                    >
                      7
                    </div>
                    <div
                      className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-2xl font-medium text-lime-400"
                      style={{ opacity: 0.25 }}
                    >
                      8
                    </div>
                  </div>
                  <div
                    className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-y-2 border-lime-500 bg-lime-900/20 pointer-events-none"
                    style={{ height: "48px" }}
                  ></div>
                </div>
              </div>
            </div>
            <p className="text-lime-300 md:text-lg mt-4 font-semibold">
              Target Reps
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 9. Equipment: RPG Inventory Grid with Item Icons */}
      <Card className="w-full md:w-[45%] lg:w-[30%]">
        <CardHeader>
          <CardTitle>9. RPG Inventory Grid</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full flex flex-col items-center justify-start p-4 rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-700 shadow-xl border-4 border-neutral-950 relative">
            <h3 className="text-white text-xl font-bold tracking-wider mb-4">
              Inventory
            </h3>
            <div className="grid grid-cols-3 gap-2 p-3 bg-black/50 rounded-md border-2 border-gray-600">
              <div className="w-20 h-20 bg-gray-800 border-2 border-gray-600 rounded flex items-center justify-center relative group">
                <img
                  src="https://via.placeholder.com/48/green?text=G15"
                  alt="Guma 15 kg"
                  className="w-12 h-12"
                />
                <div className="absolute inset-0 bg-green-700/50 border-2 border-green-500 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs font-bold">Equipped</span>
                </div>
              </div>
              <div className="w-20 h-20 bg-gray-800 border-2 border-gray-600 rounded flex items-center justify-center">
                <img
                  src="https://via.placeholder.com/48/gray?text=G25"
                  alt="Guma 25 kg"
                  className="w-12 h-12 opacity-50"
                />
              </div>
              <div className="w-20 h-20 bg-gray-800 border-2 border-gray-600 rounded flex items-center justify-center">
                <img
                  src="https://via.placeholder.com/48/lightgray?text=BW"
                  alt="Bodyweight"
                  className="w-12 h-12"
                />
              </div>
              <div className="w-20 h-20 bg-gray-800 border-2 border-gray-600 rounded flex items-center justify-center"></div>
              <div className="w-20 h-20 bg-gray-800 border-2 border-gray-600 rounded flex items-center justify-center"></div>
              <div className="w-20 h-20 bg-gray-800 border-2 border-gray-600 rounded flex items-center justify-center"></div>
              <div className="w-20 h-20 bg-gray-800 border-2 border-gray-600 rounded flex items-center justify-center"></div>
              <div className="w-20 h-20 bg-gray-800 border-2 border-gray-600 rounded flex items-center justify-center"></div>
              <div className="w-20 h-20 bg-gray-800 border-2 border-gray-600 rounded flex items-center justify-center"></div>
            </div>
            <p className="text-sm text-gray-400 mt-4">
              Selected equipment shines green.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 10. Counter: Retro Arcade Game Score Display */}
      <Card className="w-full md:w-[45%] lg:w-[30%]">
        <CardHeader>
          <CardTitle>10. Retro Arcade Counter</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex flex-col items-center p-8 rounded-2xl bg-gradient-to-br from-indigo-900 to-purple-900 border-8 border-indigo-700 shadow-neon"
            style={{
              "--shadow-neon": "0 0 15px #a78bfa, 0 0 25px #c084fc",
            }}
          >
            <h2
              className="text-4xl md:text-5xl font-arcade text-yellow-300 mb-4 tracking-wide uppercase"
              style={{ fontFamily: "'Press Start 2P', cursive" }}
            >
              Reps
            </h2>
            <div
              className="relative p-3 rounded-lg bg-black border-4 border-yellow-500 shadow-inner-lg"
              style={{
                boxShadow:
                  "inset 0 0 10px rgba(255, 255, 0, 0.5), 0 0 10px rgba(255, 255, 0, 0.3)",
              }}
            >
              <div
                className="relative select-none touch-none cursor-grab"
                tabIndex={0}
                role="listbox"
                aria-label="Repetition picker"
              >
                <div
                  className="relative rounded-lg bg-gray-950 overflow-hidden"
                  style={{ height: "192px", width: "96px" }}
                >
                  <div
                    className="absolute w-full transition-transform duration-150 ease-out pointer-events-none"
                    style={{ top: "calc(50% - 168px)", transform: "translateY(0px)" }}
                  >
                    <div
                      className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-3xl font-arcade text-green-400"
                      style={{
                        opacity: 0.25,
                        fontFamily: "'Press Start 2P', cursive",
                      }}
                    >
                      2
                    </div>
                    <div
                      className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-3xl font-arcade text-green-400"
                      style={{
                        opacity: 0.5,
                        fontFamily: "'Press Start 2P', cursive",
                      }}
                    >
                      3
                    </div>
                    <div
                      className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-3xl font-arcade text-green-400"
                      style={{
                        opacity: 0.75,
                        fontFamily: "'Press Start 2P', cursive",
                      }}
                    >
                      4
                    </div>
                    <div
                      className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-5xl font-arcade text-green-400"
                      style={{
                        opacity: 1,
                        fontFamily: "'Press Start 2P', cursive",
                      }}
                    >
                      5
                    </div>
                    <div
                      className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-3xl font-arcade text-green-400"
                      style={{
                        opacity: 0.75,
                        fontFamily: "'Press Start 2P', cursive",
                      }}
                    >
                      6
                    </div>
                    <div
                      className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-3xl font-arcade text-green-400"
                      style={{
                        opacity: 0.5,
                        fontFamily: "'Press Start 2P', cursive",
                      }}
                    >
                      7
                    </div>
                    <div
                      className="flex items-center justify-center transition-opacity duration-150 pointer-events-none h-12 text-3xl font-arcade text-green-400"
                      style={{
                        opacity: 0.25,
                        fontFamily: "'Press Start 2P', cursive",
                      }}
                    >
                      8
                    </div>
                  </div>
                  <div
                    className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-y-2 border-green-500 bg-green-900/20 pointer-events-none"
                    style={{ height: "48px" }}
                  ></div>
                </div>
              </div>
            </div>
            <p
              className="text-gray-400 md:text-lg mt-4 font-arcade"
              style={{ fontFamily: "'Press Start 2P', cursive" }}
            >
              GOAL SET
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}