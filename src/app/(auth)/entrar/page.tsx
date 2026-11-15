'use client';

import { useState } from 'react';

export default function EntrarPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function autenticar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        setErro(json?.error?.message ?? 'Falha ao entrar.');
        return;
      }

      const papel = json?.data?.usuario?.papel;
      if (papel === 'ADMIN_SEMISPE') window.location.href = '/admin';
      else if (papel === 'EMPRESA') window.location.href = '/empresa';
      else window.location.href = '/painel';
    } finally {
      setCarregando(false);
    }
  }

  function preencherDemo(e: string) {
    setEmail(e);
    setSenha('123456');
  }

  return (
    <div className="max-w-[480px] mx-auto px-4 py-12">
      <div className="border border-[#DCE7EF] rounded-[16px] p-6 sm:p-8 bg-white shadow-sm space-y-5">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#0162A7]">
            Acesso Único
          </span>
          <h1 className="font-heading text-3xl font-extrabold text-[#0B2540] mt-1">
            Entrar no FAROL
          </h1>
          <p className="text-sm text-[#66788A] mt-1">
            Acesse sua área de candidato, empresa ou gestão SEMISPE.
          </p>
        </div>

        <form onSubmit={autenticar} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#0B2540] mb-1">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full border border-[#DCE7EF] rounded-[12px] px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0B2540] mb-1">Senha</label>
            <input
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••"
              className="w-full border border-[#DCE7EF] rounded-[12px] px-3.5 py-2.5 text-sm"
            />
          </div>

          {erro && (
            <div className="p-3 rounded-[10px] bg-[#FCF1F0] text-[#B53832] text-xs font-bold">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full min-h-[45px] rounded-[12px] bg-[#0162A7] text-white font-bold text-sm hover:bg-[#004F8A]"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="border-t border-[#DCE7EF] pt-4 space-y-2">
          <p className="text-xs font-bold text-[#66788A]">Atalhos de demonstração (senha: 123456):</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => preencherDemo('marcos.silva@exemplo.com')}
              className="text-xs font-bold px-3 py-1.5 rounded-[10px] bg-[#EFF7FC] text-[#0162A7]"
            >
              Candidato (Marcos)
            </button>
            <button
              type="button"
              onClick={() => preencherDemo('rh@portoitacai.com.br')}
              className="text-xs font-bold px-3 py-1.5 rounded-[10px] bg-[#EFF7FC] text-[#0162A7]"
            >
              Empresa (Porto)
            </button>
            <button
              type="button"
              onClick={() => preencherDemo('admin@farol.slz.br')}
              className="text-xs font-bold px-3 py-1.5 rounded-[10px] bg-[#EAF7F0] text-[#0A7B36]"
            >
              Admin SEMISPE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
