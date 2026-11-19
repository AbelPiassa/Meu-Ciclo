import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import TelaComRolagem from "../components/TelaComRolagem";
import BotaoPrimario from "../components/BotaoPrimario";
import useSessao from "../hooks/useSessao";
import { obterSessao, obterVersaoSessao } from "../services/sessao.js";
import { consultarIndicadorSinan } from "../services/indicadores.js";
import cores from "../tema/cores";

const numero = n => n.toLocaleString("pt-BR");
const decimal = n => n.toFixed(4).replace(".", ",");

export default function IndicadorSinan({ navigation }) {
  const sessao = useSessao();
  const foco = useIsFocused();
  return <TelaComRolagem titulo="Indicador acadêmico" subtitulo="Análise histórica de notificações">
    {!foco ? null : sessao ? <Conteudo key={obterVersaoSessao()} sessao={sessao} /> : <>
      <Text style={estilos.texto}>Entre na sua conta para consultar o indicador.</Text>
      <BotaoPrimario texto="Entrar" aoPressionar={() => navigation.navigate("Login")} />
    </>}
  </TelaComRolagem>;
}

function Conteudo({ sessao }) {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [tentativa, setTentativa] = useState(0);
  useFocusEffect(useCallback(() => {
    let ativa = true;
    const vigente = () => ativa && obterSessao() === sessao;
    setCarregando(true); setErro(""); setDados(null);
    consultarIndicadorSinan().then(resultado => {
      if (vigente()) setDados(resultado);
    }).catch(falha => {
      if (vigente()) setErro(falha.message || "Não foi possível consultar o indicador.");
    }).finally(() => {
      if (vigente()) setCarregando(false);
    });
    return () => { ativa = false; };
  }, [sessao, tentativa]));

  if (carregando) return <><ActivityIndicator color={cores.primaria} /><Text style={estilos.texto}>Carregando indicador...</Text></>;
  if (erro || !dados) return <>
    <Text accessibilityLiveRegion="polite" style={estilos.texto}>{erro || "Indicador indisponível."}</Text>
    <BotaoPrimario texto="Tentar novamente" aoPressionar={() => setTentativa(n => n + 1)} />
  </>;
  return <>
    <View style={estilos.aviso}><Text style={estilos.titulo}>Apenas para fins acadêmicos</Text><Text style={estilos.texto}>{dados.aviso}</Text></View>
    <View style={estilos.cartao}>
      <Text style={estilos.titulo}>{dados.titulo}</Text>
      <Text style={estilos.texto}>{dados.fonte}</Text>
      <Text style={estilos.texto}>Período: {dados.periodo.join("–")}</Text>
      <Text style={estilos.numero}>{numero(dados.total_notificacoes)}</Text>
      <Text style={estilos.texto}>Notificações agregadas • {dados.n_ufs} UFs • {dados.n_registros} registros UF/ano</Text>
    </View>
    <View style={estilos.cartao}>
      <Text style={estilos.titulo}>Agrupamentos históricos — K-Means</Text>
      <Text style={estilos.texto}>Grupos descritivos, sem ordem de risco. A quantidade de UFs não indica segurança.</Text>
      {dados.grupos.map(g => <View key={g.grupo} style={estilos.grupo}>
        <Text style={estilos.titulo}>Grupo {g.grupo} • {g.quantidade_ufs} UFs</Text>
        <Text style={estilos.texto}>Crescimento geométrico médio das notificações: {g.crescimento_geometrico_medio_pct.toFixed(2).replace(".", ",")}%.</Text>
      </View>)}
      <Text style={estilos.texto}>Silhouette: {decimal(dados.silhouette)} • ARI médio: {decimal(dados.ari_medio)} • ARI temporal: {decimal(dados.ari_temporal)}</Text>
      <Text style={estilos.texto}>ARI percentil 10: {decimal(dados.ari_p10)}</Text>
      <Text style={estilos.titulo}>Estabilidade limitada — resultado exploratório</Text>
    </View>
    <View style={estilos.cartao}>
      <Text style={estilos.titulo}>Limitações</Text>
      {dados.limitacoes.map((l,i) => <Text key={i} style={estilos.texto}>• {l}</Text>)}
    </View>
  </>;
}
const estilos = StyleSheet.create({
  cartao: { backgroundColor: cores.cartao, padding: 16, borderRadius: 12, gap: 10, borderWidth: 1, borderColor: cores.borda },
  aviso: { backgroundColor: cores.primariaClara, padding: 16, borderRadius: 12, gap: 8 },
  titulo: { fontSize: 16, fontWeight: "bold", color: cores.textoEscuro },
  numero: { fontSize: 30, color: cores.primaria, fontWeight: "bold" },
  texto: { fontSize: 14, color: cores.textoEscuro, lineHeight: 20 },
  grupo: { borderTopWidth: 1, borderColor: cores.borda, paddingTop: 10, gap: 6 },
});
