import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import TelaComRolagem from "../components/TelaComRolagem";
import CartaoLista from "../components/CartaoLista";
import CampoTexto from "../components/CampoTexto";
import BotaoPrimario from "../components/BotaoPrimario";
import ModalConfirmacao from "../components/ModalConfirmacao";
import { useCiclos } from "../contextos/CiclosContext";
import {
  dataParaTexto,
  dataValida,
  diasEntre,
  formatarData,
  somarDias,
  textoParaData,
} from "../utils/datas";
import cores from "../tema/cores";

const NIVEIS_FLUXO = ["Leve", "Moderado", "Intenso"];
const DURACAO_MAXIMA = 14;

function duracaoDoCiclo(ciclo) {
  if (!ciclo.data_fim) {
    return "";
  }

  return String(diasEntre(textoParaData(ciclo.data_inicio), textoParaData(ciclo.data_fim)) + 1);
}

export default function HistoricoCiclo({ route }) {
  const { ciclos, logado, carregando, erro: erroCarga, recarregar, cadastrarCiclo, atualizarCiclo, excluirCiclo } =
    useCiclos();

  const [idSelecionado, setIdSelecionado] = useState(ciclos[0]?.id_ciclo ?? null);
  const [dataSugerida, setDataSugerida] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [duracao, setDuracao] = useState("5");
  const [fluxo, setFluxo] = useState("Moderado");
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const cicloSelecionado = ciclos.find((ciclo) => ciclo.id_ciclo === idSelecionado) ?? null;

  // Preenche o formulário quando o registro selecionado muda (ou limpa, se for um registro novo)
  useEffect(() => {
    if (cicloSelecionado) {
      setDataInicio(cicloSelecionado.data_inicio);
      setDuracao(duracaoDoCiclo(cicloSelecionado));
      setFluxo(cicloSelecionado.fluxo);
    } else {
      setDataInicio(dataSugerida);
      setDuracao("5");
      setFluxo("Moderado");
    }
  }, [idSelecionado, dataSugerida]);

  // Quando o Calendário abre o Histórico por "Adicionar registro", começa um registro novo com a data do dia
  useEffect(() => {
    const novaData = route?.params?.novaData;

    if (novaData) {
      setIdSelecionado(null);
      setDataSugerida(novaData);
      setDataInicio(novaData);
      setMensagem("");
      setErro(false);
    }
  }, [route?.params]);

  function avisar(texto, ehErro) {
    setMensagem(texto);
    setErro(ehErro);
  }

  function selecionarCiclo(ciclo) {
    avisar("", false);
    setIdSelecionado(ciclo.id_ciclo);
  }

  function novoRegistro() {
    avisar("", false);
    setDataSugerida("");
    setIdSelecionado(null);
  }

  function validarFormulario() {
    if (!dataInicio.trim() || !duracao.trim()) {
      avisar("Preencha a data de início e a duração.", true);
      return false;
    }

    if (!dataValida(dataInicio)) {
      avisar("Informe uma data válida no formato DD/MM/AAAA.", true);
      return false;
    }

    const dias = Number(duracao);

    if (!Number.isInteger(dias) || dias < 1 || dias > DURACAO_MAXIMA) {
      avisar(`A duração deve ser de 1 a ${DURACAO_MAXIMA} dias.`, true);
      return false;
    }

    const repetido = ciclos.some(
      (ciclo) => ciclo.data_inicio === dataInicio && ciclo.id_ciclo !== idSelecionado
    );

    if (repetido) {
      avisar("Já existe um registro com essa data de início.", true);
      return false;
    }

    return true;
  }

  async function salvarRegistro() {
    if (salvando || !validarFormulario()) {
      return;
    }

    const dados = {
      data_inicio: dataInicio,
      data_fim: dataParaTexto(somarDias(textoParaData(dataInicio), Number(duracao) - 1)),
      fluxo,
    };

    setSalvando(true);

    try {
      if (cicloSelecionado === null) {
        const novo = await cadastrarCiclo(dados);
        setIdSelecionado(novo.id_ciclo);
        avisar("Registro cadastrado.", false);
      } else {
        await atualizarCiclo(cicloSelecionado.id_ciclo, dados);
        avisar("Registro atualizado.", false);
      }
    } catch (falha) {
      avisar(falha.message || "Não foi possível salvar o registro.", true);
    } finally {
      setSalvando(false);
    }
  }

  function solicitarExclusao() {
    if (cicloSelecionado === null) {
      avisar("Selecione um registro para excluir.", true);
      return;
    }

    setConfirmandoExclusao(true);
  }

  async function excluirRegistro() {
    setConfirmandoExclusao(false);

    if (cicloSelecionado === null) {
      return;
    }

    setSalvando(true);

    try {
      await excluirCiclo(cicloSelecionado.id_ciclo);
      setDataSugerida("");
      setIdSelecionado(null);
      avisar("Registro excluído.", false);
    } catch (falha) {
      avisar(falha.message || "Não foi possível excluir o registro.", true);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <TelaComRolagem titulo="Histórico">
      {!logado ? (
        <Text style={estilos.rotulo}>
          Entre na sua conta (Configurações → Minha conta) para ver e registrar seus ciclos.
        </Text>
      ) : null}
      {carregando ? <Text style={estilos.rotulo}>Carregando registros...</Text> : null}
      {erroCarga ? (
        <View>
          <Text style={estilos.mensagemErro}>{erroCarga}</Text>
          <Pressable onPress={recarregar}>
            <Text style={estilos.linkTentar}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : null}
      {logado && !carregando && !erroCarga && ciclos.length === 0 ? (
        <Text style={estilos.rotulo}>Nenhum registro menstrual ainda.</Text>
      ) : null}

      {ciclos.map((ciclo) => (
        <CartaoLista
          key={ciclo.id_ciclo}
          icone="water-outline"
          titulo={`${ciclo.data_inicio} a ${ciclo.data_fim}`}
          subtitulo={`Fluxo ${ciclo.fluxo.toLowerCase()}${ciclo.sintomas ? ` • ${ciclo.sintomas}` : ""}`}
          selecionado={ciclo.id_ciclo === idSelecionado}
          aoPressionar={() => selecionarCiclo(ciclo)}
        />
      ))}

      <BotaoPrimario texto="Novo registro" variante="claro" aoPressionar={novoRegistro} />

      <Text style={estilos.subtitulo}>
        {cicloSelecionado ? "Editar registro" : "Adicionar registro"}
      </Text>

      {mensagem ? (
        <Text style={[estilos.mensagem, erro && estilos.mensagemErro]}>{mensagem}</Text>
      ) : null}

      <CampoTexto
        rotulo="Data de início"
        placeholder="DD/MM/AAAA"
        valor={dataInicio}
        aoMudar={(valor) => setDataInicio(formatarData(valor))}
      />
      <CampoTexto
        rotulo="Duração (dias)"
        valor={duracao}
        aoMudar={(valor) => setDuracao(valor.replace(/\D/g, "").slice(0, 2))}
      />

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

      <BotaoPrimario
        texto={salvando ? "Salvando..." : "Salvar registro"}
        aoPressionar={salvarRegistro}
      />
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

  mensagem: {
    fontSize: 13,
    color: cores.primaria,
  },

  mensagemErro: {
    fontSize: 13,
    color: cores.perigo,
  },

  linkTentar: {
    fontSize: 13,
    fontWeight: "bold",
    color: cores.primaria,
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
