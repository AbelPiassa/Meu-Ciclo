import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import TelaComRolagem from "../components/TelaComRolagem";
import CampoTexto from "../components/CampoTexto";
import BotaoPrimario from "../components/BotaoPrimario";
import cores from "../tema/cores";
import { entrar } from "../services/perfil.js";

export default function Login({ navigation }) {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState("");
  const enviando = useRef(false);

  async function fazerLogin() {
    if (enviando.current) return;

    setMensagemErro("");

    if (!usuario.trim() || !senha) {
      setMensagemErro("Preencha o usuário e a senha.");
      return;
    }

    enviando.current = true;
    setCarregando(true);

    try {
      await entrar(usuario.trim(), senha);
      setSenha("");

      if (navigation.isFocused()) {
        navigation.replace("Fachada");
      }
    } catch (erro) {
      setMensagemErro(
        erro.status === 401
          ? "Usuário ou senha incorretos."
          : erro.message || "Não foi possível entrar."
      );
    } finally {
      enviando.current = false;
      setCarregando(false);
    }
  }

  return (
    <TelaComRolagem>
      <View style={estilos.cabecalho}>
        <Text style={estilos.nome}>Meu Ciclo</Text>
        <Text style={estilos.slogan}>Seu ciclo, no seu ritmo.</Text>
      </View>

      <Text style={estilos.titulo}>Bem-vinda de volta</Text>
      <Text style={estilos.subtitulo}>
        Entre para acompanhar seu calendário.
      </Text>

      <CampoTexto
        rotulo="Usuário"
        placeholder="Seu nome de usuário"
        valor={usuario}
        aoMudar={setUsuario}
      />

      <CampoTexto
        rotulo="Senha"
        placeholder="Sua senha"
        valor={senha}
        aoMudar={setSenha}
        senha
      />

      {mensagemErro ? (
        <Text style={{ color: cores.perigo }}>
          {mensagemErro}
        </Text>
      ) : null}

      <BotaoPrimario
        texto={carregando ? "Entrando..." : "Entrar"}
        aoPressionar={fazerLogin}
      />

      <Pressable
        disabled={carregando}
        onPress={() => navigation.navigate("Cadastro")}
      >
        <Text style={estilos.link}>
          Ainda não tem conta? Criar conta
        </Text>
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
