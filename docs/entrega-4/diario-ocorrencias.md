# Entrega 4 — Diário de Ocorrências integrado à API

Revisão final do PR #9 sobre a `master` que já contém os PRs #6 e #8 (backend e Perfil do Abel).
O Diário passou a usar a infraestrutura compartilhada do aplicativo: uma única sessão, um único
cliente HTTP e o login principal.

## O que mudou nesta revisão

- **Branch atualizada com a `master`** (`feat/diario-api`). O único conflito foi em `USO_IA.md`:
  os registros das duas partes foram preservados (nada foi removido).
- **Sessão independente removida.** `src/servicos/sessao.js` foi excluído; o Diário usa
  `src/services/sessao.js` (`obterSessao`, `requisicaoAutenticada`, `encerrarSessao`).
- **Cliente HTTP próprio removido.** `src/servicos/clienteApi.js` e `src/servicos/configApi.js`
  foram excluídos; as chamadas usam `src/services/api.js` no contrato dele
  (`requisicao(caminho, { metodo, dados, token })`, `Error` com `status`, `codigo` e `campos`).
- **Login separado removido.** A tela não pede usuário/senha; sem sessão, mostra um botão que leva
  ao Login do aplicativo. `src/hooks/useSessaoApi.js` também foi excluído (a tela usa `useSessao`).
- **`EXPO_PUBLIC_API_URL` sem `/api`**, como no Perfil: os caminhos já incluem `/api/...`
  (ex.: `http://127.0.0.1:3000`).
- **Encerramento de sessão seguro.** Sair da conta, erro 401 e Quick Exit limpam a sessão
  compartilhada; a tela descarta os relatos e ignora respostas que cheguem depois
  (`src/utils/guardaResposta.js`), para que nada antigo reapareça.

## Arquivos do Diário

| Arquivo | Papel |
| --- | --- |
| `src/pages/DiarioOcorrencias.js` | tela do Diário (lista, formulário, exclusão com confirmação, canais de ajuda) |
| `src/services/ocorrencias.js` | CRUD `/api/ocorrencias`, conversão de datas e montagem do corpo do PUT |
| `src/utils/datasApi.js` | conversão DD/MM/AAAA ↔ AAAA-MM-DD e `hojeIso` (data local) |
| `src/utils/validacaoOcorrencia.js` | validação do formulário (obrigatórios, data real, não futura, ≥1900, ≤5000) |
| `src/utils/mensagensApi.js` | tradução das mensagens de campo devolvidas pela API |
| `src/utils/guardaResposta.js` | guarda que descarta respostas de uma sessão já encerrada |
| `testes/apoio/{ambiente,servidorApi}.js` | apoio: URL de teste e API real em porta livre com banco temporário |
| `testes/servicos/{ocorrencias,guarda-resposta,datas-validacao,diario-integracao}.test.js` | testes |

Nenhum arquivo de outro integrante foi alterado nesta revisão (Login, Cadastro, Perfil,
Configurações, Rede de Apoio, ciclos e `backend/` continuam como estavam na `master`).

## Regras implementadas

- **Perfil:** `id_perfil` vem sempre da sessão, nunca é fixo. A API rejeita (422) outro perfil e
  oculta (404) registros alheios.
- **Validação no app:** data e descrição obrigatórias; data real em DD/MM/AAAA; não pode ser futura
  nem anterior a 1900; descrição até 5000 caracteres. Nada é enviado quando o formulário é inválido.
- **PUT:** a API zera campos opcionais omitidos; o app envia o objeto completo, preservando tipo,
  "como se sentiu", nível de perigo e acionou_policia.
- **Erros:** 401 (encerra a sessão e a tela volta ao estado sem conta), 404 (recarrega a lista),
  422 (mensagens de campo traduzidas), 5xx e falha de rede (mensagem sem sucesso falso).
- **Segurança:** token só em memória (módulo compartilhado); relatos só no estado da tela;
  canais de ajuda (180/190) continuam disponíveis sem sessão.

## Como rodar a demonstração

```bash
# 1) API (Node 24) — na raiz do repositório
npm ci --prefix backend
HOST=0.0.0.0 npm start --prefix backend

# 2) perfil fictício
curl -X POST http://127.0.0.1:3000/api/perfis -H 'Content-Type: application/json' \
  -d '{"usuario":"demo.ficticia","senha":"Apenas-demonstracao-123!","nome":"Fictícia","telefone_emergencia":"00000000000"}'

# 3) app — EXPO_PUBLIC_API_URL sem /api
EXPO_PUBLIC_API_URL=http://127.0.0.1:3000 npm run web
#    Área protegida > Diário de Ocorrências (a conta é a mesma do Login do app)
```

Emulador Android: `http://10.0.2.2:3000`. Celular físico: `http://IP_DO_PC:3000` com
`HOST=0.0.0.0` no backend. Reiniciar o Expo após mudar a variável.

## Testes executados (18/11/2026)

Ambiente do assistente: Linux, Node 24.22.3, backend com `npm ci`.

- `npm test` — **34/34** (24 unitários + 10 de integração com a API real: CRUD, PUT preservando
  campos, validações, 422/404/401, isolamento entre perfis, resposta antiga após logout,
  persistência após reiniciar a API).
- `npm run test:perfil` — **1/1** (teste do Perfil do PR #8, mantido na `master`).
- `npm test --prefix backend` — **9/9**.
- `npm run lint --prefix backend` e `npm run typecheck --prefix backend` — sem erros.
- `git diff --check` — sem problemas de espaço em branco.

Não houve teste em Expo, emulador ou aparelho físico nesta revisão, e o teste de tempo limite de
15 s do cliente compartilhado não é automatizável sem alterar `src/services/api.js`.

## Pendências

- Validação visual no Expo/dispositivo (layout, teclado, `Modal`, `tel:`) — depende do grupo.
- Política de sessão depois do Quick Exit segue em aberto em `backend/docs/API.md` (a sessão local
  é encerrada, mas a revogação remota pode falhar offline e o token expira em 24 h).
- A API aceita data futura; a checagem existe só no app. Sugestão de validação no backend.
- Data Science: notebook e resultados desta branch foram preservados como estavam; qualquer
  mudança nessa frente deve ser alinhada com o Abel, que coordena o tema.
