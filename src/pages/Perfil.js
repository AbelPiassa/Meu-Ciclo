
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
        <Text>Nome (opcional)</Text>
        <TextInput
          style={estilos.input}
          placeholder="Seu nome ou apelido"
          value={nome}
          onChangeText={setNome}
        />
      </View>

      <View>
        <Text>Telefone de emergência</Text>
        <TextInput
          style={estilos.input}
          placeholder="(00) 00000-0000"
          value={telefone}
          onChangeText={setTelefone}
        />
      </View>

      <View style={estilos.cardOpcao}>

        <View style={estilos.linhaOpcao}>

          <View style={estilos.textosOpcao}>
            <Text style={estilos.tituloOpcao}>Modo disfarce</Text>
            <Text style={estilos.descricaoOpcao}>Abrir sempre no calendário</Text>
            </View>
              <Switch
                value={modoDisfarce}
                onValueChange={setModoDisfarce}
                trackColor={{ false: "#D9D9D9", true: "#2F2F2F" }}
                thumbColor="#FFFFFF"
                activeThumbColor="#FFFFFF"
              />
          </View>
      </View>

      <View style={estilos.cardOpcao}>

        <View style={estilos.linhaOpcao}>
            <View style={estilos.textosOpcao}>
              <Text style={estilos.tituloOpcao}>Notificação</Text>
              <Text style={estilos.descricaoOpcao}>Lembretes de período e ciclo</Text>
              </View>
              <Switch
                value={notificacoes}
                onValueChange={setNotificacoes}
                trackColor={{ false: "#D9D9D9", true: "#2F2F2F" }}
                thumbColor="#ffffff"
                activeThumbColor="#FFFFFF"
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
    backgroundColor: "#FCF7F8",
    gap: 14,
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

  descricaoOpcao:{
    fontSize:14,
    lineHeight:18,
    color: "#64616E",
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
    borderRadius: 14,
    padding: 16,
    minHeight: 76,
    justifyContent: 'center'
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
    backgroundColor: "#A63270",
  },

  textoBotaoSalvar: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  textosOpcao: {
  flex: 1,
  gap: 3,
},
tituloOpcao: {
  fontSize: 18,
  lineHeight: 23,
  fontWeight: "bold",
  color: "#23152F",
},
descricaoOpcao: {
  fontSize: 14,
  lineHeight: 18,
  color: "#64616E",
},
});