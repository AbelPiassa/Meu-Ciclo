# Testes — Diário de Ocorrências (integração com a API)

Todos os dados são fictícios. Cada execução sobe a API real em porta livre com um banco SQLite
**temporário**, que é apagado no final.

## 1. Serviços e validações (sem dependências extras)

```bash
# Node 22.7+ (a API do Abel exige Node 24)
npm test
```

* `datas-validacao.test.js` e `clienteApi.test.js` rodam sempre (unitários, `fetch` simulado).
* `diario-integracao.test.js` usa a API real. Ele procura o backend em `backend/` (depois do merge
  da API do Abel) ou na pasta indicada por `MEU_CICLO_BACKEND_DIR`. Sem backend, é marcado como *skipped*.

```bash
# backend do Abel já com "npm ci" feito:
MEU_CICLO_BACKEND_DIR=/caminho/para/backend npm test
```

## 2. Tela `DiarioOcorrencias` (opcional)

Renderiza a tela de verdade e percorre login → CRUD → validações → erro de rede → sessão expirada.
Precisa de dependências de desenvolvimento que **não** foram adicionadas ao `package.json` (para não gerar
conflito de `package-lock.json` com as outras branches):

```bash
npx expo install jest-expo jest @testing-library/react-native test-renderer expo-asset -- --save-dev
npm install -D @react-native/jest-preset@0.86.3   # versão igual à do react-native do projeto
MEU_CICLO_BACKEND_DIR=/caminho/para/backend npm run test:telas
```

Observações: o `fetch` do `jest-expo` é simulado, então o teste usa um `fetch` real baseado em `node:http`;
o `expo-asset` precisa estar instalado na raiz para `@expo/vector-icons` carregar no Jest.
