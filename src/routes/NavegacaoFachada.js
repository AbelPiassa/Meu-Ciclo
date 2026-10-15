import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import Calendario from "../pages/Calendario";
import HistoricoCiclo from "../pages/HistoricoCiclo";
import Configuracoes from "../pages/Configuracoes";
import cores from "../tema/cores";

const Abas = createBottomTabNavigator();

const ICONES_ABAS = {
  Calendario: "calendar-outline",
  HistoricoCiclo: "time-outline",
  Configuracoes: "settings-outline",
};

// Abas da fachada: o que aparece como um app comum de ciclo menstrual
export default function NavegacaoFachada() {
  return (
    <Abas.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoSuave,
        tabBarStyle: { backgroundColor: cores.cartao },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONES_ABAS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Abas.Screen name="Calendario" component={Calendario} options={{ title: "Calendário" }} />
      <Abas.Screen name="HistoricoCiclo" component={HistoricoCiclo} options={{ title: "Histórico" }} />
      <Abas.Screen name="Configuracoes" component={Configuracoes} options={{ title: "Configurações" }} />
    </Abas.Navigator>
  );
}
