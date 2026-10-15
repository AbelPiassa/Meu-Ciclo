import { Pressable, StyleSheet, Text } from "react-native";
import cores from "../tema/cores";


export default function BotaoPrimario({ texto, aoPressionar, variante = "primario" }) {
  return (
    <Pressable style={[estilos.botao, estilos[variante]]} onPress={aoPressionar}>
      <Text style={[estilos.texto, estilos[`texto_${variante}`]]}>{texto}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  botao: {
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },

  primario: {
    backgroundColor: cores.primaria,
  },

  claro: {
    backgroundColor: cores.primariaClara,
  },

  contorno: {
    backgroundColor: "transparent",
    borderColor: cores.perigo,
  },

  texto: {
    fontWeight: "bold",
  },

  texto_primario: {
    color: "#ffffff",
  },

  texto_claro: {
    color: cores.primaria,
  },

  texto_contorno: {
    color: cores.perigo,
  },
});
