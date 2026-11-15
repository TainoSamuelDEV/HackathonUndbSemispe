import Link from 'next/link';
import { farolService } from '@/server/application/FarolService';
import { VagaCard } from '@/components/cards/VagaCard';
import type { ModalidadeTrabalho } from '@/types/farol';

export const dynamic = 'force-dynamic';

export default async function VagasPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; bairro?: string; modalidade?: string }>;
}) {
  const sp = await searchParams;
  const vagas = await farolService.listarVagasPublicas({
    busca: sp.busca,
    bairro: sp.bairro,
    modalidade: (sp.modalidade as ModalidadeTrabalho) || undefined,
  });

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

      <form
        method="GET"
        className="bg-[#F3F8FC] border border-[#DCE7EF] rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-4 mb-6 sm:mb-8 grid grid-cols-1 md:grid-cols-4 gap-2.5 sm:gap-3"
      >
        <input
          name="busca"
          defaultValue={sp.busca ?? ''}
          placeholder="Cargo, área ou competência"
          className="min-h-[44px] bg-white border border-[#DCE7EF] rounded-[12px] sm:rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-[#0162A7]"
        />
        <input
          name="bairro"
          defaultValue={sp.bairro ?? ''}
          placeholder="Bairro (ex: Itaqui-Bacanga)"
          className="min-h-[44px] bg-white border border-[#DCE7EF] rounded-[12px] sm:rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-[#0162A7]"
        />
        <select
          name="modalidade"
          defaultValue={sp.modalidade ?? ''}
          className="min-h-[44px] bg-white border border-[#DCE7EF] rounded-[12px] sm:rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-[#0162A7]"
        >
          <option value="">Todas as modalidades</option>
          <option value="PRESENCIAL">Presencial</option>
          <option value="HIBRIDO">Híbrido</option>
          <option value="REMOTO">Remoto</option>
        </select>
        <button
          type="submit"
          className="min-h-[44px] rounded-[12px] sm:rounded-full bg-[#0162A7] text-white font-bold text-sm hover:bg-[#004F8A] transition-colors"
        >
          Filtrar vagas
        </button>
      </form>

      {vagas.length === 0 ? (
        <div className="border border-[#DCE7EF] rounded-[24px] p-10 text-center">
          <p className="font-heading font-bold text-lg text-[#0B2540]">
            Nenhuma vaga encontrada com esses filtros.
          </p>
          <Link
            href="/vagas"
            className="inline-block mt-4 text-sm font-bold text-[#0162A7] hover:underline"
          >
            Limpar filtros
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vagas.map((vaga) => (
            <VagaCard key={vaga.id} vaga={vaga} />
          ))}
        </div>
      )}
    </div>
  );
}
