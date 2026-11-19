# Integração compartilhada — PR #8

## Dependência e revisão
PR #8 usa `feat/abel-api-persistencia` como base para separar a revisão do backend (#6). Após revisão e integração do #6, retargetar #8 para master e conferir novamente o diff. Não integrar #8 diretamente na branch do backend. Nenhum merge foi executado nesta revisão.

## Ambiente
Node 24. Backend: `cd backend`, `npm ci`, `npm start`. No computador: http://127.0.0.1:3000; Expo Web: http://localhost:8081.
Na raiz do app, `.env.local`: `EXPO_PUBLIC_API_URL=http://127.0.0.1:3000` (sem `/api`). Reiniciar Expo após alterar. `npm ci` na raiz e `npm run web` iniciam o app. Não há dependência adicional para o cliente.
Celular na mesma rede: usar http://IP_LAN_DO_COMPUTADOR:3000 e configurar HOST=0.0.0.0 no backend. localhost no celular aponta para o próprio celular. Liberar somente acesso necessário na rede de testes. Configurar CORS_ORIGINS com a origem exata do Expo Web; não usar curingas. Não houve teste físico de celular nesta revisão.

## Uma única sessão
`src/services/sessao.js` é a única fonte de token e id_perfil. Cadastro/login retornam a sessão; nunca definir credenciais ou ID fixos no app. `obterSessao()` retorna `{ token, id_perfil, expira_em }` ou null. `requisicaoAutenticada` adiciona `Authorization: Bearer ...`, trata 204 como null e limpa a sessão atual em 401. `useSessao()` permite às telas reagir à mudança, sem copiar token para outro estado.
Sessão somente em memória: navegar entre telas não encerra; F5/fechar app elimina a sessão local. Logout/Quick Exit limpam imediatamente e solicitam revogação sem esperar a rede; offline a sessão remota pode durar até a expiração de 24 horas. Exclusão bem-sucedida limpa localmente; backend remove conta, filhos e sessões. Respostas de autenticação que chegam após logout são descartadas.
Minha conta exibe conexão ativa e Sair da conta; sem sessão abre Login. Não expõe a área protegida na fachada. Perfil permanece acessível pelo gatilho camuflado. Preferências persistidas não equivalem a lembretes/tema já implementados.

## Adaptação para Lucca (na branch dele)
PR #7 possui `src/servicos/contatosApi.js`, com variável de sessão independente. Remover essa cópia e as funções configurarSessaoRedeApoio/limparSessaoRedeApoio; usar obterSessao e requisicaoAutenticada de `../services/sessao.js`. Não manter as duas fontes sincronizadas manualmente.
Atenção: o serviço atual do PR #7 usa `/contatos`. Com o cliente compartilhado, usar `/api/contatos` e `/api/contatos/:id`, mantendo EXPO_PUBLIC_API_URL sem `/api`.

```javascript
import { obterSessao, requisicaoAutenticada } from '../services/sessao.js';
export function listarContatos() {
  return requisicaoAutenticada('/api/contatos');
}
export function criarContato(dados) {
  const sessao = obterSessao();
  if (!sessao) throw new Error('Entre novamente na sua conta.');
  return requisicaoAutenticada('/api/contatos', {
    metodo: 'POST', dados: { ...dados, id_perfil: sessao.id_perfil },
  });
}
```
Preservar validação/formatação do PR #7 e adaptar seus testes. Seus 15 testes constam como relato do autor; não foram executados nesta revisão. A tela RedeApoio e a branch do Lucca não foram alteradas.

## Contrato
Fonte completa: `backend/docs/API.md`. Coleções `/api/perfis`, `/api/ciclos`, `/api/contatos`, `/api/ocorrencias`: GET lista, GET /:id, POST, PUT /:id, DELETE /:id. POST /api/perfis é público; login POST /api/sessoes; logout DELETE /api/sessoes/atual.
Perfil: cadastro exige usuario, senha (12–128 caracteres) e telefone_emergencia (10/11 dígitos); nome opcional; preferências modo_disfarce/notificacoes booleanas e tema Claro/Escuro. PUT deve enviar todos os campos editáveis, sem usuario/senha. Filhos exigem id_perfil da sessão e os campos específicos do contrato. Datas de domínio YYYY-MM-DD; expira_em em ISO 8601 UTC. Erros HTTP: `{ erro: { codigo, mensagem, campos? } }`; cliente lança Error com status/codigo/campos. Em 401, remover dados exibidos e orientar novo login. Falhas de rede não significam que uma gravação não ocorreu: consultar antes de repetir.

## Evidências — 18/11/2026
Assistente, Node 24.22.3: `node --test tests/perfil-integracao.test.mjs` passou (1 cenário com cadastro, login, consulta, PUT, validação422, DELETE204,401real, revogação e respostas antigas). Express real e SQLite em memória isolada, dados fictícios. `npm test --prefix backend`: 9/9, incluindo SQLite em arquivo/reabertura e isolamento. `npm run lint --prefix backend` e `npm run typecheck --prefix backend`: aprovados. ESLint com parser JSX verificou 7 arquivos alterados de frontend (no-undef/no-unreachable/no-dupe-keys), sem erros; não representa typecheck completo do Expo. `git diff --check`: aprovado.
Abel, computador Linux Node24.21.0, 17/11: screenshots mostram 9 testes backend aprovados, lint/typecheck sem erros, health OK; cadastro/consulta/PUT/reinício/DELETE e401 após exclusão via terminal. Também executou cliente compartilhado com cadastro/login/consulta/PUT e limpeza local; relatou cadastro/login pela interface funcionando. Não atribuir os testes do assistente ao computador dele.

Abel, 18/11: relatou login → Sobre → área escondida → Meu Perfil e novo cadastro; capturas mostram perfis distintos e botões ainda “em integração” na versão anterior. Isso não valida salvar/excluir nem, isoladamente, comprova isolamento entre contas.

## Validação manual pendente deste commit
- Minha conta → cadastro fictício → calendário → Minha conta deve mostrar conectada, sem novo login.
- Área protegida → Perfil: conferir conta correta; salvar nome/telefone/preferências e reabrir para confirmar persistência.
- Telefone inválido, servidor desligado e401: feedback claro, sem sucesso falso.
- Cancelar exclusão preserva dados; confirmar somente conta fictícia remove conta/filhos, retorna calendário e impede login antigo.
- Quick Exit durante carregamento/gravação/confirmação: calendário imediato, sessão limpa, voltar não revela Perfil.
- F5 exige login; sem F5 navegação comum mantém sessão. Testar expiração/contas distintas e Rede de Apoio após adaptação pelo Lucca.
- Validação visual e dispositivo físico ainda pendentes; não marcar integração concluída no Kanban só pelo código.

## Diário de Ocorrências (PR #9) — 18/11/2026
O PR #9 foi atualizado sobre a master com os PRs #6 e #8 integrados. Foram excluídos
`src/servicos/{sessao,clienteApi,configApi,ocorrenciasApi}.js` e `src/hooks/useSessaoApi.js`:
o Diário usa `src/services/sessao.js` e `src/services/api.js`, sem login próprio, com
`EXPO_PUBLIC_API_URL` sem `/api`. O CRUD ficou em `src/services/ocorrencias.js` e a guarda que
descarta respostas de sessão já encerrada (logout, 401, Quick Exit) em `src/utils/guardaResposta.js`.
Testes executados no ambiente do assistente, Node 24.22.3: `npm test` 34/34 (24 unitários + 10 de
integração com a API real), `npm run test:perfil` 1/1, `npm test --prefix backend` 9/9, lint e
typecheck do backend sem erros. Nada foi mesclado. Validação visual e teste em dispositivo continuam
pendentes. Detalhes em `docs/entrega-4/diario-ocorrencias.md`.
