import type { CurriculoArquivoRecord } from '@/server/domain/curriculo/CurriculoPadrao';
import { hojeEmSaoLuis, instanteEmSaoLuis, somarDias } from '@/lib/datasSaoLuis';
import type {
  CanalOrigem,
  EstadoConversaIA,
  ModalidadeEvento,
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
  TipoContatoBoletim,
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
  remoteJid: string | null;
  pushName: string | null;
  candidatoId: string | null;
  estadoAtual: EstadoConversaIA;
  contextoJson: Record<string, unknown>;
  atendimentoHumano: boolean;
  botPausedUntil: string | null;
  topicoAtual: string | null;
  turnosSessao: number;
  ultimaInteracaoEm: string;
}

export interface MensagemWhatsAppRecord {
  id: string;
  conversaId: string;
  direcao: 'ENTRADA' | 'SAIDA';
  tipoMidia: 'TEXTO' | 'AUDIO' | 'DOCUMENTO' | 'IMAGEM';
  conteudoTexto: string | null;
  transcricaoAudio: string | null;
  resumoMidia: string | null;
  metadataJson: Record<string, unknown>;
  evolutionMessageId: string | null;
  criadoEm: string;
}

export type { CurriculoArquivoRecord };

export interface EditalRecord {
  id: string;
  titulo: string;
  organizacao: string;
  resumo: string;
  publicoAlvo: string | null;
  beneficio: string | null;
  /** aaaa-mm-dd; nulo para chamadas em fluxo contínuo. */
  inscricoesAte: string | null;
  prazoDescricao: string | null;
  linkUrl: string | null;
  tags: string[];
  seloSimulado: boolean;
  publicado: boolean;
}

export interface EventoRecord {
  id: string;
  titulo: string;
  organizacao: string;
  resumo: string;
  /** Instante ISO (UTC). */
  inicio: string;
  fim: string | null;
  local: string;
  modalidade: ModalidadeEvento;
  gratuito: boolean;
  linkInscricao: string | null;
  tags: string[];
  seloSimulado: boolean;
  publicado: boolean;
}

export interface InscricaoBoletimRecord {
  id: string;
  /** Contato normalizado (e-mail em minúsculas ou WhatsApp só com dígitos). */
  contato: string;
  tipoContato: TipoContatoBoletim;
  consentimentoLgpd: boolean;
  consentimentoEm: string;
  origemCanal: CanalOrigem;
  ativo: boolean;
  criadoEm: string;
}

// Datas do conteúdo de demonstração, relativas ao dia em que o servidor inicia (horário de São Luís)
const HOJE_DEMO = hojeEmSaoLuis();
const diaDemo = (dias: number) => somarDias(HOJE_DEMO, dias);

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
    {
      id: '00000000-0000-0000-0000-000000000006',
      email: 'rh@atacadaobacanga.com.br',
      senhaHash: DEMO_SENHA_HASH,
      papel: 'EMPRESA',
      telefoneWhatsapp: null,
      whatsappVerificado: false,
      ativo: true,
    },
    {
      id: '00000000-0000-0000-0000-000000000007',
      email: 'talentos@maretech.com.br',
      senhaHash: DEMO_SENHA_HASH,
      papel: 'EMPRESA',
      telefoneWhatsapp: null,
      whatsappVerificado: false,
      ativo: true,
    },
    {
      id: '00000000-0000-0000-0000-000000000008',
      email: 'obras@ilhaforte.com.br',
      senhaHash: DEMO_SENHA_HASH,
      papel: 'EMPRESA',
      telefoneWhatsapp: null,
      whatsappVerificado: false,
      ativo: true,
    },
    {
      id: '00000000-0000-0000-0000-000000000009',
      email: 'gestao@saudedopovo.com.br',
      senhaHash: DEMO_SENHA_HASH,
      papel: 'EMPRESA',
      telefoneWhatsapp: null,
      whatsappVerificado: false,
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
    {
      id: '10000000-0000-0000-0000-000000000003',
      usuarioId: '00000000-0000-0000-0000-000000000006',
      cnpj: '23.456.789/0001-21',
      razaoSocial: 'Atacadão Bacanga Distribuidora LTDA',
      nomeFantasia: 'Atacadão Bacanga (Exemplo)',
      ehMei: false,
      setor: 'Comércio e Varejo',
      bairro: 'Vila Embratel',
      municipio: 'São Luís',
      telefone: '9832224400',
      responsavelNome: 'Fernanda Lima',
      statusValidacao: 'VERIFICADA',
    },
    {
      id: '10000000-0000-0000-0000-000000000004',
      usuarioId: '00000000-0000-0000-0000-000000000007',
      cnpj: '34.567.890/0001-32',
      razaoSocial: 'Maré Tech Sistemas LTDA',
      nomeFantasia: 'Maré Tech Sistemas (Exemplo)',
      ehMei: false,
      setor: 'Tecnologia e Inovação',
      bairro: 'Renascença',
      municipio: 'São Luís',
      telefone: '9832357788',
      responsavelNome: 'Lucas Bastos',
      statusValidacao: 'VERIFICADA',
    },
    {
      id: '10000000-0000-0000-0000-000000000005',
      usuarioId: '00000000-0000-0000-0000-000000000008',
      cnpj: '45.678.901/0001-43',
      razaoSocial: 'Construtora Ilha Forte Engenharia LTDA',
      nomeFantasia: 'Ilha Forte Engenharia (Exemplo)',
      ehMei: false,
      setor: 'Construção Civil e Elétrica',
      bairro: 'Maracanã',
      municipio: 'São Luís',
      telefone: '9832449911',
      responsavelNome: 'Roberto Farias',
      statusValidacao: 'VERIFICADA',
    },
    {
      id: '10000000-0000-0000-0000-000000000006',
      usuarioId: '00000000-0000-0000-0000-000000000009',
      cnpj: '56.789.012/0001-54',
      razaoSocial: 'Clínica Saúde do Povo Itaqui MEI',
      nomeFantasia: 'Clínica Saúde do Povo (Exemplo)',
      ehMei: true,
      setor: 'Saúde e Bem-Estar',
      bairro: 'Anjo da Guarda',
      municipio: 'São Luís',
      telefone: '98991550022',
      responsavelNome: 'Patrícia Nogueira',
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
    {
      id: '30000000-0000-0000-0000-000000000004',
      empresaId: '10000000-0000-0000-0000-000000000004',
      empresaNome: 'Maré Tech Sistemas (Exemplo)',
      titulo: 'Analista de Suporte Técnico (Help Desk N1/N2)',
      area: 'Tecnologia da Informação',
      descricao:
        'Atendimento de chamados técnicos N1 e N2 via WhatsApp e plataforma web, diagnóstico de erros em sistemas SaaS e orientação didática a clientes.',
      bairro: 'Renascença',
      municipio: 'São Luís',
      modalidade: 'HIBRIDO',
      tipoContratacao: 'CLT',
      quantidadeVagas: 2,
      salarioMin: 2400,
      salarioMax: 3100,
      escolaridadeMinima: 'TECNICO',
      jornada: '40h semanais (segunda a sexta)',
      beneficios: ['Vale-alimentação', 'Auxílio home office', 'Plano de saúde'],
      origemTipo: 'INTERNA',
      origemUrl: null,
      imagemCapaUrl: '/vagas/capas/tecnologia.jpg',
      seloSimulado: true,
      status: 'PUBLICADA',
      publicadaEm: new Date().toISOString(),
      encerraEm: new Date(Date.now() + 35 * 86400000).toISOString(),
      requisitos: [
        { nome: 'Atendimento via WhatsApp e Plataformas Web', tipo: 'CONHECIMENTO', obrigatorio: true },
        { nome: 'Help Desk (N1/N2)', tipo: 'CONHECIMENTO', obrigatorio: true },
        { nome: 'Ferramentas de CRM/Tickets', tipo: 'CONHECIMENTO', obrigatorio: false },
      ],
    },
    {
      id: '30000000-0000-0000-0000-000000000005',
      empresaId: '10000000-0000-0000-0000-000000000004',
      empresaNome: 'Maré Tech Sistemas (Exemplo)',
      titulo: 'Desenvolvedor(a) Front-End Júnior (React / Next.js)',
      area: 'Tecnologia da Informação',
      descricao:
        'Desenvolvimento de interfaces responsivas com React, Next.js e Tailwind CSS, integração com APIs REST e versionamento em Git.',
      bairro: 'São Luís',
      municipio: 'São Luís',
      modalidade: 'REMOTO',
      tipoContratacao: 'CLT',
      quantidadeVagas: 2,
      salarioMin: 3200,
      salarioMax: 4200,
      escolaridadeMinima: 'SUPERIOR_INCOMPLETO',
      jornada: '40h semanais (flexível)',
      beneficios: ['Vale-alimentação', 'Auxílio equipamento', 'Plano odontológico'],
      origemTipo: 'INTERNA',
      origemUrl: null,
      imagemCapaUrl: '/vagas/capas/tecnologia.jpg',
      seloSimulado: true,
      status: 'PUBLICADA',
      publicadaEm: new Date().toISOString(),
      encerraEm: new Date(Date.now() + 40 * 86400000).toISOString(),
      requisitos: [
        { nome: 'React e Next.js', tipo: 'CONHECIMENTO', obrigatorio: true },
        { nome: 'HTML, CSS e JavaScript', tipo: 'CONHECIMENTO', obrigatorio: true },
        { nome: 'Git e GitHub', tipo: 'CONHECIMENTO', obrigatorio: false },
      ],
    },
    {
      id: '30000000-0000-0000-0000-000000000006',
      empresaId: '10000000-0000-0000-0000-000000000002',
      empresaNome: 'Inova SLZ Startup (Exemplo)',
      titulo: 'Estágio em Desenvolvimento Web e Dados',
      area: 'Tecnologia da Informação',
      descricao:
        'Apoio à criação de dashboards, automações de planilhas e manutenção de páginas web da startup no Parque Tecnológico.',
      bairro: 'Anjo da Guarda',
      municipio: 'São Luís',
      modalidade: 'HIBRIDO',
      tipoContratacao: 'ESTAGIO',
      quantidadeVagas: 2,
      salarioMin: 1100,
      salarioMax: null,
      escolaridadeMinima: 'SUPERIOR_INCOMPLETO',
      jornada: '30h semanais (6h/dia)',
      beneficios: ['Bolsa-auxílio', 'Vale-transporte', 'Mentoria técnica'],
      origemTipo: 'INTERNA',
      origemUrl: null,
      imagemCapaUrl: '/vagas/capas/assistente-atendimento-digital.jpg',
      seloSimulado: true,
      status: 'PUBLICADA',
      publicadaEm: new Date().toISOString(),
      encerraEm: new Date(Date.now() + 30 * 86400000).toISOString(),
      requisitos: [
        { nome: 'HTML, CSS e JavaScript', tipo: 'CONHECIMENTO', obrigatorio: true },
        { nome: 'Pacote Office', tipo: 'CONHECIMENTO', obrigatorio: false },
      ],
    },
    {
      id: '30000000-0000-0000-0000-000000000007',
      empresaId: '10000000-0000-0000-0000-000000000003',
      empresaNome: 'Atacadão Bacanga (Exemplo)',
      titulo: 'Operador(a) de Caixa e Atendimento ao Cliente',
      area: 'Comércio e vendas',
      descricao:
        'Registro de compras no PDV, fechamento de caixa, recebimento via PIX/cartão e atendimento cordial aos clientes da loja.',
      bairro: 'Vila Embratel',
      municipio: 'São Luís',
      modalidade: 'PRESENCIAL',
      tipoContratacao: 'CLT',
      quantidadeVagas: 4,
      salarioMin: 1620,
      salarioMax: 1850,
      escolaridadeMinima: 'MEDIO_COMPLETO',
      jornada: '44h semanais (escala 6x1)',
      beneficios: ['Vale-transporte', 'Vale-alimentação', 'Premiação por metas'],
      origemTipo: 'INTERNA',
      origemUrl: null,
      imagemCapaUrl: '/vagas/capas/comercio.jpg',
      seloSimulado: true,
      status: 'PUBLICADA',
      publicadaEm: new Date().toISOString(),
      encerraEm: new Date(Date.now() + 25 * 86400000).toISOString(),
      requisitos: [
        { nome: 'Atendimento ao público', tipo: 'CONHECIMENTO', obrigatorio: true },
        { nome: 'Operação de caixa', tipo: 'REQUISITO', obrigatorio: false },
      ],
    },
    {
      id: '30000000-0000-0000-0000-000000000008',
      empresaId: '10000000-0000-0000-0000-000000000003',
      empresaNome: 'Atacadão Bacanga (Exemplo)',
      titulo: 'Jovem Aprendiz — Administrativo e Estoque',
      area: 'Administrativo',
      descricao:
        'Primeira oportunidade profissional com apoio à conferência de mercadorias, organização de documentos e uso básico de planilhas.',
      bairro: 'Vila Embratel',
      municipio: 'São Luís',
      modalidade: 'PRESENCIAL',
      tipoContratacao: 'JOVEM_APRENDIZ',
      quantidadeVagas: 3,
      salarioMin: 920,
      salarioMax: null,
      escolaridadeMinima: 'MEDIO_INCOMPLETO',
      jornada: '20h semanais (manhã ou tarde)',
      beneficios: ['Vale-transporte', 'Capacitação teórica certificada'],
      origemTipo: 'INTERNA',
      origemUrl: null,
      imagemCapaUrl: '/vagas/capas/escritorio.jpg',
      seloSimulado: true,
      status: 'PUBLICADA',
      publicadaEm: new Date().toISOString(),
      encerraEm: new Date(Date.now() + 30 * 86400000).toISOString(),
      requisitos: [
        { nome: 'Informática básica', tipo: 'CONHECIMENTO', obrigatorio: true },
        { nome: 'Organização e vontade de aprender', tipo: 'REQUISITO', obrigatorio: false },
      ],
    },
    {
      id: '30000000-0000-0000-0000-000000000009',
      empresaId: '10000000-0000-0000-0000-000000000005',
      empresaNome: 'Ilha Forte Engenharia (Exemplo)',
      titulo: 'Eletricista Industrial e Predial',
      area: 'Manutenção e mecânica',
      descricao:
        'Instalação e manutenção de quadros elétricos, motores, iluminação industrial e inspeções preventivas seguindo normas de segurança.',
      bairro: 'Maracanã',
      municipio: 'São Luís',
      modalidade: 'PRESENCIAL',
      tipoContratacao: 'CLT',
      quantidadeVagas: 2,
      salarioMin: 2650,
      salarioMax: 3200,
      escolaridadeMinima: 'TECNICO',
      jornada: '44h semanais (segunda a sexta)',
      beneficios: ['Vale-transporte', 'Refeitório no local', 'Adicional de periculosidade'],
      origemTipo: 'INTERNA',
      origemUrl: null,
      imagemCapaUrl: '/vagas/capas/industria.jpg',
      seloSimulado: true,
      status: 'PUBLICADA',
      publicadaEm: new Date().toISOString(),
      encerraEm: new Date(Date.now() + 35 * 86400000).toISOString(),
      requisitos: [
        { nome: 'Instalações elétricas', tipo: 'REQUISITO', obrigatorio: true },
        { nome: 'Curso de NR-10', tipo: 'CERTIFICACAO', obrigatorio: true },
        { nome: 'Curso de NR-35', tipo: 'CERTIFICACAO', obrigatorio: false },
      ],
    },
    {
      id: '30000000-0000-0000-0000-000000000010',
      empresaId: '10000000-0000-0000-0000-000000000001',
      empresaNome: 'Porto Itaqui Logística (Exemplo)',
      titulo: 'Operador(a) de Empilhadeira Portuária',
      area: 'Logística e transporte',
      descricao:
        'Movimentação, empilhamento e carregamento de paletes e cargas em pátio logístico próximo ao Porto do Itaqui.',
      bairro: 'Itaqui-Bacanga',
      municipio: 'São Luís',
      modalidade: 'PRESENCIAL',
      tipoContratacao: 'CLT',
      quantidadeVagas: 3,
      salarioMin: 2550,
      salarioMax: 2950,
      escolaridadeMinima: 'MEDIO_COMPLETO',
      jornada: 'Turnos / escala',
      beneficios: ['Vale-transporte', 'Vale-alimentação', 'Plano de saúde'],
      origemTipo: 'INTERNA',
      origemUrl: null,
      imagemCapaUrl: '/vagas/capas/porto.jpg',
      seloSimulado: true,
      status: 'PUBLICADA',
      publicadaEm: new Date().toISOString(),
      encerraEm: new Date(Date.now() + 28 * 86400000).toISOString(),
      requisitos: [
        { nome: 'Operação de empilhadeira', tipo: 'CERTIFICACAO', obrigatorio: true },
        { nome: 'Controle de estoque', tipo: 'CONHECIMENTO', obrigatorio: false },
      ],
    },
    {
      id: '30000000-0000-0000-0000-000000000011',
      empresaId: '10000000-0000-0000-0000-000000000003',
      empresaNome: 'Atacadão Bacanga (Exemplo)',
      titulo: 'Motorista Entregador(a) — Rotas Urbanas',
      area: 'Logística e transporte',
      descricao:
        'Entrega de pedidos em bairros de São Luís, conferência de romaneio e zelo pelo veículo utilitário da distribuidora.',
      bairro: 'Cidade Operária',
      municipio: 'São Luís',
      modalidade: 'PRESENCIAL',
      tipoContratacao: 'CLT',
      quantidadeVagas: 2,
      salarioMin: 2150,
      salarioMax: 2450,
      escolaridadeMinima: 'FUNDAMENTAL_COMPLETO',
      jornada: 'Comercial (segunda a sábado)',
      beneficios: ['Vale-alimentação', 'Seguro de vida', 'Ajuda de custo'],
      origemTipo: 'INTERNA',
      origemUrl: null,
      imagemCapaUrl: '/vagas/capas/logistica.jpg',
      seloSimulado: true,
      status: 'PUBLICADA',
      publicadaEm: new Date().toISOString(),
      encerraEm: new Date(Date.now() + 30 * 86400000).toISOString(),
      requisitos: [
        { nome: 'CNH categoria B', tipo: 'REQUISITO', obrigatorio: true },
        { nome: 'Conhecimento de rotas em São Luís', tipo: 'CONHECIMENTO', obrigatorio: false },
      ],
    },
    {
      id: '30000000-0000-0000-0000-000000000012',
      empresaId: '10000000-0000-0000-0000-000000000006',
      empresaNome: 'Clínica Saúde do Povo (Exemplo)',
      titulo: 'Recepcionista de Clínica e Agendamento',
      area: 'Administrativo',
      descricao:
        'Recepção humanizada de pacientes, confirmação de consultas via WhatsApp, atualização de cadastro e organização da agenda médica.',
      bairro: 'Anjo da Guarda',
      municipio: 'São Luís',
      modalidade: 'PRESENCIAL',
      tipoContratacao: 'CLT',
      quantidadeVagas: 1,
      salarioMin: 1720,
      salarioMax: null,
      escolaridadeMinima: 'MEDIO_COMPLETO',
      jornada: '44h semanais (comercial)',
      beneficios: ['Vale-transporte', 'Vale-alimentação'],
      origemTipo: 'INTERNA',
      origemUrl: null,
      imagemCapaUrl: '/vagas/capas/escritorio.jpg',
      seloSimulado: true,
      status: 'PUBLICADA',
      publicadaEm: new Date().toISOString(),
      encerraEm: new Date(Date.now() + 25 * 86400000).toISOString(),
      requisitos: [
        { nome: 'Atendimento ao público', tipo: 'CONHECIMENTO', obrigatorio: true },
        { nome: 'WhatsApp Business', tipo: 'CONHECIMENTO', obrigatorio: false },
      ],
    },
    {
      id: '30000000-0000-0000-0000-000000000013',
      empresaId: '10000000-0000-0000-0000-000000000005',
      empresaNome: 'Ilha Forte Engenharia (Exemplo)',
      titulo: 'Auxiliar de Obras e Manutenção Predial',
      area: 'Construção civil',
      descricao:
        'Apoio em serviços de alvenaria, pintura, reparos hidráulicos e organização de canteiro de obras com uso obrigatório de EPIs.',
      bairro: 'Maracanã',
      municipio: 'São Luís',
      modalidade: 'PRESENCIAL',
      tipoContratacao: 'TEMPORARIO',
      quantidadeVagas: 5,
      salarioMin: 1680,
      salarioMax: null,
      escolaridadeMinima: 'FUNDAMENTAL_COMPLETO',
      jornada: '44h semanais',
      beneficios: ['Vale-transporte', 'Refeitório no local', 'Kit EPI completo'],
      origemTipo: 'INTERNA',
      origemUrl: null,
      imagemCapaUrl: '/vagas/capas/industria.jpg',
      seloSimulado: true,
      status: 'PUBLICADA',
      publicadaEm: new Date().toISOString(),
      encerraEm: new Date(Date.now() + 22 * 86400000).toISOString(),
      requisitos: [
        { nome: 'Noções de obras e manutenção predial', tipo: 'REQUISITO', obrigatorio: true },
        { nome: 'Curso de NR-35', tipo: 'CERTIFICACAO', obrigatorio: false },
      ],
    },
    {
      id: '30000000-0000-0000-0000-000000000014',
      empresaId: '10000000-0000-0000-0000-000000000002',
      empresaNome: 'Inova SLZ Startup (Exemplo)',
      titulo: 'Social Media e Criação de Conteúdo Digital (MEI)',
      area: 'Marketing e comunicação',
      descricao:
        'Produção de artes, vídeos curtos e calendário de postagens para divulgação de pequenos negócios locais em São Luís.',
      bairro: 'São Luís',
      municipio: 'São Luís',
      modalidade: 'REMOTO',
      tipoContratacao: 'AUTONOMO_MEI',
      quantidadeVagas: 1,
      salarioMin: 2000,
      salarioMax: 2600,
      escolaridadeMinima: 'MEDIO_COMPLETO',
      jornada: 'Por entregas / flexível',
      beneficios: ['Trabalho remoto', 'Bônus por campanhas'],
      origemTipo: 'INTERNA',
      origemUrl: null,
      imagemCapaUrl: '/vagas/capas/assistente-atendimento-digital.jpg',
      seloSimulado: true,
      status: 'PUBLICADA',
      publicadaEm: new Date().toISOString(),
      encerraEm: new Date(Date.now() + 30 * 86400000).toISOString(),
      requisitos: [
        { nome: 'Marketing digital e redes sociais', tipo: 'CONHECIMENTO', obrigatorio: true },
        { nome: 'Edição básica de imagens e vídeos', tipo: 'CONHECIMENTO', obrigatorio: false },
      ],
    },
    {
      id: '30000000-0000-0000-0000-000000000015',
      empresaId: '10000000-0000-0000-0000-000000000001',
      empresaNome: 'Porto Itaqui Logística (Exemplo)',
      titulo: 'Soldador(a) Industrial (Eletrodo / MIG-MAG)',
      area: 'Manutenção e mecânica',
      descricao:
        'Soldagem de estruturas metálicas, reparo de equipamentos portuários e leitura básica de desenhos técnicos industriais.',
      bairro: 'Itaqui-Bacanga',
      municipio: 'São Luís',
      modalidade: 'PRESENCIAL',
      tipoContratacao: 'CLT',
      quantidadeVagas: 2,
      salarioMin: 2900,
      salarioMax: 3500,
      escolaridadeMinima: 'MEDIO_COMPLETO',
      jornada: '44h semanais',
      beneficios: ['Vale-transporte', 'Refeitório no local', 'Plano de saúde', 'Adicional de insalubridade'],
      origemTipo: 'INTERNA',
      origemUrl: null,
      imagemCapaUrl: '/vagas/capas/ajudante-manutencao.jpg',
      seloSimulado: true,
      status: 'PUBLICADA',
      publicadaEm: new Date().toISOString(),
      encerraEm: new Date(Date.now() + 35 * 86400000).toISOString(),
      requisitos: [
        { nome: 'Soldagem básica', tipo: 'REQUISITO', obrigatorio: true },
        { nome: 'Curso de NR-12', tipo: 'CERTIFICACAO', obrigatorio: false },
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
    {
      id: '40000000-0000-0000-0000-000000000004',
      titulo: 'NR-10: Segurança em Instalações e Serviços em Eletricidade',
      area: 'Segurança do trabalho',
      descricao:
        'Formação obrigatória para atuação segura em painéis, redes e manutenção elétrica industrial e predial.',
      competenciasDesenvolvidas: ['Curso de NR-10', 'Instalações elétricas', 'Segurança industrial'],
      instituicao: 'SEMISPE / SENAI Parceiro',
      modalidade: 'PRESENCIAL',
      cargaHoraria: 40,
      preRequisitos: 'Ensino Fundamental completo',
      tipo: 'PROGRAMADO',
      imagemCapaUrl: '/cursos/capas/seguranca.jpg',
      seloSimulado: true,
      status: 'ATIVO',
      turmas: [
        {
          id: '50000000-0000-0000-0000-000000000003',
          codigoTurma: 'NR10-IB-2026-01',
          localBairro: 'Itaqui-Bacanga',
          vagasTotais: 25,
          dataInicio: diaDemo(24),
          horario: '18:30 às 21:30',
          status: 'INSCRICOES_ABERTAS',
        },
      ],
    },
    {
      id: '40000000-0000-0000-0000-000000000005',
      titulo: 'NR-35: Trabalho em Altura com Segurança',
      area: 'Segurança do trabalho',
      descricao:
        'Treinamento teórico e prático sobre uso de cintos, linhas de vida, prevenção de quedas e resgate em altura.',
      competenciasDesenvolvidas: ['Curso de NR-35', 'Segurança industrial'],
      instituicao: 'SEMISPE / Parceiro Técnico',
      modalidade: 'PRESENCIAL',
      cargaHoraria: 8,
      preRequisitos: 'Ensino Fundamental completo',
      tipo: 'PROGRAMADO',
      imagemCapaUrl: '/cursos/capas/seguranca.jpg',
      seloSimulado: true,
      status: 'ATIVO',
      turmas: [
        {
          id: '50000000-0000-0000-0000-000000000004',
          codigoTurma: 'NR35-MC-2026-01',
          localBairro: 'Maracanã',
          vagasTotais: 30,
          dataInicio: diaDemo(16),
          horario: '08:00 às 17:00',
          status: 'INSCRICOES_ABERTAS',
        },
      ],
    },
    {
      id: '40000000-0000-0000-0000-000000000006',
      titulo: 'Excel Aplicado à Logística e Controle de Estoque',
      area: 'Logística e transporte',
      descricao:
        'Planilhas práticas para inventário, curva ABC, entrada e saída de mercadorias e indicadores de almoxarifado.',
      competenciasDesenvolvidas: ['Controle de estoque', 'Pacote Office', 'Planilhas'],
      instituicao: 'SEMISPE / Polo Vila Embratel',
      modalidade: 'HIBRIDO',
      cargaHoraria: 32,
      preRequisitos: 'Informática básica',
      tipo: 'PROGRAMADO',
      imagemCapaUrl: '/cursos/capas/logistica.jpg',
      seloSimulado: true,
      status: 'ATIVO',
      turmas: [
        {
          id: '50000000-0000-0000-0000-000000000005',
          codigoTurma: 'EXCL-VE-2026-01',
          localBairro: 'Vila Embratel',
          vagasTotais: 35,
          dataInicio: diaDemo(20),
          horario: '19:00 às 21:00',
          status: 'INSCRICOES_ABERTAS',
        },
      ],
    },
    {
      id: '40000000-0000-0000-0000-000000000007',
      titulo: 'Atendimento ao Público, WhatsApp Business e CRM',
      area: 'Administrativo',
      descricao:
        'Técnicas de atendimento humanizado, comunicação clara, organização de mensagens e uso de CRM para pequenas empresas.',
      competenciasDesenvolvidas: ['Atendimento ao público', 'WhatsApp Business', 'Ferramentas de CRM/Tickets'],
      instituicao: 'SEMISPE / Parque Tecnológico',
      modalidade: 'HIBRIDO',
      cargaHoraria: 24,
      preRequisitos: null,
      tipo: 'PROGRAMADO',
      imagemCapaUrl: '/cursos/capas/capacitacao.jpg',
      seloSimulado: true,
      status: 'ATIVO',
      turmas: [
        {
          id: '50000000-0000-0000-0000-000000000006',
          codigoTurma: 'ATD-AG-2026-01',
          localBairro: 'Anjo da Guarda',
          vagasTotais: 30,
          dataInicio: diaDemo(21),
          horario: '14:00 às 17:00',
          status: 'INSCRICOES_ABERTAS',
        },
      ],
    },
    {
      id: '40000000-0000-0000-0000-000000000008',
      titulo: 'Suporte Técnico em TI e Help Desk (N1/N2)',
      area: 'Tecnologia da Informação',
      descricao:
        'Triagem de incidentes, diagnóstico de sistemas web, redes básicas, registro de tickets e atendimento técnico ao usuário.',
      competenciasDesenvolvidas: [
        'Help Desk (N1/N2)',
        'Atendimento via WhatsApp e Plataformas Web',
        'Ferramentas de CRM/Tickets',
      ],
      instituicao: 'SEMISPE / Comunidade Tech SLZ',
      modalidade: 'HIBRIDO',
      cargaHoraria: 60,
      preRequisitos: 'Ensino Médio completo ou cursando',
      tipo: 'PROGRAMADO',
      imagemCapaUrl: '/cursos/capas/informatica.jpg',
      seloSimulado: true,
      status: 'ATIVO',
      turmas: [
        {
          id: '50000000-0000-0000-0000-000000000007',
          codigoTurma: 'HDK-PQT-2026-01',
          localBairro: 'Itaqui-Bacanga',
          vagasTotais: 25,
          dataInicio: diaDemo(25),
          horario: '19:00 às 21:30',
          status: 'INSCRICOES_ABERTAS',
        },
      ],
    },
    {
      id: '40000000-0000-0000-0000-000000000009',
      titulo: 'Introdução ao Desenvolvimento Web (HTML, CSS, JS e Git)',
      area: 'Tecnologia da Informação',
      descricao:
        'Trilha prática para construir páginas responsivas, lógica em JavaScript e publicar projetos no GitHub.',
      competenciasDesenvolvidas: ['HTML, CSS e JavaScript', 'Git e GitHub', 'React e Next.js'],
      instituicao: 'SEMISPE / Parque Tecnológico Digital',
      modalidade: 'REMOTO',
      cargaHoraria: 80,
      preRequisitos: 'Informática básica',
      tipo: 'PROGRAMADO',
      imagemCapaUrl: '/cursos/capas/informatica.jpg',
      seloSimulado: true,
      status: 'ATIVO',
      turmas: [
        {
          id: '50000000-0000-0000-0000-000000000008',
          codigoTurma: 'WEB-ON-2026-01',
          localBairro: 'São Luís (Online)',
          vagasTotais: 60,
          dataInicio: diaDemo(26),
          horario: '19:30 às 21:30',
          status: 'INSCRICOES_ABERTAS',
        },
      ],
    },
    {
      id: '40000000-0000-0000-0000-000000000010',
      titulo: 'Operação de Caixa, Vendas e Varejo Moderno',
      area: 'Comércio e vendas',
      descricao:
        'Rotinas de PDV, abertura e fechamento de caixa, pagamentos digitais, prevenção de perdas e abordagem de vendas.',
      competenciasDesenvolvidas: ['Operação de caixa', 'Atendimento ao público'],
      instituicao: 'SEMISPE / Polo Cidade Operária',
      modalidade: 'PRESENCIAL',
      cargaHoraria: 30,
      preRequisitos: null,
      tipo: 'PROGRAMADO',
      imagemCapaUrl: '/vagas/capas/comercio.jpg',
      seloSimulado: true,
      status: 'ATIVO',
      turmas: [
        {
          id: '50000000-0000-0000-0000-000000000009',
          codigoTurma: 'CXA-CO-2026-01',
          localBairro: 'Cidade Operária',
          vagasTotais: 30,
          dataInicio: diaDemo(19),
          horario: '08:30 às 11:30',
          status: 'INSCRICOES_ABERTAS',
        },
      ],
    },
    {
      id: '40000000-0000-0000-0000-000000000011',
      titulo: 'Soldagem Industrial (Eletrodo Revestido e MIG/MAG)',
      area: 'Manutenção e mecânica',
      descricao:
        'Capacitação prática sob demanda voltada para oficinas, manutenção industrial e cadeia portuária.',
      competenciasDesenvolvidas: ['Soldagem básica', 'Experiência em oficina'],
      instituicao: 'SEMISPE (Previsão com parceiros)',
      modalidade: 'PRESENCIAL',
      cargaHoraria: 80,
      preRequisitos: 'Ensino Fundamental completo',
      tipo: 'SOB_DEMANDA',
      imagemCapaUrl: '/vagas/capas/industria.jpg',
      seloSimulado: true,
      status: 'ATIVO',
      turmas: [],
    },
    {
      id: '40000000-0000-0000-0000-000000000012',
      titulo: 'Marketing Digital, Redes Sociais e Empreendedorismo MEI',
      area: 'Marketing e comunicação',
      descricao:
        'Criação de conteúdo pelo celular, posicionamento local, precificação e formalização como MEI em São Luís.',
      competenciasDesenvolvidas: [
        'Marketing digital e redes sociais',
        'Edição básica de imagens e vídeos',
      ],
      instituicao: 'SEMISPE / SEBRAE Parceiro',
      modalidade: 'REMOTO',
      cargaHoraria: 20,
      preRequisitos: null,
      tipo: 'SOB_DEMANDA',
      imagemCapaUrl: '/cursos/capas/capacitacao.jpg',
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
    {
      id: 'ped-3',
      candidatoId: null,
      cursoId: '40000000-0000-0000-0000-000000000011',
      temaDesejado: 'Soldagem Industrial MIG/MAG',
      temaNormalizado: 'soldagem industrial mig/mag',
      motivo: 'Alta demanda em oficinas do Itaqui-Bacanga',
      turnoPreferido: 'Noturno',
      bairro: 'Itaqui-Bacanga',
      origemCanal: 'WHATSAPP',
      status: 'REGISTRADO',
      criadoEm: new Date().toISOString(),
    },
    {
      id: 'ped-4',
      candidatoId: null,
      cursoId: '40000000-0000-0000-0000-000000000012',
      temaDesejado: 'Marketing Digital para MEI',
      temaNormalizado: 'marketing digital para mei',
      motivo: 'Divulgar pequenos serviços pelo Instagram e WhatsApp',
      turnoPreferido: 'Noturno',
      bairro: 'Anjo da Guarda',
      origemCanal: 'WEB',
      status: 'REGISTRADO',
      criadoEm: new Date().toISOString(),
    },
    {
      id: 'ped-5',
      candidatoId: null,
      cursoId: null,
      temaDesejado: 'Manutenção de Ar-Condicionado Split',
      temaNormalizado: 'manutencao de ar-condicionado split',
      motivo: 'Trabalhar como autônomo na região',
      turnoPreferido: 'Vespertino',
      bairro: 'Cidade Operária',
      origemCanal: 'WHATSAPP',
      status: 'REGISTRADO',
      criadoEm: new Date().toISOString(),
    },
  ];

  public conversasWhatsApp: ConversaWhatsAppRecord[] = [];
  public mensagensWhatsApp: MensagemWhatsAppRecord[] = [];
  public curriculosArquivos: CurriculoArquivoRecord[] = [];

  // Mesmo conteúdo da migration 20261125000005_conteudo_exemplo_editais_eventos.sql
  public editais: EditalRecord[] = [
    {
      id: '60000000-0000-0000-0000-000000000001',
      titulo: 'CPSI Porto do Itaqui — Contratação Pública de Soluções Inovadoras',
      organizacao: 'EMAP · Porto do Itaqui',
      resumo:
        'Chamada para startups e empresas apresentarem soluções tecnológicas para desafios logísticos, operacionais e de sustentabilidade do Porto do Itaqui.',
      publicoAlvo: 'Startups, empresas e ICTs',
      beneficio: 'Até R$ 100 mil por contrato',
      inscricoesAte: null,
      prazoDescricao: 'Chamada em fluxo contínuo',
      linkUrl: 'https://www.portodoitaqui.com',
      tags: ['Startups', 'Inovação aberta', 'Porto do Itaqui'],
      seloSimulado: true,
      publicado: true,
    },
    {
      id: '60000000-0000-0000-0000-000000000002',
      titulo: 'Residência em Inovação Portuária',
      organizacao: 'FAPEMA · Porto do Itaqui',
      resumo:
        'Seleção de residentes para projetos de pesquisa aplicada e transformação digital no ecossistema portuário de São Luís, com duração de 12 meses.',
      publicoAlvo: 'Estudantes e recém-formados',
      beneficio: 'Bolsas de R$ 3.000 a R$ 5.500 por mês',
      inscricoesAte: diaDemo(20),
      prazoDescricao: null,
      linkUrl: 'https://www.fapema.br',
      tags: ['Bolsas', 'Pesquisa aplicada', 'Itaqui-Bacanga'],
      seloSimulado: true,
      publicado: true,
    },
    {
      id: '60000000-0000-0000-0000-000000000003',
      titulo: 'PISIM — Programa de Incubação de Startups Inova Maranhão',
      organizacao: 'SECTI-MA · FAPEMA',
      resumo:
        'Programa estadual que acompanha startups maranhenses da validação da ideia ao mercado, com incubação, mentorias e rede de parceiros.',
      publicoAlvo: 'Empreendedores e startups',
      beneficio: 'Incubação e mentorias',
      inscricoesAte: diaDemo(45),
      prazoDescricao: null,
      linkUrl: 'https://www.fapema.br',
      tags: ['Incubação', 'Startups', 'Mentoria'],
      seloSimulado: true,
      publicado: true,
    },
    {
      id: '60000000-0000-0000-0000-000000000004',
      titulo: 'Banco de Talentos e Vagas de Estágio',
      organizacao: 'IEL Maranhão · Sistema FIEMA',
      resumo:
        'Cadastro de estudantes de nível técnico e superior para oportunidades de estágio em empresas e indústrias do Maranhão.',
      publicoAlvo: 'Estudantes de nível técnico e superior',
      beneficio: 'Estágio remunerado',
      inscricoesAte: null,
      prazoDescricao: 'Cadastro em fluxo contínuo',
      linkUrl: 'https://carreiras.iel.org.br',
      tags: ['Estágio', 'Primeiro emprego', 'Indústria'],
      seloSimulado: true,
      publicado: true,
    },
  ];

  public eventos: EventoRecord[] = [
    {
      id: '70000000-0000-0000-0000-000000000001',
      titulo: 'Imersão Tech e IA na Prática',
      organizacao: 'SECTI · SEBRAE · Comunidade Tech SLZ',
      resumo:
        'Oficinas práticas de inteligência artificial generativa e prototipagem rápida, com espaço para conexão entre estudantes, desenvolvedores e startups locais.',
      inicio: instanteEmSaoLuis(diaDemo(6), '14:00'),
      fim: instanteEmSaoLuis(diaDemo(6), '18:00'),
      local: 'Centro Histórico, São Luís',
      modalidade: 'PRESENCIAL',
      gratuito: true,
      linkInscricao: null,
      tags: ['IA', 'Oficina', 'Networking'],
      seloSimulado: true,
      publicado: true,
    },
    {
      id: '70000000-0000-0000-0000-000000000002',
      titulo: 'Meetup Ecossistema SLZ: do código ao produto',
      organizacao: 'Comunidades tech de São Luís',
      resumo:
        'Painel com fundadores de startups maranhenses sobre produto, contratação de talentos em início de carreira e oportunidades de mercado.',
      inicio: instanteEmSaoLuis(diaDemo(9), '19:00'),
      fim: instanteEmSaoLuis(diaDemo(9), '21:30'),
      local: 'Parque Tecnológico de São Luís · Itaqui-Bacanga',
      modalidade: 'PRESENCIAL',
      gratuito: true,
      linkInscricao: null,
      tags: ['Startups', 'Comunidade', 'Carreira'],
      seloSimulado: true,
      publicado: true,
    },
    {
      id: '70000000-0000-0000-0000-000000000003',
      titulo: 'Encontro da Governança do Ecossistema de Inovação',
      organizacao: 'SEMISPE e instituições parceiras',
      resumo:
        'Alinhamento dos grupos de trabalho de academia, empresas, governo e sociedade civil para o plano de ações de inovação da capital.',
      inicio: instanteEmSaoLuis(diaDemo(14), '09:00'),
      fim: instanteEmSaoLuis(diaDemo(14), '12:00'),
      local: 'Cidade Operária, São Luís',
      modalidade: 'HIBRIDO',
      gratuito: true,
      linkInscricao: null,
      tags: ['Governança', 'Políticas públicas'],
      seloSimulado: true,
      publicado: true,
    },
    {
      id: '70000000-0000-0000-0000-000000000004',
      titulo: 'Trilha de Qualificação: negócios digitais e mercado de trabalho',
      organizacao: 'SEMISPE',
      resumo:
        'Orientação sobre currículo, competências digitais mais procuradas pelas empresas de São Luís e caminhos para empreender.',
      inicio: instanteEmSaoLuis(diaDemo(21), '18:30'),
      fim: instanteEmSaoLuis(diaDemo(21), '20:30'),
      local: 'Transmissão online',
      modalidade: 'ONLINE',
      gratuito: true,
      linkInscricao: null,
      tags: ['Qualificação', 'Empregabilidade'],
      seloSimulado: true,
      publicado: true,
    },
  ];

  public inscricoesBoletim: InscricaoBoletimRecord[] = [];
}

const globalForFarol = globalThis as unknown as { __farolStore?: InMemoryFarolStore };
export const farolMemoryStore = globalForFarol.__farolStore ?? new InMemoryFarolStore();
if (process.env.NODE_ENV !== 'production') {
  globalForFarol.__farolStore = farolMemoryStore;
}
