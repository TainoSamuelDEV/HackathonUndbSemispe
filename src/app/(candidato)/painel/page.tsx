'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, Eye, FileText, Sparkles } from 'lucide-react';
import type { CandidatoRecord } from '@/server/infrastructure/repositories/FarolDataStore';
import type { CurriculoArquivoMetadata } from '@/server/domain/curriculo/CurriculoPadrao';
import type { NivelEscolaridade } from '@/types/farol';
import { ListaPainelSkeleton, PainelCandidatoSkeleton } from '@/components/skeletons/PainelSkeletons';
import { EstadoErroCarregamento } from '@/components/layout/EstadoErroCarregamento';

interface CandidaturaItem {
  id: string;
  status: string;
  scoreCalculado: number | null;
  vaga: { id: string; titulo: string; empresaNome: string } | null;
}

const OPCOES_ESCOLARIDADE: Array<{ value: NivelEscolaridade; label: string }> = [
  { value: 'FUNDAMENTAL_INCOMPLETO', label: 'Fundamental incompleto' },
  { value: 'FUNDAMENTAL_COMPLETO', label: 'Fundamental completo' },
  { value: 'MEDIO_INCOMPLETO', label: 'Médio incompleto' },
  { value: 'MEDIO_COMPLETO', label: 'Médio completo' },
  { value: 'TECNICO', label: 'Técnico' },
  { value: 'SUPERIOR_INCOMPLETO', label: 'Superior incompleto' },
  { value: 'SUPERIOR_COMPLETO', label: 'Superior completo' },
];

function rotuloOrigemArquivo(arquivo: CurriculoArquivoMetadata): string {
  const canal = arquivo.dadosExtraidosJson?.canalOrigem;
  if (arquivo.origem === 'GERADO_SISTEMA' && canal === 'WHATSAPP') {
    return 'Gerado pela IA no WhatsApp';
  }
  if (arquivo.origem === 'GERADO_SISTEMA') {
    return 'Gerado no Portal FAROL';
  }
  return 'Enviado pelo candidato';
}

function formatarDataPtBr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export default function PainelCandidatoPage() {
  const [perfil, setPerfil] = useState<CandidatoRecord | null>(null);
  const [erroPerfil, setErroPerfil] = useState(false);
  /** null enquanto carrega. */
  const [candidaturas, setCandidaturas] = useState<CandidaturaItem[] | null>(null);
  const [arquivosCurriculo, setArquivosCurriculo] = useState<CurriculoArquivoMetadata[]>([]);

  const [escolaridade, setEscolaridade] = useState<NivelEscolaridade | ''>('');
  const [areaInteresse, setAreaInteresse] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [resumoProfissional, setResumoProfissional] = useState('');
  const [disponibilidade, setDisponibilidade] = useState('');
  const [competenciasInput, setCompetenciasInput] = useState('');

  const [salvando, setSalvando] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [salvoMsg, setSalvoMsg] = useState<string | null>(null);
  const [erroMsg, setErroMsg] = useState<string | null>(null);

  const preencherFormulario = useCallback((p: CandidatoRecord) => {
    setEscolaridade(p.escolaridade ?? '');
    setAreaInteresse(p.areaInteresse ?? '');
    setObjetivo(p.objetivo ?? '');
    setResumoProfissional(p.resumoProfissional ?? '');
    setDisponibilidade(p.disponibilidade ?? '');
    setCompetenciasInput((p.competencias ?? []).join(', '));
  }, []);

  const carregar = useCallback(() => {
    setErroPerfil(false);
    setPerfil(null);
    setCandidaturas(null);

    fetch('/api/candidato/curriculo')
      .then((r) => {
        if (r.status === 401) {
          window.location.href = '/entrar?next=/painel';
          return null;
        }
        return r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`));
      })
      .then((res) => {
        if (!res) return;
        const p = res?.data?.perfil as CandidatoRecord | undefined;
        if (!p) throw new Error('Perfil ausente na resposta');
        setPerfil(p);
        preencherFormulario(p);
        setArquivosCurriculo(res?.data?.arquivosCurriculo ?? []);
      })
      .catch(() => setErroPerfil(true));

    fetch('/api/candidato/candidaturas')
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => setCandidaturas(res?.data?.candidaturas ?? []))
      .catch(() => setCandidaturas([]));
  }, [preencherFormulario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function salvarPerfil(e: React.FormEvent) {
    e.preventDefault();
    setSalvoMsg(null);
    setErroMsg(null);
    setSalvando(true);

    const competencias = competenciasInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const resp = await fetch('/api/candidato/curriculo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escolaridade: escolaridade || null,
          areaInteresse: areaInteresse.trim() || null,
          objetivo: objetivo.trim() || null,
          resumoProfissional: resumoProfissional.trim() || null,
          disponibilidade: disponibilidade.trim() || null,
          competencias,
        }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        setErroMsg(json?.error?.message ?? 'Não foi possível salvar seu perfil.');
        return;
      }
      setPerfil(json.data.perfil);
      preencherFormulario(json.data.perfil);
      setSalvoMsg('Perfil estruturado atualizado! Seu score nas vagas foi recalculado.');
    } catch {
      setErroMsg('Erro de conexão ao salvar seu perfil.');
    } finally {
      setSalvando(false);
    }
  }

  async function gerarCurriculoPadrao() {
    setSalvoMsg(null);
    setErroMsg(null);
    setGerandoPdf(true);
    try {
      const resp = await fetch('/api/candidato/curriculo/gerar', {
        method: 'POST',
      });
      const json = await resp.json();
      if (!resp.ok) {
        setErroMsg(json?.error?.message ?? 'Não foi possível gerar o currículo em PDF.');
        return;
      }
      const novoArquivo = json?.data?.arquivo as CurriculoArquivoMetadata | undefined;
      if (novoArquivo) {
        setArquivosCurriculo((prev) => [novoArquivo, ...prev.filter((a) => a.id !== novoArquivo.id)]);
      }
      setSalvoMsg('Currículo Modelo Padrão FAROL (PDF) gerado e anexado ao seu painel!');
    } catch {
      setErroMsg('Falha ao gerar o currículo padrão em PDF.');
    } finally {
      setGerandoPdf(false);
    }
  }

  if (erroPerfil) {
    return (
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-10">
        <EstadoErroCarregamento mensagem="Não foi possível carregar seu painel." onTentarNovamente={carregar} />
      </div>
    );
  }

  if (!perfil) {
    return <PainelCandidatoSkeleton />;
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

      {/* Cartão: Currículo Modelo Padrão FAROL (Anexado no Painel) */}
      <div className="border border-[#DCE7EF] rounded-[16px] p-6 bg-white space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0A7B36] bg-[#EAF7F0] px-2.5 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              Modelo Padrão FAROL
            </span>
            <h2 className="font-heading text-xl font-bold text-[#0B2540] mt-2">
              Currículo Modelo Padrão FAROL (Anexado)
            </h2>
            <p className="text-sm text-[#66788A]">
              Currículos gerados pela IA no WhatsApp ou aqui no portal ficam anexados automaticamente em PDF para baixar quando quiser.
            </p>
          </div>
          <button
            type="button"
            onClick={gerarCurriculoPadrao}
            disabled={gerandoPdf}
            className="min-h-[42px] px-4 rounded-[12px] bg-[#0B2540] text-white text-sm font-bold hover:bg-[#14375C] disabled:opacity-50 inline-flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {gerandoPdf ? 'Gerando PDF...' : 'Gerar / Atualizar Currículo Padrão (PDF)'}
          </button>
        </div>

        {arquivosCurriculo.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-[#DCE7EF] bg-[#F8FBFD] p-4 text-sm text-[#66788A]">
            Nenhum currículo PDF anexado ainda. Clique no botão acima ou peça para a IA FAROL gerar seu currículo pelo WhatsApp!
          </div>
        ) : (
          <div className="space-y-3">
            {arquivosCurriculo.map((arq) => (
              <div
                key={arq.id}
                className="border border-[#DCE7EF] rounded-[12px] p-4 flex flex-wrap items-center justify-between gap-3 bg-[#FBFDFF]"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-[10px] bg-[#EFF7FC] text-[#0162A7] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="text-sm text-[#0B2540] block">{arq.nomeArquivo}</strong>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EAF7F0] text-[#0A7B36]">
                        {rotuloOrigemArquivo(arq)}
                      </span>
                      {arq.criadoEm && (
                        <span className="text-xs text-[#66788A]">
                          Gerado em {formatarDataPtBr(arq.criadoEm)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`${arq.arquivoUrl}?view=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[38px] px-3.5 rounded-[10px] border border-[#DCE7EF] text-xs font-bold text-[#0B2540] hover:bg-[#EFF7FC] inline-flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Visualizar PDF
                  </a>
                  <a
                    href={arq.arquivoUrl}
                    download={arq.nomeArquivo}
                    className="min-h-[38px] px-3.5 rounded-[10px] bg-[#0162A7] text-white text-xs font-bold hover:bg-[#015089] inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar PDF
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cartão: Currículo Estruturado */}
      <div className="border border-[#DCE7EF] rounded-[16px] p-6 bg-white space-y-5">
        <div>
          <h2 className="font-heading text-xl font-bold text-[#0B2540]">
            Meu Currículo Estruturado (Fonte do Match)
          </h2>
          <p className="text-sm text-[#66788A]">
            Mantenha seus dados atualizados para melhorar o cálculo de compatibilidade com as vagas de São Luís.
          </p>
        </div>

        <form onSubmit={salvarPerfil} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0B2540] mb-1">Escolaridade</label>
              <select
                value={escolaridade}
                onChange={(e) => setEscolaridade(e.target.value as NivelEscolaridade | '')}
                className="w-full border border-[#DCE7EF] rounded-[12px] px-3.5 py-2.5 text-sm bg-white"
              >
                <option value="">Selecione sua escolaridade</option>
                {OPCOES_ESCOLARIDADE.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0B2540] mb-1">Área de interesse</label>
              <input
                value={areaInteresse}
                onChange={(e) => setAreaInteresse(e.target.value)}
                placeholder="Ex: Logística, Manutenção, Atendimento..."
                className="w-full border border-[#DCE7EF] rounded-[12px] px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0B2540] mb-1">Objetivo profissional</label>
              <input
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value)}
                placeholder="Ex: Atuar como auxiliar de logística no Itaqui-Bacanga"
                className="w-full border border-[#DCE7EF] rounded-[12px] px-3.5 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0B2540] mb-1">Disponibilidade</label>
              <input
                value={disponibilidade}
                onChange={(e) => setDisponibilidade(e.target.value)}
                placeholder="Ex: Horário comercial, turnos, imediata"
                className="w-full border border-[#DCE7EF] rounded-[12px] px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0B2540] mb-1">Resumo profissional</label>
            <textarea
              rows={3}
              value={resumoProfissional}
              onChange={(e) => setResumoProfissional(e.target.value)}
              placeholder="Conte brevemente sua experiência (inclua trabalhos formais, autônomos ou bicos)."
              className="w-full border border-[#DCE7EF] rounded-[12px] px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0B2540] mb-1">
              Competências e Certificações (separadas por vírgula)
            </label>
            <input
              value={competenciasInput}
              onChange={(e) => setCompetenciasInput(e.target.value)}
              placeholder="Ex: Atendimento ao público, Pacote Office, Controle de estoque"
              className="w-full border border-[#DCE7EF] rounded-[12px] px-3.5 py-2.5 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={salvando}
              className="min-h-[42px] px-5 rounded-[12px] bg-[#0162A7] text-white text-sm font-bold disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Salvar currículo'}
            </button>
            {salvoMsg && <p className="text-xs font-bold text-[#0A7B36]">{salvoMsg}</p>}
            {erroMsg && <p className="text-xs font-bold text-[#B91C1C]">{erroMsg}</p>}
          </div>
        </form>

        {perfil.experiencias && perfil.experiencias.length > 0 && (
          <div className="pt-4 border-t border-[#DCE7EF] space-y-2.5">
            <h3 className="text-sm font-bold text-[#0B2540]">
              Experiências registradas ({perfil.experiencias.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {perfil.experiencias.map((exp) => (
                <div
                  key={exp.id}
                  className="border border-[#DCE7EF] rounded-[12px] p-3.5 bg-[#F8FBFD]"
                >
                  <strong className="text-sm text-[#0B2540] block">{exp.cargoAtividade}</strong>
                  <span className="text-xs text-[#66788A] block mt-0.5">
                    {[
                      exp.empresaOuContexto,
                      exp.trabalhoInformal ? 'Atividade informal/autônoma' : null,
                      exp.periodo,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Experiência informada'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cartão: Minhas Candidaturas */}
      <div className="border border-[#DCE7EF] rounded-[16px] p-6 bg-white space-y-4">
        <h2 className="font-heading text-xl font-bold text-[#0B2540]">Minhas Candidaturas</h2>
        {candidaturas === null ? (
          <div role="status" aria-label="Carregando candidaturas">
            <ListaPainelSkeleton quantidade={2} />
          </div>
        ) : candidaturas.length === 0 ? (
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
