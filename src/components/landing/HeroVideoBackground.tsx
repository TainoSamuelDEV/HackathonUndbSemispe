'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Vídeo de fundo do hero com imagem poster exibida instantaneamente no primeiro paint
 * e transição suave (crossfade) assim que o vídeo inicia a reprodução.
 */
export function HeroVideoBackground() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [reproduzindo, setReproduzindo] = useState(false);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    if (video.readyState >= 3 && !video.paused) {
      setReproduzindo(true);
      return;
    }

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        // Autoplay bloqueado: mantém a foto poster visível sem erro
      });
    }
  }, []);

  return (
    <>
      <img
        src="/videos/hero-farol-poster.jpg"
        alt=""
        fetchPriority="high"
        loading="eager"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-[center_35%]"
      />
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/videos/hero-farol-poster.jpg"
        onPlaying={() => setReproduzindo(true)}
        className={`absolute inset-0 h-full w-full object-cover object-[center_35%] transition-opacity duration-500 ${
          reproduzindo ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <source src="/videos/hero-farol.mp4?v=2" type="video/mp4" />
      </video>
    </>
  );
}
