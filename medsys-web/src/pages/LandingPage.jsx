import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

const FEATURES = [
  { icon: '🔒', label: 'Sécurisé', desc: 'Authentification JWT double couche' },
  { icon: '📱', label: 'Multi-plateforme', desc: 'Web & application mobile' },
  { icon: '⚡', label: 'Temps réel', desc: 'Données médicales synchronisées' },
  { icon: '🏗️', label: 'Microservices', desc: 'Architecture distribuée Spring Boot' },
]

const STATS = [
  { value: '2', label: 'Microservices', icon: '⚙️' },
  { value: '4', label: 'Rôles utilisateurs', icon: '👥' },
  { value: '100%', label: 'Sécurisé JWT', icon: '🔐' },
  { value: 'REST', label: 'API Standard', icon: '🌐' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [hoveredCard, setHoveredCard] = useState(null)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0f172a 0%, #1e3a8a 45%, #0c4a6e 75%, #0f172a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '0 20px', position: 'relative', overflow: 'hidden'
    }} className="fade-in">

      {/* Background decorative elements */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: -100, right: -100,
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)'
        }}/>
        <div style={{
          position: 'absolute', bottom: -150, left: -100,
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(8,145,178,0.12) 0%, transparent 70%)'
        }}/>
        {/* Grid pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}/>
      </div>

      {/* Header */}
      <div style={{ width: '100%', maxWidth: 1100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, #2563eb, #0891b2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            boxShadow: '0 4px 12px rgba(37,99,235,0.4)'
          }}>🏥</div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: 'white' }}>MedSys</span>
        </div>
        <div style={{
          padding: '6px 14px', background: 'rgba(255,255,255,0.08)',
          borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600
        }}>
          v1.0 — Système Hospitalier
        </div>
      </div>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginTop: 60, marginBottom: 64, position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', background: 'rgba(37,99,235,0.2)',
          border: '1px solid rgba(37,99,235,0.4)', borderRadius: 20,
          marginBottom: 24
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#60a5fa', display: 'inline-block', animation: 'pulse 2s infinite' }}/>
          <span style={{ color: '#93c5fd', fontSize: 12, fontWeight: 600 }}>Système de gestion hospitalière numérique</span>
        </div>

        <h1 style={{
          fontFamily: 'Syne, sans-serif', fontSize: 'clamp(36px, 6vw, 68px)', fontWeight: 800,
          color: 'white', lineHeight: 1.1, marginBottom: 20,
          textShadow: '0 2px 20px rgba(0,0,0,0.3)'
        }}>
          Gestion hospitalière<br/>
          <span style={{ background: 'linear-gradient(135deg, #60a5fa, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            intelligente & sécurisée
          </span>
        </h1>

        <p style={{
          color: 'rgba(255,255,255,0.6)', fontSize: 16, maxWidth: 560,
          margin: '0 auto 40px', lineHeight: 1.7
        }}>
          Plateforme complète de gestion des dossiers médicaux, rendez-vous et communication patient-médecin avec architecture microservices.
        </p>

        {/* Role cards */}
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>

          <RoleCard
            id="personnel"
            icon="👨‍⚕️"
            title="Personnel médical"
            desc="Médecins, infirmiers et administrateurs — accédez à la gestion complète"
            cta="Se connecter"
            accent={{ border: 'rgba(96,165,250,0.4)', hover: 'rgba(37,99,235,0.25)', ctaBg: 'rgba(37,99,235,0.3)', ctaColor: '#93c5fd', glow: 'rgba(37,99,235,0.15)' }}
            onClick={() => navigate('/login/personnel')}
            hovered={hoveredCard === 'personnel'}
            onHover={setHoveredCard}
          />

          <RoleCard
            id="patient"
            icon="🧑‍💼"
            title="Espace patient"
            desc="Consultez votre dossier, vos rendez-vous et résultats d'analyses"
            cta="Accéder"
            accent={{ border: 'rgba(52,211,153,0.4)', hover: 'rgba(5,150,105,0.2)', ctaBg: 'rgba(5,150,105,0.3)', ctaColor: '#6ee7b7', glow: 'rgba(5,150,105,0.12)' }}
            onClick={() => navigate('/patient')}
            hovered={hoveredCard === 'patient'}
            onHover={setHoveredCard}
          />

        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap',
        marginBottom: 56, position: 'relative', zIndex: 1
      }}>
        {STATS.map((s, i) => (
          <div key={i} style={{
            padding: '14px 24px', background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14,
            textAlign: 'center', minWidth: 120, backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: 'white' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div style={{
        width: '100%', maxWidth: 900, marginBottom: 60,
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12,
        position: 'relative', zIndex: 1
      }}>
        {FEATURES.map((f, i) => (
          <div key={i} style={{
            padding: '16px 18px', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
            display: 'flex', alignItems: 'center', gap: 12,
            transition: 'all 0.25s'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'rgba(255,255,255,0.08)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0
            }}>{f.icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'white' }}>{f.label}</div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, marginBottom: 32, position: 'relative', zIndex: 1, textAlign: 'center' }}>
        MedSys — Architecture microservices Spring Boot · React · JWT · MySQL
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}

function RoleCard({ id, icon, title, desc, cta, accent, onClick, hovered, onHover }) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      style={{
        background: hovered ? accent.hover : 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(16px)',
        border: `1.5px solid ${hovered ? accent.border : 'rgba(255,255,255,0.12)'}`,
        borderRadius: 24, padding: '36px 36px 28px', cursor: 'pointer',
        width: 280, textAlign: 'center',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hovered ? `0 20px 60px ${accent.glow}, 0 4px 20px rgba(0,0,0,0.3)` : '0 4px 20px rgba(0,0,0,0.2)',
      }}
    >
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: hovered ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 34, margin: '0 auto 18px',
        border: '1px solid rgba(255,255,255,0.1)',
        transition: 'all 0.3s',
        boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.2)' : 'none'
      }}>
        {icon}
      </div>
      <h2 style={{
        fontFamily: 'Syne, sans-serif', fontSize: 19, fontWeight: 800,
        color: 'white', marginBottom: 10, lineHeight: 1.2
      }}>{title}</h2>
      <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 1.65, marginBottom: 22 }}>
        {desc}
      </p>
      <div style={{
        padding: '9px 20px', background: accent.ctaBg,
        borderRadius: 22, color: accent.ctaColor, fontSize: 13, fontWeight: 700,
        border: `1px solid ${accent.border}`, letterSpacing: '0.02em',
        transition: 'all 0.25s',
        boxShadow: hovered ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
      }}>
        {cta} →
      </div>
    </div>
  )
}
