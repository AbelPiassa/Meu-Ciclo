import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import cores from "../tema/cores";


export default function CartaoLista({ icone, titulo, subtitulo, aoPressionar, direita, selecionado }) {
  return (
    <Pressable
      onPress={aoPressionar}
      style={[estilos.cartao, selecionado && estilos.cartaoSelecionado]}
    >
      <View style={estilos.circuloIcone}>
        <Ionicons name={icone} size={18} color={cores.primaria} />
      </View>

      <View style={estilos.textos}>
        <Text style={estilos.titulo}>{titulo}</Text>
        {subtitulo ? <Text style={estilos.subtitulo}>{subtitulo}</Text> : null}
      </View>

      {direita ??
        (aoPressionar ? (
          <Ionicons name="chevron-forward" size={18} color={cores.textoSuave} />
        ) : null)}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: cores.cartao,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: cores.borda,
  },

  cartaoSelecionado: {
    borderColor: cores.primaria,
  },

  circuloIcone: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: cores.primariaClara,
    alignItems: "center",
    justifyContent: "center",
  },

  textos: {
    flex: 1,
  },

  titulo: {
    fontSize: 15,
    fontWeight: "bold",
    color: cores.textoEscuro,
  },

  subtitulo: {
    fontSize: 12,
    color: cores.textoSuave,
  },
});
