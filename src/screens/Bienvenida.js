import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function Bienvenida({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>

      <Text style={styles.logo}>🏓</Text>
      <Text style={styles.titulo}>PingMatch</Text>
      <Text style={styles.subtitulo}>
        Encontrá rivales, jugá partidos amistosos y subí en el ranking de tu categoría.
      </Text>

      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Categorías</Text>
        {[
          { nombre: 'Élite', descripcion: 'Máximo nivel. Requiere aval de club.' },
          { nombre: '1ª División', descripcion: 'Jugadores de alto nivel competitivo.' },
          { nombre: '2ª a 8ª División', descripcion: 'Todos los niveles tienen su lugar.' },
        ].map((cat) => (
          <View key={cat.nombre} style={styles.categoriaCard}>
            <Text style={styles.categoriaNombre}>{cat.nombre}</Text>
            <Text style={styles.categoriaDesc}>{cat.descripcion}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.boton} onPress={() => navigation.navigate('Registro')}>
        <Text style={styles.botonTexto}>Registrarme</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.botonSecundario} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.botonSecundarioTexto}>Ya tengo cuenta</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  logo: {
    fontSize: 64,
    marginBottom: 8,
  },
  titulo: {
    fontSize: 32,
    fontWeight: '500',
    color: '#1D9E75',
    marginBottom: 12,
  },
  subtitulo: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  seccion: {
    width: '100%',
    marginBottom: 32,
  },
  seccionTitulo: {
    fontSize: 13,
    fontWeight: '500',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  categoriaCard: {
    backgroundColor: '#F7F7F5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  categoriaNombre: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1D9E75',
    marginBottom: 2,
  },
  categoriaDesc: {
    fontSize: 12,
    color: '#666',
  },
  boton: {
    backgroundColor: '#1D9E75',
    borderRadius: 10,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  botonTexto: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  botonSecundario: {
    borderWidth: 0.5,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  botonSecundarioTexto: {
    color: '#666',
    fontSize: 15,
  },
});