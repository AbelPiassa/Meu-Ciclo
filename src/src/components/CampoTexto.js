import { StyleSheet, Text, TextInput, View } from "react-native";
import cores from "../tema/cores";

export default function CampoTexto({ rotulo, placeholder, valor, aoMudar, senha }) {
  return (
    <View style={estilos.grupo}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <TextInput
        style={estilos.input}
        placeholder={placeholder}
        placeholderTextColor="#9a93a3"
        value={valor}
        onChangeText={aoMudar}
        secureTextEntry={senha}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: {
    gap: 6,
  },

  rotulo: {
    fontSize: 13,
    color: cores.textoEscuro,
  },

  input: {
    height: 42,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "#f6eaee",
    color: cores.textoEscuro,
  },
});
