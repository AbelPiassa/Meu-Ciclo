import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TelaComRolagem from "../components/TelaComRolagem";
import CartaoLista from "../components/CartaoLista";
import CampoTexto from "../components/CampoTexto";
import BotaoPrimario from "../components/BotaoPrimario";
import ModalConfirmacao from "../components/ModalConfirmacao";
import { ocorrenciasFicticias, canaisAjuda } from "../dados/dadosFicticios";
import cores from "../tema/cores";

export default function DiarioOcorrencias() {
  const [ocorrenciaSelecionada, setOcorrenciaSelecionada] = useState(ocorrenciasFicticias[0]);
  const [data, setData] = useState(ocorrenciasFicticias[0].data_ocorrencia);
  const [descricao, setDescricao] = useState("");
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  function selecionarOcorrencia(ocorrencia) {
    setOcorrenciaSelecionada(ocorrencia);
    setData(ocorrencia.data_ocorrencia);
  }

  return (
    <TelaComRolagem>
      <View style={estilos.linhaTitulo}>
        <Text style={estilos.titulo}>Diário e ajuda</Text>
        <Pressable style={estilos.botaoMais}>
          <Ionicons name="add" size={22} color="#ffffff" />
        </Pressable>
      </View>

      {ocorrenciasFicticias.map((ocorrencia) => (
        <CartaoLista
          key={ocorrencia.id_ocorrencia}
          icone="document-text-outline"
          titulo={`${ocorrencia.data_ocorrencia} • ${ocorrencia.tipo_ocorrencia}`}
          subtitulo={ocorrencia.descricao_relato}
          selecionado={ocorrencia.id_ocorrencia === ocorrenciaSelecionada?.id_ocorrencia}
          aoPressionar={() => selecionarOcorrencia(ocorrencia)}
        />
      ))}

      <Text style={estilos.subtitulo}>Adicionar ou editar ocorrência</Text>

      <CampoTexto rotulo="Data" valor={data} aoMudar={setData} />
      <CampoTexto
        rotulo="Descrição"
        placeholder="Descreva o que aconteceu..."
        valor={descricao}
        aoMudar={setDescricao}
      />

      <BotaoPrimario texto="Salvar ocorrência" />
      <BotaoPrimario
        texto="Excluir ocorrência selecionada"
        variante="claro"
        aoPressionar={() => setConfirmandoExclusao(true)}
      />

      <Text style={estilos.subtitulo}>Ajuda • canais de apoio</Text>

      {canaisAjuda.map((canal) => (
        <CartaoLista
          key={canal.numero}
          icone="call-outline"
          titulo={canal.numero}
          subtitulo={canal.descricao}
          aoPressionar={() => {}}
        />
      ))}

      <ModalConfirmacao
        visivel={confirmandoExclusao}
        titulo="Excluir ocorrência?"
        mensagem="O relato selecionado será removido do diário."
        textoConfirmar="Confirmar exclusão"
        aoConfirmar={() => setConfirmandoExclusao(false)}
        aoCancelar={() => setConfirmandoExclusao(false)}
      />
    </TelaComRolagem>
  );
}

const estilos = StyleSheet.create({
  linhaTitulo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: cores.textoEscuro,
  },

  botaoMais: {
    width: 44,
    height: 36,
    borderRadius: 10,
    backgroundColor: cores.primaria,
    alignItems: "center",
    justifyContent: "center",
  },

  subtitulo: {
    fontSize: 17,
    fontWeight: "bold",
    color: cores.textoEscuro,
    marginTop: 6,
  },
});
