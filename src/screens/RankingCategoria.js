import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../config/firebase';

export default function RankingCategoria({ navigation, route }) {
  const { categoria } = route.params;
  const [jugadores, setJugadores] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'usuarios'), orderBy('puntos', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const filtrados = lista.filter(j => j.estado === 'activo' && j.categoria === categoria);
      setJugadores(filtrados);
    });
    return unsub;
  }, [categoria]);

  return (
    <View style={styles.container}>
      <View style={styles.navRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.volver}>← Volver</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.homeBtn}>🏠</Text>
          <Text style={styles.navLabel}>Principal</Text>       
        </TouchableOpacity>
      </View>

      <Text style={styles.titulo}>{categoria}</Text>
      <Text style={styles.subtitulo}>{jugadores.length} jugadores</Text>

      <ScrollView style={styles.lista}>
        {jugadores.length === 0 && (
          <Text style={styles.vacio}>No hay jugadores en esta categoría todavía.</Text>
        )}
        {jugadores.map((jugador, index) => {
          const esYo = jugador.id === auth.currentUser?.uid;
          const medalla = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
          const victorias = jugador.victorias || 0;
          const derrotas = jugador.derrotas || 0;
          return (
            <View key={jugador.id} style={[styles.card, esYo && styles.cardYo]}>
              <View style={styles.posicionContainer}>
                {medalla ? (
                  <Text style={styles.medalla}>{medalla}</Text>
                ) : (
                  <Text style={styles.posicion}>{index + 1}</Text>
                )}
              </View>
              <View style={styles.avatar}>
                <Text style={styles.avatarTexto}>
                  {jugador.nombre?.charAt(0)}{jugador.apellido?.charAt(0)}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.nombre}>
                  {jugador.nombre} {jugador.apellido}
                  {esYo && <Text style={styles.tuBadge}> (vos)</Text>}
                </Text>
                <Text style={styles.barrio}>📍 {jugador.barrio}</Text>
                <Text style={styles.record}>✅ {victorias}V · ❌ {derrotas}D</Text>
              </View>
              <View style={styles.puntosContainer}>
                <Text style={styles.puntos}>{jugador.puntos || 1500}</Text>
                <Text style={styles.puntosLabel}>pts</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, paddingTop: 60 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  volver: { color: '#1D9E75', fontSize: 14 },
  homeBtn: { fontSize: 20 },
  titulo: { fontSize: 24, fontWeight: '500', color: '#1D9E75', marginBottom: 4 },
  subtitulo: { fontSize: 13, color: '#999', marginBottom: 20 },
  lista: { flex: 1 },
  vacio: { color: '#999', textAlign: 'center', marginTop: 40, fontSize: 14 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7F7F5', borderRadius: 12, padding: 12, marginBottom: 8, gap: 10 },
  cardYo: { backgroundColor: '#E1F5EE', borderWidth: 1, borderColor: '#1D9E75' },
  posicionContainer: { width: 28, alignItems: 'center' },
  medalla: { fontSize: 20 },
  posicion: { fontSize: 16, fontWeight: '500', color: '#999' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1D9E75', alignItems: 'center', justifyContent: 'center' },
  avatarTexto: { color: '#fff', fontSize: 14, fontWeight: '500' },
  info: { flex: 1 },
  nombre: { fontSize: 14, fontWeight: '500', color: '#333' },
  tuBadge: { fontSize: 12, color: '#1D9E75', fontWeight: '400' },
  barrio: { fontSize: 11, color: '#999', marginTop: 2 },
  record: { fontSize: 11, color: '#666', marginTop: 2 },
  puntosContainer: { alignItems: 'center' },
  puntos: { fontSize: 18, fontWeight: '500', color: '#1D9E75' },
  puntosLabel: { fontSize: 10, color: '#999' },
  navItem: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
},
navLabel: {
  fontSize: 12,
  color: '#1D9E75',
  fontWeight: '500',
},
});