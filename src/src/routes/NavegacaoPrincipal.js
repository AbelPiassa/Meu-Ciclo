import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "../pages/Login";
import Cadastro from "../pages/Cadastro";
import Sobre from "../pages/Sobre";
import NavegacaoFachada from "./NavegacaoFachada";
import NavegacaoAreaProtegida from "./NavegacaoAreaProtegida";

const Pilha = createNativeStackNavigator();


export default function NavegacaoPrincipal() {
  return (
    <Pilha.Navigator initialRouteName="Fachada">
      <Pilha.Screen name="Login" component={Login} options={{ headerShown: false }} />
      <Pilha.Screen name="Cadastro" component={Cadastro} options={{ headerShown: false }} />
      <Pilha.Screen name="Fachada" component={NavegacaoFachada} options={{ headerShown: false }} />
      <Pilha.Screen name="Sobre" component={Sobre} />
      <Pilha.Screen name="AreaProtegida" component={NavegacaoAreaProtegida} options={{ headerShown: false }} />
    </Pilha.Navigator>
  );
}
