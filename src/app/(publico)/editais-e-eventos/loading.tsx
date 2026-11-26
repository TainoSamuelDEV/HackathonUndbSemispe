import { CabecalhoEditaisEventos, EditaisEventosSkeleton } from '@/components/editais-eventos/Estrutura';

export default function CarregandoEditaisEventos() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-10">
      <CabecalhoEditaisEventos />
      <EditaisEventosSkeleton />
    </div>
  );
}
