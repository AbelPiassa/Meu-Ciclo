# API Meu Ciclo+ — Entrega 4

Primeira implementação da frente de Abel: Express + SQLite em arquivo, quatro CRUDs,
relacionamentos e contrato de integração. Código independente do Expo, sem alterar suas telas.

## Executar

Requer **Node.js 24.x** (o backend usa `node:sqlite`; Node 20 não executa este módulo).
Se você usa nvm: `nvm install 24` e `nvm use 24` dentro de `backend/`.

```bash
cd backend
npm ci
cp .env.example .env
npm start
```

A API fica em `http://127.0.0.1:3000`; saúde: `GET /health`.
O esquema v1 é criado automaticamente e de forma transacional na primeira abertura.
O arquivo `data/meu-ciclo.sqlite` permanece após reiniciar o servidor. Não o exclua para atualizar código.
Futuras mudanças de esquema precisam de migrações incrementais, sem apagar o banco.

Para testar no celular na mesma rede, configure `HOST=0.0.0.0` no `.env` e use
`http://IP_DO_COMPUTADOR:3000/api` no cliente. `localhost` no celular aponta para o celular.
Libere somente a rede de laboratório no firewall. Para Expo Web, inclua a origem exata
em `CORS_ORIGINS`. Emulador Android pode usar o endereço de host próprio do emulador.
Acesso HTTP em dispositivos depende da configuração nativa do app e deve ser validado pelo grupo.

## Contrato para a equipe

Consulte [o contrato completo](docs/API.md). As rotas são:

| Entidade | Coleção | Chave |
| --- | --- | --- |
| Perfil | `/api/perfis` | `id_perfil` |
| Ciclo Menstrual | `/api/ciclos` | `id_ciclo` |
| Rede de Apoio | `/api/contatos` | `id_contato` |
| Diário de Ocorrências | `/api/ocorrencias` | `id_ocorrencia` |

Cada coleção implementa **GET, GET /:id, POST, PUT /:id e DELETE /:id** (20 endpoints).
POST Perfil cria usuário/perfil e devolve uma sessão. Demais operações exigem Bearer token.
GET Perfil lista somente o próprio perfil; não existe listagem pública de usuárias.

As filhas têm FK para Perfil. O servidor exige que `id_perfil` seja o da sessão.
A exclusão de Perfil apaga também suas sessões, ciclos, contatos e ocorrências por CASCADE.
A tela deve explicar esse efeito e obter confirmação antes de enviar DELETE; saída rápida nunca exclui dados.

## Testar

```bash
npm test
npm run lint
npm run typecheck
```

Os testes criam dados exclusivamente fictícios e bancos temporários, sem usar o arquivo do servidor.
Cobrem os 20 endpoints, isolamento entre perfis, vínculo inválido, exclusão em cascata,
reabertura do banco, validação de entradas e sessões. Nenhuma ligação ou alerta é enviado.
Para povoar uma demonstração, use os POSTs fictícios do contrato: eles constituem um seed
manual e não apagam dados existentes. Não há carga automática de dados ao iniciar.

## Limites desta etapa

- Backend testado por HTTP local; integração Expo, dispositivo/rede e testes do grupo ainda pendentes.
- Sessões expiram em 24 h e têm apenas o hash armazenado; senha usa scrypt e salt aleatório.
- Sem recuperação/troca de senha, verificação de identidade ou serviço de alertas.
- SQLite não está cifrado em repouso nesta etapa; somente dados fictícios. Não publicar este
  protótipo com informações reais. HTTPS, operação segura, política de retenção, proteção do
  dispositivo e recuperação de acesso ainda precisam de trabalho antes de uso real.
- Token é retornado só na criação/login. Nunca colocá-lo em URL, log ou arquivo versionado.
  O cliente deve definir armazenamento apropriado; não embutir credenciais no código.
- `alerta_automatico` é apenas uma preferência armazenada, não uma promessa de envio.
- `nivel_perigo` é informação declarada, não inferência do modelo de Data Science.
- O modelo/indicador SINAN ainda não foi implementado nesta frente.

Responsabilidades e limites de edição estão em [responsabilidades](docs/RESPONSABILIDADES.md).
