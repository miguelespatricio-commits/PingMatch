import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../config/firebase';

export default function Perfil({ navigation }) {
  const [perfil, setPerfil] = useState(null);
  const [historial, setHistorial] = useState([]);

  useEffect(() => {
    const cargarPerfil = async () => {
      if (auth.currentUser) {
        const snap = await getDoc(doc(db, 'usuarios', auth.currentUser.uid));
        if (snap.exists()) setPerfil(snap.data());
      }
    };
    cargarPerfil();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    const q1 = query(collection(db, 'partidos'), where('convocante', '==', uid), where('resultado_confirmado', '==', true));
    const q2 = query(collection(db, 'partidos'), where('rival', '==', uid), where('resultado_confirmado', '==', true));

    const unsub1 = onSnapshot(q1, (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setHistorial(prev => {
        const ids = prev.map(p => p.id);
        const nuevos = lista.filter(p => !ids.includes(p.id));
        return [...prev.filter(p => lista.find(l => l.id === p.id) || p.rival === uid), ...nuevos];
      });
    });

    const unsub2 = onSnapshot(q2, (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setHistorial(prev => {
        const ids = prev.map(p => p.id);
        const nuevos = lista.filter(p => !ids.includes(p.id));
        return [...prev.filter(p => lista.find(l => l.id === p.id) || p.convocante === uid), ...nuevos];
      });
    });

    return () => { unsub1(); unsub2(); };
  }, []);

  const cerrarSesion = () => {
    auth.signOut();
    navigation.navigate('Bienvenida');
  };

  if (!perfil) return (
    <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
      <Text>Cargando...</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>
            {perfil.nombre?.charAt(0)}{perfil.apellido?.charAt(0)}
          </Text>
        </View>
        <Text style={styles.nombre}>{perfil.nombre} {perfil.apellido}</Text>
        <Text style={styles.categoria}>{perfil.categoria}</Text>
        <Text style={styles.barrio}>📍 {perfil.barrio}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{historial.length}</Text>
          <Text style={styles.statLabel}>Partidos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>
            {historial.filter(p => p.ganador === auth.currentUser?.uid).length}
          </Text>
          <Text style={styles.statLabel}>Ganados</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{perfil.puntos || 1500}</Text>
          <Text style={styles.statLabel}>Puntos</Text>
        </View>
      </View>

      <Text style={styles.seccionTitulo}>Historial de partidos</Text>

      {historial.length === 0 && (
        <Text style={styles.vacio}>Todavía no jugaste ningún partido por ranking.</Text>
      )}

      {historial.map((partido) => {
        const fueConvocante = partido.convocante === auth.currentUser?.uid;
        const misSets = fueConvocante ? partido.sets_convocante : partido.sets_rival;
        const setRival = fueConvocante ? partido.sets_rival : partido.sets_convocante;
        const rivalNombre = fueConvocante ? partido.rival_nombre : partido.convocante_nombre;
        const gane = partido.ganador === auth.currentUser?.uid;

        return (
          <View key={partido.id} style={styles.historialCard}>
            <View style={styles.historialHeader}>
              <Text style={styles.historialFecha}>📅 {partido.fecha} · {partido.hora}</Text>
              <View style={[styles.badge, gane ? styles.badgeGanado : styles.badgePerdido]}>
                <Text style={[styles.badgeTexto, gane ? styles.badgeTextoGanado : styles.badgeTextoPerdido]}>
                  {gane ? 'Victoria' : 'Derrota'}
                </Text>
              </View>
            </View>
            <Text style={styles.historialRival}>vs {rivalNombre}</Text>
            <Text style={styles.historialScore}>{misSets} - {setRival}</Text>
            <Text style={styles.historialLugar}>📍 {partido.lugar}</Text>
          </View>
        );
      })}

      <TouchableOpacity style={styles.btnSalir} onPress={cerrarSesion}>
        <Text style={styles.btnSalirTexto}>Cerrar sesión</Text>
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
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1D9E75',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarTexto: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '500',
  },
  nombre: {
    fontSize: 20,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  categoria: {
    fontSize: 14,
    color: '#1D9E75',
    fontWeight: '500',
    marginBottom: 4,
  },
  barrio: {
    fontSize: 13,
    color: '#999',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F7F7F5',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 22,
    fontWeight: '500',
    color: '#1D9E75',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  seccionTitulo: {
    fontSize: 13,
    fontWeight: '500',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  vacio: {
    color: '#999',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 20,
  },
  historialCard: {
    backgroundColor: '#F7F7F5',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  historialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historialFecha: {
    fontSize: 11,
    color: '#999',
  },
  historialRival: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  historialScore: {
    fontSize: 20,
    fontWeight: '500',
    color: '#1D9E75',
    marginBottom: 4,
  },
  historialLugar: {
    fontSize: 11,
    color: '#999',
  },
  badge: {
    borderRadius: 99,
    paddingVertical: 2,
    paddingHorizontal: 10,
  },
  badgeGanado: {
    backgroundColor: '#E1F5EE',
  },
  badgePerdido: {
    backgroundColor: '#FCEBEB',
  },
  badgeTexto: {
    fontSize: 11,
    fontWeight: '500',
  },
  badgeTextoGanado: {
    color: '#085041',
  },
  badgeTextoPerdido: {
    color: '#A32D2D',
  },
  btnSalir: {
    borderWidth: 0.5,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  btnSalirTexto: {
    color: '#999',
    fontSize: 15,
  },
});