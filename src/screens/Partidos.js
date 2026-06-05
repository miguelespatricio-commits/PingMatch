import * as Linking from 'expo-linking';
import { collection, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../config/firebase';

export default function Partidos({ navigation }) {
  const [partidos, setPartidos] = useState([]);
  const [miCategoria, setMiCategoria] = useState('');

  useEffect(() => {
    const cargarPerfil = async () => {
      if (auth.currentUser) {
        const snap = await getDoc(doc(db, 'usuarios', auth.currentUser.uid));
        if (snap.exists()) {
          setMiCategoria(snap.data().categoria);
        }
      }
    };
    cargarPerfil();
  }, []);

  useEffect(() => {
    const categorias = ['Élite', '1ª División', '2ª División', '3ª División', '4ª División', '5ª División', '6ª División', '7ª División', '8ª División'];
    const unsub = onSnapshot(collection(db, 'partidos'), (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sinTerminados = lista.filter(partido => !partido.resultado_confirmado);
      const listaFiltrada = sinTerminados.filter(partido => {
        if (!partido.filtro_categoria) return true;
        if (partido.filtro_categoria === 'Cualquiera') return true;
        if (partido.filtro_categoria === 'Solo mi categoría') return partido.categoria === miCategoria;
        if (partido.filtro_categoria === 'Mi categoría o superior') {
          const indexMio = categorias.indexOf(miCategoria);
          const indexPartido = categorias.indexOf(partido.categoria);
          return indexPartido <= indexMio;
        }
        return true;
      });
      setPartidos(listaFiltrada);
    });
    return unsub;
  }, [miCategoria]);

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
    try {
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

  const contactarWhatsApp = (numero, nombre) => {
    const mensaje = encodeURIComponent(`Hola ${nombre}, te escribo por el partido que armamos en PingMatch.`);
    const url = `whatsapp://send?phone=54${numero}&text=${mensaje}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'No se pudo abrir WhatsApp. Verificá que esté instalado.');
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.tituloRow}>
  <Text style={styles.titulo}>Mesas disponibles</Text>
  <TouchableOpacity onPress={() => {
  console.log('Navegando a Perfil...');
  navigation.navigate('Perfil');
}}>
    <Text style={styles.perfilBtn}>👤 Perfil</Text>
  </TouchableOpacity>
</View>

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
            {partido.tipo && (
              <Text style={styles.cardDetalle}>
                {partido.tipo === 'Ranking' ? '🏆 Por ranking' : '🤝 Amistoso'}
              </Text>
            )}
            {partido.estado === 'abierta' && partido.convocante !== auth.currentUser?.uid && (
              <TouchableOpacity style={styles.btnUnirse} onPress={() => unirse(partido)}>
                <Text style={styles.btnUnirseTexto}>¡Me uno!</Text>
              </TouchableOpacity>
            )}
  {partido.estado === 'cerrada' &&
  (partido.convocante === auth.currentUser?.uid || partido.rival === auth.currentUser?.uid) &&
  (partido.resultado_pendiente || !partido.resultado_pendiente) && (
  <View>
  {partido.tipo !== 'Amistoso' && (
  <TouchableOpacity style={styles.btnResultado} onPress={() => navigation.navigate('Resultado', { partido })}>
    <Text style={styles.btnResultadoTexto}>Cargar resultado</Text>
  </TouchableOpacity>
)}
    <TouchableOpacity
      style={styles.btnWhatsapp}
      onPress={() => {
        const esConvocante = auth.currentUser?.uid === partido.convocante;
        const numeroContacto = esConvocante ? partido.rival_celular : partido.convocante_celular;
        const nombreContacto = esConvocante ? partido.rival_nombre : partido.convocante_nombre;
        contactarWhatsApp(numeroContacto, nombreContacto);
      }}
    >
      <Text style={styles.btnWhatsappTexto}>💬 Contactar por WhatsApp</Text>
    </TouchableOpacity>
    {partido.rival === auth.currentUser?.uid && (
      <TouchableOpacity
        style={styles.btnSalir}
        onPress={() => {
          Alert.alert(
            'Salir de la mesa',
            '¿Confirmás que querés salir? La mesa volverá a quedar abierta.',
            [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Salir',
                style: 'destructive',
                onPress: async () => {
                  await updateDoc(doc(db, 'partidos', partido.id), {
                    rival: null,
                    rival_nombre: null,
                    rival_celular: null,
                    estado: 'abierta',
                  });
                },
              },
            ]
          );
        }}
      >
        <Text style={styles.btnSalirTexto}>Salir de la mesa</Text>
      </TouchableOpacity>
    )}
  </View>
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
  btnWhatsapp: {
    backgroundColor: '#25D366',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  btnWhatsappTexto: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  btnSalir: {
  backgroundColor: '#FCEBEB',
  borderRadius: 8,
  paddingVertical: 8,
  alignItems: 'center',
  marginTop: 6,
},
btnSalirTexto: {
  color: '#A32D2D',
  fontSize: 13,
  fontWeight: '500',
},
tituloRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20,
},
perfilBtn: {
  fontSize: 14,
  color: '#1D9E75',
  fontWeight: '500',
},
});