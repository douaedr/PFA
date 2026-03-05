import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/api'

export default function PersonnelLoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMsg, setForgotMsg] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const { data } = await authApi.login(form)
      if (data.role === 'PATIENT') {
        setError('Cet espace est réservé au personnel. Les patients doivent utiliser l\'espace patient.')
        return
      }
      login(data, data.token)
      if (data.role === 'ADMIN') navigate('/admin')
      else navigate('/personnel/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Identifiants incorrects')
    } finally { setLoading(false) }
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    try {
      await authApi.forgotPassword(forgotEmail)
      setForgotMsg('✅ Email envoyé ! Vérifiez votre boîte mail.')
    } catch { setForgotMsg('✅ Si ce compte existe, un email a été envoyé.') }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a, #1e3a8a)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }} className="fade-in">
      <div className="card" style={{ width: '100%', maxWidth: 420, padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e40af, #2563eb)',
          padding: '28px 32px', textAlign: 'center'
        }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>👨‍⚕️</div>
          <h1 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, color: 'white' }}>
            Espace Personnel
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>
            Médecins · Infirmiers · Administrateurs
          </p>
        </div>

        <div style={{ padding: '28px 32px' }}>
          {!showForgot ? (
            <>
              {error && <div className="alert alert-error">⚠️ {error}</div>}
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="form-label">Email professionnel</label>
                  <input className="form-input" type="email" placeholder="dr.martin@hospital.ma"
                    value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Mot de passe</label>
                  <input className="form-input" type="password" placeholder="••••••••"
                    value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
                </div>
                <button className="btn btn-primary btn-full btn-lg" disabled={loading} type="submit">
                  {loading ? <span className="spinner"/> : '🔐 Se connecter'}
                </button>
              </form>
              <button
                onClick={() => setShowForgot(true)}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer',
                  fontSize: 13, marginTop: 16, width: '100%', textAlign: 'center' }}
              >
                Mot de passe oublié ?
              </button>
            </>
          ) : (
            <>
              <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 16 }}>
                🔑 Réinitialiser le mot de passe
              </h3>
              {forgotMsg && <div className="alert alert-success">{forgotMsg}</div>}
              <form onSubmit={handleForgot}>
                <div className="form-group">
                  <label className="form-label">Email professionnel</label>
                  <input className="form-input" type="email" value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)} required />
                </div>
                <button className="btn btn-primary btn-full" type="submit">
                  📧 Envoyer le lien
                </button>
              </form>
              <button onClick={() => setShowForgot(false)}
                style={{ background: 'none', border: 'none', color: 'var(--gray)', cursor: 'pointer',
                  fontSize: 13, marginTop: 12, width: '100%', textAlign: 'center' }}>
                ← Retour à la connexion
              </button>
            </>
          )}

          <div style={{ borderTop: '1px solid var(--border)', marginTop: 20, paddingTop: 16, textAlign: 'center' }}>
            <Link to="/" style={{ color: 'var(--gray)', fontSize: 13, textDecoration: 'none' }}>
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
