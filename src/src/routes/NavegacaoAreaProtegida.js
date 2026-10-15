import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MenuAreaProtegida from "../pages/MenuAreaProtegida";
import Perfil from "../pages/Perfil";
import RedeApoio from "../pages/RedeApoio";
import DiarioOcorrencias from "../pages/DiarioOcorrencias";
import CanaisDeAjuda from "../pages/CanaisDeAjuda";
import BotaoSaidaRapida from "../components/BotaoSaidaRapida";
import cores from "../tema/cores";

const Pilha = createNativeStackNavigator();


export default function NavegacaoAreaProtegida() {
  return (
    <Pilha.Navigator
      screenOptions={{
        headerRight: () => <BotaoSaidaRapida />,
        headerStyle: { backgroundColor: cores.fundo },
        headerTintColor: cores.primaria,
        headerTitleStyle: { color: cores.textoEscuro },
        headerShadowVisible: false,
      }}
    >
      <Pilha.Screen name="MenuAreaProtegida" component={MenuAreaProtegida} options={{ title: "Área Protegida", headerShown: false }} />
      <Pilha.Screen name="Perfil" component={Perfil} options={{ title: "Meu Perfil" }} />
      <Pilha.Screen name="RedeApoio" component={RedeApoio} options={{ title: "Rede de Apoio" }} />
      <Pilha.Screen name="DiarioOcorrencias" component={DiarioOcorrencias} options={{ title: "Diário de Ocorrências" }} />
      <Pilha.Screen name="CanaisDeAjuda" component={CanaisDeAjuda} options={{ title: "Canais de Ajuda" }} />
    </Pilha.Navigator>
  );
}
