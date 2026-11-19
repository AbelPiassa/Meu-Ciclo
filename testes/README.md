# Testes do Diário e da integração do aplicativo

Requer Node 24 e `npm ci --prefix backend`. Na raiz, `npm test` executa os testes do Diário e os da equipe; `npm run test:diario` e `npm run test:equipe` selecionam cada conjunto. Não existem scripts `test:perfil` ou `test:completo` no package.json atual.

## Resultados executados em 18/11/2026

Ambiente do assistente: Linux, Node 24.22.3. Dados e contas exclusivamente fictícios.

- `npm test`: 82/82, sem testes pulados.
- `npm run test:diario`: 62/62.
- `npm run test:equipe`: 20/20.
- `npm test --prefix backend`: 9/9.
- `npm run lint --prefix backend` e `npm run typecheck --prefix backend`: aprovados.

## Cobertura do Diário: 62 casos

`testes/servicos/controle-diario.test.js` contém 13 testes do controlador efetivamente usado pela tela. Cobrem gravação que produz efeito e perde resposta, resultado incerto após rede/timeout/5xx, bloqueio de repetição, GET falho conservando o bloqueio, GET bem-sucedido liberando-o, cliques duplicados, GET deduplicado, exclusão mútua de leitura/escrita, sessão alterada e permanência da operação sem assinantes (blur).

`guarda-resposta.test.js` contém 9 testes. Três regressões verificam logout, outra conta e novo login na mesma conta sem alterar a geração nem desmontar a tela. Assim a checagem de identidade não pode ser removida sem falhar os testes.

`ocorrencias.test.js` contém 21 testes de serviço com HTTP simulado: contrato do cliente compartilhado, dados completos do PUT, conversões, validação e erros. As oito regressões novas cobrem GET/POST/PUT/DELETE concluídos depois do logout e 401 antigo preservando a sessão nova da mesma conta.

`datas-validacao.test.js` contém 8 testes de utilitários. `diario-integracao.test.js` contém 11 testes com Express e SQLite temporário reais: CRUD, login, PUT, validação, isolamento, revogação e persistência após reinício.

## Cobertura da equipe: 20 casos

Os arquivos em `tests/` foram preservados da master. Quatro casos de topo usam backend/SQLite real (Perfil, Ciclos, corrida de sessão em Ciclos e contatos). Os demais são 12 casos de contatos com HTTP simulado e 4 casos puros de telefone. Não são 20 testes de integração com banco.

A suíte do Diário localiza o backend em `backend/` ou por `MEU_CICLO_BACKEND_DIR` e configura a URL antes de importar o cliente. Sem dependências do backend, sua integração pode ser pulada; os testes da equipe que importam o backend diretamente falham. Não considerar essa execução equivalente aos resultados completos acima.

## Limitações e distinção de evidências

As suites npm não renderizam componentes React nem executam o navegador. O controlador puro e os serviços são testados automaticamente; a validação de renderização/foco e a validação instrumentada no Expo Web são evidências separadas, descritas em `docs/entrega-4/diario-ocorrencias.md`.

Não houve Android/iOS ou aparelho físico. O cliente HTTP compartilhado não foi alterado: sua janela de timeout não abrange integralmente leitura de corpo lenta; o alinhamento dessa limitação pertence ao Abel. Uma escrita já enviada pode concluir no servidor mesmo depois do logout, e não há retry automático de POST/PUT/DELETE.
