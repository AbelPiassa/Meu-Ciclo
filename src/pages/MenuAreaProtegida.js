import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TelaComRolagem from "../components/TelaComRolagem";
import CartaoLista from "../components/CartaoLista";
import BotaoPrimario from "../components/BotaoPrimario";
import ModalConfirmacao from "../components/ModalConfirmacao";
import useSaidaRapida from "../hooks/useSaidaRapida";
import cores from "../tema/cores";

export default function MenuAreaProtegida({ navigation }) {
  const sairRapido = useSaidaRapida();
  const [confirmandoSaida, setConfirmandoSaida] = useState(false);

  function encerrarSessaoProtegida() {
    // Encerrar sessão nunca dispara SOS.
    setConfirmandoSaida(false);
    sairRapido();
  }

  return (
    <TelaComRolagem
      titulo="Área protegida"
      subtitulo="Você não está sozinha. Aqui você encontra apoio."
    >
      <View style={estilos.ilustracao}>
        <Ionicons name="heart-outline" size={48} color={cores.primaria} />
        <Text style={estilos.textoIlustracao}>Ilustração (placeholder)</Text>
      </View>

      <CartaoLista
        icone="people-outline"
        titulo="Rede de Apoio"
        subtitulo="Seus contatos de confiança"
        aoPressionar={() => navigation.navigate("RedeApoio")}
      />
      <CartaoLista
        icone="document-text-outline"
        titulo="Diário de Ocorrências"
        subtitulo="Registre situações importantes"
        aoPressionar={() => navigation.navigate("DiarioOcorrencias")}
      />
      <CartaoLista
        icone="person-outline"
        titulo="Perfil e Configurações"
        subtitulo="Seus dados e preferências"
        aoPressionar={() => navigation.navigate("Perfil")}
      />
      <CartaoLista
        icone="help-circle-outline"
        titulo="Ajuda"
        subtitulo="Canais de apoio e informações"
        aoPressionar={() => navigation.navigate("CanaisDeAjuda")}
      />

      <CartaoLista
        icone="stats-chart-outline"
        titulo="Indicador acadêmico"
        subtitulo="Padrões históricos de notificações (SINAN)"
        aoPressionar={() => navigation.navigate("IndicadorSinan")}
      />

      <CartaoLista
        icone="alert-circle-outline"
        titulo="SOS de demonstração"
        subtitulo="Enviar alerta fictício à central acadêmica"
        aoPressionar={() => navigation.navigate("SosDemo")}
      />

      <BotaoPrimario texto="Sair rapidamente • sem alerta" variante="contorno" aoPressionar={sairRapido} />
      <BotaoPrimario
        texto="Encerrar sessão protegida"
        variante="contorno"
        aoPressionar={() => setConfirmandoSaida(true)}
      />

      <Text style={estilos.aviso}>
        Protótipo acadêmico: não substitui atendimento policial, jurídico, psicológico ou de saúde.
      </Text>

      <ModalConfirmacao
        visivel={confirmandoSaida}
        titulo="Encerrar sessão protegida?"
        mensagem="Você voltará ao calendário. Nenhum alerta será enviado."
        textoConfirmar="Confirmar saída"
        aoConfirmar={encerrarSessaoProtegida}
        aoCancelar={() => setConfirmandoSaida(false)}
      />
    </TelaComRolagem>
  );
}

const estilos = StyleSheet.create({
  ilustracao: {
    height: 150,
    borderRadius: 16,
    backgroundColor: cores.primariaClara,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  textoIlustracao: {
    fontSize: 12,
    color: cores.primaria,
  },

  aviso: {
    fontSize: 12,
    color: cores.textoSuave,
    textAlign: "center",
  },
});
