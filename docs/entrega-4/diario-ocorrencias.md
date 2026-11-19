# Entrega 4 — Diário de Ocorrências integrado à API

Revisão final do PR #9 sobre a `master` com os PRs #6 (backend), #8 (cliente compartilhado e
Perfil), #11 (Ciclos) e #7 (Rede de Apoio). O Diário usa a infraestrutura compartilhada do
aplicativo: uma única sessão, um único cliente HTTP e o login principal.

## O que mudou nesta revisão

- **Branch atualizada com a `master`** (`feat/diario-api`), com os conflitos resolvidos em
  `USO_IA.md` (todas as contribuições preservadas, inclusive a entrada do Diário/Data Science) e
  `docs/INTEGRACAO_SESSAO.md` (versão da master).
- **Identidade da sessão, não `id_perfil`.** O serviço captura o objeto de `obterSessao()` antes da
  requisição e recusa a resposta se a sessão tiver mudado (`"Sessão alterada"`, 401). Entrar de novo
  na mesma conta cria outro token e invalida a resposta anterior.
- **Nada da sessão anterior é renderizado.** Cada sessão monta um Diário novo
  (`key={obterVersaoSessao()}`): lista, formulário, mensagens e modal de confirmação nascem vazios,
  inclusive ao entrar novamente na mesma conta.
- **Travas presas à sessão responsável.** `gravacao.current` guarda a sessão dona da escrita e só
  ela libera a trava; `carga.current` guarda a sessão da listagem em andamento.
- **Uma listagem por vez.** Um segundo pedido reaproveita a requisição em andamento (sem
  recarregamentos simultâneos).
- **Escrita bloqueada enquanto a lista carrega** e quando a última listagem falhou.
- **Falha de rede na gravação** mostra: "Não foi possível confirmar a gravação. Consulte a lista
  (Atualizar) antes de tentar de novo." e exibe o botão **Atualizar lista**.
- **`EXPO_PUBLIC_API_URL` sem `/api`** (ex.: `http://127.0.0.1:3000`).

## Arquivos do Diário

| Arquivo | Papel |
| --- | --- |
| `src/pages/DiarioOcorrencias.js` | tela: painel sem conta, lista, formulário, exclusão com confirmação, canais de ajuda |
| `src/services/ocorrencias.js` | CRUD `/api/ocorrencias`, conversão de datas, corpo completo do PUT, checagem de sessão |
| `src/utils/datasApi.js` | DD/MM/AAAA ↔ AAAA-MM-DD e `hojeIso` (data local) |
| `src/utils/validacaoOcorrencia.js` | validação do formulário (obrigatórios, data real, não futura, ≥1900, ≤5000) |
| `src/utils/mensagensApi.js` | tradução das mensagens de campo da API |
| `src/utils/guardaResposta.js` | guarda por identidade da sessão + geração da tela |
| `testes/apoio/{ambiente,servidorApi}.js` | apoio: URL de teste e API real em porta livre com banco temporário |
| `testes/servicos/{ocorrencias,guarda-resposta,datas-validacao,diario-integracao}.test.js` | testes |

Nenhum arquivo dos outros integrantes foi alterado: Login, Cadastro, Perfil, Configurações,
Ciclos, Calendário, Histórico, Rede de Apoio, `src/servicos/contatosApi.js` (Lucca) e `backend/`
seguem como na `master`.

## Regras implementadas

- **Perfil:** `id_perfil` vem sempre da sessão. A API rejeita (422) outro perfil e oculta (404)
  registros alheios.
- **Validação no app:** data e descrição obrigatórias; data real em DD/MM/AAAA; não futura nem
  anterior a 1900; descrição até 5000 caracteres. Nada é enviado quando o formulário é inválido.
- **PUT:** a API zera campos opcionais omitidos, então o app envia o objeto completo, preservando
  tipo, "como se sentiu", nível de perigo e acionou_policia.
- **Erros:** 401 (encerra a sessão), 404 (recarrega a lista), 422 (mensagens de campo traduzidas),
  5xx e falha de rede (mensagem sem sucesso falso; na gravação, orienta conferir a lista).
- **Segurança:** token só em memória; relatos só no estado da tela; canais de ajuda (180/190)
  disponíveis sem sessão.

## Como rodar a demonstração

```bash
# 1) API (Node 24) — na raiz do repositório
npm ci --prefix backend
HOST=0.0.0.0 CORS_ORIGINS=http://127.0.0.1:8081 npm start --prefix backend

# 2) perfil fictício
curl -X POST http://127.0.0.1:3000/api/perfis -H 'Content-Type: application/json' \
  -d '{"usuario":"demo.ficticia","senha":"Apenas-demonstracao-123!","nome":"Fictícia","telefone_emergencia":"00000000000"}'

# 3) app — EXPO_PUBLIC_API_URL sem /api
EXPO_PUBLIC_API_URL=http://127.0.0.1:3000 npm run web
#    Área protegida > Diário de Ocorrências (mesma conta do Login do app)
```

Emulador Android: `http://10.0.2.2:3000`. Celular físico: `http://IP_DO_PC:3000` com
`HOST=0.0.0.0`. Reiniciar o Expo após mudar a variável. No Expo Web o backend precisa de
`CORS_ORIGINS` com a origem do Expo (ex.: `http://127.0.0.1:8081`), senão o navegador bloqueia as
chamadas.

## Testes executados (18/11/2026)

Ambiente do assistente: Linux, Node 24.22.3, backend com `npm ci`.

| Comando | Resultado |
| --- | --- |
| `npm test` | **58/58** (38 do Diário + 20 da equipe) |
| `npm run test:diario` | **38/38** (27 unitários + 11 de integração com a API real) |
| `npm run test:equipe` | **20/20** (Ciclos, Rede de Apoio, Perfil, telefone) |
| `npm test --prefix backend` | **9/9** |
| `npm run lint --prefix backend` / `npm run typecheck --prefix backend` | sem erros |

## Validação no Expo Web (manual, dados fictícios)

Duas contas fictícias (`diario.alfa`, `diario.beta`), API real em `127.0.0.1:3000` e SQLite
temporário:

- **CRUD:** cadastro, edição (lista e formulário atualizados com "Ocorrência atualizada."),
  exclusão com modal ("Ocorrência excluída.") e cancelamento do modal preservando o relato.
- **Sem sessão:** o Diário mostra o painel "Entre na sua conta para ver seu diário" (sem lista,
  formulário ou modal) e os canais de ajuda continuam visíveis; o botão leva ao Login principal.
- **Novo login na mesma conta:** a tela volta vazia, carrega só os relatos do servidor e o
  formulário não guarda nada da sessão anterior.
- **Quick Exit durante requisição:** com o `POST` retido por um interceptador no navegador, o
  botão ficou em "Aguarde...", o Quick Exit encerrou a sessão e a resposta liberada depois não
  repôs nada nem reabriu a sessão.
- **Isolamento:** a conta B viu a lista vazia enquanto a conta A tinha um relato; o SQLite
  confirmou `id_perfil` correto em cada registro.
- **Falha de rede na gravação:** com `fetch` rejeitando `POST/PUT/DELETE`, apareceu a mensagem
  "Não foi possível confirmar a gravação. Consulte a lista (Atualizar) antes de tentar de novo." e
  o botão **Atualizar lista**.

## Limitações

- Não houve teste em emulador Android, iOS ou aparelho físico (só Expo Web).
- As travas de carregamento/gravação e o descarte de resposta antiga na tela são lógica de React,
  verificadas nesta validação manual e não por teste automatizado (o projeto não tem renderizador
  de teste).
- O tempo limite de 15 s do cliente compartilhado não foi exercitado (é interno de
  `src/services/api.js`).
- A API aceita data futura; a checagem existe só no app. Sugestão de validação no backend.
- Data Science: notebook e resultados preservados; nenhuma projeção nova foi publicada. O novo
  modelo será alinhado com Lucca e Abel.
