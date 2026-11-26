import type { Metadata } from 'next';
import { farolService } from '@/server/application/FarolService';
import { hojeEmSaoLuis } from '@/lib/datasSaoLuis';
import { CabecalhoEditaisEventos, SecaoBoletim } from '@/components/editais-eventos/Estrutura';
import { PainelEditaisEventos } from '@/components/editais-eventos/PainelEditaisEventos';
import { paraEditalView, paraEventoView } from '@/components/editais-eventos/visualizacao';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Editais e eventos — FAROL',
  description:
    'Editais de fomento, programas para startups e eventos de tecnologia e qualificação em São Luís.',
};

export default async function EditaisEventosPage() {
  const [editais, eventos] = await Promise.all([
    farolService.listarEditaisAbertos(),
    farolService.listarProximosEventos(),
  ]);
  const hoje = hojeEmSaoLuis();

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-10">
      <CabecalhoEditaisEventos />
      <PainelEditaisEventos
        editais={editais.map((e) => paraEditalView(e, hoje))}
        eventos={eventos.map(paraEventoView)}
      />
      <div className="pt-4 sm:pt-6">
        <SecaoBoletim />
      </div>
    </div>
  );
}
