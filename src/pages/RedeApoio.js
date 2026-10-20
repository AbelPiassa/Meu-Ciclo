import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import TelaComRolagem from "../components/TelaComRolagem";
import CartaoLista from "../components/CartaoLista";
import CampoTexto from "../components/CampoTexto";
import BotaoPrimario from "../components/BotaoPrimario";
import { contatosApoioFicticios } from "../dados/dadosFicticios";
import cores from "../tema/cores";
import ModalConfirmacao from "../components/ModalConfirmacao";

export default function RedeApoio() {

  const contatoInicial = contatosApoioFicticios[0];

  const [contatoSelecionado, setContatoSelecionado] = useState(contatoInicial);
  const [nome, setNome] = useState(contatoInicial.nome);
  const [tipoContato, setTipoContato] = useState(contatoInicial.relacionamento);
  const [telefone, setTelefone] = useState(contatoInicial.telefone);
  const [contatos, setContatos] = useState(contatosApoioFicticios);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  function selecionarContato(contato) {
    setContatoSelecionado(contato);
    setNome(contato.nome);
    setTipoContato(contato.relacionamento);
    setTelefone(contato.telefone);
  }


  function novoContato() {
    setContatoSelecionado(null);
    setNome("");
    setTipoContato("");
    setTelefone("");
  }


  function cadastrarContato() {

    if (contatoSelecionado !== null) {
      return;
    }

    // Evita cadastrar contatos com campos vazios.
    if (!nome.trim() || !tipoContato.trim() || !telefone.trim()) {
      return;
    }

    const contato = {
      id_contato: Date.now(),
      id_perfil: 1,
      nome: nome.trim(),
      relacionamento: tipoContato.trim(),
      telefone: telefone.trim(),
      alerta_automatico: false,
      observacoes: "",
    };

    setContatos([...contatos, contato]);

    selecionarContato(contato);
  }


  function atualizarContato() {
    if (contatoSelecionado === null) {
      return;
    }

    if (!nome.trim() || !tipoContato.trim() || !telefone.trim()) {
      return;
    }

    const contatoAtualizado = {
      ...contatoSelecionado,
      nome: nome.trim(),
      relacionamento: tipoContato.trim(),
      telefone: telefone.trim(),
    };

    setContatos(contatosAtuais =>
      contatosAtuais.map(contato =>
        contato.id_contato === contatoSelecionado.id_contato
          ? contatoAtualizado
          : contato
      )
    );

    setContatoSelecionado(contatoAtualizado);
  }


  function formatarTelefone(valor) {
    // Remove tudo que não for número e limita a 11 dígitos.
    const numeros = valor.replace(/\D/g, "").slice(0, 11);

    if (numeros.length === 0) {
      return "";
    }

    // Enquanto a pessoa está digitando o DDD.
    if (numeros.length <= 2) {
      return `(${numeros}`;
    }

    const ddd = numeros.slice(0, 2);
    const telefone = numeros.slice(2);

    // Primeiros números depois do DDD.
    if (telefone.length <= 4) {
      return `(${ddd}) ${telefone}`;
    }

    // Telefone fixo: 10 dígitos com DDD.
    if (numeros.length <= 10) {
      return `(${ddd}) ${telefone.slice(0, 4)}-${telefone.slice(4)}`;
    }

    // Celular: 11 dígitos com DDD.
    return `(${ddd}) ${telefone.slice(0, 5)}-${telefone.slice(5)}`;
  }


  function salvarContato() {
    if (contatoSelecionado === null) {
      cadastrarContato();
    } else {
      atualizarContato();
    }
  }


  function solicitarExclusao() {
    // Só permite excluir se houver um contato selecionado.
    if (contatoSelecionado === null) {
      return;
    }

    setConfirmandoExclusao(true);
  }

  function excluirContato() {
    if (contatoSelecionado === null) {
      return;
    }

    // Mantém todos os contatos, exceto o selecionado.
    setContatos((listaAtual) =>
      listaAtual.filter(
        (contato) => contato.id_contato !== contatoSelecionado.id_contato
      )
    );

    // Limpa o formulário e encerra a confirmação.
    novoContato();
    setConfirmandoExclusao(false);
  }



  return (
    <TelaComRolagem>
      <View style={estilos.linhaTitulo}>
        <Text style={estilos.titulo}>Meus contatos</Text>
        <Pressable style={estilos.botaoMais} onPress={novoContato}>
          <Ionicons name="add" size={22} color="#ffffff" />
        </Pressable>
      </View>

      {contatos.map((contato) => (

        <CartaoLista
          key={contato.id_contato}
          icone="person-outline"
          titulo={contato.nome}
          subtitulo={`${contato.relacionamento} • ${contato.telefone}`}
          selecionado={contato.id_contato === contatoSelecionado?.id_contato}
          aoPressionar={() => selecionarContato(contato)}
          direita={
            <View style={estilos.acoes}>
              <Ionicons name="call-outline" size={20} color={cores.primaria} />
              <Ionicons name="chatbubble-outline" size={20} color={cores.primaria} />
            </View>
          }
        />
      ))}

      <Text style={estilos.subtitulo}>Adicionar ou editar contato</Text>
      <Text style={estilos.textoApoio}>Use o mesmo formulário para cadastrar ou alterar.</Text>

      <CampoTexto
        rotulo="Nome"
        placeholder="Ex.: Ana"
        valor={nome} aoMudar={setNome}
      />

      <CampoTexto
        rotulo="Tipo de contato"
        placeholder="Familiar"
        valor={tipoContato}
        aoMudar={setTipoContato}
      />

      <CampoTexto
        rotulo="Telefone"
        placeholder="(00) 00000-0000"
        valor={telefone}
        aoMudar={(texto) => setTelefone(formatarTelefone(texto))}
      />

      <BotaoPrimario
        texto="Salvar contato"
        aoPressionar={salvarContato}
      />
      <BotaoPrimario
        texto="Excluir contato selecionado"
        variante="claro"
        aoPressionar={solicitarExclusao}
      />


      <ModalConfirmacao
        visivel={confirmandoExclusao}
        titulo="Excluir contato?"
        mensagem="Este contato será removido da sua rede de apoio."
        textoConfirmar="Confirmar exclusão"
        aoConfirmar={excluirContato}
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

  acoes: {
    flexDirection: "row",
    gap: 14,
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
});
