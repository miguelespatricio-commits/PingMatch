import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export default function Resultado({ navigation, route }) {
  const { partido } = route.params;
  const [sets_convocante, setSetsConvocante] = useState('');
  const [sets_rival, setSetsRival] = useState('');
  const [cargando, setCargando] = useState(false);

  const esConvocante = auth.currentUser.uid === partido.convocante;

  const cargarResultado = async () => {
    if (!sets_convocante || !sets_rival) {
      Alert.alert('Error', 'Completá el resultado');
      return;
    }
    try {
      setCargando(true);
      const ganador = parseInt(sets_convocante) > parseInt(sets_rival)
        ? partido.convocante
        : partido.rival;

      await updateDoc(doc(db, 'partidos', partido.id), {
        sets_convocante: parseInt(sets_convocante),
        sets_rival: parseInt(sets_rival),
        ganador,
        resultado_pendiente: true,
      });
      Alert.alert('¡Listo!', 'Resultado cargado. Esperando confirmación del rival.');
      navigation.navigate('Partidos');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.volver}>← Volver</Text>
      </TouchableOpacity>

      <Text style={styles.titulo}>Cargar resultado</Text>

      <View style={styles.card}>
        <View style={styles.jugadorRow}>
          <Text style={styles.jugadorNombre}>{partido.convocante_nombre}</Text>
          <TextInput
            style={styles.scoreInput}
            placeholder="0"
            value={sets_convocante}
            onChangeText={setSetsConvocante}
            keyboardType="numeric"
            maxLength={1}
          />
        </View>

        <Text style={styles.vs}>vs</Text>

        <View style={styles.jugadorRow}>
          <Text style={styles.jugadorNombre}>{partido.rival_nombre}</Text>
          <TextInput
            style={styles.scoreInput}
            placeholder="0"
            value={sets_rival}
            onChangeText={setSetsRival}
            keyboardType="numeric"
            maxLength={1}
          />
        </View>
      </View>

      <View style={styles.aviso}>
        <Text style={styles.avisoTexto}>
          ✅ Ambos jugadores deben confirmar el resultado para que se actualice el ranking.
        </Text>
      </View>

      <TouchableOpacity style={styles.boton} onPress={cargarResultado} disabled={cargando}>
        <Text style={styles.botonTexto}>{cargando ? 'Guardando...' : 'Enviar resultado'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  card: {
    backgroundColor: '#F7F7F5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  jugadorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  jugadorNombre: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  scoreInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: 48,
    height: 48,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '500',
    color: '#333',
    borderWidth: 0.5,
    borderColor: '#ddd',
  },
  vs: {
    textAlign: 'center',
    color: '#999',
    fontSize: 13,
    paddingVertical: 4,
  },
  aviso: {
    backgroundColor: '#E1F5EE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  avisoTexto: {
    fontSize: 12,
    color: '#085041',
    lineHeight: 18,
  },
  boton: {
    backgroundColor: '#1D9E75',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  botonTexto: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
});