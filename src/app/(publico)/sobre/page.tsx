export default function SobrePage() {
  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-12 space-y-6">
      <span className="text-xs font-extrabold uppercase tracking-wider text-[#0162A7]">
        Institucional
      </span>
      <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#0B2540]">
        Sobre o FAROL
      </h1>
      <p className="text-base text-[#66788A] leading-relaxed">
        O <strong>FAROL (Formação, Ações e Rede de Oportunidades Locais)</strong> é uma iniciativa
        desenvolvida no <strong>Hackathon São Luís do Futuro (UNDB + SEMISPE)</strong> para conectar
        talentos, empresas, startups e cursos gratuitos em um único ecossistema.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="border border-[#DCE7EF] rounded-[16px] p-6 bg-[#F3F8FC]">
          <h2 className="font-heading text-xl font-bold text-[#0162A7] mb-2">
            Foco inicial Itaqui-Bacanga
          </h2>
          <p className="text-sm text-[#66788A] leading-relaxed">
            Priorizamos a conexão de moradores da região Itaqui-Bacanga às empresas locais e do eixo
            portuário, mantendo o portal aberto a toda São Luís.
          </p>
        </div>
        <div className="border border-[#DCE7EF] rounded-[16px] p-6 bg-[#F3F8FC]">
          <h2 className="font-heading text-xl font-bold text-[#0A7B36] mb-2">
            Integração futura ao Parque Tecnológico
          </h2>
          <p className="text-sm text-[#66788A] leading-relaxed">
            Construído com o Design System oficial do Parque Tecnológico de São Luís para atuar como
            serviço integrado à futura plataforma institucional do Parque.
          </p>
        </div>
      </div>
    </div>
  );
}
