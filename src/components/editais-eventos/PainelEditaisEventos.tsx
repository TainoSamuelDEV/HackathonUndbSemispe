'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, FileText, Search, X } from 'lucide-react';
import { EditalCard } from './EditalCard';
import { EventoCard } from './EventoCard';
import { normalizarBusca, type EditalView, type EventoView } from './visualizacao';

type Filtro = 'TODOS' | 'EDITAIS' | 'EVENTOS';

function plural(qtd: number, singular: string, pluralTexto: string) {
  return `${qtd} ${qtd === 1 ? singular : pluralTexto}`;
}

function CabecalhoSecao({
  id,
  icone: Icone,
  titulo,
  contagem,
}: {
  id: string;
  icone: typeof FileText;
  titulo: string;
  contagem: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <Icone className="w-6 h-6 text-[#0162A7]" aria-hidden="true" />
        <h2 id={id} className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0B2540]">
          {titulo}
        </h2>
      </div>
      <span className="text-sm text-[#66788A] shrink-0">{contagem}</span>
    </div>
  );
}

function EstadoVazio({ mensagem, onLimpar }: { mensagem: string; onLimpar?: () => void }) {
  return (
    <div className="border border-[#DCE7EF] rounded-[24px] p-8 sm:p-10 text-center">
      <p className="font-heading font-bold text-lg text-[#0B2540]">{mensagem}</p>
      {onLimpar && (
        <button
          type="button"
          onClick={onLimpar}
          className="mt-4 text-sm font-bold text-[#0162A7] hover:underline underline-offset-4"
        >
          Limpar busca
        </button>
      )}
    </div>
  );
}

export function PainelEditaisEventos({ editais, eventos }: { editais: EditalView[]; eventos: EventoView[] }) {
  const [filtro, setFiltro] = useState<Filtro>('TODOS');
  const [busca, setBusca] = useState('');

  const termo = normalizarBusca(busca);
  const editaisFiltrados = useMemo(
    () => (termo ? editais.filter((e) => e.textoBusca.includes(termo)) : editais),
    [editais, termo]
  );
  const eventosFiltrados = useMemo(
    () => (termo ? eventos.filter((e) => e.textoBusca.includes(termo)) : eventos),
    [eventos, termo]
  );

  const abas: Array<{ id: Filtro; rotulo: string; total: number }> = [
    { id: 'TODOS', rotulo: 'Tudo', total: editaisFiltrados.length + eventosFiltrados.length },
    { id: 'EDITAIS', rotulo: 'Editais', total: editaisFiltrados.length },
    { id: 'EVENTOS', rotulo: 'Eventos', total: eventosFiltrados.length },
  ];

  const mostrarEditais = filtro !== 'EVENTOS';
  const mostrarEventos = filtro !== 'EDITAIS';
  const limparBusca = termo ? () => setBusca('') : undefined;

  const resumoResultado = [
    mostrarEditais ? plural(editaisFiltrados.length, 'edital', 'editais') : null,
    mostrarEventos ? plural(eventosFiltrados.length, 'evento', 'eventos') : null,
  ]
    .filter(Boolean)
    .join(' e ');

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Filtros */}
      <div className="bg-[#F3F8FC] border border-[#DCE7EF] rounded-[20px] sm:rounded-[24px] p-3 sm:p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div
          role="group"
          aria-label="Filtrar por tipo"
          className="flex w-full md:w-auto p-1 rounded-full bg-white border border-[#DCE7EF]"
        >
          {abas.map((aba) => {
            const ativo = filtro === aba.id;
            return (
              <button
                key={aba.id}
                type="button"
                onClick={() => setFiltro(aba.id)}
                aria-pressed={ativo}
                className={`flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                  ativo ? 'bg-[#0162A7] text-white' : 'text-[#0B2540] hover:text-[#0162A7]'
                }`}
              >
                {aba.rotulo}
                <span className={`text-xs font-semibold ${ativo ? 'text-white/80' : 'text-[#66788A]'}`}>
                  {aba.total}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:max-w-sm md:ml-auto">
          <label htmlFor="busca-editais-eventos" className="sr-only">
            Buscar editais e eventos
          </label>
          <Search
            className="w-4 h-4 text-[#66788A] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="busca-editais-eventos"
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar editais e eventos"
            className="w-full h-12 rounded-full bg-white border border-[#DCE7EF] pl-11 pr-11 text-sm text-[#0B2540] placeholder:text-[#66788A] focus:outline-none focus:border-[#0162A7] focus:ring-4 focus:ring-[#0162A7]/10 [&::-webkit-search-cancel-button]:appearance-none"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca('')}
              aria-label="Limpar busca"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 inline-flex items-center justify-center rounded-full text-[#66788A] hover:text-[#0B2540] hover:bg-[#F3F8FC]"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {resumoResultado}
      </p>

      {mostrarEditais && (
        <section aria-labelledby="titulo-editais">
          <CabecalhoSecao
            id="titulo-editais"
            icone={FileText}
            titulo="Editais e chamadas"
            contagem={plural(editaisFiltrados.length, 'aberto', 'abertos')}
          />
          {editaisFiltrados.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {editaisFiltrados.map((edital) => (
                <EditalCard key={edital.id} edital={edital} />
              ))}
            </div>
          ) : (
            <EstadoVazio
              mensagem={
                termo ? `Nenhum edital encontrado para “${busca.trim()}”.` : 'Nenhum edital com inscrições abertas no momento.'
              }
              onLimpar={limparBusca}
            />
          )}
        </section>
      )}

      {mostrarEventos && (
        <section aria-labelledby="titulo-eventos">
          <CabecalhoSecao
            id="titulo-eventos"
            icone={CalendarDays}
            titulo="Próximos eventos"
            contagem={plural(eventosFiltrados.length, 'evento', 'eventos')}
          />
          {eventosFiltrados.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {eventosFiltrados.map((evento) => (
                <EventoCard key={evento.id} evento={evento} />
              ))}
            </div>
          ) : (
            <EstadoVazio
              mensagem={termo ? `Nenhum evento encontrado para “${busca.trim()}”.` : 'Nenhum evento agendado no momento.'}
              onLimpar={limparBusca}
            />
          )}
        </section>
      )}
    </div>
  );
}
