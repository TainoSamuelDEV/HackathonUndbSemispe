import Link from 'next/link';
import { ArrowUpRight, GraduationCap, MapPin, Users } from 'lucide-react';
import type { CursoRecord } from '@/server/infrastructure/repositories/FarolDataStore';
import { capaDoCurso } from '@/lib/capaCurso';
import { rotuloModalidade } from '@/lib/rotulosVaga';
import { CapaImagem } from './CapaImagem';

export function CursoCard({ curso }: { curso: CursoRecord }) {
  const turma = curso.turmas[0];
  const capa = capaDoCurso(curso);

  return (
    <article className="group bg-white border border-[#DCE7EF] rounded-[24px] p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        {/* Banner 16:9 com a imagem de capa do curso */}
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
              <span className="px-2.5 py-1 rounded-full bg-white text-[#0A7B36] text-[11px] font-bold shadow-xs">
                Gratuito
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white text-[#0B2540] text-[11px] font-bold shadow-xs">
                {rotuloModalidade(curso.modalidade)}
              </span>
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  curso.tipo === 'PROGRAMADO'
                    ? 'bg-[#0A7B36] text-white'
                    : 'bg-[#0B2540] text-[#FADC00] ring-1 ring-white/20'
                }`}
              >
                {curso.tipo === 'PROGRAMADO' ? 'Turma aberta' : 'Sob demanda'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-sm font-semibold text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.35)]">
              {turma ? (
                <MapPin className="w-4 h-4 shrink-0 text-[#FADC00]" />
              ) : (
                <Users className="w-4 h-4 shrink-0 text-[#FADC00]" />
              )}
              <span>{turma ? `Polo ${turma.localBairro}` : 'Formação de turma por demanda'}</span>
            </div>
          </div>
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
