# Integração do indicador agregado com a API (proposta para Abel e Lucca)

**Status:** proposta. Nada foi alterado na branch do Abel; o patch abaixo foi testado numa cópia do backend.

## O que é integrado
Só o arquivo `data-science/saidas/indicador_notificacoes_agregado.json`: um indicador **nacional, anual e igual para todos**.
Não depende de perfil, não recebe dados da usuária e não pode virar classificação individual (o gerador recusa chaves como `risco`, `score`, `perfil`).

## Endpoint proposto
`GET /api/indicadores/notificacoes` — somente leitura, exige sessão Bearer (como as demais rotas `/api`), devolve o JSON do arquivo.
O caminho do arquivo vem da variável `INDICADOR_PATH` (sem ela, responde 404).
Patch: `proposta-endpoint-indicadores.patch` (`git apply` na raiz do repositório; mexe em `backend/src/app.js` e `server.js`).
Testado na cópia: 401 sem token, 200 com token; `npm test` (9/9) e `npm run lint` do backend seguem passando. Faltaria um teste no `api.test.js` do Abel.

## Regras de uso no app (decidir em grupo)
1. `escopo.exibir_apenas_em = "area_protegida"`: **nunca na fachada** do ciclo menstrual (quebraria o disfarce).
2. `projecao_exploratoria.recomendacao_de_uso = "nao_exibir_valor_numerico_ao_publico"` enquanto o desempenho for insuficiente.
3. `fonte.conferencia_com_portal = "pendente"`: não exibir valores absolutos até conferir o CSV com o TabNet.
4. Uso seguro hoje: texto de contexto qualitativo (ex.: "as notificações registradas cresceram ao longo da última década"), sem número individual e sem relação com a usuária.
5. Exibição na tela (Abel/Lucca): **não implementada nesta entrega**.
