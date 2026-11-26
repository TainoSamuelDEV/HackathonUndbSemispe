/**
 * Skeletons das áreas logadas (candidato, empresa e SEMISPE).
 * Reproduzem a estrutura real de cada painel para evitar saltos de layout.
 */

import { Skeleton, SkeletonTexto } from './Skeleton';

function CabecalhoPainelSkeleton({ comBotao = false }: { comBotao?: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="space-y-2.5">
        <Skeleton className="h-3 w-32 rounded-full" />
        <Skeleton className="h-8 w-64 max-w-full rounded-xl" />
        <Skeleton className="h-4 w-80 max-w-full rounded-full" />
      </div>
      {comBotao && <Skeleton className="h-11 w-56 rounded-[12px]" />}
    </div>
  );
}

/** Linhas de lista no formato dos itens dos painéis (borda, título, subtítulo e selo à direita). */
export function ListaPainelSkeleton({ quantidade = 3 }: { quantidade?: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: quantidade }, (_, i) => (
        <div
          key={i}
          className="border border-[#DCE7EF] rounded-[12px] p-4 flex items-center justify-between gap-4"
        >
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2 rounded-full" />
            <Skeleton className="h-3 w-1/3 rounded-full" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function PainelCandidatoSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando seu painel"
      className="max-w-[1000px] mx-auto px-4 sm:px-6 py-10 space-y-8"
    >
      <CabecalhoPainelSkeleton comBotao />
      <div className="border border-[#DCE7EF] rounded-[16px] p-6 bg-white space-y-4">
        <Skeleton className="h-6 w-72 max-w-full rounded-xl" />
        <SkeletonTexto linhas={2} />
        <Skeleton className="h-3 w-56 rounded-full" />
        <Skeleton className="h-11 w-full rounded-[12px]" />
        <Skeleton className="h-[42px] w-40 rounded-[12px]" />
      </div>
      <div className="border border-[#DCE7EF] rounded-[16px] p-6 bg-white space-y-4">
        <Skeleton className="h-6 w-52 rounded-xl" />
        <ListaPainelSkeleton quantidade={2} />
      </div>
    </div>
  );
}

export function PainelAdminSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando painel SEMISPE"
      className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10 space-y-8"
    >
      <CabecalhoPainelSkeleton />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="border border-[#DCE7EF] rounded-[16px] p-5 bg-white space-y-3">
            <Skeleton className="h-3 w-24 rounded-full" />
            <Skeleton className="h-8 w-14 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="border border-[#DCE7EF] rounded-[16px] p-4 sm:p-6 bg-white space-y-4">
        <Skeleton className="h-6 w-96 max-w-full rounded-xl" />
        <ListaPainelSkeleton quantidade={3} />
      </div>
    </div>
  );
}
