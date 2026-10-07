# Uso de Inteligência Artificial

Este arquivo registra o uso de ferramentas de Inteligência Artificial durante o desenvolvimento do Projeto Integrador **Meu Ciclo+**.

O grupo utiliza IA como ferramenta de apoio para organização, revisão, desenvolvimento e documentação. As respostas geradas são analisadas pelos integrantes antes de serem incorporadas ao projeto.

## Ferramentas utilizadas

### ChatGPT

**Integrantes:** Grupo

**Principais usos:**

- interpretação dos requisitos do Projeto Integrador;
- organização da Entrega 1;
- definição do conceito do aplicativo;
- estruturação dos CRUDs;
- revisão do DER;
- planejamento da navegação;
- apoio na organização do GitHub;
- orientação sobre branches, commits e integração de código;
- apoio no desenvolvimento da tela Área Protegida;
- apoio na configuração do React Navigation;
- identificação e correção de erros durante a execução do aplicativo;
- pesquisa e avaliação da base pública utilizada em Data Science;
- revisão e atualização da documentação do projeto.

---

## Registro de uso

### 1. Estrutura da Entrega 1

**Prompt utilizado:**

> "Vamos lá, trate isso como um checklist: o que temos dentro de tudo que te enviei?"

**Objetivo:**

Entender e organizar os requisitos exigidos pelo documento orientador do Projeto Integrador.

**Resultado:**

Foi criado um checklist com os itens obrigatórios da Entrega 1, incluindo grupo e matriz de papéis, disfarce, protótipo, DER, navegação, Kanban, base de Data Science e documentação do uso de IA.

**Revisão realizada pelo grupo:**

As sugestões foram comparadas com o documento orientador e com o exemplo de referência fornecido pelo professor.

---

### 2. Modelagem dos CRUDs

**Objetivo:**

Definir entidades adequadas para atender ao requisito de quatro CRUDs completos.

**Resultado:**

Foram estruturadas as entidades:

- Perfil Local;
- Ciclo Menstrual;
- Contato de Apoio;
- Ocorrência.

Também foram discutidos atributos, chaves primárias, chaves estrangeiras e relacionamentos.

**Revisão realizada pelo grupo:**

Os integrantes revisaram os campos propostos antes de incluí-los no DER e na documentação.

---

### 3. Base pública para Data Science

**Objetivo:**

Encontrar uma base pública legítima relacionada ao tema de violência contra a mulher.

**Resultado:**

Foi selecionada inicialmente a base:

**SINAN — Violência Interpessoal e Autoprovocada**, disponibilizada pelo Ministério da Saúde / DATASUS.

**Revisão realizada pelo grupo:**

A fonte, a relação com o tema e a possibilidade de utilização acadêmica foram verificadas antes da inclusão no projeto.

---

### 4. Organização inicial do GitHub

**Prompt utilizado:**

> "Me ajuda a dar commit para subir as pastas."

**Objetivo:**

Organizar a estrutura inicial do repositório e registrar as alterações de forma incremental.

**Resultado:**

Foram organizadas pastas e arquivos relacionados a:

- documentação;
- Data Science;
- páginas;
- componentes;
- rotas;
- README;
- arquivo `USO_IA.md`.

**Revisão realizada pelo grupo:**

Antes de cada commit foram utilizados comandos como:

```bash
git status
git diff
```

Após os commits, o repositório remoto foi conferido para validar os arquivos enviados.

---

### 5. Desenvolvimento da Área Protegida

**Prompt utilizado:**

> "Preciso começar desenvolver minhas telas, pensei em fazer apenas a tela de área protegida. Consegue me ajudar a codar isso aos poucos e ir commitando conforme as coisas?"

**Objetivo:**

Iniciar a implementação da tela Área Protegida utilizando os conceitos estudados na disciplina.

**Resultado:**

Foi criado o arquivo:

```text
src/pages/AreaProtegida.js
```

A tela recebeu uma estrutura visual inicial contendo:

- título;
- texto de apoio;
- espaço de destaque;
- card de Rede de Apoio;
- card de Diário de Ocorrências;
- card de Perfil e Configurações;
- card de Ajuda;
- botão de saída rápida;
- botão de encerramento da sessão protegida.

Foram utilizados componentes do React Native como:

- `View`;
- `Text`;
- `Pressable`;
- `StyleSheet`.

**Revisão realizada pelo grupo:**

A tela foi executada no Expo e comparada com o protótipo elaborado no Figma.

---

### 6. Navegação com React Navigation

**Objetivo:**

Verificar se a solução de navegação utilizada no projeto estava de acordo com o conteúdo apresentado nas aulas de Desenvolvimento de Aplicativos Móveis.

**Resultado:**

Foi adotado o padrão com:

- `NavigationContainer`;
- `createNativeStackNavigator`;
- `Stack.Navigator`;
- `Stack.Screen`;
- arquivo `RootNavigator.js`.

A estrutura utilizada segue o padrão estudado nas atividades da disciplina.

**Revisão realizada pelo grupo:**

O código das aulas foi comparado com a solução proposta antes de ser incorporado ao projeto.

---

### 7. Desenvolvimento simultâneo utilizando branches

**Objetivo:**

Permitir que mais de um integrante trabalhasse no projeto ao mesmo tempo sem sobrescrever alterações.

**Resultado:**

Foram utilizadas branches independentes, incluindo:

```text
feature/area-protegida
feature/perfil-configuracoes
```

A branch `feature/area-protegida` passou a concentrar o desenvolvimento da tela de responsabilidade de Lucca.

**Revisão realizada pelo grupo:**

Antes das alterações, o estado do repositório e as branches existentes foram conferidos para evitar conflitos.

---

### 8. Correção de erro de navegação

**Erro apresentado:**

```text
Got an invalid value for 'component' prop for the screen 'Home'.
It must be a valid React Component.
```

**Objetivo:**

Identificar a causa do erro apresentado pelo React Navigation.

**Resultado:**

Foi identificado que o arquivo `Home.js` estava vazio e, portanto, não exportava um componente React válido.

Durante o desenvolvimento individual da Área Protegida, a rota Home foi retirada temporariamente da navegação de teste.

**Revisão realizada pelo grupo:**

A alteração foi tratada apenas como solução temporária de desenvolvimento. A Home continua prevista como tela inicial definitiva da aplicação.

---

### 9. Organização dos commits

**Objetivo:**

Manter um histórico de desenvolvimento claro e dividido por funcionalidade.

**Resultado:**

Foram utilizados commits pequenos e específicos, por exemplo:

```text
feat: inicia area protegida e configura stack navigation
feat: integra RootNavigator ao aplicativo
feat: cria estrutura visual da area protegida
```

**Revisão realizada pelo grupo:**

Antes de cada commit, os arquivos alterados foram conferidos para evitar o envio de alterações temporárias ou não relacionadas.

---

### 10. Atualização da documentação do projeto

**Objetivo:**

Manter o repositório compreensível para todos os integrantes.

**Resultado:**

O `README.md` passou a documentar:

- objetivo do projeto;
- tecnologias utilizadas;
- estrutura do repositório;
- como clonar;
- como instalar dependências;
- como iniciar o projeto;
- como atualizar o projeto;
- uso de branches;
- padrão de commits;
- estrutura de navegação;
- Data Science;
- uso de IA.

**Revisão realizada pelo grupo:**

A documentação foi atualizada de acordo com o estado atual do desenvolvimento.

---

### 11. Instalação de bibliotecas

**Objetivo:**

Adicionar recursos necessários para navegação e interface.

**Resultado:**

Foram instaladas dependências para o projeto utilizando o Expo, incluindo:

```bash
npx expo install @react-navigation/native-stack
```

e:

```bash
npx expo install @expo/vector-icons
```

**Revisão realizada pelo grupo:**

As bibliotecas foram instaladas de acordo com o ecossistema do Expo e com os recursos previstos para utilização no aplicativo.

---

## Critérios definidos para uso de IA

O grupo adotou os seguintes critérios:

- não utilizar respostas de IA sem revisão;
- comparar sugestões técnicas com o conteúdo estudado nas disciplinas;
- não inserir funcionalidades que os integrantes não consigam explicar;
- registrar usos relevantes de IA neste arquivo;
- manter as decisões finais sob responsabilidade do grupo;
- utilizar apenas dados fictícios durante testes do aplicativo;
- não utilizar dados reais de vítimas;
- preservar o caráter acadêmico do projeto;
- utilizar IA como ferramenta de apoio, e não como substituição do entendimento técnico dos integrantes.

## Observação

Este arquivo será atualizado durante o desenvolvimento sempre que houver uso relevante de Inteligência Artificial em etapas de planejamento, programação, documentação, Data Science, correção de erros ou tomada de decisões técnicas.
