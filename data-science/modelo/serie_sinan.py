"""Modelagem agregada da série anual de notificações SINAN (Meu Ciclo+, Entrega 4).

ESCOPO — leia antes de usar:
  * A base é UMA série anual nacional (10 pontos: ano -> frequência). Não há variáveis
    explicativas, nem registros individuais.
  * Portanto NÃO existe (nem pode existir) classificação de risco individual de mulheres.
    O único produto possível é um indicador AGREGADO de tendência, com projeção exploratória.
  * Este módulo só usa numpy/pandas/scikit-learn/scipy.
"""
from __future__ import annotations

import hashlib
import json
import math
from dataclasses import dataclass
from datetime import date
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats
from sklearn.compose import TransformedTargetRegressor
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import TimeSeriesSplit

CAMINHO_PADRAO_CSV = Path(__file__).resolve().parents[1] / "dados" / "brutos" / "sinan_feminino_2015_2024.csv"
CAMINHO_PADRAO_SAIDA = Path(__file__).resolve().parents[1] / "saidas" / "indicador_notificacoes_agregado.json"

# ---------------------------------------------------------------------------
# Critérios de suficiência — DEFINIDOS ANTES de olhar os resultados da validação.
# O modelo só é considerado utilizável como previsão se atender aos TRÊS (no melhor modelo).
# São escolhas de julgamento da equipe; podem ser revistas, mas não depois de ver o resultado.
# ---------------------------------------------------------------------------
CRITERIOS = {
    "mase_maximo": 1.0,          # MASE < 1: erro menor que o do método ingênuo medido DENTRO do treino
    "mape_maximo_pct": 10.0,     # erro percentual médio de até 10% por ano
    "pior_ano_maximo_pct": 20.0,  # nenhum ano de teste com erro acima de 20%
}

ANO_ATIPICO = 2020  # queda em 2020 (período da pandemia de covid-19), tratada só como sensibilidade

# Termos que nunca podem aparecer como CHAVE do indicador (evita virar "risco individual").
CHAVES_PROIBIDAS = (
    "risco", "score", "escore", "probabilidade", "classificacao", "classificação",
    "usuaria", "usuária", "perfil", "id_perfil", "cpf", "nome", "telefone", "endereco", "endereço",
)


# ----------------------------------------------------------------------------- dados
def carregar_serie(caminho: Path | str = CAMINHO_PADRAO_CSV) -> pd.DataFrame:
    """Lê o CSV (ano;frequencia) e valida: numérico, sem ausentes/duplicados/negativos, anos consecutivos."""
    df = pd.read_csv(caminho, sep=";", encoding="utf-8-sig")
    if set(df.columns) != {"ano", "frequencia"}:
        raise ValueError(f"Colunas inesperadas: {list(df.columns)}")
    df = df.apply(pd.to_numeric, errors="raise").sort_values("ano").reset_index(drop=True)
    if df.isna().any().any():
        raise ValueError("Valores ausentes na série.")
    if df["ano"].duplicated().any():
        raise ValueError("Anos repetidos na série.")
    if (df["frequencia"] <= 0).any():
        raise ValueError("Frequências devem ser positivas (o modelo exponencial usa log).")
    if not (df["ano"].diff().dropna() == 1).all():
        raise ValueError("A série deve ter anos consecutivos (sem lacunas).")
    return df.astype({"ano": int, "frequencia": float})


def sha256_arquivo(caminho: Path | str) -> str:
    return hashlib.sha256(Path(caminho).read_bytes()).hexdigest()


# ----------------------------------------------------------------------------- modelos
@dataclass(frozen=True)
class ModeloSerie:
    nome: str
    descricao: str
    ignorar_anos: tuple[int, ...] = ()

    def prever(self, anos_treino: np.ndarray, y_treino: np.ndarray, ano_alvo: int) -> float:
        """Ajusta SÓ com o treino e prevê um ano (sem olhar o futuro)."""
        manter = ~np.isin(anos_treino, self.ignorar_anos)
        x, y = anos_treino[manter].reshape(-1, 1), y_treino[manter]
        if self.nome == "ingenuo":
            return float(y_treino[-1])
        if self.nome == "deriva":
            passo = (y_treino[-1] - y_treino[0]) / (len(y_treino) - 1)
            return float(y_treino[-1] + passo * (ano_alvo - anos_treino[-1]))
        if self.nome == "tendencia_linear":
            return float(LinearRegression().fit(x, y).predict([[ano_alvo]])[0])
        if self.nome.startswith("tendencia_exponencial"):
            reg = TransformedTargetRegressor(regressor=LinearRegression(), func=np.log, inverse_func=np.exp)
            return float(reg.fit(x, y).predict([[ano_alvo]])[0])
        raise ValueError(f"Modelo desconhecido: {self.nome}")


MODELOS = (
    ModeloSerie("ingenuo", "Repete o último ano observado (baseline)."),
    ModeloSerie("deriva", "Último ano + variação média anual absoluta do período de treino."),
    ModeloSerie("tendencia_linear", "Regressão linear da frequência contra o ano."),
    ModeloSerie("tendencia_exponencial", "Regressão linear do log da frequência (crescimento % constante)."),
    ModeloSerie(
        "tendencia_exponencial_sem_2020",
        "Igual à exponencial, ignorando 2020 no ajuste (sensibilidade ao ano atípico).",
        ignorar_anos=(ANO_ATIPICO,),
    ),
)


# ----------------------------------------------------------------------------- validação
def validar_rolling_origin(df: pd.DataFrame, modelos=MODELOS, n_splits: int = 5) -> pd.DataFrame:
    """Validação cruzada temporal (rolling origin, janela expansível, previsão de 1 passo).

    Cada dobra treina com os anos até t-1 e testa em t. Nunca embaralha nem usa o futuro
    (validação cruzada comum/leave-one-out vazaria informação do futuro numa série temporal).
    """
    anos, y = df["ano"].to_numpy(), df["frequencia"].to_numpy()
    divisor = TimeSeriesSplit(n_splits=n_splits, test_size=1)
    linhas = []
    for dobra, (idx_treino, idx_teste) in enumerate(divisor.split(anos), start=1):
        escala = float(np.mean(np.abs(np.diff(y[idx_treino]))))  # erro médio do ingênuo no treino
        for modelo in modelos:
            previsto = modelo.prever(anos[idx_treino], y[idx_treino], int(anos[idx_teste[0]]))
            real = float(y[idx_teste[0]])
            erro = previsto - real
            linhas.append({
                "dobra": dobra, "modelo": modelo.nome, "ano_teste": int(anos[idx_teste[0]]),
                "tamanho_treino": len(idx_treino), "real": real, "previsto": previsto,
                "erro": erro, "erro_abs": abs(erro), "erro_pct": 100 * erro / real,
                "erro_abs_pct": 100 * abs(erro) / real, "erro_escalado": abs(erro) / escala,
                "erro_log": math.log(real / previsto),
            })
    return pd.DataFrame(linhas)


def resumir_validacao(dobras: pd.DataFrame, ignorar_anos: tuple[int, ...] = ()) -> pd.DataFrame:
    """Métricas por modelo: MAE, RMSE, MAPE, MASE, viés % e pior ano. `ignorar_anos` = análise de sensibilidade."""
    d = dobras[~dobras["ano_teste"].isin(ignorar_anos)]
    resumo = d.groupby("modelo", sort=False).agg(
        dobras=("dobra", "count"),
        mae=("erro_abs", "mean"),
        rmse=("erro", lambda e: float(np.sqrt(np.mean(np.square(e))))),
        mape_pct=("erro_abs_pct", "mean"),
        mase=("erro_escalado", "mean"),
        vies_pct=("erro_pct", "mean"),
        pior_ano_pct=("erro_abs_pct", "max"),
    )
    return resumo.round(3)


def avaliar_criterios(linha: pd.Series, criterios: dict = CRITERIOS) -> dict[str, bool]:
    return {
        "mase_menor_que_1": bool(linha["mase"] < criterios["mase_maximo"]),
        "mape_dentro_do_limite": bool(linha["mape_pct"] <= criterios["mape_maximo_pct"]),
        "pior_ano_dentro_do_limite": bool(linha["pior_ano_pct"] <= criterios["pior_ano_maximo_pct"]),
    }


# ----------------------------------------------------------------------------- projeção
def projetar(df: pd.DataFrame, modelo: ModeloSerie, dobras_do_modelo: pd.DataFrame) -> dict:
    """Projeção de 1 passo (ano seguinte à série) com intervalo empírico baseado nos erros da validação.

    O intervalo usa a raiz do erro quadrático médio dos erros em log (inclui viés) e o quantil t
    com (n-1) graus de liberdade. Com poucas dobras ele é APROXIMADO e deve ser lido como ordem de grandeza.
    """
    anos, y = df["ano"].to_numpy(), df["frequencia"].to_numpy()
    ano_alvo = int(anos[-1]) + 1
    ponto = modelo.prever(anos, y, ano_alvo)
    e = dobras_do_modelo["erro_log"].to_numpy()
    rms = float(np.sqrt(np.mean(np.square(e))))
    gl = len(e) - 1

    def faixa(conf: float) -> list[int]:
        q = float(stats.t.ppf(0.5 + conf / 2, gl))
        return [round(ponto * math.exp(-q * rms)), round(ponto * math.exp(q * rms))]

    return {"ano": ano_alvo, "valor": round(ponto), "intervalo_80": faixa(0.80), "intervalo_95": faixa(0.95),
            "erro_log_rms": round(rms, 4), "graus_liberdade": gl}


# ----------------------------------------------------------------------------- indicador
def indicadores_descritivos(df: pd.DataFrame) -> dict:
    y, anos = df["frequencia"].to_numpy(), df["ano"].to_numpy()
    n_anos = len(y) - 1
    variacao_anual = np.diff(y) / y[:-1] * 100
    i_queda = int(np.argmin(variacao_anual))
    return {
        "variacao_percentual_periodo": round(float((y[-1] / y[0] - 1) * 100), 1),
        "taxa_crescimento_anual_composta_pct": round(float(((y[-1] / y[0]) ** (1 / n_anos) - 1) * 100), 1),
        "variacao_ultimo_ano_pct": round(float(variacao_anual[-1]), 1),
        "ano_maior_queda": int(anos[i_queda + 1]),
        "variacao_ano_maior_queda_pct": round(float(variacao_anual[i_queda]), 1),
    }


def _chaves(obj, acumulado=None):
    acumulado = [] if acumulado is None else acumulado
    if isinstance(obj, dict):
        for chave, valor in obj.items():
            acumulado.append(str(chave))
            _chaves(valor, acumulado)
    elif isinstance(obj, list):
        for item in obj:
            _chaves(item, acumulado)
    return acumulado


def validar_indicador(indicador: dict) -> None:
    """Garante que o artefato é agregado e não carrega nada que lembre classificação individual."""
    for chave in _chaves(indicador):
        minuscula = chave.lower()
        for proibido in CHAVES_PROIBIDAS:
            if proibido in minuscula:
                raise ValueError(f"Chave não permitida no indicador agregado: {chave!r}")
    if indicador["escopo"]["nivel"] != "agregado_nacional_anual":
        raise ValueError("Escopo deve ser agregado nacional anual.")
    if indicador["projecao_exploratoria"]["confianca"] not in {"baixa", "media", "alta"}:
        raise ValueError("Confiança inválida.")
    for chave in ("nao_e", "uso_permitido", "exibir_apenas_em"):
        if chave not in indicador["escopo"]:
            raise ValueError(f"escopo.{chave} ausente.")


def construir_indicador(
    caminho_csv: Path | str = CAMINHO_PADRAO_CSV, gerado_em: date | None = None, caminho_relativo_csv: str | None = None
) -> tuple[dict, pd.DataFrame, pd.DataFrame]:
    """Executa todo o pipeline e devolve (indicador, dobras, resumo)."""
    df = carregar_serie(caminho_csv)
    dobras = validar_rolling_origin(df)
    resumo = resumir_validacao(dobras)
    resumo_sem_2020 = resumir_validacao(dobras, ignorar_anos=(ANO_ATIPICO,))

    # Escolha pelo menor MAE na validação, entre os modelos que NÃO são o baseline (ingênuo).
    candidatos = resumo.drop(index="ingenuo")
    escolhido_nome = str(candidatos["mae"].idxmin())
    escolhido = next(m for m in MODELOS if m.nome == escolhido_nome)
    criterios = avaliar_criterios(resumo.loc[escolhido_nome])
    suficiente = all(criterios.values())

    projecao = projetar(df, escolhido, dobras[dobras["modelo"] == escolhido_nome])
    anos, y = df["ano"].to_numpy(), df["frequencia"].to_numpy()
    entre_modelos = [m.prever(anos, y, projecao["ano"]) for m in MODELOS if m.nome != "ingenuo"]
    projecao["faixa_entre_modelos"] = [round(min(entre_modelos)), round(max(entre_modelos))]
    projecao["confianca"] = "media" if suficiente else "baixa"
    projecao["recomendacao_de_uso"] = (
        "pode_ser_exibida_como_tendencia" if suficiente else "nao_exibir_valor_numerico_ao_publico"
    )

    def metricas(tabela: pd.DataFrame, nome: str) -> dict:
        return {k: float(v) for k, v in tabela.loc[nome].to_dict().items()}

    indicador = {
        "versao_esquema": "1.0",
        "gerado_em": (gerado_em or date.today()).isoformat(),
        "id": "tendencia_notificacoes_sinan_feminino_brasil",
        "titulo": "Tendência anual das notificações de violência contra mulheres (SINAN, Brasil)",
        "fonte": {
            "sistema": "SINAN / DATASUS (TabNet) — Violência Interpessoal e Autoprovocada",
            "recorte": "Brasil; sexo feminino; ano da notificação; frequência",
            "periodo": f"{int(anos[0])}-{int(anos[-1])}",
            "arquivo": caminho_relativo_csv or str(caminho_csv),
            "sha256_arquivo": sha256_arquivo(caminho_csv),
            "conferencia_com_portal": "pendente",
            "observacoes": [
                "Valores transcritos da consulta TabNet pelo grupo; ainda não conferidos com o portal.",
                "Um estudo publicado (Epidemiol Serv Saude 2025;34:e20240475) relata ~670 mil notificações "
                "em 2023 para mulheres no Brasil, contra 419.967 neste CSV; a diferença de filtro/definição "
                "não foi esclarecida. Não exibir valores absolutos ao público até a conferência.",
            ],
        },
        "escopo": {
            "nivel": "agregado_nacional_anual",
            "unidade": "notificações registradas por ano",
            "nao_e": [
                "classificação de risco individual de mulheres",
                "estimativa da ocorrência real de violência (há subnotificação)",
                "dado sobre qualquer usuária do aplicativo",
            ],
            "uso_permitido": [
                "texto informativo de contexto sobre a tendência histórica das notificações",
                "material de apresentação acadêmica da etapa de Data Science",
            ],
            "exibir_apenas_em": "area_protegida",
        },
        "serie_observada": [{"ano": int(a), "notificacoes": int(v)} for a, v in zip(anos, y)],
        "indicadores_descritivos": indicadores_descritivos(df),
        "modelo": {
            "tipo": "série temporal anual, previsão de 1 passo",
            "selecionado": escolhido_nome,
            "descricao": escolhido.descricao,
            "validacao": {
                "metodo": "validação cruzada temporal (rolling origin, janela expansível, TimeSeriesSplit)",
                "dobras": int(resumo.loc[escolhido_nome, "dobras"]),
                "anos_teste": [int(a) for a in sorted(dobras["ano_teste"].unique())],
                "metricas_modelo": metricas(resumo, escolhido_nome),
                "metricas_baseline_ingenuo": metricas(resumo, "ingenuo"),
                "metricas_modelo_sem_2020": metricas(resumo_sem_2020, escolhido_nome),
                "criterios_definidos_antes": CRITERIOS,
                "criterios_atendidos": criterios,
            },
            "desempenho_suficiente": bool(suficiente),
        },
        "projecao_exploratoria": projecao,
        "avisos": [
            "Série com 10 pontos e uma variável: apenas indicador agregado exploratório; sem previsão confiável.",
            "Notificações não equivalem à ocorrência real de violência; mudanças de cobertura e de processo "
            "de notificação afetam a série.",
            "Nunca combinar este indicador com dados de uma usuária nem usá-lo como classificação individual.",
        ],
    }
    validar_indicador(indicador)
    return indicador, dobras, resumo


def salvar_indicador(indicador: dict, caminho: Path | str = CAMINHO_PADRAO_SAIDA) -> Path:
    caminho = Path(caminho)
    caminho.parent.mkdir(parents=True, exist_ok=True)
    caminho.write_text(json.dumps(indicador, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return caminho


if __name__ == "__main__":
    ind, _, _ = construir_indicador(caminho_relativo_csv="data-science/dados/brutos/sinan_feminino_2015_2024.csv")
    print("Indicador gravado em:", salvar_indicador(ind))
