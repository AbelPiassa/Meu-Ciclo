import { useSyncExternalStore } from "react";
import { observarSessao, obterSessao } from "../services/sessao.js";
export default function useSessao() {
  return useSyncExternalStore(observarSessao, obterSessao, obterSessao);
}
