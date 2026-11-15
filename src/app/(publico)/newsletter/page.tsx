'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BellRing,
  BookmarkCheck,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  ExternalLink,
  FileText,
  MapPin,
  Rocket,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';

type CategoriaNewsletter = 'TODOS' | 'EDITAL' | 'EVENTO' | 'STARTUP' | 'CAPACITACAO';

interface ItemEdital {
  id: string;
  titulo: string;
  organizacao: string;
  categoria: 'EDITAL' | 'STARTUP' | 'CAPACITACAO';
  destaqueValor: string;
  prazo: string;
  formato: string;
  resumo: string;
  tags: string[];
  linkExterno?: string;
}

interface ItemEvento {
  id: string;
  dia: string;
  mes: string;
  dataIsoInicio: string;
  dataIsoFim: string;
  titulo: string;
  organizacao: string;
  categoria: 'EVENTO' | 'STARTUP' | 'CAPACITACAO';
  horario: string;
  local: string;
  modalidade: 'Presencial' | 'Online' | 'Híbrido';
  gratuito: boolean;
  resumo: string;
  tags: string[];
}

const EDITAIS_CHAMADAS: ItemEdital[] = [
  {
    id: 'edital-cpsi-itaqui',
    titulo: 'CPSI Porto do Itaqui — 1ª Contratação Pública de Soluções Inovadoras',
    organizacao: 'EMAP · Porto do Itaqui & Governo do Maranhão',
    categoria: 'EDITAL',
    destaqueValor: 'Até R$ 100 mil por contrato',
    prazo: 'Ciclo contínuo / Chamada aberta',
    formato: 'Startups, Empresas e ICTs',
    resumo:
      'Oportunidade para startups e inovadores apresentarem soluções tecnológicas voltadas aos desafios estratégicos, logísticos e sustentáveis do Porto do Itaqui.',
    tags: ['Startups', 'Inovação Aberta', 'Porto do Itaqui'],
    linkExterno: 'https://www.portodoitaqui.com',
  },
  {
    id: 'edital-pisim',
    titulo: 'PISIM — Programa de Incubação de Startups Inova Maranhão',
    organizacao: 'SECTI-MA & FAPEMA',
    categoria: 'STARTUP',
    destaqueValor: 'Incubação, mentorias e rede de parceiros',
    prazo: 'Edições anuais · Acompanhar pareceres',
    formato: 'Empreendedores e Startups',
    resumo:
      'Programa estadual que impulsiona ideias e startups maranhenses da validação ao mercado, fortalecendo o ecossistema local de negócios inovadores.',
    tags: ['Incubação', 'Inova Maranhão', 'Startups'],
    linkExterno: 'https://www.fapema.br',
  },
  {
    id: 'edital-residencia-portuaria',
    titulo: 'Residência Portuária em Inovação — FAPEMA & EMAP',
    organizacao: 'FAPEMA · Porto do Itaqui',
    categoria: 'EDITAL',
    destaqueValor: 'Bolsas de R$ 3.000 a R$ 5.500 / mês',
    prazo: 'Duração de 12 meses',
    formato: 'Estudantes e Graduados',
    resumo:
      'Seleção de residentes para atuar em projetos de pesquisa aplicada e transformação digital dentro do ecossistema de inovação portuária de São Luís.',
    tags: ['Bolsas', 'Pesquisa Aplicada', 'Itaqui-Bacanga'],
    linkExterno: 'https://www.fapema.br',
  },
  {
    id: 'edital-iel-estagio',
    titulo: 'Banco de Vagas de Estágio e Talentos — IEL Maranhão',
    organizacao: 'IEL/MA · Sistema FIEMA',
    categoria: 'CAPACITACAO',
    destaqueValor: '75+ vagas em cidades do Maranhão',
    prazo: 'Inscrições abertas',
    formato: 'Estudantes (Técnico e Superior)',
    resumo:
      'Oportunidades de estágio para conectar jovens talentos de diferentes áreas de formação às empresas e indústrias maranhenses.',
    tags: ['Estágio', 'Primeiro Emprego', 'FIEMA'],
    linkExterno: 'https://carreiras.iel.org.br',
  },
];

const EVENTOS_SAO_LUIS: ItemEvento[] = [
  {
    id: 'evt-imersao-tech-slz',
    dia: '22',
    mes: 'NOV',
    dataIsoInicio: '20261122T140000',
    dataIsoFim: '20261122T180000',
    titulo: 'Imersão Tech & IA na Prática — Conexão Startups e Comunidade',
    organizacao: 'SECTI, SEBRAE & Comunidade Tech SLZ',
    categoria: 'EVENTO',
    horario: '14h às 18h',
    local: 'Locomotiva Hub · Centro Histórico, São Luís',
    modalidade: 'Presencial',
    gratuito: true,
    resumo:
      'Oficinas práticas de Inteligência Artificial generativa, prototipagem rápida e conexão entre desenvolvedores, estudantes e startups locais.',
    tags: ['IA', 'Oficina', 'Networking'],
  },
  {
    id: 'evt-baiao-meetup',
    dia: '27',
    mes: 'NOV',
    dataIsoInicio: '20261127T190000',
    dataIsoFim: '20261127T213000',
    titulo: 'Meetup Ecossistema SLZ: Do Código ao Produto com Startups Locais',
    organizacao: 'Comunidade Baião Tech & SOLuíses',
    categoria: 'STARTUP',
    horario: '19h às 21h30',
    local: 'Parque Tecnológico de São Luís · Itaqui-Bacanga',
    modalidade: 'Presencial',
    gratuito: true,
    resumo:
      'Painel aberto com fundadores de startups maranhenses, troca de experiências sobre produto, contratação de talentos juniores e oportunidades de mercado.',
    tags: ['Startups', 'Comunidade', 'Carreira Tech'],
  },
  {
    id: 'evt-governanca-slz',
    dia: '03',
    mes: 'DEZ',
    dataIsoInicio: '20261203T090000',
    dataIsoFim: '20261203T120000',
    titulo: 'Encontro da Governança do Ecossistema de Inovação de São Luís',
    organizacao: 'SEMISPE, SECTI, SEBRAE, UFMA, UEMA, IFMA e 19 Instituições',
    categoria: 'EVENTO',
    horario: '09h às 12h',
    local: 'Agência Marandu / UEMA · Cidade Operária',
    modalidade: 'Híbrido',
    gratuito: true,
    resumo:
      'Alinhamento estratégico dos grupos de trabalho da Quádrupla Hélice (Academia, Empresas, Governo e Sociedade Civil) para o plano de ações da capital.',
    tags: ['Governança', 'Políticas Públicas', 'Ecossistema'],
  },
  {
    id: 'evt-capacitacao-exportar',
    dia: '10',
    mes: 'DEZ',
    dataIsoInicio: '20261210T183000',
    dataIsoFim: '20261210T203000',
    titulo: 'Trilha de Qualificação: Negócios Digitais e Mercado de Trabalho',
    organizacao: 'SEMISPE & Parceiros Inova Social',
    categoria: 'CAPACITACAO',
    horario: '18h30 às 20h30',
    local: 'Estação Tech / Transmissão Online',
    modalidade: 'Online',
    gratuito: true,
    resumo:
      'Sessão de orientação sobre currículos, competências digitais mais buscadas pelas empresas de São Luís e caminhos para empreender.',
    tags: ['Qualificação', 'Empregabilidade', 'Gratuito'],
  },
];

const INSTITUICOES_GOVERNANCA = [
  'SEMISPE',
  'SECTI',
  'SEBRAE',
  'FAPEMA',
  'EMAP · Porto do Itaqui',
  'UFMA',
  'UEMA',
  'IFMA',
  'CEUMA',
  'FIEMA',
  'IEMA',
  'Banco do Nordeste',
  'Embrapa',
  'EQT Lab',
  'Comunidade SOLuíses',
  'Creative Pack',
  'ACM',
  'AJE',
  'SEINC',
];

function baixarArquivoIcs(evento: ItemEvento) {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FAROL Sao Luis//Newsletter//PT',
    'BEGIN:VEVENT',
    `UID:${evento.id}@farol.saoluis`,
    `DTSTART:${evento.dataIsoInicio}`,
    `DTEND:${evento.dataIsoFim}`,
    `SUMMARY:${evento.titulo}`,
    `LOCATION:${evento.local}`,
    `DESCRIPTION:${evento.resumo} (${evento.organizacao})`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${evento.id}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function NewsletterPage() {
  const [categoria, setCategoria] = useState<CategoriaNewsletter>('TODOS');
  const [busca, setBusca] = useState('');
  const [salvos, setSalvos] = useState<string[]>([]);
  const [contatoNewsletter, setContatoNewsletter] = useState('');
  const [inscrito, setInscrito] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('farol_eventos_salvos');
      if (saved) setSalvos(JSON.parse(saved));
    } catch {
      // ignora erro de localStorage
    }
  }, []);

  function alternarSalvarEvento(id: string) {
    setSalvos((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('farol_eventos_salvos', JSON.stringify(next));
      } catch {
        // ignora erro de localStorage
      }
      return next;
    });
  }

  function handleInscrever(e: React.FormEvent) {
    e.preventDefault();
    if (!contatoNewsletter.trim()) return;
    setInscrito(true);
    setContatoNewsletter('');
  }

  const buscaNorm = busca.trim().toLowerCase();

  const editaisFiltrados = useMemo(() => {
    return EDITAIS_CHAMADAS.filter((item) => {
      const bateCat = categoria === 'TODOS' || item.categoria === categoria;
      const bateBusca =
        !buscaNorm ||
        item.titulo.toLowerCase().includes(buscaNorm) ||
        item.organizacao.toLowerCase().includes(buscaNorm) ||
        item.resumo.toLowerCase().includes(buscaNorm) ||
        item.tags.some((t) => t.toLowerCase().includes(buscaNorm));
      return bateCat && bateBusca;
    });
  }, [categoria, buscaNorm]);

  const eventosFiltrados = useMemo(() => {
    return EVENTOS_SAO_LUIS.filter((item) => {
      const bateCat = categoria === 'TODOS' || item.categoria === categoria;
      const bateBusca =
        !buscaNorm ||
        item.titulo.toLowerCase().includes(buscaNorm) ||
        item.organizacao.toLowerCase().includes(buscaNorm) ||
        item.local.toLowerCase().includes(buscaNorm) ||
        item.resumo.toLowerCase().includes(buscaNorm) ||
        item.tags.some((t) => t.toLowerCase().includes(buscaNorm));
      return bateCat && bateBusca;
    });
  }, [categoria, buscaNorm]);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 space-y-12">
      {/* HERO DA NEWSLETTER */}
      <section className="relative overflow-hidden rounded-[24px] bg-[#0B2540] text-white p-7 sm:p-10 shadow-sm">
        <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-[#0162A7]/35 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 right-24 w-64 h-64 rounded-full bg-[#0A7B36]/25 blur-2xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-[#FADC00]">
              <Sparkles className="w-3.5 h-3.5" />
              Newsletter · Ecossistema & Startups de São Luís
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl lg:text-[42px] font-extrabold leading-[1.12] tracking-tight">
              Editais abertos e eventos em destaque para você se programar
            </h1>

            <p className="text-sm sm:text-base text-slate-200 max-w-[680px] leading-relaxed">
              Reunimos em uma única página as chamadas de fomento, programas de incubação de startups,
              encontros de tecnologia e capacitações gratuitas do ecossistema maranhense (SEMISPE,
              SECTI, FAPEMA, Porto do Itaqui, hubs e comunidades de São Luís).
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <a
                href="#eventos"
                className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full bg-[#FADC00] text-[#0B2540] font-bold text-sm hover:bg-[#E8CB00] transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Ver agenda de eventos
              </a>
              <a
                href="#editais"
                className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full bg-white/10 border border-white/20 text-white font-semibold text-sm hover:bg-white/20 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Explorar editais abertos
              </a>
            </div>
          </div>

          <div className="lg:col-span-4 grid grid-cols-2 gap-3">
            <div className="rounded-[16px] bg-white/10 border border-white/15 p-4">
              <p className="text-2xl font-heading font-extrabold text-[#FADC00]">
                {EDITAIS_CHAMADAS.length}
              </p>
              <p className="text-xs text-slate-200 mt-1">Editais e chamadas em destaque</p>
            </div>
            <div className="rounded-[16px] bg-white/10 border border-white/15 p-4">
              <p className="text-2xl font-heading font-extrabold text-white">
                {EVENTOS_SAO_LUIS.length}
              </p>
              <p className="text-xs text-slate-200 mt-1">Eventos na agenda de São Luís</p>
            </div>
            <div className="col-span-2 rounded-[16px] bg-[#0162A7]/50 border border-white/15 p-4 flex items-center gap-3">
              <Rocket className="w-8 h-8 text-[#FADC00] shrink-0" />
              <div>
                <p className="text-sm font-bold text-white">Conexão com Startups</p>
                <p className="text-xs text-slate-200">
                  Maranhão & Nordeste em expansão com programas como Inova Maranhão e CPSI.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FILTROS E BUSCA */}
      <section className="bg-[#F3F8FC] border border-[#DCE7EF] rounded-[18px] p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'TODOS', label: 'Tudo' },
              { id: 'EDITAL', label: 'Editais & Chamadas' },
              { id: 'EVENTO', label: 'Eventos SLZ' },
              { id: 'STARTUP', label: 'Startups & Inovação' },
              { id: 'CAPACITACAO', label: 'Capacitações' },
            ] as const
          ).map((tab) => {
            const ativo = categoria === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCategoria(tab.id)}
                className={`min-h-[40px] px-4 rounded-full text-xs sm:text-sm font-bold transition-colors ${
                  ativo
                    ? 'bg-[#0162A7] text-white'
                    : 'bg-white text-[#0B2540] border border-[#DCE7EF] hover:border-[#0162A7]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-[300px]">
          <Search className="w-4 h-4 text-[#66788A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar edital, evento ou local..."
            className="w-full min-h-[42px] bg-white border border-[#DCE7EF] rounded-[12px] pl-10 pr-4 text-sm text-[#0B2540] placeholder:text-[#66788A] focus:outline-none focus:border-[#0162A7]"
          />
        </div>
      </section>

      {/* SEÇÃO 1: EDITAIS E CHAMADAS */}
      <section id="editais" className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#0162A7]">
              Fomento, Startups & Oportunidades
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0B2540] mt-1">
              Editais e Chamadas Abertas
            </h2>
          </div>
          <span className="text-xs text-[#66788A]">
            Referência editorial inspirada no boletim do Ecossistema Maranhense (SECTI / Inova MA)
          </span>
        </div>

        {editaisFiltrados.length === 0 ? (
          <div className="rounded-[16px] border border-dashed border-[#DCE7EF] p-8 text-center text-sm text-[#66788A]">
            Nenhum edital encontrado para esse filtro.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {editaisFiltrados.map((edital) => (
              <article
                key={edital.id}
                className="bg-white border border-[#DCE7EF] rounded-[18px] p-6 flex flex-col justify-between gap-4 hover:border-[#0162A7]/60 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#E7F3FA] text-[#0162A7] text-xs font-bold">
                      {edital.organizacao}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#E8F6EE] text-[#0A7B36] text-xs font-bold">
                      {edital.destaqueValor}
                    </span>
                  </div>

                  <h3 className="font-heading text-lg font-extrabold text-[#0B2540] leading-snug">
                    {edital.titulo}
                  </h3>

                  <p className="text-sm text-[#66788A] leading-relaxed">{edital.resumo}</p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {edital.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-[8px] bg-[#F3F8FC] text-[#0B2540] text-xs font-semibold"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#F3F8FC] flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-[#66788A]">
                    <strong className="text-[#0B2540]">Público:</strong> {edital.formato} ·{' '}
                    <strong className="text-[#0B2540]">Prazo:</strong> {edital.prazo}
                  </div>
                  {edital.linkExterno && (
                    <a
                      href={edital.linkExterno}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0162A7] hover:underline"
                    >
                      Acessar portal
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* SEÇÃO 2: EVENTOS EM DESTAQUE EM SÃO LUÍS */}
      <section id="eventos" className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#0A7B36]">
              Programe sua participação
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0B2540] mt-1">
              Agenda de Eventos em São Luís
            </h2>
          </div>
          <span className="text-xs text-[#66788A]">
            Salve os eventos na sua lista ou exporte o lembrete (.ics) para o seu calendário
          </span>
        </div>

        {eventosFiltrados.length === 0 ? (
          <div className="rounded-[16px] border border-dashed border-[#DCE7EF] p-8 text-center text-sm text-[#66788A]">
            Nenhum evento encontrado para esse filtro.
          </div>
        ) : (
          <div className="space-y-4">
            {eventosFiltrados.map((evento) => {
              const salvo = salvos.includes(evento.id);
              return (
                <article
                  key={evento.id}
                  className="bg-white border border-[#DCE7EF] rounded-[18px] p-5 sm:p-6 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between hover:border-[#0162A7]/60 transition-colors"
                >
                  <div className="flex items-start gap-4 sm:gap-5">
                    <div className="w-16 sm:w-20 shrink-0 rounded-[14px] bg-[#0162A7] text-white text-center py-3 px-2">
                      <span className="block text-2xl sm:text-3xl font-heading font-extrabold leading-none">
                        {evento.dia}
                      </span>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-[#FADC00] mt-1">
                        {evento.mes}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#F3F8FC] text-[#0162A7]">
                          {evento.modalidade}
                        </span>
                        {evento.gratuito && (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#E8F6EE] text-[#0A7B36]">
                            Gratuito
                          </span>
                        )}
                        <span className="text-[#66788A] font-semibold">{evento.organizacao}</span>
                      </div>

                      <h3 className="font-heading text-lg sm:text-xl font-extrabold text-[#0B2540]">
                        {evento.titulo}
                      </h3>

                      <p className="text-sm text-[#66788A] max-w-[680px] leading-relaxed">
                        {evento.resumo}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-[#0B2540] font-semibold pt-1">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#0162A7]" />
                          {evento.horario}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#0A7B36]" />
                          {evento.local}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0">
                    <button
                      onClick={() => alternarSalvarEvento(evento.id)}
                      className={`flex-1 md:flex-initial inline-flex items-center justify-center gap-2 min-h-[42px] px-4 rounded-[12px] text-xs sm:text-sm font-bold transition-colors ${
                        salvo
                          ? 'bg-[#E8F6EE] text-[#0A7B36] border border-[#0A7B36]/30'
                          : 'bg-[#0162A7] text-white hover:bg-[#01528D]'
                      }`}
                    >
                      {salvo ? (
                        <>
                          <BookmarkCheck className="w-4 h-4" />
                          Na minha agenda
                        </>
                      ) : (
                        <>
                          <BellRing className="w-4 h-4" />
                          Quero participar
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => baixarArquivoIcs(evento)}
                      className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 min-h-[40px] px-4 rounded-[12px] border border-[#DCE7EF] text-[#0B2540] text-xs font-bold hover:bg-[#F3F8FC] transition-colors"
                    >
                      <CalendarPlus className="w-4 h-4 text-[#0162A7]" />
                      Baixar .ics
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* SEÇÃO 3: GOVERNANÇA DO ECOSSISTEMA DE SÃO LUÍS */}
      <section className="bg-[#F3F8FC] border border-[#DCE7EF] rounded-[20px] p-6 sm:p-8 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#0162A7]">
              <Users className="w-4 h-4" />
              Governança do Ecossistema de Inovação de São Luís
            </div>
            <h2 className="font-heading text-2xl font-extrabold text-[#0B2540]">
              Conexão direta com startups, universidades e poder público
            </h2>
            <p className="text-sm text-[#66788A] max-w-[740px]">
              O ecossistema local reúne 19 instituições estratégicas da Quádrupla Hélice para
              aproximar formação profissional, vagas de trabalho e inovação aberta na capital.
            </p>
          </div>
          <Link
            href="/vagas"
            className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-[12px] bg-[#0B2540] text-white font-bold text-sm hover:bg-[#13385e] transition-colors shrink-0"
          >
            Ver vagas no FAROL
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {INSTITUICOES_GOVERNANCA.map((inst) => (
            <span
              key={inst}
              className="px-3 py-1.5 rounded-full bg-white border border-[#DCE7EF] text-xs font-bold text-[#0B2540]"
            >
              {inst}
            </span>
          ))}
        </div>
      </section>

      {/* SEÇÃO 4: RECEBER NEWSLETTER */}
      <section className="rounded-[20px] bg-gradient-to-r from-[#0162A7] to-[#0B2540] text-white p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-[560px]">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#FADC00]">
            Boletim Quinzenal
          </span>
          <h2 className="font-heading text-2xl font-extrabold">
            Receba novos editais e eventos de São Luís em primeira mão
          </h2>
          <p className="text-sm text-slate-200">
            Deixe seu e-mail ou WhatsApp para receber o resumo de editais abertos, cursos gratuitos da
            SEMISPE e agenda de startups.
          </p>
        </div>

        {inscrito ? (
          <div className="bg-white/15 border border-white/25 rounded-[14px] px-5 py-4 flex items-center gap-3 text-sm font-bold">
            <CheckCircle2 className="w-5 h-5 text-[#FADC00] shrink-0" />
            <span>Inscrição confirmada! Você receberá os próximos boletins do ecossistema.</span>
          </div>
        ) : (
          <form onSubmit={handleInscrever} className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <input
              required
              value={contatoNewsletter}
              onChange={(e) => setContatoNewsletter(e.target.value)}
              placeholder="Seu e-mail ou WhatsApp (98)..."
              className="min-h-[46px] sm:w-[280px] rounded-[12px] bg-white text-[#0B2540] px-4 text-sm placeholder:text-[#66788A] focus:outline-none"
            />
            <button
              type="submit"
              className="min-h-[46px] px-6 rounded-[12px] bg-[#FADC00] text-[#0B2540] font-extrabold text-sm hover:bg-[#E8CB00] transition-colors shrink-0"
            >
              Quero receber
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
