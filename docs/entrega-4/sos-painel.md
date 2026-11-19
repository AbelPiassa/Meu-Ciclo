# SOS e central de demonstração

Somente protótipo acadêmico. Não aciona polícia, SMS ou serviços externos. Não use dados reais de vítimas. O SOS exige conta fictícia `teste.*` (ex. `teste.demo`), sessão autenticada e servidor com chave de operador configurada. A migração v2 preserva o esquema anterior e adiciona `alertas_sos`, relacionada a `perfis` com exclusão em cascata.

## Executar

Na raiz, `npm ci`, depois `npx expo install expo-location` se ainda não instalado (a dependência e lockfile devem ser versionados). No CMD, configure uma chave aleatória: `for /f %i in ('python -c "import secrets; print(secrets.token_hex(32))"') do set "PAINEL_TOKEN=%i"`. Use `echo %PAINEL_TOKEN%` apenas localmente para copiar a chave. Não enviar, gravar no Git ou compartilhar capturas da chave. Execute `npm start --prefix backend` na mesma janela. O painel é `http://localhost:3000/painel`. Cole a chave no painel; ela fica em memória, não no URL.

Em outra janela, defina `EXPO_PUBLIC_API_URL=http://localhost:3000` para Expo Web; `npx expo start --web`. Para uso em dispositivo de teste na mesma rede, configure `HOST=0.0.0.0` na janela do servidor e use o IP local do computador na variável Expo. HTTP é apenas para laboratório confiável; não publicar em produção. Se necessário, configure a origem exata do Expo Web em `CORS_ORIGINS`.

## Demonstração

1. Criar e entrar em conta especificamente fictícia (`teste.demo`), acessar a área protegida e selecionar SOS de demonstração.
2. Escolher coordenadas simuladas (fixas e explicitamente identificadas), ou autorizar a localização do próprio aparelho de teste. A localização só é solicitada após confirmação. Se negar a permissão, não há envio real; pode testar com a opção simulada. Não enviar a localização de terceiros.
3. Confirmar; a API registra identificador, data/hora UTC, coordenadas, origem e status Novo. O painel busca dados a cada 3 segundos e destaca os novos alertas.
4. Alterar status no painel. Conferir que a saída rápida não gera SOS, que usuário comum não acessa o painel e que contas não fictícias não registram alertas.
5. Desconectar painel e usar Quick Exit. Um POST já enviado pode concluir após a saída; não há garantia exatamente uma vez, portanto confira o painel antes de repetir um envio incerto.

## Limitações

A chave do painel é uma credencial única de demonstração, não um sistema de operadores de produção. Não há criptografia em repouso, GPS em background, entrega garantida ou canal real de emergência. O SQLite deve conter exclusivamente dados fictícios; apagar a conta de teste remove alertas vinculados. Testes automatizados de API e migração incluídos; validar interface Expo, permissões de aparelho e polling manualmente. Não afirmar execução de teste sem evidência.
