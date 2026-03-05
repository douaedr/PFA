import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { authApi } from '../api/api'
import { colors, radius } from '../theme'

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSend = async () => {
    if (!email) return Alert.alert('Erreur', 'Veuillez saisir votre email')
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
    } finally {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <LinearGradient colors={['#1e3a8a', '#2563eb']} style={styles.container}>
      <View style={styles.card}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.primary, fontSize: 13 }}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.icon}>🔑</Text>
        <Text style={styles.title}>Mot de passe oublié</Text>
        <Text style={styles.sub}>Saisissez votre email pour recevoir un lien de réinitialisation</Text>

        {sent ? (
          <View style={styles.successBox}>
            <Text style={{ color: colors.success, fontWeight: '700', fontSize: 14 }}>
              ✅ Email envoyé !
            </Text>
            <Text style={{ color: colors.success, fontSize: 13, marginTop: 6 }}>
              Vérifiez votre boîte mail et suivez le lien pour réinitialiser votre mot de passe.
            </Text>
          </View>
        ) : (
          <>
            <TextInput style={styles.input} value={email} onChangeText={setEmail}
              placeholder="votre@email.com" placeholderTextColor={colors.gray}
              keyboardType="email-address" autoCapitalize="none" />
            <TouchableOpacity style={styles.btn} onPress={handleSend} disabled={loading}>
              {loading ? <ActivityIndicator color="white"/> : <Text style={styles.btnText}>📧 Envoyer le lien</Text>}
            </TouchableOpacity>
          </>
        )}
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: 'white', borderRadius: 24, padding: 28 },
  icon: { fontSize: 40, textAlign: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: colors.dark, textAlign: 'center', marginBottom: 8 },
  sub: { fontSize: 13, color: colors.gray, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.sm, padding: 12, fontSize: 14, color: colors.dark, marginBottom: 14 },
  btn: { backgroundColor: colors.primary, borderRadius: radius.sm, padding: 14, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  successBox: { backgroundColor: colors.successLight, borderRadius: radius.sm, padding: 16 },
})
