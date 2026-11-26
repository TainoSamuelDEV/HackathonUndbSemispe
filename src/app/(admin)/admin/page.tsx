'use client';

import { useCallback, useEffect, useState } from 'react';
import { PainelAdminSkeleton } from '@/components/skeletons/PainelSkeletons';
import { EstadoErroCarregamento } from '@/components/layout/EstadoErroCarregamento';

interface DashboardSemispe {
  totais: {
    candidatos: number;
    empresas: number;
    vagasAtivas: number;
    candidaturas: number;
    cursos: number;
    pedidosCurso: number;
    atendimentosHumanosPendentes: number;
  };
  rankingPedidos: Array<{
    tema: string;
    totalPedidos: number;
    bairros: string[];
  }>;
}

export default function PainelAdminSemispePage() {
  const [dados, setDados] = useState<DashboardSemispe | null>(null);
  const [erro, setErro] = useState(false);

  const carregar = useCallback(() => {
    setErro(false);
    setDados(null);
    fetch('/api/admin/dashboard')
      .then((r) => {
        if (r.status === 401) {
          window.location.href = '/entrar?next=/admin';
          return null;
        }
        return r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`));
      })
      .then((res) => {
        if (!res) return;
        const dashboard = res?.data?.dashboard;
        if (!dashboard) throw new Error('Painel ausente na resposta');
        setDados(dashboard);
      })
      .catch(() => setErro(true));
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (erro) {
    return (
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10">
        <EstadoErroCarregamento mensagem="Não foi possível carregar o painel SEMISPE." onTentarNovamente={carregar} />
      </div>
    );
  }

  if (!dados) {
    return <PainelAdminSkeleton />;
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <span className="text-xs font-extrabold uppercase tracking-wider text-[#0A7B36]">
          Administração SEMISPE
        </span>
        <h1 className="font-heading text-3xl font-extrabold text-[#0B2540]">
          Painel Executivo FAROL
        </h1>
        <p className="text-sm text-[#66788A]">
          Dados consolidados em tempo real do Portal Web e da IA FAROL (WhatsApp / Evolution API).
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Candidatos', valor: dados.totais.candidatos },
          { label: 'Empresas', valor: dados.totais.empresas },
          { label: 'Vagas Ativas', valor: dados.totais.vagasAtivas },
          { label: 'Pedidos de Curso', valor: dados.totais.pedidosCurso },
        ].map((card) => (
          <div key={card.label} className="border border-[#DCE7EF] rounded-[16px] p-5 bg-white">
            <span className="text-xs font-bold text-[#66788A] uppercase">{card.label}</span>
            <p className="font-heading text-3xl font-extrabold text-[#0162A7] mt-1">
              {card.valor}
            </p>
          </div>
        ))}
      </div>

      <div className="border border-[#DCE7EF] rounded-[16px] p-4 sm:p-6 bg-white space-y-4">
        <h2 className="font-heading text-lg sm:text-xl font-bold text-[#0B2540]">
          Ranking de Demanda por Novos Cursos (Portal + WhatsApp)
        </h2>
        <div className="space-y-3">
          {dados.rankingPedidos.map((item, idx) => (
            <div
              key={idx}
              className="border border-[#DCE7EF] rounded-[12px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <strong className="text-sm text-[#0B2540] break-words">{item.tema}</strong>
                <p className="text-xs text-[#66788A]">
                  Bairros interessados: {item.bairros.join(', ') || 'Não informado'}
                </p>
              </div>
              <span className="font-heading font-extrabold text-base sm:text-lg text-[#0A7B36] shrink-0">
                {item.totalPedidos} {item.totalPedidos === 1 ? 'pedido' : 'pedidos'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
