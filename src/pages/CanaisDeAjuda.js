import { Alert, Linking, StyleSheet, Text } from "react-native";
import TelaComRolagem from "../components/TelaComRolagem";
import CartaoLista from "../components/CartaoLista";
import { canaisAjuda, redeLocalExemplo } from "../dados/dadosFicticios";
import cores from "../tema/cores";

export default function CanaisDeAjuda() {
  function abrirDiscador(numero) {
    const telefone = numero.replace(/\D/g, "");

    if (!["180", "190"].includes(telefone)) {
      return;
    }

    Alert.alert(
      "Abrir discador?",
      `O número ${telefone} será preenchido no telefone. Esta ação não realiza uma ligação automaticamente.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Abrir discador",
          onPress: async () => {
            try {
              await Linking.openURL(`tel:${telefone}`);
            } catch {
              Alert.alert(
                "Não foi possível abrir o discador",
                `Digite ${telefone} manualmente no aplicativo de telefone.`
              );
            }
          },
        },
      ]
    );
  }

  return (
    <TelaComRolagem titulo="Canais de Ajuda" subtitulo="Atendimento oficial no Brasil">
      {canaisAjuda.map((canal) => (
        <CartaoLista
          key={canal.numero}
          icone="call-outline"
          titulo={canal.numero}
          subtitulo={canal.descricao}
          aoPressionar={() => abrirDiscador(canal.numero)}
        />
      ))}

      <Text style={estilos.subtitulo}>Rede de apoio local</Text>

      {redeLocalExemplo.map((servico) => (
        <CartaoLista
          key={servico.nome}
          icone="location-outline"
          titulo={servico.nome}
          subtitulo={servico.descricao}
        />
      ))}

      <Text style={estilos.aviso}>
        Abrir o discador não realiza uma ligação automaticamente. Não efetue
        chamadas reais durante a demonstração acadêmica.
      </Text>
      <Text style={estilos.aviso}>
        Este aplicativo é um protótipo acadêmico e não substitui atendimento
        policial, jurídico, psicológico ou de saúde.
      </Text>
    </TelaComRolagem>
  );
}

const estilos = StyleSheet.create({
  subtitulo: {
    fontSize: 17,
    fontWeight: "bold",
    color: cores.textoEscuro,
    marginTop: 6,
  },

  aviso: {
    fontSize: 12,
    color: cores.textoSuave,
  },
});
