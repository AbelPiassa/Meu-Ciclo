# Diário de Ocorrências — revisão final do PR #9

A correção parte do commit publicado `8c0417e` (Correção 2). A master foi incorporada por merge real, sem reescrever os commits compartilhados. O objetivo é manter o PR restrito ao Diário e preservar as implementações de Backend/Perfil, Ciclos/Calendário e Rede de Apoio.

## Sessão, requisições e recuperação

O Diário utiliza exclusivamente `src/services/sessao.js` e `src/services/api.js`. `EXPO_PUBLIC_API_URL` não contém `/api` (exemplo: `http://127.0.0.1:3000`). O login é o principal do aplicativo. A identidade comparada é o objeto retornado por `obterSessao()`, não somente `id_perfil`.

`src/utils/controleDiario.js` mantém as travas por ticket exclusivo de operação. Duas leituras em andamento compartilham a mesma promessa. Não se permite GET manual durante escrita nem escrita durante GET. Cliques rápidos não iniciam uma segunda gravação.

Rede, timeout ou HTTP 5xx durante gravação tornam o resultado incerto. Novas escritas permanecem bloqueadas até uma leitura bem-sucedida; GET falho não libera a escrita. Não há retry automático de POST, PUT ou DELETE. A mensagem informa que a escrita já enviada pode ter concluído no servidor. Após a recuperação, o formulário é limpo para exigir conferência da lista antes de uma nova tentativa.

401 invalida a sessão compartilhada; resultados de sessões antigas não são entregues. 404 na escrita coordena a recarga somente depois de liberar a trava da escrita. 422 permite correção dos dados. O PUT continua completo e preserva campos não editados pela tela; uma atualização da lista reconcilia o objeto selecionado pelo ID, sem reutilizar metadados antigos.

## Foco e interface

A tela usa `useIsFocused()`. Ao perder foco, o conteúdo sensível (lista, formulário, mensagens e modal) é desmontado, mesmo se NativeStack mantiver a tela montada. O controlador da mesma sessão permanece vivo: o blur não libera uma escrita pendente. No refoco, a tela aguarda a escrita, se existir, e consulta novamente a lista.

Campos são não editáveis e botões ficam desabilitados conforme carga, escrita, confirmação ou resultado incerto. Os controles são locais ao Diário; os componentes compartilhados dos demais CRUDs não foram modificados. Logout, Quick Exit e relogin na mesma conta descartam o conteúdo da sessão anterior.

## Arquivos existentes

A tela é `src/pages/DiarioOcorrencias.js`. O serviço é `src/services/ocorrencias.js`. Os utilitários são `controleDiario.js`, `guardaResposta.js`, `datasApi.js`, `mensagensApi.js` e `validacaoOcorrencia.js` em `src/utils/`.

Os apoios estão em `testes/apoio/ambiente.js` e `servidorApi.js`. Os cinco arquivos de testes do Diário estão em `testes/servicos/`: `controle-diario`, `guarda-resposta`, `ocorrencias`, `datas-validacao` e `diario-integracao`, todos com sufixo `.test.js`. O `src/servicos/contatosApi.js` da Rede de Apoio continua preservado e usa a sessão compartilhada; apenas os antigos módulos independentes do Diário foram retirados anteriormente.

## Data Science e autoria

Toda a pasta `data-science/` foi alinhada byte a byte com a master. A EDA nacional e por UF do PR #12 foi preservada. O modelo antigo de série temporal, seus notebooks/resultados e proposta de endpoint ficaram na referência histórica `backup/pr9-8c0417e-20261119`, também preservada em bundle. Não fazem parte do diff final do PR #9.

O PR #13 é a frente oficial de Machine Learning de Lucca. A reprodução independente por Albertini ainda não foi executada nesta correção. A nova interface do indicador depende de alinhamento com Abel e de outra entrega; não foi implementada neste PR.

Todos os registros anteriores de `USO_IA.md` foram preservados, incluindo Abel, Kauê e Lucca. A documentação do backend retirada no commit publicado foi restaurada da master.

## Testes executados em 18/11/2026

Linux do assistente, Node 24.22.3, dados fictícios:

- `npm test`: 82/82, zero pulados.
- `npm run test:diario`: 62/62 (51 unitários/controlador e 11 com API/SQLite reais).
- `npm run test:equipe`: 20/20; não equivalem a 20 testes com banco, conforme `testes/README.md`.
- `npm test --prefix backend`: 9/9.
- Lint e typecheck do backend aprovados.
- `expo export --platform web --clear`: compilado.

As evidências de renderização React e navegador são registradas separadamente após sua execução; os testes npm não são testes de UI.

## Demonstração local

Use Node 24, instale com `npm ci --prefix backend` e inicie a API. Para Expo Web, configure `CORS_ORIGINS` com a origem exata do navegador e `EXPO_PUBLIC_API_URL` sem `/api`. Reinicie/limpe o cache do Expo ao alterar a URL. Cadastre somente contas fictícias pelo login/cadastro principal e abra a área protegida pelo gatilho previsto no aplicativo.

## Limitações mantidas

Protótipo acadêmico, sem afirmação de segurança de produção. Não houve Android/iOS ou aparelho físico. Logout não garante cancelamento de escrita já enviada. Sem rede, a revogação remota pode falhar e a sessão remota durar até expirar.

O cliente compartilhado encerra o timer ao receber cabeçalhos; leitura de JSON incompleta pode demorar além da janela e atrasar o tratamento de 401. Esse achado foi reproduzido com servidor HTTP efêmero e documentado para alinhamento com Abel; o cliente e o backend não foram modificados silenciosamente. Datas futuras são bloqueadas no Diário, mas a validação correspondente do backend permanece uma pendência de sua frente.

Uma lista consultada logo após uma resposta perdida pode não provar que uma escrita muito atrasada terminou; sem idempotência no backend, o bloqueio e a conferência da lista reduzem duplicação, mas não garantem execução exatamente uma vez.

## Evidências separadas de interface desta revisão

O harness de renderização React executou 11/11 cenários com renderizador de teste e componentes nativos dublados: recuperação de escrita incerta, lista falha, 5xx, cliques duplicados, controles/formulário durante PUT, metadados atuais, blur/refoco, relogin, respostas antigas 200/401 e Quick Exit. O runtime do harness foi React 19.3.1; esta execução auxiliar não substitui os testes com o runtime instalado no aplicativo nem representa teste nativo.

No build final do Expo Web, com Express/SQLite temporários e duas contas fictícias, as interações foram instrumentadas nos handlers React atuais e as respostas interceptadas para reproduzir atrasos/perdas. Foram confirmados CRUD completo, cancelamento preservando registro, POST concluído no servidor com resposta perdida gerando somente um cadastro, bloqueio de nova escrita, GET falho mantendo o bloqueio e GET bem-sucedido atualizando a lista e limpando o formulário.

Quick Exit durante respostas reais retidas de GET 200, POST 201, PUT 200 e DELETE 204 manteve a sessão encerrada e não restaurou os relatos. A conta B não visualizou o relato da A. No blur real por navegação para Perfil e retorno por goBack, o conteúdo do Diário foi removido do DOM, a escrita pendente permaneceu travada, não houve GET concorrente e, depois da conclusão, ocorreu uma única recarga com formulário vazio. Os interceptadores foram removidos ao terminar.
