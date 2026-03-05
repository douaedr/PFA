import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../context/AuthContext'
import { colors, radius, shadow } from '../theme'

export default function HomeScreen() {
  const { user } = useAuth()

  const cards = [
    { icon: '📋', title: 'Mon dossier', sub: 'Informations médicales', color: colors.primaryLight, tab: 'Dossier' },
    { icon: '📅', title: 'Rendez-vous', sub: 'Prochains RDV', color: colors.successLight, tab: 'RDV' },
    { icon: '🧪', title: 'Analyses', sub: 'Résultats & suivi', color: colors.warningLight, tab: 'Analyses' },
  ]

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Banner */}
      <LinearGradient colors={['#1e3a8a', '#2563eb', '#0891b2']} style={styles.banner}>
        <View style={styles.bannerAvatar}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: 'white' }}>
            {user?.prenom?.[0]}{user?.nom?.[0]}
          </Text>
        </View>
        <Text style={styles.bannerGreeting}>Bonjour, {user?.prenom} 👋</Text>
        <Text style={styles.bannerSub}>Votre espace santé personnel</Text>
        <View style={styles.cinBadge}>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' }}>
            🪪 ID: {user?.patientId || '—'}
          </Text>
        </View>
      </LinearGradient>

      <View style={{ padding: 16 }}>
        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Accès rapide</Text>
        <View style={styles.quickGrid}>
          {cards.map((card, i) => (
            <TouchableOpacity key={i} style={[styles.quickCard, shadow.sm]}>
              <View style={[styles.quickIcon, { backgroundColor: card.color }]}>
                <Text style={{ fontSize: 22 }}>{card.icon}</Text>
              </View>
              <Text style={styles.quickTitle}>{card.title}</Text>
              <Text style={styles.quickSub}>{card.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info card */}
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Mes informations</Text>
        <View style={[styles.infoCard, shadow.sm]}>
          {[
            ['Nom complet', `${user?.prenom} ${user?.nom}`],
            ['Email', user?.email],
            ['Rôle', user?.role],
          ].map(([k,v]) => (
            <View key={k} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{k}</Text>
              <Text style={styles.infoValue}>{v}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  banner: { padding: 24, paddingTop: 48, alignItems: 'center' },
  bannerAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  bannerGreeting: { fontSize: 22, fontWeight: '800', color: 'white', marginBottom: 4 },
  bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 14 },
  cinBadge: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.dark, marginBottom: 12 },
  quickGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  quickCard: { flex: 1, backgroundColor: 'white', borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: colors.border },
  quickIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  quickTitle: { fontSize: 13, fontWeight: '700', color: colors.dark, marginBottom: 3 },
  quickSub: { fontSize: 11, color: colors.gray },
  infoCard: { backgroundColor: 'white', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderColor: colors.grayLight },
  infoLabel: { fontSize: 13, color: colors.gray },
  infoValue: { fontSize: 13, fontWeight: '700', color: colors.dark, maxWidth: '60%', textAlign: 'right' },
})
