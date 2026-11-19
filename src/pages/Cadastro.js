import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import TelaComRolagem from "../components/TelaComRolagem";
import CampoTexto from "../components/CampoTexto";
import BotaoPrimario from "../components/BotaoPrimario";
import cores from "../tema/cores";
import { cadastrarPerfil } from "../services/perfil.js";

export default function Cadastro({ navigation }) {
  const [nome, setNome] = useState("");
  const [usuario, setUsuario] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState("");
  const enviando = useRef(false);

  async function fazerCadastro() {
    if (enviando.current) return;

    setMensagemErro("");

    const usuarioLimpo = usuario.trim();
    const telefoneLimpo = telefone.replace(/\D/g, "");

    if (!/^[a-zA-Z0-9._-]{3,60}$/.test(usuarioLimpo)) {
      setMensagemErro(
        "Use um usuário de 3 a 60 caracteres: letras sem acentos, números, ponto, hífen ou sublinhado."
      );
      return;
    }

    if (!/^\d{10,11}$/.test(telefoneLimpo)) {
      setMensagemErro("Informe um telefone com DDD, com 10 ou 11 dígitos.");
      return;
    }

    if (senha.length < 12 || senha.length > 128) {
      setMensagemErro("A senha deve ter entre 12 e 128 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setMensagemErro("As senhas não coincidem.");
      return;
    }

    enviando.current = true;
    setCarregando(true);

    try {
      await cadastrarPerfil({
        usuario: usuarioLimpo,
        senha,
        nome: nome.trim(),
        telefone_emergencia: telefoneLimpo,
        modo_disfarce: true,
        notificacoes: false,
        tema: "Claro",
      });

      setSenha("");
      setConfirmarSenha("");

      if (navigation.isFocused()) {
        navigation.replace("Fachada");
      }
    } catch (erro) {
      setMensagemErro(
        erro.status === 409
          ? "Esse usuário já existe. Escolha outro."
          : erro.message || "Não foi possível criar a conta."
      );
    } finally {
      enviando.current = false;
      setCarregando(false);
    }
  }

  return (
    <TelaComRolagem>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voltar à tela anterior"
        disabled={carregando}
        onPress={() => {
          if (enviando.current) return;
          setSenha("");
          setConfirmarSenha("");
          setMensagemErro("");
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.replace("Fachada");
          }
        }}
        style={estilos.voltar}
      >
        <Text style={estilos.textoVoltar}>← Voltar</Text>
      </Pressable>
      <View style={estilos.cabecalho}>
        <Text style={estilos.nome}>Meu Ciclo</Text>
        <Text style={estilos.slogan}>Seu ciclo, no seu ritmo.</Text>
      </View>

      <Text style={estilos.titulo}>Crie sua conta</Text>
      <Text style={estilos.subtitulo}>
        Preencha seus dados para começar.
      </Text>

      <CampoTexto
        rotulo="Nome (opcional)"
        placeholder="Seu nome ou apelido"
        valor={nome}
        aoMudar={setNome}
        limiteCaracteres={100}
      />

      <CampoTexto
        rotulo="Usuário"
        placeholder="Escolha um nome de usuário"
        valor={usuario}
        aoMudar={setUsuario}
        limiteCaracteres={60}
      />

      <CampoTexto
        rotulo="Telefone de contato"
        placeholder="(00) 00000-0000"
        valor={telefone}
        aoMudar={setTelefone}
        teclado="phone-pad"
      />

      <CampoTexto
        rotulo="Senha"
        placeholder="Pelo menos 12 caracteres"
        valor={senha}
        aoMudar={setSenha}
        senha
        limiteCaracteres={128}
      />

      <CampoTexto
        rotulo="Confirmar senha"
        placeholder="Repita sua senha"
        valor={confirmarSenha}
        aoMudar={setConfirmarSenha}
        senha
        limiteCaracteres={128}
      />

      {mensagemErro ? (
        <Text style={{ color: cores.perigo }}>
          {mensagemErro}
        </Text>
      ) : null}

      <BotaoPrimario
        texto={carregando ? "Criando conta..." : "Criar conta"}
        aoPressionar={fazerCadastro}
      />

      <Pressable
        disabled={carregando}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={estilos.link}>Já tenho conta · Entrar</Text>
      </Pressable>
    </TelaComRolagem>
  );
}

const estilos = StyleSheet.create({
  voltar: {
    alignSelf: "flex-start",
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  textoVoltar: {
    color: cores.primaria,
    fontSize: 16,
  },
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
