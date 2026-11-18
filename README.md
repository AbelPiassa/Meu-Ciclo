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

Projeto Integrador em desenvolvimento — Entrega 2 (2026).

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
Esta etapa ainda não integra o aplicativo à API. Validação do grupo e testes de dispositivo
permanecem pendentes. [Divisão confirmada](backend/docs/RESPONSABILIDADES.md).


### Cliente compartilhado e Perfil — Entrega 4
Configuração, sessão única para todos os CRUDs, dependência dos PRs e evidências: [Guia de integração](docs/INTEGRACAO_SESSAO.md). Teste isolado com API real: `node --test tests/perfil-integracao.test.mjs` (requer dependências do backend). Validação manual dos novos botões ainda pendente.
