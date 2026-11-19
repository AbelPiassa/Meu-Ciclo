import { encerrarSessao } from "../services/sessao.js";
import { CommonActions, useNavigation } from "@react-navigation/native";


export default function useSaidaRapida() {
  const navigation = useNavigation();

  return function sairRapido() {
    encerrarSessao();
   
    const pilhaPrincipal = navigation.getParent() ?? navigation;
    pilhaPrincipal.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: "Fachada",
            state: {
              index: 0,
              routes: [
                { name: "Calendario" },
                { name: "HistoricoCiclo" },
                { name: "Configuracoes" },
              ],
            },
          },
        ],
      })
    );
  };
}
