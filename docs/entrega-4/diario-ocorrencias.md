# Entrega 4 — Diário de Ocorrências integrado à API

## O que mudou
* `src/pages/DiarioOcorrencias.js`: mesma interface; estado local trocado por chamadas à API (GET/POST/PUT/DELETE `/api/ocorrencias`).
  Novos estados: login, carregando, lista vazia, erro com "Tentar novamente"; botões travados durante o envio (sem duplicidade).
* Novos arquivos (nenhum código de outro integrante foi alterado): `src/servicos/{configApi,clienteApi,sessao,ocorrenciasApi}.js`,
  `src/hooks/useSessaoApi.js`, `src/utils/{datasApi,validacaoOcorrencia}.js`, `testes/`, `jest.config.js`.
* `package.json`: apenas 2 scripts (`test`, `test:telas`).

## Regras implementadas
* **Perfil:** `id_perfil` vem da sessão (login), nunca fixo. A API ainda rejeita (422) outro perfil e oculta (404) registros alheios.
* **Validação (app):** data e descrição obrigatórias; data real em DD/MM/AAAA; não pode ser futura nem anterior a 1900; descrição até 5000 caracteres.
  A API aceita data futura (verificado com 2099-01-01), por isso a checagem é no app. Sugestão ao Abel: validar também no backend.
* **PUT:** a API zera campos opcionais omitidos; o app envia o objeto completo, preservando tipo, "como se sentiu", nível de perigo e polícia.
* **Erros:** rede, tempo limite (10 s), 401 (volta ao login), 404, 422 (mensagens do Zod traduzidas), 429, 5xx. Falha nunca é exibida como sucesso.
* **Segurança:** token só em memória; relatos não vão a disco nem a log; ao perder a sessão a tela descarta os relatos da memória;
  canais de ajuda (180/190) funcionam mesmo sem API/login; Quick Exit não foi alterado.

## Como rodar a demonstração
```bash
# 1) API (Node 24 recomendado) — em backend/, após o merge da branch do Abel
HOST=0.0.0.0 npm start
# 2) criar perfil fictício
curl -X POST http://127.0.0.1:3000/api/perfis -H 'Content-Type: application/json' \
 -d '{"usuario":"demo.ficticia","senha":"Apenas-demonstracao-123!","nome":"Fictícia","telefone_emergencia":"00000000000"}'
# 3) app: EXPO_PUBLIC_API_URL=http://IP-DO-PC:3000/api npm start   (emulador Android: http://10.0.2.2:3000/api)
#    Área protegida > Diário de Ocorrências > entrar com o usuário acima.
```

## Testes realizados (ver testes/README.md)
* `npm test`: 17 unitários + 12 de integração com a API real do Abel (CRUD, PUT preservando campos, validações, 422/404/401, isolamento entre perfis, persistência após reiniciar a API, API fora do ar, tempo limite) — **29/29**.
* Tela renderizada (Jest + Testing Library) contra a API real: login inválido/válido, validações, CRUD, duplo toque, falha de rede, exclusão, sessão revogada — **1 teste de fluxo, passou**.
* Mutações deliberadas confirmaram que os testes detectam falhas (PUT sem preservar campos, sem checar data futura, 401 sem encerrar sessão, sem trava de toque duplo, erro exibido como sucesso).

## Não testado / limitações
* **Não rodei no Expo, emulador ou celular** (sem aparelho no ambiente): layout real, teclado, Modal nativo e `tel:` não foram vistos.
* Ambiente de teste com Node 22; o `engines` do backend pede Node 24.
* Login/Cadastro do app ainda são telas simuladas; por isso o Diário pede usuário/senha na própria tela. Quando o Perfil integrar o login, basta chamar `entrar()` de `src/servicos/sessao.js` e esse bloco deixa de aparecer.
* Política de sessão após Quick Exit (token continua em memória) está em aberto, conforme `backend/docs/API.md`.
* Sem lint/typecheck: o projeto não tem configuração de ESLint/TypeScript.
