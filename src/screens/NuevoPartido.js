import DateTimePicker from '@react-native-community/datetimepicker';
import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { auth, db } from '../config/firebase';

export default function NuevoPartido({ navigation }) {
  const [formato, setFormato] = useState('Mejor de 5');
  const [fecha, setFecha] = useState(new Date());
  const [hora, setHora] = useState(new Date());
  const [mostrarFecha, setMostrarFecha] = useState(false);
  const [mostrarHora, setMostrarHora] = useState(false);
  const [lugar, setLugar] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [categoria, setCategoria] = useState('');
  const [modalidad, setModalidad] = useState('Singles');
  const [tipo, setTipo] = useState('Ranking');
  const [filtroCat, setFiltroCat] = useState('Solo mi categoría');
  const [cargando, setCargando] = useState(false);
  const hoy = new Date();

  useEffect(() => {
    const cargarCategoria = async () => {
      if (auth.currentUser) {
        const snap = await getDoc(doc(db, 'usuarios', auth.currentUser.uid));
        if (snap.exists()) setCategoria(snap.data().categoria);
      }
    };
    cargarCategoria();
  }, []);

  const buscarDireccion = async (texto) => {
    setLugar(texto);
    setSugerencias([]);
    if (texto.length < 3) return;
    setBuscando(true);
    try {
      const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(texto)}&limit=4`,
      );
      const data = await res.json();
      const features = data.features || [];
      console.log('Cantidad sugerencias:', features.length);
      setSugerencias(features);
      setSugerencias(data.features || []);
      console.log('Sugerencias seteadas:', data.features?.length);
    } catch (e) {
      console.log('Error Photon:', e.message);
      setSugerencias([]);
    } finally {
      setBuscando(false);
    }
  };

  const formatearDireccion = (feature) => {
    const p = feature.properties;
    const partes = [
      p.housenumber ? `${p.street} ${p.housenumber}` : p.street || p.name,
      p.district || p.city || p.county,
      p.state,
      p.country
    ].filter(Boolean);
    return partes.join(', ');
  };
  const formatFecha = (date) => {
    return date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatHora = (date) => {
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  const convocar = async () => {
    if (!lugar) {
      Alert.alert('Error', 'Por favor ingresá el lugar del partido');
      return;
    }
    try {
      setCargando(true);
      const snap = await getDoc(doc(db, 'usuarios', auth.currentUser.uid));
      const perfil = snap.data();
      await addDoc(collection(db, 'partidos'), {
        fecha: formatFecha(fecha),
        hora: formatHora(hora),
        lugar,
        categoria,
        modalidad,
        tipo,
        formato,
        filtro_categoria: filtroCat,
        convocante: auth.currentUser.uid,
        convocante_nombre: perfil.nombre + ' ' + perfil.apellido,
        convocante_celular: perfil.celular || '',
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.volver}>← Volver</Text>
        </TouchableOpacity>

        <Text style={styles.titulo}>Nuevo partido</Text>

        {categoria ? (
          <View style={styles.categoriaInfo}>
            <Text style={styles.categoriaInfoTexto}>Tu categoría: {categoria}</Text>
          </View>
        ) : null}

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
  <Text style={styles.label}>Formato</Text>
  <View style={styles.toggleRow}>
    {['Mejor de 3', 'Mejor de 5', 'Mejor de 7'].map((f) => (
      <TouchableOpacity
        key={f}
        style={[styles.toggleBtn, formato === f && styles.toggleBtnActivo]}
        onPress={() => setFormato(f)}
      >
        <Text style={[styles.toggleTexto, formato === f && styles.toggleTextoActivo]}>
          {f}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
</View>

        <View style={styles.campo}>
          <Text style={styles.label}>Tipo de partido</Text>
          <View style={styles.toggleRow}>
            {['Ranking', 'Amistoso'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.toggleBtn, tipo === t && styles.toggleBtnActivo]}
                onPress={() => setTipo(t)}
              >
                <Text style={[styles.toggleTexto, tipo === t && styles.toggleTextoActivo]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.campo}>
          <Text style={styles.label}>¿Quién puede unirse?</Text>
          <View style={styles.filtroRow}>
            {['Solo mi categoría', 'Mi categoría o superior', 'Cualquiera'].map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filtroBtn, filtroCat === f && styles.filtroBtnActivo]}
                onPress={() => setFiltroCat(f)}
              >
                <Text style={[styles.filtroTexto, filtroCat === f && styles.filtroTextoActivo]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.campo}>
          <Text style={styles.label}>Fecha</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setMostrarFecha(true)}>
            <Text style={styles.dateBtnTexto}>{formatFecha(fecha)}</Text>
          </TouchableOpacity>
          {mostrarFecha && (
            <DateTimePicker
              value={fecha}
              mode="date"
              minimumDate={hoy}
              onChange={(event, selectedDate) => {
                setMostrarFecha(Platform.OS === 'ios');
                if (selectedDate) setFecha(selectedDate);
              }}
            />
          )}
        </View>

        <View style={styles.campo}>
          <Text style={styles.label}>Hora</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setMostrarHora(true)}>
            <Text style={styles.dateBtnTexto}>{formatHora(hora)}</Text>
          </TouchableOpacity>
          {mostrarHora && (
            <DateTimePicker
              value={hora}
              mode="time"
              is24Hour={true}
              onChange={(event, selectedTime) => {
                setMostrarHora(Platform.OS === 'ios');
                if (selectedTime) setHora(selectedTime);
              }}
            />
          )}
        </View>

        <View style={styles.campo}>
          <Text style={styles.label}>Lugar</Text>
          <TextInput
            style={styles.input}
            placeholder="Escribí la dirección..."
            value={lugar}
            onChangeText={buscarDireccion}
          />
          {buscando && <ActivityIndicator size="small" color="#1D9E75" style={{ marginTop: 6 }} />}
          {sugerencias.map((s, i) => (
            <TouchableOpacity
              key={i}
              style={styles.sugerencia}
              onPress={() => {
                setLugar(formatearDireccion(s));
                setSugerencias([]);
              }}
            >
              <Text style={styles.sugerenciaTexto} numberOfLines={2}>
                {formatearDireccion(s)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {modalidad === 'Dobles' && (
          <View style={styles.avisoDobles}>
            <Text style={styles.avisoDoblesTexto}>
              En dobles se necesitan 4 jugadores para cerrar la mesa.
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.boton} onPress={convocar} disabled={cargando}>
          <Text style={styles.botonTexto}>{cargando ? 'Publicando...' : 'Publicar mesa'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', padding: 24, paddingTop: 60 },
  volver: { color: '#1D9E75', fontSize: 14, marginBottom: 16 },
  titulo: { fontSize: 24, fontWeight: '500', color: '#1D9E75', marginBottom: 16 },
  categoriaInfo: { backgroundColor: '#E1F5EE', borderRadius: 8, padding: 10, marginBottom: 16 },
  categoriaInfoTexto: { fontSize: 13, color: '#085041', fontWeight: '500' },
  campo: { marginBottom: 16 },
  label: { fontSize: 12, color: '#999', marginBottom: 6 },
  input: { backgroundColor: '#F7F7F5', borderRadius: 8, padding: 12, fontSize: 14, color: '#333' },
  dateBtn: { backgroundColor: '#F7F7F5', borderRadius: 8, padding: 12 },
  dateBtnTexto: { fontSize: 14, color: '#333' },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: { flex: 1, backgroundColor: '#F7F7F5', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  toggleBtnActivo: { backgroundColor: '#1D9E75' },
  toggleTexto: { fontSize: 13, color: '#666' },
  toggleTextoActivo: { color: '#fff', fontWeight: '500' },
  filtroRow: { flexDirection: 'row', gap: 6 },
  filtroBtn: { flex: 1, backgroundColor: '#F7F7F5', borderRadius: 8, paddingVertical: 8, alignItems: 'center', paddingHorizontal: 4 },
  filtroBtnActivo: { backgroundColor: '#1D9E75' },
  filtroTexto: { fontSize: 11, color: '#666', textAlign: 'center' },
  filtroTextoActivo: { color: '#fff', fontWeight: '500' },
  avisoDobles: { backgroundColor: '#E1F5EE', borderRadius: 8, padding: 12, marginBottom: 16 },
  avisoDoblesTexto: { fontSize: 12, color: '#085041' },
  boton: { backgroundColor: '#1D9E75', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  botonTexto: { color: '#fff', fontSize: 15, fontWeight: '500' },
  sugerencia: { backgroundColor: '#F0FAF6', borderRadius: 8, padding: 10, marginTop: 4, borderLeftWidth: 3, borderLeftColor: '#1D9E75' },
  sugerenciaTexto: { fontSize: 12, color: '#333', lineHeight: 18 },
});