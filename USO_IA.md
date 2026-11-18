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
