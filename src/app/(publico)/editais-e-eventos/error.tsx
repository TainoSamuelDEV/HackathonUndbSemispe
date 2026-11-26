'use client';

import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { CabecalhoEditaisEventos } from '@/components/editais-eventos/Estrutura';

export default function ErroEditaisEventos({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Falha ao carregar editais e eventos:', error);
  }, [error]);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-10">
      <CabecalhoEditaisEventos />
      <div role="alert" className="border border-[#DCE7EF] rounded-[24px] p-8 sm:p-10 text-center">
        <p className="font-heading font-bold text-lg text-[#0B2540]">
          Não foi possível carregar os editais e eventos agora.
        </p>
        <p className="text-sm text-[#66788A] mt-2">Tente novamente em alguns instantes.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[#0162A7] text-white text-sm font-bold hover:bg-[#004F8A] transition-colors"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
