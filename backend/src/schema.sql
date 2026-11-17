CREATE TABLE IF NOT EXISTS perfis (
  id_perfil INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  nome TEXT NOT NULL,
  telefone_emergencia TEXT NOT NULL,
  modo_disfarce INTEGER NOT NULL CHECK (modo_disfarce IN (0,1)),
  notificacoes INTEGER NOT NULL CHECK (notificacoes IN (0,1)),
  tema TEXT NOT NULL CHECK (tema IN ('Claro','Escuro'))
) STRICT;
CREATE TABLE IF NOT EXISTS sessoes (
  token_hash TEXT PRIMARY KEY,
  id_perfil INTEGER NOT NULL REFERENCES perfis(id_perfil) ON DELETE CASCADE,
  expira_em INTEGER NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS ciclos (
  id_ciclo INTEGER PRIMARY KEY AUTOINCREMENT,
  id_perfil INTEGER NOT NULL REFERENCES perfis(id_perfil) ON DELETE CASCADE,
  data_inicio TEXT NOT NULL, data_fim TEXT NOT NULL CHECK (data_fim >= data_inicio),
  fluxo TEXT NOT NULL CHECK (fluxo IN ('Leve','Moderado','Intenso')),
  humor TEXT NOT NULL, sintomas TEXT NOT NULL, observacoes TEXT NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS contatos (
  id_contato INTEGER PRIMARY KEY AUTOINCREMENT,
  id_perfil INTEGER NOT NULL REFERENCES perfis(id_perfil) ON DELETE CASCADE,
  nome TEXT NOT NULL, telefone TEXT NOT NULL, relacionamento TEXT NOT NULL,
  alerta_automatico INTEGER NOT NULL CHECK (alerta_automatico IN (0,1)), observacoes TEXT NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS ocorrencias (
  id_ocorrencia INTEGER PRIMARY KEY AUTOINCREMENT,
  id_perfil INTEGER NOT NULL REFERENCES perfis(id_perfil) ON DELETE CASCADE,
  data_ocorrencia TEXT NOT NULL, tipo_ocorrencia TEXT NOT NULL,
  descricao_relato TEXT NOT NULL, como_se_sentiu TEXT NOT NULL,
  nivel_perigo TEXT NOT NULL CHECK (nivel_perigo IN ('Não informado','Baixo','Médio','Alto')),
  acionou_policia INTEGER NOT NULL CHECK (acionou_policia IN (0,1))
) STRICT;
CREATE INDEX IF NOT EXISTS idx_ciclos_perfil ON ciclos(id_perfil);
CREATE INDEX IF NOT EXISTS idx_contatos_perfil ON contatos(id_perfil);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_perfil ON ocorrencias(id_perfil);
CREATE INDEX IF NOT EXISTS idx_sessoes_perfil ON sessoes(id_perfil);
PRAGMA user_version = 1;
