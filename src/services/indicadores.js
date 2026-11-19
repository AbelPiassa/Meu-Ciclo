import { obterSessao, requisicaoAutenticada } from "./sessao.js";

export async function consultarIndicadorSinan() {
  const sessao = obterSessao();
  if (!sessao) throw new Error("Entre na sua conta para continuar.");
  const dados = await requisicaoAutenticada("/api/indicadores/sinan");
  if (obterSessao() !== sessao) throw new Error("Sessão alterada.");
  if (dados?.versao_esquema !== "1.0" || dados.id !== "perfil_historico_notificacoes_sinan" ||
      typeof dados.aviso !== "string" || !dados.aviso.trim() ||
      typeof dados.fonte !== "string" || typeof dados.titulo !== "string" ||
      typeof dados.status_validacao !== "string" ||
      !Array.isArray(dados.periodo) || dados.periodo.length !== 2 ||
      !dados.periodo.every(Number.isFinite) ||
      ![dados.n_ufs, dados.n_registros, dados.total_notificacoes, dados.k, dados.silhouette,
        dados.ari_medio, dados.ari_p10, dados.ari_temporal].every(Number.isFinite) ||
      !Array.isArray(dados.grupos) || !dados.grupos.every(g => g &&
        [g.grupo,g.quantidade_ufs,g.crescimento_geometrico_medio_pct].every(Number.isFinite)) ||
      !Array.isArray(dados.limitacoes) || !dados.limitacoes.every(l => typeof l === "string")) {
    throw new Error("Indicador acadêmico inválido ou indisponível.");
  }
  return dados;
}
