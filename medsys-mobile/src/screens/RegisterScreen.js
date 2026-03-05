import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/api'
import { colors, radius, shadow } from '../theme'

const STEPS = ['Compte', 'Identité', 'Médical', 'Antécédents', 'Finaliser']

function StepBar({ current }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
      {STEPS.map((label, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
          <View style={{ alignItems: 'center' }}>
            <View style={[styles.stepCircle,
              i < current ? styles.stepDone : i === current ? styles.stepActive : styles.stepPending]}>
              <Text style={{ color: i <= current ? 'white' : colors.gray, fontSize: 11, fontWeight: '700' }}>
                {i < current ? '✓' : i + 1}
              </Text>
            </View>
          </View>
          {i < STEPS.length - 1 && (
            <View style={[styles.stepLine, i < current && { backgroundColor: colors.success }]}/>
          )}
        </View>
      ))}
    </View>
  )
}

export default function RegisterScreen({ navigation }) {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '',
    nom: '', prenom: '', cin: '', dateNaissance: '', sexe: 'MASCULIN', telephone: '', ville: '',
    groupeSanguin: '', mutuelle: '', numeroCNSS: '',
    antecedents: [], ordonnances: [], analyses: []
  })
  const { login } = useAuth()

  const up = (field) => (v) => setForm(f => ({ ...f, [field]: v }))

  const next = () => {
    if (step === 0) {
      if (!form.email || !form.password) return Alert.alert('Erreur', 'Email et mot de passe requis')
      if (form.password !== form.confirmPassword) return Alert.alert('Erreur', 'Les mots de passe ne correspondent pas')
      if (form.password.length < 8) return Alert.alert('Erreur', 'Minimum 8 caractères')
    }
    if (step === 1) {
      if (!form.nom || !form.prenom || !form.cin || !form.dateNaissance)
        return Alert.alert('Erreur', 'Nom, prénom, CIN et date de naissance obligatoires')
    }
    setStep(s => s + 1)
  }

  const submit = async () => {
    setLoading(true)
    try {
      const payload = { ...form }
      delete payload.confirmPassword
      const { data } = await authApi.register(payload)
      await login(data, data.token)
    } catch (err) {
      Alert.alert('Erreur', err.response?.data?.message || 'Erreur lors de l\'inscription')
    } finally { setLoading(false) }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient colors={['#064e3b', '#059669']} style={styles.header}>
        <TouchableOpacity onPress={() => step === 0 ? navigation.goBack() : setStep(s => s - 1)} style={{ marginBottom: 12 }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📝 Créer votre dossier</Text>
        <Text style={styles.headerSub}>{STEPS[step]} — étape {step + 1}/{STEPS.length}</Text>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        <StepBar current={step} />

        {step === 0 && (
          <View>
            <Text style={styles.sectionTitle}>🔐 Informations de connexion</Text>
            <Input label="Email *" value={form.email} onChange={up('email')} type="email-address" />
            <Input label="Mot de passe * (min. 8 car.)" value={form.password} onChange={up('password')} secure />
            <Input label="Confirmer le mot de passe *" value={form.confirmPassword} onChange={up('confirmPassword')} secure />
          </View>
        )}

        {step === 1 && (
          <View>
            <Text style={styles.sectionTitle}>👤 Informations personnelles</Text>
            <Input label="Nom *" value={form.nom} onChange={up('nom')} />
            <Input label="Prénom *" value={form.prenom} onChange={up('prenom')} />
            <Input label="CIN *" value={form.cin} onChange={v => setForm(f => ({...f, cin: v.toUpperCase()}))} />
            <Input label="Date de naissance * (AAAA-MM-JJ)" value={form.dateNaissance} onChange={up('dateNaissance')} placeholder="2001-03-20" />
            <Input label="Téléphone" value={form.telephone} onChange={up('telephone')} type="phone-pad" />
            <Input label="Ville" value={form.ville} onChange={up('ville')} />
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.sectionTitle}>🩺 Informations médicales</Text>
            <Picker label="Groupe sanguin" value={form.groupeSanguin} onChange={up('groupeSanguin')}
              options={['', 'A_POSITIF', 'A_NEGATIF', 'B_POSITIF', 'B_NEGATIF', 'AB_POSITIF', 'AB_NEGATIF', 'O_POSITIF', 'O_NEGATIF']} />
            <Input label="Mutuelle" value={form.mutuelle} onChange={up('mutuelle')} placeholder="CNSS, RAMED..." />
            <Input label="Numéro CNSS" value={form.numeroCNSS} onChange={up('numeroCNSS')} />
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.sectionTitle}>📋 Antécédents médicaux</Text>
            <Text style={styles.optionalNote}>Optionnel — Ajoutez vos antécédents avant notre hôpital</Text>
            {form.antecedents.map((a, i) => (
              <View key={i} style={styles.itemRow}>
                <Text style={{ flex: 1, fontSize: 13 }}>{a.type} — {a.description}</Text>
                <TouchableOpacity onPress={() => setForm(f => ({...f, antecedents: f.antecedents.filter((_,j) => j !== i)}))}>
                  <Text style={{ color: colors.danger, fontSize: 18 }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            <QuickAddAntecedent onAdd={(item) => setForm(f => ({...f, antecedents: [...f.antecedents, item]}))} />

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>💊 Ordonnances antérieures</Text>
            <Text style={styles.optionalNote}>Optionnel</Text>
            {form.ordonnances.map((o, i) => (
              <View key={i} style={styles.itemRow}>
                <Text style={{ flex: 1, fontSize: 13 }}>{o.type} — {o.medicaments?.substring(0,30)}</Text>
                <TouchableOpacity onPress={() => setForm(f => ({...f, ordonnances: f.ordonnances.filter((_,j) => j !== i)}))}>
                  <Text style={{ color: colors.danger, fontSize: 18 }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            <QuickAddOrdonnance onAdd={(item) => setForm(f => ({...f, ordonnances: [...f.ordonnances, item]}))} />
          </View>
        )}

        {step === 4 && (
          <View>
            <Text style={styles.sectionTitle}>✅ Récapitulatif</Text>
            {[
              ['Email', form.email], ['Nom', `${form.prenom} ${form.nom}`],
              ['CIN', form.cin], ['Date naissance', form.dateNaissance],
              ['Téléphone', form.telephone || '—'], ['Groupe sanguin', form.groupeSanguin || '—'],
              ['Mutuelle', form.mutuelle || '—'],
              ['Antécédents', `${form.antecedents.length} enregistré(s)`],
              ['Ordonnances', `${form.ordonnances.length} enregistrée(s)`],
            ].map(([k,v]) => (
              <View key={k} style={styles.recapRow}>
                <Text style={styles.recapLabel}>{k}</Text>
                <Text style={styles.recapValue}>{v}</Text>
              </View>
            ))}
            <View style={{ backgroundColor: colors.successLight, borderRadius: radius.sm, padding: 14, marginTop: 16 }}>
              <Text style={{ color: colors.success, fontSize: 13, lineHeight: 20 }}>
                🔒 Vos données sont sécurisées et chiffrées. En créant ce dossier, vous acceptez que vos informations médicales soient utilisées pour votre prise en charge.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.navButtons}>
          {step < STEPS.length - 1 ? (
            <TouchableOpacity style={styles.nextBtn} onPress={next}>
              <Text style={styles.nextBtnText}>Suivant →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.nextBtn, { backgroundColor: colors.success }]} onPress={submit} disabled={loading}>
              {loading ? <ActivityIndicator color="white"/> : <Text style={styles.nextBtnText}>✅ Créer mon dossier</Text>}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

function Input({ label, value, onChange, secure, type, placeholder }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChange}
        secureTextEntry={secure} keyboardType={type || 'default'}
        autoCapitalize="none" placeholder={placeholder || ''}
        placeholderTextColor={colors.gray} />
    </View>
  )
}

function Picker({ label, value, onChange, options }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
        {options.map(opt => (
          <TouchableOpacity key={opt} onPress={() => onChange(opt)}
            style={[styles.chip, value === opt && styles.chipActive]}>
            <Text style={[styles.chipText, value === opt && styles.chipTextActive]}>
              {opt || '-- Non renseigné --'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

function QuickAddAntecedent({ onAdd }) {
  const [form, setForm] = useState({ type: 'MEDICAL', description: '' })
  return (
    <View style={styles.addBox}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        {['MEDICAL','CHIRURGICAL','FAMILIAL','ALLERGIE'].map(t => (
          <TouchableOpacity key={t} onPress={() => setForm(f => ({...f, type: t}))}
            style={[styles.chip, form.type === t && styles.chipActive]}>
            <Text style={[styles.chipText, form.type === t && styles.chipTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TextInput style={styles.input} value={form.description} onChangeText={v => setForm(f => ({...f, description: v}))}
        placeholder="Description de l'antécédent..." placeholderTextColor={colors.gray} />
      <TouchableOpacity onPress={() => { if(form.description){ onAdd({...form}); setForm({ type: 'MEDICAL', description: '' }) }}}
        style={[styles.addBtn, { marginTop: 8 }]}>
        <Text style={styles.addBtnText}>+ Ajouter</Text>
      </TouchableOpacity>
    </View>
  )
}

function QuickAddOrdonnance({ onAdd }) {
  const [form, setForm] = useState({ type: 'TRAITEMENT_COURT', medicaments: '', date: '' })
  return (
    <View style={styles.addBox}>
      <TextInput style={styles.input} value={form.medicaments} onChangeText={v => setForm(f => ({...f, medicaments: v}))}
        placeholder="Médicaments (Amoxicilline 500mg...)" placeholderTextColor={colors.gray} />
      <TextInput style={[styles.input, { marginTop: 8 }]} value={form.date} onChangeText={v => setForm(f => ({...f, date: v}))}
        placeholder="Date (AAAA-MM-JJ)" placeholderTextColor={colors.gray} />
      <TouchableOpacity onPress={() => { if(form.medicaments){ onAdd({...form}); setForm({ type: 'TRAITEMENT_COURT', medicaments: '', date: '' }) }}}
        style={[styles.addBtn, { marginTop: 8 }]}>
        <Text style={styles.addBtnText}>+ Ajouter</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  header: { padding: 20, paddingTop: 50 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: 'white', marginBottom: 4 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  stepCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepDone: { backgroundColor: colors.success },
  stepActive: { backgroundColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 4 },
  stepPending: { backgroundColor: colors.border },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.border, marginHorizontal: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.dark, marginBottom: 4 },
  optionalNote: { fontSize: 12, color: colors.gray, marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '700', color: colors.dark, marginBottom: 5 },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.sm, padding: 11, fontSize: 14, color: colors.dark, backgroundColor: 'white' },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, marginRight: 8, backgroundColor: 'white' },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.gray },
  chipTextActive: { color: 'white' },
  addBox: { backgroundColor: colors.grayLight, borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  addBtn: { backgroundColor: colors.primary, borderRadius: radius.sm, padding: 10, alignItems: 'center' },
  addBtnText: { color: 'white', fontWeight: '700', fontSize: 13 },
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: radius.sm, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: colors.border },
  recapRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: colors.border },
  recapLabel: { fontSize: 13, color: colors.gray },
  recapValue: { fontSize: 13, fontWeight: '700', color: colors.dark },
  navButtons: { marginTop: 24, marginBottom: 40 },
  nextBtn: { backgroundColor: colors.primary, borderRadius: radius.sm, padding: 15, alignItems: 'center' },
  nextBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
})
