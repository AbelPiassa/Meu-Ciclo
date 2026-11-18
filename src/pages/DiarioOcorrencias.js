import { useCallback, useEffect, useRef, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TelaComRolagem from "../components/TelaComRolagem";
import CartaoLista from "../components/CartaoLista";
import CampoTexto from "../components/CampoTexto";
import BotaoPrimario from "../components/BotaoPrimario";
import ModalConfirmacao from "../components/ModalConfirmacao";
import useSessaoApi from "../hooks/useSessaoApi";
import { ErroApi } from "../servicos/clienteApi";
import { entrar } from "../servicos/sessao";
import * as ocorrenciasApi from "../servicos/ocorrenciasApi";
import { formatarData } from "../utils/datas";
import { validarOcorrencia, LIMITE_DESCRICAO } from "../utils/validacaoOcorrencia";
import { canaisAjuda } from "../dados/dadosFicticios";
import cores from "../tema/cores";

// Diário de Ocorrências integrado à API (GET/POST/PUT/DELETE /api/ocorrencias).
// Segurança: os relatos ficam só na memória da tela (nada em disco/log) e são descartados
// quando a tela fecha ou a sessão termina. Os canais de ajuda funcionam mesmo sem a API.
export default function DiarioOcorrencias() {
  const sessao = useSessaoApi();

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
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");

  // Trava síncrona contra toque duplo (o estado só atualiza no próximo render).
  const operacaoEmAndamento = useRef(false);
  const montada = useRef(true);
  const cargaAtual = useRef(0);

  useEffect(() => {
    montada.current = true;
    return () => {
      montada.current = false;
    };
  }, []);

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

  function mostrarErro(falha) {
    // Mensagens de ErroApi já são em português e sem dados sensíveis.
    setMensagem(falha instanceof ErroApi ? falha.message : "Não foi possível concluir a operação.");
    setErro(true);
  }

  const carregar = useCallback(async () => {
    const numeroDaCarga = ++cargaAtual.current;
    setCarregando(true);
    setErroCarga("");

    try {
      const lista = await ocorrenciasApi.listarOcorrencias();
      if (!montada.current || numeroDaCarga !== cargaAtual.current) {
        return;
      }
      setOcorrencias(lista);
      setOcorrenciaSelecionada((atual) =>
        atual && lista.some((item) => item.id_ocorrencia === atual.id_ocorrencia) ? atual : null
      );
    } catch (falha) {
      if (montada.current && numeroDaCarga === cargaAtual.current) {
        setErroCarga(falha instanceof ErroApi ? falha.message : "Não foi possível carregar as ocorrências.");
      }
    } finally {
      if (montada.current && numeroDaCarga === cargaAtual.current) {
        setCarregando(false);
      }
    }
  }, []);

  // Carrega ao entrar na tela / ao autenticar; descarta os relatos quando a sessão termina.
  useEffect(() => {
    if (sessao.ativa) {
      carregar();
      return;
    }
    cargaAtual.current++;
    setOcorrencias([]);
    setOcorrenciaSelecionada(null);
    setData("");
    setDescricao("");
    setCarregando(false);
    setErroCarga("");
  }, [sessao.ativa, sessao.idPerfil, carregar]);

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
    if (operacaoEmAndamento.current) {
      return;
    }
    operacaoEmAndamento.current = true;
    setSalvando(true);
    try {
      await operacao();
    } catch (falha) {
      if (montada.current) {
        mostrarErro(falha);
        if (falha instanceof ErroApi && falha.tipo === "naoEncontrado") {
          carregar();
        }
      }
    } finally {
      operacaoEmAndamento.current = false;
      if (montada.current) {
        setSalvando(false);
      }
    }
  }

  async function entrarNaApi() {
    await executar(async () => {
      await entrar(usuario, senha);
      setUsuario("");
      setSenha("");
      setMensagem("");
      setErro(false);
    });
  }

  async function cadastrarOcorrencia() {
    if (ocorrenciaSelecionada !== null || !validarFormulario()) {
      return;
    }

    await executar(async () => {
      const criada = await ocorrenciasApi.criarOcorrencia({ data, descricao });
      if (!montada.current) {
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

    await executar(async () => {
      const atualizada = await ocorrenciasApi.atualizarOcorrencia(ocorrenciaSelecionada, { data, descricao });
      if (!montada.current) {
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

    await executar(async () => {
      await ocorrenciasApi.excluirOcorrencia(alvo.id_ocorrencia);
      if (!montada.current) {
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

      {!sessao.ativa ? (
        <>
          <Text style={estilos.subtitulo}>Entrar para abrir o diário</Text>
          <Text style={estilos.textoApoio}>
            Seus relatos são salvos no servidor do projeto, ligados ao seu perfil. Entre com o usuário cadastrado.
          </Text>
          <CampoTexto rotulo="Usuário" placeholder="usuario" valor={usuario} aoMudar={setUsuario} />
          <CampoTexto rotulo="Senha" placeholder="********" valor={senha} aoMudar={setSenha} senha />
          <BotaoPrimario texto={salvando ? "Entrando..." : "Entrar"} aoPressionar={entrarNaApi} />
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
