import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  Building2,
  GraduationCap,
  MessageCircle,
  Paperclip,
  Plus,
  Search,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { farolService } from '@/server/application/FarolService';
import { VagaCard } from '@/components/cards/VagaCard';
import { CursoCard } from '@/components/cards/CursoCard';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const vagas = (await farolService.listarVagasPublicas()).slice(0, 3);
  const cursos = (await farolService.listarCursos()).slice(0, 3);

  return (
    <div className="bg-white">
      {/* HERO — LAYOUT ASSIMÉTRICO COM CARD INCLINADO E BALÃO FLUTUANTE */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-10 pb-16 lg:pt-14 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F3F8FC] border border-[#D1E3EF] text-xs font-bold text-[#0162A7]">
              <Sparkles className="w-3.5 h-3.5" />
              SEMISPE · Parque Tecnológico de São Luís
            </span>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-[52px] font-extrabold text-[#0B2540] leading-[1.08]">
              Oportunidades e qualificação para <span className="text-[#0162A7]">São Luís</span>
            </h1>

            <p className="text-base text-[#66788A] max-w-[520px] leading-relaxed">
              O <strong>FAROL</strong> conecta moradores — com prioridade inicial no eixo{' '}
              <strong>Itaqui-Bacanga</strong> — a vagas locais, cursos gratuitos da SEMISPE e
              atendimento direto pelo WhatsApp.
            </p>

            {/* Busca rápida compacta + CTA pill com seta circular */}
            <form
              action="/vagas"
              method="GET"
              className="bg-[#F3F8FC] p-2 rounded-full border border-[#DCE7EF] flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-[540px]"
            >
              <div className="flex-1 flex items-center gap-2 pl-4 pr-2">
                <Search className="w-4 h-4 text-[#66788A] shrink-0" />
                <input
                  name="busca"
                  placeholder="Cargo, área ou bairro..."
                  className="w-full bg-transparent py-2 text-sm text-[#0B2540] placeholder:text-[#66788A] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 min-h-[44px] pl-5 pr-2 rounded-full bg-[#0162A7] text-white text-sm font-bold hover:bg-[#004F8A] transition-colors"
              >
                <span>Encontrar vagas</span>
                <span className="w-8 h-8 rounded-full bg-[#FADC00] text-[#0B2540] flex items-center justify-center">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/cursos"
                className="inline-flex items-center gap-2 min-h-[42px] px-5 rounded-full border border-[#DCE7EF] text-sm font-bold text-[#0B2540] hover:border-[#0162A7] hover:text-[#0162A7] transition-colors"
              >
                <GraduationCap className="w-4 h-4 text-[#0A7B36]" />
                Conhecer cursos
              </Link>
              <Link
                href="/entrar"
                className="inline-flex items-center gap-2 min-h-[42px] px-5 rounded-full bg-[#EAF7F0] text-sm font-bold text-[#0A7B36] hover:bg-[#d8f1e3] transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Criar currículo com IA FAROL
              </Link>
            </div>
          </div>

          {/* Lado direito — Visual inclinado + Formas orgânicas + Card flutuante */}
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end py-6">
            <div className="relative w-full max-w-[440px]">
              {/* Camadas de fundo inspiradas no símbolo do Parque */}
              <div
                aria-hidden="true"
                className="absolute -inset-4 rounded-[32px] bg-[#93C05F]/30 -rotate-6"
              />
              <div
                aria-hidden="true"
                className="absolute -inset-2 rounded-[32px] bg-[#009CDC]/20 rotate-3"
              />

              {/* Card principal inclinado */}
              <div className="relative bg-[#0B2540] text-white rounded-[28px] p-6 sm:p-7 rotate-2 shadow-xl space-y-5">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-[#FADC00]">
                    Match 70/30 Auditável
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#0A7B36] text-xs font-bold text-white">
                    WhatsApp + Portal
                  </span>
                </div>

                <div className="space-y-3 bg-white/5 rounded-[18px] p-4 border border-white/10">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Ajudante de Manutenção</span>
                    <strong className="text-[#93C05F]">82% match</strong>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full w-[82%] rounded-full bg-[#93C05F]" />
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    ✅ Atende: Ensino Médio, Experiência em oficina
                    <br />
                    📌 Sugestão de curso: NR-12 (16h gratuito)
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
                  <span>Sincronizado em tempo real</span>
                  <span className="font-bold text-white">IA FAROL</span>
                </div>
              </div>

              {/* Balão flutuante inclinado sobrepondo o canto inferior */}
              <div className="relative sm:absolute sm:-left-10 sm:-bottom-6 mt-4 sm:mt-0 bg-white border border-[#DCE7EF] rounded-[20px] p-4 shadow-lg max-w-[270px] -rotate-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-[#0B2540] leading-relaxed">
                    Fale com a <strong>IA FAROL</strong> no WhatsApp para montar seu currículo e
                    descobrir vagas perto de você.
                  </p>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0A7B36] shrink-0 mt-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BLOCO AZUL ARREDONDADO — CARDS ESCALONADOS COM CLIPE */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-16">
        <div className="bg-[#0162A7] rounded-[32px] p-6 sm:p-10 lg:p-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Caminhos no
              <br />
              ecossistema FAROL
            </h2>
            <p className="text-sm text-[#CAE8FB] max-w-md">
              Um sistema único conectando moradores, empresas e a gestão da SEMISPE sem duplicidade.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
            {[
              {
                titulo: 'Procuro emprego',
                desc: 'Currículo estruturado, match transparente e acompanhamento de etapas.',
                tag: `${vagas.length}+ vagas ativas`,
                href: '/vagas',
                icon: UserCheck,
                offset: 'lg:mt-0 lg:-rotate-1',
              },
              {
                titulo: 'Sou empresa ou startup',
                desc: 'Publique vagas com CNPJ/MEI e busque profissionais em Serviços.',
                tag: 'Cadastro gratuito',
                href: '/entrar',
                icon: Building2,
                offset: 'lg:mt-6 lg:rotate-1',
              },
              {
                titulo: 'Quero me capacitar',
                desc: 'Turmas programadas da SEMISPE e pedidos de novos cursos sob demanda.',
                tag: `${cursos.length} cursos ativos`,
                href: '/cursos',
                icon: GraduationCap,
                offset: 'lg:mt-2 lg:-rotate-1',
              },
              {
                titulo: 'IA FAROL WhatsApp',
                desc: 'Triagem por texto ou áudio, envio de currículo e indicação de vagas.',
                tag: 'Atendimento 24h',
                href: '/entrar',
                icon: MessageCircle,
                offset: 'lg:mt-8 lg:rotate-1',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.titulo}
                  href={item.href}
                  className={`relative bg-white rounded-[22px] p-5 shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between min-h-[210px] ${item.offset}`}
                >
                  <Paperclip
                    aria-hidden="true"
                    className="w-5 h-5 text-[#9AAAB8] absolute -top-2.5 right-4 rotate-12"
                  />
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-[#F3F8FC] text-[#0162A7] flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-heading text-lg font-bold text-[#0B2540] mb-1.5">
                      {item.titulo}
                    </h3>
                    <p className="text-xs text-[#66788A] leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="pt-4">
                    <span className="inline-block px-3 py-1 rounded-full bg-[#0B2540] text-white text-[11px] font-bold">
                      {item.tag}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* VAGAS EM DESTAQUE */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-16">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Briefcase className="w-6 h-6 text-[#0162A7]" />
            <h2 className="font-heading text-3xl font-extrabold text-[#0B2540]">Vagas</h2>
          </div>
          <Link
            href="/vagas"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#DCE7EF] text-xs font-bold text-[#0B2540] hover:border-[#0162A7] hover:text-[#0162A7] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Todas as vagas
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vagas.map((vaga) => (
            <VagaCard key={vaga.id} vaga={vaga} />
          ))}
        </div>
      </section>

      {/* CURSOS GRATUITOS */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-12">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-6 h-6 text-[#0A7B36]" />
            <h2 className="font-heading text-3xl font-extrabold text-[#0B2540]">Cursos</h2>
          </div>
          <Link
            href="/cursos"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#DCE7EF] text-xs font-bold text-[#0B2540] hover:border-[#0A7B36] hover:text-[#0A7B36] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Todos os cursos
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cursos.map((curso) => (
            <CursoCard key={curso.id} curso={curso} />
          ))}
        </div>
      </section>
    </div>
  );
}
