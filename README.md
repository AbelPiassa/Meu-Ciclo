# Meu Ciclo+

Projeto Integrador — 4º Semestre de 2026

## Tema
Violência contra a Mulher — Aplicativo de Apoio Camuflado.

## Conceito
O Meu Ciclo+ utiliza como fachada um aplicativo de acompanhamento do ciclo menstrual, contendo uma área protegida de apoio acessada por meio de um gatilho oculto.

## Tecnologias previstas
- React Native
- Expo SDK 57
- React Navigation
- Node.js
- Express
- Banco de dados relacional
- Python para Data Science

## Integrantes
- Lucca [DATA SCIENCE]
- Abel [DATA SCIENCE]
- Albertini [DATA SCIENCE]
- Kaue

## Links do Projeto

- Protótipo Figma: figma.com/design/KyHQFwKu9uuQPcz31Vvlxw/Projeto-Integrador-•-Calendário-e-Apoio-•-Referência-corrigida?t=LPhQt2o1KbzVUFKd-0
- Kanban/Trello: https://trello.com/b/DkwAFMQM


## Status

Projeto Integrador em desenvolvimento — Entrega 4 (2026); revisão final das integrações pendente.

### Desenvolvimento Mobile
Aplicativo Meu Ciclo+ em desenvolvimento, utilizando React Native e Expo.

### Data Science
- Base pública selecionada: SINAN/DATASUS.
- Recorte: notificações de violência, sexo feminino, Brasil, 2015–2024.
- Análise exploratória inicial realizada em Python.
- Verificação de valores ausentes e duplicados na tabela agregada.
- Gráfico de evolução anual produzido.
- Documentação disponível em [Data Science](data-science/README.md).

### Próximas etapas
- Ampliar a análise exploratória.
- Desenvolver e avaliar o primeiro modelo de Data Science.
- Continuar a integração entre aplicativo e API.

## Backend — primeira implementação da Entrega 4

API Express com SQLite persistente e quatro CRUDs disponível em [backend](backend/README.md).
Requer Node 24.x; consulte o [contrato REST](backend/docs/API.md) antes de integrar as telas.
Essa primeira etapa do backend ainda não integrava o aplicativo à API. As integrações atuais
utilizam o cliente compartilhado; validação do grupo e testes de dispositivo permanecem pendentes.
[Divisão confirmada](backend/docs/RESPONSABILIDADES.md).


### Cliente compartilhado e Perfil — Entrega 4
Configuração, sessão única para todos os CRUDs, dependência dos PRs e evidências: [Guia de integração](docs/INTEGRACAO_SESSAO.md). Teste isolado com API real: `node --test tests/perfil-integracao.test.mjs` (requer dependências do backend). Validação manual dos novos botões ainda pendente.

### Diário de Ocorrências — revisão do PR #9

A etapa atual integra o Diário à mesma sessão, cliente HTTP e autenticação principal do aplicativo. `EXPO_PUBLIC_API_URL` deve ser a base sem `/api`. Gravação com resultado incerto bloqueia novas escritas até atualização bem-sucedida da lista; controles são bloqueados durante operações e dados da tela são limpos no blur, logout, Quick Exit e troca de sessão.

Validação desta revisão: `npm test` 82/82, `npm run test:diario` 62/62, `npm run test:equipe` 20/20 e backend 9/9, além de lint/typecheck do backend. Requer Node 24 e dependências do backend. Cobertura, evidências e limitações em [Diário](docs/entrega-4/diario-ocorrencias.md) e [Testes](testes/README.md). Não representa segurança de produção. O diff do PR #9 não inclui Data Science; reprodução do PR #13 e interface do indicador são entregas separadas.

### Integração do indicador acadêmico

A área protegida inclui uma tela de resultados históricos do SINAN, consumindo `GET /api/indicadores/sinan` com a sessão compartilhada. O backend lê `data-science/saidas/indicador_agregado.json` diretamente; execute o projeto com essa pasta presente. Não há inferência individual, ranking de risco nem previsão. Validação final de integração pendente.
