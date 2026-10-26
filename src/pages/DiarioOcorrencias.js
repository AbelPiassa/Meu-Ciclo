import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TelaComRolagem from "../components/TelaComRolagem";
import CartaoLista from "../components/CartaoLista";
import CampoTexto from "../components/CampoTexto";
import BotaoPrimario from "../components/BotaoPrimario";
import ModalConfirmacao from "../components/ModalConfirmacao";
import { ocorrenciasFicticias, canaisAjuda } from "../dados/dadosFicticios";
import cores from "../tema/cores";

export default function DiarioOcorrencias() {
  const ocorrenciaInicial = ocorrenciasFicticias[0] ?? null;

  const [ocorrencias, setOcorrencias] = useState(ocorrenciasFicticias);
  const [ocorrenciaSelecionada, setOcorrenciaSelecionada] = useState(ocorrenciaInicial);
  const [data, setData] = useState(ocorrenciaInicial?.data_ocorrencia ?? "");
  const [descricao, setDescricao] = useState(ocorrenciaInicial?.descricao_relato ?? "");
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState(false);

  function selecionarOcorrencia(ocorrencia) {
    setOcorrenciaSelecionada(ocorrencia);
    setData(ocorrencia.data_ocorrencia);
    setDescricao(ocorrencia.descricao_relato);
    setMensagem("");
    setErro(false);
  }

  function novaOcorrencia() {
    setOcorrenciaSelecionada(null);
    setData("");
    setDescricao("");
    setMensagem("");
    setErro(false);
  }

  function formatarData(valor) {
    // Mantém até oito números e acrescenta as barras durante a digitação.
    const numeros = valor.replace(/\D/g, "").slice(0, 8);

    if (numeros.length <= 2) {
      return numeros;
    }

    if (numeros.length <= 4) {
      return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
    }

    return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4)}`;
  }

  function dataValida(valor) {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
      return false;
    }

    const [dia, mes, ano] = valor.split("/").map(Number);
    const dataInformada = new Date(0);
    dataInformada.setUTCFullYear(ano, mes - 1, dia);

    // Impede datas inexistentes, como 31/02/2026.
    return ano > 0 &&
      dataInformada.getUTCFullYear() === ano &&
      dataInformada.getUTCMonth() === mes - 1 &&
      dataInformada.getUTCDate() === dia;
  }

  function validarFormulario() {
    if (!data.trim() || !descricao.trim()) {
      setMensagem("Preencha a data e a descrição da ocorrência.");
      setErro(true);
      return false;
    }

    if (!dataValida(data)) {
      setMensagem("Informe uma data válida no formato DD/MM/AAAA.");
      setErro(true);
      return false;
    }

    return true;
  }

  function cadastrarOcorrencia() {
    if (ocorrenciaSelecionada !== null || !validarFormulario()) {
      return;
    }

    const ocorrencia = {
      id_ocorrencia: Date.now(),
      id_perfil: 1,
      data_ocorrencia: data,
      tipo_ocorrencia: "Relato do diário",
      descricao_relato: descricao.trim(),
      como_se_sentiu: "",
      nivel_perigo: "Não informado",
      acionou_policia: false,
    };

    setOcorrencias((listaAtual) => [...listaAtual, ocorrencia]);
    selecionarOcorrencia(ocorrencia);
    setMensagem("Ocorrência cadastrada nesta demonstração.");
  }

  function atualizarOcorrencia() {
    if (ocorrenciaSelecionada === null || !validarFormulario()) {
      return;
    }

    const ocorrenciaAtualizada = {
      ...ocorrenciaSelecionada,
      data_ocorrencia: data,
      descricao_relato: descricao.trim(),
    };

    setOcorrencias((listaAtual) =>
      listaAtual.map((ocorrencia) =>
        ocorrencia.id_ocorrencia === ocorrenciaSelecionada.id_ocorrencia
          ? ocorrenciaAtualizada
          : ocorrencia
      )
    );

    selecionarOcorrencia(ocorrenciaAtualizada);
    setMensagem("Ocorrência atualizada nesta demonstração.");
  }

  function salvarOcorrencia() {
    if (ocorrenciaSelecionada === null) {
      cadastrarOcorrencia();
    } else {
      atualizarOcorrencia();
    }
  }

  function solicitarExclusao() {
    // Só abre o modal quando existe uma ocorrência selecionada.
    if (ocorrenciaSelecionada === null) {
      setMensagem("Selecione uma ocorrência para excluir.");
      setErro(true);
      return;
    }

    setConfirmandoExclusao(true);
  }

  function excluirOcorrencia() {
    if (ocorrenciaSelecionada === null) {
      setConfirmandoExclusao(false);
      return;
    }

    setOcorrencias((listaAtual) =>
      listaAtual.filter(
        (ocorrencia) => ocorrencia.id_ocorrencia !== ocorrenciaSelecionada.id_ocorrencia
      )
    );

    novaOcorrencia();
    setConfirmandoExclusao(false);
    setMensagem("Ocorrência excluída nesta demonstração.");
  }

  async function abrirCanalAjuda(canal) {
    const numero = canal.numero.replace(/\D/g, "");

    try {
      // Abre o aplicativo de telefone. A ligação não é feita automaticamente.
      await Linking.openURL(`tel:${numero}`);
    } catch {
      setMensagem(`Não foi possível abrir o telefone. Se precisar, disque ${numero} manualmente.`);
      setErro(true);
    }
  }

  return (
    <TelaComRolagem>
      <View style={estilos.linhaTitulo}>
        <Text style={estilos.titulo}>Diário e ajuda</Text>
        <Pressable
          style={estilos.botaoMais}
          onPress={novaOcorrencia}
          accessibilityRole="button"
          accessibilityLabel="Adicionar nova ocorrência"
        >
          <Ionicons name="add" size={22} color="#ffffff" />
        </Pressable>
      </View>

      {ocorrencias.length === 0 ? (
        <Text style={estilos.textoApoio}>Nenhuma ocorrência registrada. Use o formulário para adicionar.</Text>
      ) : null}

      {ocorrencias.map((ocorrencia) => (
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

      <CampoTexto
        rotulo="Data"
        placeholder="DD/MM/AAAA"
        valor={data}
        aoMudar={(texto) => setData(formatarData(texto))}
        teclado="numeric"
        limiteCaracteres={10}
      />
      <CampoTexto
        rotulo="Descrição"
        placeholder="Descreva o que aconteceu..."
        valor={descricao}
        aoMudar={setDescricao}
        multilinha
      />

      <BotaoPrimario texto="Salvar ocorrência" aoPressionar={salvarOcorrencia} />
      <BotaoPrimario
        texto="Excluir ocorrência selecionada"
        variante="claro"
        aoPressionar={solicitarExclusao}
      />

      {mensagem ? (
        <Text
          style={[estilos.textoApoio, erro && estilos.textoErro]}
          accessibilityLiveRegion="polite"
        >
          {mensagem}
        </Text>
      ) : null}

      <Text style={estilos.subtitulo}>Ajuda • canais de apoio</Text>

      {canaisAjuda.map((canal) => (
        <CartaoLista
          key={canal.numero}
          icone={canal.numero === "Ligue 190" ? "shield-checkmark-outline" : "call-outline"}
          titulo={canal.numero}
          subtitulo={canal.descricao}
          aoPressionar={() => abrirCanalAjuda(canal)}
        />
      ))}

      <Text style={estilos.textoApoio}>
        Protótipo acadêmico: os relatos ficam apenas nesta tela e não são salvos ao fechar o aplicativo.
      </Text>

      <ModalConfirmacao
        visivel={confirmandoExclusao}
        titulo="Excluir ocorrência?"
        mensagem="O relato selecionado será removido do diário."
        textoConfirmar="Confirmar exclusão"
        aoConfirmar={excluirOcorrencia}
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

  textoApoio: {
    fontSize: 12,
    color: cores.textoSuave,
  },

  textoErro: {
    color: cores.perigo,
  },
});
