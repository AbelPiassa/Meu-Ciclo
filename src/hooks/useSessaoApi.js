import { useSyncExternalStore } from "react";
import { assinarSessao, obterSessao } from "../servicos/sessao";

// { ativa, idPerfil } — atualiza a tela quando a sessão da API começa ou termina.
export default function useSessaoApi() {
  return useSyncExternalStore(assinarSessao, obterSessao, obterSessao);
}
