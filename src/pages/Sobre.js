import { StyleSheet, Text, View } from "react-native";
import TelaComRolagem from "../components/TelaComRolagem";
import CartaoLista from "../components/CartaoLista";
import cores from "../tema/cores";

export default function Sobre() {
  return (
    <TelaComRolagem>
      <View style={estilos.cabecalho}>
        <Text style={estilos.nome}>Meu Ciclo</Text>
        <View>
          <Text style={estilos.versao}>Versão 1.0.0</Text>
          <Text style={estilos.versao}>Aplicativo de bem-estar feminino</Text>
        </View>
      </View>

      <CartaoLista
        icone="information-circle-outline"
        titulo="Termos de uso"
        subtitulo="Informações do aplicativo"
        aoPressionar={() => {}}
      />
      <CartaoLista
        icone="information-circle-outline"
        titulo="Política de privacidade"
        subtitulo="Informações do aplicativo"
        aoPressionar={() => {}}
      />
      <CartaoLista
        icone="information-circle-outline"
        titulo="Licenças"
        subtitulo="Informações do aplicativo"
        aoPressionar={() => {}}
      />
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
