import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { addDoc, collection } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export default function NuevoPartido({ navigation }) {
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [lugar, setLugar] = useState('');
  const [categoria, setCategoria] = useState('');
  const [modalidad, setModalidad] = useState('Singles');
  const [cargando, setCargando] = useState(false);

  const categorias = [
    'Élite', '1ª División', '2ª División', '3ª División',
    '4ª División', '5ª División', '6ª División', '7ª División', '8ª División'
  ];

  const convocar = async () => {
    if (!fecha || !hora || !lugar || !categoria) {
      Alert.alert('Error', 'Por favor completá todos los campos');
      return;
    }
    try {
      setCargando(true);
      await addDoc(collection(db, 'partidos'), {
        fecha,
        hora,
        lugar,
        categoria,
        modalidad,
        convocante: auth.currentUser.uid,
        convocante_nombre: auth.currentUser.email,
        estado: 'abierta',
        creadoEn: new Date(),
      });
      Alert.alert('¡Listo!', 'Tu partido fue publicado.');
      navigation.navigate('Partidos');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.volver}>← Volver</Text>
      </TouchableOpacity>

      <Text style={styles.titulo}>Nuevo partido</Text>

      <View style={styles.campo}>
        <Text style={styles.label}>Modalidad</Text>
        <View style={styles.toggleRow}>
          {['Singles', 'Dobles'].map((mod) => (
            <TouchableOpacity
              key={mod}
              style={[styles.toggleBtn, modalidad === mod && styles.toggleBtnActivo]}
              onPress={() => setModalidad(mod)}
            >
              <Text style={[styles.toggleTexto, modalidad === mod && styles.toggleTextoActivo]}>
                {mod}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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

      <View style={styles.campo}>
        <Text style={styles.label}>Fecha</Text>
        <TextInput style={styles.input} placeholder="Ej: Sáb 7 jun" value={fecha} onChangeText={setFecha} />
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Hora</Text>
        <TextInput style={styles.input} placeholder="Ej: 18:00" value={hora} onChangeText={setHora} />
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Lugar</Text>
        <TextInput style={styles.input} placeholder="Club, dirección, etc." value={lugar} onChangeText={setLugar} />
      </View>

      {modalidad === 'Dobles' && (
        <View style={styles.avisoDobles}>
          <Text style={styles.avisoDoblesTexto}>
            👥 En dobles se necesitan 4 jugadores para cerrar la mesa.
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.boton} onPress={convocar} disabled={cargando}>
        <Text style={styles.botonTexto}>{cargando ? 'Publicando...' : 'Publicar mesa'}</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 24,
    paddingTop: 60,
  },
  volver: {
    color: '#1D9E75',
    fontSize: 14,
    marginBottom: 16,
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
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F7F7F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    backgroundColor: '#F7F7F5',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  toggleBtnActivo: {
    backgroundColor: '#1D9E75',
  },
  toggleTexto: {
    fontSize: 13,
    color: '#666',
  },
  toggleTextoActivo: {
    color: '#fff',
    fontWeight: '500',
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
  avisoDobles: {
    backgroundColor: '#E1F5EE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  avisoDoblesTexto: {
    fontSize: 12,
    color: '#085041',
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
});