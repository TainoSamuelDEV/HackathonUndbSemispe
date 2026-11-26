'use client';

import { useRef, useState } from 'react';
import { Download, FileText, MessageCircle, Paperclip, Send, X } from 'lucide-react';

interface CurriculoGeradoWidget {
  arquivoId: string;
  fileName: string;
  downloadUrl: string;
}

interface MensagemChat {
  autor: 'farol' | 'usuario';
  texto: string;
  curriculoGerado?: CurriculoGeradoWidget;
}

const MAX_WIDGET_FILE_BYTES = 8 * 1024 * 1024;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

export function FarolWhatsAppWidget() {
  const [aberto, setAberto] = useState(false);
  const [telefone] = useState('5598991234567');
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [anexo, setAnexo] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [mensagens, setMensagens] = useState<MensagemChat[]>([
    {
      autor: 'farol',
      texto:
        'Olá! Eu sou a IA FAROL (conectada via Evolution API). Posso montar seu currículo em PDF, ler fotos de certificados/documentos, buscar vagas e mostrar cursos gratuitos!',
    },
  ]);

  async function enviar(textoEnvio?: string) {
    const msg = (textoEnvio ?? input).trim();
    if ((!msg && !anexo) || enviando) return;

    const arquivoAtual = anexo;
    const labelUsuario = arquivoAtual
      ? `${msg ? `${msg}\n` : ''}📎 Anexo: ${arquivoAtual.name}`
      : msg;

    setMensagens((prev) => [...prev, { autor: 'usuario', texto: labelUsuario }]);
    if (!textoEnvio) setInput('');
    setAnexo(null);
    setEnviando(true);

    try {
      const payload: Record<string, unknown> = {
        telefone,
        ...(msg ? { mensagem: msg } : {}),
      };

      if (arquivoAtual) {
        if (arquivoAtual.size > MAX_WIDGET_FILE_BYTES) {
          setMensagens((prev) => [
            ...prev,
            { autor: 'farol', texto: 'O arquivo deve ter no máximo 8 MB.' },
          ]);
          return;
        }
        const dataUrl = await fileToBase64(arquivoAtual);
        const mime = arquivoAtual.type || 'application/octet-stream';
        if (mime.startsWith('image/')) {
          payload.imagemBase64 = dataUrl;
          payload.imagemMimeType = mime;
        } else {
          payload.documentoBase64 = dataUrl;
          payload.documentoMimeType = mime;
          payload.documentoNome = arquivoAtual.name;
        }
      }

      const resp = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await resp.json();
      const respostaTexto =
        json?.data?.respostaTexto ??
        json?.error?.message ??
        'Desculpe, não consegui processar agora. Tente novamente.';
      const curriculoGerado = json?.data?.curriculoGerado as CurriculoGeradoWidget | undefined;

      setMensagens((prev) => [
        ...prev,
        {
          autor: 'farol',
          texto: respostaTexto,
          ...(curriculoGerado ? { curriculoGerado } : {}),
        },
      ]);
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
        <div className="fixed left-3.5 right-3.5 sm:left-auto sm:right-5 bottom-20 z-50 sm:w-[380px] h-[74dvh] max-h-[540px] bg-white border border-[#C9DED0] rounded-[16px] shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-[#0A7B36] text-white px-4 py-3 flex items-center justify-between">
            <div>
              <strong className="text-sm font-heading block">IA FAROL · WhatsApp</strong>
              <span className="text-[11px] text-[#D9F2E2]">
                Assistente multimodal (Texto, Áudio, Imagem e PDF)
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
                <span>{m.texto}</span>
                {m.curriculoGerado && (
                  <div className="mt-2 pt-2 border-t border-[#E0E9E1] flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0162A7] truncate">
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      {m.curriculoGerado.fileName}
                    </span>
                    <a
                      href={m.curriculoGerado.downloadUrl}
                      download={m.curriculoGerado.fileName}
                      className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#0162A7] text-white text-[11px] font-bold"
                    >
                      <Download className="w-3 h-3" />
                      PDF
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="px-3 pt-2 pb-1 bg-white border-t border-[#DCE7EF] flex flex-wrap gap-1.5">
            {['Oi, quero montar meu currículo', 'Ver vagas compatíveis', 'Cursos gratuitos'].map(
              (chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => enviar(chip)}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-[#C0E1CB] text-[#0A7B36] hover:bg-[#EAF7F0]"
                >
                  {chip}
                </button>
              )
            )}
          </div>

          {anexo && (
            <div className="px-3 py-1.5 bg-[#EFF7FC] border-t border-[#DCE7EF] flex items-center justify-between text-[11px] text-[#0B2540]">
              <span className="truncate font-semibold">📎 {anexo.name}</span>
              <button
                type="button"
                onClick={() => setAnexo(null)}
                aria-label="Remover anexo"
                className="p-0.5 text-[#66788A] hover:text-[#0B2540]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviar();
            }}
            className="p-2.5 bg-white flex items-center gap-1.5"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf,text/plain"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setAnexo(file);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Anexar imagem ou documento"
              className="min-h-[38px] min-w-[38px] rounded-[10px] border border-[#DCE7EF] text-[#0162A7] flex items-center justify-center hover:bg-[#EFF7FC]"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite ou anexe currículo/foto..."
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
