import { useState, useCallback } from 'react';
import { isReducedMotion } from '../utils/motion';

export interface CardFanStyle {
  transform?: string;
  transformOrigin?: string;
  zIndex?: number;
}

/**
 * Pure calculation for parabolic hand fan transforms (Blitz-TCG arc mathematical formulation).
 * Cards fan out symmetrically across an ergonomic downward arc with dynamic pivot and z-index elevation.
 */
export function calculateCardFan(
  index: number,
  total: number,
  isHovered: boolean,
  isDragging: boolean,
  reducedMotion = false
): CardFanStyle {
  // If only 1 card, or reduced motion is active, or currently dragging, keep standard flat layout
  if (total <= 1 || isDragging) {
    return {
      transformOrigin: 'bottom center',
      zIndex: isDragging ? 50 : isHovered ? 40 : 10 + index,
    };
  }

  if (reducedMotion) {
    return {
      transform: isHovered ? 'translate3d(0, -18px, 0)' : undefined,
      transformOrigin: 'bottom center',
      zIndex: isHovered ? 40 : 10 + index,
    };
  }

  const mid = (total - 1) / 2;
  const offset = index - mid; // negative on left, 0 in center, positive on right

  // 1. Angular Fan: spreads symmetrically (clamped to max ±7deg)
  const maxAngle = Math.min(6.5, 24 / total);
  const rotation = isHovered ? 0 : offset * maxAngle;

  // 2. Parabolic Sag: cards toward the edges dip gently downward (y >= 0),
  // ensuring the arc moves away from the container's top boundary
  const sagFactor = Math.min(4.5, 18 / total);
  const sagY = isHovered ? -20 : Math.pow(Math.abs(offset), 1.8) * sagFactor;

  // 3. Dynamic horizontal overlap for large hands (6+ cards)
  const overlapX = total > 5 ? offset * -6 : 0;

  return {
    transform: `translate3d(${overlapX}px, ${sagY}px, 0) rotate(${rotation}deg)`,
    transformOrigin: '50% 120%', // Pivots like a real physical hand fan from below the card
    zIndex: isHovered ? 40 : 10 + index,
  };
}

/**
 * React hook managing card fan styling and hover state tracking for HandTray.
 */
export function useCardFan(totalCards: number) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const getCardFanStyle = useCallback(
    (index: number, isDragging: boolean): CardFanStyle => {
      const isHovered = hoveredIndex === index && !isDragging;
      return calculateCardFan(index, totalCards, isHovered, isDragging, isReducedMotion());
    },
    [hoveredIndex, totalCards]
  );

  return {
    hoveredIndex,
    setHoveredIndex,
    getCardFanStyle,
  };
}
