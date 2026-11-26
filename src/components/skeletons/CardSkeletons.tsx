/**
 * Skeletons de carregamento (vagas e cursos).
 * Reproduzem a estrutura real (card e página de detalhe) para evitar saltos de layout.
 */

function Bloco({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse bg-[#E5EEF5] ${className}`} />;
}

export function VagaCardSkeleton() {
  return (
    <div className="bg-white border border-[#DCE7EF] rounded-[24px] p-4 flex flex-col justify-between">
      <div>
        <Bloco className="aspect-video rounded-[18px] mb-4" />
        <Bloco className="h-5 w-4/5 rounded-full mb-3" />
        <div className="flex flex-wrap gap-1.5 mb-4">
          <Bloco className="h-6 w-28 rounded-full" />
          <Bloco className="h-6 w-32 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-3 py-3 border-y border-[#F3F8FC] mb-4">
          <div className="space-y-2">
            <Bloco className="h-3 w-20 rounded-full" />
            <Bloco className="h-4 w-16 rounded-full" />
          </div>
          <div className="space-y-2">
            <Bloco className="h-3 w-24 rounded-full" />
            <Bloco className="h-4 w-14 rounded-full" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 pt-1">
        <Bloco className="h-4 w-36 rounded-full" />
        <Bloco className="h-8 w-24 rounded-full" />
      </div>
    </div>
  );
}

export function VagaGridSkeleton({ quantidade = 6 }: { quantidade?: number }) {
  return (
    <div
      role="status"
      aria-label="Carregando vagas"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {Array.from({ length: quantidade }, (_, i) => (
        <VagaCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Grade de cursos: o card de curso tem a mesma estrutura do card de vaga. */
export function CursoGridSkeleton({ quantidade = 3 }: { quantidade?: number }) {
  return (
    <div role="status" aria-label="Carregando cursos" className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: quantidade }, (_, i) => (
        <VagaCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function VagaDetalheSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando detalhes da vaga"
      className="max-w-[900px] mx-auto px-4 sm:px-6 py-10 space-y-6"
    >
      <Bloco className="h-5 w-40 rounded-full" />

      <div className="border border-[#DCE7EF] rounded-[16px] p-6 sm:p-8 bg-white space-y-4 overflow-hidden">
        <Bloco className="-mx-6 -mt-6 sm:-mx-8 sm:-mt-8 aspect-video" />

        <Bloco className="h-9 w-3/4 rounded-full" />
        <Bloco className="h-4 w-1/2 rounded-full" />

        <div className="space-y-2.5 pt-2">
          <Bloco className="h-4 w-full rounded-full" />
          <Bloco className="h-4 w-11/12 rounded-full" />
          <Bloco className="h-4 w-2/3 rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#DCE7EF]">
          {[0, 1].map((col) => (
            <div key={col} className="space-y-2.5">
              <Bloco className="h-4 w-48 rounded-full" />
              <Bloco className="h-3.5 w-40 rounded-full" />
              <Bloco className="h-3.5 w-32 rounded-full" />
            </div>
          ))}
        </div>

        <div className="pt-4">
          <Bloco className="h-[45px] w-56 rounded-[12px]" />
        </div>
      </div>
    </div>
  );
}
