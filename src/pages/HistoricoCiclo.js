import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import TelaComRolagem from "../components/TelaComRolagem";
import CartaoLista from "../components/CartaoLista";
import CampoTexto from "../components/CampoTexto";
import BotaoPrimario from "../components/BotaoPrimario";
import ModalConfirmacao from "../components/ModalConfirmacao";
import { ciclosFicticios } from "../dados/dadosFicticios";
import cores from "../tema/cores";

const NIVEIS_FLUXO = ["Leve", "Moderado", "Intenso"];

export default function HistoricoCiclo() {
  const [ciclos, setCiclos] = useState(ciclosFicticios);
  const [cicloSelecionado, setCicloSelecionado] = useState(ciclosFicticios[0]);
  const [dataInicio, setDataInicio] = useState(ciclosFicticios[0].data_inicio);
  const [duracao, setDuracao] = useState("5");
  const [fluxo, setFluxo] = useState(ciclosFicticios[0].fluxo);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  function selecionarCiclo(ciclo) {
    setCicloSelecionado(ciclo);
    setDataInicio(ciclo.data_inicio);
    setFluxo(ciclo.fluxo);
  }

  function solicitarExclusao() {
    if (cicloSelecionado == null) {
      return;
    }

    setConfirmandoExclusao(true);
  }

  function excluirRegistro() {
    if (cicloSelecionado == null) {
      setConfirmandoExclusao(false);
      return;
    }

    setCiclos((listaAtual) =>
      listaAtual.filter((ciclo) => ciclo.id_ciclo !== cicloSelecionado.id_ciclo)
    );

    setCicloSelecionado(null);
    setDataInicio("");
    setDuracao("");
    setFluxo("Moderado");
    setConfirmandoExclusao(false);
  }

  return (
    <TelaComRolagem titulo="Histórico">
      {ciclos.length === 0 ? (
        <Text style={estilos.rotulo}>Nenhum registro menstrual nesta demonstração.</Text>
      ) : null}

      {ciclos.map((ciclo) => (
        <CartaoLista
          key={ciclo.id_ciclo}
          icone="water-outline"
          titulo={`${ciclo.data_inicio} a ${ciclo.data_fim}`}
          subtitulo={`Fluxo ${ciclo.fluxo.toLowerCase()}${ciclo.sintomas ? ` • ${ciclo.sintomas}` : ""}`}
          selecionado={ciclo.id_ciclo === cicloSelecionado?.id_ciclo}
          aoPressionar={() => selecionarCiclo(ciclo)}
        />
      ))}

      <Text style={estilos.subtitulo}>Adicionar ou editar registro</Text>

      <CampoTexto rotulo="Data de início" valor={dataInicio} aoMudar={setDataInicio} />
      <CampoTexto rotulo="Duração (dias)" valor={duracao} aoMudar={setDuracao} />

      <Text style={estilos.rotulo}>Fluxo</Text>
      <View style={estilos.linhaFluxo}>
        {NIVEIS_FLUXO.map((nivel) => (
          <Pressable
            key={nivel}
            style={[estilos.opcaoFluxo, fluxo === nivel && estilos.opcaoFluxoAtiva]}
            onPress={() => setFluxo(nivel)}
          >
            <Text style={[estilos.textoFluxo, fluxo === nivel && estilos.textoFluxoAtivo]}>
              {nivel}
            </Text>
          </Pressable>
        ))}
      </View>

      <BotaoPrimario texto="Salvar registro" />
      <BotaoPrimario
        texto="Excluir registro selecionado"
        variante="claro"
        aoPressionar={solicitarExclusao}
      />

      <ModalConfirmacao
        visivel={confirmandoExclusao}
        titulo="Excluir registro?"
        mensagem="O registro menstrual selecionado será removido."
        textoConfirmar="Confirmar exclusão"
        aoConfirmar={excluirRegistro}
        aoCancelar={() => setConfirmandoExclusao(false)}
      />
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

  rotulo: {
    fontSize: 13,
    color: cores.textoEscuro,
  },

  linhaFluxo: {
    flexDirection: "row",
    gap: 10,
  },

  opcaoFluxo: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: cores.cartao,
    borderWidth: 1,
    borderColor: cores.borda,
  },

  opcaoFluxoAtiva: {
    backgroundColor: cores.primariaClara,
    borderColor: cores.primaria,
  },

  textoFluxo: {
    fontSize: 13,
    color: cores.textoEscuro,
  },

  textoFluxoAtivo: {
    fontWeight: "bold",
    color: cores.primaria,
  },
});
