
import { useState } from "react";
import { Pressable, Switch } from "react-native";
import { StyleSheet, TextInput, Text, View } from "react-native";
import { ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ModalConfirmacao from "../components/ModalConfirmacao";
import { perfilFicticio } from "../dados/dadosFicticios";
import cores from "../tema/cores";



export default function Perfil() {

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState(perfilFicticio.telefone_emergencia);
  const [modoDisfarce, setModoDisfarce] = useState(perfilFicticio.modo_disfarce);
  const [notificacoes, setNotificacoes] = useState(perfilFicticio.notificacoes);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);


  return (
    <ScrollView style={estilos.container} contentContainerStyle={estilos.conteudo}>
      <View style={estilos.avatar}>
        <Ionicons name="person-outline" size={36} color={cores.primaria} />
      </View>

      <View >
        <Text style={estilos.rotulo}>Nome (opcional)</Text>
        <TextInput
          style={estilos.input}
          placeholder="Seu nome ou apelido"
          value={nome}
          onChangeText={setNome}
        />
      </View>

      <View>
        <Text style={estilos.rotulo}>Telefone de emergência</Text>
        <TextInput
          style={estilos.input}
          placeholder="(00) 00000-0000"
          value={telefone}
          onChangeText={setTelefone}
        />
      </View>

      <View style={estilos.cardOpcao}>

        <View style={estilos.linhaOpcao}>
          <View>
            <Text style={estilos.tituloOpcao}>Modo disfarce</Text>
            <Text style={estilos.descricaoOpcao}>Abrir sempre no calendário</Text>
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
            <Text style={estilos.descricaoOpcao}>{perfilFicticio.tema}</Text>
          </View>
        </View>

        <View style={estilos.linhaOpcao}>
          <View>
            <Text style={estilos.tituloOpcao}>Notificação</Text>
            <Text style={estilos.descricaoOpcao}>Lembretes de período e ciclo</Text>
          </View>
          <Switch
            value={notificacoes}
            onValueChange={setNotificacoes}
            trackColor={{ true: cores.primaria }}
          />
        </View>

      </View>

      <Text style={estilos.subtitulo}>Modo disfarce e preferências</Text>
      <Text style={estilos.textoApoio}>
        Abra sempre no calendário. Destinatária do alerta simulado: Ana.
      </Text>

      <Pressable style={estilos.botaoSalvar}>
        <Text style={estilos.textoBotaoSalvar}>Salvar</Text>
      </Pressable>

      <Pressable style={estilos.botaoExcluir} onPress={() => setConfirmandoExclusao(true)}>
        <Text style={estilos.textoBotaoExcluir}>Excluir perfil</Text>
      </Pressable>

      <ModalConfirmacao
        visivel={confirmandoExclusao}
        titulo="Excluir perfil?"
        mensagem="O perfil será encerrado nesta demonstração."
        textoConfirmar="Confirmar exclusão"
        aoConfirmar={() => setConfirmandoExclusao(false)}
        aoCancelar={() => setConfirmandoExclusao(false)}
      />

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
});
