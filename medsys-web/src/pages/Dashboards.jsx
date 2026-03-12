import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { patientApi, adminApi } from '../api/api'

// ── Navbar partagée ─────────────────────────────────────────────────────────
function Navbar({ role, notifCount = 0 }) {
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
        {notifCount > 0 && (
          <div style={{ position: 'relative', marginRight: 8 }}>
            <span style={{ fontSize: 20 }}>🔔</span>
            <span style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: 'white',
              borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{notifCount}</span>
          </div>
        )}
        <div className="user-chip">
          <div className="user-chip-avatar" style={{ background: role === 'Espace Patient' ? '#059669' : '#2563eb' }}>
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

// ── Composant dossier médical ─────────────────────────────────────────────
function DossierMedical({ dossier }) {
  const [tab, setTab] = useState('antecedents')
  if (!dossier) return <div className="alert alert-warning">Dossier médical non disponible.</div>
  const tabs = [
    { key: 'antecedents', label: '📋 Antécédents', count: dossier.antecedents?.length || 0 },
    { key: 'consultations', label: '🩺 Consultations', count: dossier.consultations?.length || 0 },
    { key: 'ordonnances', label: '💊 Ordonnances', count: dossier.ordonnances?.length || 0 },
    { key: 'analyses', label: '🧪 Analyses', count: dossier.analyses?.length || 0 },
    { key: 'radiologies', label: '🩻 Radiologies', count: dossier.radiologies?.length || 0 },
  ]
  return (
    <div>
      <div className="card" style={{ marginBottom: 16, padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <span style={{ fontFamily: 'Syne', fontWeight: 700, color: '#059669' }}>📁 Dossier n° {dossier.numeroDossier}</span>
        <span style={{ fontSize: 12, color: 'var(--gray)', marginLeft: 12 }}>
          Créé le {dossier.dateCreation ? new Date(dossier.dateCreation).toLocaleDateString('fr-FR') : '—'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '6px 14px', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: 13,
            background: tab === t.key ? '#2563eb' : '#f3f4f6',
            color: tab === t.key ? 'white' : '#374151', fontWeight: tab === t.key ? 700 : 400
          }}>
            {t.label}{t.count > 0 && <span style={{ background: 'rgba(0,0,0,0.12)', borderRadius: 10, padding: '0 6px', marginLeft: 4, fontSize: 11 }}>{t.count}</span>}
          </button>
        ))}
      </div>
      <div className="card" style={{ padding: 16 }}>
        {tab === 'antecedents' && <AntecedentsList items={dossier.antecedents} />}
        {tab === 'consultations' && <ConsultationsTimeline items={dossier.consultations} />}
        {tab === 'ordonnances' && <OrdonnancesList items={dossier.ordonnances} />}
        {tab === 'analyses' && <AnalysesList items={dossier.analyses} />}
        {tab === 'radiologies' && <RadiologiesList items={dossier.radiologies} />}
      </div>
    </div>
  )
}

function EmptyState({ icon, label }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--gray)' }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 14 }}>{label}</div>
    </div>
  )
}

function AntecedentsList({ items }) {
  if (!items?.length) return <EmptyState icon="📋" label="Aucun antécédent enregistré" />
  const colorMap = { MEDICAL: '#dbeafe', CHIRURGICAL: '#fce7f3', FAMILIAL: '#d1fae5', ALLERGIE: '#fef3c7' }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((a, i) => (
        <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', background: colorMap[a.typeAntecedent] || '#f9fafb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>{a.typeAntecedent}</span>
            {a.severite && <span style={{ fontSize: 11, background: 'rgba(0,0,0,0.08)', borderRadius: 6, padding: '2px 8px' }}>{a.severite}</span>}
          </div>
          <div style={{ fontSize: 14 }}>{a.description || '—'}</div>
          {a.dateDiagnostic && <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 4 }}>Diagnostic : {new Date(a.dateDiagnostic).toLocaleDateString('fr-FR')}</div>}
        </div>
      ))}
    </div>
  )
}

// ── Timeline des consultations ─────────────────────────────────────────────
function ConsultationsTimeline({ items }) {
  if (!items?.length) return <EmptyState icon="🩺" label="Aucune consultation enregistrée" />
  const sorted = [...items].sort((a, b) => new Date(b.dateConsultation) - new Date(a.dateConsultation))
  return (
    <div style={{ position: 'relative', paddingLeft: 28 }}>
      <div style={{ position: 'absolute', left: 10, top: 8, bottom: 8, width: 2, background: '#bfdbfe' }} />
      {sorted.map((c, i) => (
        <div key={i} style={{ position: 'relative', marginBottom: 20 }}>
          <div style={{ position: 'absolute', left: -24, top: 8, width: 14, height: 14, borderRadius: '50%',
            background: '#2563eb', border: '2px solid white', boxShadow: '0 0 0 2px #bfdbfe' }} />
          <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#2563eb' }}>
                {c.dateConsultation ? new Date(c.dateConsultation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
              </span>
              {c.medecinNomComplet && <span style={{ fontSize: 12, color: 'var(--gray)' }}>👨‍⚕️ {c.medecinNomComplet}</span>}
            </div>
            {c.motif && <div style={{ fontSize: 13, marginBottom: 4 }}><strong>Motif :</strong> {c.motif}</div>}
            {c.diagnostic && <div style={{ fontSize: 13, marginBottom: 4 }}><strong>Diagnostic :</strong> {c.diagnostic}</div>}
            {c.traitement && <div style={{ fontSize: 13 }}><strong>Traitement :</strong> {c.traitement}</div>}
            {(c.poids || c.temperature || c.tensionSystolique) && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                {c.poids && <span style={{ fontSize: 11, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '2px 8px' }}>⚖️ {c.poids} kg</span>}
                {c.temperature && <span style={{ fontSize: 11, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 6, padding: '2px 8px' }}>🌡️ {c.temperature}°C</span>}
                {c.tensionSystolique && <span style={{ fontSize: 11, background: '#fdf4ff', border: '1px solid #e9d5ff', borderRadius: 6, padding: '2px 8px' }}>💉 {c.tensionSystolique}/{c.tensionDiastolique} mmHg</span>}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function OrdonnancesList({ items }) {
  if (!items?.length) return <EmptyState icon="💊" label="Aucune ordonnance enregistrée" />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((o, i) => (
        <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>{o.dateOrdonnance ? new Date(o.dateOrdonnance).toLocaleDateString('fr-FR') : '—'}</span>
            <span style={{ fontSize: 11, background: '#d1fae5', color: '#065f46', borderRadius: 6, padding: '2px 8px' }}>{o.typeOrdonnance}</span>
          </div>
          {o.lignes?.map((l, j) => (
            <div key={j} style={{ fontSize: 13, padding: '4px 0', borderBottom: '1px dashed var(--border)' }}>
              💊 <strong>{l.medicament}</strong>{l.dosage ? ` — ${l.dosage}` : ''}{l.dureeJours && <span style={{ color: 'var(--gray)', marginLeft: 8 }}>{l.dureeJours}j</span>}
            </div>
          ))}
          {o.instructions && <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 6 }}>ℹ️ {o.instructions}</div>}
        </div>
      ))}
    </div>
  )
}

function AnalysesList({ items }) {
  if (!items?.length) return <EmptyState icon="🧪" label="Aucune analyse enregistrée" />
  const sc = { TERMINE: '#d1fae5', EN_ATTENTE: '#fef3c7', EN_COURS: '#dbeafe' }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((a, i) => (
        <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>{a.typeAnalyse}</span>
            <span style={{ fontSize: 11, background: sc[a.statut] || '#f3f4f6', borderRadius: 6, padding: '2px 8px' }}>{a.statut}</span>
          </div>
          {a.laboratoire && <div style={{ fontSize: 12, color: 'var(--gray)' }}>🔬 {a.laboratoire}</div>}
          {a.resultats && <div style={{ fontSize: 13, marginTop: 4 }}>{a.resultats}</div>}
          {a.dateAnalyse && <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 4 }}>{new Date(a.dateAnalyse).toLocaleDateString('fr-FR')}</div>}
        </div>
      ))}
    </div>
  )
}

function RadiologiesList({ items }) {
  if (!items?.length) return <EmptyState icon="🩻" label="Aucune radiologie enregistrée" />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((r, i) => (
        <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>{r.typeExamen}</span>
            {r.dateExamen && <span style={{ fontSize: 12, color: 'var(--gray)' }}>{new Date(r.dateExamen).toLocaleDateString('fr-FR')}</span>}
          </div>
          {r.description && <div style={{ fontSize: 13 }}>{r.description}</div>}
          {r.conclusion && <div style={{ fontSize: 13, fontStyle: 'italic', color: '#374151', marginTop: 4 }}>Conclusion : {r.conclusion}</div>}
        </div>
      ))}
    </div>
  )
}

// ── Documents ─────────────────────────────────────────────────────────────
const TYPE_LABELS = {
  ORDONNANCE: { label: 'Ordonnance', icon: '💊', color: '#d1fae5', text: '#065f46' },
  ANALYSE:    { label: 'Analyse',    icon: '🧪', color: '#fef3c7', text: '#78350f' },
  RADIOLOGIE: { label: 'Radiologie', icon: '🩻', color: '#dbeafe', text: '#1e40af' },
  CERTIFICAT: { label: 'Certificat', icon: '📄', color: '#ede9fe', text: '#5b21b6' },
  AUTRE:      { label: 'Autre',      icon: '📎', color: '#f3f4f6', text: '#374151' },
}

function DocumentsSection() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'ORDONNANCE', description: '', fichier: null })

  const loadDocuments = async () => {
    setLoading(true)
    try { const r = await patientApi.getDocuments(); setDocuments(r.data) }
    catch { setError('Impossible de charger vos documents.') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadDocuments() }, [])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    if (!allowed.includes(file.type)) { setError('Seuls PDF et images acceptés.'); return }
    if (file.size > 10 * 1024 * 1024) { setError('Max 10 MB.'); return }
    setError(''); setForm(f => ({ ...f, fichier: file }))
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!form.fichier) { setError('Sélectionnez un fichier.'); return }
    setUploading(true); setError(''); setSuccess('')
    try {
      const fd = new FormData()
      fd.append('fichier', form.fichier)
      fd.append('type', form.type)
      fd.append('description', form.description)
      await patientApi.uploadDocument(fd)
      setSuccess('Document uploadé !'); setForm({ type: 'ORDONNANCE', description: '', fichier: null })
      setShowForm(false); loadDocuments(); setTimeout(() => setSuccess(''), 4000)
    } catch (err) { setError(err.response?.data?.message || 'Erreur upload.') }
    finally { setUploading(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce document ?')) return
    try { await patientApi.deleteDocument(id); setDocuments(d => d.filter(x => x.id !== id)) }
    catch { setError('Erreur suppression.') }
  }

  const openFile = async (id) => {
    const t = sessionStorage.getItem('medsys_token')
    const r = await fetch(`/api/v1/patient/me/documents/${id}/fichier`, { headers: { Authorization: `Bearer ${t}` } })
    const blob = await r.blob()
    window.open(URL.createObjectURL(blob), '_blank')
  }

  const fmt = (b) => !b ? '' : b < 1024 ? b + ' o' : b < 1048576 ? (b/1024).toFixed(1) + ' Ko' : (b/1048576).toFixed(1) + ' Mo'

  return (
    <div>
      {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>⚠️ {error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: 12 }}>✅ {success}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--gray)' }}>{documents.length} document{documents.length !== 1 ? 's' : ''}</div>
        <button className="btn btn-primary" onClick={() => { setShowForm(f => !f); setError('') }} style={{ fontSize: 13 }}>
          {showForm ? '✕ Annuler' : '+ Ajouter'}
        </button>
      </div>
      {showForm && (
        <div className="card" style={{ padding: 20, marginBottom: 20, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <form onSubmit={handleUpload}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div className="form-group">
                <label className="form-label">Type *</label>
                <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="ORDONNANCE">💊 Ordonnance</option>
                  <option value="ANALYSE">🧪 Analyse / Bilan</option>
                  <option value="RADIOLOGIE">🩻 Radio / Scanner</option>
                  <option value="CERTIFICAT">📄 Certificat</option>
                  <option value="AUTRE">📎 Autre</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Bilan mars 2026" />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Fichier * (PDF ou image, max 10 MB)</label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" onChange={handleFileChange} style={{ display: 'block', fontSize: 13, padding: '6px 0' }} />
              {form.fichier && <div style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>✓ {form.fichier.name} ({fmt(form.fichier.size)})</div>}
            </div>
            <button className="btn btn-primary" type="submit" disabled={uploading || !form.fichier}>
              {uploading ? <span className="spinner" /> : '📤 Envoyer'}
            </button>
          </form>
        </div>
      )}
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /></div>
      : documents.length === 0 ? <EmptyState icon="📂" label="Aucun document importé. Cliquez sur Ajouter." />
      : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {documents.map(doc => {
            const meta = TYPE_LABELS[doc.typeDocument] || TYPE_LABELS.AUTRE
            return (
              <div key={doc.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{meta.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{doc.nomFichierOriginal}</span>
                    <span style={{ background: meta.color, color: meta.text, fontSize: 10, borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>{meta.label}</span>
                  </div>
                  {doc.description && <div style={{ fontSize: 12, color: '#374151' }}>{doc.description}</div>}
                  <div style={{ fontSize: 11, color: 'var(--gray)' }}>
                    {fmt(doc.tailleFichier)}
                    {doc.dateUpload && ' · ' + new Date(doc.dateUpload).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => openFile(doc.id)} style={{ padding: '6px 12px', background: '#dbeafe', color: '#1e40af', border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>👁️ Voir</button>
                  <button onClick={() => handleDelete(doc.id)} style={{ padding: '6px 12px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Messagerie ────────────────────────────────────────────────────────────
function MessagerieSection() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [contenu, setContenu] = useState('')
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

  const load = async () => {
    setLoading(true)
    try {
      const r = await patientApi.getMessages(); setMessages(r.data)
      // Marquer les messages du médecin comme lus
      r.data.filter(m => m.expediteur === 'MEDECIN' && !m.lu).forEach(m => patientApi.marquerLu(m.id).catch(() => {}))
    } catch { setError('Impossible de charger les messages.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!contenu.trim()) return
    setSending(true); setError('')
    try {
      const r = await patientApi.envoyerMessage({ contenu: contenu.trim() })
      setMessages(m => [...m, r.data]); setContenu('')
    } catch (err) { setError(err.response?.data?.message || 'Erreur envoi.') }
    finally { setSending(false) }
  }

  const fmtTime = (d) => d ? new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''

  return (
    <div>
      {error && <div className="alert alert-error" style={{ marginBottom: 10 }}>⚠️ {error}</div>}
      <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ background: '#f8fafc', padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--gray)' }}>
          💬 Messagerie avec l'équipe médicale
        </div>
        <div style={{ height: 360, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10, background: '#fafafa' }}>
          {loading ? <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /></div>
          : messages.length === 0
            ? <div style={{ textAlign: 'center', color: 'var(--gray)', padding: 40 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                <div>Aucun message. Envoyez votre première question !</div>
              </div>
            : messages.map(m => {
              const isPatient = m.expediteur === 'PATIENT'
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: isPatient ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '72%' }}>
                    {!isPatient && m.medecinNom && (
                      <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 600, marginBottom: 2, paddingLeft: 4 }}>
                        👨‍⚕️ {m.medecinNom}
                      </div>
                    )}
                    <div style={{
                      background: isPatient ? '#2563eb' : 'white',
                      color: isPatient ? 'white' : '#1e293b',
                      padding: '10px 14px', borderRadius: isPatient ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      fontSize: 13, boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      border: isPatient ? 'none' : '1px solid var(--border)'
                    }}>
                      {m.contenu}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--gray)', marginTop: 3, textAlign: isPatient ? 'right' : 'left', paddingLeft: 4, paddingRight: 4 }}>
                      {fmtTime(m.dateEnvoi)}{isPatient && (m.lu ? ' · Lu ✓' : ' · Envoyé')}
                    </div>
                  </div>
                </div>
              )
            })
          }
          <div ref={bottomRef} />
        </div>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid var(--border)', background: 'white' }}>
          <input className="form-input" value={contenu} onChange={e => setContenu(e.target.value)}
            placeholder="Écrivez votre message..." style={{ flex: 1, borderRadius: 20, padding: '8px 16px' }}
            maxLength={1000} />
          <button className="btn btn-primary" type="submit" disabled={sending || !contenu.trim()} style={{ borderRadius: 20, padding: '8px 20px' }}>
            {sending ? <span className="spinner" /> : '➤'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Rendez-vous ───────────────────────────────────────────────────────────
function RendezVousSection() {
  const [rdvList, setRdvList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setLoading(true)
    patientApi.getRdv()
      .then(r => setRdvList(r.data || []))
      .catch(() => setError('Service rendez-vous indisponible pour l\'instant.'))
      .finally(() => setLoading(false))
  }, [])

  const handleAnnuler = async (id) => {
    if (!window.confirm('Confirmer l\'annulation de ce rendez-vous ?')) return
    try {
      await patientApi.annulerRdv(id)
      setRdvList(l => l.map(r => r.id === id ? { ...r, statut: 'ANNULE' } : r))
      setSuccess('Rendez-vous annulé.'); setTimeout(() => setSuccess(''), 4000)
    } catch { setError('Impossible d\'annuler. Contactez la clinique.') }
  }

  const statutColor = {
    CONFIRME: { bg: '#d1fae5', text: '#065f46' },
    EN_ATTENTE: { bg: '#fef3c7', text: '#78350f' },
    ANNULE: { bg: '#fee2e2', text: '#991b1b' },
    TERMINE: { bg: '#f3f4f6', text: '#374151' },
  }

  return (
    <div>
      {error && <div className="alert alert-warning" style={{ marginBottom: 12 }}>⚠️ {error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: 12 }}>✅ {success}</div>}
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /></div>
      : rdvList.length === 0
        ? (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📅</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Aucun rendez-vous</div>
            <div style={{ fontSize: 13, color: 'var(--gray)' }}>
              {error ? 'Le service rendez-vous n\'est pas encore connecté.' : 'Vous n\'avez pas de rendez-vous planifié.'}
            </div>
          </div>
        )
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rdvList.map(rdv => {
              const sc = statutColor[rdv.statut] || { bg: '#f3f4f6', text: '#374151' }
              return (
                <div key={rdv.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ textAlign: 'center', background: '#dbeafe', borderRadius: 10, padding: '8px 12px', minWidth: 56 }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#2563eb', lineHeight: 1 }}>
                        {rdv.date ? new Date(rdv.date).getDate().toString().padStart(2, '0') : '—'}
                      </div>
                      <div style={{ fontSize: 10, color: '#3b82f6', textTransform: 'uppercase' }}>
                        {rdv.date ? new Date(rdv.date).toLocaleDateString('fr-FR', { month: 'short' }) : ''}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                        {rdv.motif || 'Consultation'}
                      </div>
                      {rdv.medecinNom && <div style={{ fontSize: 13, color: '#374151', marginBottom: 2 }}>👨‍⚕️ {rdv.medecinNom}{rdv.medecinSpecialite ? ` — ${rdv.medecinSpecialite}` : ''}</div>}
                      {rdv.service && <div style={{ fontSize: 12, color: 'var(--gray)' }}>🏥 {rdv.service}</div>}
                      {rdv.heure && <div style={{ fontSize: 12, color: 'var(--gray)' }}>🕐 {rdv.heure}</div>}
                      {rdv.notes && <div style={{ fontSize: 12, color: '#374151', marginTop: 4, fontStyle: 'italic' }}>{rdv.notes}</div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                    <span style={{ background: sc.bg, color: sc.text, fontSize: 11, borderRadius: 6, padding: '3px 10px', fontWeight: 600 }}>
                      {rdv.statut || 'EN_ATTENTE'}
                    </span>
                    {rdv.statut !== 'ANNULE' && rdv.statut !== 'TERMINE' && (
                      <button onClick={() => handleAnnuler(rdv.id)}
                        style={{ background: 'none', border: '1px solid #fca5a5', color: '#ef4444', borderRadius: 8, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      }
    </div>
  )
}

// ── Section profil éditable ────────────────────────────────────────────────
function EditProfilSection({ profil, onSaved }) {
  const [form, setForm] = useState({
    telephone: profil?.telephone || '',
    email: profil?.email || '',
    adresse: profil?.adresse || '',
    ville: profil?.ville || '',
    mutuelle: profil?.mutuelle || '',
    numeroCNSS: profil?.numeroCNSS || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError(''); setSuccess('')
    try {
      const r = await patientApi.updateMe(form)
      setSuccess('Profil mis à jour avec succès !'); onSaved(r.data)
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) { setError(err.response?.data?.message || 'Erreur lors de la mise à jour.') }
    finally { setSaving(false) }
  }

  return (
    <div>
      {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>⚠️ {error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: 12 }}>✅ {success}</div>}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 16 }}>✏️ Modifier mes informations</div>
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input className="form-input" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} placeholder="06..." />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="nom@email.com" />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Adresse</label>
              <input className="form-input" value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} placeholder="Rue, quartier..." />
            </div>
            <div className="form-group">
              <label className="form-label">Ville</label>
              <input className="form-input" value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))} placeholder="Casablanca..." />
            </div>
            <div className="form-group">
              <label className="form-label">Mutuelle</label>
              <input className="form-input" value={form.mutuelle} onChange={e => setForm(f => ({ ...f, mutuelle: e.target.value }))} placeholder="CNSS, CNOPS..." />
            </div>
            <div className="form-group">
              <label className="form-label">Numéro CNSS</label>
              <input className="form-input" value={form.numeroCNSS} onChange={e => setForm(f => ({ ...f, numeroCNSS: e.target.value }))} />
            </div>
          </div>
          <div className="alert alert-warning" style={{ fontSize: 12, marginBottom: 12 }}>
            ℹ️ Pour modifier votre nom, CIN ou date de naissance, contactez l'administration.
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? <span className="spinner" /> : '💾 Enregistrer les modifications'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── QR Code + PDF ─────────────────────────────────────────────────────────
function QrCodeSection({ profil }) {
  const [qrUrl, setQrUrl] = useState(null)
  const [loadingQr, setLoadingQr] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [error, setError] = useState('')

  const loadQrCode = async () => {
    setLoadingQr(true); setError('')
    try {
      const r = await patientApi.getQrCode()
      setQrUrl(URL.createObjectURL(r.data))
    } catch { setError('Erreur génération QR code.') }
    finally { setLoadingQr(false) }
  }

  const downloadPdf = async () => {
    setLoadingPdf(true); setError('')
    try {
      const r = await patientApi.exportPdf()
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a')
      a.href = url; a.download = `dossier-${profil?.cin || 'medical'}.pdf`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } catch { setError('Erreur génération PDF.') }
    finally { setLoadingPdf(false) }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {error && <div className="alert alert-error" style={{ gridColumn: '1/-1' }}>⚠️ {error}</div>}
      {/* QR Code */}
      <div className="card" style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📱</div>
        <div style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 6 }}>QR Code dossier</div>
        <div style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 16 }}>
          Partagez rapidement vos infos médicales avec un professionnel de santé
        </div>
        {qrUrl ? (
          <div>
            <img src={qrUrl} alt="QR Code" style={{ width: 200, height: 200, margin: '0 auto', display: 'block', border: '1px solid var(--border)', borderRadius: 8 }} />
            <a href={qrUrl} download="qrcode-dossier.png">
              <button className="btn btn-outline" style={{ marginTop: 12, fontSize: 12 }}>⬇️ Télécharger</button>
            </a>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={loadQrCode} disabled={loadingQr}>
            {loadingQr ? <span className="spinner" /> : '📱 Générer le QR Code'}
          </button>
        )}
      </div>
      {/* PDF */}
      <div className="card" style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
        <div style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 6 }}>Export PDF complet</div>
        <div style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 16 }}>
          Téléchargez votre dossier médical complet en format PDF imprimable
        </div>
        <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 16, background: '#f8fafc', borderRadius: 8, padding: '8px 12px' }}>
          Inclut : antécédents, consultations, ordonnances, analyses, radiologies
        </div>
        <button className="btn btn-primary" onClick={downloadPdf} disabled={loadingPdf}>
          {loadingPdf ? <span className="spinner" /> : '⬇️ Télécharger le PDF'}
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// PATIENT DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
export function PatientDashboard() {
  const { user } = useAuth()
  const [profil, setProfil] = useState(null)
  const [dossier, setDossier] = useState(null)
  const [view, setView] = useState('accueil')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notifs, setNotifs] = useState({ total: 0 })

  useEffect(() => {
    setLoading(true)
    patientApi.me()
      .then(r => setProfil(r.data))
      .catch(() => setError('Impossible de charger votre profil.'))
      .finally(() => setLoading(false))

    // Charger les notifications
    patientApi.notifications()
      .then(r => setNotifs(r.data))
      .catch(() => {})
  }, [])

  const loadDossier = async () => {
    if (dossier) { setView('dossier'); return }
    setLoading(true)
    try { const r = await patientApi.myDossier(); setDossier(r.data); setView('dossier') }
    catch { setError('Impossible de charger le dossier médical.') }
    finally { setLoading(false) }
  }

  const navItems = [
    { key: 'accueil',    label: '🏠 Accueil' },
    { key: 'dossier',   label: '📁 Dossier médical' },
    { key: 'rdv',       label: '📅 Mes RDV' },
    { key: 'documents', label: '📂 Documents' },
    { key: 'messagerie',label: '💬 Messagerie', badge: notifs.messagesNonLus },
    { key: 'outils',    label: '🔧 QR / PDF' },
    { key: 'profil',    label: '✏️ Mon profil' },
  ]

  return (
    <div>
      <Navbar role="Espace Patient" notifCount={notifs.total || 0} />
      <div className="container">
        <div style={{ padding: '40px 0 20px' }}>
          <h1 style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800 }}>Bonjour, {user?.prenom} 👋</h1>
          <p style={{ color: 'var(--gray)', marginTop: 4 }}>Bienvenue sur votre espace santé personnel</p>
        </div>
        {error && <div className="alert alert-error">⚠️ {error}</div>}
        {loading && <div style={{ textAlign: 'center', padding: 20 }}><span className="spinner" /></div>}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
          {navItems.map(t => (
            <button key={t.key} onClick={() => t.key === 'dossier' ? loadDossier() : setView(t.key)}
              style={{ position: 'relative', padding: '8px 16px', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: 13,
                background: view === t.key ? '#2563eb' : '#f3f4f6',
                color: view === t.key ? 'white' : '#374151',
                fontWeight: view === t.key ? 700 : 400 }}>
              {t.label}
              {t.badge > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: 'white',
                  borderRadius: '50%', width: 16, height: 16, fontSize: 9, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Accueil */}
        {view === 'accueil' && (
          <>
            {/* Alertes */}
            {notifs.analysesEnAttente > 0 && (
              <div className="alert alert-warning" style={{ marginBottom: 16 }}>
                🧪 Vous avez <strong>{notifs.analysesEnAttente}</strong> analyse{notifs.analysesEnAttente > 1 ? 's' : ''} en attente de résultats.
              </div>
            )}
            {notifs.messagesNonLus > 0 && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>
                💬 <strong>{notifs.messagesNonLus}</strong> nouveau{notifs.messagesNonLus > 1 ? 'x' : ''} message{notifs.messagesNonLus > 1 ? 's' : ''} de votre médecin.
                <button onClick={() => setView('messagerie')} style={{ marginLeft: 10, background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, padding: '3px 10px', fontSize: 12, cursor: 'pointer' }}>Voir</button>
              </div>
            )}

            {/* Info patient */}
            {profil && (
              <div className="card" style={{ padding: 20, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontFamily: 'Syne', fontWeight: 700 }}>👤 Mes informations</div>
                  <button className="btn btn-outline" onClick={() => setView('profil')} style={{ fontSize: 12, padding: '4px 12px' }}>✏️ Modifier</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                  {[
                    ['Nom', profil.nom], ['Prénom', profil.prenom], ['CIN', profil.cin],
                    ['Date de naissance', profil.dateNaissance ? new Date(profil.dateNaissance).toLocaleDateString('fr-FR') : '—'],
                    ['Sexe', profil.sexe], ['Groupe sanguin', profil.groupeSanguin?.replace('_', ' ')],
                    ['Téléphone', profil.telephone || '—'], ['Email', profil.email || '—'],
                    ['Ville', profil.ville || '—'], ['Mutuelle', profil.mutuelle || '—'],
                    ['N° Dossier', profil.numeroDossier || '—'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                      <div style={{ color: 'var(--gray)', fontSize: 11, marginBottom: 2 }}>{k}</div>
                      <div style={{ fontWeight: 600 }}>{v || '—'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cards raccourcis */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
              {[
                { icon: '📁', title: 'Dossier médical', sub: 'Antécédents, consultations', color: '#dbeafe', action: loadDossier },
                { icon: '📅', title: 'Mes RDV', sub: 'Rendez-vous planifiés', color: '#d1fae5', action: () => setView('rdv') },
                { icon: '🧪', title: 'Mes analyses', sub: 'Résultats laboratoire', color: '#fef3c7', action: loadDossier },
                { icon: '📂', title: 'Documents', sub: 'Ordonnances, radios…', color: '#ede9fe', action: () => setView('documents') },
                { icon: '💬', title: 'Messagerie', sub: 'Contacter l\'équipe méd.', color: '#fce7f3', action: () => setView('messagerie') },
                { icon: '🔧', title: 'QR / PDF', sub: 'Export & partage', color: '#f0fdf4', action: () => setView('outils') },
              ].map((item, i) => (
                <div key={i} className="card" style={{ padding: 20, cursor: 'pointer' }} onClick={item.action}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 12 }}>{item.icon}</div>
                  <div style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 4, fontSize: 14 }}>{item.title}</div>
                  <div style={{ color: 'var(--gray)', fontSize: 12 }}>{item.sub}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {view === 'dossier' && <DossierMedical dossier={dossier} />}
        {view === 'rdv' && (
          <div>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 20, marginBottom: 16 }}>📅 Mes rendez-vous</h2>
            <RendezVousSection />
          </div>
        )}
        {view === 'documents' && (
          <div>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 20, marginBottom: 16 }}>📂 Mes documents médicaux</h2>
            <DocumentsSection />
          </div>
        )}
        {view === 'messagerie' && (
          <div>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 20, marginBottom: 16 }}>💬 Messagerie</h2>
            <MessagerieSection />
          </div>
        )}
        {view === 'outils' && (
          <div>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 20, marginBottom: 16 }}>🔧 Outils & Export</h2>
            <QrCodeSection profil={profil} />
          </div>
        )}
        {view === 'profil' && (
          <div>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 20, marginBottom: 16 }}>✏️ Modifier mon profil</h2>
            <EditProfilSection profil={profil} onSaved={(p) => { setProfil(p); }} />
          </div>
        )}

        <div style={{ height: 40 }} />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// PERSONNEL DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
export function PersonnelDashboard() {
  const { user } = useAuth()
  const [view, setView] = useState('liste')
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [dossier, setDossier] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadPatients = async (p = 0, q = '') => {
    setLoading(true); setError('')
    try {
      const res = q.trim() ? await patientApi.search(q, { page: p, size: 10 }) : await patientApi.getAll({ page: p, size: 10 })
      setPatients(res.data.content || [])
      setTotalPages(res.data.totalPages || 0)
      setTotal(res.data.totalElements || 0)
      setPage(p)
    } catch { setError('Impossible de charger la liste des patients.') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadPatients(0, '') }, [])

  const openDossier = async (patient) => {
    setSelectedPatient(patient); setDossier(null); setView('dossier'); setLoading(true)
    try { const r = await patientApi.dossier(patient.id); setDossier(r.data) }
    catch { setError('Impossible de charger le dossier médical.') }
    finally { setLoading(false) }
  }

  return (
    <div>
      <Navbar role="Espace Personnel" />
      <div className="container">
        <div style={{ padding: '40px 0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800 }}>
              Bonjour, {user?.role === 'MEDECIN' ? 'Dr.' : ''} {user?.prenom} 👨‍⚕️
            </h1>
            <p style={{ color: 'var(--gray)', marginTop: 4 }}>Tableau de bord — {user?.role}</p>
          </div>
          {view === 'dossier' && (
            <button className="btn btn-outline" onClick={() => { setView('liste'); setSelectedPatient(null) }}>← Retour</button>
          )}
        </div>
        {error && <div className="alert alert-error">⚠️ {error}</div>}
        {view === 'liste' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { icon: '👥', label: 'Patients total', value: total, color: '#dbeafe' },
                { icon: '👨‍⚕️', label: 'Votre rôle', value: user?.role, color: '#d1fae5' },
                { icon: '📅', label: 'Date', value: new Date().toLocaleDateString('fr-FR'), color: '#fef3c7' },
              ].map((s, i) => (
                <div key={i} className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--gray)' }}>{s.label}</div>
                    <div style={{ fontFamily: 'Syne', fontWeight: 700 }}>{s.value}</div>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={e => { e.preventDefault(); loadPatients(0, search) }} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input className="form-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom, prénom ou CIN..." style={{ flex: 1 }} />
              <button type="submit" className="btn btn-primary">🔍 Rechercher</button>
              {search && <button type="button" className="btn btn-outline" onClick={() => { setSearch(''); loadPatients(0, '') }}>✕</button>}
            </form>
            {loading ? <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /></div>
            : patients.length === 0 ? (
              <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--gray)' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>👥</div><div>Aucun patient trouvé</div>
              </div>
            ) : (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border)' }}>
                      {['Nom complet', 'CIN', 'Date naissance', 'Téléphone', 'Ville', 'N° Dossier', ''].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: 'var(--gray)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((p, i) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                              {p.prenom?.[0]}{p.nom?.[0]}
                            </div>
                            {p.prenom} {p.nom}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>{p.cin}</td>
                        <td style={{ padding: '12px 16px' }}>{p.dateNaissance ? new Date(p.dateNaissance).toLocaleDateString('fr-FR') : '—'}</td>
                        <td style={{ padding: '12px 16px' }}>{p.telephone || '—'}</td>
                        <td style={{ padding: '12px 16px' }}>{p.ville || '—'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: '#d1fae5', color: '#065f46', fontSize: 11, borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>{p.numeroDossier || '—'}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button className="btn btn-primary" onClick={() => openDossier(p)} style={{ padding: '4px 12px', fontSize: 12 }}>📁 Dossier</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
                <button className="btn btn-outline" disabled={page === 0} onClick={() => loadPatients(page - 1, search)} style={{ padding: '6px 14px', fontSize: 13 }}>← Préc.</button>
                <span style={{ padding: '6px 14px', fontSize: 13, color: 'var(--gray)' }}>Page {page + 1} / {totalPages}</span>
                <button className="btn btn-outline" disabled={page >= totalPages - 1} onClick={() => loadPatients(page + 1, search)} style={{ padding: '6px 14px', fontSize: 13 }}>Suiv. →</button>
              </div>
            )}
          </>
        )}
        {view === 'dossier' && selectedPatient && (
          <>
            <div className="card" style={{ padding: 20, marginBottom: 20, background: '#f0f9ff', border: '1px solid #bae6fd' }}>
              <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>👤 {selectedPatient.prenom} {selectedPatient.nom}</div>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13 }}>
                {[['CIN', selectedPatient.cin], ['Né(e) le', selectedPatient.dateNaissance ? new Date(selectedPatient.dateNaissance).toLocaleDateString('fr-FR') : '—'],
                  ['Sexe', selectedPatient.sexe], ['Groupe sanguin', selectedPatient.groupeSanguin?.replace('_', ' ')],
                  ['Téléphone', selectedPatient.telephone || '—'], ['Mutuelle', selectedPatient.mutuelle || '—']
                ].map(([k, v]) => (
                  <div key={k}><span style={{ color: 'var(--gray)' }}>{k} : </span><strong>{v}</strong></div>
                ))}
              </div>
            </div>
            {loading ? <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /></div> : <DossierMedical dossier={dossier} />}
          </>
        )}
        <div style={{ height: 40 }} />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
export function AdminDashboard() {
  const { user } = useAuth()
  const [view, setView] = useState('users')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ email: '', password: '', nom: '', prenom: '', cin: '', role: 'MEDECIN' })

  const loadUsers = async () => {
    setLoading(true)
    try { const r = await adminApi.listUsers(); setUsers(r.data) }
    catch { setError('Impossible de charger la liste des utilisateurs.') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadUsers() }, [])

  const handleToggle = async (id) => {
    try { await adminApi.toggleUser(id); setSuccess('Statut mis à jour.'); loadUsers(); setTimeout(() => setSuccess(''), 3000) }
    catch { setError('Erreur lors de la mise à jour.') }
  }

  const handleCreate = async (e) => {
    e.preventDefault(); setLoading(true); setError(''); setSuccess('')
    try {
      await adminApi.createPersonnel(form)
      setSuccess(`✅ Compte ${form.role} créé pour ${form.prenom} ${form.nom}`)
      setForm({ email: '', password: '', nom: '', prenom: '', cin: '', role: 'MEDECIN' })
      loadUsers(); setView('users')
    } catch (err) { setError(err.response?.data?.message || 'Erreur lors de la création du compte') }
    finally { setLoading(false) }
  }

  const roleColor = { ADMIN: '#fee2e2', MEDECIN: '#dbeafe', PERSONNEL: '#d1fae5', PATIENT: '#f3f4f6' }
  const roleTextColor = { ADMIN: '#991b1b', MEDECIN: '#1e40af', PERSONNEL: '#065f46', PATIENT: '#374151' }

  return (
    <div>
      <Navbar role="Administration" />
      <div className="container">
        <div style={{ padding: '40px 0 20px' }}>
          <h1 style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800 }}>⚙️ Administration</h1>
          <p style={{ color: 'var(--gray)', marginTop: 4 }}>Gestion des comptes utilisateurs</p>
        </div>
        {error && <div className="alert alert-error">⚠️ {error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[{ key: 'users', label: '👥 Utilisateurs' }, { key: 'creer', label: '➕ Créer un compte' }].map(t => (
            <button key={t.key} onClick={() => { setView(t.key); setError(''); setSuccess('') }}
              style={{ padding: '8px 20px', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: 14,
                background: view === t.key ? '#2563eb' : '#f3f4f6', color: view === t.key ? 'white' : '#374151',
                fontWeight: view === t.key ? 700 : 400 }}>
              {t.label}
            </button>
          ))}
        </div>
        {view === 'users' && (
          loading ? <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /></div> : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border)' }}>
                    {['Nom', 'Email', 'CIN', 'Rôle', 'Statut', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: 'var(--gray)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{u.prenom} {u.nom}</td>
                      <td style={{ padding: '12px 16px' }}>{u.email}</td>
                      <td style={{ padding: '12px 16px' }}>{u.cin || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: roleColor[u.role] || '#f3f4f6', color: roleTextColor[u.role] || '#374151', borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{u.role}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: u.enabled ? '#d1fae5' : '#fee2e2', color: u.enabled ? '#065f46' : '#991b1b', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
                          {u.enabled ? '✓ Actif' : '✗ Inactif'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {u.id !== user?.userId && (
                          <button onClick={() => handleToggle(u.id)}
                            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
                            {u.enabled ? '🔒 Désactiver' : '🔓 Activer'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
        {view === 'creer' && (
          <div className="card" style={{ maxWidth: 520, padding: 28 }}>
            <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 20 }}>➕ Nouveau compte</h3>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Nom *</label>
                  <input className="form-input" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Prénom *</label>
                  <input className="form-input" value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">CIN</label>
                  <input className="form-input" value={form.cin} onChange={e => setForm({...form, cin: e.target.value.toUpperCase()})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Rôle *</label>
                  <select className="form-select" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                    <option value="MEDECIN">Médecin</option>
                    <option value="PERSONNEL">Personnel</option>
                    <option value="ADMIN">Administrateur</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Email *</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Mot de passe temporaire * (min. 8 car.)</label>
                  <input className="form-input" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={8} />
                </div>
              </div>
              <div className="alert alert-warning" style={{ marginBottom: 16, fontSize: 12 }}>
                ℹ️ Un email avec les identifiants sera envoyé automatiquement.
              </div>
              <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                {loading ? <span className="spinner" /> : '✅ Créer le compte'}
              </button>
            </form>
          </div>
        )}
        <div style={{ height: 40 }} />
      </div>
    </div>
  )
}
