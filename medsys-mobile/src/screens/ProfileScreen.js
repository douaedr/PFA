import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { colors, radius, shadow } from '../theme'

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: logout }
    ])
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: 'white' }}>
            {user?.prenom?.[0]}{user?.nom?.[0]}
          </Text>
        </View>
        <Text style={styles.name}>{user?.prenom} {user?.nom}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={{ color: colors.success, fontSize: 12, fontWeight: '700' }}>● {user?.role}</Text>
        </View>
      </View>

      <View style={{ padding: 16 }}>
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.cardTitle}>Informations du compte</Text>
          {[
            ['ID Patient', user?.patientId || '—'],
            ['Email', user?.email],
            ['Rôle', user?.role],
          ].map(([k,v]) => (
            <View key={k} style={styles.row}>
              <Text style={styles.rowLabel}>{k}</Text>
              <Text style={styles.rowValue}>{v}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={[styles.card, { marginTop: 12 }, shadow.sm]}
          onPress={() => Alert.alert('Info', 'Fonctionnalité à connecter au backend')}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>
            🔑 Changer le mot de passe
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#1e3a8a', padding: 32, alignItems: 'center', paddingTop: 52 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#059669',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  name: { fontSize: 22, fontWeight: '800', color: 'white', marginBottom: 4 },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 10 },
  roleBadge: { backgroundColor: '#d1fae5', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  card: { backgroundColor: 'white', borderRadius: radius.md, padding: 18, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 14, fontWeight: '800', color: colors.dark, marginBottom: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: colors.grayLight },
  rowLabel: { fontSize: 13, color: colors.gray },
  rowValue: { fontSize: 13, fontWeight: '600', color: colors.dark },
  logoutBtn: { backgroundColor: colors.dangerLight, borderRadius: radius.md, padding: 16, alignItems: 'center', marginTop: 16, borderWidth: 1, borderColor: '#fca5a5' },
  logoutText: { color: colors.danger, fontWeight: '700', fontSize: 14 },
})
