import { useState, useRef, useCallback } from 'react';
import { sound } from '../audio/sound';
import { isReducedMotion } from '../utils/motion';

export interface UseCardReorderOptions {
  itemCount: number;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  onTap?: (index: number) => void;
  disabled?: boolean;
}

export interface DragPosition {
  x: number;
  y: number;
}

export function useCardReorder({
  itemCount,
  onReorder,
  onTap,
  disabled = false,
}: UseCardReorderOptions) {
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<DragPosition>({ x: 0, y: 0 });
  const [tilt, setTilt] = useState(0);

  // Ref mirrors for window event listener closures
  const draggingIndexRef = useRef<number | null>(null);
  const dropTargetIndexRef = useRef<number | null>(null);
  const startPointerPos = useRef<DragPosition>({ x: 0, y: 0 });
  const cardOriginRect = useRef<DOMRect | null>(null);
  const slotWidthRef = useRef<number>(150);
  const hasTriggeredDrag = useRef<boolean>(false);

  const DRAG_THRESHOLD_PX = 8;

  const registerCardRef = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) {
      cardRefs.current.set(index, el);
    } else {
      cardRefs.current.delete(index);
    }
  }, []);

  const calculateSlotMetrics = useCallback(() => {
    const rects: DOMRect[] = [];
    for (let i = 0; i < itemCount; i++) {
      const el = cardRefs.current.get(i);
      if (el) {
        rects.push(el.getBoundingClientRect());
      }
    }
    if (rects.length > 1) {
      // Distance between adjacent card centers/lefts
      slotWidthRef.current = Math.abs(rects[1].left - rects[0].left);
    } else if (rects.length === 1) {
      slotWidthRef.current = rects[0].width + 12;
    }
    return rects;
  }, [itemCount]);

  const findClosestTargetIndex = useCallback(
    (pointerX: number, activeIndex: number) => {
      let closest = activeIndex;
      let minDistance = Infinity;

      for (let i = 0; i < itemCount; i++) {
        const el = cardRefs.current.get(i);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const midX = rect.left + rect.width / 2;
        const dist = Math.abs(pointerX - midX);
        if (dist < minDistance) {
          minDistance = dist;
          closest = i;
        }
      }

      return closest;
    },
    [itemCount]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, index: number) => {
      if (disabled || e.button > 0 || itemCount <= 1) return;

      const originX = e.clientX;
      const originY = e.clientY;
      startPointerPos.current = { x: originX, y: originY };
      hasTriggeredDrag.current = false;

      const cardEl = cardRefs.current.get(index);
      if (cardEl) {
        cardOriginRect.current = cardEl.getBoundingClientRect();
      }

      calculateSlotMetrics();

      let lastClientX = originX;

      const onPointerMove = (ev: PointerEvent) => {
        const deltaX = ev.clientX - startPointerPos.current.x;
        const deltaY = ev.clientY - startPointerPos.current.y;
        const distance = Math.hypot(deltaX, deltaY);

        if (!hasTriggeredDrag.current) {
          if (distance < DRAG_THRESHOLD_PX) return;
          hasTriggeredDrag.current = true;
          draggingIndexRef.current = index;
          dropTargetIndexRef.current = index;
          setDraggingIndex(index);
          setDropTargetIndex(index);
          sound.playCardSnap();
        }

        // Active dragging state
        setDragOffset({ x: deltaX, y: deltaY });

        // Dynamic tilt based on velocity / horizontal movement
        if (!isReducedMotion()) {
          const moveX = ev.clientX - lastClientX;
          const targetTilt = Math.max(-5, Math.min(5, moveX * 0.8 + deltaX * 0.02));
          setTilt(targetTilt);
        }
        lastClientX = ev.clientX;

        // Calculate slot parting target index
        const target = findClosestTargetIndex(ev.clientX, index);
        if (target !== dropTargetIndexRef.current) {
          dropTargetIndexRef.current = target;
          setDropTargetIndex(target);
        }
      };

      const onPointerUp = () => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);

        const from = draggingIndexRef.current;
        const to = dropTargetIndexRef.current;

        if (hasTriggeredDrag.current && from !== null && to !== null) {
          sound.playCardSnap();
          if (from !== to) {
            onReorder?.(from, to);
          }
        } else if (!hasTriggeredDrag.current) {
          // If moved less than threshold, trigger normal tap / click
          onTap?.(index);
        }

        draggingIndexRef.current = null;
        dropTargetIndexRef.current = null;
        setDraggingIndex(null);
        setDropTargetIndex(null);
        setDragOffset({ x: 0, y: 0 });
        setTilt(0);
        hasTriggeredDrag.current = false;
      };

      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    },
    [disabled, itemCount, calculateSlotMetrics, findClosestTargetIndex, onReorder, onTap]
  );

  /**
   * Computes horizontal pixel displacement for neighbor cards (slot parting).
   */
  const getNeighborShiftX = useCallback(
    (cardIndex: number): number => {
      if (draggingIndex === null || dropTargetIndex === null || draggingIndex === cardIndex) {
        return 0;
      }

      const slotStep = slotWidthRef.current;

      // Dragging card to the right
      if (draggingIndex < dropTargetIndex) {
        if (cardIndex > draggingIndex && cardIndex <= dropTargetIndex) {
          return -slotStep; // Shift left
        }
      }
      // Dragging card to the left
      else if (draggingIndex > dropTargetIndex) {
        if (cardIndex < draggingIndex && cardIndex >= dropTargetIndex) {
          return slotStep; // Shift right
        }
      }

      return 0;
    },
    [draggingIndex, dropTargetIndex]
  );

  return {
    registerCardRef,
    handlePointerDown,
    draggingIndex,
    dropTargetIndex,
    dragOffset,
    tilt,
    getNeighborShiftX,
    isDragging: draggingIndex !== null,
  };
}
