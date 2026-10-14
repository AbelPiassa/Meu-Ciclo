import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Sobre from "../pages/Sobre";
import NavegacaoFachada from "./NavegacaoFachada";

const Pilha = createNativeStackNavigator();

// Pilha principal: o app abre na Fachada (abas do app de ciclo menstrual)
export default function NavegacaoPrincipal() {
  return (
    <Pilha.Navigator initialRouteName="Fachada">
      <Pilha.Screen name="Fachada" component={NavegacaoFachada} options={{ headerShown: false }} />
      <Pilha.Screen name="Sobre" component={Sobre} />
    </Pilha.Navigator>
  );
}
