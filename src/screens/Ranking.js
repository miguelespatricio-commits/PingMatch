import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../config/firebase';

export default function Ranking({ navigation }) {
  const [jugadores, setJugadores] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarBuscador, setMostrarBuscador] = useState(false);

  const categorias = ['Élite', '1ª División', '2ª División', '3ª División', '4ª División', '5ª División', '6ª División', '7ª División', '8ª División'];

  useEffect(() => {
    const q = query(collection(db, 'usuarios'), orderBy('puntos', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const activos = lista.filter(j => j.estado === 'activo');
      setJugadores(activos);
      const yo = activos.find(j => j.id === auth.currentUser?.uid);
      if (yo && !categoriaSeleccionada) setCategoriaSeleccionada(yo.categoria);
    });
    return unsub;
  }, []);

  const jugadoresFiltrados = jugadores.filter(j => j.categoria === categoriaSeleccionada);

  const resultadosBusqueda = busqueda.length >= 2
    ? jugadores
        .map((j, index) => {
          const jugadoresMismaCategoria = jugadores.filter(x => x.categoria === j.categoria);
          const posicion = jugadoresMismaCategoria.findIndex(x => x.id === j.id) + 1;
          return { ...j, posicionEnCategoria: posicion };
        })
        .filter(j => `${j.nombre} ${j.apellido}`.toLowerCase().includes(busqueda.toLowerCase()))
    : [];

  const cantidadPorCategoria = (cat) => jugadores.filter(j => j.categoria === cat).length;

  return (
    <View style={styles.container}>
      <View style={styles.navRow}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.homeBtn}>🏠</Text>
          <Text style={styles.navLabel}>Principal</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Ranking</Text>
        <TouchableOpacity onPress={() => {
          setMostrarBuscador(!mostrarBuscador);
          setBusqueda('');
        }}>
          <Text style={styles.buscadorBtn}>{mostrarBuscador ? '✕' : '🔍'}</Text>
          <Text style={styles.navLabel}>{mostrarBuscador ? 'Cerrar' : 'Buscar'}</Text>           
        </TouchableOpacity>
      </View>

      {mostrarBuscador ? (
        <View style={styles.buscadorContainer}>
          <TextInput
            style={styles.buscadorInput}
            placeholder="Buscá un jugador por nombre..."
            value={busqueda}
            onChangeText={setBusqueda}
            autoFocus
          />
          {resultadosBusqueda.map((jugador) => {
            const totalPartidos = jugador.partidosJugados || 0;
            const victorias = jugador.victorias || 0;
            const derrotas = jugador.derrotas || 0;
            const winRate = totalPartidos > 0 ? Math.round((victorias / totalPartidos) * 100) : 0;
            return (
              <View key={jugador.id} style={styles.resultadoBusqueda}>
                <View style={styles.resultadoAvatar}>
                  <Text style={styles.resultadoAvatarTexto}>
                    {jugador.nombre?.charAt(0)}{jugador.apellido?.charAt(0)}
                  </Text>
                </View>
                <View style={styles.resultadoInfo}>
                  <Text style={styles.resultadoNombre}>{jugador.nombre} {jugador.apellido}</Text>
                  <Text style={styles.resultadoCategoria}>
                    {jugador.categoria} · Rank: #{jugador.posicionEnCategoria} · {jugador.barrio}
                  </Text>
                  <View style={styles.resultadoStats}>
                    <Text style={styles.resultadoStat}>🏆 {jugador.puntos || 1500} pts</Text>
                    <Text style={styles.resultadoStat}>✅ {victorias}V · ❌ {derrotas}D</Text>
                    {totalPartidos > 0 && <Text style={styles.resultadoStat}>📊 {winRate}% victorias</Text>}
                  </View>
                </View>
              </View>
            );
          })}
          {busqueda.length >= 2 && resultadosBusqueda.length === 0 && (
            <Text style={styles.sinResultados}>No se encontraron jugadores</Text>
          )}
        </View>
      ) : (
        <View style={styles.flex}>
          <View style={styles.categoriasGrid}>
            {categorias.map((cat, index) => {
              const iconos = ['👑', '🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];
              const activo = categoriaSeleccionada === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoriaCard, activo && styles.categoriaCardActiva]}
                  onPress={() => navigation.navigate('RankingCategoria', { categoria: cat })}
                >
                  <Text style={styles.categoriaIcono}>{iconos[index]}</Text>
                  <View style={styles.categoriaCardInfo}>
                    <Text style={[styles.categoriaCardNombre, activo && styles.categoriaCardNombreActivo]}>
                      {cat}
                    </Text>
                    <Text style={[styles.categoriaCardCantidad, activo && styles.categoriaCardCantidadActivo]}>
                      {cantidadPorCategoria(cat)} jugadores
                    </Text>
                  </View>
                  {activo && <Text style={styles.categoriaCheck}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, paddingTop: 60 },
  flex: { flex: 1 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  homeBtn: { fontSize: 20 },
  buscadorBtn: { fontSize: 20 },
  titulo: { fontSize: 24, fontWeight: '500', color: '#1D9E75' },
  categoriasGrid: {
  marginBottom: 16,
},
categoriaCard: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#F7F7F5',
  borderRadius: 12,
  padding: 12,
  marginBottom: 8,
  gap: 12,
},
categoriaCardActiva: {
  backgroundColor: '#E1F5EE',
  borderWidth: 1,
  borderColor: '#1D9E75',
},
categoriaIcono: {
  fontSize: 24,
},
categoriaCardInfo: {
  flex: 1,
},
categoriaCardNombre: {
  fontSize: 15,
  fontWeight: '500',
  color: '#333',
},
categoriaCardNombreActivo: {
  color: '#085041',
},
categoriaCardCantidad: {
  fontSize: 12,
  color: '#999',
  marginTop: 2,
},
categoriaCardCantidadActivo: {
  color: '#1D9E75',
},
categoriaCheck: {
  fontSize: 16,
  color: '#1D9E75',
  fontWeight: '500',
},
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
  buscadorContainer: { flex: 1 },
  buscadorInput: { backgroundColor: '#F7F7F5', borderRadius: 10, padding: 12, fontSize: 14, color: '#333', marginBottom: 12 },
  resultadoBusqueda: { flexDirection: 'row', backgroundColor: '#F7F7F5', borderRadius: 12, padding: 12, marginBottom: 8, gap: 10 },
  resultadoAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1D9E75', alignItems: 'center', justifyContent: 'center' },
  resultadoAvatarTexto: { color: '#fff', fontSize: 16, fontWeight: '500' },
  resultadoInfo: { flex: 1 },
  resultadoNombre: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 2 },
  resultadoCategoria: { fontSize: 12, color: '#1D9E75', marginBottom: 4 },
  resultadoStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  resultadoStat: { fontSize: 11, color: '#666' },
  sinResultados: { textAlign: 'center', color: '#999', marginTop: 20, fontSize: 14 },
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