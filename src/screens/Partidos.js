import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export default function Partidos({ navigation }) {
  const [partidos, setPartidos] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'partidos'), (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPartidos(lista);
    });
    return unsub;
  }, []);

  const unirse = async (partido) => {
    if (partido.estado !== 'abierta') {
      Alert.alert('Mesa cerrada', 'Este partido ya tiene los jugadores necesarios.');
      return;
    }
    if (partido.convocante === auth.currentUser.uid) {
      Alert.alert('Error', 'No podés unirte a tu propio partido.');
      return;
    }
    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'partidos', partido.id), {
        rival: auth.currentUser.uid,
        rival_nombre: auth.currentUser.email,
        estado: 'cerrada',
      });
      Alert.alert('¡Listo!', 'Te uniste al partido.');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Mesas disponibles</Text>

      <ScrollView style={styles.lista}>
        {partidos.length === 0 && (
          <Text style={styles.vacio}>No hay partidos disponibles. ¡Convocá uno!</Text>
        )}
        {partidos.map((partido) => (
          <View key={partido.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitulo}>{partido.convocante_nombre} convoca</Text>
              <View style={[styles.badge, partido.estado === 'abierta' ? styles.badgeAbierta : styles.badgeCerrada]}>
                <Text style={[styles.badgeTexto, partido.estado === 'abierta' ? styles.badgeTextoAbierta : styles.badgeTextoCerrada]}>
                  {partido.estado === 'abierta' ? 'Abierta' : 'Cerrada'}
                </Text>
              </View>
            </View>
            <Text style={styles.cardDetalle}>📅 {partido.fecha} · {partido.hora}</Text>
            <Text style={styles.cardDetalle}>📍 {partido.lugar}</Text>
            <Text style={styles.cardDetalle}>🏓 {partido.categoria} · {partido.modalidad}</Text>
            {partido.estado === 'abierta' && partido.convocante !== auth.currentUser?.uid && (
  <TouchableOpacity style={styles.btnUnirse} onPress={() => unirse(partido)}>
    <Text style={styles.btnUnirseTexto}>¡Me uno!</Text>
  </TouchableOpacity>
)}
{partido.estado === 'cerrada' &&
  (partido.convocante === auth.currentUser?.uid || partido.rival === auth.currentUser?.uid) &&
  !partido.resultado_pendiente && (
  <TouchableOpacity style={styles.btnResultado} onPress={() => navigation.navigate('Resultado', { partido })}>
    <Text style={styles.btnResultadoTexto}>Cargar resultado</Text>
  </TouchableOpacity>
)}
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.btnNuevo} onPress={() => navigation.navigate('NuevoPartido')}>
        <Text style={styles.btnNuevoTexto}>+ Convocar partido</Text>
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
  titulo: {
    fontSize: 24,
    fontWeight: '500',
    color: '#1D9E75',
    marginBottom: 20,
  },
  lista: {
    flex: 1,
  },
  vacio: {
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  card: {
    backgroundColor: '#F7F7F5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitulo: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  badge: {
    borderRadius: 99,
    paddingVertical: 2,
    paddingHorizontal: 10,
  },
  badgeAbierta: {
    backgroundColor: '#E1F5EE',
  },
  badgeCerrada: {
    backgroundColor: '#EEEDFE',
  },
  badgeTexto: {
    fontSize: 11,
    fontWeight: '500',
  },
  badgeTextoAbierta: {
    color: '#085041',
  },
  badgeTextoCerrada: {
    color: '#3C3489',
  },
  cardDetalle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  btnUnirse: {
    backgroundColor: '#1D9E75',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  btnUnirseTexto: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  btnNuevo: {
    backgroundColor: '#1D9E75',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  btnNuevoTexto: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  btnResultado: {
  backgroundColor: '#FAEEDA',
  borderRadius: 8,
  paddingVertical: 8,
  alignItems: 'center',
  marginTop: 8,
},
btnResultadoTexto: {
  color: '#633806',
  fontSize: 13,
  fontWeight: '500',
},
});