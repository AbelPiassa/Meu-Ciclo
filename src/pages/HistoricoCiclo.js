import { useEffect, useRef, useState } from "react";
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
  const {
    ciclos,
    chaveSessao,
    logado,
    carregando,
    erro: erroCarga,
    recarregar,
    cadastrarCiclo,
    atualizarCiclo,
    excluirCiclo,
  } = useCiclos();

  const [idSelecionado, setIdSelecionado] = useState(null);
  const [dataSugerida, setDataSugerida] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [duracao, setDuracao] = useState("5");
  const [fluxo, setFluxo] = useState("Moderado");
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Refs síncronas: a trava contra clique duplo vale na hora (o estado só vale na próxima renderização)
  // e a sessão da tela é comparada depois de cada await.
  const travaRef = useRef(false);
  const sessaoRef = useRef(chaveSessao);
  sessaoRef.current = chaveSessao;

  const cicloSelecionado = ciclos.find((ciclo) => ciclo.id_ciclo === idSelecionado) ?? null;

  // Assinatura do registro selecionado: o formulário só é preenchido de novo quando o registro
  // muda de verdade, assim uma recarga da lista não apaga o que a pessoa está digitando.
  const assinatura = cicloSelecionado
    ? [
        cicloSelecionado.id_ciclo,
        cicloSelecionado.data_inicio,
        cicloSelecionado.data_fim,
        cicloSelecionado.fluxo,
      ].join("|")
    : null;

  function limparFormulario(data = "") {
    setDataInicio(data);
    setDuracao("5");
    setFluxo("Moderado");
  }

  // Logout, Quick Exit, erro 401 ou troca de perfil: limpa tudo que é da conta anterior.
  useEffect(() => {
    travaRef.current = false;
    setSalvando(false);
    setConfirmandoExclusao(false);
    setIdSelecionado(null);
    setDataSugerida("");
    setMensagem("");
    setErro(false);
    limparFormulario();
  }, [chaveSessao]);

  // Se o registro selecionado deixou de existir (outra recarga, exclusão), volta para "novo registro".
  useEffect(() => {
    if (idSelecionado !== null && !carregando && cicloSelecionado === null) {
      setIdSelecionado(null);
    }
  }, [idSelecionado, carregando, cicloSelecionado]);

  // Preenche o formulário quando o registro selecionado muda (ou limpa, se for um registro novo)
  useEffect(() => {
    if (cicloSelecionado) {
      setDataInicio(cicloSelecionado.data_inicio);
      setDuracao(duracaoDoCiclo(cicloSelecionado));
      setFluxo(cicloSelecionado.fluxo);
    } else {
      limparFormulario(dataSugerida);
    }
  }, [assinatura, dataSugerida]);

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
    limparFormulario();
  }

  // Escrita só com sessão, sem carregamento em andamento e sem outra operação rodando.
  function podeEscrever() {
    if (!logado) {
      avisar("Entre na sua conta (Configurações → Minha conta) para salvar registros.", true);
      return false;
    }

    if (carregando) {
      avisar("Aguarde o carregamento dos registros.", true);
      return false;
    }

    if (travaRef.current) {
      return false;
    }

    return true;
  }

  // Roda a operação com a trava ligada e só mostra o resultado se a sessão ainda for a mesma.
  async function executar(operacao, aoConcluir, textoFalha) {
    const chave = sessaoRef.current;

    travaRef.current = true;
    setSalvando(true);

    try {
      const resultado = await operacao();

      if (sessaoRef.current === chave) {
        aoConcluir(resultado);
      }
    } catch (falha) {
      if (sessaoRef.current === chave) {
        avisar(falha.message || textoFalha, true);
      }
    } finally {
      if (sessaoRef.current === chave) {
        travaRef.current = false;
        setSalvando(false);
      }
    }
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

  function salvarRegistro() {
    if (!podeEscrever() || !validarFormulario()) {
      return;
    }

    const dados = {
      data_inicio: dataInicio,
      data_fim: dataParaTexto(somarDias(textoParaData(dataInicio), Number(duracao) - 1)),
      fluxo,
    };

    if (cicloSelecionado === null) {
      executar(
        () => cadastrarCiclo(dados),
        (novo) => {
          setIdSelecionado(novo.id_ciclo);
          avisar("Registro cadastrado.", false);
        },
        "Não foi possível salvar o registro."
      );
    } else {
      executar(
        () => atualizarCiclo(cicloSelecionado.id_ciclo, dados),
        () => avisar("Registro atualizado.", false),
        "Não foi possível salvar o registro."
      );
    }
  }

  function solicitarExclusao() {
    if (cicloSelecionado === null) {
      avisar("Selecione um registro para excluir.", true);
      return;
    }

    if (!podeEscrever()) {
      return;
    }

    setConfirmandoExclusao(true);
  }

  function excluirRegistro() {
    setConfirmandoExclusao(false);

    if (cicloSelecionado === null || !podeEscrever()) {
      return;
    }

    executar(
      () => excluirCiclo(cicloSelecionado.id_ciclo),
      () => {
        setDataSugerida("");
        setIdSelecionado(null);
        avisar("Registro excluído.", false);
      },
      "Não foi possível excluir o registro."
    );
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
