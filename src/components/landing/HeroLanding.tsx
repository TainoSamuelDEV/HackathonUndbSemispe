import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Briefcase, GraduationCap, Search } from 'lucide-react';

interface HeroLandingProps {
  totalVagas: number;
  totalPostos: number;
  totalCursos: number;
  turmasAbertas: number;
  vagaRecente: { id: string; titulo: string; bairro: string } | null;
  proximaTurma: { cursoTitulo: string; dataInicio: string | null } | null;
}

/** dd/mm a partir de aaaa-mm-dd, sem conversão de fuso. */
function diaMes(iso: string | null) {
  const m = iso ? /^(\d{4})-(\d{2})-(\d{2})/.exec(iso) : null;
  return m ? `${m[3]}/${m[2]}` : null;
}

/**
 * Hero da landing: mídia em largura total (passa por trás do header flutuante),
 * recortada por uma onda branca, com chamada, busca e indicadores reais do sistema.
 */
export function HeroLanding({
  totalVagas,
  totalPostos,
  totalCursos,
  turmasAbertas,
  vagaRecente,
  proximaTurma,
}: HeroLandingProps) {
  const inicioTurma = diaMes(proximaTurma?.dataInicio ?? null);

  const indicadores = [
    { valor: totalVagas, rotulo: ['Vagas', 'publicadas'] },
    { valor: totalPostos, rotulo: ['Postos de', 'trabalho'] },
    { valor: totalCursos, rotulo: ['Cursos', 'gratuitos'] },
  ];

  return (
    // -mt compensa a altura do header flutuante para a mídia começar no topo da página
    <section className="relative bg-white -mt-[72px] sm:-mt-[76px]">
      {/* MÍDIA */}
      <div className="relative h-[340px] sm:h-[480px] lg:h-[620px]">
        {/* Base recortada em onda pela máscara (ver .mascara-onda-hero em globals.css) */}
        <div aria-hidden="true" className="mascara-onda-hero absolute inset-0 overflow-hidden bg-[#0B2540]">
          {/* Vídeo de fundo (pessoas conversando, se conectando e estudando) */}
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover object-[center_35%]"
          >
            <source src="/videos/hero-farol.mp4" type="video/mp4" />
          </video>
          {/* Leve escurecimento no topo para dar profundidade atrás do header */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B2540]/45 via-[#0B2540]/10 to-transparent" />
        </div>

        {/* Cartão flutuante: vaga mais recente (dado real) */}
        {vagaRecente && (
          <Link
            href={`/vagas/${vagaRecente.id}`}
            className="group hidden sm:flex absolute left-[5%] lg:left-[6%] bottom-[38%] lg:bottom-[40%] items-center gap-3 max-w-[380px] rounded-2xl bg-white/95 backdrop-blur-md pl-3 pr-5 py-3 shadow-[0_14px_36px_rgba(11,37,64,0.22)] transition-transform hover:-translate-y-0.5"
          >
            <span className="w-10 h-10 rounded-full bg-[#0162A7] text-white flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-[#0B2540]">Vaga mais recente</span>
              <span className="block text-xs text-[#66788A] truncate">
                {vagaRecente.titulo} · {vagaRecente.bairro}
              </span>
            </span>
            <span className="absolute -right-2 -bottom-2 w-6 h-6 rounded-full bg-[#FADC00] text-[#0B2540] flex items-center justify-center shadow-md">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        )}

        {/* Cartão flutuante: turmas abertas (dado real) */}
        {turmasAbertas > 0 && (
          <Link
            href="/cursos"
            className="hidden lg:flex absolute right-[6%] bottom-[13%] items-center gap-3 max-w-[380px] rounded-2xl bg-white pl-3 pr-5 py-3 shadow-[0_14px_36px_rgba(11,37,64,0.18)] transition-transform hover:-translate-y-0.5"
          >
            <span className="w-10 h-10 rounded-full bg-[#0A7B36] text-white flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-[#0B2540]">
                {turmasAbertas} {turmasAbertas === 1 ? 'turma aberta' : 'turmas abertas'}
              </span>
              {proximaTurma && (
                <span className="block text-xs text-[#66788A] truncate">
                  {inicioTurma ? `Próxima: ${inicioTurma} · ` : ''}
                  {proximaTurma.cursoTitulo}
                </span>
              )}
            </span>
          </Link>
        )}
      </div>

      {/* CONTEÚDO */}
      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 -mt-2 sm:-mt-20 lg:-mt-40 pb-12 sm:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-9 lg:gap-6 items-end">
          <div className="lg:col-span-7">
            <h1 className="font-heading text-[34px] sm:text-5xl lg:text-[60px] font-extrabold text-[#0B2540] leading-[1.06] tracking-tight">
              Oportunidades reais em <span className="text-[#0162A7]">São Luís</span>.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-[#66788A] max-w-[480px] leading-relaxed">
              Vagas locais, cursos gratuitos da SEMISPE e apoio pelo WhatsApp.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3 max-w-[620px]">
              {/* Busca rápida em pílula */}
              <form
                action="/vagas"
                method="GET"
                role="search"
                className="flex-1 flex items-center gap-2 h-[54px] pl-4 pr-1.5 rounded-full bg-white border border-[#DCE7EF] shadow-[0_6px_20px_rgba(11,37,64,0.06)] focus-within:border-[#0162A7] focus-within:ring-4 focus-within:ring-[#0162A7]/10 transition"
              >
                <Search className="w-4 h-4 text-[#0162A7] shrink-0" aria-hidden="true" />
                <label htmlFor="busca-hero" className="sr-only">
                  Buscar vagas por cargo ou bairro
                </label>
                <input
                  id="busca-hero"
                  name="busca"
                  placeholder="Cargo ou bairro"
                  className="flex-1 min-w-0 bg-transparent text-[15px] text-[#0B2540] placeholder:text-[#66788A] focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 h-[42px] px-5 rounded-full bg-[#0162A7] text-white text-sm font-bold hover:bg-[#004F8A] transition-colors shrink-0"
                >
                  Buscar vagas
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </form>

              <Link
                href="/cursos"
                className="inline-flex items-center justify-center h-[54px] px-6 rounded-full border border-[#0B2540]/20 text-[#0B2540] text-sm font-bold hover:border-[#0162A7] hover:text-[#0162A7] transition-colors shrink-0"
              >
                Cursos gratuitos
              </Link>
            </div>

            <Link
              href="/editais-e-eventos"
              className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-[#0162A7] hover:underline underline-offset-4"
            >
              Editais e eventos em São Luís
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          {/* Indicadores reais do sistema */}
          <dl className="lg:col-span-5 grid grid-cols-3 gap-3 sm:gap-6 border-t border-[#DCE7EF] pt-6 lg:border-t-0 lg:pt-0 lg:pb-2 lg:justify-items-end">
            {indicadores.map((item) => (
              <div
                key={item.rotulo.join(' ')}
                className="flex flex-col-reverse gap-1 sm:flex-row-reverse sm:items-center sm:justify-end sm:gap-2.5"
              >
                <dt className="text-xs text-[#66788A] leading-tight">
                  {item.rotulo[0]}
                  <br />
                  {item.rotulo[1]}
                </dt>
                <dd className="font-heading text-3xl lg:text-[40px] font-extrabold text-[#0B2540] tabular-nums leading-none">
                  {item.valor}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
