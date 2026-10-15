import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TelaComRolagem from "../components/TelaComRolagem";
import CartaoLista from "../components/CartaoLista";
import CampoTexto from "../components/CampoTexto";
import BotaoPrimario from "../components/BotaoPrimario";
import { contatosApoioFicticios } from "../dados/dadosFicticios";
import cores from "../tema/cores";

export default function RedeApoio() {
  const [contatoSelecionado, setContatoSelecionado] = useState(contatosApoioFicticios[0]);
  const [nome, setNome] = useState("");
  const [tipoContato, setTipoContato] = useState("");
  const [telefone, setTelefone] = useState("");

  return (
    <TelaComRolagem>
      <View style={estilos.linhaTitulo}>
        <Text style={estilos.titulo}>Meus contatos</Text>
        <Pressable style={estilos.botaoMais}>
          <Ionicons name="add" size={22} color="#ffffff" />
        </Pressable>
      </View>

      {contatosApoioFicticios.map((contato) => (
        <CartaoLista
          key={contato.id_contato}
          icone="person-outline"
          titulo={contato.nome}
          subtitulo={`${contato.relacionamento} • ${contato.telefone}`}
          selecionado={contato.id_contato === contatoSelecionado?.id_contato}
          aoPressionar={() => setContatoSelecionado(contato)}
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

      <CampoTexto rotulo="Nome" placeholder="Ex.: Ana" valor={nome} aoMudar={setNome} />
      <CampoTexto rotulo="Tipo de contato" placeholder="Familiar" valor={tipoContato} aoMudar={setTipoContato} />
      <CampoTexto rotulo="Telefone" placeholder="(00) 00000-0000" valor={telefone} aoMudar={setTelefone} />

      <BotaoPrimario texto="Salvar contato" />
      <BotaoPrimario texto="Excluir contato selecionado" variante="claro" />
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
