import { Pressable, StyleSheet, Text, View } from "react-native";
import TelaComRolagem from "../components/TelaComRolagem";
import useGatilhoTresToques from "../hooks/useGatilhoTresToques";
import cores from "../tema/cores";


export default function Sobre({ navigation }) {
  const registrarToque = useGatilhoTresToques(() => navigation.replace("AreaProtegida"));

  return (
    <TelaComRolagem>
      <View style={estilos.cabecalho}>
        <Text style={estilos.nome}>Meu Ciclo</Text>
        <Pressable onPress={registrarToque} hitSlop={20}>
          <Text style={estilos.versao}>Versão 1.0.0</Text>
          <Text style={estilos.versao}>Aplicativo de bem-estar feminino</Text>
        </Pressable>
      </View>
    </TelaComRolagem>
  );
}

const estilos = StyleSheet.create({
  cabecalho: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },

  nome: {
    fontSize: 26,
    color: cores.textoEscuro,
  },

  versao: {
    fontSize: 14,
    textAlign: "center",
    color: cores.textoEscuro,
  },
});
