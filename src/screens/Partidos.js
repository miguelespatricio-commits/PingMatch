import * as Linking from 'expo-linking';
import { collection, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../config/firebase';

export default function Partidos({ navigation }) {
  const insets = useSafeAreaInsets();
  const [partidosBase, setPartidosBase] = useState([]);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroCategoriaActivo, setFiltroCategoriaActivo] = useState('Todas');
  const [filtroModalidad, setFiltroModalidad] = useState('Todas');
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [filtroZona, setFiltroZona] = useState('');
  const [mostrarDropdownCat, setMostrarDropdownCat] = useState(false);
  const [filtrosPendientes, setFiltrosPendientes] = useState({
    categoria: 'Todas', modalidad: 'Todas', tipo: 'Todos', zona: ''
  });
  const [partidos, setPartidos] = useState([]);
  const [miCategoria, setMiCategoria] = useState('');

  useEffect(() => {
    const cargarPerfil = async () => {
      if (auth.currentUser) {
        const snap = await getDoc(doc(db, 'usuarios', auth.currentUser.uid));
        if (snap.exists()) setMiCategoria(snap.data().categoria);
      }
    };
    cargarPerfil();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'partidos'), (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sinTerminados = lista.filter(partido => !partido.resultado_confirmado);
      const listaFiltrada = sinTerminados.filter(partido => {
        if (!partido.filtro_categoria) return true;
        if (partido.filtro_categoria === 'Cualquiera') return true;
        if (partido.filtro_categoria === 'Solo mi categoría') return partido.categoria === miCategoria;
        if (partido.filtro_categoria === 'Mi categoría o superior') return true;
        return true;
      });
      setPartidosBase(listaFiltrada);
    });
    return unsub;
  }, [miCategoria]);

  const partidosFiltrados = partidosBase.filter(p => {
    if (filtroCategoriaActivo !== 'Todas' && p.categoria !== filtroCategoriaActivo) return false;
    if (filtroModalidad !== 'Todas' && p.modalidad !== filtroModalidad) return false;
    if (filtroTipo !== 'Todos' && p.tipo !== filtroTipo) return false;
    if (filtroZona && !p.lugar?.toLowerCase().includes(filtroZona.toLowerCase())) return false;
    return true;
  });

  const unirse = async (partido) => {
    if (!auth.currentUser) {
      Alert.alert('Error', 'Tu sesión expiró. Por favor volvé a iniciar sesión.');
      navigation.navigate('Login');
      return;
    }
    if (partido.estado !== 'abierta') {
      Alert.alert('Mesa cerrada', 'Este partido ya tiene los jugadores necesarios.');
      return;
    }
    if (partido.convocante === auth.currentUser.uid) {
      Alert.alert('Error', 'No podés unirte a tu propio partido.');
      return;
    }
    if (partido.filtro_categoria && partido.filtro_categoria !== 'Cualquiera') {
      const categorias = ['Élite', '1ª División', '2ª División', '3ª División', '4ª División', '5ª División', '6ª División', '7ª División', '8ª División'];
      const indexMio = categorias.indexOf(miCategoria);
      const indexPartido = categorias.indexOf(partido.categoria);
      if (partido.filtro_categoria === 'Solo mi categoría' && partido.categoria !== miCategoria) {
        Alert.alert('No podés unirte', 'Esta mesa es solo para jugadores de ' + partido.categoria);
        return;
      }
      if (partido.filtro_categoria === 'Mi categoría o superior' && indexMio > indexPartido) {
        Alert.alert('No podés unirte', 'Esta mesa es para jugadores de ' + partido.categoria + ' o superior.');
        return;
      }
    }
    Alert.alert(
      'Confirmar partido',
      'Estás por sumarte a este partido. Recordá que es un compromiso presentarte a jugar.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => confirmarUnion(partido) }
      ]
    );
  };

  const confirmarUnion = async (partido) => {
    if (partido.modalidad === 'Dobles') {
      const jugadoresActuales = [partido.convocante, partido.rival1, partido.rival2, partido.rival3].filter(Boolean).length;
      if (jugadoresActuales >= 4) {
        Alert.alert('Mesa llena', 'Esta mesa de dobles ya tiene 4 jugadores.');
        return;
      }
      const snap = await getDoc(doc(db, 'usuarios', auth.currentUser.uid));
      const perfil = snap.data();
      const campoRival = !partido.rival1 ? 'rival1' : !partido.rival2 ? 'rival2' : 'rival3';
      const totalDespues = jugadoresActuales + 1;
      await updateDoc(doc(db, 'partidos', partido.id), {
        [campoRival]: auth.currentUser.uid,
        [campoRival + '_nombre']: perfil.nombre + ' ' + perfil.apellido,
        [campoRival + '_celular']: perfil.celular || '',
        estado: totalDespues >= 4 ? 'cerrada' : 'abierta',
      });
      Alert.alert('¡Listo!', totalDespues >= 4 ? 'Mesa completa, ya son 4 jugadores.' : `Te sumaste. Faltan ${4 - totalDespues} jugadores más.`);
      return;
    }
    try {
      const snap = await getDoc(doc(db, 'usuarios', auth.currentUser.uid));
      const perfil = snap.data();
      await updateDoc(doc(db, 'partidos', partido.id), {
        rival: auth.currentUser.uid,
        rival_nombre: perfil.nombre + ' ' + perfil.apellido,
        rival_celular: perfil.celular || '',
        estado: 'cerrada',
      });
      Alert.alert('¡Listo!', 'Te uniste al partido.');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const contactarWhatsApp = (numero, nombre, partido) => {
    if (!numero) {
      Alert.alert('Sin número', 'El jugador no registró su número de celular.');
      return;
    }
    const numeroLimpio = numero.replace(/[^0-9]/g, '').replace(/^0/, '');
    const miNombre = partido.convocante === auth.currentUser?.uid ? partido.convocante_nombre : partido.rival_nombre;
    const mensaje = encodeURIComponent(
      `Hola ${nombre}, soy ${miNombre} 👋\n\n` +
      `Te escribo por nuestro partido en PingMatch 🏓\n\n` +
      `📅 ${partido.fecha} a las ${partido.hora}\n` +
      `📍 ${partido.lugar}\n` +
      `🏓 ${partido.modalidad} · ${partido.tipo}`
    );
    Linking.openURL(`whatsapp://send?phone=549${numeroLimpio}&text=${mensaje}`).catch(() => {
      Alert.alert('Error', 'No se pudo abrir WhatsApp. Verificá que esté instalado.');
    });
  };

  const cancelarPartido = async (partido) => {
    const ahora = new Date();
    const fechaPartido = partido.fechaHora?.toDate ? partido.fechaHora.toDate() : null;
    const menosde24hs = fechaPartido && (fechaPartido - ahora) < 24 * 60 * 60 * 1000;
    const esConvocante = auth.currentUser?.uid === partido.convocante;

    if (partido.estado === 'abierta') {
      Alert.alert('Cancelar partido', '¿Confirmás que querés cancelar esta mesa?', [
        { text: 'No', style: 'cancel' },
        { text: 'Sí, cancelar', style: 'destructive', onPress: async () => {
          await updateDoc(doc(db, 'partidos', partido.id), { estado: 'cancelada', resultado_confirmado: true });
        }}
      ]);
      return;
    }

    if (partido.estado === 'cerrada' && !menosde24hs) {
      Alert.alert('Cancelar partido', '¿Confirmás que querés cancelar? El rival será notificado.', [
        { text: 'No', style: 'cancel' },
        { text: 'Sí, cancelar', style: 'destructive', onPress: async () => {
          await updateDoc(doc(db, 'partidos', partido.id), { estado: 'cancelada', resultado_confirmado: true });
        }}
      ]);
      return;
    }

    if (partido.estado === 'cerrada' && menosde24hs) {
      const yaPidio = esConvocante ? partido.cancelacion_pedida_convocante : partido.cancelacion_pedida_rival;
      const otroPidio = esConvocante ? partido.cancelacion_pedida_rival : partido.cancelacion_pedida_convocante;
      if (otroPidio) {
        Alert.alert('Confirmar cancelación', 'Tu rival quiere cancelar el partido. ¿Estás de acuerdo?', [
          { text: 'No', style: 'cancel' },
          { text: 'Sí, cancelar', style: 'destructive', onPress: async () => {
            await updateDoc(doc(db, 'partidos', partido.id), { estado: 'cancelada', resultado_confirmado: true });
          }}
        ]);
      } else if (yaPidio) {
        Alert.alert('Esperando', 'Ya solicitaste cancelar. Esperando confirmación del rival.');
      } else {
        Alert.alert('Solicitar cancelación', 'Faltan menos de 24hs para el partido. Tu rival deberá confirmar la cancelación.', [
          { text: 'No', style: 'cancel' },
          { text: 'Solicitar', onPress: async () => {
            const campo = esConvocante ? 'cancelacion_pedida_convocante' : 'cancelacion_pedida_rival';
            await updateDoc(doc(db, 'partidos', partido.id), { [campo]: true });
            Alert.alert('Solicitud enviada', 'Tu rival verá tu pedido de cancelación.');
          }}
        ]);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
  <View style={styles.headerTop}>
    <Text style={styles.logo}>🏓</Text>
    <Text style={styles.titulo}>PingMatch</Text>
  </View>
  <Text style={styles.subtitulo}>Mesas disponibles</Text>
  <View style={styles.navBar}>
    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
      <Text style={styles.navBtn}>🏠</Text>
      <Text style={styles.navLabel}>Principal</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Ranking')}>
      <Text style={styles.navBtn}>🏆</Text>
      <Text style={styles.navLabel}>Ranking</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Perfil')}>
      <Text style={styles.navBtn}>👤</Text>
      <Text style={styles.navLabel}>Mi perfil</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.navItem} onPress={() => setMostrarFiltros(!mostrarFiltros)}>
      <Text style={styles.navBtn}>🔍</Text>
      <Text style={styles.navLabel}>Buscar</Text>
    </TouchableOpacity>
  </View>
</View>

      <Modal visible={mostrarFiltros} transparent animationType="slide">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setMostrarFiltros(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalPanel}>
            <Text style={styles.modalTitulo}>Filtrar mesas</Text>

            <View style={styles.filtroCampo}>
              <Text style={styles.filtroLabel}>Categoría</Text>
              <TouchableOpacity 
                style={styles.dropdown}
                onPress={() => setMostrarDropdownCat(!mostrarDropdownCat)}
              >
                <Text style={styles.dropdownTexto}>{filtrosPendientes.categoria}</Text>
                <Text style={styles.dropdownArrow}>{mostrarDropdownCat ? '▲' : '▾'}</Text>
              </TouchableOpacity>
              {mostrarDropdownCat && (
                <View style={styles.dropdownOpciones}>
                  {['Todas', 'Élite', '1ª División', '2ª División', '3ª División', '4ª División', '5ª División', '6ª División', '7ª División', '8ª División'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.dropdownOpcion, filtrosPendientes.categoria === cat && styles.dropdownOpcionActiva]}
                      onPress={() => {
                        setFiltrosPendientes(prev => ({ ...prev, categoria: cat }));
                        setMostrarDropdownCat(false);
                      }}
                    >
                      <Text style={[styles.dropdownOpcionTexto, filtrosPendientes.categoria === cat && styles.dropdownOpcionTextoActivo]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.filtroCampo}>
              <Text style={styles.filtroLabel}>Modalidad</Text>
              <View style={styles.filtroRow}>
                {['Todas', 'Singles', 'Dobles'].map((mod) => (
                  <TouchableOpacity
                    key={mod}
                    style={[styles.filtroChip, filtrosPendientes.modalidad === mod && styles.filtroChipActivo]}
                    onPress={() => setFiltrosPendientes(prev => ({ ...prev, modalidad: mod }))}
                  >
                    <Text style={[styles.filtroChipTexto, filtrosPendientes.modalidad === mod && styles.filtroChipTextoActivo]}>
                      {mod}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filtroCampo}>
              <Text style={styles.filtroLabel}>Tipo</Text>
              <View style={styles.filtroRow}>
                {['Todos', 'Ranking', 'Amistoso'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.filtroChip, filtrosPendientes.tipo === t && styles.filtroChipActivo]}
                    onPress={() => setFiltrosPendientes(prev => ({ ...prev, tipo: t }))}
                  >
                    <Text style={[styles.filtroChipTexto, filtrosPendientes.tipo === t && styles.filtroChipTextoActivo]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filtroCampo}>
              <Text style={styles.filtroLabel}>Zona / Barrio</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['Todos', ...new Set(partidosBase.map(p => p.lugar?.split(',')[0]).filter(Boolean))].map((zona) => (
                  <TouchableOpacity
                    key={zona}
                    style={[styles.filtroChip, filtrosPendientes.zona === (zona === 'Todos' ? '' : zona) && styles.filtroChipActivo]}
                    onPress={() => setFiltrosPendientes(prev => ({ ...prev, zona: zona === 'Todos' ? '' : zona }))}
                  >
                    <Text style={[styles.filtroChipTexto, filtrosPendientes.zona === (zona === 'Todos' ? '' : zona) && styles.filtroChipTextoActivo]}>
                      {zona}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.btnLimpiar} onPress={() => {
                setFiltrosPendientes({ categoria: 'Todas', modalidad: 'Todas', tipo: 'Todos', zona: '' });
              }}>
                <Text style={styles.btnLimpiarTexto}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnAplicar} onPress={() => {
                setFiltroCategoriaActivo(filtrosPendientes.categoria);
                setFiltroModalidad(filtrosPendientes.modalidad);
                setFiltroTipo(filtrosPendientes.tipo);
                setFiltroZona(filtrosPendientes.zona);
                setMostrarFiltros(false);
              }}>
                <Text style={styles.btnAplicarTexto}>Aplicar filtros</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <ScrollView style={styles.lista}>
        {partidosFiltrados.length === 0 && (
          <Text style={styles.vacio}>No hay partidos disponibles. ¡Convocá uno!</Text>
        )}
        {partidosFiltrados.map((partido) => {
          const ahora = new Date();
          const fechaPartido = partido.fechaHora?.toDate ? partido.fechaHora.toDate() : null;
          const menosde24hs = fechaPartido && (fechaPartido - ahora) < 24 * 60 * 60 * 1000;
          const esConvocante = auth.currentUser?.uid === partido.convocante;
          const esRival = auth.currentUser?.uid === partido.rival;
          const esParticipante = esConvocante || esRival;

          return (
            <View key={partido.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitulo}>{partido.convocante_nombre} convoca</Text>
                <View style={styles.badgesRow}>
                  {partido.filtro_categoria && (
                    <View style={styles.badgeFiltro}>
                      <Text style={styles.badgeFiltroTexto}>
                        {partido.filtro_categoria === 'Solo mi categoría' ? '🔒 ' + partido.categoria :
                         partido.filtro_categoria === 'Mi categoría o superior' ? '📈 ' + partido.categoria + '+' :
                         '🌐 Todos'}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.badge, partido.estado === 'abierta' ? styles.badgeAbierta : styles.badgeCerrada]}>
                    <Text style={[styles.badgeTexto, partido.estado === 'abierta' ? styles.badgeTextoAbierta : styles.badgeTextoCerrada]}>
                      {partido.estado === 'abierta' ? 'Abierta' : 'Cerrada'}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.cardDetalle}>📅 {partido.fecha} · {partido.hora}</Text>
              <Text style={styles.cardDetalle}>📍 {partido.lugar}</Text>
              <Text style={styles.cardDetalle}>🏓 {partido.categoria} · {partido.modalidad}</Text>
              {partido.tipo && (
                <Text style={styles.cardDetalle}>
                  {partido.tipo === 'Ranking' ? '🏆 Por ranking' : '🤝 Amistoso'}
                </Text>
              )}
              {partido.estado === 'cerrada' && partido.rival_nombre && (
                <View style={styles.rivalInfo}>
                  <Text style={styles.rivalInfoTitulo}>Jugadores</Text>
                  <Text style={styles.rivalInfoTexto}>👤 {partido.convocante_nombre}</Text>
                  <Text style={styles.rivalInfoTexto}>👤 {partido.rival_nombre}</Text>
                </View>
              )}

              {partido.estado === 'abierta' && esConvocante && (
                <View>
                  <TouchableOpacity style={styles.btnEditar} onPress={() => navigation.navigate('EditarPartido', { partido })}>
                    <Text style={styles.btnEditarTexto}>✏️ Editar mesa</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnCancelar} onPress={() => cancelarPartido(partido)}>
                    <Text style={styles.btnCancelarTexto}>Cancelar mesa</Text>
                  </TouchableOpacity>
                </View>
              )}

              {partido.estado === 'abierta' && !esConvocante && (
                <TouchableOpacity style={styles.btnUnirse} onPress={() => unirse(partido)}>
                  <Text style={styles.btnUnirseTexto}>¡Me uno!</Text>
                </TouchableOpacity>
              )}

              {partido.estado === 'cerrada' && esParticipante && (partido.resultado_pendiente || !partido.resultado_pendiente) && (
                <View>
                  {partido.tipo !== 'Amistoso' && (
                    <TouchableOpacity style={styles.btnResultado} onPress={() => navigation.navigate('Resultado', { partido })}>
                      <Text style={styles.btnResultadoTexto}>Cargar resultado</Text>
                    </TouchableOpacity>
                  )}
                  {partido.tipo === 'Amistoso' && (
                    <View>
                      <TouchableOpacity style={styles.btnResultado} onPress={() => navigation.navigate('Resultado', { partido })}>
                        <Text style={styles.btnResultadoTexto}>Anotar resultado (opcional)</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.btnCerrar} onPress={() => {
                        Alert.alert('Cerrar partido', '¿Confirmás que el partido amistoso ya se jugó?', [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Cerrar', onPress: async () => {
                            await updateDoc(doc(db, 'partidos', partido.id), { resultado_confirmado: true, resultado_pendiente: false });
                          }}
                        ]);
                      }}>
                        <Text style={styles.btnCerrarTexto}>Dar partido por jugado</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <TouchableOpacity style={styles.btnWhatsapp} onPress={() => {
                    const numeroContacto = esConvocante ? partido.rival_celular : partido.convocante_celular;
                    const nombreContacto = esConvocante ? partido.rival_nombre : partido.convocante_nombre;
                    contactarWhatsApp(numeroContacto, nombreContacto, partido);
                  }}>
                    <Text style={styles.btnWhatsappTexto}>💬 Contactar por WhatsApp</Text>
                  </TouchableOpacity>

                  {esParticipante && menosde24hs && (
                    <TouchableOpacity style={styles.btnCancelar} onPress={() => cancelarPartido(partido)}>
                      <Text style={styles.btnCancelarTexto}>
                        {partido.cancelacion_pedida_convocante || partido.cancelacion_pedida_rival
                          ? '⚠️ Cancelación pendiente'
                          : 'Cancelar partido'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {esRival && !menosde24hs && (
                    <TouchableOpacity style={styles.btnSalir} onPress={() => {
                      Alert.alert('Salir de la mesa', '¿Confirmás que querés salir? La mesa volverá a quedar abierta.', [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Salir', style: 'destructive', onPress: async () => {
                          await updateDoc(doc(db, 'partidos', partido.id), {
                            rival: null, rival_nombre: null, rival_celular: null, estado: 'abierta',
                          });
                        }}
                      ]);
                    }}>
                      <Text style={styles.btnSalirTexto}>Salir de la mesa</Text>
                    </TouchableOpacity>
                  )}

                  {esConvocante && !menosde24hs && (
                    <TouchableOpacity style={styles.btnCancelar} onPress={() => cancelarPartido(partido)}>
                      <Text style={styles.btnCancelarTexto}>Cancelar partido</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={[styles.btnNuevo, { marginBottom: insets.bottom + 8 }]} onPress={() => navigation.navigate('NuevoPartido')}>
        <Text style={styles.btnNuevoTexto}>+ Convocar partido</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, paddingTop: 60 },
  titulo: { fontSize: 28, fontWeight: '500', color: '#1D9E75' },
  lista: { flex: 1 },
  vacio: { color: '#999', textAlign: 'center', marginTop: 40, fontSize: 14 },
  card: { backgroundColor: '#F7F7F5', borderRadius: 12, padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitulo: { fontSize: 14, fontWeight: '500', color: '#333' },
  badge: { borderRadius: 99, paddingVertical: 2, paddingHorizontal: 10 },
  badgeAbierta: { backgroundColor: '#E1F5EE' },
  badgeCerrada: { backgroundColor: '#EEEDFE' },
  badgeTexto: { fontSize: 11, fontWeight: '500' },
  badgeTextoAbierta: { color: '#085041' },
  badgeTextoCerrada: { color: '#3C3489' },
  cardDetalle: { fontSize: 12, color: '#666', marginBottom: 4 },
  rivalInfo: { backgroundColor: '#E1F5EE', borderRadius: 8, padding: 8, marginTop: 6 },
  rivalInfoTitulo: { fontSize: 10, fontWeight: '500', color: '#085041', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  rivalInfoTexto: { fontSize: 12, color: '#085041', marginBottom: 2 },
  btnUnirse: { backgroundColor: '#1D9E75', borderRadius: 8, paddingVertical: 8, alignItems: 'center', marginTop: 8 },
  btnUnirseTexto: { color: '#fff', fontSize: 13, fontWeight: '500' },
  btnNuevo: { backgroundColor: '#1D9E75', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  btnNuevoTexto: { color: '#fff', fontSize: 15, fontWeight: '500' },
  btnResultado: { backgroundColor: '#FAEEDA', borderRadius: 8, paddingVertical: 8, alignItems: 'center', marginTop: 8 },
  btnResultadoTexto: { color: '#633806', fontSize: 13, fontWeight: '500' },
  btnWhatsapp: { backgroundColor: '#25D366', borderRadius: 8, paddingVertical: 8, alignItems: 'center', marginTop: 6 },
  btnWhatsappTexto: { color: '#fff', fontSize: 13, fontWeight: '500' },
  btnSalir: { backgroundColor: '#FCEBEB', borderRadius: 8, paddingVertical: 8, alignItems: 'center', marginTop: 6 },
  btnSalirTexto: { color: '#A32D2D', fontSize: 13, fontWeight: '500' },
  tituloRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  perfilBtn: { fontSize: 14, color: '#1D9E75', fontWeight: '500' },
  badgesRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeFiltro: { backgroundColor: '#E6F1FB', borderRadius: 99, paddingVertical: 2, paddingHorizontal: 8 },
  badgeFiltroTexto: { fontSize: 10, color: '#0C447C', fontWeight: '500' },
  btnCerrar: { backgroundColor: '#EEEDFE', borderRadius: 8, paddingVertical: 8, alignItems: 'center', marginTop: 6 },
  btnCerrarTexto: { color: '#3C3489', fontSize: 13, fontWeight: '500' },
  btnCancelar: { backgroundColor: '#FCEBEB', borderRadius: 8, paddingVertical: 8, alignItems: 'center', marginTop: 6 },
  btnCancelarTexto: { color: '#A32D2D', fontSize: 13, fontWeight: '500' },
  headerBtns: { flexDirection: 'row', gap: 12 },
  btnEditar: { backgroundColor: '#E1F5EE', borderRadius: 8, paddingVertical: 8, alignItems: 'center', marginTop: 6 },
  btnEditarTexto: { color: '#085041', fontSize: 13, fontWeight: '500' },
  filtrosPanel: {
  backgroundColor: '#F7F7F5',
  borderRadius: 12,
  padding: 14,
  marginBottom: 12,
},
filtroCampo: {
  marginBottom: 10,
},
filtroLabel: {
  fontSize: 11,
  color: '#999',
  fontWeight: '500',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
},
filtroRow: {
  flexDirection: 'row',
  gap: 6,
},
filtroChip: {
  backgroundColor: '#fff',
  borderRadius: 99,
  paddingVertical: 4,
  paddingHorizontal: 12,
  marginRight: 6,
  borderWidth: 0.5,
  borderColor: '#ddd',
},
filtroChipActivo: {
  backgroundColor: '#1D9E75',
  borderColor: '#1D9E75',
},
filtroChipTexto: {
  fontSize: 12,
  color: '#666',
},
filtroChipTextoActivo: {
  color: '#fff',
  fontWeight: '500',
},
filtroInput: {
  backgroundColor: '#fff',
  borderRadius: 8,
  padding: 10,
  fontSize: 13,
  color: '#333',
  borderWidth: 0.5,
  borderColor: '#ddd',
},
filtroLimpiar: {
  alignSelf: 'flex-end',
  marginTop: 4,
},
filtroLimpiarTexto: {
  fontSize: 12,
  color: '#1D9E75',
  fontWeight: '500',
},
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'flex-end',
},
modalPanel: {
  backgroundColor: '#fff',
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  padding: 24,
  paddingBottom: 40,
},
modalTitulo: {
  fontSize: 18,
  fontWeight: '500',
  color: '#333',
  marginBottom: 20,
},
filtroCampo: {
  marginBottom: 16,
},
filtroLabel: {
  fontSize: 11,
  color: '#999',
  fontWeight: '500',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
},
filtroRow: {
  flexDirection: 'row',
  gap: 6,
},
filtroChip: {
  backgroundColor: '#F7F7F5',
  borderRadius: 99,
  paddingVertical: 6,
  paddingHorizontal: 14,
  marginRight: 6,
},
filtroChipActivo: {
  backgroundColor: '#1D9E75',
},
filtroChipTexto: {
  fontSize: 12,
  color: '#666',
},
filtroChipTextoActivo: {
  color: '#fff',
  fontWeight: '500',
},
dropdown: {
  backgroundColor: '#F7F7F5',
  borderRadius: 8,
  padding: 12,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},
dropdownTexto: {
  fontSize: 14,
  color: '#333',
},
dropdownArrow: {
  fontSize: 12,
  color: '#999',
},
dropdownOpciones: {
  backgroundColor: '#fff',
  borderRadius: 8,
  borderWidth: 0.5,
  borderColor: '#ddd',
  marginTop: 4,
},
dropdownOpcion: {
  padding: 12,
  borderBottomWidth: 0.5,
  borderBottomColor: '#f0f0f0',
},
dropdownOpcionActiva: {
  backgroundColor: '#E1F5EE',
},
dropdownOpcionTexto: {
  fontSize: 13,
  color: '#333',
},
dropdownOpcionTextoActivo: {
  color: '#1D9E75',
  fontWeight: '500',
},
modalBtns: {
  flexDirection: 'row',
  gap: 10,
  marginTop: 8,
},
btnLimpiar: {
  flex: 1,
  borderWidth: 0.5,
  borderColor: '#ccc',
  borderRadius: 10,
  paddingVertical: 12,
  alignItems: 'center',
},
btnLimpiarTexto: {
  color: '#666',
  fontSize: 14,
},
btnAplicar: {
  flex: 2,
  backgroundColor: '#1D9E75',
  borderRadius: 10,
  paddingVertical: 12,
  alignItems: 'center',
},
btnAplicarTexto: {
  color: '#fff',
  fontSize: 14,
  fontWeight: '500',
},
headerContainer: {
  marginBottom: 16,
},
headerTop: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginBottom: 4,
},
logo: {
  fontSize: 28,
},
subtitulo: {
  fontSize: 23,
  color: '#999',
  marginBottom: 12,
},
navBar: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  backgroundColor: '#F7F7F5',
  borderRadius: 12,
  padding: 10,
},
navItem: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
},
navBtn: {
  fontSize: 16,
},
navLabel: {
  fontSize: 12,
  color: '#1D9E75',
  fontWeight: '500',
},
});