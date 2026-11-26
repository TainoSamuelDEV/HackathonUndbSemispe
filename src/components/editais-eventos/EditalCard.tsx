import { Building2, ExternalLink } from 'lucide-react';
import type { EditalView } from './visualizacao';

function avisoEncerramento(dias: number | null) {
  if (dias === null || dias > 7) return null;
  if (dias <= 0) return 'Encerra hoje';
  if (dias === 1) return 'Encerra amanhã';
  return `Encerra em ${dias} dias`;
}

export function EditalCard({ edital }: { edital: EditalView }) {
  const aviso = avisoEncerramento(edital.diasParaEncerrar);

  return (
    <article className="bg-white border border-[#DCE7EF] rounded-[24px] p-5 sm:p-6 flex flex-col hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-center gap-1.5 min-w-0 text-xs font-semibold text-[#66788A]">
          <Building2 className="w-3.5 h-3.5 shrink-0 text-[#0162A7]" aria-hidden="true" />
          <span className="truncate">{edital.organizacao}</span>
        </p>
        <div className="flex shrink-0 gap-1.5">
          {aviso && (
            <span className="px-2.5 py-1 rounded-full bg-[#FFF4D6] text-[#8E6416] text-[11px] font-bold">
              {aviso}
            </span>
          )}
          {edital.seloSimulado && (
            <span className="px-2.5 py-1 rounded-full bg-[#0B2540] text-[#FADC00] text-[11px] font-bold">
              Exemplo
            </span>
          )}
        </div>
      </div>

      <h3 className="font-heading text-lg font-bold text-[#0B2540] leading-snug mt-3">{edital.titulo}</h3>
      <p className="text-sm text-[#66788A] leading-relaxed mt-2">{edital.resumo}</p>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 py-4 my-4 border-y border-[#F3F8FC]">
        {edital.beneficio && (
          <div className="col-span-2">
            <dt className="text-[11px] text-[#66788A]">Benefício</dt>
            <dd className="text-sm font-bold text-[#0B2540] mt-0.5">{edital.beneficio}</dd>
          </div>
        )}
        <div>
          <dt className="text-[11px] text-[#66788A]">Inscrições</dt>
          <dd className="text-sm font-bold text-[#0B2540] mt-0.5">{edital.prazo ?? 'Consulte o edital'}</dd>
        </div>
        {edital.publicoAlvo && (
          <div>
            <dt className="text-[11px] text-[#66788A]">Público</dt>
            <dd className="text-sm font-bold text-[#0B2540] mt-0.5">{edital.publicoAlvo}</dd>
          </div>
        )}
      </dl>

      <div className="mt-auto flex flex-wrap items-end justify-between gap-3">
        <ul className="flex flex-wrap gap-1.5" aria-label="Temas">
          {edital.tags.slice(0, 3).map((tag) => (
            <li
              key={tag}
              className="px-2.5 py-1 rounded-full bg-[#EFF7FC] text-[#0162A7] text-[11px] font-semibold"
            >
              {tag}
            </li>
          ))}
        </ul>
        {edital.linkUrl && (
          <a
            href={edital.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 shrink-0 h-10 px-4 rounded-full bg-[#0162A7] text-white text-sm font-bold hover:bg-[#004F8A] transition-colors"
          >
            Ver edital
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="sr-only">(abre em nova aba)</span>
          </a>
        )}
      </div>
    </article>
  );
}
