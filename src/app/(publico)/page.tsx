import Link from 'next/link';
import {
  Briefcase,
  Building2,
  GraduationCap,
  MessageCircle,
  Paperclip,
  Plus,
  UserCheck,
} from 'lucide-react';
import { farolService } from '@/server/application/FarolService';
import { VagaCard } from '@/components/cards/VagaCard';
import { CursoCard } from '@/components/cards/CursoCard';
import { HeroLanding } from '@/components/landing/HeroLanding';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [todasVagas, todosCursos] = await Promise.all([
    farolService.listarVagasPublicas(),
    farolService.listarCursos(),
  ]);
  const vagas = todasVagas.slice(0, 3);
  const cursos = todosCursos.slice(0, 3);

  // Indicadores e destaques da hero — sempre dados reais do sistema
  const totalPostos = todasVagas.reduce((soma, v) => soma + v.quantidadeVagas, 0);
  const turmasAbertas = todosCursos.flatMap((c) =>
    c.turmas
      .filter((t) => t.status === 'INSCRICOES_ABERTAS')
      .map((t) => ({ cursoTitulo: c.titulo, dataInicio: t.dataInicio }))
  );
  const proximaTurma =
    [...turmasAbertas].sort((a, b) => (a.dataInicio ?? '9999').localeCompare(b.dataInicio ?? '9999'))[0] ??
    null;
  const vagaRecente = todasVagas[0]
    ? { id: todasVagas[0].id, titulo: todasVagas[0].titulo, bairro: todasVagas[0].bairro }
    : null;

  return (
    <div className="bg-white">
      <HeroLanding
        totalVagas={todasVagas.length}
        totalPostos={totalPostos}
        totalCursos={todosCursos.length}
        turmasAbertas={turmasAbertas.length}
        vagaRecente={vagaRecente}
        proximaTurma={proximaTurma}
      />

      {/* BLOCO AZUL ARREDONDADO — CARDS ESCALONADOS COM CLIPE */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-10 sm:pb-16">
        <div className="bg-[#0162A7] rounded-[24px] sm:rounded-[32px] p-5 sm:p-10 lg:p-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 mb-7 sm:mb-10">
            <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-white leading-tight">
              Caminhos no
              <br />
              ecossistema FAROL
            </h2>
            <p className="text-sm text-[#CAE8FB] max-w-md">
              Um sistema único conectando moradores, empresas e a gestão da SEMISPE sem duplicidade.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-start">
            {[
              {
                titulo: 'Procuro emprego',
                desc: 'Currículo estruturado, match transparente e acompanhamento de etapas.',
                tag: `${todasVagas.length} ${todasVagas.length === 1 ? 'vaga ativa' : 'vagas ativas'}`,
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
                tag: `${todosCursos.length} ${todosCursos.length === 1 ? 'curso ativo' : 'cursos ativos'}`,
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
                  className={`relative bg-white rounded-[20px] sm:rounded-[22px] p-5 shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between min-h-[165px] sm:min-h-[210px] ${item.offset}`}
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
