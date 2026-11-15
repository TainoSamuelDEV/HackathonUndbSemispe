'use client';

import { useEffect, useState } from 'react';
import type { VagaRecord } from '@/server/infrastructure/repositories/FarolDataStore';

export default function PainelEmpresaPage() {
  const [vagas, setVagas] = useState<VagaRecord[]>([]);
  const [titulo, setTitulo] = useState('');
  const [area, setArea] = useState('Manutenção e mecânica');
  const [bairro, setBairro] = useState('Itaqui-Bacanga');
  const [descricao, setDescricao] = useState('');
  const [reqObrig, setReqObrig] = useState('');
  const [mensagem, setMensagem] = useState<string | null>(null);

  function carregar() {
    fetch('/api/empresa/vagas')
      .then((r) => {
        if (r.status === 401) window.location.href = '/entrar';
        return r.json();
      })
      .then((res) => setVagas(res?.data?.vagas ?? []));
  }

  useEffect(() => {
    carregar();
  }, []);

  async function publicar(e: React.FormEvent) {
    e.preventDefault();
    setMensagem(null);
    const requisitos = reqObrig
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((nome) => ({ nome, tipo: 'CONHECIMENTO' as const, obrigatorio: true }));

    const resp = await fetch('/api/empresa/vagas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo,
        area,
        bairro,
        descricao,
        modalidade: 'PRESENCIAL',
        tipoContratacao: 'CLT',
        quantidadeVagas: 1,
        escolaridadeMinima: 'MEDIO_COMPLETO',
        requisitos,
      }),
    });
    if (resp.ok) {
      setTitulo('');
      setDescricao('');
      setReqObrig('');
      setMensagem('Vaga publicada no catálogo público e sincronizada com a IA FAROL!');
      carregar();
    }
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <span className="text-xs font-extrabold uppercase tracking-wider text-[#0162A7]">
          Painel da Empresa
        </span>
        <h1 className="font-heading text-3xl font-extrabold text-[#0B2540]">
          Gestão de Vagas e Candidaturas
        </h1>
        <p className="text-sm text-[#66788A]">
          Por regra de transparência do FAROL, empresas não visualizam o score numérico dos candidatos.
        </p>
      </div>

      <form
        onSubmit={publicar}
        className="border border-[#DCE7EF] rounded-[16px] p-6 bg-white space-y-4"
      >
        <h2 className="font-heading text-xl font-bold text-[#0B2540]">Publicar Nova Vaga</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título do cargo"
            className="border border-[#DCE7EF] rounded-[12px] px-3.5 py-2.5 text-sm"
          />
          <input
            required
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Área"
            className="border border-[#DCE7EF] rounded-[12px] px-3.5 py-2.5 text-sm"
          />
          <input
            required
            value={bairro}
            onChange={(e) => setBairro(e.target.value)}
            placeholder="Bairro"
            className="border border-[#DCE7EF] rounded-[12px] px-3.5 py-2.5 text-sm"
          />
        </div>
        <textarea
          required
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descrição das atividades..."
          rows={3}
          className="w-full border border-[#DCE7EF] rounded-[12px] px-3.5 py-2.5 text-sm"
        />
        <input
          value={reqObrig}
          onChange={(e) => setReqObrig(e.target.value)}
          placeholder="Requisitos obrigatórios separados por vírgula (ex: Soldagem básica, Experiência em oficina)"
          className="w-full border border-[#DCE7EF] rounded-[12px] px-3.5 py-2.5 text-sm"
        />
        <button
          type="submit"
          className="w-full sm:w-auto min-h-[44px] px-6 rounded-[12px] bg-[#0162A7] text-white font-bold text-sm"
        >
          Publicar vaga
        </button>
        {mensagem && <p className="text-xs font-bold text-[#0A7B36]">{mensagem}</p>}
      </form>

      <div className="border border-[#DCE7EF] rounded-[16px] p-4 sm:p-6 bg-white space-y-3">
        <h2 className="font-heading text-xl font-bold text-[#0B2540]">Minhas Vagas Publicadas</h2>
        {vagas.map((v) => (
          <div key={v.id} className="border border-[#DCE7EF] rounded-[12px] p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div className="min-w-0">
              <strong className="text-sm text-[#0B2540] break-words">{v.titulo}</strong>
              <p className="text-xs text-[#66788A]">
                {v.bairro} · {v.modalidade}
              </p>
            </div>
            <span className="self-start sm:self-auto text-xs font-bold px-3 py-1 rounded-full bg-[#EAF7F0] text-[#0A7B36] shrink-0">
              {v.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
