'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { CandidatoRecord } from '@/server/infrastructure/repositories/FarolDataStore';

interface CandidaturaItem {
  id: string;
  status: string;
  scoreCalculado: number | null;
  vaga: { id: string; titulo: string; empresaNome: string } | null;
}

export default function PainelCandidatoPage() {
  const [perfil, setPerfil] = useState<CandidatoRecord | null>(null);
  const [candidaturas, setCandidaturas] = useState<CandidaturaItem[]>([]);
  const [competenciasInput, setCompetenciasInput] = useState('');
  const [salvoMsg, setSalvoMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/candidato/curriculo')
      .then((r) => {
        if (r.status === 401) window.location.href = '/entrar';
        return r.json();
      })
      .then((res) => {
        const p = res?.data?.perfil;
        if (p) {
          setPerfil(p);
          setCompetenciasInput((p.competencias ?? []).join(', '));
        }
      });

    fetch('/api/candidato/candidaturas')
      .then((r) => r.json())
      .then((res) => setCandidaturas(res?.data?.candidaturas ?? []));
  }, []);

  async function salvarCompetencias(e: React.FormEvent) {
    e.preventDefault();
    setSalvoMsg(null);
    const competencias = competenciasInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const resp = await fetch('/api/candidato/curriculo', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ competencias }),
    });
    if (resp.ok) {
      const json = await resp.json();
      setPerfil(json.data.perfil);
      setSalvoMsg('Perfil estruturado atualizado! Seu score nas vagas foi recalculado.');
    }
  }

  if (!perfil) {
    return (
      <div className="max-w-[1000px] mx-auto px-4 py-12 text-sm text-[#66788A]">
        Carregando seu painel...
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#0162A7]">
            Área do Candidato
          </span>
          <h1 className="font-heading text-3xl font-extrabold text-[#0B2540]">
            Olá, {perfil.nomeExibicao}
          </h1>
          <p className="text-sm text-[#66788A]">
            {perfil.bairro}, {perfil.municipio} · Escolaridade: {perfil.escolaridade ?? 'Não informada'}
          </p>
        </div>
        <Link
          href="/vagas"
          className="min-h-[44px] inline-flex items-center px-5 rounded-[12px] bg-[#FADC00] text-[#0B2540] font-bold text-sm"
        >
          Explorar vagas compatíveis
        </Link>
      </div>

      <div className="border border-[#DCE7EF] rounded-[16px] p-6 bg-white space-y-4">
        <h2 className="font-heading text-xl font-bold text-[#0B2540]">
          Meu Currículo Estruturado (Fonte do Match)
        </h2>
        <p className="text-sm text-[#66788A]">{perfil.resumoProfissional}</p>

        <form onSubmit={salvarCompetencias} className="space-y-3">
          <label className="block text-xs font-bold text-[#0B2540]">
            Competências e Certificações (separadas por vírgula)
          </label>
          <input
            value={competenciasInput}
            onChange={(e) => setCompetenciasInput(e.target.value)}
            className="w-full border border-[#DCE7EF] rounded-[12px] px-3.5 py-2.5 text-sm"
          />
          <button
            type="submit"
            className="min-h-[42px] px-5 rounded-[12px] bg-[#0162A7] text-white text-sm font-bold"
          >
            Salvar currículo
          </button>
          {salvoMsg && <p className="text-xs font-bold text-[#0A7B36]">{salvoMsg}</p>}
        </form>
      </div>

      <div className="border border-[#DCE7EF] rounded-[16px] p-6 bg-white space-y-4">
        <h2 className="font-heading text-xl font-bold text-[#0B2540]">Minhas Candidaturas</h2>
        {candidaturas.length === 0 ? (
          <p className="text-sm text-[#66788A]">Você ainda não se candidatou a nenhuma vaga.</p>
        ) : (
          <div className="space-y-3">
            {candidaturas.map((c) => (
              <div
                key={c.id}
                className="border border-[#DCE7EF] rounded-[12px] p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <strong className="text-sm text-[#0B2540] block">
                    {c.vaga?.titulo ?? 'Vaga'}
                  </strong>
                  <span className="text-xs text-[#66788A]">{c.vaga?.empresaNome}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EFF7FC] text-[#0162A7]">
                    {c.status}
                  </span>
                  {c.scoreCalculado !== null && (
                    <span className="block text-[11px] font-bold text-[#0A7B36] mt-1">
                      Seu match: {c.scoreCalculado}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
