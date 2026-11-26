'use client';

import { ArrowUpRight, CalendarPlus, Clock, MapPin, Users } from 'lucide-react';
import { baixarIcs } from '@/lib/calendarioIcs';
import type { EventoView } from './visualizacao';

export function EventoCard({ evento }: { evento: EventoView }) {
  const { data } = evento;

  return (
    <article className="bg-white border border-[#DCE7EF] rounded-[24px] p-5 sm:p-6 flex gap-4 sm:gap-5 hover:shadow-md transition-shadow">
      {/* Data em destaque */}
      <div
        aria-hidden="true"
        className="w-16 sm:w-[72px] shrink-0 self-start rounded-[18px] bg-[#EFF7FC] text-center py-3"
      >
        <span className="block text-[11px] font-bold uppercase tracking-wider text-[#0162A7]">{data.mes}</span>
        <span className="block font-heading text-[28px] font-extrabold text-[#0B2540] leading-none mt-1">
          {data.dia}
        </span>
        <span className="block text-[11px] font-semibold uppercase text-[#66788A] mt-1">{data.diaSemanaCurto}</span>
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 rounded-full bg-[#EFF7FC] text-[#0162A7] text-[11px] font-bold">
            {evento.modalidade}
          </span>
          {evento.gratuito && (
            <span className="px-2.5 py-1 rounded-full bg-[#EAF7F0] text-[#0A7B36] text-[11px] font-bold">
              Gratuito
            </span>
          )}
          {evento.seloSimulado && (
            <span className="px-2.5 py-1 rounded-full bg-[#0B2540] text-[#FADC00] text-[11px] font-bold">
              Exemplo
            </span>
          )}
        </div>

        <h3 className="font-heading text-lg font-bold text-[#0B2540] leading-snug mt-2.5">{evento.titulo}</h3>
        <p className="text-sm text-[#66788A] leading-relaxed mt-1.5">{evento.resumo}</p>

        <ul className="mt-4 space-y-1.5 text-sm text-[#0B2540]">
          <li className="flex gap-2">
            <Clock className="w-4 h-4 mt-0.5 shrink-0 text-[#0162A7]" aria-hidden="true" />
            <span>
              <time dateTime={evento.inicio}>{data.dataPorExtenso}</time> · {data.horario}
            </span>
          </li>
          <li className="flex gap-2">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[#0162A7]" aria-hidden="true" />
            <span>{evento.local}</span>
          </li>
          <li className="flex gap-2">
            <Users className="w-4 h-4 mt-0.5 shrink-0 text-[#0162A7]" aria-hidden="true" />
            <span>
              <span className="sr-only">Realização: </span>
              {evento.organizacao}
            </span>
          </li>
        </ul>

        <div className="mt-auto pt-5">
          <div className="pt-4 border-t border-[#F3F8FC] flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => baixarIcs(evento)}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-[#DCE7EF] text-sm font-bold text-[#0B2540] hover:border-[#0162A7] hover:text-[#0162A7] transition-colors"
            >
              <CalendarPlus className="w-4 h-4" aria-hidden="true" />
              Adicionar à agenda
            </button>
            {evento.linkInscricao && (
              <a
                href={evento.linkInscricao}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-[#0162A7] text-white text-sm font-bold hover:bg-[#004F8A] transition-colors"
              >
                Inscrever-se
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                <span className="sr-only">(abre em nova aba)</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
