import { useState, useRef, useCallback } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import * as Location from "expo-location";
import TelaComRolagem from "../components/TelaComRolagem";
import BotaoPrimario from "../components/BotaoPrimario";
import useSessao from "../hooks/useSessao";
import { obterSessao, obterVersaoSessao } from "../services/sessao.js";
import { enviarSos } from "../services/sos.js";
import cores from "../tema/cores";

export default function SosDemo({ navigation }) {
  const sessao = useSessao();
  const foco = useIsFocused();
  return <TelaComRolagem titulo="SOS de demonstração" subtitulo="Somente para avaliação acadêmica">
    {!foco ? null : sessao ? <Formulario key={obterVersaoSessao()} sessao={sessao} /> : <>
      <Text style={s.texto}>Entre com uma conta fictícia cujo usuário comece com teste.</Text>
      <BotaoPrimario texto="Entrar" aoPressionar={() => navigation.navigate("Login")} />
    </>}
  </TelaComRolagem>;
}
function Formulario({ sessao }) {
  const [mensagem, setMensagem] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [confirmacao, setConfirmacao] = useState(null);
  const trava = useRef(false);
  const ativa = useRef(false);
  useFocusEffect(useCallback(() => { ativa.current = true; return () => { ativa.current = false; }; }, []));
  async function enviar() {
    if (trava.current || !confirmacao || obterSessao() !== sessao || !ativa.current) return;
    trava.current = true; setOcupado(true); setMensagem("");
    const modo = confirmacao; setConfirmacao(null);
    const vigente = () => ativa.current && obterSessao() === sessao;
    try {
      let dados = { latitude: -23.31, longitude: -51.16, origem: "simulada" };
      if (modo === "real") {
        const p = await Location.requestForegroundPermissionsAsync();
        if (!vigente()) return;
        if (p.status !== "granted") { setMensagem("Permissão negada. Use coordenadas simuladas se desejar."); return; }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!vigente()) return;
        dados = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, origem: "dispositivo_teste" };
      }
      if (!vigente()) return;
      const r = await enviarSos(dados);
      if (vigente()) setMensagem("Alerta de teste #" + r.id_alerta + " registrado na central simulada. Nenhum serviço real foi acionado.");
    } catch (e) {
      if (vigente()) setMensagem((e.message || "Falha no envio.") + " Se o envio ficou incerto, confira o painel antes de repetir.");
    } finally {
      trava.current = false;
      if (vigente()) setOcupado(false);
    }
  }
  return <>
    <View style={s.card}><Text style={s.titulo}>Aviso obrigatório</Text><Text style={s.texto}>Não é um serviço de emergência. Use somente conta fictícia e coordenadas simuladas ou a localização do seu próprio aparelho de teste. Nenhuma ligação ou mensagem real será enviada.</Text><Text style={s.texto}>Emergência real: 190. Orientação: 180.</Text></View>
    <Pressable disabled={ocupado} style={[s.botao, ocupado && s.desativado]} onPress={() => setConfirmacao("simulada")}><Text style={s.branco}>Testar com coordenadas simuladas</Text></Pressable>
    <Pressable disabled={ocupado} style={[s.botao, ocupado && s.desativado]} onPress={() => setConfirmacao("real")}><Text style={s.branco}>Usar localização do aparelho de teste</Text></Pressable>
    {confirmacao && !ocupado ? <View style={s.card}><Text style={s.titulo}>Confirmar envio acadêmico?</Text><Text style={s.texto}>{confirmacao === "real" ? "Sua localização atual será armazenada no banco local e exibida ao operador de demonstração. Use apenas seu próprio aparelho de teste." : "As coordenadas são fixas e simuladas, sem coleta de localização real."}</Text><BotaoPrimario texto="Confirmar alerta de teste" aoPressionar={enviar}/><BotaoPrimario texto="Cancelar" variante="claro" aoPressionar={() => setConfirmacao(null)}/></View> : null}
    {ocupado ? <Text style={s.texto}>Aguardando localização ou resposta da API...</Text> : null}
    {mensagem ? <Text accessibilityLiveRegion="polite" style={s.texto}>{mensagem}</Text> : null}
  </>;
}
const s = StyleSheet.create({ card:{padding:16,borderRadius:12,backgroundColor:cores.cartao,gap:10}, titulo:{fontWeight:"bold",fontSize:16,color:cores.textoEscuro}, texto:{color:cores.textoEscuro,lineHeight:21}, botao:{padding:14,borderRadius:10,backgroundColor:cores.primaria,alignItems:"center"}, branco:{color:"white",fontWeight:"bold"}, desativado:{opacity:.5} });
