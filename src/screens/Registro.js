import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export default function Registro({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [categoria, setCategoria] = useState('');
  const [barrio, setBarrio] = useState('');
  const [cargando, setCargando] = useState(false);
  const [verPassword, setVerPassword] = useState(false);
  const [celular, setCelular] = useState('');
  
  const categorias = [
    'Élite', '1ª División', '2ª División', '3ª División',
    '4ª División', '5ª División', '6ª División', '7ª División', '8ª División'
  ];

  const registrar = async () => {
    if (!nombre || !apellido || !email || !password || !categoria || !barrio) {
      Alert.alert('Error', 'Por favor completá todos los campos');
      return;
    }
    try {
      setCargando(true);
      const credencial = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'usuarios', credencial.user.uid), {
        nombre,
        apellido,
        email,
        celular,
        categoria,
        barrio,
        puntos: 1500,
        role: 'jugador',
        estado: categoria === 'Élite' ? 'pendiente' : 'activo',
        creadoEn: new Date(),
      });
      Alert.alert('¡Bienvenid@!', `Hola ${nombre}, tu cuenta fue creada exitosamente.`, [
  { text: 'Entrar', onPress: () => navigation.navigate('Home') }
]);
    } catch (error) {
      let mensaje = 'Ocurrió un error al crear la cuenta.';
      const codigo = error.code || '';
      if (codigo.includes('email-already-in-use')) mensaje = 'Este correo ya está en uso. Probá con otro o iniciá sesión.';
      else if (codigo.includes('invalid-email')) mensaje = 'El correo ingresado no es válido.';
      else if (codigo.includes('weak-password')) mensaje = 'La contraseña debe tener al menos 6 caracteres.';
      Alert.alert('Error', mensaje);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.titulo}>Crear cuenta</Text>

      <View style={styles.campo}>
        <Text style={styles.label}>Nombre</Text>
        <TextInput style={styles.input} placeholder="Tu nombre" value={nombre} onChangeText={setNombre} />
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Apellido</Text>
        <TextInput style={styles.input} placeholder="Tu apellido" value={apellido} onChangeText={setApellido} />
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} placeholder="tu@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      </View>

      <View style={styles.campo}>
  <Text style={styles.label}>Contraseña</Text>
  <View style={styles.passwordRow}>
    <TextInput
      style={styles.inputPassword}
      placeholder="Mínimo 6 caracteres"
      value={password}
      onChangeText={setPassword}
      secureTextEntry={!verPassword}
    />
    <TouchableOpacity style={styles.ojoBtn} onPress={() => setVerPassword(!verPassword)}>
      <Text style={styles.ojoTexto}>{verPassword ? '🙈' : '👁️'}</Text>
    </TouchableOpacity>
  </View>
</View>

      <View style={styles.campo}>
  <Text style={styles.label}>Barrio</Text>
  <TextInput style={styles.input} placeholder="Tu barrio" value={barrio} onChangeText={setBarrio} />
</View>

      <View style={styles.campo}>
  <Text style={styles.label}>Celular (sin 0 ni 15)</Text>
  <View style={styles.celularRow}>
    <View style={styles.prefijo}>
      <Text style={styles.prefijoTexto}>🇦🇷 +54 9</Text>
    </View>
    <TextInput
      style={styles.inputCelular}
      placeholder="11 2345 6789"
      value={celular}
      onChangeText={(v) => setCelular(v.replace(/[^0-9]/g, ''))}
      keyboardType="numeric"
      maxLength={10}
    />
  </View>
  <Text style={styles.celularHint}>Ingresá código de área sin 0 y número sin 15</Text>
</View>

      <View style={styles.campo}>
        <Text style={styles.label}>Categoría</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categorias.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoriaBtn, categoria === cat && styles.categoriaBtnActivo]}
              onPress={() => setCategoria(cat)}
            >
              <Text style={[styles.categoriaBtnTexto, categoria === cat && styles.categoriaBtnTextoActivo]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {categoria === 'Élite' && (
        <View style={styles.avisoElite}>
          <Text style={styles.avisoEliteTexto}>
            ⚠️ La categoría Élite requiere aval de un club. Tu cuenta quedará pendiente hasta ser aprobada.
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.boton} onPress={registrar} disabled={cargando}>
        <Text style={styles.botonTexto}>{cargando ? 'Creando cuenta...' : 'Registrarme'}</Text>
      </TouchableOpacity>

    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 24,
    paddingTop: 60,
  },
  titulo: {
    fontSize: 24,
    fontWeight: '500',
    color: '#1D9E75',
    marginBottom: 24,
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
  categoriaBtn: {
    backgroundColor: '#F7F7F5',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  categoriaBtnActivo: {
    backgroundColor: '#1D9E75',
  },
  categoriaBtnTexto: {
    fontSize: 12,
    color: '#666',
  },
  categoriaBtnTextoActivo: {
    color: '#fff',
    fontWeight: '500',
  },
  avisoElite: {
    backgroundColor: '#FAEEDA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  avisoEliteTexto: {
    fontSize: 12,
    color: '#633806',
    lineHeight: 18,
  },
  boton: {
    backgroundColor: '#1D9E75',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  botonTexto: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  celularRow: {
  flexDirection: 'row',
  gap: 8,
},
prefijo: {
  backgroundColor: '#F7F7F5',
  borderRadius: 8,
  padding: 12,
  justifyContent: 'center',
},
prefijoTexto: {
  fontSize: 14,
  color: '#333',
  fontWeight: '500',
},
inputCelular: {
  flex: 1,
  backgroundColor: '#F7F7F5',
  borderRadius: 8,
  padding: 12,
  fontSize: 14,
  color: '#333',
},
celularHint: {
  fontSize: 11,
  color: '#999',
  marginTop: 4,
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
});