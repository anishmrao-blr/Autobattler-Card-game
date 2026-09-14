import { useState, useRef, useCallback } from 'react';
import { sound } from '../audio/sound';
import { isReducedMotion } from '../utils/motion';

export interface UseCardReorderOptions {
  itemCount: number;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  onTap?: (index: number) => void;
  disabled?: boolean;
  resolveCurrentIndex?: (id: string | number) => number;
}

export interface DragPosition {
  x: number;
  y: number;
}

/**
 * Calculates drop target index using directional steps based on commit fraction of slot pitch.
 * commitFraction = 0.38 means an adjacent slot commits at ~38% of pitch distance (~71px for 188px pitch),
 * significantly earlier than nearest-center (50% / 94px).
 */
export function resolveTargetIndex(
  pointerDeltaX: number,
  originIndex: number,
  itemCount: number,
  slotPitch: number,
  commitFraction = 0.38
): number {
  if (slotPitch <= 0 || itemCount <= 0) return originIndex;
  const rawSteps = pointerDeltaX / slotPitch;
  const steps = Math.sign(rawSteps) * Math.floor(Math.abs(rawSteps) + (1 - commitFraction));
  const target = originIndex + steps;
  return Math.max(0, Math.min(itemCount - 1, target));
}

export function useCardReorder({
  itemCount,
  onReorder,
  onTap,
  disabled = false,
  resolveCurrentIndex,
}: UseCardReorderOptions) {
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<DragPosition>({ x: 0, y: 0 });
  const [tilt, setTilt] = useState(0);

  // Ref mirrors for window event listener closures
  const draggingIdRef = useRef<string | number | null>(null);
  const draggingIndexRef = useRef<number | null>(null);
  const dropTargetIndexRef = useRef<number | null>(null);
  const startPointerPos = useRef<DragPosition>({ x: 0, y: 0 });
  const cardOriginRect = useRef<DOMRect | null>(null);
  const slotCentersRef = useRef<number[]>([]);
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
    const centers: number[] = [];
    for (let i = 0; i < itemCount; i++) {
      const el = cardRefs.current.get(i);
      if (el) {
        const r = el.getBoundingClientRect();
        rects.push(r);
        centers.push(r.left + r.width / 2);
      }
    }
    slotCentersRef.current = centers;
    if (rects.length > 1) {
      // Distance between adjacent card centers/lefts
      slotWidthRef.current = Math.abs(rects[1].left - rects[0].left);
    } else if (rects.length === 1) {
      slotWidthRef.current = rects[0].width + 12;
    }
    return rects;
  }, [itemCount]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, index: number, stableId?: string | number) => {
      if (disabled || e.button > 0 || itemCount <= 1) return;

      const resolvedStart =
        stableId !== undefined && resolveCurrentIndex
          ? resolveCurrentIndex(stableId)
          : -1;
      const startIndex = resolvedStart !== -1 ? resolvedStart : index;

      const originX = e.clientX;
      const originY = e.clientY;
      startPointerPos.current = { x: originX, y: originY };
      hasTriggeredDrag.current = false;
      draggingIdRef.current = stableId !== undefined ? stableId : index;
      draggingIndexRef.current = startIndex;

      const targetEl = e.currentTarget as HTMLElement | null;

      const cardEl = cardRefs.current.get(startIndex);
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

          const currentOrigin =
            draggingIdRef.current !== null && resolveCurrentIndex
              ? resolveCurrentIndex(draggingIdRef.current)
              : draggingIndexRef.current;
          const origin = currentOrigin !== -1 ? currentOrigin : startIndex;

          draggingIndexRef.current = origin;
          dropTargetIndexRef.current = origin;
          setDraggingIndex(origin);
          setDropTargetIndex(origin);
          sound.playCardSnap();

          if (targetEl && typeof targetEl.setPointerCapture === 'function') {
            try {
              targetEl.setPointerCapture(ev.pointerId);
            } catch {
              // Ignore
            }
          }
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

        // Calculate slot parting target index using resolveTargetIndex
        const origin = draggingIndexRef.current ?? startIndex;
        const target = resolveTargetIndex(
          deltaX,
          origin,
          itemCount,
          slotWidthRef.current,
          0.38
        );

        if (target !== dropTargetIndexRef.current) {
          dropTargetIndexRef.current = target;
          setDropTargetIndex(target);
        }
      };

      const onPointerUp = (ev: PointerEvent) => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);

        if (hasTriggeredDrag.current && targetEl && typeof targetEl.releasePointerCapture === 'function') {
          try {
            targetEl.releasePointerCapture(ev.pointerId);
          } catch {
            // Ignore
          }
        }

        // Resolve fresh origin index by stable id if available
        let from = draggingIndexRef.current;
        if (draggingIdRef.current !== null && resolveCurrentIndex) {
          const freshFrom = resolveCurrentIndex(draggingIdRef.current);
          if (freshFrom !== -1) {
            from = freshFrom;
          }
        }
        const to = dropTargetIndexRef.current;

        if (hasTriggeredDrag.current && from !== null && to !== null) {
          sound.playCardSnap();
          if (from !== to) {
            onReorder?.(from, to);
          }
        } else if (!hasTriggeredDrag.current) {
          // If moved less than threshold, trigger normal tap / click
          const tapIdx = from !== null ? from : startIndex;
          onTap?.(tapIdx);
        }

        draggingIdRef.current = null;
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
    [disabled, itemCount, calculateSlotMetrics, resolveCurrentIndex, onReorder, onTap]
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
