import { doc, getDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../config/firebase';

export default function Home({ navigation }) {
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      if (auth.currentUser) {
        const snap = await getDoc(doc(db, 'usuarios', auth.currentUser.uid));
        if (snap.exists()) setPerfil(snap.data());
      }
    };
    cargar();
  }, []);

  if (!perfil) return (
    <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
      <Text>Cargando...</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.saludo}>Hola, {perfil.nombre} 👋</Text>
            <Text style={styles.categoria}>{perfil.categoria}</Text>
          </View>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('Perfil')}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTexto}>
                {perfil.nombre?.charAt(0)}{perfil.apellido?.charAt(0)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.puntosCard}>
          <Text style={styles.puntosNum}>{perfil.puntos || 1500}</Text>
          <Text style={styles.puntosLabel}>puntos de ranking</Text>
        </View>
      </View>

      <Text style={styles.seccionTitulo}>¿Qué querés hacer?</Text>

      <View style={styles.grid}>
        <TouchableOpacity style={[styles.navCard, styles.navCardPrimario]} onPress={() => navigation.navigate('Partidos')}>
          <Text style={styles.navCardIcono}>🏓</Text>
          <Text style={styles.navCardTituloPrimario}>Partidos activos</Text>
          <Text style={styles.navCardDescPrimario}>Ver y unirte a mesas disponibles</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate('NuevoPartido')}>
          <Text style={styles.navCardIcono}>➕</Text>
          <Text style={styles.navCardTitulo}>Crear partida</Text>
          <Text style={styles.navCardDesc}>Convocá un nuevo partido</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate('Ranking')}>
          <Text style={styles.navCardIcono}>🏆</Text>
          <Text style={styles.navCardTitulo}>Ranking</Text>
          <Text style={styles.navCardDesc}>Vé tu posición en el ranking</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate('Perfil')}>
          <Text style={styles.navCardIcono}>📋</Text>
          <Text style={styles.navCardTitulo}>Partidos jugados</Text>
          <Text style={styles.navCardDesc}>Tu historial de partidos</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.barrio}>
        <Text style={styles.barrioTexto}>📍 {perfil.barrio}</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', padding: 24, paddingTop: 60 },
  header: { marginBottom: 32 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  saludo: { fontSize: 24, fontWeight: '500', color: '#333' },
  categoria: { fontSize: 13, color: '#1D9E75', fontWeight: '500', marginTop: 2 },
  avatarBtn: { padding: 4 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1D9E75', alignItems: 'center', justifyContent: 'center' },
  avatarTexto: { color: '#fff', fontSize: 16, fontWeight: '500' },
  puntosCard: { backgroundColor: '#1D9E75', borderRadius: 14, padding: 20, alignItems: 'center' },
  puntosNum: { fontSize: 40, fontWeight: '500', color: '#fff' },
  puntosLabel: { fontSize: 13, color: '#9FE1CB', marginTop: 4 },
  seccionTitulo: { fontSize: 13, fontWeight: '500', color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  navCard: { width: '47%', backgroundColor: '#F7F7F5', borderRadius: 14, padding: 16 },
  navCardPrimario: { width: '100%', backgroundColor: '#E1F5EE', borderWidth: 1, borderColor: '#9FE1CB' },
  navCardIcono: { fontSize: 28, marginBottom: 8 },
  navCardTitulo: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 4 },
  navCardTituloPrimario: { fontSize: 16, fontWeight: '500', color: '#085041', marginBottom: 4 },
  navCardDesc: { fontSize: 12, color: '#999' },
  navCardDescPrimario: { fontSize: 12, color: '#1D9E75' },
  barrio: { alignItems: 'center', paddingTop: 8 },
  barrioTexto: { fontSize: 12, color: '#999' },
});