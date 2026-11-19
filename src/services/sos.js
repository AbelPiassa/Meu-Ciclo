import { obterSessao, requisicaoAutenticada } from "./sessao.js";
export async function enviarSos(dados) {
  const sessao = obterSessao();
  if (!sessao) throw new Error("Entre na conta fictícia para continuar.");
  const r = await requisicaoAutenticada("/api/sos", { metodo: "POST", dados });
  if (obterSessao() !== sessao) throw new Error("Sessão alterada.");
  if (!Number.isSafeInteger(r?.id_alerta) || r.status !== "Novo") throw new Error("Resposta de alerta inválida.");
  return r;
}
