'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X, User, LogOut } from 'lucide-react';
import type { UsuarioSessao } from '@/types/farol';

export function FarolHeader() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [usuario, setUsuario] = useState<UsuarioSessao | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((res) => setUsuario(res?.data?.usuario ?? null))
      .catch(() => setUsuario(null));
  }, []);

  async function sair() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUsuario(null);
    window.location.href = '/';
  }

  const rotaPainel =
    usuario?.papel === 'ADMIN_SEMISPE'
      ? '/admin'
      : usuario?.papel === 'EMPRESA'
        ? '/empresa'
        : '/painel';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#DCE7EF]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-[76px] flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 min-h-[44px]">
          <img
            src="/logos/logo-pqt.png"
            alt="Parque Tecnológico de São Luís"
            className="h-9 w-auto object-contain"
          />
          <div className="border-l border-[#DCE7EF] pl-3">
            <span className="font-heading font-extrabold text-xl text-[#0162A7] tracking-tight block leading-none">
              FAROL
            </span>
            <span className="text-[11px] font-medium text-[#66788A] hidden sm:block">
              Rede de Oportunidades · São Luís
            </span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-[#0B2540]">
          <Link href="/" className="hover:text-[#0162A7] transition-colors py-2">
            Página Principal
          </Link>
          <Link href="/vagas" className="hover:text-[#0162A7] transition-colors py-2">
            Vagas
          </Link>
          <Link href="/cursos" className="hover:text-[#0162A7] transition-colors py-2">
            Cursos
          </Link>
          <Link
            href={usuario ? rotaPainel : '/entrar?next=/painel'}
            className="hover:text-[#0162A7] transition-colors py-2"
          >
            Meu Currículo
          </Link>
          <Link href="/sobre" className="hover:text-[#0162A7] transition-colors py-2">
            Sobre o FAROL
          </Link>
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          {usuario ? (
            <>
              <Link
                href={rotaPainel}
                className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-[12px] bg-[#E7F3FA] text-[#0162A7] text-sm font-bold hover:bg-[#d7ecfa] transition-colors"
              >
                <User className="w-4 h-4" />
                {usuario.nome}
              </Link>
              <button
                onClick={sair}
                className="inline-flex items-center justify-center min-h-[44px] px-3 rounded-[12px] border border-[#DCE7EF] text-[#66788A] hover:text-[#B53832] transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link
              href="/entrar"
              className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-[12px] bg-[#FADC00] text-[#0B2540] text-sm font-bold hover:bg-[#E8CB00] transition-colors"
            >
              Entrar
            </Link>
          )}
        </div>

        <button
          onClick={() => setMenuAberto(!menuAberto)}
          className="lg:hidden min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-[12px] border border-[#DCE7EF]"
          aria-label="Abrir menu"
        >
          {menuAberto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {menuAberto && (
        <div className="lg:hidden border-t border-[#DCE7EF] bg-white px-4 py-4 space-y-2">
          <Link href="/" onClick={() => setMenuAberto(false)} className="block py-3 font-semibold border-b border-[#F3F8FC]">
            Página Principal
          </Link>
          <Link href="/vagas" onClick={() => setMenuAberto(false)} className="block py-3 font-semibold border-b border-[#F3F8FC]">
            Vagas
          </Link>
          <Link href="/cursos" onClick={() => setMenuAberto(false)} className="block py-3 font-semibold border-b border-[#F3F8FC]">
            Cursos
          </Link>
          <Link href={usuario ? rotaPainel : '/entrar'} onClick={() => setMenuAberto(false)} className="block py-3 font-semibold border-b border-[#F3F8FC]">
            Meu Currículo
          </Link>
          <Link href="/sobre" onClick={() => setMenuAberto(false)} className="block py-3 font-semibold border-b border-[#F3F8FC]">
            Sobre o FAROL
          </Link>
          <div className="pt-2">
            {usuario ? (
              <Link
                href={rotaPainel}
                onClick={() => setMenuAberto(false)}
                className="block w-full text-center py-3 rounded-[12px] bg-[#0162A7] text-white font-bold"
              >
                Acessar Painel ({usuario.nome})
              </Link>
            ) : (
              <Link
                href="/entrar"
                onClick={() => setMenuAberto(false)}
                className="block w-full text-center py-3 rounded-[12px] bg-[#FADC00] text-[#0B2540] font-bold"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
