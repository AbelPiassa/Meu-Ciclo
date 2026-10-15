

export const perfilFicticio = {
  id_perfil: 1,
  nome: "Usuária de Teste",
  telefone_emergencia: "(00) 00000-0001",
  modo_disfarce: true,
  notificacoes: true,
  tema: "Claro",
  foto_url: null,
  usuario: "usuaria.teste",
};

export const ciclosFicticios = [
  {
    id_ciclo: 1,
    id_perfil: 1,
    data_inicio: "05/10/2026",
    data_fim: "09/10/2026",
    fluxo: "Moderado",
    humor: "Calma",
    sintomas: "Cólica leve",
    observacoes: "",
  },
  {
    id_ciclo: 2,
    id_perfil: 1,
    data_inicio: "07/09/2026",
    data_fim: "11/09/2026",
    fluxo: "Intenso",
    humor: "Cansada",
    sintomas: "Dor de cabeça",
    observacoes: "",
  },
  {
    id_ciclo: 3,
    id_perfil: 1,
    data_inicio: "10/08/2026",
    data_fim: "14/08/2026",
    fluxo: "Leve",
    humor: "Tranquila",
    sintomas: "",
    observacoes: "",
  },
];

export const contatosApoioFicticios = [
  {
    id_contato: 1,
    id_perfil: 1,
    nome: "Ana",
    telefone: "(00) 00000-0001",
    relacionamento: "Amiga",
    alerta_automatico: true,
    observacoes: "",
  },
  {
    id_contato: 2,
    id_perfil: 1,
    nome: "Marina",
    telefone: "(00) 00000-0002",
    relacionamento: "Irmã",
    alerta_automatico: false,
    observacoes: "",
  },
  {
    id_contato: 3,
    id_perfil: 1,
    nome: "Dona Célia",
    telefone: "(00) 00000-0003",
    relacionamento: "Vizinha",
    alerta_automatico: false,
    observacoes: "",
  },
];

export const ocorrenciasFicticias = [
  {
    id_ocorrencia: 1,
    id_perfil: 1,
    data_ocorrencia: "15/09/2026",
    tipo_ocorrencia: "Discussão em casa",
    descricao_relato: "Conversa intensa, sem agressão física (relato fictício).",
    como_se_sentiu: "Assustada",
    nivel_perigo: "Baixo",
    acionou_policia: false,
  },
  {
    id_ocorrencia: 2,
    id_perfil: 1,
    data_ocorrencia: "02/10/2026",
    tipo_ocorrencia: "Ameaça verbal",
    descricao_relato: "Registro de exemplo para o protótipo (relato fictício).",
    como_se_sentiu: "Insegura",
    nivel_perigo: "Médio",
    acionou_policia: false,
  },
];

export const canaisAjuda = [
  {
    numero: "Ligue 180",
    descricao: "Central de Atendimento à Mulher — 24h, gratuito",
  },
  {
    numero: "Ligue 190",
    descricao: "Polícia Militar — emergências",
  },
];

export const redeLocalExemplo = [
  { nome: "Delegacia especializada local", descricao: "A confirmar endereço e telefone atualizados" },
  { nome: "CRAS / CREAS local", descricao: "A confirmar endereço e telefone atualizados" },
];
