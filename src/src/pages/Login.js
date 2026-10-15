import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import TelaComRolagem from "../components/TelaComRolagem";
import CampoTexto from "../components/CampoTexto";
import BotaoPrimario from "../components/BotaoPrimario";
import cores from "../tema/cores";

export default function Login({ navigation }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  return (
    <TelaComRolagem>
      <View style={estilos.cabecalho}>
        <Text style={estilos.nome}>Meu Ciclo</Text>
        <Text style={estilos.slogan}>Seu ciclo, no seu ritmo.</Text>
      </View>

      <Text style={estilos.titulo}>Bem-vinda de volta</Text>
      <Text style={estilos.subtitulo}>Entre para acompanhar seu calendário.</Text>

      <CampoTexto rotulo="E-mail" placeholder="ana@exemplo.com" valor={email} aoMudar={setEmail} />
      <CampoTexto rotulo="Senha" placeholder="********" valor={senha} aoMudar={setSenha} senha />

      <BotaoPrimario texto="Entrar" aoPressionar={() => navigation.replace("Fachada")} />

      <Pressable onPress={() => navigation.navigate("Cadastro")}>
        <Text style={estilos.link}>Ainda não tem conta? Criar conta</Text>
      </Pressable>
    </TelaComRolagem>
  );
}

const estilos = StyleSheet.create({
  cabecalho: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 24,
  },

  nome: {
    fontSize: 32,
    fontWeight: "bold",
    color: cores.primaria,
  },

  slogan: {
    fontSize: 14,
    color: cores.textoEscuro,
  },

  titulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: cores.textoEscuro,
  },

  subtitulo: {
    fontSize: 14,
    color: cores.textoEscuro,
  },

  link: {
    textAlign: "center",
    color: cores.primaria,
    fontSize: 13,
  },
});
