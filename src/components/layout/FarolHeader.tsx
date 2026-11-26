'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X, User, LogOut } from 'lucide-react';
import type { UsuarioSessao } from '@/types/farol';

/**
 * Header flutuante em pílula. Na página principal ele fica sobre a mídia da hero
 * (a hero compensa a altura com margem negativa: 72px no mobile, 76px a partir de sm).
 */
export function FarolHeader() {
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);
  const [usuario, setUsuario] = useState<UsuarioSessao | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((res) => setUsuario(res?.data?.usuario ?? null))
      .catch(() => setUsuario(null));
  }, []);

  // Fecha o menu mobile ao trocar de página
  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

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

  const links = [
    { href: '/', label: 'Página Principal' },
    { href: '/vagas', label: 'Vagas' },
    { href: '/cursos', label: 'Cursos' },
    { href: '/newsletter', label: 'Newsletter' },
    { href: usuario ? rotaPainel : '/entrar?next=/painel', label: 'Meu Currículo' },
    { href: '/sobre', label: 'Sobre o FAROL' },
  ];

  function ativo(href: string) {
    if (href.includes('?')) return false;
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="sticky top-0 z-40 px-3 sm:px-4 pt-3">
      <div className="relative max-w-[1200px] mx-auto">
        <div className="h-[60px] sm:h-16 flex items-center justify-between gap-3 rounded-full bg-white/95 backdrop-blur-md border border-[#DCE7EF] shadow-[0_8px_30px_rgba(11,37,64,0.10)] pl-3 sm:pl-5 pr-2">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 min-h-[44px] shrink-0">
            <img
              src="/logos/logo-pqt.png"
              alt="Parque Tecnológico de São Luís"
              className="h-8 sm:h-9 w-auto object-contain"
            />
            <span className="border-l border-[#DCE7EF] pl-2.5 sm:pl-3 font-heading font-extrabold text-lg sm:text-xl text-[#0162A7] tracking-tight leading-none">
              FAROL
            </span>
          </Link>

          <nav aria-label="Principal" className="hidden lg:flex items-center gap-1 text-sm font-semibold">
            {links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                aria-current={ativo(l.href) ? 'page' : undefined}
                className={`px-3 py-2 rounded-full transition-colors ${
                  ativo(l.href)
                    ? 'bg-[#EFF7FC] text-[#0162A7]'
                    : 'text-[#0B2540] hover:text-[#0162A7]'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            {usuario ? (
              <div className="hidden lg:flex items-center gap-1.5">
                <Link
                  href={rotaPainel}
                  className="inline-flex items-center gap-2 h-11 max-w-[220px] px-4 rounded-full bg-[#EFF7FC] text-[#0162A7] text-sm font-bold hover:bg-[#d7ecfa] transition-colors"
                >
                  <User className="w-4 h-4 shrink-0" />
                  <span className="truncate">{usuario.nome}</span>
                </Link>
                <button
                  type="button"
                  onClick={sair}
                  className="inline-flex items-center justify-center w-11 h-11 rounded-full text-[#66788A] hover:text-[#B53832] hover:bg-[#FCF1F0] transition-colors"
                  title="Sair"
                  aria-label="Sair da conta"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/entrar"
                className="hidden sm:inline-flex items-center justify-center h-11 px-6 rounded-full bg-[#0162A7] text-white text-sm font-bold hover:bg-[#004F8A] transition-colors"
              >
                Entrar
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMenuAberto((v) => !v)}
              className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-full border border-[#DCE7EF] text-[#0B2540]"
              aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={menuAberto}
              aria-controls="menu-mobile"
            >
              {menuAberto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Menu mobile em card arredondado */}
        {menuAberto && (
          <div
            id="menu-mobile"
            className="lg:hidden absolute left-0 right-0 top-full mt-2 rounded-[24px] bg-white border border-[#DCE7EF] shadow-[0_16px_40px_rgba(11,37,64,0.16)] p-2"
          >
            <nav aria-label="Principal">
              {links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  onClick={() => setMenuAberto(false)}
                  aria-current={ativo(l.href) ? 'page' : undefined}
                  className={`flex items-center min-h-[48px] px-4 rounded-2xl font-semibold transition-colors ${
                    ativo(l.href) ? 'bg-[#EFF7FC] text-[#0162A7]' : 'text-[#0B2540] hover:bg-[#F3F8FC]'
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="p-2 pt-3">
              {usuario ? (
                <div className="flex gap-2">
                  <Link
                    href={rotaPainel}
                    onClick={() => setMenuAberto(false)}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-full bg-[#0162A7] text-white font-bold"
                  >
                    <User className="w-4 h-4" />
                    Acessar painel
                  </Link>
                  <button
                    type="button"
                    onClick={sair}
                    className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-[#DCE7EF] text-[#66788A]"
                    aria-label="Sair da conta"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/entrar"
                  onClick={() => setMenuAberto(false)}
                  className="flex items-center justify-center h-12 rounded-full bg-[#0162A7] text-white font-bold"
                >
                  Entrar
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
