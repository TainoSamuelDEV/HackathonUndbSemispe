import { Skeleton } from '@/components/skeletons/Skeleton';
import { VagaCardSkeleton } from '@/components/skeletons/CardSkeletons';

/** Carregamento da página inicial, com as mesmas dimensões da hero e das seções. */
export default function CarregandoInicio() {
  return (
    <div role="status" aria-label="Carregando página inicial" className="bg-white">
      {/* HERO — mesma compensação do header flutuante e mesma altura da mídia */}
      <section className="relative bg-white -mt-[72px] sm:-mt-[76px]">
        <div className="relative h-[340px] sm:h-[480px] lg:h-[620px]">
          <Skeleton className="mascara-onda-hero absolute inset-0" />
        </div>

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 -mt-2 sm:-mt-20 lg:-mt-40 pb-12 sm:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-9 lg:gap-6 items-end">
            <div className="lg:col-span-7">
              <Skeleton className="h-9 sm:h-12 lg:h-[60px] w-11/12 rounded-2xl" />
              <Skeleton className="h-9 sm:h-12 lg:h-[60px] w-1/2 rounded-2xl mt-3" />
              <Skeleton className="h-5 w-3/4 max-w-[480px] rounded-full mt-5" />
              <div className="mt-7 flex flex-col sm:flex-row gap-3 max-w-[620px]">
                <Skeleton className="h-[54px] flex-1 rounded-full" />
                <Skeleton className="h-[54px] w-full sm:w-44 rounded-full" />
              </div>
              <Skeleton className="h-4 w-52 rounded-full mt-5" />
            </div>
            <div className="lg:col-span-5 grid grid-cols-3 gap-3 sm:gap-6 border-t border-[#DCE7EF] pt-6 lg:border-t-0 lg:pt-0 lg:pb-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center lg:justify-end">
                  <Skeleton className="h-8 lg:h-10 w-10 rounded-lg" />
                  <Skeleton className="h-6 w-16 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CAMINHOS */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-10 sm:pb-16">
        <div className="bg-[#0162A7] rounded-[24px] sm:rounded-[32px] p-5 sm:p-10 lg:p-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 mb-7 sm:mb-10">
            <div className="space-y-2.5">
              <div className="h-7 sm:h-9 w-48 sm:w-64 rounded-xl bg-white/15 animate-pulse" />
              <div className="h-7 sm:h-9 w-56 sm:w-80 rounded-xl bg-white/15 animate-pulse" />
            </div>
            <div className="h-4 w-full max-w-md rounded-full bg-white/15 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-[20px] sm:rounded-[22px] p-5 min-h-[165px] sm:min-h-[210px] space-y-3">
                <Skeleton className="w-10 h-10 rounded-2xl" />
                <Skeleton className="h-5 w-3/4 rounded-full" />
                <Skeleton className="h-3 w-full rounded-full" />
                <Skeleton className="h-3 w-2/3 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VAGAS E CURSOS */}
      {['vagas', 'cursos'].map((secao) => (
        <section key={secao} className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-16">
          <div className="flex items-center justify-between gap-4 mb-8">
            <Skeleton className="h-9 w-40 rounded-xl" />
            <Skeleton className="h-9 w-36 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <VagaCardSkeleton key={i} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
