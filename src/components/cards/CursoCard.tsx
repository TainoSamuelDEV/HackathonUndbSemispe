import Link from 'next/link';
import { ArrowUpRight, GraduationCap } from 'lucide-react';
import type { CursoRecord } from '@/server/infrastructure/repositories/FarolDataStore';

export function CursoCard({ curso }: { curso: CursoRecord }) {
  const turma = curso.turmas[0];

  return (
    <article className="bg-white border border-[#DCE7EF] rounded-[24px] p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        <div className="relative h-36 rounded-[18px] bg-[#EAF7F0] border border-[#D4ECDD] p-3.5 flex flex-col justify-between overflow-hidden mb-4">
          <div className="flex flex-wrap items-center gap-1.5 z-10">
            <span className="px-2.5 py-1 rounded-full bg-white text-[#0A7B36] text-[11px] font-bold">
              Gratuito
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white text-[#0B2540] text-[11px] font-bold">
              {curso.modalidade}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                curso.tipo === 'PROGRAMADO'
                  ? 'bg-[#0A7B36] text-white'
                  : 'bg-[#0B2540] text-[#FADC00]'
              }`}
            >
              {curso.tipo === 'PROGRAMADO' ? 'Turma aberta' : 'Sob demanda'}
            </span>
          </div>

          <span className="text-xs font-semibold text-[#0A7B36] z-10">
            {turma ? `Polo ${turma.localBairro}` : 'Formação de turma por demanda'}
          </span>

          <div
            aria-hidden="true"
            className="absolute -right-6 -bottom-8 w-28 h-28 rounded-2xl rotate-12 bg-[#0A7B36]/15"
          />
        </div>

        <h3 className="font-heading text-lg font-bold text-[#0B2540] leading-snug mb-2">
          {curso.titulo}
        </h3>

        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="px-2.5 py-1 rounded-full bg-[#EFF7FC] text-[#0162A7] text-[11px] font-semibold">
            #{curso.area.toLowerCase()}
          </span>
          {curso.competenciasDesenvolvidas.slice(0, 2).map((comp, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 rounded-full bg-[#F3F8FC] text-[#0B2540] text-[11px] font-semibold"
            >
              {comp}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 py-3 border-y border-[#F3F8FC] mb-4">
          <div>
            <span className="block text-[11px] text-[#66788A]">Carga horária</span>
            <strong className="text-sm font-bold text-[#0B2540]">{curso.cargaHoraria} horas</strong>
          </div>
          <div>
            <span className="block text-[11px] text-[#66788A]">Vagas na turma</span>
            <strong className="text-sm font-bold text-[#0B2540]">
              {turma ? `${turma.vagasTotais} vagas` : 'Sob consulta'}
            </strong>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5 text-xs text-[#66788A] min-w-0">
          <GraduationCap className="w-3.5 h-3.5 shrink-0 text-[#0A7B36]" />
          <span className="truncate font-medium">{curso.instituicao}</span>
        </div>
        <Link
          href="/cursos"
          className="inline-flex items-center gap-1 shrink-0 px-4 py-2 rounded-full bg-[#0162A7] text-white text-xs font-bold hover:bg-[#004F8A] transition-colors"
        >
          {curso.tipo === 'PROGRAMADO' ? 'Inscrever' : 'Pedir'}
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </article>
  );
}
