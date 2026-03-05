import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/api'

const STEPS = ['Compte', 'Identité', 'Médical', 'Antécédents', 'Ordonnances', 'Analyses']

const GROUPES_SANGUINS = ['A_POSITIF','A_NEGATIF','B_POSITIF','B_NEGATIF','AB_POSITIF','AB_NEGATIF','O_POSITIF','O_NEGATIF']
const ANTECEDENT_TYPES = ['MEDICAL','CHIRURGICAL','FAMILIAL','ALLERGIE']
const ORDONNANCE_TYPES = ['TRAITEMENT_COURT','TRAITEMENT_LONG','RENOUVELLEMENT']

function StepIndicator({ current, total }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 28, gap: 0 }}>
      {STEPS.map((label, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length-1 ? 1 : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
              background: i < current ? '#059669' : i === current ? '#2563eb' : '#e5e7eb',
              color: i <= current ? 'white' : '#6b7280',
              boxShadow: i === current ? '0 0 0 4px #dbeafe' : 'none',
              transition: 'all 0.3s'
            }}>
              {i < current ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: 9, color: i === current ? '#2563eb' : '#9ca3af', fontWeight: i === current ? 700 : 400, whiteSpace: 'nowrap' }}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < current ? '#059669' : '#e5e7eb', marginBottom: 16, transition: 'all 0.3s' }} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function PatientPortalPage() {
  const [view, setView] = useState('choice') // choice | login | register
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '',
    nom: '', prenom: '', cin: '', dateNaissance: '', sexe: 'MASCULIN', telephone: '', adresse: '', ville: '',
    groupeSanguin: '', mutuelle: '', numeroCNSS: '',
    antecedents: [], ordonnances: [], analyses: []
  })
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMsg, setForgotMsg] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const { data } = await authApi.login(loginForm)
      if (data.role !== 'PATIENT') {
        setError('Cet espace est réservé aux patients.')
        return
      }
      login(data, data.token)
      navigate('/patient/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Identifiants incorrects')
    } finally { setLoading(false) }
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    try {
      await authApi.forgotPassword(forgotEmail)
    } finally {
      setForgotMsg('✅ Si ce compte existe, un email de réinitialisation a été envoyé.')
    }
  }

  // ── REGISTER steps ─────────────────────────────────────────────────────────
  const nextStep = () => {
    setError('')
    if (step === 0) {
      if (!form.email || !form.password) return setError('Email et mot de passe requis')
      if (form.password !== form.confirmPassword) return setError('Les mots de passe ne correspondent pas')
      if (form.password.length < 8) return setError('Minimum 8 caractères')
    }
    if (step === 1) {
      if (!form.nom || !form.prenom || !form.cin || !form.dateNaissance) return setError('Tous les champs obligatoires doivent être remplis')
    }
    setStep(s => s + 1)
  }

  const prevStep = () => { setError(''); setStep(s => s - 1) }

  const addItem = (field, item) => setForm(f => ({ ...f, [field]: [...f[field], item] }))
  const removeItem = (field, idx) => setForm(f => ({ ...f, [field]: f[field].filter((_, i) => i !== idx) }))

  const handleRegister = async () => {
    setLoading(true); setError('')
    try {
      const payload = { ...form }
      delete payload.confirmPassword
      const { data } = await authApi.register(payload)
      login(data, data.token)
      navigate('/patient/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription')
    } finally { setLoading(false) }
  }

  // ── CHOICE ─────────────────────────────────────────────────────────────────
  if (view === 'choice') return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #064e3b, #059669, #0891b2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }} className="fade-in">
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🧑‍💼</div>
        <h1 style={{ fontFamily: 'Syne', fontSize: 32, fontWeight: 800, color: 'white', marginBottom: 8 }}>
          Espace Patient
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 36 }}>
          Votre santé, en toute sécurité
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setView('login')} className="btn btn-lg"
            style={{ background: 'white', color: '#059669', fontFamily: 'Syne', fontWeight: 800, minWidth: 180 }}>
            🔐 Se connecter
          </button>
          <button onClick={() => setView('register')} className="btn btn-lg"
            style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '2px solid rgba(255,255,255,0.4)',
              fontFamily: 'Syne', fontWeight: 800, minWidth: 180 }}>
            📝 S'inscrire
          </button>
        </div>
        <div style={{ marginTop: 24 }}>
          <Link to="/" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textDecoration: 'none' }}>
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  if (view === 'login') return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #064e3b, #059669)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }} className="fade-in">
      <div className="card" style={{ width: '100%', maxWidth: 420, padding: 0, overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #064e3b, #059669)', padding: '28px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔐</div>
          <h1 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, color: 'white' }}>Connexion Patient</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>Accédez à votre espace santé</p>
        </div>
        <div style={{ padding: '28px 32px' }}>
          {!showForgot ? (
            <>
              {error && <div className="alert alert-error">⚠️ {error}</div>}
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" placeholder="votre@email.com"
                    value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Mot de passe</label>
                  <input className="form-input" type="password" placeholder="••••••••"
                    value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
                </div>
                <button className="btn btn-success btn-full btn-lg" disabled={loading} type="submit"
                  style={{ background: '#059669' }}>
                  {loading ? <span className="spinner"/> : '→ Se connecter'}
                </button>
              </form>
              <div style={{ textAlign: 'center', marginTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <button onClick={() => setShowForgot(true)}
                  style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer', fontSize: 13 }}>
                  Mot de passe oublié ?
                </button>
                <button onClick={() => setView('register')}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 13 }}>
                  Créer un compte →
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 16 }}>🔑 Mot de passe oublié</h3>
              {forgotMsg && <div className="alert alert-success">{forgotMsg}</div>}
              <form onSubmit={handleForgot}>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)} required />
                </div>
                <button className="btn btn-full" style={{ background: '#059669', color: 'white' }} type="submit">
                  📧 Envoyer le lien
                </button>
              </form>
              <button onClick={() => setShowForgot(false)}
                style={{ background: 'none', border: 'none', color: 'var(--gray)', cursor: 'pointer', fontSize: 13, marginTop: 12, width: '100%', textAlign: 'center' }}>
                ← Retour
              </button>
            </>
          )}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 20, paddingTop: 16, textAlign: 'center' }}>
            <button onClick={() => setView('choice')} style={{ background: 'none', border: 'none', color: 'var(--gray)', cursor: 'pointer', fontSize: 13 }}>
              ← Retour au choix
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // ── REGISTER ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #064e3b, #059669)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }} className="fade-in">
      <div className="card" style={{ width: '100%', maxWidth: 560, padding: 0, overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #064e3b, #059669)', padding: '20px 28px' }}>
          <h1 style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 800, color: 'white' }}>
            📝 Créer votre dossier patient
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>
            {step + 1}/{STEPS.length} — {STEPS[step]}
          </p>
        </div>

        <div style={{ padding: '24px 28px' }}>
          <StepIndicator current={step} total={STEPS.length} />
          {error && <div className="alert alert-error">⚠️ {error}</div>}

          {/* STEP 0 : Compte */}
          {step === 0 && (
            <div className="fade-in">
              <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 16 }}>🔐 Informations de connexion</h3>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})} placeholder="votre@email.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Mot de passe * (min. 8 caractères)</label>
                <input className="form-input" type="password" value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" />
              </div>
              <div className="form-group">
                <label className="form-label">Confirmer le mot de passe *</label>
                <input className="form-input" type="password" value={form.confirmPassword}
                  onChange={e => setForm({...form, confirmPassword: e.target.value})} placeholder="••••••••" />
              </div>
            </div>
          )}

          {/* STEP 1 : Identité */}
          {step === 1 && (
            <div className="fade-in">
              <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 16 }}>👤 Informations personnelles</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Nom *</label>
                  <input className="form-input" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} placeholder="Alami" />
                </div>
                <div className="form-group">
                  <label className="form-label">Prénom *</label>
                  <input className="form-input" value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} placeholder="Mohamed" />
                </div>
                <div className="form-group">
                  <label className="form-label">CIN *</label>
                  <input className="form-input" value={form.cin} onChange={e => setForm({...form, cin: e.target.value.toUpperCase()})} placeholder="AB123456" />
                </div>
                <div className="form-group">
                  <label className="form-label">Date de naissance *</label>
                  <input className="form-input" type="date" value={form.dateNaissance} onChange={e => setForm({...form, dateNaissance: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Sexe</label>
                  <select className="form-select" value={form.sexe} onChange={e => setForm({...form, sexe: e.target.value})}>
                    <option value="MASCULIN">Masculin</option>
                    <option value="FEMININ">Féminin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Téléphone</label>
                  <input className="form-input" value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} placeholder="0600000000" />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Adresse</label>
                  <input className="form-input" value={form.adresse} onChange={e => setForm({...form, adresse: e.target.value})} placeholder="Rue, quartier..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Ville</label>
                  <input className="form-input" value={form.ville} onChange={e => setForm({...form, ville: e.target.value})} placeholder="Casablanca" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 : Médical */}
          {step === 2 && (
            <div className="fade-in">
              <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 16 }}>🩺 Informations médicales</h3>
              <div className="form-group">
                <label className="form-label">Groupe sanguin</label>
                <select className="form-select" value={form.groupeSanguin} onChange={e => setForm({...form, groupeSanguin: e.target.value})}>
                  <option value="">-- Sélectionner --</option>
                  {GROUPES_SANGUINS.map(g => <option key={g} value={g}>{g.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Mutuelle</label>
                <input className="form-input" value={form.mutuelle} onChange={e => setForm({...form, mutuelle: e.target.value})} placeholder="CNSS, RAMED, AMO..." />
              </div>
              <div className="form-group">
                <label className="form-label">Numéro CNSS</label>
                <input className="form-input" value={form.numeroCNSS} onChange={e => setForm({...form, numeroCNSS: e.target.value})} placeholder="Numéro d'affilié" />
              </div>
              <div className="alert alert-warning" style={{ marginTop: 8 }}>
                ℹ️ Ces informations permettent d'assurer votre prise en charge médicale optimale.
              </div>
            </div>
          )}

          {/* STEP 3 : Antécédents */}
          {step === 3 && (
            <div className="fade-in">
              <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 4 }}>📋 Antécédents médicaux</h3>
              <p style={{ color: 'var(--gray)', fontSize: 13, marginBottom: 16 }}>Optionnel — Vos antécédents avant votre venue à notre hôpital</p>
              <AntecedentForm antecedents={form.antecedents} onAdd={item => addItem('antecedents', item)} onRemove={idx => removeItem('antecedents', idx)} />
            </div>
          )}

          {/* STEP 4 : Ordonnances */}
          {step === 4 && (
            <div className="fade-in">
              <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 4 }}>💊 Ordonnances antérieures</h3>
              <p style={{ color: 'var(--gray)', fontSize: 13, marginBottom: 16 }}>Optionnel — Vos traitements en cours ou passés</p>
              <OrdonnanceForm ordonnances={form.ordonnances} onAdd={item => addItem('ordonnances', item)} onRemove={idx => removeItem('ordonnances', idx)} />
            </div>
          )}

          {/* STEP 5 : Analyses */}
          {step === 5 && (
            <div className="fade-in">
              <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 4 }}>🧪 Analyses antérieures</h3>
              <p style={{ color: 'var(--gray)', fontSize: 13, marginBottom: 16 }}>Optionnel — Vos résultats d'analyses précédents</p>
              <AnalyseForm analyses={form.analyses} onAdd={item => addItem('analyses', item)} onRemove={idx => removeItem('analyses', idx)} />
              <div className="alert alert-success" style={{ marginTop: 16 }}>
                ✅ Vous avez renseigné toutes les informations. Cliquez sur "Créer mon dossier" pour finaliser.
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, gap: 12 }}>
            <button onClick={step === 0 ? () => setView('choice') : prevStep}
              className="btn btn-outline" style={{ minWidth: 100 }}>
              ← {step === 0 ? 'Annuler' : 'Précédent'}
            </button>
            {step < STEPS.length - 1 ? (
              <button onClick={nextStep} className="btn btn-primary" style={{ minWidth: 120 }}>
                Suivant →
              </button>
            ) : (
              <button onClick={handleRegister} className="btn btn-success" disabled={loading} style={{ minWidth: 160 }}>
                {loading ? <span className="spinner"/> : '✅ Créer mon dossier'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AntecedentForm({ antecedents, onAdd, onRemove }) {
  const [form, setForm] = useState({ type: 'MEDICAL', description: '', dateApparition: '' })
  return (
    <div>
      {antecedents.map((a, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', marginBottom: 8 }}>
          <span style={{ fontSize: 13 }}><strong>{a.type}</strong> — {a.description}</span>
          <button onClick={() => onRemove(i)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
      ))}
      <div style={{ background: 'var(--bg)', border: '1px dashed var(--border)', borderRadius: 10, padding: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Type</label>
            <select className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              {['MEDICAL','CHIRURGICAL','FAMILIAL','ALLERGIE'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Date (optionnel)</label>
            <input className="form-input" type="date" value={form.dateApparition} onChange={e => setForm({...form, dateApparition: e.target.value})} />
          </div>
          <div className="form-group" style={{ marginBottom: 0, gridColumn: '1/-1' }}>
            <label className="form-label">Description</label>
            <input className="form-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Diabète type 2, appendicite, allergie pénicilline..." />
          </div>
        </div>
        <button onClick={() => { if(form.description) { onAdd({...form}); setForm({ type: 'MEDICAL', description: '', dateApparition: '' }) }}}
          className="btn btn-primary" style={{ marginTop: 10, padding: '7px 16px', fontSize: 13 }}>
          + Ajouter
        </button>
      </div>
    </div>
  )
}

function OrdonnanceForm({ ordonnances, onAdd, onRemove }) {
  const [form, setForm] = useState({ date: '', type: 'TRAITEMENT_COURT', medicaments: '', observations: '' })
  return (
    <div>
      {ordonnances.map((o, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', marginBottom: 8 }}>
          <span style={{ fontSize: 13 }}><strong>{o.type}</strong> — {o.medicaments?.substring(0,40)}...</span>
          <button onClick={() => onRemove(i)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>✕</button>
        </div>
      ))}
      <div style={{ background: 'var(--bg)', border: '1px dashed var(--border)', borderRadius: 10, padding: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Type</label>
            <select className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              {['TRAITEMENT_COURT','TRAITEMENT_LONG','RENOUVELLEMENT'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, gridColumn: '1/-1' }}>
            <label className="form-label">Médicaments</label>
            <input className="form-input" value={form.medicaments} onChange={e => setForm({...form, medicaments: e.target.value})} placeholder="Amoxicilline 500mg, Ibuprofène 400mg..." />
          </div>
          <div className="form-group" style={{ marginBottom: 0, gridColumn: '1/-1' }}>
            <label className="form-label">Observations</label>
            <input className="form-input" value={form.observations} onChange={e => setForm({...form, observations: e.target.value})} placeholder="Prendre pendant 7 jours..." />
          </div>
        </div>
        <button onClick={() => { if(form.medicaments) { onAdd({...form}); setForm({ date: '', type: 'TRAITEMENT_COURT', medicaments: '', observations: '' }) }}}
          className="btn btn-primary" style={{ marginTop: 10, padding: '7px 16px', fontSize: 13 }}>
          + Ajouter
        </button>
      </div>
    </div>
  )
}

function AnalyseForm({ analyses, onAdd, onRemove }) {
  const [form, setForm] = useState({ typeAnalyse: '', dateAnalyse: '', resultats: '', laboratoire: '', statut: 'TERMINE' })
  return (
    <div>
      {analyses.map((a, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', marginBottom: 8 }}>
          <span style={{ fontSize: 13 }}><strong>{a.typeAnalyse}</strong> — {a.dateAnalyse}</span>
          <button onClick={() => onRemove(i)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>✕</button>
        </div>
      ))}
      <div style={{ background: 'var(--bg)', border: '1px dashed var(--border)', borderRadius: 10, padding: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Type d'analyse</label>
            <input className="form-input" value={form.typeAnalyse} onChange={e => setForm({...form, typeAnalyse: e.target.value})} placeholder="NFS, Glycémie, Radio..." />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={form.dateAnalyse} onChange={e => setForm({...form, dateAnalyse: e.target.value})} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Laboratoire</label>
            <input className="form-input" value={form.laboratoire} onChange={e => setForm({...form, laboratoire: e.target.value})} placeholder="Labo Pasteur..." />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Statut</label>
            <select className="form-select" value={form.statut} onChange={e => setForm({...form, statut: e.target.value})}>
              {['TERMINE','EN_ATTENTE','EN_COURS'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, gridColumn: '1/-1' }}>
            <label className="form-label">Résultats</label>
            <input className="form-input" value={form.resultats} onChange={e => setForm({...form, resultats: e.target.value})} placeholder="Valeurs normales, anomalies détectées..." />
          </div>
        </div>
        <button onClick={() => { if(form.typeAnalyse) { onAdd({...form}); setForm({ typeAnalyse: '', dateAnalyse: '', resultats: '', laboratoire: '', statut: 'TERMINE' }) }}}
          className="btn btn-primary" style={{ marginTop: 10, padding: '7px 16px', fontSize: 13 }}>
          + Ajouter
        </button>
      </div>
    </div>
  )
}
