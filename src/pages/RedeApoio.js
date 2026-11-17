import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import TelaComRolagem from "../components/TelaComRolagem";
import CartaoLista from "../components/CartaoLista";
import CampoTexto from "../components/CampoTexto";
import BotaoPrimario from "../components/BotaoPrimario";
import ModalConfirmacao from "../components/ModalConfirmacao";
import cores from "../tema/cores";
import { formatarTelefone, telefoneValido } from "../utils/telefoneRedeApoio";
import { listarContatos, criarContato, atualizarContato, excluirContato } from "../servicos/contatosApi";

export default function RedeApoio() {
  const [contatos, setContatos] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const [nome, setNome] = useState("");
  const [relacionamento, setRelacionamento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState(false);
  const [falhouLista, setFalhouLista] = useState(false);
  const ativo = useRef(false);
  const versao = useRef(0);

  const limpar = useCallback(() => {
    setSelecionado(null);
    setNome("");
    setRelacionamento("");
    setTelefone("");
  }, []);

  // GET: carrega os contatos da API. Não usa mais dadosFicticios.js.
  const carregar = useCallback(async () => {
    const inicio = versao.current;
    setCarregando(true);
    setFalhouLista(false);
    try {
      const lista = await listarContatos();
      if (ativo.current && inicio === versao.current) {
        setContatos(lista);
        setMensagem("");
        setErro(false);
      }
    } catch (falha) {
      if (ativo.current && inicio === versao.current) {
        setContatos([]);
        setMensagem(falha.message);
        setErro(true);
        setFalhouLista(true);
      }
    } finally {
      if (ativo.current && inicio === versao.current) setCarregando(false);
    }
  }, []);

  // Ao sair desta tela, esconde a lista e limpa o formulário.
  useFocusEffect(useCallback(() => {
    ativo.current = true;
    versao.current += 1;
    setContatos([]);
    carregar();
    return () => {
      ativo.current = false;
      versao.current += 1;
      setContatos([]);
      limpar();
      setMensagem("");
      setConfirmando(false);
    };
  }, [carregar, limpar]));

  function selecionar(contato) {
    if (salvando) return;
    setSelecionado(contato);
    setNome(contato.nome);
    setRelacionamento(contato.relacionamento);
    setTelefone(formatarTelefone(contato.telefone));
    setMensagem("");
  }

  // POST para criar; PUT para editar. Depois, GET para atualizar a lista.
  async function salvar() {
    if (salvando || carregando) return;
    if (!nome.trim() || !relacionamento.trim() || !telefone.trim()) {
      setMensagem("Preencha nome, tipo de contato e telefone.");
      setErro(true);
      return;
    }
    if (!telefoneValido(telefone)) {
      setMensagem("Informe telefone com DDD e 10 ou 11 dígitos.");
      setErro(true);
      return;
    }
    const atual = versao.current;
    const dados = {
      nome, relacionamento, telefone,
      alerta_automatico: selecionado?.alerta_automatico ?? false,
      observacoes: selecionado?.observacoes ?? "",
    };
    setSalvando(true);
    try {
      const resposta = selecionado
        ? await atualizarContato(selecionado.id_contato, dados)
        : await criarContato(dados);
      const lista = await listarContatos();
      if (!ativo.current || atual !== versao.current) return;
      setContatos(lista);
      const salvo = lista.find(item => item.id_contato === resposta.id_contato);
      if (salvo) {
        setSelecionado(salvo);
        setNome(salvo.nome);
        setRelacionamento(salvo.relacionamento);
        setTelefone(formatarTelefone(salvo.telefone));
      }
      setMensagem(selecionado ? "Contato atualizado." : "Contato cadastrado.");
      setErro(false);
    } catch (falha) {
      if (ativo.current && atual === versao.current) {
        setMensagem(falha.message);
        setErro(true);
      }
    } finally {
      if (ativo.current && atual === versao.current) setSalvando(false);
    }
  }

  // DELETE exige confirmação antes de chamar a API.
  async function remover() {
    if (!selecionado || salvando) return;
    const atual = versao.current;
    setSalvando(true);
    try {
      await excluirContato(selecionado.id_contato);
      const lista = await listarContatos();
      if (!ativo.current || atual !== versao.current) return;
      setContatos(lista);
      limpar();
      setMensagem("Contato excluído.");
      setErro(false);
    } catch (falha) {
      if (ativo.current && atual === versao.current) {
        setMensagem(falha.message);
        setErro(true);
      }
    } finally {
      if (ativo.current && atual === versao.current) {
        setSalvando(false);
        setConfirmando(false);
      }
    }
  }

  return (
    <TelaComRolagem>
      <View style={estilos.linhaTitulo}>
        <Text style={estilos.titulo}>Meus contatos</Text>
        <Pressable
          style={estilos.botaoMais}
          accessibilityRole="button"
          accessibilityLabel="Novo contato"
          onPress={() => { limpar(); setMensagem(""); }}
        >
          <Ionicons name="add" size={22} color="#ffffff" />
        </Pressable>
      </View>

      {carregando && (
        <View style={estilos.status}>
          <ActivityIndicator color={cores.primaria} />
          <Text style={estilos.textoApoio}>Carregando contatos...</Text>
        </View>
      )}
      {!carregando && contatos.length === 0 && !falhouLista && (
        <Text style={estilos.textoApoio}>Nenhum contato cadastrado.</Text>
      )}
      {!carregando && contatos.map(contato => (
        <CartaoLista
          key={contato.id_contato}
          icone="person-outline"
          titulo={contato.nome}
          subtitulo={`${contato.relacionamento} • ${formatarTelefone(contato.telefone)}`}
          selecionado={contato.id_contato === selecionado?.id_contato}
          aoPressionar={() => selecionar(contato)}
        />
      ))}
      {falhouLista && !carregando && (
        <BotaoPrimario texto="Tentar novamente" variante="claro" aoPressionar={carregar} />
      )}

      <Text style={estilos.subtitulo}>Adicionar ou editar contato</Text>
      <Text style={estilos.textoApoio}>Demonstração acadêmica: utilize apenas dados fictícios.</Text>
      <CampoTexto rotulo="Nome" placeholder="Ex.: Ana" valor={nome} aoMudar={setNome} />
      <CampoTexto rotulo="Tipo de contato" placeholder="Ex.: Familiar" valor={relacionamento} aoMudar={setRelacionamento} />
      <CampoTexto
        rotulo="Telefone" placeholder="(11) 99999-9999" valor={telefone}
        aoMudar={valor => setTelefone(formatarTelefone(valor))}
        teclado="phone-pad" limiteCaracteres={15}
      />
      <BotaoPrimario texto={salvando ? "Salvando..." : "Salvar contato"} aoPressionar={salvar} />
      <BotaoPrimario texto="Excluir contato selecionado" variante="claro" aoPressionar={() => {
        if (selecionado && !salvando) setConfirmando(true);
        else if (!selecionado) { setMensagem("Selecione um contato para excluir."); setErro(true); }
      }} />

      {Boolean(mensagem) && (
        <Text accessibilityLiveRegion="polite" style={[estilos.textoApoio, erro && estilos.textoErro]}>{mensagem}</Text>
      )}
      <ModalConfirmacao
        visivel={confirmando} titulo="Excluir contato?"
        mensagem="O contato selecionado será removido da Rede de Apoio."
        textoConfirmar="Confirmar exclusão" aoConfirmar={remover}
        aoCancelar={() => setConfirmando(false)}
      />
    </TelaComRolagem>
  );
}

const estilos = StyleSheet.create({
  linhaTitulo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  titulo: { fontSize: 22, fontWeight: "bold", color: cores.textoEscuro },
  botaoMais: { width: 44, height: 36, borderRadius: 10, backgroundColor: cores.primaria, alignItems: "center", justifyContent: "center" },
  status: { alignItems: "center", paddingVertical: 12, gap: 8 },
  subtitulo: { fontSize: 17, fontWeight: "bold", color: cores.textoEscuro, marginTop: 6 },
  textoApoio: { fontSize: 12, color: cores.textoSuave },
  textoErro: { color: cores.perigo },
});
