import { doc, updateDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../config/firebase';

export default function Resultado({ navigation, route }) {
  const { partido: partidoInicial } = route.params;
  const [partido, setPartido] = useState(partidoInicial);
  const [sets_convocante, setSetsConvocante] = useState('');
  const [sets_rival, setSetsRival] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'partidos', partidoInicial.id), (snap) => {
      if (snap.exists()) setPartido({ id: snap.id, ...snap.data() });
    });
    return unsub;
  }, []);

  const esConvocante = auth.currentUser.uid === partido.convocante;
  const yaCargo = partido.resultado_pendiente;
  const puedoConfirmar = yaCargo && partido.resultado_cargado_por !== auth.currentUser.uid;

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

      Alert.alert('¡Confirmado!', `Resultado registrado. +${puntosGanador} pts al ganador, +${puntosPerdedor} pts al perdedor.`);
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

      <Text style={styles.titulo}>
        {puedoConfirmar ? 'Confirmar resultado' : 'Cargar resultado'}
      </Text>

      <View style={styles.card}>
        <View style={styles.jugadorRow}>
          <Text style={styles.jugadorNombre}>{partido.convocante_nombre}</Text>
          {puedoConfirmar ? (
            <Text style={styles.scoreTexto}>{partido.sets_convocante}</Text>
          ) : (
            <TextInput
              style={styles.scoreInput}
              placeholder="0"
              value={sets_convocante}
              onChangeText={setSetsConvocante}
              keyboardType="numeric"
              maxLength={1}
            />
          )}
        </View>

        <Text style={styles.vs}>vs</Text>

        <View style={styles.jugadorRow}>
          <Text style={styles.jugadorNombre}>{partido.rival_nombre}</Text>
          {puedoConfirmar ? (
            <Text style={styles.scoreTexto}>{partido.sets_rival}</Text>
          ) : (
            <TextInput
              style={styles.scoreInput}
              placeholder="0"
              value={sets_rival}
              onChangeText={setSetsRival}
              keyboardType="numeric"
              maxLength={1}
            />
          )}
        </View>
      </View>

      {puedoConfirmar ? (
        <View>
          <View style={styles.aviso}>
            <Text style={styles.avisoTexto}>
              ✅ Tu rival cargó este resultado. ¿Es correcto?
            </Text>
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
              <Text style={styles.avisoTexto}>
                ⏳ Resultado cargado. Esperando confirmación del rival.
              </Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.boton} onPress={cargarResultado} disabled={cargando}>
              <Text style={styles.botonTexto}>{cargando ? 'Guardando...' : 'Enviar resultado'}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
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
  scoreTexto: {
    fontSize: 28,
    fontWeight: '500',
    color: '#1D9E75',
    width: 48,
    textAlign: 'center',
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
    marginBottom: 10,
  },
  botonTexto: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  botonRechazar: {
    borderWidth: 0.5,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  botonRechazarTexto: {
    color: '#999',
    fontSize: 15,
  },
});