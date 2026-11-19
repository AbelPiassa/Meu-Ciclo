import { useCallback, useEffect, useRef, useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import TelaComRolagem from "../components/TelaComRolagem";
import CartaoLista from "../components/CartaoLista";
import CampoTexto from "../components/CampoTexto";
import BotaoPrimario from "../components/BotaoPrimario";
import ModalConfirmacao from "../components/ModalConfirmacao";
import useSessao from "../hooks/useSessao";
import { obterSessao, obterVersaoSessao } from "../services/sessao.js";
import * as ocorrenciasApi from "../services/ocorrencias.js";
import { criarGuardaDeResposta } from "../utils/guardaResposta";
import { formatarData } from "../utils/datas";
import { validarOcorrencia, LIMITE_DESCRICAO } from "../utils/validacaoOcorrencia";
import { canaisAjuda } from "../dados/dadosFicticios";
import cores from "../tema/cores";

// Diário de Ocorrências integrado à API (GET/POST/PUT/DELETE /api/ocorrencias).
// Usa a sessão única (services/sessao.js) e o cliente HTTP compartilhado (services/api.js):
// esta tela não tem login, token nem cliente próprios.
//
// Proteções de sessão:
//  - a identidade é a SESSÃO (objeto de obterSessao(), com token), não apenas o id_perfil:
//    entrar de novo na mesma conta cria outra sessão e invalida tudo da anterior;
//  - cada sessão monta um Diário novo (key = versão da sessão): relatos, formulário e
//    modais da sessão anterior nunca são renderizados;
//  - as travas de carregamento e de gravação pertencem à sessão que as criou, então uma
//    requisição antiga não libera nem bloqueia uma operação nova;
//  - uma listagem por vez e nenhuma gravação durante o carregamento;
//  - resposta que chega depois de logout, 401 ou Quick Exit é descartada.
export default function DiarioOcorrencias({ navigation }) {
  const sessao = useSessao();
  return (
    <TelaComRolagem>
      <View style={estilos.linhaTitulo}>
        <Text style={estilos.titulo}>Diário e ajuda</Text>
      </View>
      {sessao ? (
        <DiarioDaSessao key={obterVersaoSessao()} sessao={sessao} />
      ) : (
        <PainelSemConta navigation={navigation} />
      )}
      <CanaisDeAjuda />
    </TelaComRolagem>
  );
}

function mensagemDeCarga(falha) {
  if (falha?.status === 401) {
    return "Sua sessão terminou. Entre novamente.";
  }
  return falha?.message || "Não foi possível carregar as ocorrências.";
}

function mensagemDeGravacao(falha) {
  if (falha?.status === 401) {
    return "Sua sessão terminou. Entre novamente.";
  }
  if (!falha?.status) {
    // Sem status HTTP = falha de rede ou tempo limite: a gravação pode ter sido concluída.
    return "Não foi possível confirmar a gravação. Consulte a lista (Atualizar) antes de tentar de novo.";
  }
  return falha?.message || "Não foi possível concluir a operação.";
}

function PainelSemConta({ navigation }) {
  return (
    <>
      <Text style={estilos.subtitulo}>Entre na sua conta para ver seu diário</Text>
      <Text style={estilos.textoApoio}>
        O diário usa a mesma conta do aplicativo e os relatos ficam ligados ao seu perfil. Entre por "Minha conta"
        ou pelo botão abaixo. Os canais de ajuda continuam disponíveis sem login.
      </Text>
      <BotaoPrimario texto="Entrar na minha conta" aoPressionar={() => navigation.navigate("Login")} />
    </>
  );
}

function DiarioDaSessao({ sessao }) {
  const [ocorrencias, setOcorrencias] = useState([]);
  const [selecionada, setSelecionada] = useState(null);
  const [data, setData] = useState("");
  const [descricao, setDescricao] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [gravando, setGravando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState(false);
  const [erroCarga, setErroCarga] = useState("");
  const [falhouLista, setFalhouLista] = useState(false);
  const [conferirLista, setConferirLista] = useState(false);

  const ativa = useRef(false);
  const geracao = useRef(0);
  const gravacao = useRef(null); // sessão dona da gravação em andamento
  const carga = useRef(null); // { sessao, promessa } da listagem em andamento

  const guardaDe = useCallback(
    (geracaoEsperada) =>
      criarGuardaDeResposta({
        sessao,
        geracaoEsperada,
        estaAtiva: () => ativa.current,
        geracaoAtual: () => geracao.current,
        sessaoAtual: () => obterSessao(),
      }),
    [sessao]
  );

  // Uma listagem por sessão: um segundo pedido reaproveita a requisição em andamento.
  const carregar = useCallback(() => {
    if (carga.current?.sessao === sessao) {
      return carga.current.promessa;
    }
    const podeAplicar = guardaDe(geracao.current);
    setCarregando(true);
    setErroCarga("");
    setFalhouLista(false);
    const promessa = (async () => {
      try {
        const lista = await ocorrenciasApi.listarOcorrencias();
        if (!podeAplicar()) {
          return;
        }
        setOcorrencias(lista);
        setSelecionada((atual) =>
          atual && lista.some((item) => item.id_ocorrencia === atual.id_ocorrencia) ? atual : null
        );
        setConferirLista(false);
      } catch (falha) {
        if (!podeAplicar()) {
          return;
        }
        setOcorrencias([]);
        setSelecionada(null);
        setFalhouLista(true);
        setErroCarga(mensagemDeCarga(falha));
      } finally {
        if (carga.current?.promessa === promessa) {
          carga.current = null;
        }
        if (podeAplicar()) {
          setCarregando(false);
        }
      }
    })();
    carga.current = { sessao, promessa };
    return promessa;
  }, [guardaDe, sessao]);

  useEffect(() => {
    ativa.current = true;
    geracao.current += 1;
    carregar();
    return () => {
      // Ao desmontar (logout, troca de conta, Quick Exit) nada desta sessão pode voltar.
      ativa.current = false;
      geracao.current += 1;
      gravacao.current = null;
      carga.current = null;
    };
  }, [carregar]);

  function avisar(texto, comoErro = true) {
    setMensagem(texto);
    setErro(comoErro);
  }

  function selecionar(ocorrencia) {
    setSelecionada(ocorrencia);
    setData(ocorrencia.data_ocorrencia);
    setDescricao(ocorrencia.descricao_relato);
    setMensagem("");
    setErro(false);
  }

  function nova() {
    setSelecionada(null);
    setData("");
    setDescricao("");
    setMensagem("");
    setErro(false);
  }

  function validarFormulario() {
    const resultado = validarOcorrencia({ data, descricao });
    if (!resultado.valido) {
      avisar(resultado.mensagem);
    }
    return resultado.valido;
  }

  // Executa uma escrita com as travas da sessão: sem gravação durante o carregamento,
  // uma operação por vez e a trava só é liberada pela sessão que a criou.
  async function executar(operacao) {
    const podeAplicar = guardaDe(geracao.current);
    if (!podeAplicar()) {
      return; // a sessão mudou: esta tela já foi substituída
    }
    if (carregando || carga.current?.sessao === sessao) {
      avisar("Aguarde o carregamento da lista.");
      return;
    }
    if (falhouLista) {
      avisar('A lista não foi carregada. Use "Atualizar lista" antes de salvar.');
      return;
    }
    if (gravacao.current === sessao) {
      avisar("Aguarde a operação em andamento.");
      return;
    }
    gravacao.current = sessao;
    setGravando(true);
    setMensagem("");
    setConferirLista(false);
    try {
      await operacao(podeAplicar);
    } catch (falha) {
      if (podeAplicar()) {
        avisar(mensagemDeGravacao(falha));
        setConferirLista(!falha?.status);
        if (falha?.status === 404) {
          carregar();
        }
      }
    } finally {
      // Só a sessão dona da trava pode liberá-la.
      if (gravacao.current === sessao) {
        gravacao.current = null;
      }
      if (podeAplicar()) {
        setGravando(false);
      }
    }
  }

  function cadastrar() {
    if (selecionada !== null || !validarFormulario()) {
      return;
    }
    return executar(async (podeAplicar) => {
      const criada = await ocorrenciasApi.criarOcorrencia({ data, descricao });
      if (!podeAplicar()) {
        return;
      }
      setOcorrencias((lista) => ocorrenciasApi.ordenarOcorrencias([...lista, criada]));
      selecionar(criada);
      avisar("Ocorrência cadastrada.", false);
    });
  }

  function atualizar() {
    if (selecionada === null || !validarFormulario()) {
      return;
    }
    return executar(async (podeAplicar) => {
      const atualizada = await ocorrenciasApi.atualizarOcorrencia(selecionada, { data, descricao });
      if (!podeAplicar()) {
        return;
      }
      setOcorrencias((lista) =>
        ocorrenciasApi.ordenarOcorrencias(
          lista.map((ocorrencia) =>
            ocorrencia.id_ocorrencia === atualizada.id_ocorrencia ? atualizada : ocorrencia
          )
        )
      );
      selecionar(atualizada);
      avisar("Ocorrência atualizada.", false);
    });
  }

  function salvar() {
    if (selecionada === null) {
      cadastrar();
    } else {
      atualizar();
    }
  }

  function solicitarExclusao() {
    if (selecionada === null) {
      avisar("Selecione uma ocorrência para excluir.");
      return;
    }
    setConfirmando(true);
  }

  function excluir() {
    const alvo = selecionada;
    setConfirmando(false);
    if (alvo === null) {
      return;
    }
    return executar(async (podeAplicar) => {
      await ocorrenciasApi.excluirOcorrencia(alvo.id_ocorrencia);
      if (!podeAplicar()) {
        return;
      }
      setOcorrencias((lista) => lista.filter((item) => item.id_ocorrencia !== alvo.id_ocorrencia));
      nova();
      avisar("Ocorrência excluída.", false);
    });
  }

  const rotuloSalvar = gravando
    ? "Aguarde..."
    : carregando
      ? "Carregando lista..."
      : selecionada === null
        ? "Salvar ocorrência"
        : "Salvar alterações";

  return (
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
          selecionado={ocorrencia.id_ocorrencia === selecionada?.id_ocorrencia}
          aoPressionar={() => selecionar(ocorrencia)}
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

      <BotaoPrimario texto={rotuloSalvar} aoPressionar={salvar} />
      <BotaoPrimario texto="Nova ocorrência" variante="claro" aoPressionar={nova} />
      <BotaoPrimario
        texto="Excluir ocorrência selecionada"
        variante="claro"
        aoPressionar={solicitarExclusao}
      />

      {conferirLista ? (
        <BotaoPrimario texto="Atualizar lista" variante="claro" aoPressionar={carregar} />
      ) : null}

      {mensagem ? (
        <Text style={[estilos.textoApoio, erro && estilos.textoErro]} accessibilityLiveRegion="polite">
          {mensagem}
        </Text>
      ) : null}

      <Text style={estilos.textoApoio}>
        Protótipo acadêmico: use apenas dados fictícios. Os relatos são salvos no servidor do projeto e não ficam
        guardados neste aparelho.
      </Text>

      <ModalConfirmacao
        visivel={confirmando}
        titulo="Excluir ocorrência?"
        mensagem="O relato selecionado será removido do diário."
        textoConfirmar="Confirmar exclusão"
        aoConfirmar={excluir}
        aoCancelar={() => setConfirmando(false)}
      />
    </>
  );
}

function CanaisDeAjuda() {
  const [aviso, setAviso] = useState("");
  async function abrir(canal) {
    const numero = canal.numero.replace(/\D/g, "");
    try {
      // Abre o aplicativo de telefone. A ligação não é feita automaticamente.
      await Linking.openURL(`tel:${numero}`);
    } catch {
      setAviso(`Não foi possível abrir o telefone. Se precisar, disque ${numero} manualmente.`);
    }
  }
  return (
    <>
      <Text style={estilos.subtitulo}>Ajuda • canais de apoio</Text>
      {canaisAjuda.map((canal) => (
        <CartaoLista
          key={canal.numero}
          icone={canal.numero === "Ligue 190" ? "shield-checkmark-outline" : "call-outline"}
          titulo={canal.numero}
          subtitulo={canal.descricao}
          aoPressionar={() => abrir(canal)}
        />
      ))}
      {aviso ? <Text style={[estilos.textoApoio, estilos.textoErro]}>{aviso}</Text> : null}
    </>
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
