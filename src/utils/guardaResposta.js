// Guarda para telas que exibem dados da sessão.
// Uma resposta de rede só pode atualizar a interface se:
//  - a tela continua ativa (montada e em foco);
//  - a "geração" local não mudou (cada montagem/desmontagem incrementa);
//  - a sessão é a MESMA que iniciou a requisição (comparação por identidade do objeto
//    devolvido por obterSessao()). Comparar apenas id_perfil não basta: entrar de novo
//    na mesma conta cria outra sessão, com outro token, e a resposta antiga deve ser
//    descartada do mesmo jeito.
export function criarGuardaDeResposta({
  sessao,
  geracaoEsperada,
  estaAtiva,
  geracaoAtual,
  sessaoAtual,
}) {
  return () =>
    sessao !== null &&
    sessao !== undefined &&
    estaAtiva() === true &&
    geracaoAtual() === geracaoEsperada &&
    sessaoAtual() === sessao;
}
