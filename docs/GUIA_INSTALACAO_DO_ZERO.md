# Instalação do zero e demonstração — Meu Ciclo+ (Entrega 4)

Este guia permite ao professor ou a qualquer integrante reproduzir o aplicativo, sua API SQLite e o painel acadêmico de SOS em um computador novo. **Utilize apenas contas e coordenadas fictícias.** Não é um serviço de emergência, não contata polícia e não deve ser usado com relatos de pessoas reais.

## 1. Pré-requisitos

- Git, navegador atual e **Node.js 24.x** com npm (Node 20 não suporta `node:sqlite` deste backend).
- Computador Windows, Linux ou macOS com acesso à internet apenas para instalar dependências.
- Para testar no celular: Android com Expo Go **compatível com SDK 57**, ou iPhone com **Expo Web no Safari** (o Expo Go disponível na App Store pode ser SDK 58 e incompatível).
- Computador e celular na mesma rede Wi-Fi confiável; preferir rede doméstica, não Wi-Fi de convidados.

Confirmar versões:

```bash
node -v
npm -v
git --version
```

Se `node -v` não mostrar 24.x, instale Node.js 24 LTS antes de continuar.

## 2. Baixar o código e instalar dependências

Terminal no computador novo (PowerShell, Terminal do VS Code ou shell Linux/macOS):

```bash
git clone https://github.com/AbelPiassa/Meu-Ciclo.git
cd Meu-Ciclo
npm ci
cd backend
npm ci
```

Quem recebeu o ZIP do projeto pode simplesmente extrair em uma pasta e executar os comandos `npm ci` na raiz e no `backend`. O ZIP não deve conter `node_modules`, `.env`, `.env.local` ou banco SQLite local.

## 3. Preparar API e banco SQLite

Em `backend`, criar o arquivo local de ambiente:

- Linux/macOS: `cp .env.example .env`
- Windows PowerShell: `Copy-Item .env.example .env`

O backend usa por padrão:

```env
PORT=3000
HOST=127.0.0.1
DATABASE_PATH=./data/meu-ciclo.sqlite
CORS_ORIGINS=http://localhost:8081,http://localhost:19006
PAINEL_TOKEN=
```

A API cria o esquema e migrações SQLite automaticamente na primeira execução. **Não apague o banco** ao reiniciar. O arquivo SQLite do operador não deve ser enviado ao Git.

### Gerar uma chave exclusivamente local para o painel de demonstração

Em `backend`:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copiar os **64 caracteres hexadecimais** exibidos para o valor `PAINEL_TOKEN=` em `backend/.env`. Não publicar a chave, não enviá-la no grupo, nem mostrar nos prints do trabalho. Para desabilitar SOS e painel, deixar a variável vazia.

Para o celular acessar a API, alterar somente `HOST=0.0.0.0` no `.env` do computador de teste. Não exponha a porta 3000 à internet nem faça redirecionamento de portas no roteador.

Iniciar a API dentro de `backend`:

```bash
npm start
```

Deixe este terminal **aberto** durante a demonstração. A porta é `3000`.

Teste no navegador do computador: `http://localhost:3000/health` (resposta esperada: `{"status":"ok"}`).

## 4. Abrir painel de monitoramento SOS

Ainda com a API ligada, abra **no navegador do próprio computador**:

```text
http://localhost:3000/painel
```

Digite ali a chave hexadecimal que foi configurada em `PAINEL_TOKEN`, sem inseri-la em URL. O painel mostra os alertas acadêmicos armazenados em SQLite, incluindo **latitude e longitude** (não altitude), data/hora, conta fictícia, origem e status.

O painel consulta atualizações automaticamente a cada aproximadamente 3 segundos. Os estados disponíveis são **Novo → Em atendimento → Concluído**. A área de monitoramento é separada da autenticação comum do app.

Se não aparecerem alertas, confira se usou conta iniciada por `teste.`, ativou o SOS acadêmico e configurou a mesma API do aplicativo. Não coloque valores reais de localização no relatório.

## 5. Iniciar o aplicativo Expo

Volte para a **raiz** do repositório em outro terminal.

Para teste na mesma máquina, criar `.env.local` na raiz com:

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:3000
```

Para um **celular físico na mesma rede**, substitua 127.0.0.1 pelo IP LAN do computador (`hostname -I` no Linux, `ipconfig` no Windows, Ajustes de Rede no macOS). Exemplo fictício:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.105:3000
```

**Não adicionar `/api`** a esta variável; o cliente já inclui as rotas. Nunca comitar `.env.local`.

No Linux/macOS, iniciar Expo Go / modo LAN:

```bash
npx expo start --lan --go
```

No Android, abrir Expo Go **para SDK 57** e escanear o QR Code. Se o Expo Go informar SDK 58, não atualize o projeto automaticamente.

Para abrir no navegador (Windows/Linux/macOS e também Safari do iPhone), usar na raiz:

```bash
npx expo start --web
```

Se usar celular no navegador, abra `http://IP_DO_COMPUTADOR:8081` (endereço exibido pelo Expo). Em caso de erro CORS, configure no `backend/.env` a **origem exata** da página no campo `CORS_ORIGINS`, separando múltiplas origens por vírgula, reinicie a API e recarregue a página. Não use `*` em CORS.

Teste no navegador do celular primeiro: `http://IP_DO_COMPUTADOR:3000/health`. Se não responder, confira mesma rede, IP correto, firewall e `HOST=0.0.0.0`.

## 6. Teste ponta a ponta com SOS demonstrativo

1. Abrir o app pela fachada de calendário, acessar a área protegida pelo mecanismo existente e cadastrar/login com usuário **`teste.demo` ou outro iniciado por `teste.`** (senha longa fictícia; não divulgar).
2. Testar criar/ler/editar/excluir em Ciclos, Contatos e Diário, mais consulta/edição do Perfil. Verificar persistência após reiniciar a API. Usar dados fictícios.
3. Acessar **SOS de demonstração**, selecionar as **coordenadas simuladas** e confirmar. Se optar por localização do próprio celular de teste, autorizar explicitamente; evite usar a localização real numa apresentação pública.
4. No navegador do computador, abrir/recarregar `/painel`: deve surgir um alerta `Novo`, com latitude, longitude, origem e data/hora. Conferir atualização automática, marcar `Em atendimento` e depois `Concluído`.
5. Acionar **Saída Rápida** no app; ela deve retornar à fachada sem disparar novo alerta. Conferir que Voltar não expõe a tela protegida.
6. Os cartões 180 e 190 **abrem o discador**; cancelar, sem efetuar ligação. Nenhum serviço de emergência real deve ser contatado.

O painel não apresenta altitude; trabalha com latitude e longitude simuladas. Não registre tokens de acesso, dados reais, números pessoais ou posições reais em screenshots.

## 7. Comandos de verificação no computador

Na **raiz do projeto**:

```bash
npm test
npm test --prefix backend
npm run lint --prefix backend
npm run typecheck --prefix backend
npx expo-doctor
npx expo export --platform web --clear
```

Para a parte de Data Science, use o ambiente Python descrito em `data-science/README.md` e os notebooks versionados em `data-science/notebooks/`; os arquivos entregues devem conter as saídas executadas.

## 8. Problemas frequentes

- **`node:sqlite` não encontrado:** Node desatualizado; instale Node 24.
- **`PAINEL_TOKEN` inválido ou painel desabilitado:** conferir os 64 hex em `backend/.env` e reiniciar API.
- **Página abre mas app não conecta:** verificar URL, IP, `HOST=0.0.0.0`, firewall e origem CORS (principalmente Expo Web).
- **SDK 57 versus Expo Go 58:** usar Expo Go compatível no Android; no iPhone usar Expo Web/Safari ou uma build de desenvolvimento compatível.
- **O alerta não aparece:** testar conta `teste.*`, chave configurada, mesma API, e consultar logs locais com dados fictícios.
- **`npm start` na raiz abre outro modo:** prefira `npx expo start --lan --go` ou `npx expo start --web`, conforme o dispositivo.

## 9. Materiais de entrega do Blackboard

Seguindo o enunciado da Entrega Final 3 e 4: anexar o projeto Expo sem `node_modules`, registrar link/commit do GitHub, disponibilizar API reproduzível, Kanban em PDF/PNG/JPG, `USO_IA.md`, e notebooks `.ipynb` já executados com outputs. No formulário informar nome da equipe, participantes, repositório e fonte pública utilizada. O prazo declarado no material é 19/11/2026 às 23h59.

**Não confundir artefatos gerados no PR com a `master` depois do merge:** conferir versão e SHA e gerar novo ZIP se ocorrerem alterações posteriores.
