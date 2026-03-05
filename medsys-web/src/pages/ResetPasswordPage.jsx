import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { authApi } from '../api/api'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [form, setForm] = useState({ token: token || '', newPassword: '', confirm: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.newPassword !== form.confirm) return setError('Les mots de passe ne correspondent pas')
    if (form.newPassword.length < 8) return setError('Minimum 8 caractères')
    setLoading(true); setError('')
    try {
      await authApi.resetPassword({ token: form.token, newPassword: form.newPassword })
      setSuccess(true)
      setTimeout(() => navigate('/'), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Token invalide ou expiré')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a, #1e3a8a)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 400, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔑</div>
          <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22 }}>Nouveau mot de passe</h2>
        </div>
        {success ? (
          <div className="alert alert-success">
            ✅ Mot de passe modifié avec succès ! Redirection dans 3 secondes...
          </div>
        ) : (
          <>
            {error && <div className="alert alert-error">⚠️ {error}</div>}
            <form onSubmit={handleSubmit}>
              {!token && (
                <div className="form-group">
                  <label className="form-label">Token</label>
                  <input className="form-input" value={form.token} onChange={e => setForm({...form, token: e.target.value})} required />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Nouveau mot de passe</label>
                <input className="form-input" type="password" placeholder="Min. 8 caractères"
                  value={form.newPassword} onChange={e => setForm({...form, newPassword: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirmer</label>
                <input className="form-input" type="password" placeholder="••••••••"
                  value={form.confirm} onChange={e => setForm({...form, confirm: e.target.value})} required />
              </div>
              <button className="btn btn-primary btn-full" disabled={loading} type="submit">
                {loading ? <span className="spinner"/> : '✅ Réinitialiser'}
              </button>
            </form>
          </>
        )}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/" style={{ color: 'var(--gray)', fontSize: 13, textDecoration: 'none' }}>← Retour à l'accueil</Link>
        </div>
      </div>
    </div>
  )
}
