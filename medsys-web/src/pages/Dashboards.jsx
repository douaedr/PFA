import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Navbar({ role }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/') }
  return (
    <nav className="navbar">
      <a className="navbar-brand" href="/">
        <div className="navbar-logo-icon">🏥</div>
        <div>
          <div className="navbar-logo-text">MedSys</div>
          <div className="navbar-logo-sub">{role}</div>
        </div>
      </a>
      <div className="navbar-right">
        <div className="user-chip">
          <div className="user-chip-avatar" style={{ background: role === 'Patient' ? '#059669' : '#2563eb' }}>
            {user?.prenom?.[0]}{user?.nom?.[0]}
          </div>
          <span className="user-chip-name">{user?.prenom} {user?.nom}</span>
        </div>
        <button className="btn btn-outline" onClick={handleLogout} style={{ fontSize: 12, padding: '6px 14px' }}>
          🚪 Déconnexion
        </button>
      </div>
    </nav>
  )
}

export function PatientDashboard() {
  const { user } = useAuth()
  return (
    <div>
      <Navbar role="Espace Patient" />
      <div className="container">
        <div style={{ padding: '40px 0 20px' }}>
          <h1 style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800 }}>
            Bonjour, {user?.prenom} 👋
          </h1>
          <p style={{ color: 'var(--gray)', marginTop: 4 }}>Bienvenue sur votre espace santé personnel</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { icon: '📋', title: 'Mon dossier', sub: 'Informations médicales', color: '#dbeafe' },
            { icon: '📅', title: 'Rendez-vous', sub: '2 à venir', color: '#d1fae5' },
            { icon: '🧪', title: 'Analyses', sub: '1 en cours', color: '#fef3c7' },
          ].map((item, i) => (
            <div key={i} className="card" style={{ padding: 20, cursor: 'pointer' }}
              onClick={() => alert('Connectez le microservice correspondant !')}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: item.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 12 }}>
                {item.icon}
              </div>
              <div style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 4 }}>{item.title}</div>
              <div style={{ color: 'var(--gray)', fontSize: 13 }}>{item.sub}</div>
            </div>
          ))}
        </div>
        <div className="card" style={{ marginTop: 20, padding: 20 }}>
          <div style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 12 }}>👤 Mes informations</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[['Nom', user?.nom], ['Prénom', user?.prenom], ['Email', user?.email], ['Rôle', user?.role]].map(([k,v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span style={{ color: 'var(--gray)' }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function PersonnelDashboard() {
  const { user } = useAuth()
  return (
    <div>
      <Navbar role="Espace Personnel" />
      <div className="container">
        <div style={{ padding: '40px 0 20px' }}>
          <h1 style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800 }}>
            Bonjour, Dr. {user?.prenom} 👨‍⚕️
          </h1>
          <p style={{ color: 'var(--gray)', marginTop: 4 }}>Tableau de bord — {user?.role}</p>
        </div>
        <div className="alert alert-warning">
          ℹ️ Connectez ce dashboard à vos microservices via les APIs REST.
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 12 }}>Compte connecté</div>
          {[['Email', user?.email], ['Rôle', user?.role], ['ID', user?.userId]].map(([k,v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
              <span style={{ color: 'var(--gray)' }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function AdminDashboard() {
  const { user } = useAuth()
  return (
    <div>
      <Navbar role="Administration" />
      <div className="container">
        <div style={{ padding: '40px 0 20px' }}>
          <h1 style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800 }}>⚙️ Administration</h1>
          <p style={{ color: 'var(--gray)', marginTop: 4 }}>Gestion des comptes utilisateurs</p>
        </div>
        <div className="alert alert-warning">
          Utilisez Swagger UI sur <strong>http://localhost:8082/swagger-ui.html</strong> pour créer les comptes médecins via POST /api/v1/admin/personnel
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 8 }}>Admin connecté</div>
          <div style={{ fontSize: 13, color: 'var(--gray)' }}>{user?.email} — {user?.role}</div>
        </div>
      </div>
    </div>
  )
}
