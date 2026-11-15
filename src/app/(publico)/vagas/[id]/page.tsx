'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import type { ResultadoMatch } from '@/types/farol';
import type { VagaRecord } from '@/server/infrastructure/repositories/FarolDataStore';

export default function VagaDetalhePage() {
  const params = useParams<{ id: string }>();
  const [vaga, setVaga] = useState<VagaRecord | null>(null);
  const [match, setMatch] = useState<ResultadoMatch | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    fetch(`/api/vagas/${params.id}`)
      .then((r) => r.json())
      .then((res) => setVaga(res?.data?.vaga ?? null));

    fetch(`/api/vagas/${params.id}/match`)
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res?.data?.match) setMatch(res.data.match);
      })
      .catch(() => null);
  }, [params.id]);

  async function candidatar() {
    setEnviando(true);
    setErro(null);
    setMensagem(null);
    try {
      const resp = await fetch(`/api/vagas/${params.id}/candidatar`, { method: 'POST' });
      const json = await resp.json();
      if (!resp.ok) {
        if (resp.status === 401) {
          window.location.href = `/entrar?next=/vagas/${params.id}`;
          return;
        }
        setErro(json?.error?.message ?? 'Não foi possível concluir a candidatura.');
      } else {
        setMensagem('Sua candidatura foi registrada com sucesso!');
      }
    } finally {
      setEnviando(false);
    }
  }

  if (!vaga) {
    return (
      <div className="max-w-[900px] mx-auto px-4 py-12">
        <p className="text-sm text-[#66788A]">Carregando detalhes da vaga...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-10 space-y-6">
      <Link href="/vagas" className="inline-flex items-center gap-1 text-sm font-bold text-[#0162A7]">
        <ArrowLeft className="w-4 h-4" /> Voltar para vagas
      </Link>

      <div className="border border-[#DCE7EF] rounded-[16px] p-6 sm:p-8 bg-white space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EFF7FC] text-[#0162A7]">
            {vaga.modalidade} · {vaga.tipoContratacao}
          </span>
          {vaga.seloSimulado && (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FFF9E6] text-[#8E6416] border border-[#F0E3BF]">
              Exemplo / Simulado
            </span>
          )}
        </div>

        <h1 className="font-heading text-3xl font-extrabold text-[#0B2540]">{vaga.titulo}</h1>
        <p className="text-sm font-semibold text-[#66788A]">
          {vaga.empresaNome} · {vaga.bairro}, {vaga.municipio} – MA
        </p>

        <p className="text-base text-[#0B2540] leading-relaxed pt-2">{vaga.descricao}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#DCE7EF]">
          <div>
            <h3 className="font-heading font-bold text-sm text-[#0B2540] mb-2">
              Requisitos Obrigatórios (70% do score)
            </h3>
            <ul className="space-y-1 text-sm text-[#66788A]">
              {vaga.escolaridadeMinima && <li>• Escolaridade: {vaga.escolaridadeMinima}</li>}
              {vaga.requisitos
                .filter((r) => r.obrigatorio)
                .map((r, i) => (
                  <li key={i}>• {r.nome}</li>
                ))}
            </ul>
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-[#0B2540] mb-2">
              Requisitos Desejáveis (30% do score)
            </h3>
            <ul className="space-y-1 text-sm text-[#66788A]">
              {vaga.requisitos
                .filter((r) => !r.obrigatorio)
                .map((r, i) => (
                  <li key={i}>• {r.nome}</li>
                ))}
            </ul>
          </div>
        </div>

        {match && (
          <div className="mt-6 bg-[#F3F8FC] border border-[#D1E3EF] rounded-[16px] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <strong className="font-heading text-base text-[#0162A7]">
                Sua compatibilidade técnica (visível apenas para você)
              </strong>
              <span className="font-heading text-2xl font-extrabold text-[#0A7B36]">
                {match.percentual}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-[#DCE7EF]">
              <div
                className="h-full bg-[#0A7B36]"
                style={{ width: `${match.percentual}%` }}
              />
            </div>
            <p className="text-xs text-[#66788A]">
              Nota: Localização e distância não entram no cálculo numérico do score técnico.
            </p>

            {match.atendidos.length > 0 && (
              <div className="text-sm text-[#0A7B36] space-y-1">
                {match.atendidos.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> Atende: {item}
                  </div>
                ))}
              </div>
            )}

            {match.naoIdentificados.length > 0 && (
              <div className="text-sm text-[#8E6416] space-y-1">
                {match.naoIdentificados.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> Falta ({item.obrigatorio ? 'obrigatório' : 'desejável'}): {item.item}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {mensagem && (
          <div className="p-4 rounded-[12px] bg-[#EAF7F0] text-[#0A7B36] text-sm font-bold">
            {mensagem}
          </div>
        )}
        {erro && (
          <div className="p-4 rounded-[12px] bg-[#FCF1F0] text-[#B53832] text-sm font-bold">
            {erro}
          </div>
        )}

        <div className="pt-4">
          <button
            onClick={candidatar}
            disabled={enviando}
            className="min-h-[45px] px-7 rounded-[12px] bg-[#FADC00] text-[#0B2540] font-bold text-sm hover:bg-[#E8CB00] disabled:opacity-50"
          >
            {enviando ? 'Registrando...' : 'Candidatar-me a esta vaga'}
          </button>
        </div>
      </div>
    </div>
  );
}
