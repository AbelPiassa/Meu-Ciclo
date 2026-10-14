import { ScrollView, StyleSheet, Text } from "react-native";
import cores from "../tema/cores";


export default function TelaComRolagem({ titulo, subtitulo, children }) {
  return (
    <ScrollView style={estilos.container} contentContainerStyle={estilos.conteudo}>
      {titulo ? <Text style={estilos.titulo}>{titulo}</Text> : null}
      {subtitulo ? <Text style={estilos.subtitulo}>{subtitulo}</Text> : null}
      {children}
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
    gap: 14,
  },

  titulo: {
    fontSize: 26,
    fontWeight: "bold",
    color: cores.textoEscuro,
  },

  subtitulo: {
    fontSize: 14,
    color: cores.textoEscuro,
  },
});
