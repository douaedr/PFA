import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0891b2 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px'
    }} className="fade-in">

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 24,
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40, margin: '0 auto 16px',
          border: '2px solid rgba(255,255,255,0.2)'
        }}>🏥</div>
        <h1 style={{
          fontFamily: 'Syne, sans-serif', fontSize: 42, fontWeight: 800,
          color: 'white', marginBottom: 8
        }}>MedSys</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }}>
          Système de Gestion Hospitalière
        </p>
      </div>

      {/* Choice cards */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>

        {/* Personnel card */}
        <div
          onClick={() => navigate('/login/personnel')}
          style={{
            background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255,255,255,0.2)',
            borderRadius: 24, padding: '36px 40px', cursor: 'pointer',
            width: 280, textAlign: 'center',
            transition: 'all 0.3s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
            e.currentTarget.style.transform = 'translateY(-4px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <div style={{ fontSize: 52, marginBottom: 16 }}>👨‍⚕️</div>
          <h2 style={{
            fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800,
            color: 'white', marginBottom: 8
          }}>Personnel</h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.6 }}>
            Médecins, infirmiers, administrateurs — accédez à la gestion complète du système
          </p>
          <div style={{
            marginTop: 20, padding: '8px 20px', background: 'rgba(255,255,255,0.15)',
            borderRadius: 20, color: 'white', fontSize: 13, fontWeight: 600,
            border: '1px solid rgba(255,255,255,0.3)'
          }}>
            Se connecter →
          </div>
        </div>

        {/* Patient card */}
        <div
          onClick={() => navigate('/patient')}
          style={{
            background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
            border: '2px solid rgba(5,150,105,0.5)',
            borderRadius: 24, padding: '36px 40px', cursor: 'pointer',
            width: 280, textAlign: 'center',
            transition: 'all 0.3s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(5,150,105,0.2)'
            e.currentTarget.style.transform = 'translateY(-4px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <div style={{ fontSize: 52, marginBottom: 16 }}>🧑‍💼</div>
          <h2 style={{
            fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800,
            color: 'white', marginBottom: 8
          }}>Patient</h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.6 }}>
            Consultez votre dossier médical, vos rendez-vous et vos résultats d'analyses
          </p>
          <div style={{
            marginTop: 20, padding: '8px 20px', background: 'rgba(5,150,105,0.3)',
            borderRadius: 20, color: '#6ee7b7', fontSize: 13, fontWeight: 600,
            border: '1px solid rgba(5,150,105,0.4)'
          }}>
            Accéder →
          </div>
        </div>

      </div>

      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 48 }}>
        MedSys v1.0 — Système sécurisé par JWT — Port 8082
      </p>
    </div>
  )
}
