import { StyleSheet, Text } from "react-native";
import TelaComRolagem from "../components/TelaComRolagem";
import CartaoLista from "../components/CartaoLista";
import { canaisAjuda, redeLocalExemplo } from "../dados/dadosFicticios";
import cores from "../tema/cores";

export default function CanaisDeAjuda() {
  return (
    <TelaComRolagem titulo="Canais de Ajuda" subtitulo="Atendimento oficial no Brasil">
      {canaisAjuda.map((canal) => (
        <CartaoLista
          key={canal.numero}
          icone="call-outline"
          titulo={canal.numero}
          subtitulo={canal.descricao}
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
        Este aplicativo é um protótipo acadêmico e não substitui atendimento policial, jurídico, psicológico ou de saúde.
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
