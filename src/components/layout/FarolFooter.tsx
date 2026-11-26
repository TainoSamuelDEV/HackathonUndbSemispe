import Link from 'next/link';

export function FarolFooter() {
  return (
    <footer className="bg-[#0B2540] text-white mt-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <img
            src="/logos/logo-pqt-branco.png"
            alt="Parque Tecnológico de São Luís"
            className="h-10 w-auto object-contain mb-4"
          />
          <p className="text-sm text-slate-300 leading-relaxed max-w-xs">
            <strong>FAROL</strong> — Formação, Ações e Rede de Oportunidades Locais. Conectando talentos,
            empresas e capacitação gratuita em São Luís com foco inicial no eixo Itaqui-Bacanga.
          </p>
        </div>

        <div>
          <h4 className="font-heading font-bold text-base mb-3 text-white">Navegação</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li><Link href="/vagas" className="hover:text-[#FADC00]">Catálogo de Vagas</Link></li>
            <li><Link href="/cursos" className="hover:text-[#FADC00]">Cursos SEMISPE</Link></li>
            <li><Link href="/editais-e-eventos" className="hover:text-[#FADC00]">Editais e Eventos</Link></li>
            <li><Link href="/sobre" className="hover:text-[#FADC00]">Sobre o Programa</Link></li>
            <li><Link href="/entrar" className="hover:text-[#FADC00]">Acessar Conta</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-heading font-bold text-base mb-3 text-white">Transparência & LGPD</h4>
          <p className="text-sm text-slate-300 leading-relaxed">
            O score de compatibilidade é informativo e visível apenas ao candidato. Dados marcados como{' '}
            <em>Exemplo / Simulado</em> destinam-se à demonstração do MVP no Hackathon UNDB + SEMISPE.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-slate-400">
        FAROL · Hackathon São Luís do Futuro (UNDB + SEMISPE)
      </div>
    </footer>
  );
}
