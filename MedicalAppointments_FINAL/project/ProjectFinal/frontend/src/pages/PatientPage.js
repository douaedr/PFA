import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyAppointments, cancelAppointment } from "../services/api";
import { useAuth } from "../context/AuthContext";

const STATUS_LABELS = {
    Confirmed:            { label:"Confirmé",           color:"#16a34a", bg:"#dcfce7" },
    CancelledByPatient:   { label:"Annulé par vous",    color:"#dc2626", bg:"#fee2e2" },
    CancelledByDoctor:    { label:"Annulé par médecin", color:"#dc2626", bg:"#fee2e2" },
    CancelledBySecretary: { label:"Annulé",             color:"#dc2626", bg:"#fee2e2" },
    Completed:            { label:"Terminé",            color:"#2563eb", bg:"#dbeafe" },
    NoShow:               { label:"Absent",             color:"#d97706", bg:"#fef3c7" },
};

export default function PatientPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancelId, setCancelId] = useState(null);
    const [cancelError, setCancelError] = useState("");
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        getMyAppointments()
            .then(res => setAppointments(res.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleCancel = async () => {
        setCancelError(""); setCancelling(true);
        try {
            await cancelAppointment({ appointmentId: cancelId });
            setAppointments(prev => prev.map(a => a.id===cancelId ? {...a, status:"CancelledByPatient"} : a));
            setCancelId(null);
        } catch (err) { setCancelError(err.response?.data?.message || "Erreur lors de l'annulation."); }
        finally { setCancelling(false); }
    };

    const upcoming = appointments.filter(a => a.status === "Confirmed");
    const past     = appointments.filter(a => a.status !== "Confirmed");

    return (
        <div style={styles.page}>
            <div style={styles.topbar}>
                <span style={styles.logo}>🏥 Mon espace patient</span>
                <div style={styles.actions}>
                    <span style={styles.name}>👤 {user?.fullName}</span>
                    <button style={styles.bookBtn} onClick={()=>navigate("/book")}>+ Nouveau RDV</button>
                    <button style={styles.logoutBtn} onClick={()=>{logout();navigate("/book");}}>Déconnexion</button>
                </div>
            </div>
            <div style={styles.content}>
                <div style={styles.statsRow}>
                    <div style={styles.statCard}><span style={styles.statNum}>{upcoming.length}</span><span style={styles.statLabel}>RDV à venir</span></div>
                    <div style={styles.statCard}><span style={styles.statNum}>{past.filter(a=>a.status==="Completed").length}</span><span style={styles.statLabel}>Terminés</span></div>
                    <div style={styles.statCard}><span style={styles.statNum}>{past.filter(a=>a.status.includes("Cancelled")).length}</span><span style={styles.statLabel}>Annulés</span></div>
                </div>
                {loading && <p style={styles.loading}>Chargement...</p>}
                {!loading && appointments.length===0 && (
                    <div style={styles.empty}>
                        <p style={{fontSize:"56px"}}>📅</p>
                        <p style={{fontSize:"18px",color:"#555",marginBottom:"20px"}}>Vous n'avez aucun rendez-vous.</p>
                        <button style={styles.bookBtn} onClick={()=>navigate("/book")}>Prendre un rendez-vous</button>
                    </div>
                )}
                {upcoming.length > 0 && (<>
                    <h3 style={styles.sectionTitle}>📅 Rendez-vous à venir</h3>
                    <div style={styles.grid}>{upcoming.map(appt => <AppointmentCard key={appt.id} appt={appt} onCancel={()=>{setCancelId(appt.id);setCancelError("");}}/>)}</div>
                </>)}
                {past.length > 0 && (<>
                    <h3 style={{...styles.sectionTitle,marginTop:"32px"}}>🕐 Historique</h3>
                    <div style={styles.grid}>{past.map(appt => <AppointmentCard key={appt.id} appt={appt} onCancel={null}/>)}</div>
                </>)}
            </div>
            {cancelId && (
                <div style={styles.overlay}><div style={styles.modal}>
                    <div style={{textAlign:"center",fontSize:"48px",marginBottom:"8px"}}>❌</div>
                    <h3 style={styles.modalTitle}>Annuler ce rendez-vous ?</h3>
                    <p style={{color:"#666",fontSize:"14px",marginBottom:"20px",textAlign:"center"}}>Cette action est irréversible.</p>
                    {cancelError && <div style={styles.errorBox}>{cancelError}</div>}
                    <div style={styles.modalBtns}>
                        <button style={styles.keepBtn} onClick={()=>{setCancelId(null);setCancelError("");}}>Garder le RDV</button>
                        <button style={styles.confirmCancelBtn} onClick={handleCancel} disabled={cancelling}>{cancelling?"Annulation...":"Confirmer l'annulation"}</button>
                    </div>
                </div></div>
            )}
        </div>
    );
}

function AppointmentCard({ appt, onCancel }) {
    const st = STATUS_LABELS[appt.status] || {label:appt.status, color:"#666", bg:"#f3f4f6"};
    const canCancel = appt.status === "Confirmed" && onCancel;
    const date = new Date(appt.startTime);
    const isToday = new Date().toDateString() === date.toDateString();

    return (
        <div style={{...styles.card, borderLeft:canCancel?"4px solid #16a34a":"4px solid #e5e7eb"}}>
            <div style={styles.cardHeader}>
                <span style={{...styles.badge, color:st.color, background:st.bg}}>{st.label}</span>
                {isToday && <span style={styles.todayBadge}>Aujourd'hui</span>}
                <span style={styles.cardDate}>{date.toLocaleDateString("fr-FR",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}</span>
            </div>
            <div style={styles.cardTime}>
                🕐 {date.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})} – {new Date(appt.endTime).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}
            </div>
            {/* ✅ FIX Bug 2 : Affichage du nom du médecin (doctorName) */}
            {appt.doctorName && (
                <div style={styles.cardDoctor}>👨‍⚕️ {appt.doctorName}</div>
            )}
            {!appt.doctorName && (
                <div style={styles.cardDoctor}>🏥 Prestation hospitalière</div>
            )}
            {/* ✅ FIX Bug 2 : Affichage du motif */}
            {appt.reason && (
                <div style={styles.cardReason}>📝 {appt.reason}</div>
            )}
            {/* ✅ FIX Bug 2 : Affichage du motif d'annulation */}
            {appt.cancelReason && (
                <div style={styles.cardCancelReason}>❌ Motif d'annulation : {appt.cancelReason}</div>
            )}
            {canCancel && <button style={styles.cancelBtn} onClick={onCancel}>Annuler ce rendez-vous</button>}
        </div>
    );
}

const styles = {
    page:{minHeight:"100vh",background:"#f0f4f8"},
    topbar:{background:"white",padding:"12px 32px",display:"flex",justifyContent:"space-between",alignItems:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.08)",flexWrap:"wrap",gap:"8px"},
    logo:{fontSize:"20px",fontWeight:"700",color:"#1e3a5f"},
    actions:{display:"flex",gap:"12px",alignItems:"center"},
    name:{color:"#2563eb",fontWeight:"600"},
    bookBtn:{padding:"8px 18px",background:"#2563eb",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontWeight:"600"},
    logoutBtn:{padding:"8px 16px",background:"transparent",border:"2px solid #dc2626",color:"#dc2626",borderRadius:"8px",cursor:"pointer",fontWeight:"600"},
    content:{maxWidth:"900px",margin:"0 auto",padding:"32px 16px"},
    statsRow:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"16px",marginBottom:"32px"},
    statCard:{background:"white",borderRadius:"14px",padding:"20px",textAlign:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},
    statNum:{display:"block",fontSize:"32px",fontWeight:"800",color:"#2563eb"},
    statLabel:{fontSize:"13px",color:"#888",fontWeight:"600"},
    loading:{textAlign:"center",color:"#888",padding:"40px"},
    empty:{textAlign:"center",padding:"60px"},
    sectionTitle:{color:"#1e3a5f",fontSize:"20px",fontWeight:"700",marginBottom:"16px"},
    grid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:"16px"},
    card:{background:"white",borderRadius:"14px",padding:"20px",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},
    cardHeader:{display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px",flexWrap:"wrap"},
    badge:{padding:"4px 12px",borderRadius:"20px",fontSize:"12px",fontWeight:"700"},
    todayBadge:{padding:"4px 10px",background:"#fef3c7",color:"#92400e",borderRadius:"20px",fontSize:"12px",fontWeight:"700"},
    cardDate:{color:"#6b7280",fontSize:"13px",marginLeft:"auto"},
    cardTime:{color:"#1e3a5f",fontWeight:"700",fontSize:"15px",marginBottom:"8px"},
    cardDoctor:{color:"#6b7280",fontSize:"14px",marginBottom:"4px"},
    cardReason:{color:"#555",fontSize:"13px",fontStyle:"italic",marginBottom:"4px"},
    cardCancelReason:{color:"#dc2626",fontSize:"13px",marginBottom:"8px"},
    cancelBtn:{marginTop:"12px",padding:"8px 16px",background:"#fee2e2",color:"#dc2626",border:"2px solid #fca5a5",borderRadius:"8px",cursor:"pointer",fontWeight:"600",fontSize:"13px"},
    overlay:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000},
    modal:{background:"white",padding:"32px",borderRadius:"16px",maxWidth:"420px",width:"90%",boxShadow:"0 8px 32px rgba(0,0,0,0.2)"},
    modalTitle:{color:"#1e3a5f",fontSize:"20px",marginBottom:"12px",textAlign:"center"},
    errorBox:{background:"#fee2e2",color:"#dc2626",padding:"10px",borderRadius:"8px",marginBottom:"12px",fontSize:"13px"},
    modalBtns:{display:"flex",gap:"12px",justifyContent:"flex-end"},
    keepBtn:{padding:"10px 20px",background:"#f3f4f6",color:"#374151",border:"none",borderRadius:"8px",cursor:"pointer",fontWeight:"600"},
    confirmCancelBtn:{padding:"10px 20px",background:"#dc2626",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontWeight:"600"},
};