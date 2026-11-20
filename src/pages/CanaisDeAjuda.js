import { useState } from "react";
import { Linking, StyleSheet, Text } from "react-native";
import TelaComRolagem from "../components/TelaComRolagem";
import CartaoLista from "../components/CartaoLista";
import { canaisAjuda, redeLocalExemplo } from "../dados/dadosFicticios";
import { enderecoDoDiscador, numeroDoCanal } from "../utils/canaisAjuda";
import cores from "../tema/cores";

export default function CanaisDeAjuda() {
  const [aviso, setAviso] = useState("");

  // Abre o discador com o número preenchido. Não realiza a chamada: quem decide ligar é a pessoa.
  async function abrirDiscador(canal) {
    const numero = numeroDoCanal(canal);

    if (!numero) {
      return;
    }

    setAviso("");

    try {
      await Linking.openURL(enderecoDoDiscador(canal));
    } catch {
      setAviso(`Não foi possível abrir o discador neste aparelho. Disque ${numero} manualmente.`);
    }
  }

  return (
    <TelaComRolagem titulo="Canais de Ajuda" subtitulo="Atendimento oficial no Brasil">
      {canaisAjuda.map((canal) => (
        <CartaoLista
          key={canal.numero}
          icone="call-outline"
          titulo={canal.numero}
          subtitulo={`${canal.descricao} • toque para abrir o discador`}
          aoPressionar={() => abrirDiscador(canal)}
        />
      ))}

      {aviso ? <Text style={estilos.erro}>{aviso}</Text> : null}

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

  erro: {
    fontSize: 13,
    color: cores.perigo,
  },
});
