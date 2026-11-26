import { Skeleton } from '@/components/skeletons/Skeleton';
import { FormularioBoletim } from './FormularioBoletim';

/** Cabeçalho da página, compartilhado entre a página e o estado de carregamento. */
export function CabecalhoEditaisEventos() {
  return (
    <header>
      <span className="text-xs font-extrabold uppercase tracking-wider text-[#0162A7]">Ecossistema de São Luís</span>
      <h1 className="font-heading text-[28px] sm:text-4xl font-extrabold text-[#0B2540] mt-1">Editais e eventos</h1>
      <p className="text-sm sm:text-base text-[#66788A] mt-2 max-w-[640px] leading-relaxed">
        Chamadas de fomento, programas para startups e encontros de tecnologia e qualificação em São Luís,
        reunidos em um só lugar.
      </p>
    </header>
  );
}

export function SecaoBoletim() {
  return (
    <section
      aria-labelledby="titulo-boletim"
      className="bg-[#0162A7] rounded-[24px] sm:rounded-[32px] p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 lg:items-center"
    >
      <div>
        <h2 id="titulo-boletim" className="font-heading text-2xl sm:text-3xl font-extrabold text-white leading-tight">
          Receba novos editais e eventos
        </h2>
        <p className="mt-3 text-sm sm:text-base text-[#CAE8FB] leading-relaxed max-w-[460px]">
          Cadastre seu e-mail ou WhatsApp para entrar na lista do boletim do FAROL, com novas chamadas, programas e
          eventos do ecossistema de São Luís.
        </p>
      </div>
      <FormularioBoletim />
    </section>
  );
}

function CardSkeleton({ comData = false }: { comData?: boolean }) {
  return (
    <div className="bg-white border border-[#DCE7EF] rounded-[24px] p-5 sm:p-6 flex gap-4 sm:gap-5">
      {comData && <Skeleton className="w-16 sm:w-[72px] h-[88px] shrink-0 rounded-[18px]" />}
      <div className="flex-1 space-y-3">
        <Skeleton className="h-4 w-1/3 rounded-full" />
        <Skeleton className="h-5 w-4/5 rounded-full" />
        <Skeleton className="h-3.5 w-full rounded-full" />
        <Skeleton className="h-3.5 w-2/3 rounded-full" />
        <div className="pt-3 flex gap-2">
          <Skeleton className="h-10 w-40 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** Estado de carregamento com a mesma estrutura da página. */
export function EditaisEventosSkeleton() {
  return (
    <div role="status" aria-label="Carregando editais e eventos" className="space-y-12 sm:space-y-16">
      <div className="bg-[#F3F8FC] border border-[#DCE7EF] rounded-[20px] sm:rounded-[24px] p-3 sm:p-4 flex flex-col md:flex-row gap-3">
        <Skeleton className="h-12 w-full md:w-72 rounded-full" />
        <Skeleton className="h-12 w-full md:w-96 md:ml-auto rounded-full" />
      </div>
      {[false, true].map((comData) => (
        <div key={String(comData)}>
          <Skeleton className="h-8 w-64 rounded-full mb-6" />
          <div className={`grid grid-cols-1 gap-6 ${comData ? 'lg:grid-cols-2' : 'md:grid-cols-2'}`}>
            <CardSkeleton comData={comData} />
            <CardSkeleton comData={comData} />
          </div>
        </div>
      ))}
    </div>
  );
}
