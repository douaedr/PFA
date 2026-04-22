import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "../components/Calendar";
import { getAllAppointments, bookAppointment, cancelAppointment } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function SecretaryPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("calendar");
  const [appointments, setAppointments] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookForm, setBookForm] = useState({ patientName:"", patientEmail:"", patientPhone:"", reason:"" });
  const [bookMsg, setBookMsg] = useState("");
  const [bookError, setBookError] = useState("");

  useEffect(() => {
    if (tab === "appointments") {
      getAllAppointments().then(res => setAppointments(res.data)).catch(() => {});
    }
  }, [tab]);

  const handleBook = async (e) => {
    e.preventDefault();
    setBookMsg(""); setBookError("");
    try {
      await bookAppointment({ timeSlotId: selectedSlot.id, ...bookForm });
      setBookMsg("✅ Rendez-vous créé avec succès !");
      setSelectedSlot(null);
      setBookForm({ patientName:"", patientEmail:"", patientPhone:"", reason:"" });
    } catch (err) {
      setBookError(err.response?.data?.message || "Erreur");
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Annuler ce rendez-vous ?")) return;
    try {
      await cancelAppointment({ appointmentId: id });
      setAppointments(prev => prev.map(a => a.id===id ? {...a, status:"CancelledBySecretary"} : a));
    } catch (err) { alert(err.response?.data?.message || "Erreur"); }
  };

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <span style={styles.logo}>🏥 Espace Secrétaire</span>
        <div style={styles.actions}>
          <span style={styles.name}>👩‍💼 {user?.fullName}</span>
          <button style={styles.logoutBtn} onClick={() => { logout(); navigate("/login"); }}>Déconnexion</button>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.tabs}>
          {[["calendar","📅 Calendrier"],["appointments","📋 Rendez-vous"]].map(([key,label]) => (
            <button key={key} style={{...styles.tab, ...(tab===key?styles.tabActive:{})}} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>

        {tab === "calendar" && (
          <div>
            <h2 style={styles.title}>Réserver un créneau pour un patient</h2>
            {bookMsg && <div style={styles.success}>{bookMsg}</div>}
            <p style={{color:"#666", marginBottom:"16px"}}>Cliquez sur un créneau vert pour réserver</p>
            <Calendar doctorId={1} role="Secretary" onSlotSelect={setSelectedSlot} />
          </div>
        )}

        {tab === "appointments" && (
          <div>
            <h2 style={styles.title}>Tous les rendez-vous</h2>
            <div style={styles.table}>
              {appointments.map(appt => (
                <div key={appt.id} style={styles.apptRow}>
                  <div>
                    <strong>{appt.patientName}</strong>
                    <div style={styles.email}>{appt.patientEmail}</div>
                  </div>
                  <div style={styles.apptDate}>
                    {new Date(appt.startTime).toLocaleDateString("fr-FR",{day:"2-digit",month:"short"})}
                    {" à "}
                    {new Date(appt.startTime).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}
                  </div>
                  <span style={{...styles.badge, ...(appt.status==="Confirmed"?{background:"#dcfce7",color:"#16a34a"}:{background:"#fee2e2",color:"#dc2626"})}}>
                    {appt.status}
                  </span>
                  {appt.status === "Confirmed" && (
                    <button style={styles.cancelBtn} onClick={() => handleCancel(appt.id)}>Annuler</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal réservation pour patient */}
      {selectedSlot && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Réserver pour un patient</h3>
            <div style={styles.slotInfo}>
              📅 {new Date(selectedSlot.startTime).toLocaleDateString("fr-FR",{weekday:"long",day:"2-digit",month:"long"})}
              {" — "}
              🕐 {new Date(selectedSlot.startTime).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}
            </div>
            {bookError && <div style={styles.error}>{bookError}</div>}
            <form onSubmit={handleBook}>
              <input style={styles.input} placeholder="Nom du patient *" required
                value={bookForm.patientName} onChange={e => setBookForm({...bookForm, patientName:e.target.value})} />
              <input style={styles.input} type="email" placeholder="Email du patient *" required
                value={bookForm.patientEmail} onChange={e => setBookForm({...bookForm, patientEmail:e.target.value})} />
              <input style={styles.input} placeholder="Téléphone"
                value={bookForm.patientPhone} onChange={e => setBookForm({...bookForm, patientPhone:e.target.value})} />
              <textarea style={styles.textarea} placeholder="Motif" rows={3}
                value={bookForm.reason} onChange={e => setBookForm({...bookForm, reason:e.target.value})} />
              <div style={styles.modalBtns}>
                <button type="button" style={styles.cancelModalBtn} onClick={() => setSelectedSlot(null)}>Annuler</button>
                <button type="submit" style={styles.confirmBtn}>✅ Réserver</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { minHeight:"100vh", background:"#f0f4f8" },
  topbar: { background:"white", padding:"12px 32px", display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.08)" },
  logo: { fontSize:"20px", fontWeight:"700", color:"#1e3a5f" },
  actions: { display:"flex", gap:"12px", alignItems:"center" },
  name: { color:"#555" },
  logoutBtn: { padding:"8px 16px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:"8px", cursor:"pointer", fontWeight:"600" },
  content: { maxWidth:"1100px", margin:"0 auto", padding:"32px 16px" },
  tabs: { display:"flex", gap:"8px", marginBottom:"24px" },
  tab: { padding:"10px 24px", background:"white", border:"2px solid #ddd", borderRadius:"10px", cursor:"pointer", fontWeight:"600" },
  tabActive: { background:"#2563eb", color:"white", borderColor:"#2563eb" },
  title: { color:"#1e3a5f", fontSize:"22px", marginBottom:"20px" },
  success: { background:"#dcfce7", color:"#16a34a", padding:"12px", borderRadius:"8px", marginBottom:"16px" },
  table: { display:"grid", gap:"10px" },
  apptRow: { background:"white", borderRadius:"10px", padding:"16px 20px", display:"flex", alignItems:"center", gap:"16px", flexWrap:"wrap", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" },
  email: { color:"#888", fontSize:"13px" },
  apptDate: { color:"#2563eb", fontWeight:"600", fontSize:"14px" },
  badge: { padding:"4px 12px", borderRadius:"20px", fontSize:"12px", fontWeight:"600" },
  cancelBtn: { padding:"6px 14px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:"8px", cursor:"pointer", fontWeight:"600", fontSize:"13px" },
  overlay: { position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 },
  modal: { background:"white", padding:"28px", borderRadius:"16px", maxWidth:"440px", width:"90%" },
  modalTitle: { color:"#1e3a5f", fontSize:"18px", marginBottom:"16px" },
  slotInfo: { background:"#f0f9ff", padding:"12px", borderRadius:"8px", marginBottom:"16px", color:"#1e40af", fontSize:"14px" },
  input: { width:"100%", padding:"10px", border:"1px solid #ddd", borderRadius:"8px", marginBottom:"10px", fontSize:"14px", boxSizing:"border-box" },
  textarea: { width:"100%", padding:"10px", border:"1px solid #ddd", borderRadius:"8px", marginBottom:"12px", fontSize:"14px", boxSizing:"border-box" },
  modalBtns: { display:"flex", gap:"12px", justifyContent:"flex-end" },
  cancelModalBtn: { padding:"10px 20px", background:"#f3f4f6", color:"#374151", border:"none", borderRadius:"8px", cursor:"pointer", fontWeight:"600" },
  confirmBtn: { padding:"10px 20px", background:"#16a34a", color:"white", border:"none", borderRadius:"8px", cursor:"pointer", fontWeight:"600" },
  error: { background:"#fee2e2", color:"#dc2626", padding:"10px", borderRadius:"8px", marginBottom:"10px", fontSize:"13px" },
};
