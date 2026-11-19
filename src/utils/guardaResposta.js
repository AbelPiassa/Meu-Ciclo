// Guarda para telas que exibem dados da sessão.
// Uma resposta de rede só pode atualizar a interface se:
//  - a tela continua montada;
//  - a "geração" da sessão não mudou (login, logout, 401 ou Quick Exit incrementam);
//  - o perfil da sessão é o mesmo que iniciou a requisição.
// Assim, respostas antigas não repõem informações sensíveis depois do encerramento.
export function criarGuardaDeResposta({
  idPerfil,
  geracaoEsperada,
  estaMontada,
  geracaoAtual,
  idPerfilAtual,
}) {
  return () =>
    idPerfil !== null &&
    estaMontada() === true &&
    geracaoAtual() === geracaoEsperada &&
    (idPerfilAtual() ?? null) === idPerfil;
}
