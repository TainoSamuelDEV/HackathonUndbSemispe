import type {
  CanalOrigem,
  EstadoConversaIA,
  ModalidadeTrabalho,
  NivelEscolaridade,
  OrigemVaga,
  PapelUsuario,
  RequisitoVaga,
  ResultadoMatch,
  StatusCandidatura,
  StatusCurso,
  StatusInscricaoCurso,
  StatusTurma,
  StatusVaga,
  TipoContratacao,
  TipoCurso,
} from '@/types/farol';

export interface UsuarioRecord {
  id: string;
  email: string | null;
  senhaHash: string | null;
  papel: PapelUsuario;
  telefoneWhatsapp: string | null;
  whatsappVerificado: boolean;
  ativo: boolean;
}

export interface CandidatoRecord {
  id: string;
  usuarioId: string;
  nomeCompleto: string;
  nomeExibicao: string;
  bairro: string;
  municipio: string;
  escolaridade: NivelEscolaridade | null;
  areaInteresse: string | null;
  objetivo: string | null;
  resumoProfissional: string | null;
  disponibilidade: string | null;
  consentimentoLgpd: boolean;
  consentimentoEm: string | null;
  visivelServicos: boolean;
  categoriaServicos: string | null;
  competencias: string[];
  experiencias: Array<{
    id: string;
    cargoAtividade: string;
    empresaOuContexto: string | null;
    trabalhoInformal: boolean;
    periodo: string | null;
  }>;
}

export interface EmpresaRecord {
  id: string;
  usuarioId: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  ehMei: boolean;
  setor: string;
  bairro: string;
  municipio: string;
  telefone: string;
  responsavelNome: string;
  statusValidacao: 'PENDENTE' | 'VERIFICADA' | 'INDISPONIVEL' | 'BLOQUEADA';
}

export interface VagaRecord {
  id: string;
  empresaId: string;
  empresaNome: string;
  titulo: string;
  area: string;
  descricao: string;
  bairro: string;
  municipio: string;
  modalidade: ModalidadeTrabalho;
  tipoContratacao: TipoContratacao;
  quantidadeVagas: number;
  salarioMin: number | null;
  salarioMax: number | null;
  escolaridadeMinima: NivelEscolaridade | null;
  jornada: string | null;
  beneficios: string[];
  origemTipo: OrigemVaga;
  origemUrl: string | null;
  /** URL https ou caminho local (/vagas/capas/...). Nulo = imagem padrão da área. */
  imagemCapaUrl: string | null;
  seloSimulado: boolean;
  status: StatusVaga;
  publicadaEm: string;
  encerraEm: string | null;
  requisitos: RequisitoVaga[];
}

export interface CandidaturaRecord {
  id: string;
  vagaId: string;
  candidatoId: string;
  origemCanal: CanalOrigem;
  status: StatusCandidatura;
  scoreCalculado: number | null;
  detalhesMatch: ResultadoMatch | null;
  criadoEm: string;
  atualizadoEm: string;
  eventos: Array<{
    id: string;
    statusAnterior: StatusCandidatura | null;
    statusNovo: StatusCandidatura;
    observacao: string | null;
    criadoEm: string;
  }>;
}

export interface CursoRecord {
  id: string;
  titulo: string;
  area: string;
  descricao: string;
  competenciasDesenvolvidas: string[];
  instituicao: string;
  modalidade: ModalidadeTrabalho;
  cargaHoraria: number;
  preRequisitos: string | null;
  tipo: TipoCurso;
  /** URL https ou caminho local (/cursos/capas/...). Nulo = imagem padrão do tema. */
  imagemCapaUrl: string | null;
  seloSimulado: boolean;
  status: StatusCurso;
  turmas: Array<{
    id: string;
    codigoTurma: string;
    localBairro: string;
    vagasTotais: number;
    dataInicio: string | null;
    horario: string | null;
    status: StatusTurma;
  }>;
}

export interface InscricaoCursoRecord {
  id: string;
  turmaId: string;
  cursoId: string;
  candidatoId: string;
  origemCanal: CanalOrigem;
  status: StatusInscricaoCurso;
  frequenciaPercentual: number | null;
  certificadoUrl: string | null;
  criadoEm: string;
}

export interface PedidoCursoRecord {
  id: string;
  candidatoId: string | null;
  cursoId: string | null;
  temaDesejado: string;
  temaNormalizado: string;
  motivo: string | null;
  turnoPreferido: string | null;
  bairro: string | null;
  origemCanal: CanalOrigem;
  status: 'REGISTRADO' | 'EM_ANALISE' | 'TURMA_ABERTA' | 'ATENDIDO';
  criadoEm: string;
}

export interface ConversaWhatsAppRecord {
  id: string;
  telefone: string;
  candidatoId: string | null;
  estadoAtual: EstadoConversaIA;
  contextoJson: Record<string, unknown>;
  atendimentoHumano: boolean;
  ultimaInteracaoEm: string;
}

// Senha de demonstração: "123456"
const DEMO_SENHA_HASH = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

class InMemoryFarolStore {
  public usuarios: UsuarioRecord[] = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@farol.slz.br',
      senhaHash: DEMO_SENHA_HASH,
      papel: 'ADMIN_SEMISPE',
      telefoneWhatsapp: null,
      whatsappVerificado: false,
      ativo: true,
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'rh@portoitacai.com.br',
      senhaHash: DEMO_SENHA_HASH,
      papel: 'EMPRESA',
      telefoneWhatsapp: null,
      whatsappVerificado: false,
      ativo: true,
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'contato@inovaslz.com.br',
      senhaHash: DEMO_SENHA_HASH,
      papel: 'EMPRESA',
      telefoneWhatsapp: null,
      whatsappVerificado: false,
      ativo: true,
    },
    {
      id: '00000000-0000-0000-0000-000000000004',
      email: 'marcos.silva@exemplo.com',
      senhaHash: DEMO_SENHA_HASH,
      papel: 'CANDIDATO',
      telefoneWhatsapp: '5598991234567',
      whatsappVerificado: true,
      ativo: true,
    },
    {
      id: '00000000-0000-0000-0000-000000000005',
      email: 'ana.costa@exemplo.com',
      senhaHash: DEMO_SENHA_HASH,
      papel: 'CANDIDATO',
      telefoneWhatsapp: '5598992345678',
      whatsappVerificado: true,
      ativo: true,
    },
  ];

  public empresas: EmpresaRecord[] = [
    {
      id: '10000000-0000-0000-0000-000000000001',
      usuarioId: '00000000-0000-0000-0000-000000000002',
      cnpj: '12.345.678/0001-90',
      razaoSocial: 'Operações Portuárias Itaqui LTDA',
      nomeFantasia: 'Porto Itaqui Logística (Exemplo)',
      ehMei: false,
      setor: 'Logística e Manutenção',
      bairro: 'Itaqui-Bacanga',
      municipio: 'São Luís',
      telefone: '9832110000',
      responsavelNome: 'Carla Mendes',
      statusValidacao: 'VERIFICADA',
    },
    {
      id: '10000000-0000-0000-0000-000000000002',
      usuarioId: '00000000-0000-0000-0000-000000000003',
      cnpj: '98.765.432/0001-10',
      razaoSocial: 'Inova SLZ Soluções Digitais MEI',
      nomeFantasia: 'Inova SLZ Startup (Exemplo)',
      ehMei: true,
      setor: 'Tecnologia e Serviços',
      bairro: 'Anjo da Guarda',
      municipio: 'São Luís',
      telefone: '98988001122',
      responsavelNome: 'Rafael Sousa',
      statusValidacao: 'VERIFICADA',
    },
  ];

  public candidatos: CandidatoRecord[] = [
    {
      id: '20000000-0000-0000-0000-000000000001',
      usuarioId: '00000000-0000-0000-0000-000000000004',
      nomeCompleto: 'Marcos Vinícius Silva',
      nomeExibicao: 'Marcos Silva',
      bairro: 'Anjo da Guarda',
      municipio: 'São Luís',
      escolaridade: 'MEDIO_COMPLETO',
      areaInteresse: 'Manutenção e mecânica',
      objetivo: 'Atuar como ajudante de manutenção ou mecânica industrial no Itaqui-Bacanga.',
      resumoProfissional: '6 anos de experiência como ajudante em oficina mecânica e noções práticas de solda.',
      disponibilidade: 'Turnos e escalas',
      consentimentoLgpd: true,
      consentimentoEm: new Date().toISOString(),
      visivelServicos: true,
      categoriaServicos: 'Manutenção e Reparos',
      competencias: ['Experiência em oficina', 'Soldagem básica'],
      experiencias: [
        {
          id: 'exp-1',
          cargoAtividade: 'Ajudante de Oficina Mecânica',
          empresaOuContexto: 'Oficina São José',
          trabalhoInformal: false,
          periodo: '6 anos',
        },
      ],
    },
    {
      id: '20000000-0000-0000-0000-000000000002',
      usuarioId: '00000000-0000-0000-0000-000000000005',
      nomeCompleto: 'Ana Paula Costa',
      nomeExibicao: 'Ana Costa',
      bairro: 'Vila Embratel',
      municipio: 'São Luís',
      escolaridade: 'TECNICO',
      areaInteresse: 'Administrativo',
      objetivo: 'Vaga em atendimento, recepção ou apoio administrativo.',
      resumoProfissional: 'Técnica em Administração com prática em planilhas, atendimento ao público e estoque.',
      disponibilidade: 'Horário comercial',
      consentimentoLgpd: true,
      consentimentoEm: new Date().toISOString(),
      visivelServicos: true,
      categoriaServicos: 'Apoio Administrativo',
      competencias: ['Atendimento ao público', 'Pacote Office', 'Controle de estoque'],
      experiencias: [
        {
          id: 'exp-2',
          cargoAtividade: 'Auxiliar de Atendimento',
          empresaOuContexto: 'Comércio Local Itaqui',
          trabalhoInformal: false,
          periodo: '2 anos',
        },
      ],
    },
  ];

  public vagas: VagaRecord[] = [
    {
      id: '30000000-0000-0000-0000-000000000001',
      empresaId: '10000000-0000-0000-0000-000000000001',
      empresaNome: 'Porto Itaqui Logística (Exemplo)',
      titulo: 'Ajudante de Manutenção Industrial',
      area: 'Manutenção e mecânica',
      descricao: 'Apoio às rotinas de manutenção preventiva e corretiva em equipamentos de pátio e oficina.',
      bairro: 'Itaqui-Bacanga',
      municipio: 'São Luís',
      modalidade: 'PRESENCIAL',
      tipoContratacao: 'CLT',
      quantidadeVagas: 3,
      salarioMin: 1850,
      salarioMax: null,
      escolaridadeMinima: 'MEDIO_COMPLETO',
      jornada: '44h semanais (escala)',
      beneficios: ['Vale-transporte', 'Vale-alimentação'],
      origemTipo: 'INTERNA',
      origemUrl: null,
      imagemCapaUrl: '/vagas/capas/ajudante-manutencao.jpg',
      seloSimulado: true,
      status: 'PUBLICADA',
      publicadaEm: new Date().toISOString(),
      encerraEm: new Date(Date.now() + 30 * 86400000).toISOString(),
      requisitos: [
        { nome: 'Experiência em oficina', tipo: 'REQUISITO', obrigatorio: true },
        { nome: 'Curso de NR-12', tipo: 'CERTIFICACAO', obrigatorio: false },
      ],
    },
    {
      id: '30000000-0000-0000-0000-000000000002',
      empresaId: '10000000-0000-0000-0000-000000000001',
      empresaNome: 'Porto Itaqui Logística (Exemplo)',
      titulo: 'Auxiliar de Logística e Almoxarifado',
      area: 'Logística e transporte',
      descricao: 'Conferência de materiais, organização de estoque e apoio ao carregamento.',
      bairro: 'Vila Maranhão',
      municipio: 'São Luís',
      modalidade: 'PRESENCIAL',
      tipoContratacao: 'CLT',
      quantidadeVagas: 2,
      salarioMin: 1750,
      salarioMax: null,
      escolaridadeMinima: 'MEDIO_COMPLETO',
      jornada: 'Comercial',
      beneficios: ['Vale-transporte', 'Refeitório no local'],
      origemTipo: 'INTERNA',
      origemUrl: null,
      imagemCapaUrl: '/vagas/capas/auxiliar-logistica.jpg',
      seloSimulado: true,
      status: 'PUBLICADA',
      publicadaEm: new Date().toISOString(),
      encerraEm: new Date(Date.now() + 25 * 86400000).toISOString(),
      requisitos: [
        { nome: 'Controle de estoque', tipo: 'CONHECIMENTO', obrigatorio: true },
        { nome: 'Operação de empilhadeira', tipo: 'CERTIFICACAO', obrigatorio: false },
      ],
    },
    {
      id: '30000000-0000-0000-0000-000000000003',
      empresaId: '10000000-0000-0000-0000-000000000002',
      empresaNome: 'Inova SLZ Startup (Exemplo)',
      titulo: 'Assistente de Atendimento Digital',
      area: 'Administrativo',
      descricao: 'Atendimento a clientes, organização de planilhas e suporte operacional a startup local.',
      bairro: 'Anjo da Guarda',
      municipio: 'São Luís',
      modalidade: 'HIBRIDO',
      tipoContratacao: 'CLT',
      quantidadeVagas: 1,
      salarioMin: 1900,
      salarioMax: null,
      escolaridadeMinima: 'MEDIO_COMPLETO',
      jornada: 'Segunda a sexta',
      beneficios: ['Vale-transporte', 'Auxílio home office'],
      origemTipo: 'INTERNA',
      origemUrl: null,
      imagemCapaUrl: '/vagas/capas/assistente-atendimento-digital.jpg',
      seloSimulado: true,
      status: 'PUBLICADA',
      publicadaEm: new Date().toISOString(),
      encerraEm: new Date(Date.now() + 20 * 86400000).toISOString(),
      requisitos: [
        { nome: 'Atendimento ao público', tipo: 'CONHECIMENTO', obrigatorio: true },
        { nome: 'Pacote Office', tipo: 'CONHECIMENTO', obrigatorio: false },
      ],
    },
  ];

  public candidaturas: CandidaturaRecord[] = [];

  public cursos: CursoRecord[] = [
    {
      id: '40000000-0000-0000-0000-000000000001',
      titulo: 'NR-12: Segurança no Trabalho em Máquinas e Equipamentos',
      area: 'Segurança do trabalho',
      descricao: 'Capacitação gratuita para operação segura de máquinas industriais e prevenção de acidentes.',
      competenciasDesenvolvidas: ['Curso de NR-12', 'Segurança industrial'],
      instituicao: 'SEMISPE / Parceiro Técnico',
      modalidade: 'PRESENCIAL',
      cargaHoraria: 16,
      preRequisitos: 'Ensino Fundamental completo',
      tipo: 'PROGRAMADO',
      imagemCapaUrl: '/cursos/capas/nr12-seguranca-maquinas.jpg',
      seloSimulado: true,
      status: 'ATIVO',
      turmas: [
        {
          id: '50000000-0000-0000-0000-000000000001',
          codigoTurma: 'NR12-IB-2026-01',
          localBairro: 'Itaqui-Bacanga',
          vagasTotais: 30,
          dataInicio: '2026-12-04',
          horario: '18:30 às 21:30',
          status: 'INSCRICOES_ABERTAS',
        },
      ],
    },
    {
      id: '40000000-0000-0000-0000-000000000002',
      titulo: 'Informática Básica e Pacote Office para o Trabalho',
      area: 'Administrativo',
      descricao: 'Uso prático de computador, planilhas, documentos e comunicação profissional.',
      competenciasDesenvolvidas: ['Pacote Office', 'Atendimento ao público'],
      instituicao: 'SEMISPE / Polo Itaqui-Bacanga',
      modalidade: 'PRESENCIAL',
      cargaHoraria: 40,
      preRequisitos: null,
      tipo: 'PROGRAMADO',
      imagemCapaUrl: '/cursos/capas/informatica-pacote-office.jpg',
      seloSimulado: true,
      status: 'ATIVO',
      turmas: [
        {
          id: '50000000-0000-0000-0000-000000000002',
          codigoTurma: 'INFO-AG-2026-01',
          localBairro: 'Anjo da Guarda',
          vagasTotais: 25,
          dataInicio: '2026-12-06',
          horario: '14:00 às 17:00',
          status: 'INSCRICOES_ABERTAS',
        },
      ],
    },
    {
      id: '40000000-0000-0000-0000-000000000003',
      titulo: 'Operador de Empilhadeira e Logística Portuária',
      area: 'Logística e transporte',
      descricao: 'Formação sob demanda para movimentação de cargas no eixo Itaqui-Bacanga.',
      competenciasDesenvolvidas: ['Operação de empilhadeira', 'Controle de estoque'],
      instituicao: 'SEMISPE (Previsão com parceiros)',
      modalidade: 'PRESENCIAL',
      cargaHoraria: 60,
      preRequisitos: 'Ensino Médio completo',
      tipo: 'SOB_DEMANDA',
      imagemCapaUrl: '/cursos/capas/operador-empilhadeira-portuaria.jpg',
      seloSimulado: true,
      status: 'ATIVO',
      turmas: [],
    },
  ];

  public inscricoesCursos: InscricaoCursoRecord[] = [];

  public pedidosCursos: PedidoCursoRecord[] = [
    {
      id: 'ped-1',
      candidatoId: '20000000-0000-0000-0000-000000000001',
      cursoId: '40000000-0000-0000-0000-000000000003',
      temaDesejado: 'Operador de Empilhadeira',
      temaNormalizado: 'operador de empilhadeira',
      motivo: 'Exigido em vagas do eixo portuário',
      turnoPreferido: 'Noturno',
      bairro: 'Anjo da Guarda',
      origemCanal: 'WHATSAPP',
      status: 'REGISTRADO',
      criadoEm: new Date().toISOString(),
    },
    {
      id: 'ped-2',
      candidatoId: '20000000-0000-0000-0000-000000000002',
      cursoId: null,
      temaDesejado: 'Excel Avançado para Logística',
      temaNormalizado: 'excel avancado para logistica',
      motivo: 'Melhorar currículo administrativo',
      turnoPreferido: 'Vespertino',
      bairro: 'Vila Embratel',
      origemCanal: 'WEB',
      status: 'REGISTRADO',
      criadoEm: new Date().toISOString(),
    },
  ];

  public conversasWhatsApp: ConversaWhatsAppRecord[] = [];
}

const globalForFarol = globalThis as unknown as { __farolStore?: InMemoryFarolStore };
export const farolMemoryStore = globalForFarol.__farolStore ?? new InMemoryFarolStore();
if (process.env.NODE_ENV !== 'production') {
  globalForFarol.__farolStore = farolMemoryStore;
}
