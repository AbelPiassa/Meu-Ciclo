import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { consultarPerfil } from "../services/perfil.js";
import cores from "../tema/cores";

export default function Perfil() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [modoDisfarce, setModoDisfarce] = useState(true);
  const [notificacoes, setNotificacoes] = useState(false);
  const [tema, setTema] = useState("Claro");
  const [carregando, setCarregando] = useState(true);
  const [mensagemErro, setMensagemErro] = useState("");
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;

    async function carregarPerfil() {
      setCarregando(true);
      setMensagemErro("");

      try {
        const perfil = await consultarPerfil();

        if (!ativo) return;

        setNome(perfil.nome ?? "");
        setTelefone(perfil.telefone_emergencia ?? "");
        setModoDisfarce(perfil.modo_disfarce);
        setNotificacoes(perfil.notificacoes);
        setTema(perfil.tema);
      } catch (erro) {
        if (!ativo) return;

        setMensagemErro(
          erro.status === 401
            ? "Entre na sua conta em Configurações → Minha conta."
            : erro.message || "Não foi possível carregar o perfil."
        );
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarPerfil();

    return () => {
      ativo = false;
    };
  }, [tentativa]);

  if (carregando) {
    return (
      <ScrollView
        style={estilos.container}
        contentContainerStyle={estilos.conteudo}
      >
        <Text style={estilos.textoApoio}>Carregando perfil...</Text>
      </ScrollView>
    );
  }

  if (mensagemErro) {
    return (
      <ScrollView
        style={estilos.container}
        contentContainerStyle={estilos.conteudo}
      >
        <Text style={estilos.textoApoio}>{mensagemErro}</Text>

        <Pressable
          style={estilos.botaoSalvar}
          onPress={() => setTentativa((valor) => valor + 1)}
        >
          <Text style={estilos.textoBotaoSalvar}>
            Tentar novamente
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={estilos.container}
      contentContainerStyle={estilos.conteudo}
    >
      <View style={estilos.avatar}>
        <Ionicons
          name="person-outline"
          size={36}
          color={cores.primaria}
        />
      </View>

      <View>
        <Text style={estilos.rotulo}>Nome (opcional)</Text>
        <TextInput
          style={estilos.input}
          placeholder="Seu nome ou apelido"
          value={nome}
          onChangeText={setNome}
          maxLength={100}
        />
      </View>

      <View>
        <Text style={estilos.rotulo}>Telefone de emergência</Text>
        <TextInput
          style={estilos.input}
          placeholder="(00) 00000-0000"
          value={telefone}
          onChangeText={setTelefone}
          keyboardType="phone-pad"
        />
      </View>

      <View style={estilos.cardOpcao}>
        <View style={estilos.linhaOpcao}>
          <View>
            <Text style={estilos.tituloOpcao}>Modo disfarce</Text>
            <Text style={estilos.descricaoOpcao}>
              Abrir sempre no calendário
            </Text>
          </View>

          <Switch
            value={modoDisfarce}
            onValueChange={setModoDisfarce}
            trackColor={{ true: cores.primaria }}
          />
        </View>

        <View style={estilos.linhaOpcao}>
          <View>
            <Text style={estilos.tituloOpcao}>Tema</Text>
            <Text style={estilos.descricaoOpcao}>{tema}</Text>
          </View>
        </View>

        <View style={estilos.linhaOpcao}>
          <View>
            <Text style={estilos.tituloOpcao}>Notificação</Text>
            <Text style={estilos.descricaoOpcao}>
              Lembretes de período e ciclo
            </Text>
          </View>

          <Switch
            value={notificacoes}
            onValueChange={setNotificacoes}
            trackColor={{ true: cores.primaria }}
          />
        </View>
      </View>

      <Text style={estilos.subtitulo}>
        Modo disfarce e preferências
      </Text>

      <Text style={estilos.textoApoio}>
        As preferências abaixo pertencem à sua conta.
        Alterações ainda não serão salvas nesta etapa.
      </Text>

      <Pressable
        style={[estilos.botaoSalvar, estilos.botaoDesativado]}
        disabled
      >
        <Text style={estilos.textoBotaoSalvar}>
          Salvar — em integração
        </Text>
      </Pressable>

      <Pressable
        style={[estilos.botaoExcluir, estilos.botaoDesativado]}
        disabled
      >
        <Text style={estilos.textoBotaoExcluir}>
          Excluir perfil — em integração
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },

  conteudo: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },

  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: cores.primariaClara,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },

  rotulo: {
    fontSize: 13,
    color: cores.textoEscuro,
    marginBottom: 6,
  },

  input: {
    width: "100%",
    height: 42,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "#f6eaee",
  },

  cardOpcao: {
    backgroundColor: cores.cartao,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: cores.borda,
    gap: 14,
  },

  linhaOpcao: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  tituloOpcao: {
    fontSize: 15,
    fontWeight: "bold",
    color: cores.textoEscuro,
  },

  descricaoOpcao: {
    fontSize: 12,
    color: cores.textoSuave,
  },

  subtitulo: {
    fontSize: 17,
    fontWeight: "bold",
    color: cores.textoEscuro,
  },

  textoApoio: {
    fontSize: 13,
    color: cores.textoEscuro,
  },

  botaoSalvar: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: cores.primaria,
    alignItems: "center",
  },

  textoBotaoSalvar: {
    color: "#ffffff",
    fontWeight: "bold",
  },

  botaoExcluir: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: cores.primariaClara,
    alignItems: "center",
  },

  textoBotaoExcluir: {
    color: cores.primaria,
    fontWeight: "bold",
  },

  botaoDesativado: {
    opacity: 0.5,
  },
});