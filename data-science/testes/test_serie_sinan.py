import copy
import json
from datetime import date

import numpy as np
import pandas as pd
import pytest

from modelo import serie_sinan as m


@pytest.fixture(scope="module")
def resultado():
    return m.construir_indicador(gerado_em=date(2026, 11, 17), caminho_relativo_csv="x.csv")


def test_carregar_serie_real():
    df = m.carregar_serie()
    assert list(df["ano"]) == list(range(2015, 2025))
    assert df["frequencia"].iloc[0] == 158986 and df["frequencia"].iloc[-1] == 437828


@pytest.mark.parametrize("conteudo,msg", [
    ("ano;frequencia\n2015;10\n2015;11\n", "repetidos"),
    ("ano;frequencia\n2015;10\n2017;11\n", "consecutivos"),
    ("ano;frequencia\n2015;-1\n2016;11\n", "positivas"),
    ("ano;freq\n2015;1\n", "Colunas"),
])
def test_carregar_serie_rejeita_dados_ruins(tmp_path, conteudo, msg):
    arq = tmp_path / "s.csv"
    arq.write_text(conteudo)
    with pytest.raises(ValueError, match=msg):
        m.carregar_serie(arq)


def test_validacao_nao_usa_o_futuro():
    """Alterar um ano FUTURO não pode mudar a previsão feita antes dele."""
    df = m.carregar_serie()
    d1 = m.validar_rolling_origin(df)
    df2 = df.copy()
    df2.loc[df2["ano"] == 2024, "frequencia"] *= 10
    d2 = m.validar_rolling_origin(df2)
    antes = lambda d: d[d["ano_teste"] < 2024].sort_values(["modelo", "ano_teste"])["previsto"].to_numpy()
    assert np.allclose(antes(d1), antes(d2))


def test_folds_temporais_expansivos():
    d = m.validar_rolling_origin(m.carregar_serie())
    assert sorted(d["ano_teste"].unique()) == [2020, 2021, 2022, 2023, 2024]
    assert list(d[d["modelo"] == "ingenuo"]["tamanho_treino"]) == [5, 6, 7, 8, 9]


def test_modelos_em_serie_conhecida():
    anos = np.arange(2015, 2020)
    y = 100.0 * 2.0 ** (anos - 2015)  # crescimento exato de 100%/ano
    exp = next(x for x in m.MODELOS if x.nome == "tendencia_exponencial")
    assert exp.prever(anos, y, 2020) == pytest.approx(3200.0)
    lin = next(x for x in m.MODELOS if x.nome == "tendencia_linear")
    y_lin = 10.0 * (anos - 2014)
    assert lin.prever(anos, y_lin, 2020) == pytest.approx(60.0)
    assert next(x for x in m.MODELOS if x.nome == "ingenuo").prever(anos, y, 2020) == y[-1]


def test_metricas_ingenuo_conferidas_a_mao():
    d = m.validar_rolling_origin(m.carregar_serie())
    r = m.resumir_validacao(d).loc["ingenuo"]
    reais = np.array([233072, 268884, 318137, 419967, 437828.0])
    prev = np.array([289742, 233072, 268884, 318137, 419967.0])
    assert r["mae"] == pytest.approx(np.mean(np.abs(prev - reais)), abs=0.01)
    assert r["mape_pct"] == pytest.approx(np.mean(np.abs(prev - reais) / reais) * 100, abs=0.01)


def test_indicador_resultado_honesto(resultado):
    ind, _, _ = resultado
    assert ind["modelo"]["desempenho_suficiente"] is False
    assert ind["projecao_exploratoria"]["confianca"] == "baixa"
    assert ind["projecao_exploratoria"]["recomendacao_de_uso"] == "nao_exibir_valor_numerico_ao_publico"
    assert ind["fonte"]["conferencia_com_portal"] == "pendente"
    assert ind["indicadores_descritivos"]["variacao_percentual_periodo"] == 175.4
    p = ind["projecao_exploratoria"]
    assert p["intervalo_95"][0] < p["intervalo_80"][0] < p["valor"] < p["intervalo_80"][1] < p["intervalo_95"][1]


def test_indicador_e_agregado_e_nao_individual(resultado):
    ind, _, _ = resultado
    m.validar_indicador(ind)  # não levanta
    assert ind["escopo"]["exibir_apenas_em"] == "area_protegida"
    texto = json.dumps(ind, ensure_ascii=False)
    assert "id_perfil" not in texto
    ruim = copy.deepcopy(ind)
    ruim["modelo"]["risco_individual"] = 0.7
    with pytest.raises(ValueError, match="não permitida"):
        m.validar_indicador(ruim)
    ruim = copy.deepcopy(ind)
    ruim["escopo"]["nivel"] = "individual"
    with pytest.raises(ValueError):
        m.validar_indicador(ruim)


def test_json_versionado_esta_atualizado(resultado):
    """O JSON commitado deve ser exatamente o que o código gera hoje (reprodutibilidade)."""
    ind, _, _ = resultado
    ind["fonte"]["arquivo"] = "data-science/dados/brutos/sinan_feminino_2015_2024.csv"
    salvo = json.loads(m.CAMINHO_PADRAO_SAIDA.read_text(encoding="utf-8"))
    salvo["gerado_em"] = ind["gerado_em"]
    assert salvo == ind
