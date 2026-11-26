'use client';

import { useCallback, useEffect, useState } from 'react';
import type { VagaRecord } from '@/server/infrastructure/repositories/FarolDataStore';
import { capaDaVaga, urlCapaValida } from '@/lib/capaVaga';
import { CapaImagem } from '@/components/cards/CapaImagem';
import { ListaPainelSkeleton } from '@/components/skeletons/PainelSkeletons';
import { EstadoErroCarregamento } from '@/components/layout/EstadoErroCarregamento';

export default function PainelEmpresaPage() {
  /** null enquanto carrega. */
  const [vagas, setVagas] = useState<VagaRecord[] | null>(null);
  const [erroVagas, setErroVagas] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [area, setArea] = useState('Manutenção e mecânica');
  const [bairro, setBairro] = useState('Itaqui-Bacanga');
  const [descricao, setDescricao] = useState('');
  const [reqObrig, setReqObrig] = useState('');
  const [imagemCapaUrl, setImagemCapaUrl] = useState('');
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const urlCapaDigitada = imagemCapaUrl.trim();
  const urlCapaInvalida = urlCapaDigitada !== '' && !/^https:\/\/\S+$/i.test(urlCapaDigitada);
  const capaPrevia = capaDaVaga({
    imagemCapaUrl: !urlCapaInvalida && urlCapaValida(urlCapaDigitada) ? urlCapaDigitada : null,
    area,
    titulo,
  });

  /** Busca as vagas da empresa. Sem `manterLista`, mostra o skeleton durante a busca. */
  const carregar = useCallback((manterLista = false) => {
    setErroVagas(false);
    if (!manterLista) setVagas(null);
    fetch('/api/empresa/vagas')
      .then((r) => {
        if (r.status === 401) {
          window.location.href = '/entrar?next=/empresa';
          return null;
        }
        return r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`));
      })
      .then((res) => {
        if (res) setVagas(res?.data?.vagas ?? []);
      })
      .catch(() => setErroVagas(true));
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function publicar(e: React.FormEvent) {
    e.preventDefault();
    setMensagem(null);
    setErro(null);
    if (urlCapaInvalida) {
      setErro('A imagem de capa precisa ser um endereço começando com https://');
      return;
    }
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
        imagemCapaUrl: urlCapaDigitada || null,
        requisitos,
      }),
    });
    if (resp.ok) {
      setTitulo('');
      setDescricao('');
      setReqObrig('');
      setImagemCapaUrl('');
      setMensagem('Vaga publicada no catálogo público e sincronizada com a IA FAROL!');
      carregar(true);
    } else {
      const json = await resp.json().catch(() => null);
      const erroCapa = json?.error?.details?.fieldErrors?.imagemCapaUrl?.[0];
      setErro(erroCapa ?? json?.error?.message ?? 'Não foi possível publicar a vaga.');
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

        {/* Imagem de capa (opcional) com prévia */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-3 items-start">
          <div className="space-y-1.5">
            <label htmlFor="vaga-capa" className="block text-xs font-bold text-[#0B2540]">
              Imagem de capa (opcional)
            </label>
            <input
              id="vaga-capa"
              type="url"
              inputMode="url"
              value={imagemCapaUrl}
              onChange={(e) => setImagemCapaUrl(e.target.value)}
              placeholder="https://..."
              aria-invalid={urlCapaInvalida}
              aria-describedby="vaga-capa-ajuda"
              className={`w-full border rounded-[12px] px-3.5 py-2.5 text-sm ${
                urlCapaInvalida ? 'border-[#B53832]' : 'border-[#DCE7EF]'
              }`}
            />
            <p id="vaga-capa-ajuda" className={`text-xs ${urlCapaInvalida ? 'text-[#B53832]' : 'text-[#66788A]'}`}>
              {urlCapaInvalida
                ? 'Use um endereço que comece com https://'
                : 'Sem imagem, a vaga usa automaticamente uma foto da área informada.'}
            </p>
          </div>
          <div className="relative aspect-video rounded-[12px] overflow-hidden bg-[#0B2540]">
            <CapaImagem src={capaPrevia.src} fallback={capaPrevia.fallback} />
            <span className="absolute left-2 bottom-2 px-2 py-0.5 rounded-full bg-white/90 text-[10px] font-bold text-[#0B2540]">
              Prévia da capa
            </span>
          </div>
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto min-h-[44px] px-6 rounded-[12px] bg-[#0162A7] text-white font-bold text-sm"
        >
          Publicar vaga
        </button>
        {mensagem && <p className="text-xs font-bold text-[#0A7B36]">{mensagem}</p>}
        {erro && <p className="text-xs font-bold text-[#B53832]">{erro}</p>}
      </form>

      <div className="border border-[#DCE7EF] rounded-[16px] p-4 sm:p-6 bg-white space-y-3">
        <h2 className="font-heading text-xl font-bold text-[#0B2540]">Minhas Vagas Publicadas</h2>
        {erroVagas && (
          <EstadoErroCarregamento mensagem="Não foi possível carregar suas vagas." onTentarNovamente={() => carregar()} />
        )}
        {!erroVagas && vagas === null && (
          <div role="status" aria-label="Carregando suas vagas">
            <ListaPainelSkeleton quantidade={2} />
          </div>
        )}
        {vagas?.length === 0 && (
          <p className="text-sm text-[#66788A]">Você ainda não publicou nenhuma vaga.</p>
        )}
        {vagas?.map((v) => (
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
