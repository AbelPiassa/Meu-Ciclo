# Meu Ciclo+

Projeto Integrador — 4º semestre do curso — 2º semestre letivo de 2026.

## Tema

Violência contra a Mulher — Aplicativo de Apoio Camuflado.

## Conceito

O Meu Ciclo+ utiliza como fachada um aplicativo de acompanhamento do ciclo menstrual.

Dentro da aplicação existe uma área protegida de apoio, acessada por meio de um mecanismo discreto. Essa área reúne funcionalidades como:

- Rede de Apoio;
- Diário de Ocorrências;
- Perfil e Configurações;
- Informações de Ajuda;
- Saída rápida.

O projeto possui finalidade exclusivamente acadêmica e não substitui serviços policiais, jurídicos, psicológicos ou de saúde.

## Tecnologias

O projeto utiliza ou prevê a utilização das seguintes tecnologias:

- React Native;
- Expo SDK 57;
- React Navigation;
- Native Stack Navigator;
- Expo Vector Icons;
- Node.js;
- Express;
- Banco de dados relacional;
- Python para Data Science.

## Integrantes

- Lucca Felipe Burgos Rabelo — Desenvolvimento Mobile e Data Science;
- Abel João Piassa Antunes — Desenvolvimento Mobile e Data Science;
- Matheus Albertini — Desenvolvimento Mobile e Data Science;
- Kaue Vinicius — Desenvolvimento Mobile.

## Estrutura atual do projeto

```text
Meu-Ciclo/
├── App.js
├── index.js
├── app.json
├── package.json
├── package-lock.json
├── README.md
├── USO_IA.md
├── android/
├── ios/
├── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│   │   ├── Home.js
│   │   ├── Perfil.js
│   │   └── AreaProtegida.js
│   └── routes/
│       └── RootNavigator.js
├── docs/
└── data-science/
```

## Como baixar o projeto

Para clonar o repositório:

```bash
git clone https://github.com/AbelPiassa/Meu-Ciclo.git
```

Depois entre na pasta do projeto:

```bash
cd Meu-Ciclo
```

## Como instalar as dependências

Depois de clonar o projeto, execute:

```bash
npm install
```

Esse comando instala todas as dependências registradas no `package.json`.

Sempre que houver atualização nas dependências do projeto, é recomendado executar novamente:

```bash
npm install
```

## Como iniciar o projeto

Para iniciar o Expo:

```bash
npx expo start
```

Também é possível utilizar:

```bash
npm start
```

Após iniciar o Expo:

- pressione `w` para abrir no navegador;
- pressione `a` para abrir no Android, quando houver dispositivo ou emulador configurado.

Também é possível executar diretamente:

```bash
npm run web
```

ou:

```bash
npm run android
```

## Como atualizar o projeto

Antes de começar uma nova alteração, verifique o estado atual do repositório:

```bash
git status
```

Para receber as alterações mais recentes da branch atual:

```bash
git pull
```

Caso esteja trabalhando na branch principal:

```bash
git pull origin master
```

Depois de atualizar o projeto, caso tenham ocorrido mudanças no `package.json` ou `package-lock.json`, execute novamente:

```bash
npm install
```

## Desenvolvimento com branches

Como mais de um integrante pode trabalhar no projeto simultaneamente, as funcionalidades devem ser desenvolvidas em branches separadas sempre que possível.

Para criar uma nova branch:

```bash
git switch -c feature/nome-da-feature
```

Exemplo:

```bash
git switch -c feature/area-protegida
```

Para verificar em qual branch está trabalhando:

```bash
git branch
```

ou:

```bash
git status
```

## Como salvar alterações no Git

Primeiro verifique os arquivos alterados:

```bash
git status
```

Para adicionar um arquivo específico:

```bash
git add nome-do-arquivo
```

Exemplo:

```bash
git add src/pages/AreaProtegida.js
```

Depois crie o commit:

```bash
git commit -m "feat: descricao da alteracao"
```

Envie as alterações para o GitHub:

```bash
git push
```

No primeiro envio de uma nova branch pode ser necessário utilizar:

```bash
git push -u origin nome-da-branch
```

Exemplo:

```bash
git push -u origin feature/area-protegida
```

## Padrão de commits utilizado

Alguns prefixos utilizados no projeto:

```text
feat: nova funcionalidade
fix: correção de erro
style: alteração visual
docs: alteração de documentação
chore: configuração ou dependência
```

Exemplos:

```bash
git commit -m "feat: cria estrutura visual da area protegida"
```

```bash
git commit -m "docs: atualiza instrucoes do projeto"
```

```bash
git commit -m "chore: adiciona biblioteca de icones"
```

## Navegação

O projeto utiliza React Navigation.

A estrutura de navegação segue o padrão:

```text
NavigationContainer
        ↓
RootNavigator
        ↓
Native Stack Navigator
```

O arquivo `RootNavigator.js` é responsável por cadastrar as telas disponíveis na navegação.

Entre as telas atualmente previstas estão:

- Home;
- Área Protegida;
- Perfil.

A tela inicial definitiva do aplicativo será a fachada do Meu Ciclo+.

Durante o desenvolvimento individual, algumas telas podem ser utilizadas temporariamente como rota inicial para facilitar testes.

## Área Protegida

A Área Protegida é uma das principais funcionalidades do projeto.

Ela possui acesso a:

- Rede de Apoio;
- Diário de Ocorrências;
- Perfil e Configurações;
- Ajuda;
- Saída rápida.

O acesso à Área Protegida será realizado de forma discreta pela fachada do aplicativo.

## Data Science

O projeto utilizará uma base pública relacionada ao tema de violência contra a mulher.

A base inicialmente selecionada é:

**SINAN — Violência Interpessoal e Autoprovocada**

Fonte:

**Ministério da Saúde / DATASUS**

A etapa de Data Science deverá incluir posteriormente:

- entendimento da base;
- limpeza dos dados;
- análise exploratória;
- preparação dos dados;
- modelagem;
- avaliação;
- integração de um indicador ao aplicativo.

## Uso de Inteligência Artificial

O uso de ferramentas de Inteligência Artificial durante o desenvolvimento é documentado no arquivo:

```text
USO_IA.md
```

As respostas de IA são utilizadas como apoio e devem ser revisadas pelos integrantes antes de serem incorporadas ao projeto.

## Links do Projeto

### GitHub

https://github.com/AbelPiassa/Meu-Ciclo

### Figma

https://www.figma.com/design/KyHQFwKu9uuQPcz31Vvlxw/Projeto-Integrador-%E2%80%A2-Calend%C3%A1rio-e-Apoio-%E2%80%A2-Refer%C3%AAncia-corrigida

### Kanban / Trello

Adicionar link do quadro.

### Documento da Entrega

Adicionar link do documento quando estiver disponível.

## Status atual

Projeto em desenvolvimento.

Atualmente estão sendo implementados:

- estrutura de navegação;
- tela de Perfil e Configurações;
- tela da Área Protegida;
- organização das branches;
- documentação técnica;
- preparação da estrutura para as próximas entregas.

O desenvolvimento está sendo realizado de forma incremental, com commits pequenos e separados por funcionalidade.
