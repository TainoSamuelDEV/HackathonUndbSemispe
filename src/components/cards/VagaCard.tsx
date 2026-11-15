import Link from 'next/link';
import { ArrowUpRight, Building2, MapPin } from 'lucide-react';
import type { VagaRecord } from '@/server/infrastructure/repositories/FarolDataStore';

export function VagaCard({ vaga }: { vaga: VagaRecord }) {
  const salarioTexto = vaga.salarioMin
    ? `R$ ${vaga.salarioMin.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
    : 'A combinar';

  return (
    <article className="bg-white border border-[#DCE7EF] rounded-[24px] p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        {/* Banner superior do card */}
        <div className="relative h-36 rounded-[18px] bg-[#F3F8FC] border border-[#E5EFF6] p-3.5 flex flex-col justify-between overflow-hidden mb-4">
          <div className="flex flex-wrap items-center gap-1.5 z-10">
            <span className="px-2.5 py-1 rounded-full bg-white text-[#0B2540] text-[11px] font-bold shadow-xs">
              {vaga.modalidade}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white text-[#0162A7] text-[11px] font-bold shadow-xs">
              {vaga.tipoContratacao}
            </span>
            {vaga.seloSimulado && (
              <span className="px-2.5 py-1 rounded-full bg-[#0B2540] text-[#FADC00] text-[11px] font-bold">
                Exemplo
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0162A7] z-10">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>
              {vaga.bairro}, {vaga.municipio}
            </span>
          </div>

          {/* Detalhe geométrico sutil inspirado no Parque */}
          <div
            aria-hidden="true"
            className="absolute -right-6 -bottom-8 w-28 h-28 rounded-2xl rotate-12 bg-[#009CDC]/15"
          />
          <div
            aria-hidden="true"
            className="absolute right-4 -bottom-10 w-20 h-20 rounded-2xl -rotate-6 bg-[#93C05F]/20"
          />
        </div>

        {/* Título e descrição */}
        <h3 className="font-heading text-lg font-bold text-[#0B2540] leading-snug mb-2">
          {vaga.titulo}
        </h3>

        {/* Chips de requisitos */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="px-2.5 py-1 rounded-full bg-[#EFF7FC] text-[#0162A7] text-[11px] font-semibold">
            #{vaga.area.toLowerCase()}
          </span>
          {vaga.requisitos.slice(0, 2).map((req, idx) => (
            <span
              key={idx}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                req.obrigatorio
                  ? 'bg-[#EAF7F0] text-[#0A7B36]'
                  : 'bg-[#FFF9E6] text-[#8E6416]'
              }`}
            >
              {req.nome}
            </span>
          ))}
        </div>

        {/* Métricas em 2 colunas */}
        <div className="grid grid-cols-2 gap-3 py-3 border-y border-[#F3F8FC] mb-4">
          <div>
            <span className="block text-[11px] text-[#66788A]">Remuneração</span>
            <strong className="text-sm font-bold text-[#0B2540]">{salarioTexto}</strong>
          </div>
          <div>
            <span className="block text-[11px] text-[#66788A]">Oportunidades</span>
            <strong className="text-sm font-bold text-[#0B2540]">
              {vaga.quantidadeVagas} {vaga.quantidadeVagas > 1 ? 'vagas' : 'vaga'}
            </strong>
          </div>
        </div>
      </div>

      {/* Rodapé do card */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5 text-xs text-[#66788A] min-w-0">
          <Building2 className="w-3.5 h-3.5 shrink-0 text-[#0162A7]" />
          <span className="truncate font-medium">{vaga.empresaNome}</span>
        </div>
        <Link
          href={`/vagas/${vaga.id}`}
          className="inline-flex items-center gap-1 shrink-0 px-4 py-2 rounded-full bg-[#0162A7] text-white text-xs font-bold hover:bg-[#004F8A] transition-colors"
        >
          Detalhes
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </article>
  );
}
