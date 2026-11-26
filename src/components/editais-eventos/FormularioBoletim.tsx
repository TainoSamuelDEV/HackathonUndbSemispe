'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

type Estado =
  | { tipo: 'ocioso' }
  | { tipo: 'enviando' }
  | { tipo: 'sucesso'; mensagem: string }
  | { tipo: 'erro'; mensagem: string };

interface RespostaApi {
  data?: { tipoContato: 'EMAIL' | 'WHATSAPP'; jaInscrito: boolean };
  error?: { message?: string; details?: { fieldErrors?: Record<string, string[] | undefined> } };
}

function mensagemDeErro(json: RespostaApi | null) {
  const campos = json?.error?.details?.fieldErrors;
  return campos?.contato?.[0] ?? campos?.consentimento?.[0] ?? json?.error?.message ?? 'Não foi possível concluir a inscrição. Tente novamente.';
}

export function FormularioBoletim() {
  const [contato, setContato] = useState('');
  const [consentimento, setConsentimento] = useState(false);
  const [estado, setEstado] = useState<Estado>({ tipo: 'ocioso' });

  async function inscrever(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (estado.tipo === 'enviando') return;
    setEstado({ tipo: 'enviando' });

    try {
      const resposta = await fetch('/api/boletim/inscricoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contato, consentimento }),
      });
      const json: RespostaApi | null = await resposta.json().catch(() => null);

      if (!resposta.ok || !json?.data) {
        setEstado({ tipo: 'erro', mensagem: mensagemDeErro(json) });
        return;
      }

      const canal = json.data.tipoContato === 'EMAIL' ? 'e-mail' : 'WhatsApp';
      setEstado({
        tipo: 'sucesso',
        mensagem: json.data.jaInscrito
          ? `Este ${canal} já está inscrito no boletim.`
          : `Inscrição registrada! Seu ${canal} entrou na lista do boletim de editais e eventos.`,
      });
      setContato('');
      setConsentimento(false);
    } catch {
      setEstado({ tipo: 'erro', mensagem: 'Falha de conexão. Verifique sua internet e tente novamente.' });
    }
  }

  if (estado.tipo === 'sucesso') {
    return (
      <div role="status" className="flex items-start gap-3 rounded-[20px] bg-white/10 border border-white/20 p-5">
        <CheckCircle2 className="w-5 h-5 shrink-0 text-[#FADC00] mt-0.5" aria-hidden="true" />
        <div>
          <p className="text-sm font-bold text-white">{estado.mensagem}</p>
          <button
            type="button"
            onClick={() => setEstado({ tipo: 'ocioso' })}
            className="mt-2 text-sm font-semibold text-[#CAE8FB] hover:text-white underline underline-offset-4"
          >
            Inscrever outro contato
          </button>
        </div>
      </div>
    );
  }

  const enviando = estado.tipo === 'enviando';

  return (
    <form onSubmit={inscrever} className="space-y-4" aria-describedby="boletim-ajuda">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:p-1.5 sm:rounded-full sm:bg-white">
        <label htmlFor="boletim-contato" className="sr-only">
          E-mail ou WhatsApp com DDD
        </label>
        <input
          id="boletim-contato"
          type="text"
          autoComplete="email"
          required
          maxLength={160}
          value={contato}
          onChange={(e) => setContato(e.target.value)}
          placeholder="Seu e-mail ou WhatsApp com DDD"
          aria-invalid={estado.tipo === 'erro'}
          className="h-12 sm:h-11 w-full sm:flex-1 rounded-full sm:rounded-none bg-white px-5 sm:pl-4 sm:pr-3 text-[15px] text-[#0B2540] placeholder:text-[#66788A] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FADC00]/50 sm:focus-visible:ring-0"
        />
        <button
          type="submit"
          disabled={enviando}
          className="h-12 sm:h-11 px-6 rounded-full bg-[#FADC00] text-[#0B2540] text-sm font-bold hover:bg-[#E8CB00] disabled:opacity-60 transition-colors shrink-0"
        >
          {enviando ? 'Enviando…' : 'Inscrever-se'}
        </button>
      </div>

      <label className="flex items-start gap-2.5 text-sm text-[#CAE8FB] leading-relaxed cursor-pointer">
        <input
          type="checkbox"
          required
          checked={consentimento}
          onChange={(e) => setConsentimento(e.target.checked)}
          className="mt-1 w-4 h-4 shrink-0 accent-[#FADC00]"
        />
        <span id="boletim-ajuda">
          Autorizo o FAROL a usar este contato apenas para enviar o boletim de editais e eventos, conforme a
          LGPD.
        </span>
      </label>

      <div aria-live="polite">
        {estado.tipo === 'erro' && (
          <p className="rounded-[14px] bg-white px-4 py-3 text-sm font-semibold text-[#B53832]">{estado.mensagem}</p>
        )}
      </div>
    </form>
  );
}
