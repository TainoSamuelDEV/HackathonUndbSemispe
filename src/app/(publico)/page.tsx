import Link from 'next/link';
import { Briefcase, GraduationCap, MessageCircle, Search, ArrowRight, Building2, UserCheck } from 'lucide-react';
import { farolService } from '@/server/application/FarolService';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const vagas = (await farolService.listarVagasPublicas()).slice(0, 3);
  const cursos = (await farolService.listarCursos()).slice(0, 3);

  return (
    <div>
      {/* HERO */}
      <section className="bg-[#F3F8FC] border-b border-[#DCE7EF]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#D1E3EF] text-xs font-extrabold uppercase tracking-wider text-[#0162A7]">
              SEMISPE · Parque Tecnológico de São Luís
            </span>
            <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-[#0B2540] leading-[1.1]">
              Oportunidades e qualificação para <span className="text-[#0162A7]">São Luís</span>
            </h1>
            <p className="text-base sm:text-lg text-[#66788A] max-w-[600px] leading-relaxed">
              O <strong>FAROL</strong> conecta moradores — com prioridade inicial para a região{' '}
              <strong>Itaqui-Bacanga</strong> — a vagas de empresas e startups, cursos gratuitos da
              SEMISPE e atendimento simples pelo WhatsApp.
            </p>

            {/* BUSCA RÁPIDA */}
            <form
              action="/vagas"
              method="GET"
              className="bg-white p-2 rounded-[16px] border border-[#DCE7EF] shadow-sm flex flex-col sm:flex-row gap-2"
            >
              <div className="flex-1 flex items-center gap-2 px-3">
                <Search className="w-4 h-4 text-[#66788A]" />
                <input
                  name="busca"
                  placeholder="Cargo ou competência (ex: manutenção, logística)"
                  className="w-full py-2.5 text-sm focus:outline-none"
                />
              </div>
              <input
                name="bairro"
                placeholder="Bairro (ex: Itaqui-Bacanga)"
                className="sm:w-48 px-3 py-2.5 text-sm border-t sm:border-t-0 sm:border-l border-[#DCE7EF] focus:outline-none"
              />
              <button
                type="submit"
                className="min-h-[45px] px-6 rounded-[12px] bg-[#FADC00] text-[#0B2540] font-bold text-sm hover:bg-[#E8CB00] transition-colors"
              >
                Encontrar vagas
              </button>
            </form>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href="/cursos"
                className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-[12px] border border-[#B9D4E6] text-[#0162A7] font-bold text-sm hover:bg-[#E9F4FB]"
              >
                <GraduationCap className="w-4 h-4" />
                Conhecer cursos
              </Link>
              <Link
                href="/entrar"
                className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-[12px] bg-[#0A7B36] text-white font-bold text-sm hover:bg-[#086A2F]"
              >
                <MessageCircle className="w-4 h-4" />
                Criar currículo com IA FAROL
              </Link>
            </div>
          </div>

          {/* CARD DESTAQUE IA FAROL */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-[#DCE7EF] rounded-[16px] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#0A7B36]">
                  IA FAROL no WhatsApp
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#EAF7F0] text-[#0A7B36] text-[11px] font-bold">
                  Evolution API
                </span>
              </div>
              <h2 className="font-heading text-2xl font-bold text-[#0B2540]">
                Seu currículo e suas vagas em uma conversa simples
              </h2>
              <p className="text-sm text-[#66788A] leading-relaxed">
                Prefere falar por áudio ou mandar seu currículo no WhatsApp? A <strong>IA FAROL</strong>{' '}
                monta seu perfil, explica o quanto você combina com cada vaga e indica cursos gratuitos
                quando faltar algum requisito.
              </p>
              <ul className="space-y-2 text-sm text-[#0B2540]">
                <li>✅ Uma pergunta por vez, sem complicação</li>
                <li>✅ Transparência: mostra o que atende e o que falta</li>
                <li>✅ Mesmos dados sincronizados com este portal</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ESCOLHA SEU CAMINHO */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <div className="mb-8">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#0162A7]">
            Portal Único
          </span>
          <h2 className="font-heading text-3xl font-extrabold text-[#0B2540] mt-1">
            Escolha seu caminho no FAROL
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/entrar"
            className="border border-[#DCE7EF] rounded-[16px] p-6 hover:border-[#0162A7] transition-colors bg-white"
          >
            <UserCheck className="w-8 h-8 text-[#0162A7] mb-4" />
            <h3 className="font-heading text-xl font-bold mb-2">Procuro emprego</h3>
            <p className="text-sm text-[#66788A] mb-4">
              Monte seu currículo estruturado, veja sua compatibilidade real e acompanhe candidaturas.
            </p>
            <span className="text-sm font-bold text-[#0162A7] inline-flex items-center gap-1">
              Acessar área do candidato <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <Link
            href="/entrar"
            className="border border-[#DCE7EF] rounded-[16px] p-6 hover:border-[#0162A7] transition-colors bg-white"
          >
            <Building2 className="w-8 h-8 text-[#0162A7] mb-4" />
            <h3 className="font-heading text-xl font-bold mb-2">Sou empresa ou startup</h3>
            <p className="text-sm text-[#66788A] mb-4">
              Publique vagas com CNPJ ou MEI ativo, gerencie candidatos e busque profissionais em Serviços.
            </p>
            <span className="text-sm font-bold text-[#0162A7] inline-flex items-center gap-1">
              Publicar oportunidades <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <Link
            href="/cursos"
            className="border border-[#DCE7EF] rounded-[16px] p-6 hover:border-[#0A7B36] transition-colors bg-white"
          >
            <GraduationCap className="w-8 h-8 text-[#0A7B36] mb-4" />
            <h3 className="font-heading text-xl font-bold mb-2">Quero me capacitar</h3>
            <p className="text-sm text-[#66788A] mb-4">
              Solicite inscrição em turmas abertas da SEMISPE ou registre interesse em cursos sob demanda.
            </p>
            <span className="text-sm font-bold text-[#0A7B36] inline-flex items-center gap-1">
              Explorar cursos gratuitos <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </section>

      {/* VAGAS EM DESTAQUE */}
      <section className="bg-[#F3F8FC] py-16 border-y border-[#DCE7EF]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#0162A7]">
                Oportunidades
              </span>
              <h2 className="font-heading text-3xl font-extrabold text-[#0B2540] mt-1">
                Vagas em destaque
              </h2>
            </div>
            <Link href="/vagas" className="text-sm font-bold text-[#0162A7] hover:underline">
              Ver todas as vagas →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {vagas.map((vaga) => (
              <div key={vaga.id} className="bg-white border border-[#DCE7EF] rounded-[16px] p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#EFF7FC] text-[#0162A7]">
                      {vaga.modalidade}
                    </span>
                    {vaga.seloSimulado && (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FFF9E6] text-[#8E6416] border border-[#F0E3BF]">
                        Exemplo / Simulado
                      </span>
                    )}
                  </div>
                  <h3 className="font-heading text-lg font-bold text-[#0B2540] mb-1">
                    {vaga.titulo}
                  </h3>
                  <p className="text-xs font-semibold text-[#66788A] mb-3">
                    {vaga.empresaNome} · {vaga.bairro}, {vaga.municipio} – MA
                  </p>
                  <p className="text-sm text-[#66788A] line-clamp-3 mb-4">{vaga.descricao}</p>
                </div>
                <Link
                  href={`/vagas/${vaga.id}`}
                  className="inline-flex items-center justify-center min-h-[44px] w-full rounded-[12px] bg-[#0162A7] text-white text-sm font-bold hover:bg-[#004F8A]"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Ver detalhes
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CURSOS EM DESTAQUE */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#0A7B36]">
              Qualificação SEMISPE
            </span>
            <h2 className="font-heading text-3xl font-extrabold text-[#0B2540] mt-1">
              Cursos gratuitos
            </h2>
          </div>
          <Link href="/cursos" className="text-sm font-bold text-[#0162A7] hover:underline">
            Ver catálogo completo →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cursos.map((curso) => (
            <div key={curso.id} className="bg-white border border-[#DCE7EF] rounded-[16px] p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      curso.tipo === 'PROGRAMADO'
                        ? 'bg-[#EAF7F0] text-[#0A7B36]'
                        : 'bg-[#F3F5F8] text-[#64758A]'
                    }`}
                  >
                    {curso.tipo === 'PROGRAMADO' ? 'Turma aberta' : 'Sob demanda'}
                  </span>
                  <span className="text-xs font-bold text-[#66788A]">{curso.cargaHoraria}h</span>
                </div>
                <h3 className="font-heading text-lg font-bold text-[#0B2540] mb-1">
                  {curso.titulo}
                </h3>
                <p className="text-xs font-semibold text-[#66788A] mb-3">{curso.instituicao}</p>
                <p className="text-sm text-[#66788A] line-clamp-3 mb-4">{curso.descricao}</p>
              </div>
              <Link
                href="/cursos"
                className="inline-flex items-center justify-center min-h-[44px] w-full rounded-[12px] border border-[#B9D4E6] text-[#0162A7] text-sm font-bold hover:bg-[#E9F4FB]"
              >
                {curso.tipo === 'PROGRAMADO' ? 'Solicitar inscrição' : 'Registrar interesse'}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
