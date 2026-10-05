
import { useState } from "react";
import { Pressable, Switch } from "react-native";
import { StyleSheet, TextInput, Text, View } from "react-native";



export default function Perfil() {

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [modoDisfarce, setModoDisfarce] = useState(false);
  const [notificacoes, setNotificacoes] = useState(false);


  return (
    <View style={estilos.container}>
      <View style={estilos.header}>
        <Text style={estilos.titulo}>Meu Perfil</Text>
      </View>

      <View >
        <Text>Nome</Text>
        <TextInput
          style={estilos.input}
          value={nome}
          onChangeText={setNome}
        />
      </View>

      <View>
        <Text>Telefone  </Text>
        <TextInput
          style={estilos.input}
          value={telefone}
          onChangeText={setTelefone}
        />
      </View>

      <View style={estilos.cardOpcao}>

        <View style={estilos.linhaOpcao}>
          <Text>Modo disfarce</Text>
          <Switch
            value={modoDisfarce}
            onValueChange={setModoDisfarce}
          />
        </View>

        <View style={estilos.linhaOpcao}>
          <Text >Notificação</Text>
          <Switch
            value={notificacoes}
            onValueChange={setNotificacoes}
          />
        </View>

      </View>

      <Pressable style={estilos.botaoSalvar}>
        <Text style={estilos.textoBotaoSalvar}>Salvar</Text>
      </Pressable>

    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
    gap: 16,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  titulo: {
    fontSize: 24,
    fontWeight: "bold",
  },

  input: {
    width: "100%",
    height: 40,
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
  },

  cardOpcao: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },

  linhaOpcao: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  botaoSalvar: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#d96a98",
  },

  textoBotaoSalvar: {
    color: "#ffffff",
    fontWeight: "bold",
  },
});