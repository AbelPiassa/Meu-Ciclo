# Meu Ciclo+

Projeto Integrador — 4º Semestre de 2026

## Tema
Violência contra a Mulher — Aplicativo de Apoio Camuflado.

## Conceito
O Meu Ciclo+ utiliza como fachada um aplicativo de acompanhamento do ciclo menstrual, contendo uma área protegida de apoio acessada por meio de um gatilho oculto.

## Tecnologias utilizadas
- React Native + Expo SDK 57 e React Navigation
- Node.js 24 + Express
- SQLite relacional, com schema versionado e migração para SOS
- Python para Data Science (SINAN/DATASUS)

## Integrantes
- Lucca [DATA SCIENCE]
- Abel [DATA SCIENCE]
- Albertini [DATA SCIENCE]
- Kaue

## Links do Projeto

- Protótipo Figma: figma.com/design/KyHQFwKu9uuQPcz31Vvlxw/Projeto-Integrador-•-Calendário-e-Apoio-•-Referência-corrigida?t=LPhQt2o1KbzVUFKd-0
- Kanban/Trello: https://trello.com/b/DkwAFMQM


## Status

Entrega 4 — código das frentes de CRUD, Data Science, SOS e painel incorporado à master. Validação funcional final, evidências de dispositivo e envio ao Blackboard ainda dependem de confirmação.

### Desenvolvimento Mobile
Aplicativo Meu Ciclo+ em desenvolvimento, utilizando React Native e Expo.

### Data Science
- Base pública selecionada: SINAN/DATASUS.
- Recorte: notificações de violência, sexo feminino, Brasil, 2015–2024.
- Análise exploratória inicial realizada em Python.
- Verificação de valores ausentes e duplicados na tabela agregada.
- Gráfico de evolução anual produzido.
- Documentação disponível em [Data Science](data-science/README.md).

### Estado atual e limitações
- A EDA e os modelos de classificação e clusterização estão versionados em `data-science/`.
- A classificação não atingiu os critérios preditivos estabelecidos; o aplicativo mostra apenas indicador histórico agregado e exploratório.
- A integração final e os testes de aparelho, SOS e painel precisam ser validados e registrados no commit de entrega.

## Backend — Entrega 4

API Express com SQLite persistente e quatro CRUDs disponível em [backend](backend/README.md).
Requer Node 24.x; consulte o [contrato REST](backend/docs/API.md) antes de integrar as telas.
Os quatro CRUDs possuem implementação de API e cliente; a validação integral no commit final permanece pendente.
[Divisão confirmada](backend/docs/RESPONSABILIDADES.md).


### Cliente compartilhado e Perfil — Entrega 4
Configuração, autenticação e sessão compartilhada: [Guia de integração](docs/INTEGRACAO_SESSAO.md). Teste automatizado de integração: `node --test tests/perfil-integracao.test.mjs` (requer dependências do backend). Confira os testes de dispositivo no relatório final.

### Diário de Ocorrências — revisão do PR #9

A etapa atual integra o Diário à mesma sessão, cliente HTTP e autenticação principal do aplicativo. `EXPO_PUBLIC_API_URL` deve ser a base sem `/api`. Gravação com resultado incerto bloqueia novas escritas até atualização bem-sucedida da lista; controles são bloqueados durante operações e dados da tela são limpos no blur, logout, Quick Exit e troca de sessão.

Validação desta revisão: `npm test` 82/82, `npm run test:diario` 62/62, `npm run test:equipe` 20/20 e backend 9/9, além de lint/typecheck do backend. Requer Node 24 e dependências do backend. Cobertura, evidências e limitações em [Diário](docs/entrega-4/diario-ocorrencias.md) e [Testes](testes/README.md). Não representa segurança de produção. O diff do PR #9 não inclui Data Science; reprodução do PR #13 e interface do indicador são entregas separadas.

### Integração do indicador acadêmico

A área protegida inclui uma tela de resultados históricos do SINAN, consumindo `GET /api/indicadores/sinan` com a sessão compartilhada. O backend lê `data-science/saidas/indicador_agregado.json` diretamente; execute o projeto com essa pasta presente. Não há inferência individual, ranking de risco nem previsão. Validação no dispositivo físico permanece pendente.

### SOS e painel acadêmico de demonstração

Disponível na área protegida e em `http://localhost:3000/painel`. Consulte [guia SOS](docs/entrega-4/sos-painel.md) para habilitar a chave separada do operador e testar com usuário `teste.*`. Nunca utilizar dados de vítimas reais. Implementação acadêmica, sem integração com serviços de emergência; validação visual e de aparelho pendente.

## Documentos de fechamento
- [DER SQLite v2](docs/der/DER_SQLITE.md) — modelo lógico extraído do SQL implementado.
- [Relatório de validação final](docs/entrega-4/VALIDACAO_FINAL_2026-11-19.md) — evidências verificadas, comandos e pendências reais.
- [SOS e painel de demonstração](docs/entrega-4/sos-painel.md).

**Para reprodução:** execute com dados fictícios e configurações locais `.env` / `.env.local`, sem colocar chaves, tokens, bancos pessoais ou credenciais no Git. O protótipo não é um serviço real de emergência.
