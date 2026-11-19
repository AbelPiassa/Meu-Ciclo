import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useIsFocused } from "@react-navigation/native";
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import TelaComRolagem from "../components/TelaComRolagem";
import CartaoLista from "../components/CartaoLista";
import BotaoPrimario from "../components/BotaoPrimario";
import ModalConfirmacao from "../components/ModalConfirmacao";
import useSessao from "../hooks/useSessao";
import { obterSessao, obterVersaoSessao } from "../services/sessao.js";
import * as ocorrenciasApi from "../services/ocorrencias.js";
import { criarGuardaDeResposta } from "../utils/guardaResposta";
import { criarControleDiario } from "../utils/controleDiario.js";
import { formatarData } from "../utils/datas";
import { validarOcorrencia, LIMITE_DESCRICAO } from "../utils/validacaoOcorrencia";
import { canaisAjuda } from "../dados/dadosFicticios";
import cores from "../tema/cores";

// A identidade é a sessão, inclusive no relogin da mesma conta. O controlador
// permanece no blur; relatos, formulário e modal são desmontados. Uma escrita
// já enviada continua travada até terminar e não repõe a interface anterior.
export default function DiarioOcorrencias({ navigation }) {
  const sessao = useSessao();
  const emFoco = useIsFocused();
  return <TelaComRolagem>
    <Text style={estilos.titulo}>Diário e ajuda</Text>
    {sessao ? <DiarioDaSessao key={obterVersaoSessao()} sessao={sessao} emFoco={emFoco} />
      : emFoco ? <PainelSemConta navigation={navigation} /> : null}
    <CanaisDeAjuda />
  </TelaComRolagem>;
}

function PainelSemConta({ navigation }) {
  return <>
    <Text style={estilos.subtitulo}>Entre na sua conta para ver seu diário</Text>
    <Text style={estilos.textoApoio}>O diário usa a mesma conta do aplicativo. Entre por "Minha conta" ou pelo botão abaixo. Os canais de ajuda continuam disponíveis sem login.</Text>
    <BotaoPrimario texto="Entrar na minha conta" aoPressionar={() => navigation.navigate("Login")} />
  </>;
}

function DiarioDaSessao({ sessao, emFoco }) {
  const [controle] = useState(() => criarControleDiario({ sessao, sessaoAtual: obterSessao }));
  // NativeStack pode manter a tela montada no blur. Não recriar o dono da operação.
  return emFoco ? <ConteudoDiario sessao={sessao} controle={controle} /> : null;
}

function mensagemDeGravacao(falha) {
  if (falha?.status === 401) return "Sua sessão terminou. Entre novamente.";
  if (!falha?.status || falha.status >= 500) return "Não foi possível confirmar a gravação. Ela pode ter sido concluída no servidor. Atualize e consulte a lista antes de tentar novamente.";
  return falha?.message || "Não foi possível concluir a operação.";
}

function ConteudoDiario({ sessao, controle }) {
  const estado = useSyncExternalStore(controle.observar, controle.obterEstado, controle.obterEstado);
  const [ocorrencias, setOcorrencias] = useState([]);
  const [selecionada, setSelecionada] = useState(null);
  const [data, setData] = useState("");
  const [descricao, setDescricao] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState(false);
  const [erroCarga, setErroCarga] = useState("");
  const ativa = useRef(false);
  const geracao = useRef(0);
  const aguardaEscritaInicial = useRef(estado.gravando);
  const guardaDe = useCallback(() => criarGuardaDeResposta({
    sessao, geracaoEsperada: geracao.current,
    estaAtiva: () => ativa.current, geracaoAtual: () => geracao.current,
    sessaoAtual: obterSessao,
  }), [sessao]);

  function avisar(texto, comoErro = true) { setMensagem(texto); setErro(comoErro); }
  function limparFormulario() { setSelecionada(null); setData(""); setDescricao(""); setConfirmando(false); }
  function preencherRegistro(registro) { setSelecionada(registro); setData(registro.data_ocorrencia); setDescricao(registro.descricao_relato); }

  const carregar = useCallback(async () => {
    const podeAplicar = guardaDe();
    if (!podeAplicar()) return;
    const recuperando = controle.obterEstado().resultadoIncerto;
    setErroCarga("");
    try {
      const lista = await controle.carregar(ocorrenciasApi.listarOcorrencias);
      if (!podeAplicar()) return;
      setOcorrencias(lista);
      // Usar metadados atuais para o PUT completo, nunca o objeto selecionado antigo.
      setSelecionada((atual) => atual ? lista.find((item) => item.id_ocorrencia === atual.id_ocorrencia) ?? null : null);
      if (recuperando) {
        setSelecionada(null); setData(""); setDescricao(""); setConfirmando(false);
        setMensagem("Lista atualizada. Confira se a operação anterior já foi concluída antes de escrever novamente.");
        setErro(false);
      }
    } catch (falha) {
      if (!podeAplicar()) return;
      if (falha?.codigo === "DIARIO_BLOQUEADO") { setMensagem(falha.message); setErro(true); return; }
      setOcorrencias([]); setSelecionada(null); setConfirmando(false);
      setErroCarga(falha?.status === 401 ? "Sua sessão terminou. Entre novamente." : falha?.message || "Não foi possível carregar as ocorrências.");
    }
  }, [controle, guardaDe]);

  useEffect(() => {
    ativa.current = true; geracao.current += 1;
    if (!controle.obterEstado().gravando) void carregar();
    return () => { ativa.current = false; geracao.current += 1; };
    // Não liberar operações no blur: o controlador ainda é seu dono.
  }, [carregar, controle]);
  useEffect(() => {
    // Refoco durante uma escrita: esperar a conclusão antes de uma nova leitura.
    if (aguardaEscritaInicial.current && !estado.gravando) {
      aguardaEscritaInicial.current = false; void carregar();
    }
  }, [estado.gravando, carregar]);

  function podeInteragir() {
    const atual = controle.obterEstado();
    return guardaDe()() && atual.listaPronta && !atual.carregando && !atual.gravando && !atual.resultadoIncerto;
  }
  function selecionar(registro) {
    if (!podeInteragir() || confirmando) return;
    preencherRegistro(registro); setMensagem(""); setErro(false);
  }
  function nova() {
    if (!podeInteragir() || confirmando) return;
    limparFormulario(); setMensagem(""); setErro(false);
  }
  async function executar(operacao) {
    const podeAplicar = guardaDe();
    if (!podeAplicar()) return;
    let recuperar404 = false;
    try { await controle.gravar(() => operacao(podeAplicar)); }
    catch (falha) {
      if (!podeAplicar()) return;
      avisar(mensagemDeGravacao(falha)); recuperar404 = falha?.status === 404;
    }
    // A escrita já terminou: recuperar 404 não concorre com ela.
    if (recuperar404 && podeAplicar()) void carregar();
  }
  function salvar() {
    if (!podeInteragir()) return;
    const validacao = validarOcorrencia({ data, descricao });
    if (!validacao.valido) { avisar(validacao.mensagem); return; }
    setMensagem("");
    const base = selecionada;
    void executar(async (podeAplicar) => {
      const registro = base === null
        ? await ocorrenciasApi.criarOcorrencia({ data, descricao })
        : await ocorrenciasApi.atualizarOcorrencia(base, { data, descricao });
      if (!podeAplicar()) return;
      setOcorrencias((lista) => ocorrenciasApi.ordenarOcorrencias(base === null
        ? [...lista, registro]
        : lista.map((item) => item.id_ocorrencia === registro.id_ocorrencia ? registro : item)));
      preencherRegistro(registro);
      avisar(base === null ? "Ocorrência cadastrada." : "Ocorrência atualizada.", false);
    });
  }
  function solicitarExclusao() {
    if (!podeInteragir()) return;
    if (selecionada === null) { avisar("Selecione uma ocorrência para excluir."); return; }
    setConfirmando(true);
  }
  function excluir() {
    const alvo = selecionada;
    setConfirmando(false);
    if (!podeInteragir() || alvo === null) return;
    void executar(async (podeAplicar) => {
      await ocorrenciasApi.excluirOcorrencia(alvo.id_ocorrencia);
      if (!podeAplicar()) return;
      setOcorrencias((lista) => lista.filter((item) => item.id_ocorrencia !== alvo.id_ocorrencia));
      limparFormulario(); avisar("Ocorrência excluída.", false);
    });
  }

  const bloqueada = estado.carregando || estado.gravando || !estado.listaPronta || estado.resultadoIncerto;
  const rotuloSalvar = estado.gravando ? "Aguarde..." : estado.carregando ? "Carregando lista..." : selecionada === null ? "Salvar ocorrência" : "Salvar alterações";
  return <>
    {estado.carregando ? <Text style={estilos.textoApoio}>Carregando ocorrências...</Text> : null}
    {aguardaEscritaInicial.current && estado.gravando ? <Text style={estilos.textoApoio}>Aguardando a operação já enviada antes de consultar a lista.</Text> : null}
    {erroCarga ? <Text style={[estilos.textoApoio, estilos.textoErro]} accessibilityLiveRegion="polite">{erroCarga}</Text> : null}
    {!estado.carregando && !erroCarga && estado.listaPronta && ocorrencias.length === 0 ? <Text style={estilos.textoApoio}>Nenhuma ocorrência registrada. Use o formulário para adicionar.</Text> : null}
    <View pointerEvents={bloqueada || confirmando ? "none" : "auto"}>
      {ocorrencias.map((registro) => <CartaoLista key={registro.id_ocorrencia} icone="document-text-outline"
        titulo={`${registro.data_ocorrencia} • ${registro.tipo_ocorrencia}`} subtitulo={registro.descricao_relato}
        selecionado={registro.id_ocorrencia === selecionada?.id_ocorrencia} aoPressionar={() => selecionar(registro)} />)}
    </View>
    <Text style={estilos.subtitulo}>Adicionar ou editar ocorrência</Text>
    <CampoDoDiario rotulo="Data" placeholder="DD/MM/AAAA" valor={data}
      aoMudar={(texto) => { if (podeInteragir() && !confirmando) setData(formatarData(texto)); }}
      teclado="numeric" limite={10} bloqueado={bloqueada || confirmando} />
    <CampoDoDiario rotulo="Descrição" placeholder="Descreva o que aconteceu..." valor={descricao}
      aoMudar={(texto) => { if (podeInteragir() && !confirmando) setDescricao(texto); }}
      multilinha limite={LIMITE_DESCRICAO} bloqueado={bloqueada || confirmando} />
    <AcaoDoDiario texto={rotuloSalvar} aoPressionar={salvar} bloqueado={bloqueada || confirmando} />
    <AcaoDoDiario texto="Nova ocorrência" aoPressionar={nova} bloqueado={bloqueada || confirmando} claro />
    <AcaoDoDiario texto="Excluir ocorrência selecionada" aoPressionar={solicitarExclusao} bloqueado={bloqueada || confirmando || selecionada === null} claro />
    <AcaoDoDiario texto={estado.carregando ? "Atualizando lista..." : "Atualizar lista"}
      aoPressionar={() => void carregar()} bloqueado={estado.carregando || estado.gravando || confirmando} claro />
    {estado.resultadoIncerto ? <Text style={[estilos.textoApoio, estilos.textoErro]}>Novas gravações estão bloqueadas até uma atualização bem-sucedida da lista. A operação já enviada pode ter sido concluída no servidor.</Text> : null}
    {mensagem ? <Text style={[estilos.textoApoio, erro && estilos.textoErro]} accessibilityLiveRegion="polite">{mensagem}</Text> : null}
    <Text style={estilos.textoApoio}>Protótipo acadêmico: use apenas dados fictícios. Os relatos são salvos no servidor do projeto. Não há validação de segurança para uso em produção.</Text>
    <ModalConfirmacao visivel={confirmando} titulo="Excluir ocorrência?" mensagem="O relato selecionado será removido do diário."
      textoConfirmar="Confirmar exclusão" aoConfirmar={excluir} aoCancelar={() => setConfirmando(false)} />
  </>;
}

// Controles locais, sem alterar os componentes usados pelos demais CRUDs.
function AcaoDoDiario({ texto, aoPressionar, bloqueado, claro = false }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: bloqueado }} disabled={bloqueado}
    onPress={aoPressionar} style={[estilos.botao, claro && estilos.botaoClaro, bloqueado && estilos.desabilitado]}>
    <Text style={[estilos.textoBotao, claro && estilos.textoBotaoClaro]}>{texto}</Text>
  </Pressable>;
}
function CampoDoDiario({ rotulo, placeholder, valor, aoMudar, teclado, limite, multilinha = false, bloqueado }) {
  return <View style={estilos.campo}>
    <Text style={estilos.rotulo}>{rotulo}</Text>
    <TextInput accessibilityLabel={rotulo} accessibilityState={{ disabled: bloqueado }} editable={!bloqueado}
      value={valor} onChangeText={aoMudar} placeholder={placeholder} placeholderTextColor="#9a93a3"
      keyboardType={teclado} maxLength={limite} multiline={multilinha}
      style={[estilos.input, multilinha && estilos.inputMultilinha, bloqueado && estilos.desabilitado]} />
  </View>;
}
function CanaisDeAjuda() {
  const [aviso, setAviso] = useState("");
  async function abrir(canal) {
    const numero = canal.numero.replace(/\D/g, "");
    try { await Linking.openURL(`tel:${numero}`); }
    catch { setAviso(`Não foi possível abrir o telefone. Se precisar, disque ${numero} manualmente.`); }
  }
  return <>
    <Text style={estilos.subtitulo}>Ajuda • canais de apoio</Text>
    {canaisAjuda.map((canal) => <CartaoLista key={canal.numero}
      icone={canal.numero === "Ligue 190" ? "shield-checkmark-outline" : "call-outline"}
      titulo={canal.numero} subtitulo={canal.descricao} aoPressionar={() => abrir(canal)} />)}
    {aviso ? <Text style={[estilos.textoApoio, estilos.textoErro]}>{aviso}</Text> : null}
  </>;
}
const estilos = StyleSheet.create({
  titulo: { fontSize: 22, fontWeight: "bold", color: cores.textoEscuro },
  subtitulo: { fontSize: 17, fontWeight: "bold", color: cores.textoEscuro, marginTop: 6 },
  textoApoio: { fontSize: 12, color: cores.textoSuave }, textoErro: { color: cores.perigo },
  botao: { paddingVertical: 13, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: "transparent", backgroundColor: cores.primaria },
  botaoClaro: { backgroundColor: cores.primariaClara }, textoBotao: { fontWeight: "bold", color: "#ffffff" },
  textoBotaoClaro: { color: cores.primaria }, desabilitado: { opacity: 0.5 }, campo: { gap: 6 },
  rotulo: { fontSize: 13, color: cores.textoEscuro },
  input: { height: 42, borderRadius: 10, paddingHorizontal: 12, backgroundColor: "#f6eaee", color: cores.textoEscuro },
  inputMultilinha: { height: 90, paddingVertical: 12, textAlignVertical: "top" },
});
