import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/api'

const PERKS = [
  { icon: '📋', label: 'Dossiers médicaux complets', desc: 'Accès instantané à tous les dossiers patients' },
  { icon: '🗓️', label: 'Gestion des rendez-vous', desc: 'Planification et suivi simplifiés' },
  { icon: '💬', label: 'Messagerie sécurisée', desc: 'Communication directe avec les patients' },
  { icon: '📊', label: 'Tableaux de bord analytiques', desc: 'Statistiques et indicateurs en temps réel' },
]

export default function PersonnelLoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMsg, setForgotMsg] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const { data } = await authApi.login(form)
      if (data.role === 'PATIENT') {
        setError("Cet espace est réservé au personnel. Les patients doivent utiliser l'espace patient.")
        return
      }
      login(data, data.token)
      if (data.role === 'ADMIN') navigate('/admin')
      else if (data.role === 'DIRECTEUR') navigate('/directeur')
      else navigate('/personnel/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Identifiants incorrects')
    } finally { setLoading(false) }
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    try {
      await authApi.forgotPassword(forgotEmail)
      setForgotMsg('Email envoyé ! Vérifiez votre boîte mail.')
    } catch {
      setForgotMsg('Si ce compte existe, un email a été envoyé.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }} className="fade-in">

      {/* ─── Panneau gauche (branding) ─── */}
      <div style={{
        flex: 1, background: 'linear-gradient(160deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 56px', position: 'relative', overflow: 'hidden',
        minWidth: 0
      }} className="login-left-panel">

        {/* Background decoration */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.3) 0%, transparent 70%)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(8,145,178,0.2) 0%, transparent 70%)', pointerEvents: 'none' }}/>

        {/* Logo */}
        <div style={{ marginBottom: 56, position: 'relative', zIndex: 1 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #2563eb, #0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 4px 12px rgba(37,99,235,0.5)' }}>🏥</div>
            <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: 'white' }}>MedSys</span>
          </Link>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(37,99,235,0.3)', border: '1px solid rgba(96,165,250,0.4)', borderRadius: 20, padding: '5px 14px', marginBottom: 24 }}>
            <span style={{ fontSize: 13, marginRight: 2 }}>👨‍⚕️</span>
            <span style={{ color: '#93c5fd', fontSize: 12, fontWeight: 600 }}>Espace Personnel Médical</span>
          </div>

          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 34, fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: 16 }}>
            Bienvenue sur<br/>votre espace de travail
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.7, marginBottom: 44, maxWidth: 360 }}>
            Accédez à l'ensemble des outils nécessaires à la gestion des patients et du suivi médical.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {PERKS.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{p.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'white' }}>{p.label}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Panneau droit (formulaire) ─── */}
      <div style={{
        width: 480, flexShrink: 0, background: 'white',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 48px', overflowY: 'auto'
      }} className="login-right-panel">

        {!showForgot ? (
          <>
            <div style={{ marginBottom: 36 }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: 'var(--dark)', marginBottom: 6 }}>
                Connexion
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Entrez vos identifiants professionnels</p>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: 20 }}>
                <span className="alert-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div className="form-group">
                <label className="form-label">Email professionnel</label>
                <div className="input-wrapper">
                  <span className="input-icon">✉️</span>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="dr.martin@hospital.ma"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mot de passe</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    className="form-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                    autoComplete="current-password"
                  />
                  <span
                    className="input-suffix"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24, marginTop: -4 }}>
                <button type="button" onClick={() => setShowForgot(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'DM Sans, sans-serif', padding: 0 }}>
                  Mot de passe oublié ?
                </button>
              </div>

              <button className="btn btn-primary btn-full btn-lg" disabled={loading} type="submit">
                {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Connexion en cours...</> : '🔐 Se connecter'}
              </button>
            </form>

            <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
              <Link to="/" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                ← Retour à l'accueil
              </Link>
            </div>
          </>
        ) : (
          <>
            <button onClick={() => { setShowForgot(false); setForgotMsg(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'DM Sans, sans-serif', marginBottom: 32, padding: 0 }}>
              ← Retour à la connexion
            </button>

            <div style={{ marginBottom: 32 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--primary-xlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 16, border: '1px solid var(--primary-light)' }}>🔑</div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: 'var(--dark)', marginBottom: 6 }}>
                Mot de passe oublié
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>
                Entrez votre email professionnel. Nous vous enverrons un lien de réinitialisation valable 1 heure.
              </p>
            </div>

            {forgotMsg && (
              <div className="alert alert-success">
                <span className="alert-icon">✅</span>
                <span>{forgotMsg}</span>
              </div>
            )}

            <form onSubmit={handleForgot}>
              <div className="form-group">
                <label className="form-label">Email professionnel</label>
                <div className="input-wrapper">
                  <span className="input-icon">✉️</span>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="dr.martin@hospital.ma"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button className="btn btn-primary btn-full btn-lg" type="submit" style={{ marginTop: 8 }}>
                📧 Envoyer le lien de réinitialisation
              </button>
            </form>
          </>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .login-left-panel { display: none !important; }
          .login-right-panel { width: 100% !important; padding: 40px 28px !important; }
        }
      `}</style>
    </div>
  )
}
