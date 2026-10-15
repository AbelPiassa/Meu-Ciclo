import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import cores from "../tema/cores";

export default function ModalConfirmacao({
  visivel,
  titulo,
  mensagem,
  textoConfirmar,
  aoConfirmar,
  aoCancelar,
}) {
  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={aoCancelar}>
      <View style={estilos.fundo}>
        <View style={estilos.caixa}>
          <Text style={estilos.titulo}>{titulo}</Text>
          <Text style={estilos.mensagem}>{mensagem}</Text>

          <Pressable style={estilos.botaoConfirmar} onPress={aoConfirmar}>
            <Text style={estilos.textoConfirmar}>{textoConfirmar}</Text>
          </Pressable>

          <Pressable style={estilos.botaoCancelar} onPress={aoCancelar}>
            <Text style={estilos.textoCancelar}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: "rgba(43, 27, 61, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  caixa: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: cores.cartao,
    borderRadius: 18,
    padding: 20,
    gap: 12,
  },

  titulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: cores.textoEscuro,
  },

  mensagem: {
    fontSize: 14,
    color: cores.textoEscuro,
  },

  botaoConfirmar: {
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: cores.perigo,
    alignItems: "center",
  },

  textoConfirmar: {
    color: "#ffffff",
    fontWeight: "bold",
  },

  botaoCancelar: {
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: cores.primariaClara,
    alignItems: "center",
  },

  textoCancelar: {
    color: cores.primaria,
    fontWeight: "bold",
  },
});
