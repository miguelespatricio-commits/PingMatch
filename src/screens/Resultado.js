import { doc, updateDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../config/firebase';

export default function Resultado({ navigation, route }) {
  const { partido: partidoInicial } = route.params;
  const [partido, setPartido] = useState(partidoInicial);
  const [sets, setSets] = useState([]);
  const [cargando, setCargando] = useState(false);

  const totalSets = partido.formato === 'Mejor de 3' ? 3 :
                    partido.formato === 'Mejor de 7' ? 7 : 5;
  const setsParaGanar = Math.ceil(totalSets / 2);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'partidos', partidoInicial.id), (snap) => {
      if (snap.exists()) setPartido({ id: snap.id, ...snap.data() });
    });
    return unsub;
  }, []);

  useEffect(() => {
    setSets(Array.from({ length: totalSets }, () => ({
      convocante: '',
      rival: '',
    })));
  }, [totalSets]);

  const yaCargo = partido.resultado_pendiente;
  const puedoConfirmar = yaCargo && partido.resultado_cargado_por !== auth.currentUser.uid;

  const calcularGanadorSet = (puntosA, puntosB) => {
    if (puntosA === '' || puntosB === '' || 
        puntosA === undefined || puntosB === undefined) return null;
    const a = parseInt(puntosA) || 0;
    const b = parseInt(puntosB) || 0;
    if (a === 0 && b === 0) return null;
    if (a >= 11 && a - b >= 2) return 'convocante';
    if (b >= 11 && b - a >= 2) return 'rival';
    return null;
  };
  const setEsValido = (puntosA, puntosB) => {
    if (puntosA === '' || puntosB === '' || puntosA === undefined || puntosB === undefined) return true;
    const a = parseInt(puntosA);
    const b = parseInt(puntosB);
    if (isNaN(a) || isNaN(b)) return true;
    const max = Math.max(a, b);
    const min = Math.min(a, b);
    const diferencia = max - min;

    if (max < 11) return true;
    if (max === 11) return diferencia >= 2;
    return diferencia === 2;
  };

  const setsGanadosConvocante = sets.filter(s => calcularGanadorSet(s.convocante, s.rival) === 'convocante').length;
  const setsGanadosRival = sets.filter(s => calcularGanadorSet(s.convocante, s.rival) === 'rival').length;

  const actualizarSet = (index, jugador, valor) => {
    const nuevos = [...sets];
    nuevos[index] = { ...nuevos[index], [jugador]: valor };
    setSets(nuevos);
  };

  const validarSetCompleto = (index) => {
    const s = sets[index];
    if (s.convocante === '' || s.rival === '' || 
        s.convocante === undefined || s.rival === undefined) return;

    const a = parseInt(s.convocante);
    const b = parseInt(s.rival);
    if (isNaN(a) || isNaN(b)) return;

    if (!setEsValido(s.convocante, s.rival)) {
      Alert.alert(
        'Resultado inválido',
        'En tenis de mesa cada set se juega a 11 puntos. Si hay empate en 10 o más, el ganador debe sacar exactamente 2 puntos de diferencia.'
      );
      const limpiados = [...sets];
      limpiados[index] = { convocante: '', rival: '' };
      setSets(limpiados);
      return;
    }

    let ganConvocante = 0;
    let ganRival = 0;
    const recalculados = sets.map((set) => {
      if (ganConvocante >= setsParaGanar || ganRival >= setsParaGanar) {
        return { convocante: '-', rival: '-' };
      }
      const g = calcularGanadorSet(
        set.convocante === '-' ? '' : set.convocante,
        set.rival === '-' ? '' : set.rival
      );
      if (g === 'convocante') ganConvocante++;
      if (g === 'rival') ganRival++;
      return {
        convocante: set.convocante === '-' ? '' : set.convocante,
        rival: set.rival === '-' ? '' : set.rival
      };
    });

    setSets(recalculados);
  };

  const cargarResultado = async () => {
    if (setsGanadosConvocante < setsParaGanar && setsGanadosRival < setsParaGanar) {
      Alert.alert('Error', `Se necesitan ${setsParaGanar} sets para ganar.`);
      return;
    }
    try {
      setCargando(true);
      const ganador = setsGanadosConvocante >= setsParaGanar ? partido.convocante : partido.rival;
      await updateDoc(doc(db, 'partidos', partido.id), {
        sets,
        sets_convocante: setsGanadosConvocante,
        sets_rival: setsGanadosRival,
        ganador,
        resultado_pendiente: true,
        resultado_cargado_por: auth.currentUser.uid,
      });
      Alert.alert('¡Listo!', 'Resultado cargado. El rival debe confirmarlo.');
      navigation.navigate('Partidos');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setCargando(false);
    }
  };

  const confirmarResultado = async () => {
    try {
      setCargando(true);
      console.log('Tipo de partido:', partido.tipo);
      console.log('partido.tipo:', partido.tipo);
console.log('partidoInicial.tipo:', partidoInicial.tipo);
if (partido.tipo === 'Amistoso' || partidoInicial.tipo === 'Amistoso') {
        await updateDoc(doc(db, 'partidos', partido.id), {
          resultado_confirmado: true,
          resultado_pendiente: false,
        });
        Alert.alert('¡Confirmado!', 'Resultado del amistoso registrado. No afecta el ranking.');
        navigation.navigate('Partidos');
        return;
      }
      const categorias = ['Élite', '1ª División', '2ª División', '3ª División', '4ª División', '5ª División', '6ª División', '7ª División', '8ª División'];
      const snapGanador = await getDoc(doc(db, 'usuarios', partido.ganador));
      const perdedorId = partido.ganador === partido.convocante ? partido.rival : partido.convocante;
      const snapPerdedor = await getDoc(doc(db, 'usuarios', perdedorId));

      const datosGanador = snapGanador.data();
      const datosPerdedor = snapPerdedor.data();

      const indexGanador = categorias.indexOf(datosGanador.categoria);
      const indexPerdedor = categorias.indexOf(datosPerdedor.categoria);
      const diferencia = indexPerdedor - indexGanador;

      let puntosGanador = 35;
      let puntosPerdedor = 12;

      if (diferencia > 0) {
        puntosGanador += diferencia * 10;
      } else if (diferencia < 0) {
        puntosGanador = Math.max(10, puntosGanador + diferencia * 10);
        puntosPerdedor = Math.max(5, puntosPerdedor + diferencia * 5);
      }

      await updateDoc(doc(db, 'usuarios', partido.ganador), {
        puntos: (datosGanador.puntos || 1500) + puntosGanador,
      });
      await updateDoc(doc(db, 'usuarios', perdedorId), {
        puntos: (datosPerdedor.puntos || 1500) + puntosPerdedor,
      });
      await updateDoc(doc(db, 'partidos', partido.id), {
        resultado_confirmado: true,
        resultado_pendiente: false,
      });

      Alert.alert('¡Confirmado!', `+${puntosGanador} pts al ganador · +${puntosPerdedor} pts al perdedor.`);
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

      <Text style={styles.titulo}>
        {puedoConfirmar ? 'Confirmar resultado' : 'Cargar resultado'}
      </Text>

      <View style={styles.formatoBadge}>
        <Text style={styles.formatoTexto}>{partido.formato || 'Mejor de 5'}</Text>
      </View>

      <View style={styles.nombresRow}>
        <Text style={styles.nombreJugador}>{partido.convocante_nombre}</Text>
        <Text style={styles.vsHeader}>vs</Text>
        <Text style={styles.nombreJugador}>{partido.rival_nombre}</Text>
      </View>

      {puedoConfirmar ? (
        <View>
          {(partido.sets || []).map((s, i) => {
            const ganSet = calcularGanadorSet(s.convocante, s.rival);
            if (s.convocante === '-') return null;
            return (
              <View key={i} style={styles.setRow}>
                <Text style={styles.setLabel}>Set {i + 1}</Text>
                <Text style={[styles.setPuntaje, ganSet === 'convocante' && styles.setPuntajeGanador]}>
                  {s.convocante}
                </Text>
                <Text style={styles.setGuion}>-</Text>
                <Text style={[styles.setPuntaje, ganSet === 'rival' && styles.setPuntajeGanador]}>
                  {s.rival}
                </Text>
              </View>
            );
          })}
          <View style={styles.totalRow}>
            <Text style={styles.totalTexto}>Sets: {partido.sets_convocante} - {partido.sets_rival}</Text>
          </View>
          <View style={styles.aviso}>
            <Text style={styles.avisoTexto}>✅ Tu rival cargó este resultado. ¿Es correcto?</Text>
          </View>
          <TouchableOpacity style={styles.boton} onPress={confirmarResultado} disabled={cargando}>
            <Text style={styles.botonTexto}>{cargando ? 'Confirmando...' : 'Confirmar resultado'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.botonRechazar} onPress={async () => {
            await updateDoc(doc(db, 'partidos', partido.id), {
              resultado_pendiente: false,
              resultado_cargado_por: null,
            });
            Alert.alert('Resultado rechazado', 'Tu rival puede volver a cargarlo.');
            navigation.navigate('Partidos');
          }}>
            <Text style={styles.botonRechazarTexto}>Rechazar resultado</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          {yaCargo ? (
            <View style={styles.aviso}>
              <Text style={styles.avisoTexto}>⏳ Resultado cargado. Esperando confirmación del rival.</Text>
            </View>
          ) : (
            <View>
             {sets.map((s, i) => {
                const bloqueado = s.convocante === '-' || s.rival === '-';
                const setAnteriorCompleto = i === 0 || (
                  sets[i - 1].convocante !== '' &&
                  sets[i - 1].rival !== '' &&
                  calcularGanadorSet(sets[i - 1].convocante, sets[i - 1].rival) !== null
                );
                const habilitado = !bloqueado && setAnteriorCompleto;
                return (
                  <View key={i} style={[styles.setRow, bloqueado && styles.setRowBloqueado, !habilitado && !bloqueado && styles.setRowBloqueado]}>
                    <Text style={styles.setLabel}>Set {i + 1}</Text>
                    <TextInput
                      style={[styles.setInput, (bloqueado || !habilitado) && styles.setInputBloqueado]}
                      placeholder="0"
                      value={bloqueado ? '-' : s.convocante}
                      onChangeText={(v) => actualizarSet(i, 'convocante', v)}
                      onBlur={() => validarSetCompleto(i)}
                      keyboardType="numeric"
                      maxLength={2}
                      editable={habilitado}
                    />
                    <Text style={styles.setGuion}>-</Text>
                    <TextInput
                      style={[styles.setInput, (bloqueado || !habilitado) && styles.setInputBloqueado]}
                      placeholder="0"
                      value={bloqueado ? '-' : s.rival}
                      onChangeText={(v) => actualizarSet(i, 'rival', v)}
                      onBlur={() => validarSetCompleto(i)}
                      keyboardType="numeric"
                      maxLength={2}
                      editable={habilitado}
                    />
                    <Text style={styles.setResultado}>
                      {calcularGanadorSet(s.convocante, s.rival) ? '✓' : ''}
                    </Text>
                  </View>
                );
              })}
              <View style={styles.totalRow}>
                <Text style={styles.totalTexto}>Sets: {setsGanadosConvocante} - {setsGanadosRival}</Text>
              </View>
              <TouchableOpacity style={styles.boton} onPress={cargarResultado} disabled={cargando}>
                <Text style={styles.botonTexto}>{cargando ? 'Guardando...' : 'Enviar resultado'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', padding: 24, paddingTop: 60 },
  volver: { color: '#1D9E75', fontSize: 14, marginBottom: 16 },
  titulo: { fontSize: 24, fontWeight: '500', color: '#1D9E75', marginBottom: 12 },
  formatoBadge: { backgroundColor: '#E1F5EE', borderRadius: 99, paddingVertical: 4, paddingHorizontal: 12, alignSelf: 'flex-start', marginBottom: 16 },
  formatoTexto: { fontSize: 12, color: '#085041', fontWeight: '500' },
  nombresRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, alignSelf: 'center' },
  nombreJugador: { fontSize: 15, fontWeight: '500', color: '#333', width: 90, textAlign: 'center' },
  vsHeader: { fontSize: 12, color: '#999', width: 40, textAlign: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8, alignSelf: 'center' },
  setLabel: { fontSize: 12, color: '#999', width: 40 },
  setInput: { backgroundColor: '#F7F7F5', borderRadius: 8, width: 48, height: 44, textAlign: 'center', fontSize: 18, fontWeight: '500', color: '#333' },
  setGuion: { fontSize: 16, color: '#999' },
  setPuntaje: { width: 48, textAlign: 'center', fontSize: 18, fontWeight: '500', color: '#333' },
  setPuntajeGanador: { color: '#1D9E75' },
  setResultado: { fontSize: 16, color: '#1D9E75', width: 20 },
  totalRow: { backgroundColor: '#F7F7F5', borderRadius: 8, padding: 12, alignItems: 'center', marginVertical: 12 },
  totalTexto: { fontSize: 16, fontWeight: '500', color: '#333' },
  aviso: { backgroundColor: '#E1F5EE', borderRadius: 8, padding: 12, marginBottom: 16 },
  avisoTexto: { fontSize: 12, color: '#085041', lineHeight: 18 },
  boton: { backgroundColor: '#1D9E75', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  botonTexto: { color: '#fff', fontSize: 15, fontWeight: '500' },
  botonRechazar: { borderWidth: 0.5, borderColor: '#ccc', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  botonRechazarTexto: { color: '#999', fontSize: 15 },
  setRowBloqueado: { opacity: 0.3 },
  setInputBloqueado: { backgroundColor: '#eee', color: '#999' },
});