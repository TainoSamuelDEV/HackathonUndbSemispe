'use client';

import { RotateCcw } from 'lucide-react';

/** Aviso padrão para quando os dados de uma página não puderem ser carregados. */
export function EstadoErroCarregamento({
  mensagem,
  onTentarNovamente,
}: {
  mensagem: string;
  onTentarNovamente: () => void;
}) {
  return (
    <div role="alert" className="border border-[#DCE7EF] rounded-[24px] p-8 sm:p-10 text-center bg-white">
      <p className="font-heading font-bold text-lg text-[#0B2540]">{mensagem}</p>
      <p className="text-sm text-[#66788A] mt-2">Verifique sua conexão e tente novamente.</p>
      <button
        type="button"
        onClick={onTentarNovamente}
        className="mt-5 inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[#0162A7] text-white text-sm font-bold hover:bg-[#004F8A] transition-colors"
      >
        <RotateCcw className="w-4 h-4" aria-hidden="true" />
        Tentar novamente
      </button>
    </div>
  );
}
