import { useCallback, useEffect, useRef, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TelaComRolagem from "../components/TelaComRolagem";
import CartaoLista from "../components/CartaoLista";
import CampoTexto from "../components/CampoTexto";
import BotaoPrimario from "../components/BotaoPrimario";
import ModalConfirmacao from "../components/ModalConfirmacao";
import useSessao from "../hooks/useSessao";
import { obterSessao } from "../services/sessao.js";
import * as ocorrenciasApi from "../services/ocorrencias.js";
import { formatarData } from "../utils/datas";
import { validarOcorrencia, LIMITE_DESCRICAO } from "../utils/validacaoOcorrencia";
import { criarGuardaDeResposta } from "../utils/guardaResposta";
import { canaisAjuda } from "../dados/dadosFicticios";
import cores from "../tema/cores";

// Diário de Ocorrências integrado à API (GET/POST/PUT/DELETE /api/ocorrencias).
// Usa a sessão única do aplicativo (services/sessao.js) e o cliente HTTP compartilhado
// (services/api.js): esta tela não tem login próprio nem guarda token.
// Segurança: os relatos ficam só na memória da tela e são descartados quando a sessão
// termina (Sair da conta, 401 ou Quick Exit). Respostas que chegam depois disso são
// ignoradas pela "geração" da sessão, para que nada antigo reapareça na tela.
export default function DiarioOcorrencias({ navigation }) {
  const sessao = useSessao();
  const idPerfil = sessao?.id_perfil ?? null;
  const [ocorrencias, setOcorrencias] = useState([]);
  const [ocorrenciaSelecionada, setOcorrenciaSelecionada] = useState(null);
  const [data, setData] = useState("");
  const [descricao, setDescricao] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erroCarga, setErroCarga] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState(false);
  // Trava síncrona contra toque duplo (o estado só atualiza no próximo render).
  const operacaoEmAndamento = useRef(false);
  const montada = useRef(true);
  // Muda a cada login/logout: invalida qualquer resposta que ainda esteja em voo.
  const geracao = useRef(0);

  useEffect(() => {
    montada.current = true;
    return () => {
      montada.current = false;
      geracao.current += 1;
    };
  }, []);

  const limparDadosSensiveis = useCallback(() => {
    setOcorrencias([]);
    setOcorrenciaSelecionada(null);
    setData("");
    setDescricao("");
    setMensagem("");
    setErro(false);
    setErroCarga("");
    setCarregando(false);
    setSalvando(false);
    setConfirmandoExclusao(false);
  }, []);

  // Só aceita atualizar a tela se ela continua montada, na mesma sessão e na mesma geração.
  function verificador(geracaoEsperada, idEsperado) {
    return criarGuardaDeResposta({
      idPerfil: idEsperado,
      geracaoEsperada,
      estaMontada: () => montada.current,
      geracaoAtual: () => geracao.current,
      idPerfilAtual: () => obterSessao()?.id_perfil ?? null,
    });
  }

  const carregar = useCallback(async () => {
    if (idPerfil === null) {
      return;
    }
    const podeAtualizar = verificador(geracao.current, idPerfil);
    setCarregando(true);
    setErroCarga("");
    try {
      const lista = await ocorrenciasApi.listarOcorrencias();
      if (!podeAtualizar()) {
        return;
      }
      setOcorrencias(lista);
      setOcorrenciaSelecionada((atual) =>
        atual && lista.some((item) => item.id_ocorrencia === atual.id_ocorrencia) ? atual : null
      );
    } catch (falha) {
      if (podeAtualizar()) {
        setErroCarga(falha?.message || "Não foi possível carregar as ocorrências.");
      }
    } finally {
      if (podeAtualizar()) {
        setCarregando(false);
      }
    }
  }, [idPerfil]);

  // Ao entrar, sair ou perder a sessão: descarta o que estava na tela e recomeça.
  useEffect(() => {
    geracao.current += 1;
    operacaoEmAndamento.current = false;
    limparDadosSensiveis();
    if (idPerfil !== null) {
      carregar();
    }
  }, [idPerfil, limparDadosSensiveis, carregar]);

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

  function validarFormulario() {
    const resultado = validarOcorrencia({ data, descricao });
    if (!resultado.valido) {
      setMensagem(resultado.mensagem);
      setErro(true);
    }
    return resultado.valido;
  }

  // Executa uma operação de rede com trava de duplo toque e tratamento único de erros.
  async function executar(operacao) {
    if (operacaoEmAndamento.current || idPerfil === null) {
      return;
    }
    operacaoEmAndamento.current = true;
    const podeAtualizar = verificador(geracao.current, idPerfil);
    setSalvando(true);
    try {
      await operacao(podeAtualizar);
    } catch (falha) {
      if (podeAtualizar()) {
        setMensagem(falha?.message || "Não foi possível concluir a operação.");
        setErro(true);
        if (falha?.status === 404) {
          carregar();
        }
      }
    } finally {
      operacaoEmAndamento.current = false;
      if (podeAtualizar()) {
        setSalvando(false);
      }
    }
  }

  async function cadastrarOcorrencia() {
    if (ocorrenciaSelecionada !== null || !validarFormulario()) {
      return;
    }
    await executar(async (podeAtualizar) => {
      const criada = await ocorrenciasApi.criarOcorrencia({ data, descricao });
      if (!podeAtualizar()) {
        return;
      }
      setOcorrencias((listaAtual) => ocorrenciasApi.ordenarOcorrencias([...listaAtual, criada]));
      selecionarOcorrencia(criada);
      setMensagem("Ocorrência cadastrada.");
    });
  }

  async function atualizarOcorrencia() {
    if (ocorrenciaSelecionada === null || !validarFormulario()) {
      return;
    }
    await executar(async (podeAtualizar) => {
      const atualizada = await ocorrenciasApi.atualizarOcorrencia(ocorrenciaSelecionada, { data, descricao });
      if (!podeAtualizar()) {
        return;
      }
      setOcorrencias((listaAtual) =>
        ocorrenciasApi.ordenarOcorrencias(
          listaAtual.map((ocorrencia) =>
            ocorrencia.id_ocorrencia === atualizada.id_ocorrencia ? atualizada : ocorrencia
          )
        )
      );
      selecionarOcorrencia(atualizada);
      setMensagem("Ocorrência atualizada.");
    });
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

  async function excluirOcorrencia() {
    const alvo = ocorrenciaSelecionada;
    setConfirmandoExclusao(false);
    if (alvo === null) {
      return;
    }
    await executar(async (podeAtualizar) => {
      await ocorrenciasApi.excluirOcorrencia(alvo.id_ocorrencia);
      if (!podeAtualizar()) {
        return;
      }
      setOcorrencias((listaAtual) => listaAtual.filter((item) => item.id_ocorrencia !== alvo.id_ocorrencia));
      novaOcorrencia();
      setMensagem("Ocorrência excluída.");
    });
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

      {idPerfil === null ? (
        <>
          <Text style={estilos.subtitulo}>Entre na sua conta para ver seu diário</Text>
          <Text style={estilos.textoApoio}>
            O diário usa a mesma conta do aplicativo e os relatos ficam ligados ao seu perfil. Entre por "Minha
            conta" ou pelo botão abaixo. Os canais de ajuda continuam disponíveis sem login.
          </Text>
          <BotaoPrimario texto="Entrar na minha conta" aoPressionar={() => navigation.navigate("Login")} />
        </>
      ) : (
        <>
          {carregando ? <Text style={estilos.textoApoio}>Carregando ocorrências...</Text> : null}

          {erroCarga ? (
            <>
              <Text style={[estilos.textoApoio, estilos.textoErro]} accessibilityLiveRegion="polite">
                {erroCarga}
              </Text>
              <BotaoPrimario texto="Tentar novamente" variante="claro" aoPressionar={carregar} />
            </>
          ) : null}

          {!carregando && !erroCarga && ocorrencias.length === 0 ? (
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
            limiteCaracteres={LIMITE_DESCRICAO}
          />

          <BotaoPrimario texto={salvando ? "Aguarde..." : "Salvar ocorrência"} aoPressionar={salvarOcorrencia} />
          <BotaoPrimario
            texto="Excluir ocorrência selecionada"
            variante="claro"
            aoPressionar={solicitarExclusao}
          />
        </>
      )}

      {mensagem ? (
        <Text style={[estilos.textoApoio, erro && estilos.textoErro]} accessibilityLiveRegion="polite">
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
        Protótipo acadêmico: use apenas dados fictícios. Os relatos são salvos no servidor do projeto e não ficam
        guardados neste aparelho.
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
