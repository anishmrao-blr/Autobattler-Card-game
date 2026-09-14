import React, { useState } from 'react';
import { LoopingVideo } from './LoopingVideo';

interface CardMediaArtProps {
  artUrl: string;
  videoUrl?: string;
  alt: string;
  className?: string;
  hoverZoom?: boolean;
}

/**
 * AAA-Grade Card Media component with Zero-Regression Video & Static Poster fallback.
 * Automatically attempts video playback if videoUrl is present,
 * gracefully falling back to the high-res static illustration on error or stall.
 */
export const CardMediaArt: React.FC<CardMediaArtProps> = ({
  artUrl,
  videoUrl,
  alt,
  className = 'w-full h-full object-cover object-center',
  hoverZoom = false,
}) => {
  const [videoFailed, setVideoFailed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const zoomClass = hoverZoom
    ? 'transform transition-transform duration-300 group-hover:scale-110'
    : '';

  return (
    <div className="relative w-full h-full overflow-hidden bg-black/80 flex items-center justify-center">
      {videoUrl && !videoFailed ? (
        <LoopingVideo
          src={videoUrl}
          poster={artUrl}
          draggable={false}
          onError={() => setVideoFailed(true)}
          className={`${className} ${zoomClass} transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-90'
          }`}
          onLoadedData={() => setIsLoaded(true)}
        />
      ) : (
        <img
          src={artUrl}
          alt={alt}
          loading="lazy"
          draggable={false}
          className={`${className} ${zoomClass}`}
          onError={(e) => {
            // Absolute emergency fallback if a specific card art path fails
            const target = e.currentTarget;
            if (target.src !== '/assets/art/hero_chronos.jpg') {
              target.src = '/assets/art/hero_chronos.jpg';
            }
          }}
        />
      )}
    </div>
  );
};
