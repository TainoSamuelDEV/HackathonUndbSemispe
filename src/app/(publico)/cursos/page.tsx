'use client';

import { useEffect, useState } from 'react';
import type { CursoRecord } from '@/server/infrastructure/repositories/FarolDataStore';

export default function CursosPage() {
  const [cursos, setCursos] = useState<CursoRecord[]>([]);
  const [temaPedido, setTemaPedido] = useState('');
  const [bairroPedido, setBairroPedido] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/cursos')
      .then((r) => r.json())
      .then((res) => setCursos(res?.data?.cursos ?? []));
  }, []);

  async function enviarPedido(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    const resp = await fetch('/api/cursos/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        temaDesejado: temaPedido,
        bairro: bairroPedido || 'Itaqui-Bacanga',
      }),
    });
    if (resp.status === 401) {
      window.location.href = '/entrar?next=/cursos';
      return;
    }
    if (resp.ok) {
      setTemaPedido('');
      setBairroPedido('');
      setFeedback('Seu interesse foi registrado para a SEMISPE. Isso ainda não é uma matrícula.');
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div>
        <span className="text-xs font-extrabold uppercase tracking-wider text-[#0A7B36]">
          Qualificação Profissional
        </span>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#0B2540] mt-1">
          Cursos gratuitos da SEMISPE
        </h1>
        <p className="text-sm text-[#66788A] mt-2 max-w-[680px]">
          Turmas programadas exigem solicitação sujeita à confirmação da SEMISPE. Cursos sob demanda
          registram seu interesse para abertura de futuras turmas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cursos.map((curso) => (
          <div key={curso.id} className="border border-[#DCE7EF] rounded-[16px] p-6 bg-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    curso.tipo === 'PROGRAMADO'
                      ? 'bg-[#EAF7F0] text-[#0A7B36]'
                      : 'bg-[#F3F5F8] text-[#64758A]'
                  }`}
                >
                  {curso.tipo === 'PROGRAMADO' ? 'Turma programada' : 'Sob demanda (sem data)'}
                </span>
                <span className="text-xs font-bold text-[#66788A]">{curso.cargaHoraria}h</span>
              </div>
              <h2 className="font-heading text-xl font-bold text-[#0B2540] mb-1">{curso.titulo}</h2>
              <p className="text-xs font-semibold text-[#66788A] mb-3">{curso.instituicao}</p>
              <p className="text-sm text-[#66788A] mb-4">{curso.descricao}</p>
            </div>
            <div className="text-xs text-[#0162A7] font-bold">
              {curso.turmas.length > 0
                ? `Turma ${curso.turmas[0].codigoTurma} · ${curso.turmas[0].localBairro}`
                : 'Aguardando formação de demanda'}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#F3F8FC] border border-[#DCE7EF] rounded-[16px] p-6 sm:p-8">
        <h2 className="font-heading text-2xl font-bold text-[#0B2540] mb-2">
          Não encontrou o curso que precisa? Peça aqui
        </h2>
        <p className="text-sm text-[#66788A] mb-4">
          Quanto mais pessoas pedirem o mesmo tema, maior a prioridade no painel da SEMISPE.
        </p>

        <form onSubmit={enviarPedido} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            required
            value={temaPedido}
            onChange={(e) => setTemaPedido(e.target.value)}
            placeholder="Tema desejado (ex: Operador de Empilhadeira)"
            className="bg-white border border-[#DCE7EF] rounded-[12px] px-3.5 py-2.5 text-sm"
          />
          <input
            value={bairroPedido}
            onChange={(e) => setBairroPedido(e.target.value)}
            placeholder="Seu bairro (ex: Anjo da Guarda)"
            className="bg-white border border-[#DCE7EF] rounded-[12px] px-3.5 py-2.5 text-sm"
          />
          <button
            type="submit"
            className="min-h-[44px] rounded-[12px] bg-[#0A7B36] text-white font-bold text-sm hover:bg-[#086A2F]"
          >
            Registrar pedido de curso
          </button>
        </form>
        {feedback && (
          <p className="mt-3 text-sm font-bold text-[#0A7B36]">{feedback}</p>
        )}
      </div>
    </div>
  );
}
