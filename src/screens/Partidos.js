import * as Linking from 'expo-linking';
import { collection, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../config/firebase';

export default function Partidos({ navigation }) {
  const insets = useSafeAreaInsets();
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
  if (partido.filtro_categoria === 'Mi categoría o superior') return true;
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
      const jugadoresActuales = [
        partido.convocante,
        partido.rival1,
        partido.rival2,
        partido.rival3,
      ].filter(Boolean).length;

      if (jugadoresActuales >= 4) {
        Alert.alert('Mesa llena', 'Esta mesa de dobles ya tiene 4 jugadores.');
        return;
      }

      const snap = await getDoc(doc(db, 'usuarios', auth.currentUser.uid));
      const perfil = snap.data();
      const campoRival = !partido.rival1 ? 'rival1' : !partido.rival2 ? 'rival2' : 'rival3';
      const campoNombre = campoRival + '_nombre';
      const campoCelular = campoRival + '_celular';


      const totalDespues = jugadoresActuales + 1;
      await updateDoc(doc(db, 'partidos', partido.id), {
        [campoRival]: auth.currentUser.uid,
        [campoNombre]: perfil.nombre + ' ' + perfil.apellido,
        [campoCelular]: perfil.celular || '',
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
  const miNombre = partido.convocante === auth.currentUser?.uid
    ? partido.convocante_nombre
    : partido.rival_nombre;
  const mensaje = encodeURIComponent(
    `Hola ${nombre}, soy ${miNombre} 👋\n\n` +
    `Te escribo por nuestro partido en PingMatch 🏓\n\n` +
    `📅 ${partido.fecha} a las ${partido.hora}\n` +
    `📍 ${partido.lugar}\n` +
    `🏓 ${partido.modalidad} · ${partido.tipo}`
  );
  const url = `whatsapp://send?phone=549${numeroLimpio}&text=${mensaje}`;
  Linking.openURL(url).catch(() => {
    Alert.alert('Error', 'No se pudo abrir WhatsApp. Verificá que esté instalado.');
  });
};
  const cancelarPartido = async (partido) => {
  const ahora = new Date();
  const fechaPartido = partido.fechaHora?.toDate ? partido.fechaHora.toDate() : null;
  const menosde24hs = fechaPartido && (fechaPartido - ahora) < 24 * 60 * 60 * 1000;
  const esConvocante = auth.currentUser?.uid === partido.convocante;

  if (partido.estado === 'abierta') {
    Alert.alert(
      'Cancelar partido',
      '¿Confirmás que querés cancelar esta mesa?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            await updateDoc(doc(db, 'partidos', partido.id), {
              estado: 'cancelada',
              resultado_confirmado: true,
            });
          }
        }
      ]
    );
    return;
  }

  if (partido.estado === 'cerrada' && !menosde24hs) {
    Alert.alert(
      'Cancelar partido',
      '¿Confirmás que querés cancelar? El rival será notificado.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            await updateDoc(doc(db, 'partidos', partido.id), {
              estado: 'cancelada',
              resultado_confirmado: true,
            });
          }
        }
      ]
    );
    return;
  }

  if (partido.estado === 'cerrada' && menosde24hs) {
    const yaPidio = esConvocante ? partido.cancelacion_pedida_convocante : partido.cancelacion_pedida_rival;
    const otroPidio = esConvocante ? partido.cancelacion_pedida_rival : partido.cancelacion_pedida_convocante;

    if (otroPidio) {
      Alert.alert(
        'Confirmar cancelación',
        'Tu rival quiere cancelar el partido. ¿Estás de acuerdo?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Sí, cancelar',
            style: 'destructive',
            onPress: async () => {
              await updateDoc(doc(db, 'partidos', partido.id), {
                estado: 'cancelada',
                resultado_confirmado: true,
              });
            }
          }
        ]
      );
    } else if (yaPidio) {
      Alert.alert('Esperando', 'Ya solicitaste cancelar. Esperando confirmación del rival.');
    } else {
      Alert.alert(
        'Solicitar cancelación',
        'Faltan menos de 24hs para el partido. Tu rival deberá confirmar la cancelación.',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Solicitar',
            onPress: async () => {
              const campo = esConvocante ? 'cancelacion_pedida_convocante' : 'cancelacion_pedida_rival';
              await updateDoc(doc(db, 'partidos', partido.id), {
                [campo]: true,
              });
              Alert.alert('Solicitud enviada', 'Tu rival verá tu pedido de cancelación.');
            }
          }
        ]
      );
    }
  }
};

  return (
    <View style={styles.container}>
      <View style={styles.tituloRow}>
  <Text style={styles.titulo}>Mesas disponibles</Text>
  <View style={styles.headerBtns}>
    <TouchableOpacity onPress={() => navigation.navigate('Ranking')}>
      <Text style={styles.perfilBtn}>🏆 Ranking</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={() => navigation.navigate('Perfil')}>
      <Text style={styles.perfilBtn}>👤 Perfil</Text>
    </TouchableOpacity>
  </View>
</View>

      <ScrollView style={styles.lista}>
        {partidos.length === 0 && (
          <Text style={styles.vacio}>No hay partidos disponibles. ¡Convocá uno!</Text>
        )}
        {partidos.map((partido) => (
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
     {partido.estado === 'abierta' && partido.convocante === auth.currentUser?.uid && (
  <View>
    <TouchableOpacity style={styles.btnEditar} onPress={() => navigation.navigate('EditarPartido', { partido })}>
      <Text style={styles.btnEditarTexto}>✏️ Editar mesa</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.btnCancelar} onPress={() => cancelarPartido(partido)}>
      <Text style={styles.btnCancelarTexto}>Cancelar mesa</Text>
    </TouchableOpacity>
  </View>
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
   {partido.tipo === 'Amistoso' && (
  <View>
    <TouchableOpacity style={styles.btnResultado} onPress={() => navigation.navigate('Resultado', { partido })}>
      <Text style={styles.btnResultadoTexto}>Anotar resultado (opcional)</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.btnCerrar} onPress={() => {
      Alert.alert(
        'Cerrar partido',
        '¿Confirmás que el partido amistoso ya se jugó?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Cerrar',
            onPress: async () => {
              await updateDoc(doc(db, 'partidos', partido.id), {
                resultado_confirmado: true,
                resultado_pendiente: false,
              });
            }
          }
        ]
      );
    }}>
      <Text style={styles.btnCerrarTexto}>Dar partido por jugado</Text>
    </TouchableOpacity>
  </View>
)}
    <TouchableOpacity
      style={styles.btnWhatsapp}
      onPress={() => {
        const esConvocante = auth.currentUser?.uid === partido.convocante;
        const numeroContacto = esConvocante ? partido.rival_celular : partido.convocante_celular;
        const nombreContacto = esConvocante ? partido.rival_nombre : partido.convocante_nombre;
        contactarWhatsApp(numeroContacto, nombreContacto, partido);
      }}
    >
      
      <Text style={styles.btnWhatsappTexto}>💬 Contactar por WhatsApp</Text>
    </TouchableOpacity>
    {(partido.convocante === auth.currentUser?.uid || partido.rival === auth.currentUser?.uid) && (
  <TouchableOpacity
    style={styles.btnCancelar}
    onPress={() => cancelarPartido(partido)}
  >
    <Text style={styles.btnCancelarTexto}>
      {partido.cancelacion_pedida_convocante || partido.cancelacion_pedida_rival
        ? '⚠️ Cancelación pendiente'
        : 'Cancelar partido'}
    </Text>
  </TouchableOpacity>
)}
{partido.rival === auth.currentUser?.uid && !partido.cancelacion_pedida_convocante && !partido.cancelacion_pedida_rival && (
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

      <TouchableOpacity style={[styles.btnNuevo, { marginBottom: insets.bottom + 8 }]} onPress={() => navigation.navigate('NuevoPartido')}>
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
badgesRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
},
badgeFiltro: {
  backgroundColor: '#E6F1FB',
  borderRadius: 99,
  paddingVertical: 2,
  paddingHorizontal: 8,
},
badgeFiltroTexto: {
  fontSize: 10,
  color: '#0C447C',
  fontWeight: '500',
},
btnCerrar: {
  backgroundColor: '#EEEDFE',
  borderRadius: 8,
  paddingVertical: 8,
  alignItems: 'center',
  marginTop: 6,
},
btnCerrarTexto: {
  color: '#3C3489',
  fontSize: 13,
  fontWeight: '500',
},
btnCancelar: {
  backgroundColor: '#FCEBEB',
  borderRadius: 8,
  paddingVertical: 8,
  alignItems: 'center',
  marginTop: 6,
},
btnCancelarTexto: {
  color: '#A32D2D',
  fontSize: 13,
  fontWeight: '500',
},
headerBtns: {
  flexDirection: 'row',
  gap: 12,
},
btnEditar: {
  backgroundColor: '#E1F5EE',
  borderRadius: 8,
  paddingVertical: 8,
  alignItems: 'center',
  marginTop: 6,
},
btnEditarTexto: {
  color: '#085041',
  fontSize: 13,
  fontWeight: '500',
},
});