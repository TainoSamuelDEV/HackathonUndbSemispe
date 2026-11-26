import { CursoGridSkeleton } from '@/components/skeletons/CardSkeletons';

export default function CarregandoCursos() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div>
        <span className="text-xs font-extrabold uppercase tracking-wider text-[#0A7B36]">
          Qualificação Profissional
        </span>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#0B2540] mt-1">
          Cursos gratuitos da SEMISPE
        </h1>
        <p className="text-sm text-[#66788A] mt-2 max-w-[680px]">
          Turmas programadas exigem solicitação sujeita à confirmação da SEMISPE. Cursos sob demanda
          registram seu interesse para abertura de futuras turmas.
        </p>
      </div>

      <CursoGridSkeleton />
    </div>
  );
}
