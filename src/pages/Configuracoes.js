import { useState } from "react";
import { Switch } from "react-native";
import TelaComRolagem from "../components/TelaComRolagem";
import CartaoLista from "../components/CartaoLista";
import { perfilFicticio } from "../dados/dadosFicticios";
import cores from "../tema/cores";

export default function Configuracoes({ navigation }) {
  const [notificacoes, setNotificacoes] = useState(perfilFicticio.notificacoes);

  return (
    <TelaComRolagem titulo="Configurações">
      <CartaoLista
        icone="notifications-outline"
        titulo="Notificações"
        subtitulo="Lembretes de período e ciclo"
        direita={
          <Switch
            value={notificacoes}
            onValueChange={setNotificacoes}
            trackColor={{ true: cores.primaria }}
          />
        }
      />
      <CartaoLista
        icone="moon-outline"
        titulo="Tema"
        subtitulo={perfilFicticio.tema}
        aoPressionar={() => {}}
      />
      <CartaoLista
        icone="lock-closed-outline"
        titulo="Privacidade"
        subtitulo="Configurações do app"
        aoPressionar={() => {}}
      />
      <CartaoLista
        icone="language-outline"
        titulo="Idioma"
        subtitulo="Português (Brasil)"
        aoPressionar={() => {}}
      />
      <CartaoLista
        icone="information-circle-outline"
        titulo="Sobre"
        subtitulo="Versão 1.0.0"
        aoPressionar={() => navigation.navigate("Sobre")}
      />
    </TelaComRolagem>
  );
}
