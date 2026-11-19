# Uso de Inteligência Artificial

Este arquivo registra o uso de ferramentas de Inteligência Artificial durante o desenvolvimento do Projeto Integrador Meu Ciclo+.

## Ferramentas utilizadas

### ChatGPT

**Integrantes:** Grupo

**Onde foi utilizado:**
- Discussão inicial do tema;
- Definição do conceito do aplicativo;
- Estruturação dos CRUDs;
- Revisão do DER;
- Planejamento da navegação;
- Pesquisa e avaliação da base pública de Data Science;
- Revisão da documentação da Entrega 1.

### Claude Code (Anthropic)

**Integrante responsável:** Kaue Vinicius (parte Ciclo Menstrual / Fachada)

**Onde foi utilizado (Entrega 2):**
- Construção das telas da fachada no estilo do protótipo do Figma, com dados fictícios;
- Navegação (Stack e Tab), gatilho dos 3 toques e Quick Exit;
- Telas da Área Protegida, Login e Cadastro (versão visual);
- Documentação do projeto (regras de alteração, registro de alterações, matriz de papéis).

**Como o uso é controlado (documentos de processo mantidos na pasta local do integrante, fora do PR #11):** toda alteração feita com apoio do Claude Code é registrada em `docs/REGISTRO_DE_ALTERACOES.md` (o que foi pedido, arquivos, backup e testes) e neste arquivo, seguindo `docs/REGRAS_DE_ALTERACAO.md`: plano, autorização do integrante, backup e só então a alteração.

## Onde foram usadas (Claude Code)

| Parte do projeto | Ferramenta | Como foi usada | Revisado por |
|---|---|---|---|
| Tela Calendário (`src/pages/Calendario.js`) | Claude Code | Gerar a estrutura do calendário mensal, marcação das fases do ciclo (dados simulados) e estilo | Kaue Vinicius (revisão pendente) |
| Telas Histórico, Configurações e Sobre | Claude Code | Gerar a estrutura e o estilo conforme o Figma, com dados fictícios | Kaue Vinicius (revisão pendente) |
| Navegação (`src/routes/`) | Claude Code | Estrutura Stack + Tab e pilha separada da Área Protegida | Kaue Vinicius (revisão pendente) |
| Gatilho dos 3 toques (`useGatilhoTresToques`) e Quick Exit (`useSaidaRapida`) | Claude Code | Contador de toques com janela de tempo e reset de navegação | Kaue Vinicius (revisão pendente) |
| Telas Perfil, Rede de Apoio, Diário, Canais de Ajuda, Login e Cadastro (visual) | Claude Code | Versão visual com dados fictícios para completar a navegação da Entrega 2 | Cada responsável deve revisar a sua tela (Abel, Lucca, Matheus) |
| Componentes e tema (`src/components/`, `src/tema/`) | Claude Code | Componentes reutilizáveis e paleta de cores do protótipo | Kaue Vinicius (revisão pendente) |
| Documentação (`docs/`, `USO_IA.md`) | Claude Code | Regras de alteração, registro de alterações, matriz de papéis e este registro | Kaue Vinicius (revisão pendente) |

## Observações do grupo (Claude Code)
O Claude Code gerou a estrutura e o estilo das telas e da navegação a partir do protótipo do Figma e dos documentos do projeto (guia do professor e documento do grupo). As decisões de escopo foram do integrante. Nenhum dado real é usado: todos os dados são fictícios (guia do professor, Seção 2.3). O código gerado deve ser lido e compreendido pelo responsável antes da apresentação (guia do professor, Seção 7).

## Registro de Prompts

### Prompt 1 — Estrutura da Entrega 1

**Objetivo:** entender os requisitos exigidos pelo documento orientador.

**Resultado:** organização dos itens obrigatórios da entrega em um checklist.

**Revisão realizada pelo grupo:** as sugestões foram comparadas com o documento orientador e com o exemplo de referência fornecido pelo professor.

---

### Prompt 2 — Modelagem dos CRUDs

**Objetivo:** avaliar entidades adequadas para os quatro CRUDs exigidos.

**Resultado:** definição inicial das entidades Usuario, Ciclo_Menstrual, Contato_Apoio e Ocorrencia.

**Revisão realizada pelo grupo:** os atributos, tipos de dados e relacionamentos foram revisados antes de serem incluídos no DER.

---

### Prompt 3 — Base de Dados Pública

**Objetivo:** buscar uma base pública relacionada ao tema de violência contra a mulher.

**Resultado:** seleção inicial da base SINAN — Violência Interpessoal e Autoprovocada, disponibilizada pelo Ministério da Saúde / DATASUS.

**Revisão realizada pelo grupo:** a fonte e a relação da base com o tema foram verificadas antes da inclusão na documentação.

## Entrega 2 — Apoio ao desenvolvimento e à análise de dados

**Integrante:** Abel Piassa
**Ferramenta:** ChatGPT
**Data deste registro:** 24/10/2026

### Uso nesta etapa
- Orientação nos ajustes visuais da tela de Perfil.
- Revisão do repositório conforme os requisitos da Entrega 2.
- Identificação da pasta duplicada src/src e orientação para removê-la.
- Apoio na configuração do ambiente Python e execução do notebook.
- Sugestão de código para estatísticas descritivas, frequências
  relativas e normalização Min-Max.
- Orientação para commits, push e pull request.

### Exemplos de prompts enviados
- “agora vamos seguir o padrão do figma para desenvolver essas telas”
- “ta vamos pela parte das pastas src né, e depois do notebook”
- “eu clico no install e nada acontece”

### Revisão realizada
As sugestões foram aplicadas manualmente. O notebook foi executado
no ambiente local, e as alterações foram enviadas ao GitHub por
commits e pull request.

### Limitações
A análise utiliza dados agregados por ano e não permite estimar
o risco individual das usuárias.
## Entregas 3 e 4 — Planejamento e primeira implementação do backend

**Frente responsável:** Abel Piassa. **Ferramenta:** ChatGPT/Codex.

- IA leu master e Trello, organizou prazos/checklists e registrou a divisão confirmada:
  Matheus Albertini no Diário; Abel, Lucca e Matheus em Data Science.
- Prompt de execução: “Agora precisamos iniciar o desenvolvimento pelas tarefas
  prioritárias, sem alterar o código dos demais integrantes.”
- IA implementou a primeira versão de backend Express/SQLite, sessões por perfil,
  quatro CRUDs, contrato, validações e testes em branch separada.
- IA executou os testes HTTP locais, lint e verificação de tipos do backend.
- Abel/grupo ainda precisam revisar o código e o contrato, testar em seu ambiente e
  integrar as telas. Não atribuímos a eles testes que foram executados pelo assistente.
- Telas e notebook dos demais integrantes não foram alterados nesta implementação.
- Foram utilizados apenas dados fictícios; não foi criado indicador de risco individual.

Evidências e limitações: `backend/docs/VALIDACAO.md`.


## 18/11/2026 — Revisão assistida do PR #8
ChatGPT/Codex revisou PRs #6/#7/#8 a pedido de Abel: “revisar pontos do Lucca, implementar correções, atualizar PR #8, preservar telas dos colegas e não fazer merge”. Implementou Salvar/Excluir Perfil, confirmação com cascata explícita, sessão observável, indicação de conta conectada e encerramento no Quick Exit. Documentou adaptação de Rede de Apoio sem modificar a branch do colega. Executou testes no ambiente do assistente, separados dos testes anteriores acompanhados no computador de Abel. Resultados, limites e roteiro manual em docs/INTEGRACAO_SESSAO.md. Nenhum merge; validação visual do novo código ainda pendente.


### 18/11/2026 — Retorno nas telas de autenticação
Após Abel identificar ausência de retorno no Login, o assistente adicionou botão Voltar em Login e Cadastro, preservando React Navigation existente. Usa histórico quando disponível e Fachada como alternativa; limpa campos de senha ao voltar. O botão aguarda o término de envio para evitar autenticação tardia após retorno. Análise JSX/lint dos dois arquivos e lint/typecheck backend aprovados; teste visual no computador de Abel ainda pendente. Não houve merge.


## 18/11/2026 — Diagnóstico e documentação de processo (Claude Code)
**Integrante:** Kaue Vinicius. **Ferramenta:** Claude Code.
- **Pedido:** analisar o projeto frente ao guia do professor e criar documentação de processo (regras de alteração, checklist, registro). Esses documentos ficam na pasta local do integrante e **não fazem parte do PR #11**.
- **Revisão:** pendente (Kaue). Nenhum código do app foi alterado nesta etapa.

## 18/11/2026 — CRUD de Ciclos integrado à API (Claude Code)
**Integrante:** Kaue Vinicius (CRUD de Ciclos, Calendário e Histórico). **Ferramenta:** Claude Code.
- **Pedido:** integrar Ciclos aos endpoints reais usando o cliente e a sessão compartilhados (`src/services/`), com Calendário e Histórico sobre os mesmos dados; testar cadastro, consulta, edição, exclusão e Quick Exit com dados fictícios; preservar o trabalho existente.
- **O que a IA fez:** identificou que as versões da raiz de `Calendario.js`/`HistoricoCiclo.js` eram as mais novas e as promoveu para `src/pages/`; criou `src/services/ciclos.js` e as conversões de data; reescreveu `CiclosContext.js` para carregar da API e limpar ao sair; adicionou estados de carregamento, erro e salvamento nas duas telas; escreveu `tests/ciclos-integracao.test.mjs`. Backup antes de cada alteração em `backups/`.
- **Resultados reais dos testes (executados pelo assistente neste computador):** 2/2 testes de integração, 9/9 testes do backend, lint e typecheck do backend sem erros, bundle web compilado, fluxo funcional no navegador com conta fictícia (cadastro, edição, Calendário, Quick Exit, novo login, exclusão) e confirmação no SQLite.
- **Não testado:** mensagens de validação na tela, API offline, celular físico, lint/typecheck do app.
- **Revisão:** pendente (Kaue). O integrante deve ler e conseguir explicar `ciclos.js`, `CiclosContext.js` e as telas antes da apresentação. Nenhuma tela de Perfil, Rede de Apoio ou Diário foi alterada. Dados 100% fictícios.

## 18/11/2026 — Ajustes de revisão do PR #11 (Claude Code)
**Integrante:** Kaue Vinicius. **Ferramenta:** Claude Code. Registros dos demais integrantes preservados.
- **Pedido (revisão do PR):** limpar estado das telas em logout, Quick Exit, 401 e troca de perfil; descartar respostas de sessão antiga; trava síncrona contra clique duplo; bloquear escrita sem sessão ou durante o carregamento; revisar o preenchimento do formulário com dados assíncronos; marcar as previsões como estimativas; testes e validação no Expo.
- **O que a IA fez:** `CiclosContext.js` (chave de sessão, refs síncronas de carregamento e gravação, escrita recusada sem sessão ou durante carregamento ou outra operação, resultado aplicado só se a sessão for a mesma); `HistoricoCiclo.js` (limpeza ao mudar a sessão, comparação da sessão depois de cada `await`, trava por `useRef`, formulário que só é repreenchido quando o registro selecionado muda, seleção volta a "novo registro" se o registro some); `Calendario.js` (limpeza do mês e do dia selecionados, textos "estimativa" e aviso de que não há garantia clínica nem contraceptiva). Backup antes de editar em `backups/`.
- **Resultados reais (executados pelo assistente neste computador, dados fictícios):** `node --test tests/ciclos-integracao.test.mjs` 1/1; `node --test tests/perfil-integracao.test.mjs` 1/1; `npm test --prefix backend` 9/9; lint e typecheck do backend sem erros; `expo export --platform web` compilou. No Expo Web com duas contas fictícias: escrita sem sessão recusada com aviso; cadastro, edição, Calendário mostrando o mês salvo; três cliques síncronos em "Salvar" geraram um único registro; logout, 401 (sessões removidas do banco) e Quick Exit limparam formulário, mensagem e registros; a conta B não viu os ciclos da A e o SQLite confirmou cada registro no perfil certo.
- **Limitações:** as travas e a limpeza são lógica de React, sem teste automatizado (só validação manual na web); a exclusão foi validada na rodada anterior e não foi repetida nesta; sem celular físico nem Expo Go; mensagens de validação de data e API desligada não foram repetidas; o clique duplo foi simulado por eventos no navegador.
- **Revisão:** pendente (Kaue). O integrante deve conseguir explicar `CiclosContext.js` e `HistoricoCiclo.js` antes da apresentação.

## 18/11/2026 — Proteção contra condições de corrida na troca de sessão, PR #11 (Claude Code)
**Integrante:** Kaue Vinicius. **Ferramenta:** Claude Code. Registros dos demais integrantes preservados.
- **Pedido (segunda revisão do PR):** comparar a sessão diretamente com `obterSessao()` antes de aplicar respostas assíncronas; impedir a renderização de registros da sessão anterior; bloquear recarregamentos simultâneos; validar logout durante requisição em andamento, sem refatorar o resto.
- **O que a IA fez:** `CiclosContext.js` passou a guardar o estado com o token do dono e a entregar às telas só o estado da sessão atual (outra sessão = estado vazio, no próprio render); toda decisão de aplicar ou descartar compara com `obterSessao()`; `recarregar()` devolve a mesma promessa se já há listagem da mesma sessão; trava de escrita e de carregamento marcadas com o token. `HistoricoCiclo.js` trocou o ref de render por `obterSessao()`. Novo `tests/ciclos-corrida-sessao.test.mjs`. Backup em `backups/` antes de editar.
- **Resultados reais (executados pelo assistente neste computador, dados fictícios):** `node --test tests/ciclos-integracao.test.mjs` 1/1; `node --test tests/ciclos-corrida-sessao.test.mjs` 1/1; `node --test tests/perfil-integracao.test.mjs` 1/1; `npm test --prefix backend` 9/9; lint e typecheck do backend sem erros; `expo export --platform web` compilou. No Expo Web, com as respostas de `/api/ciclos` atrasadas em 8 s por um patch de `fetch` e uma observação a cada 150 ms da tela: (1) logout durante a listagem: nenhum registro apareceu em 160 amostras; (2) conta A com listagem lenta, logout e entrada na conta B: só o registro da B apareceu em 151 amostras, nenhum da A; (3) clique em Salvar seguido de logout antes da resposta: "Registro cadastrado" nunca apareceu e a tela ficou limpa, mas o SQLite mostrou que a gravação já enviada foi concluída no servidor (registro da conta B).
- **Limitações:** o logout não cancela uma gravação que já foi enviada (não há `AbortController`); ela pode concluir no servidor, como observado. A limpeza e os bloqueios do React seguem sem teste automatizado (validação manual na web); o teste novo cobre a regra de comparação no serviço, não o React. Sem celular físico nem Expo Go.
- **Revisão:** pendente (Kaue).

## 18/11/2026 — Integração da Rede de Apoio com a API (PR #7)

**Integrante responsável:** Lucca Felipe.
**Ferramenta:** ChatGPT.

- Integração do CRUD da Rede de Apoio com o backend Express e SQLite.
- Adaptação à autenticação e à sessão compartilhada desenvolvidas por Abel.
- Remoção da dependência de autenticação independente.
- Tratamento de erros HTTP, expiração de sessão e respostas de sessões anteriores.
- Proteção contra operações duplicadas e limpeza dos dados da interface ao mudar de sessão.
- Criação e atualização dos testes automatizados de integração.
- Correção do teste de persistência após reinicialização do servidor.
- Sincronização da branch com as entregas de Abel e Kauê.

**Resultados verificados antes da integração final:** 18/18 testes de serviços, validação e integração aprovados, além de 9/9 testes do backend.

**Limitações:** os testes utilizam dados fictícios. A validação final da interface integrada ainda precisa ser concluída. O aplicativo possui finalidade acadêmica e não está validado para uso em produção.

## 18/11/2026 — EDA por UF assistida

A pedido de Abel, ChatGPT/Codex preservou a análise nacional e os arquivos enviados, revisou proveniência, completou verificações UF/ano e executou o notebook no ambiente do assistente. Não treinou modelo, não modificou telas e não realizou merge. Evidências em data-science/VALIDACAO.md; revisão humana e reprodução pelos colegas permanecem necessárias.

## 18/11/2026 — Reprodução independente da EDA (PR #12)

**Responsável:** Lucca Felipe.

**Ferramenta:** ChatGPT.

- Revisão dos arquivos do PR #12.
- Sincronização da branch do Abel com a master.
- Resolução do conflito em USO_IA.md, preservando as contribuições dos integrantes.
- Configuração do ambiente virtual Python.
- Instalação das dependências.
- Reprodução integral do notebook pelo Jupyter.
- Regeneração e validação da base tratada.

Resultados: 270 registros, 27 UFs, 10 anos, nenhum valor nulo, nenhuma duplicidade e 2.775.742 notificações.

Os comandos foram executados localmente pelo integrante, com orientação do ChatGPT. Não houve treinamento de modelo nesta etapa.

## 18/11/2026 — Machine Learning (Lucca)

**Ferramenta:** ChatGPT.

Atividades desenvolvidas com assistência de IA:

- Definição dos problemas de classificação e clusterização.
- Engenharia de atributos.
- Implementação de regressão logística, árvore de decisão, Random Forest e K-Means.
- Validação cruzada temporal e separação do teste reservado.
- Comparação com modelos de referência.
- Avaliação de métricas supervisionadas e não supervisionadas.
- Criação de notebooks, testes automatizados e documentação.
- Exportação dos modelos e resultados agregados.

Os notebooks foram executados localmente pelo integrante, com seis testes automatizados aprovados.

O modelo supervisionado não atingiu os critérios mínimos de desempenho preditivo. A clusterização apresentou estabilidade limitada e será utilizada exclusivamente como análise histórica exploratória.

Nenhuma previsão de risco individual será disponibilizada.

A validação independente e a integração ao aplicativo serão realizadas nas próximas etapas.
