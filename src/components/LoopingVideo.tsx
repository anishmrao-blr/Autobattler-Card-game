import React, { useState, useRef, useEffect, useCallback } from 'react';
import { isReducedMotion } from '../utils/motion';

export interface LoopingVideoProps {
  src?: string;
  poster?: string;
  className?: string;
  crossfadeMs?: number;
  onError?: (e: React.SyntheticEvent<HTMLVideoElement, Event>) => void;
  onLoadedData?: (e: React.SyntheticEvent<HTMLVideoElement, Event>) => void;
  'aria-hidden'?: boolean | 'true' | 'false';
  draggable?: boolean;
}

/**
 * AAA Studio-Grade Looping Video with Phase-Offset Dual-Element Crossfade.
 * Masks visible loop boundary seams on ambient clips by dissolving between two
 * phase-offset video elements right at the loop point.
 * Falls back to plain looping video when prefers-reduced-motion is active.
 */
export const LoopingVideo: React.FC<LoopingVideoProps> = ({
  src,
  poster,
  className = '',
  crossfadeMs = 600,
  onError,
  onLoadedData,
  'aria-hidden': ariaHidden,
  draggable = false,
}) => {
  const reducedMotion = isReducedMotion();

  const videoRefA = useRef<HTMLVideoElement | null>(null);
  const videoRefB = useRef<HTMLVideoElement | null>(null);

  const [activeSlot, setActiveSlot] = useState<'A' | 'B'>('A');
  const [duration, setDuration] = useState<number>(0);
  const isCrossfadingRef = useRef<boolean>(false);
  const crossfadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // If prefers-reduced-motion is active, skip dual-element crossfade machinery
  if (reducedMotion) {
    return (
      <video
        src={src}
        poster={poster}
        autoPlay
        loop
        muted
        playsInline
        draggable={draggable}
        aria-hidden={ariaHidden}
        className={className}
        onError={onError}
        onLoadedData={onLoadedData}
      />
    );
  }

  // Cleanup timers & playback on unmount or src change
  useEffect(() => {
    return () => {
      if (crossfadeTimerRef.current) {
        clearTimeout(crossfadeTimerRef.current);
      }
      if (videoRefA.current) {
        videoRefA.current.pause();
      }
      if (videoRefB.current) {
        videoRefB.current.pause();
      }
    };
  }, [src]);

  // Reset state when src changes
  useEffect(() => {
    setActiveSlot('A');
    isCrossfadingRef.current = false;
    setDuration(0);
    if (crossfadeTimerRef.current) {
      clearTimeout(crossfadeTimerRef.current);
    }
    if (videoRefA.current) {
      videoRefA.current.currentTime = 0;
      videoRefA.current.play().catch(() => {});
    }
    if (videoRefB.current) {
      videoRefB.current.pause();
      videoRefB.current.currentTime = 0;
    }
  }, [src]);

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    if (video.duration && isFinite(video.duration) && video.duration > 0) {
      setDuration(video.duration);
    }
  };

  const startCrossfade = useCallback(
    (fromSlot: 'A' | 'B') => {
      if (isCrossfadingRef.current) return;
      isCrossfadingRef.current = true;

      const toSlot = fromSlot === 'A' ? 'B' : 'A';
      const toVideo = toSlot === 'A' ? videoRefA.current : videoRefB.current;
      const fromVideo = fromSlot === 'A' ? videoRefA.current : videoRefB.current;

      if (toVideo) {
        toVideo.currentTime = 0;
        toVideo.play().catch(() => {});
      }

      setActiveSlot(toSlot);

      if (crossfadeTimerRef.current) {
        clearTimeout(crossfadeTimerRef.current);
      }

      crossfadeTimerRef.current = setTimeout(() => {
        if (fromVideo) {
          fromVideo.pause();
          fromVideo.currentTime = 0;
        }
        isCrossfadingRef.current = false;
      }, crossfadeMs);
    },
    [crossfadeMs]
  );

  const handleTimeUpdate = (
    e: React.SyntheticEvent<HTMLVideoElement, Event>,
    slot: 'A' | 'B'
  ) => {
    if (slot !== activeSlot || isCrossfadingRef.current) return;

    const video = e.currentTarget;
    const dur = duration || video.duration;
    if (!dur || !isFinite(dur) || dur <= 0) return;

    const crossfadeSec = Math.min(crossfadeMs / 1000, dur / 3);
    if (video.currentTime >= dur - crossfadeSec) {
      startCrossfade(slot);
    }
  };

  const handleEnded = (slot: 'A' | 'B') => {
    if (slot === activeSlot) {
      startCrossfade(slot);
    }
  };

  const transitionStyle: React.CSSProperties = {
    transition: `opacity ${crossfadeMs}ms linear`,
  };

  if (!src) return null;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <video
        ref={videoRefA}
        src={src}
        poster={poster}
        autoPlay
        muted
        playsInline
        draggable={draggable}
        aria-hidden={ariaHidden}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={(e) => handleTimeUpdate(e, 'A')}
        onEnded={() => handleEnded('A')}
        onError={onError}
        onLoadedData={onLoadedData}
        style={{
          ...transitionStyle,
          opacity: activeSlot === 'A' ? 1 : 0,
        }}
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
      />
      <video
        ref={videoRefB}
        src={src}
        muted
        playsInline
        draggable={draggable}
        aria-hidden="true"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={(e) => handleTimeUpdate(e, 'B')}
        onEnded={() => handleEnded('B')}
        onError={onError}
        style={{
          ...transitionStyle,
          opacity: activeSlot === 'B' ? 1 : 0,
        }}
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
      />
    </div>
  );
};
