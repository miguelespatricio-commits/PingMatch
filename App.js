import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Bienvenida from './src/screens/Bienvenida';
import Registro from './src/screens/Registro';
import Login from './src/screens/Login';
import Partidos from './src/screens/Partidos';
import NuevoPartido from './src/screens/NuevoPartido';
import Resultado from './src/screens/Resultado';
import Perfil from './src/screens/Perfil';
import Ranking from './src/screens/Ranking';
import EditarPerfil from './src/screens/EditarPerfil';
import EditarPartido from './src/screens/EditarPartido';
console.log('Ranking importado:', Ranking);

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Bienvenida" component={Bienvenida} />
        <Stack.Screen name="Ranking" component={Ranking} />
        <Stack.Screen name="EditarPerfil" component={EditarPerfil} />
        <Stack.Screen name="EditarPartido" component={EditarPartido} />
        <Stack.Screen name="Registro" component={Registro} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Partidos" component={Partidos} />
        <Stack.Screen name="NuevoPartido" component={NuevoPartido} />
        <Stack.Screen name="Resultado" component={Resultado} />
        <Stack.Screen name="Perfil" component={Perfil} />        
      </Stack.Navigator>
    </NavigationContainer>
  );
}