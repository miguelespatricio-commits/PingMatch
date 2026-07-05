import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { deleteUser, sendPasswordResetEmail } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../config/firebase';

export default function EditarPerfil({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [barrio, setBarrio] = useState('');
  const [celular, setCelular] = useState('');
  const [email, setEmail] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      const snap = await getDoc(doc(db, 'usuarios', auth.currentUser.uid));
      if (snap.exists()) {
        const data = snap.data();
        setNombre(data.nombre || '');
        setApellido(data.apellido || '');
        setBarrio(data.barrio || '');
        setCelular(data.celular || '');
        setEmail(data.email || auth.currentUser.email || '');
    }
      setCargandoDatos(false);
    };
    cargar();
  }, []);

  const guardar = async () => {
    if (!nombre || !apellido || !barrio) {
      Alert.alert('Error', 'Completá todos los campos obligatorios');
      return;
    }
    try {
      setCargando(true);
      await updateDoc(doc(db, 'usuarios', auth.currentUser.uid), {
        nombre,
        apellido,
        barrio,
        celular,
      });
      Alert.alert('¡Listo!', 'Tus datos fueron actualizados.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setCargando(false);
    }
  };
  const cambiarContrasena = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Email enviado', `Te enviamos un link a ${email} para cambiar tu contraseña.`);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };
  const eliminarCuenta = () => {
    Alert.alert(
      'Eliminar cuenta',
      'Esta acción es permanente. Se borrará tu perfil y no podrás acceder a tus partidos. ¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar definitivamente',
          style: 'destructive',
          onPress: async () => {
            try {
              setCargando(true);
              const uid = auth.currentUser.uid;
              await deleteDoc(doc(db, 'usuarios', uid));
              await deleteUser(auth.currentUser);
              navigation.reset({ index: 0, routes: [{ name: 'Bienvenida' }] });
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la cuenta. ' + error.message);
            } finally {
              setCargando(false);
            }
          }
        }
      ]
    );
  };

  if (cargandoDatos) return null;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.volver}>← Volver</Text>
        </TouchableOpacity>

        <Text style={styles.titulo}>Editar perfil</Text>

        <View style={styles.campo}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput style={styles.input} value={nombre} onChangeText={setNombre} />
        </View>

        <View style={styles.campo}>
          <Text style={styles.label}>Apellido</Text>
          <TextInput style={styles.input} value={apellido} onChangeText={setApellido} />
        </View>
        
        <View style={styles.campo}>
          <Text style={styles.label}>Email (no editable)</Text>
          <View style={styles.inputDisabled}>
            <Text style={styles.inputDisabledTexto}>{email}</Text>
          </View>
        </View>

        <View style={styles.campo}>
          <Text style={styles.label}>Barrio</Text>
          <TextInput style={styles.input} value={barrio} onChangeText={setBarrio} />
        </View>

        <View style={styles.campo}>
          <Text style={styles.label}>Celular (sin 0 ni 15)</Text>
          <View style={styles.celularRow}>
            <View style={styles.prefijo}>
              <Text style={styles.prefijoTexto}>🇦🇷 +54 9</Text>
            </View>
            <TextInput
              style={styles.inputCelular}
              value={celular}
              onChangeText={(v) => setCelular(v.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>
        </View>

        <View style={styles.avisoCategoria}>
          <Text style={styles.avisoCategoriaTexto}>
            ℹ️ La categoría no se puede editar directamente. Si necesitás un cambio, contactá al administrador.
          </Text>
        </View>

        <TouchableOpacity style={styles.boton} onPress={guardar} disabled={cargando}>
          <Text style={styles.botonTexto}>{cargando ? 'Guardando...' : 'Guardar cambios'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnContrasena} onPress={cambiarContrasena}>
          <Text style={styles.btnContrasenaTexto}>Cambiar contraseña</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnEliminar} onPress={eliminarCuenta} disabled={cargando}>
          <Text style={styles.btnEliminarTexto}>Eliminar mi cuenta</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', padding: 24, paddingTop: 60 },
  volver: { color: '#1D9E75', fontSize: 14, marginBottom: 16 },
  titulo: { fontSize: 24, fontWeight: '500', color: '#1D9E75', marginBottom: 24 },
  campo: { marginBottom: 16 },
  label: { fontSize: 12, color: '#999', marginBottom: 4 },
  input: { backgroundColor: '#F7F7F5', borderRadius: 8, padding: 12, fontSize: 14, color: '#333' },
  celularRow: { flexDirection: 'row', gap: 8 },
  prefijo: { backgroundColor: '#F7F7F5', borderRadius: 8, padding: 12, justifyContent: 'center' },
  prefijoTexto: { fontSize: 14, color: '#333', fontWeight: '500' },
  inputCelular: { flex: 1, backgroundColor: '#F7F7F5', borderRadius: 8, padding: 12, fontSize: 14, color: '#333' },
  avisoCategoria: { backgroundColor: '#E1F5EE', borderRadius: 8, padding: 12, marginBottom: 16 },
  avisoCategoriaTexto: { fontSize: 12, color: '#085041', lineHeight: 18 },
  boton: { backgroundColor: '#1D9E75', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8, marginBottom: 12 },
  botonTexto: { color: '#fff', fontSize: 15, fontWeight: '500' },
  btnEliminar: { borderWidth: 0.5, borderColor: '#A32D2D', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  btnEliminarTexto: { color: '#A32D2D', fontSize: 14, fontWeight: '500' },
  inputDisabled: {
  backgroundColor: '#eee',
  borderRadius: 8,
  padding: 12,
},
inputDisabledTexto: {
  fontSize: 14,
  color: '#999',
},
btnContrasena: {
  borderWidth: 0.5,
  borderColor: '#ccc',
  borderRadius: 10,
  paddingVertical: 14,
  alignItems: 'center',
  marginBottom: 12,
},
btnContrasenaTexto: {
  color: '#666',
  fontSize: 14,
},
});