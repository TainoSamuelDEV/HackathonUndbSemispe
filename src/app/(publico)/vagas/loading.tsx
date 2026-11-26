import { VagaGridSkeleton } from '@/components/skeletons/CardSkeletons';

export default function CarregandoVagas() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-6 sm:mb-8">
        <span className="text-xs font-extrabold uppercase tracking-wider text-[#0162A7]">
          Catálogo Público
        </span>
        <h1 className="font-heading text-2xl sm:text-4xl font-extrabold text-[#0B2540] mt-1">
          Vagas de emprego e oportunidades
        </h1>
        <p className="text-sm text-[#66788A] mt-2">
          Faça login como candidato para visualizar seu score de compatibilidade técnico em cada vaga.
        </p>
      </div>

      <div
        aria-hidden="true"
        className="bg-[#F3F8FC] border border-[#DCE7EF] rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-4 mb-6 sm:mb-8 grid grid-cols-1 md:grid-cols-4 gap-2.5 sm:gap-3"
      >
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[44px] rounded-[12px] sm:rounded-full bg-white border border-[#DCE7EF]" />
        ))}
      </div>

      <VagaGridSkeleton />
    </div>
  );
}
