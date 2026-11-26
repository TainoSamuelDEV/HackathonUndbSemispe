import Link from 'next/link';
import { ArrowUpRight, Building2, MapPin } from 'lucide-react';
import type { VagaRecord } from '@/server/infrastructure/repositories/FarolDataStore';
import { capaDaVaga } from '@/lib/capaVaga';
import { rotuloContratacao, rotuloModalidade } from '@/lib/rotulosVaga';
import { CapaImagem } from './CapaImagem';

export function VagaCard({ vaga }: { vaga: VagaRecord }) {
  const salarioTexto = vaga.salarioMin
    ? `R$ ${vaga.salarioMin.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
    : 'A combinar';
  const capa = capaDaVaga(vaga);

  return (
    <article className="group relative bg-white border border-[#DCE7EF] rounded-[24px] p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        {/* Banner com a imagem de capa da vaga */}
        <div className="relative isolate aspect-video rounded-[18px] overflow-hidden mb-4 bg-[#0B2540]">
          <CapaImagem
            src={capa.src}
            fallback={capa.fallback}
            className="-z-10"
            imgClassName="group-hover:scale-[1.04]"
          />
          {/* Escurecimento para garantir leitura do texto sobre qualquer foto */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0B2540]/90 via-[#0B2540]/35 to-[#0B2540]/5"
          />

          <div className="absolute inset-0 flex flex-col justify-between p-3.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-full bg-white text-[#0B2540] text-[11px] font-bold shadow-xs">
                {rotuloModalidade(vaga.modalidade)}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white text-[#0162A7] text-[11px] font-bold shadow-xs">
                {rotuloContratacao(vaga.tipoContratacao)}
              </span>
              {vaga.seloSimulado && (
                <span className="px-2.5 py-1 rounded-full bg-[#0B2540] text-[#FADC00] text-[11px] font-bold ring-1 ring-white/20">
                  Exemplo
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-sm font-semibold text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.35)]">
              <MapPin className="w-4 h-4 shrink-0 text-[#FADC00]" />
              <span>
                {vaga.bairro}, {vaga.municipio}
              </span>
            </div>
          </div>
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
        {/* O ::after estende a área clicável do link para o card inteiro */}
        <Link
          href={`/vagas/${vaga.id}`}
          aria-label={`Ver detalhes da vaga ${vaga.titulo}`}
          className="inline-flex items-center gap-1 shrink-0 px-4 py-2 rounded-full bg-[#0162A7] text-white text-xs font-bold hover:bg-[#004F8A] group-hover:bg-[#004F8A] transition-colors after:absolute after:inset-0 after:rounded-[24px]"
        >
          Detalhes
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </article>
  );
}
