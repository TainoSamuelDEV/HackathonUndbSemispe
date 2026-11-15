'use client';

import { useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';

interface MensagemChat {
  autor: 'farol' | 'usuario';
  texto: string;
}

export function FarolWhatsAppWidget() {
  const [aberto, setAberto] = useState(false);
  const [telefone] = useState('5598991234567');
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensagens, setMensagens] = useState<MensagemChat[]>([
    {
      autor: 'farol',
      texto:
        'Olá! 👋 Eu sou a IA FAROL (conectada via Evolution API). Mande um "oi" ou pergunte por vagas e cursos!',
    },
  ]);

  async function enviar(textoEnvio?: string) {
    const msg = (textoEnvio ?? input).trim();
    if (!msg || enviando) return;

    setMensagens((prev) => [...prev, { autor: 'usuario', texto: msg }]);
    if (!textoEnvio) setInput('');
    setEnviando(true);

    try {
      const resp = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone, mensagem: msg }),
      });
      const json = await resp.json();
      const respostaTexto =
        json?.data?.respostaTexto ?? 'Desculpe, não consegui processar agora. Tente novamente.';
      setMensagens((prev) => [...prev, { autor: 'farol', texto: respostaTexto }]);
    } catch {
      setMensagens((prev) => [
        ...prev,
        { autor: 'farol', texto: 'Falha de conexão com a IA FAROL.' },
      ]);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setAberto(!aberto)}
        aria-label="Conversar com a IA FAROL no WhatsApp"
        className="fixed right-4 bottom-4 sm:right-5 sm:bottom-5 z-50 w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#0A7B36] text-white shadow-lg flex items-center justify-center hover:bg-[#086A2F] transition-colors"
      >
        {aberto ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {aberto && (
        <div className="fixed left-3.5 right-3.5 sm:left-auto sm:right-5 bottom-20 z-50 sm:w-[360px] h-[72dvh] max-h-[500px] bg-white border border-[#C9DED0] rounded-[16px] shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-[#0A7B36] text-white px-4 py-3 flex items-center justify-between">
            <div>
              <strong className="text-sm font-heading block">IA FAROL · WhatsApp</strong>
              <span className="text-[11px] text-[#D9F2E2]">
                Assistente oficial (Evolution API)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar chat"
              className="sm:hidden p-1.5 rounded-lg hover:bg-white/15"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#F2F7F2]">
            {mensagens.map((m, i) => (
              <div
                key={i}
                className={`max-w-[88%] text-xs leading-relaxed px-3 py-2 rounded-xl whitespace-pre-line ${
                  m.autor === 'usuario'
                    ? 'ml-auto bg-[#D6F1DD] text-[#0B2540]'
                    : 'mr-auto bg-white border border-[#E0E9E1] text-[#0B2540]'
                }`}
              >
                {m.texto}
              </div>
            ))}
          </div>

          <div className="px-3 pt-2 pb-1 bg-white border-t border-[#DCE7EF] flex flex-wrap gap-1.5">
            {['Oi, quero vagas', '2', 'Falar com atendente'].map((chip) => (
              <button
                key={chip}
                onClick={() => enviar(chip)}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-[#C0E1CB] text-[#0A7B36] hover:bg-[#EAF7F0]"
              >
                {chip}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviar();
            }}
            className="p-2.5 bg-white flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 text-base sm:text-xs border border-[#DCE7EF] rounded-[10px] px-3 py-2.5 focus:outline-none focus:border-[#0162A7]"
            />
            <button
              type="submit"
              disabled={enviando}
              className="min-h-[38px] min-w-[38px] rounded-[10px] bg-[#0A7B36] text-white flex items-center justify-center disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
