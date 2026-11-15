import Link from 'next/link';
import { farolService } from '@/server/application/FarolService';
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
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <span className="text-xs font-extrabold uppercase tracking-wider text-[#0162A7]">
          Catálogo Público
        </span>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#0B2540] mt-1">
          Vagas de emprego e oportunidades
        </h1>
        <p className="text-sm text-[#66788A] mt-2">
          Faça login como candidato para visualizar seu score de compatibilidade técnico em cada vaga.
        </p>
      </div>

      <form
        method="GET"
        className="bg-[#F3F8FC] border border-[#DCE7EF] rounded-[16px] p-4 mb-8 grid grid-cols-1 md:grid-cols-4 gap-3"
      >
        <input
          name="busca"
          defaultValue={sp.busca ?? ''}
          placeholder="Cargo, área ou competência"
          className="bg-white border border-[#DCE7EF] rounded-[12px] px-3.5 py-2.5 text-sm"
        />
        <input
          name="bairro"
          defaultValue={sp.bairro ?? ''}
          placeholder="Bairro (ex: Itaqui-Bacanga)"
          className="bg-white border border-[#DCE7EF] rounded-[12px] px-3.5 py-2.5 text-sm"
        />
        <select
          name="modalidade"
          defaultValue={sp.modalidade ?? ''}
          className="bg-white border border-[#DCE7EF] rounded-[12px] px-3.5 py-2.5 text-sm"
        >
          <option value="">Todas as modalidades</option>
          <option value="PRESENCIAL">Presencial</option>
          <option value="HIBRIDO">Híbrido</option>
          <option value="REMOTO">Remoto</option>
        </select>
        <button
          type="submit"
          className="min-h-[44px] rounded-[12px] bg-[#0162A7] text-white font-bold text-sm hover:bg-[#004F8A]"
        >
          Filtrar vagas
        </button>
      </form>

      {vagas.length === 0 ? (
        <div className="border border-[#DCE7EF] rounded-[16px] p-10 text-center">
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
            <div key={vaga.id} className="border border-[#DCE7EF] rounded-[16px] p-6 bg-white flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#EFF7FC] text-[#0162A7]">
                    {vaga.modalidade} · {vaga.quantidadeVagas} {vaga.quantidadeVagas > 1 ? 'vagas' : 'vaga'}
                  </span>
                  {vaga.seloSimulado && (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FFF9E6] text-[#8E6416] border border-[#F0E3BF]">
                      Exemplo / Simulado
                    </span>
                  )}
                </div>
                <h2 className="font-heading text-xl font-bold text-[#0B2540] mb-1">
                  {vaga.titulo}
                </h2>
                <p className="text-xs font-semibold text-[#66788A] mb-3">
                  {vaga.empresaNome} · {vaga.bairro}, {vaga.municipio} – MA
                </p>
                <p className="text-sm text-[#66788A] mb-4">{vaga.descricao}</p>
                <p className="text-xs font-bold text-[#0B2540] mb-4">
                  Salário:{' '}
                  {vaga.salarioMin
                    ? `R$ ${vaga.salarioMin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : 'Não informado'}
                </p>
              </div>
              <Link
                href={`/vagas/${vaga.id}`}
                className="inline-flex items-center justify-center min-h-[44px] rounded-[12px] bg-[#0162A7] text-white text-sm font-bold hover:bg-[#004F8A]"
              >
                Ver detalhes e compatibilidade
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
