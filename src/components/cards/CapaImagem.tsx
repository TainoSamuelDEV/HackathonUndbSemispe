'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Imagem de capa (vagas e cursos).
 * - Mostra um skeleton até a imagem terminar de carregar (com fade-in suave).
 * - Troca automaticamente para a imagem padrão da área se a URL informada não carregar.
 *
 * Ocupa todo o container pai (que deve ser `relative`).
 */
export function CapaImagem({
  src,
  fallback,
  className = '',
  imgClassName = '',
  prioridade = false,
}: {
  src: string;
  fallback: string;
  /** Classes extras do wrapper (ex.: -z-10). */
  className?: string;
  /** Classes extras da <img> (ex.: zoom no hover do card). */
  imgClassName?: string;
  /** true para imagens acima da dobra (ex.: topo do detalhe da vaga). */
  prioridade?: boolean;
}) {
  const [atual, setAtual] = useState(src);
  const [carregada, setCarregada] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setAtual(src);
  }, [src]);

  // A imagem pode terminar (ou falhar) antes da hidratação, quando onLoad/onError não disparam.
  useEffect(() => {
    setCarregada(false);
    const img = imgRef.current;
    if (!img || !img.complete) return;
    if (img.naturalWidth > 0) setCarregada(true);
    else if (atual !== fallback) setAtual(fallback);
  }, [atual, fallback]);

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {!carregada && <div aria-hidden="true" className="absolute inset-0 animate-pulse bg-[#DCE7EF]" />}
      <img
        ref={imgRef}
        src={atual}
        alt=""
        aria-hidden="true"
        loading={prioridade ? 'eager' : 'lazy'}
        fetchPriority={prioridade ? 'high' : 'auto'}
        decoding="async"
        onLoad={() => setCarregada(true)}
        onError={() => {
          if (atual !== fallback) setAtual(fallback);
        }}
        className={`h-full w-full object-cover transition-[opacity,transform] duration-500 ease-out ${
          carregada ? 'opacity-100' : 'opacity-0'
        } ${imgClassName}`}
      />
    </div>
  );
}
