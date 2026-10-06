import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Home from '../pages/Home';
import AreaProtegida from '../pages/AreaProtegida';
import Perfil from '../pages/Perfil';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      id="RootStack"
      initialRouteName="Home"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen
        name="Home"
        component={Home}
      />

      <Stack.Screen
        name="AreaProtegida"
        component={AreaProtegida}
      />

      <Stack.Screen
        name="Perfil"
        component={Perfil}
      />
    </Stack.Navigator>
  );
}