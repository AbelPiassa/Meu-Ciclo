import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import NavegacaoPrincipal from './src/routes/NavegacaoPrincipal';
import { CiclosProvider } from './src/contextos/CiclosContext';

export default function App() {
  return (
    <View style={styles.container}>
      <CiclosProvider>
        <NavigationContainer>
          <NavegacaoPrincipal />
        </NavigationContainer>
      </CiclosProvider>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
