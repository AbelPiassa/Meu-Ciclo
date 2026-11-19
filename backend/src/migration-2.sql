CREATE TABLE IF NOT EXISTS alertas_sos (
  id_alerta INTEGER PRIMARY KEY AUTOINCREMENT,
  id_perfil INTEGER NOT NULL REFERENCES perfis(id_perfil) ON DELETE CASCADE,
  criado_em TEXT NOT NULL,
  latitude REAL NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude REAL NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  origem TEXT NOT NULL CHECK (origem IN ('simulada', 'dispositivo_teste')),
  status TEXT NOT NULL DEFAULT 'Novo' CHECK (status IN ('Novo', 'Em atendimento', 'Concluído'))
) STRICT;
CREATE INDEX IF NOT EXISTS idx_alertas_perfil ON alertas_sos(id_perfil);
PRAGMA user_version = 2;
