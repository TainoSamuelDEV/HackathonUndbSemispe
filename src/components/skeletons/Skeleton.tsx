/** Bloco base de carregamento. Defina tamanho e arredondamento via `className`. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse bg-[#E5EEF5] ${className}`} />;
}

/** Linhas de texto em carregamento, com a última mais curta. */
export function SkeletonTexto({ linhas = 3, className = '' }: { linhas?: number; className?: string }) {
  return (
    <div aria-hidden="true" className={`space-y-2 ${className}`}>
      {Array.from({ length: linhas }, (_, i) => (
        <Skeleton key={i} className={`h-3.5 rounded-full ${i === linhas - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}
