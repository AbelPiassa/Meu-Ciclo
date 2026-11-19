# Testes — Diário de Ocorrências (sessão compartilhada + API real)

Todos os dados são fictícios. Nenhum teste usa conta, telefone ou relato real.

O Diário usa a **sessão única** do aplicativo (`src/services/sessao.js`) e o **cliente HTTP
compartilhado** (`src/services/api.js`). Não existe mais sessão, cliente ou login próprios do Diário:
os testes abaixo exercitam exatamente os módulos que o aplicativo usa.

## Pré-requisitos

- Node 24 (`backend/.nvmrc`). O app roda em Node 22+, mas o backend exige 24.
- `npm ci --prefix backend` — sem essas dependências, o teste de integração é marcado como *skipped*
  (o restante continua rodando).

## `npm test` — unitários + integração do Diário

```bash
npm ci --prefix backend   # uma vez
npm test
```

| Arquivo | Tipo | O que cobre |
| --- | --- | --- |
| `servicos/ocorrencias.test.js` | unitário (`fetch` simulado) | contrato do cliente compartilhado (URL base sem `/api`, `Bearer`, 204 → `null`), corpo completo do POST/PUT, conversão DD/MM/AAAA ↔ AAAA-MM-DD, validação no cliente sem enviar nada, 422 com campos traduzidos, 404/5xx, falha de rede, 401 encerrando a sessão e resposta antiga após logout |
| `servicos/guarda-resposta.test.js` | unitário | guarda que descarta respostas antigas depois de desmontar a tela (Quick Exit), de logout ou de troca de conta |
| `servicos/datas-validacao.test.js` | unitário | conversão de datas, `hojeIso` sem desvio de UTC, campos obrigatórios, datas inexistentes, 29/02, data futura, ano mínimo e limite de 5000 caracteres |
| `servicos/diario-integracao.test.js` | integração real | sobe a API Express em porta livre com SQLite temporário e percorre login, CRUD, PUT preservando campos, 422 do servidor, isolamento entre perfis, 401 real, resposta antiga após logout e persistência após reiniciar a API |

O teste de integração procura o backend em `backend/` ou na pasta indicada por `MEU_CICLO_BACKEND_DIR`:

```bash
MEU_CICLO_BACKEND_DIR=/caminho/para/backend npm test
```

Ele define `EXPO_PUBLIC_API_URL` para a porta sorteada **antes** de importar `src/services/api.js`
(o cliente lê a variável na inicialização do módulo).

## `npm run test:perfil` — integração do Perfil (PR #8)

```bash
npm run test:perfil
```

Roda `tests/perfil-integracao.test.mjs` (cadastro, login, consulta, PUT, 422, DELETE, 401 real,
revogação e respostas antigas) usando `backend/src` diretamente, em SQLite `:memory:`.

## `npm run test:completo`

Roda os dois conjuntos acima em sequência.

## O que não é testado automaticamente

- Renderização das telas (não há Jest/Testing Library instalados no projeto): layout, teclado,
  `Modal` nativo e `tel:` continuam dependendo de teste manual no Expo.
- Tempo limite de 15 s do cliente compartilhado: o valor é interno de `src/services/api.js` e não
  é injetável pelos testes; a falha de rede é coberta, o estouro de tempo não.
