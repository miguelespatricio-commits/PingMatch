import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [verPassword, setVerPassword] = useState(false);

  const login = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Completá todos los campos');
      return;
    }
    try {
      setCargando(true);
      await signInWithEmailAndPassword(auth, email, password);
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Error', 'Email o contraseña incorrectos');
    } finally {
      setCargando(false);
    }
  };

  const olvidéContrasena = async () => {
    if (!email) {
      Alert.alert('Ingresá tu email', 'Escribí tu email arriba y luego tocá "Olvidé mi contraseña".');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Email enviado', `Te enviamos un link a ${email} para restablecer tu contraseña.`);
    } catch (error) {
      Alert.alert('Error', 'No pudimos enviar el email. Verificá que sea correcto.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🏓</Text>
      <Text style={styles.titulo}>PingMatch</Text>

      <View style={styles.campo}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="tu@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Contraseña</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={styles.inputPassword}
            placeholder="Tu contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!verPassword}
          />
          <TouchableOpacity style={styles.ojoBtn} onPress={() => setVerPassword(!verPassword)}>
            <Text style={styles.ojoTexto}>{verPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity onPress={olvidéContrasena} style={styles.olvidéBtn}>
        <Text style={styles.olvidéTexto}>Olvidé mi contraseña</Text>
      </TouchableOpacity>

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
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F5',
    borderRadius: 8,
  },
  inputPassword: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: '#333',
  },
  ojoBtn: {
    padding: 12,
  },
  ojoTexto: {
    fontSize: 18,
  },
  olvidéBtn: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  olvidéTexto: {
    color: '#1D9E75',
    fontSize: 13,
  },
  boton: {
    backgroundColor: '#1D9E75',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
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