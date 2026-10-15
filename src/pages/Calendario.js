import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BotaoPrimario from "../components/BotaoPrimario";
import cores from "../tema/cores";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const MESES_ABREVIADOS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];
const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];


const CICLO_SIMULADO = {
  inicioUltimaMenstruacao: new Date(2026, 9, 5),
  duracaoCiclo: 28,
  duracaoMenstruacao: 5,
};

const MS_DIA = 24 * 60 * 60 * 1000;

function mesmoDia(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}


function posicaoNoCiclo(data) {
  const { inicioUltimaMenstruacao, duracaoCiclo } = CICLO_SIMULADO;
  const dias = Math.round((data - inicioUltimaMenstruacao) / MS_DIA);
  return ((dias % duracaoCiclo) + duracaoCiclo) % duracaoCiclo;
}

function faseDoDia(data) {
  const { duracaoCiclo, duracaoMenstruacao } = CICLO_SIMULADO;
  const pos = posicaoNoCiclo(data);
  const ovulacao = duracaoCiclo - 14;

  if (pos < duracaoMenstruacao) return "menstruacao";
  if (pos === ovulacao) return "ovulacao";
  if (pos >= ovulacao - 5 && pos < ovulacao) return "fertil";
  return null;
}

function gerarSemanas(ano, mes) {
  const primeiro = new Date(ano, mes, 1);
  const totalDias = new Date(ano, mes + 1, 0).getDate();
  const celulas = [];

  for (let i = 0; i < primeiro.getDay(); i++) celulas.push(null);
  for (let d = 1; d <= totalDias; d++) celulas.push(new Date(ano, mes, d));
  while (celulas.length % 7 !== 0) celulas.push(null);

  const semanas = [];
  for (let i = 0; i < celulas.length; i += 7) semanas.push(celulas.slice(i, i + 7));
  return semanas;
}

export default function Calendario({ navigation }) {
  const hoje = new Date();
  const [mesVisivel, setMesVisivel] = useState(
    new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  );
  const [diaSelecionado, setDiaSelecionado] = useState(hoje);

  const semanas = useMemo(
    () => gerarSemanas(mesVisivel.getFullYear(), mesVisivel.getMonth()),
    [mesVisivel]
  );

  function mudarMes(delta) {
    setMesVisivel(
      new Date(mesVisivel.getFullYear(), mesVisivel.getMonth() + delta, 1)
    );
  }

  const { duracaoCiclo } = CICLO_SIMULADO;
  const diasParaProxima = duracaoCiclo - posicaoNoCiclo(hoje);
  const proximaMenstruacao = new Date(hoje.getTime() + diasParaProxima * MS_DIA);

  return (
    <ScrollView style={estilos.container} contentContainerStyle={estilos.conteudo}>
      <Text style={estilos.titulo}>Meu Ciclo</Text>

      <View style={estilos.cardCalendario}>
        <View style={estilos.navMes}>
          <Pressable onPress={() => mudarMes(-1)} style={estilos.botaoNav}>
            <Ionicons name="chevron-back" size={20} color={cores.textoEscuro} />
          </Pressable>
          <Text style={estilos.nomeMes}>
            {MESES[mesVisivel.getMonth()]} {mesVisivel.getFullYear()}
          </Text>
          <Pressable onPress={() => mudarMes(1)} style={estilos.botaoNav}>
            <Ionicons name="chevron-forward" size={20} color={cores.textoEscuro} />
          </Pressable>
        </View>

        <View style={estilos.linhaSemana}>
          {DIAS_SEMANA.map((d, i) => (
            <Text key={i} style={estilos.diaSemana}>{d}</Text>
          ))}
        </View>

        {semanas.map((semana, i) => (
          <View key={i} style={estilos.linhaSemana}>
            {semana.map((data, j) => {
              if (!data) return <View key={j} style={estilos.celula} />;

              const fase = faseDoDia(data);
              const ehHoje = mesmoDia(data, hoje);
              const selecionado = mesmoDia(data, diaSelecionado);

              return (
                <Pressable
                  key={j}
                  style={estilos.celula}
                  onPress={() => setDiaSelecionado(data)}
                >
                  <View
                    style={[
                      estilos.circuloDia,
                      fase === "menstruacao" && estilos.diaMenstruacao,
                      fase === "fertil" && estilos.diaFertil,
                      fase === "ovulacao" && estilos.diaOvulacao,
                      ehHoje && estilos.diaHoje,
                      selecionado && estilos.diaSelecionado,
                    ]}
                  >
                    <Text
                      style={[
                        estilos.numeroDia,
                        (fase === "menstruacao" || fase === "ovulacao") &&
                          estilos.numeroDiaClaro,
                      ]}
                    >
                      {data.getDate()}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}

        <View style={estilos.legenda}>
          <ItemLegenda cor={cores.primaria} texto="Menstruação" />
          <ItemLegenda cor={cores.primariaClara} texto="Período fértil" />
          <ItemLegenda cor={cores.ovulacao} texto="Ovulação" />
        </View>
      </View>

      <View style={estilos.cardProximo}>
        <Text style={estilos.proximoTitulo}>Próximo período</Text>
        <View style={estilos.proximoLinha}>
          <Text style={estilos.proximoTexto}>
            Previsto para {proximaMenstruacao.getDate()} de{" "}
            {MESES_ABREVIADOS[proximaMenstruacao.getMonth()]}
          </Text>
          <Text style={estilos.proximoTexto}>Em {diasParaProxima} dias</Text>
        </View>
      </View>

      <BotaoPrimario
        texto="Adicionar registro"
        aoPressionar={() => navigation.navigate("HistoricoCiclo")}
      />
    </ScrollView>
  );
}

function ItemLegenda({ cor, texto }) {
  return (
    <View style={estilos.itemLegenda}>
      <View style={[estilos.bolinha, { backgroundColor: cor }]} />
      <Text style={estilos.textoLegenda}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },

  conteudo: {
    padding: 20,
    gap: 16,
  },

  titulo: {
    fontSize: 26,
    fontWeight: "bold",
    color: cores.textoEscuro,
  },

  cardCalendario: {
    backgroundColor: cores.cartao,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: cores.borda,
  },

  navMes: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  botaoNav: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },

  nomeMes: {
    fontSize: 16,
    fontWeight: "bold",
    color: cores.textoEscuro,
  },

  linhaSemana: {
    flexDirection: "row",
  },

  diaSemana: {
    flex: 1,
    textAlign: "center",
    color: cores.textoSuave,
    paddingVertical: 6,
  },

  celula: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  circuloDia: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },

  diaMenstruacao: {
    backgroundColor: cores.primaria,
  },

  diaFertil: {
    backgroundColor: cores.primariaClara,
  },

  diaOvulacao: {
    backgroundColor: cores.ovulacao,
  },

  diaHoje: {
    borderColor: cores.textoEscuro,
  },

  diaSelecionado: {
    borderColor: cores.primaria,
    borderWidth: 3,
  },

  numeroDia: {
    fontSize: 14,
    color: cores.textoEscuro,
  },

  numeroDiaClaro: {
    color: "#ffffff",
    fontWeight: "bold",
  },

  legenda: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },

  itemLegenda: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  bolinha: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  textoLegenda: {
    fontSize: 11,
    color: cores.textoSuave,
  },

  cardProximo: {
    backgroundColor: cores.cartao,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: cores.borda,
    gap: 6,
  },

  proximoTitulo: {
    fontSize: 15,
    fontWeight: "bold",
    color: cores.textoEscuro,
  },

  proximoLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  proximoTexto: {
    fontSize: 13,
    color: cores.textoEscuro,
  },
});
