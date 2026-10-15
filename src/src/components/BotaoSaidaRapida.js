import { Pressable, StyleSheet, Text } from "react-native";
import useSaidaRapida from "../hooks/useSaidaRapida";
import cores from "../tema/cores";

export default function BotaoSaidaRapida() {
  const sairRapido = useSaidaRapida();

  return (
    <Pressable onPress={sairRapido} style={estilos.botao}>
      <Text style={estilos.textoBotao}>Sair</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  botao: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: cores.primaria,
  },

  textoBotao: {
    color: "#ffffff",
    fontWeight: "bold",
  },
});
