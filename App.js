import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import NavegacaoPrincipal from './src/routes/NavegacaoPrincipal';

export default function App() {
  return (
    <View style={styles.container}>
      <NavigationContainer>
        <NavegacaoPrincipal />
      </NavigationContainer>
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
