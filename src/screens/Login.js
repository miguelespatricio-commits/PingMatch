import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  const login = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Completá todos los campos');
      return;
    }
    try {
      setCargando(true);
      await signInWithEmailAndPassword(auth, email, password);
      navigation.navigate('Partidos');
    } catch (error) {
      Alert.alert('Error', 'Email o contraseña incorrectos');
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🏓</Text>
      <Text style={styles.titulo}>PingMatch</Text>

      <View style={styles.campo}>
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} placeholder="tu@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Contraseña</Text>
        <TextInput style={styles.input} placeholder="Tu contraseña" value={password} onChangeText={setPassword} secureTextEntry />
      </View>

      <TouchableOpacity style={styles.boton} onPress={login} disabled={cargando}>
        <Text style={styles.botonTexto}>{cargando ? 'Entrando...' : 'Entrar'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Registro')}>
        <Text style={styles.linkTexto}>¿No tenés cuenta? Registrate</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    paddingTop: 80,
  },
  logo: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 8,
  },
  titulo: {
    fontSize: 28,
    fontWeight: '500',
    color: '#1D9E75',
    textAlign: 'center',
    marginBottom: 40,
  },
  campo: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F7F7F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
  },
  boton: {
    backgroundColor: '#1D9E75',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  botonTexto: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  linkTexto: {
    color: '#1D9E75',
    textAlign: 'center',
    fontSize: 13,
  },
});