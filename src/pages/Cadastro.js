import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import TelaComRolagem from "../components/TelaComRolagem";
import CampoTexto from "../components/CampoTexto";
import BotaoPrimario from "../components/BotaoPrimario";
import cores from "../tema/cores";

export default function Cadastro({ navigation }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  return (
    <TelaComRolagem>
      <View style={estilos.cabecalho}>
        <Text style={estilos.nome}>Meu Ciclo</Text>
        <Text style={estilos.slogan}>Seu ciclo, no seu ritmo.</Text>
      </View>

      <Text style={estilos.titulo}>Crie sua conta</Text>
      <Text style={estilos.subtitulo}>Preencha seus dados para começar.</Text>

      <CampoTexto rotulo="Nome" placeholder="Ana Silva" valor={nome} aoMudar={setNome} />
      <CampoTexto rotulo="E-mail" placeholder="ana@exemplo.com" valor={email} aoMudar={setEmail} />
      <CampoTexto rotulo="Senha" placeholder="********" valor={senha} aoMudar={setSenha} senha />
      <CampoTexto
        rotulo="Confirmar senha"
        placeholder="********"
        valor={confirmarSenha}
        aoMudar={setConfirmarSenha}
        senha
      />

      <BotaoPrimario texto="Criar conta" aoPressionar={() => navigation.replace("Fachada")} />

      <Pressable onPress={() => navigation.navigate("Login")}>
        <Text style={estilos.link}>Já tenho conta · Entrar</Text>
      </Pressable>
    </TelaComRolagem>
  );
}

const estilos = StyleSheet.create({
  cabecalho: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
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
