import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { bookAppointment, joinWaitingList, getServices, getDoctorsByService,
         getHospitalSlots, isHospitalWeekFull, getSlots, isWeekFull } from "../services/api";
import { useAuth } from "../context/AuthContext";
import * as signalR from "@microsoft/signalr";

const CATEGORIES = [
    { key:"specialites", label:"Spécialités", icon:"🏥", desc:"Cardiologie, Dermatologie, Gynécologie...", color:"#2563eb", ids:[1,2,3,4,5,6,7,8],    hasDoctor:true },
    { key:"analyses",    label:"Analyses",    icon:"🔬", desc:"Bilan sanguin, hormonal, infectieux...",   color:"#16a34a", ids:[9,10,11,12,13],         hasDoctor:false },
    { key:"radio",       label:"Radiologie",  icon:"📡", desc:"Radiographie, Échographie, IRM...",        color:"#9333ea", ids:[14,15,16,17,18,19],      hasDoctor:false },
    { key:"scanner",     label:"Scanner",     icon:"🖥️", desc:"Scanner cérébral, thoracique, abdominal...",color:"#ea580c", ids:[20,21,22,23,24],        hasDoctor:false },
];

const DAYS = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
const STATUS_COLORS = {
    Available: { bg:"#dcfce7", color:"#16a34a", border:"#16a34a", label:"Disponible" },
    Reserved:  { bg:"#fee2e2", color:"#dc2626", border:"#dc2626", label:"Réservé" },
    Blocked:   { bg:"#f3f4f6", color:"#6b7280", border:"#9ca3af", label:"Bloqué" },
    Cancelled: { bg:"#fef9c3", color:"#ca8a04", border:"#ca8a04", label:"Annulé" },
};

function getMondayOf(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1 - day);
    d.setDate(d.getDate() + diff);
    d.setHours(0,0,0,0);
    return d;
}
function formatDateOnly(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth()+1).padStart(2,"0");
    const d = String(date.getDate()).padStart(2,"0");
    return `${y}-${m}-${d}`;
}
function getLocalDateStr(dateStr) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

// ✅ FIX Bug 1 : Calendrier hospitalier (sans médecin) — Analyses / Radio / Scanner
function HospitalCalendar({ serviceId, onSlotSelect }) {
    const [slots, setSlots] = useState([]);
    const [weekStart, setWeekStart] = useState(getMondayOf(new Date()));
    const [loading, setLoading] = useState(false);
    const [weekFull, setWeekFull] = useState(false);
    const loadRef = useRef(null);
    const now = new Date();

    const loadSlots = useCallback(async () => {
        if (!serviceId) return;
        setLoading(true);
        try {
            const dateStr = formatDateOnly(weekStart);
            const [slotsRes, fullRes] = await Promise.all([
                getHospitalSlots(serviceId, dateStr),
                isHospitalWeekFull(serviceId, dateStr),
            ]);
            setSlots(slotsRes.data);
            setWeekFull(fullRes.data.isFull);
        } catch (e) {
            console.error("Erreur chargement créneaux hospitaliers", e);
        } finally {
            setLoading(false);
        }
    }, [serviceId, weekStart]);

    useEffect(() => { loadRef.current = loadSlots; }, [loadSlots]);

    useEffect(() => {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl("http://localhost:5000/hubs/slots")
            .withAutomaticReconnect()
            .build();
        connection.on("SlotStatusChanged", () => { if (loadRef.current) loadRef.current(); });
        connection.on("SlotAdded",         () => { if (loadRef.current) loadRef.current(); });
        connection.start().catch(e => console.warn("SignalR:", e.message));
        const interval = setInterval(() => { if (loadRef.current) loadRef.current(); }, 10000);
        return () => { connection.stop(); clearInterval(interval); };
    }, []);

    useEffect(() => { loadSlots(); }, [loadSlots]);

    const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate()-7); setWeekStart(d); };
    const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate()+7); setWeekStart(d); };

    const slotsByDay = Array.from({length:7}, (_,i) => {
        const day = new Date(weekStart);
        day.setDate(day.getDate()+i);
        const dayStr = formatDateOnly(day);
        return { label: DAYS[i], date: day, slots: slots.filter(s => getLocalDateStr(s.startTime) === dayStr) };
    });

    return (
        <div style={calStyles.container}>
            <div style={calStyles.header}>
                <button style={calStyles.navBtn} onClick={prevWeek}>← Semaine précédente</button>
                <span style={calStyles.weekLabel}>Semaine du {weekStart.toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"})}</span>
                <button style={calStyles.navBtn} onClick={nextWeek}>Semaine suivante →</button>
            </div>
            {loading && <p style={calStyles.loading}>Chargement des créneaux...</p>}
            <div style={calStyles.legend}>
                {Object.entries(STATUS_COLORS).map(([k,v]) => (
                    <span key={k} style={{...calStyles.legendItem, background:v.bg, color:v.color, border:`1px solid ${v.border}`}}>{v.label}</span>
                ))}
            </div>
            <div style={calStyles.grid}>
                {slotsByDay.map(({label, date, slots:daySlots}) => (
                    <div key={label} style={calStyles.dayCol}>
                        <div style={calStyles.dayHeader}>
                            <strong>{label}</strong>
                            <span style={calStyles.dayDate}>{date.toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit"})}</span>
                        </div>
                        {daySlots.length === 0 ? <div style={calStyles.noSlot}>—</div> : daySlots.map(slot => {
                            const st = STATUS_COLORS[slot.status] || STATUS_COLORS.Available;
                            const isPast = new Date(slot.startTime) <= now;
                            const clickable = slot.isClickable && slot.status === "Available" && !isPast;
                            return (
                                <button key={slot.id}
                                    style={{...calStyles.slotBtn, background:isPast?"#f3f4f6":st.bg, color:isPast?"#9ca3af":st.color, border:`2px solid ${isPast?"#e5e7eb":st.border}`, opacity:clickable?1:0.5, cursor:clickable?"pointer":"not-allowed"}}
                                    disabled={!clickable}
                                    onClick={() => clickable && onSlotSelect && onSlotSelect(slot)}
                                    title={isPast?"Créneau passé":slot.status}>
                                    {new Date(slot.startTime).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}
                                    {" – "}
                                    {new Date(slot.endTime).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>
            {weekFull && (
                <div style={calStyles.fullAlert}>
                    ⚠️ Tous les créneaux de cette semaine sont occupés. Vous pouvez vous inscrire sur la <strong>liste d'attente</strong>.
                </div>
            )}
        </div>
    );
}

// Calendrier médecin (inchangé, juste déplacé ici pour éviter l'import circulaire)
function DoctorCalendar({ doctorId, onSlotSelect, role }) {
    const [slots, setSlots] = useState([]);
    const [weekStart, setWeekStart] = useState(getMondayOf(new Date()));
    const [loading, setLoading] = useState(false);
    const [weekFull, setWeekFull] = useState(false);
    const loadRef = useRef(null);
    const now = new Date();

    const loadSlots = useCallback(async () => {
        if (doctorId == null) return;
        setLoading(true);
        try {
            const dateStr = formatDateOnly(weekStart);
            const [slotsRes, fullRes] = await Promise.all([
                getSlots(doctorId, dateStr),
                isWeekFull(doctorId, dateStr),
            ]);
            setSlots(slotsRes.data);
            setWeekFull(fullRes.data.isFull);
        } catch (e) {
            console.error("Erreur chargement créneaux", e);
        } finally {
            setLoading(false);
        }
    }, [doctorId, weekStart]);

    useEffect(() => { loadRef.current = loadSlots; }, [loadSlots]);

    useEffect(() => {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl("http://localhost:5000/hubs/slots")
            .withAutomaticReconnect()
            .build();
        connection.on("SlotStatusChanged", () => { if (loadRef.current) loadRef.current(); });
        connection.on("SlotAdded",         () => { if (loadRef.current) loadRef.current(); });
        connection.start().catch(e => console.warn("SignalR:", e.message));
        const interval = setInterval(() => { if (loadRef.current) loadRef.current(); }, 10000);
        return () => { connection.stop(); clearInterval(interval); };
    }, []);

    useEffect(() => { loadSlots(); }, [loadSlots]);

    const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate()-7); setWeekStart(d); };
    const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate()+7); setWeekStart(d); };

    const slotsByDay = Array.from({length:7}, (_,i) => {
        const day = new Date(weekStart);
        day.setDate(day.getDate()+i);
        const dayStr = formatDateOnly(day);
        return { label: DAYS[i], date: day, slots: slots.filter(s => getLocalDateStr(s.startTime) === dayStr) };
    });

    return (
        <div style={calStyles.container}>
            <div style={calStyles.header}>
                <button style={calStyles.navBtn} onClick={prevWeek}>← Semaine précédente</button>
                <span style={calStyles.weekLabel}>Semaine du {weekStart.toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"})}</span>
                <button style={calStyles.navBtn} onClick={nextWeek}>Semaine suivante →</button>
            </div>
            {loading && <p style={calStyles.loading}>Chargement des créneaux...</p>}
            <div style={calStyles.legend}>
                {Object.entries(STATUS_COLORS).map(([k,v]) => (
                    <span key={k} style={{...calStyles.legendItem, background:v.bg, color:v.color, border:`1px solid ${v.border}`}}>{v.label}</span>
                ))}
            </div>
            <div style={calStyles.grid}>
                {slotsByDay.map(({label, date, slots:daySlots}) => (
                    <div key={label} style={calStyles.dayCol}>
                        <div style={calStyles.dayHeader}>
                            <strong>{label}</strong>
                            <span style={calStyles.dayDate}>{date.toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit"})}</span>
                        </div>
                        {daySlots.length === 0 ? <div style={calStyles.noSlot}>—</div> : daySlots.map(slot => {
                            const st = STATUS_COLORS[slot.status] || STATUS_COLORS.Available;
                            const isPast = new Date(slot.startTime) <= now;
                            const clickable = slot.isClickable && slot.status === "Available" && !isPast;
                            return (
                                <button key={slot.id}
                                    style={{...calStyles.slotBtn, background:isPast?"#f3f4f6":st.bg, color:isPast?"#9ca3af":st.color, border:`2px solid ${isPast?"#e5e7eb":st.border}`, opacity:clickable?1:0.5, cursor:clickable?"pointer":"not-allowed"}}
                                    disabled={!clickable}
                                    onClick={() => clickable && onSlotSelect && onSlotSelect(slot)}
                                    title={isPast?"Créneau passé":slot.status}>
                                    {new Date(slot.startTime).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}
                                    {" – "}
                                    {new Date(slot.endTime).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>
            {weekFull && (
                <div style={calStyles.fullAlert}>
                    ⚠️ Tous les créneaux de cette semaine sont occupés.
                    {role !== "Doctor" && <span> Vous pouvez vous inscrire sur la <strong>liste d'attente</strong>.</span>}
                </div>
            )}
        </div>
    );
}

const calStyles = {
    container:{background:"white",borderRadius:"16px",padding:"24px",boxShadow:"0 2px 12px rgba(0,0,0,0.08)"},
    header:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px",flexWrap:"wrap",gap:"8px"},
    navBtn:{padding:"8px 16px",background:"#2563eb",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontSize:"14px"},
    weekLabel:{fontWeight:"700",color:"#1e3a5f",fontSize:"16px"},
    loading:{textAlign:"center",color:"#888",padding:"20px"},
    legend:{display:"flex",gap:"8px",marginBottom:"16px",flexWrap:"wrap"},
    legendItem:{padding:"4px 12px",borderRadius:"20px",fontSize:"12px",fontWeight:"600"},
    grid:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"8px",overflowX:"auto"},
    dayCol:{minWidth:"90px"},
    dayHeader:{textAlign:"center",padding:"8px 4px",background:"#f0f4f8",borderRadius:"8px",marginBottom:"6px"},
    dayDate:{display:"block",fontSize:"12px",color:"#888"},
    noSlot:{textAlign:"center",color:"#ccc",padding:"8px",fontSize:"20px"},
    slotBtn:{display:"block",width:"100%",padding:"8px 4px",borderRadius:"8px",fontSize:"12px",fontWeight:"600",marginBottom:"4px",transition:"all 0.2s"},
    fullAlert:{marginTop:"16px",padding:"16px",background:"#fef3c7",border:"1px solid #fcd34d",borderRadius:"10px",color:"#92400e",fontSize:"14px"},
};

// ─── Page principale de réservation ──────────────────────────────────────────
export default function BookPage() {
    const { user, isLoggedIn, loginUser, logout, testUsers } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [activeCategory, setActiveCategory] = useState(null);
    const [services, setServices] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loadingSvc, setLoadingSvc] = useState(true);
    const [loadingDoc, setLoadingDoc] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [form, setForm] = useState({ patientName:"", patientEmail:"", patientPhone:"", reason:"" });
    const [waitingForm, setWaitingForm] = useState({ patientName:"", email:"", phone:"", weekStart:"" });
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showWaiting, setShowWaiting] = useState(false);

    useEffect(() => {
        getServices().then(res => setServices(res.data)).catch(()=>{}).finally(()=>setLoadingSvc(false));
    }, []);

    const getServicesForCategory = (cat) => services.filter(svc => cat.ids.includes(svc.id));
    const currentCat = CATEGORIES.find(c => c.key === activeCategory);

    const handleSelectService = async (svc) => {
        setSelectedService(svc); setSelectedDoctor(null);
        if (!currentCat.hasDoctor) {
            // ✅ FIX Bug 1 : On saute l'étape médecin et on va directement au calendrier hospitalier
            setStep(3);
        } else {
            setStep(2); setLoadingDoc(true);
            try { const res = await getDoctorsByService(svc.id); setDoctors(res.data); }
            catch { setDoctors([]); } finally { setLoadingDoc(false); }
        }
    };

    const handleSelectDoctor = (doc) => { setSelectedDoctor(doc); setStep(3); };

    const goBack = () => {
        if (step===2) { setStep(1); setSelectedService(null); setActiveCategory(null); }
        if (step===3) {
            if (currentCat?.hasDoctor) { setStep(2); setSelectedDoctor(null); setSelectedSlot(null); }
            else { setStep(1); setSelectedService(null); setSelectedDoctor(null); setActiveCategory(null); }
        }
    };

    const handleBook = async (e) => {
        e.preventDefault(); setLoading(true); setError("");
        try {
            const payload = { timeSlotId: selectedSlot.id, reason: form.reason };
            if (!isLoggedIn) { payload.patientName=form.patientName; payload.patientEmail=form.patientEmail; payload.patientPhone=form.patientPhone; }
            const res = await bookAppointment(payload);
            setSuccess(res.data); setSelectedSlot(null);
            setForm({ patientName:"", patientEmail:"", patientPhone:"", reason:"" });
        } catch (err) { setError(err.response?.data?.message || "Erreur lors de la réservation"); }
        finally { setLoading(false); }
    };

    const handleWaiting = async (e) => {
        e.preventDefault(); setLoading(true);
        try { await joinWaitingList({ doctorId: selectedDoctor?.id, ...waitingForm }); alert("Inscription confirmée !"); setShowWaiting(false); }
        catch (err) { alert(err.response?.data?.message || "Erreur"); } finally { setLoading(false); }
    };

    const resetAll = () => { setSuccess(null); setStep(1); setSelectedService(null); setSelectedDoctor(null); setActiveCategory(null); setSelectedSlot(null); };

    return (
        <div style={s.page}>
            <div style={s.topbar}>
                <span style={s.logo}>🏥 Rendez-vous Médicaux</span>
                <div style={s.actions}>
                    {isLoggedIn ? (
                        <>
                            <span style={s.welcome}>{user?.role==="Doctor"?"👨‍⚕️":user?.role==="Secretary"?"👩‍💼":"👤"} {user?.fullName}</span>
                            {user?.role==="Patient" && <button style={s.linkBtn} onClick={()=>navigate("/patient")}>Mes RDV</button>}
                            {user?.role==="Secretary" && <button style={s.linkBtn} onClick={()=>navigate("/secretary")}>Espace Secrétaire</button>}
                            <button style={{...s.linkBtn,borderColor:"#dc2626",color:"#dc2626"}} onClick={logout}>Déconnexion</button>
                        </>
                    ) : (
                        <select style={s.selectUser} onChange={e=>{
                            const sel=testUsers.find(u=>u.id===parseInt(e.target.value));
                            if(sel){loginUser(sel);if(sel.role==="Doctor")navigate("/doctor");if(sel.role==="Secretary")navigate("/secretary");}
                        }} defaultValue="">
                            <option value="" disabled>🔐 Se connecter comme...</option>
                            <optgroup label="👨‍⚕️ Médecins">{testUsers.filter(u=>u.role==="Doctor").map(u=><option key={u.id} value={u.id}>{u.fullName}</option>)}</optgroup>
                            <optgroup label="👩‍💼 Secrétaires">{testUsers.filter(u=>u.role==="Secretary").map(u=><option key={u.id} value={u.id}>{u.fullName}</option>)}</optgroup>
                            <optgroup label="👤 Patients">{testUsers.filter(u=>u.role==="Patient").map(u=><option key={u.id} value={u.id}>{u.fullName}</option>)}</optgroup>
                        </select>
                    )}
                </div>
            </div>
            <div style={s.content}>
                <div style={s.stepper}>
                    {[{n:1,label:"Service"},{n:2,label:"Médecin"},{n:3,label:"Créneau"}].map(({n,label})=>(
                        <React.Fragment key={n}>
                            <div style={s.stepItem}>
                                <div style={{...s.stepCircle,background:step>=n?"#2563eb":"#e5e7eb",color:step>=n?"white":"#9ca3af",opacity:(n===2&&activeCategory&&!currentCat?.hasDoctor)?0.3:1}}>
                                    {step>n?"✓":n}
                                </div>
                                <span style={{...s.stepLabel,color:step>=n?"#2563eb":"#9ca3af"}}>{label}</span>
                            </div>
                            {n<3&&<div style={{...s.stepLine,background:step>n?"#2563eb":"#e5e7eb"}}/>}
                        </React.Fragment>
                    ))}
                </div>

                {step===1&&!activeCategory&&(
                    <div>
                        <h2 style={s.stepTitle}>Choisissez un type de service</h2>
                        <p style={s.stepSub}>Sélectionnez la catégorie de soins dont vous avez besoin</p>
                        <div style={s.categoryGrid}>
                            {CATEGORIES.map(cat=>(
                                <button key={cat.key} style={{...s.categoryCard,borderColor:cat.color}} onClick={()=>setActiveCategory(cat.key)}>
                                    <span style={s.catIcon}>{cat.icon}</span>
                                    <span style={{...s.catLabel,color:cat.color}}>{cat.label}</span>
                                    <span style={s.catDesc}>{cat.desc}</span>
                                    <span style={{...s.catArrow,color:cat.color}}>Voir →</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step===1&&activeCategory&&(
                    <div>
                        <button style={s.backBtn} onClick={()=>setActiveCategory(null)}>← Retour</button>
                        <h2 style={s.stepTitle}>{currentCat?.icon} {currentCat?.label} — Choisissez un service</h2>
                        <p style={s.stepSub}>Sélectionnez le service dont vous avez besoin</p>
                        {loadingSvc?<p style={s.loading}>Chargement...</p>:(
                            <div style={s.serviceGrid}>
                                {getServicesForCategory(currentCat).map(svc=>(
                                    <button key={svc.id} style={s.serviceCard} onClick={()=>handleSelectService(svc)}>
                                        <span style={s.serviceIcon}>{svc.icon||currentCat.icon}</span>
                                        <span style={s.serviceName}>{svc.name}</span>
                                        {svc.description&&<span style={s.serviceDesc}>{svc.description}</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {step===2&&(
                    <div>
                        <button style={s.backBtn} onClick={goBack}>← Retour</button>
                        <h2 style={s.stepTitle}>{selectedService?.icon} {selectedService?.name} — Choisissez un médecin</h2>
                        <p style={s.stepSub}>Sélectionnez le médecin avec qui vous souhaitez consulter</p>
                        {loadingDoc?<p style={s.loading}>Chargement...</p>:doctors.length===0?(
                            <div style={s.emptyDoc}><p style={{fontSize:"48px"}}>🔍</p><p>Aucun médecin disponible.</p><button style={s.backBtn2} onClick={goBack}>Choisir un autre service</button></div>
                        ):(
                            <div style={s.doctorGrid}>
                                {doctors.map(doc=>(
                                    <button key={doc.id} style={s.doctorCard} onClick={()=>handleSelectDoctor(doc)}>
                                        <div style={s.doctorAvatar}>{doc.fullName.charAt(0).toUpperCase()}</div>
                                        <div style={s.doctorInfo}>
                                            <span style={s.doctorName}>{doc.fullName}</span>
                                            <span style={s.doctorService}>{selectedService?.name}</span>
                                            {doc.email&&<span style={s.doctorEmail}>✉️ {doc.email}</span>}
                                        </div>
                                        <span style={s.doctorArrow}>→</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {step===3&&(
                    <div>
                        <button style={s.backBtn} onClick={goBack}>← Retour</button>
                        <div style={s.selectionSummary}>
                            <div style={s.summaryItem}>
                                <span style={{fontSize:"28px"}}>{selectedService?.icon||currentCat?.icon}</span>
                                <div><div style={s.summaryLabel}>Service</div><div style={s.summaryValue}>{selectedService?.name}</div></div>
                            </div>
                            {currentCat?.hasDoctor&&selectedDoctor&&(
                                <><div style={s.summaryDivider}/>
                                <div style={s.summaryItem}>
                                    <span style={{fontSize:"28px"}}>👨‍⚕️</span>
                                    <div><div style={s.summaryLabel}>Médecin</div><div style={s.summaryValue}>{selectedDoctor?.fullName}</div></div>
                                </div></>
                            )}
                            {!currentCat?.hasDoctor&&(
                                <><div style={s.summaryDivider}/>
                                <div style={s.summaryItem}>
                                    <span style={{fontSize:"28px"}}>🏥</span>
                                    <div><div style={s.summaryLabel}>Type</div><div style={s.summaryValue}>Créneau hospitalier</div></div>
                                </div></>
                            )}
                        </div>
                        <h2 style={s.stepTitle}>📅 Créneaux disponibles</h2>
                        <p style={s.stepSub}>Cliquez sur un créneau <span style={{color:"#16a34a",fontWeight:"bold"}}>vert</span> pour le réserver</p>

                        {/* ✅ FIX Bug 1 : Afficher le bon calendrier selon le type de service */}
                        {currentCat?.hasDoctor && selectedDoctor?.id ? (
                            <DoctorCalendar
                                doctorId={selectedDoctor.id}
                                onSlotSelect={(slot) => {
                                    setSelectedSlot(slot);
                                    setForm({ patientName:"", patientEmail:"", patientPhone:"", reason:"" });
                                    setError("");
                                }}
                                role={user?.role}
                            />
                        ) : !currentCat?.hasDoctor && selectedService?.id ? (
                            <HospitalCalendar
                                serviceId={selectedService.id}
                                onSlotSelect={(slot) => {
                                    setSelectedSlot(slot);
                                    setForm({ patientName:"", patientEmail:"", patientPhone:"", reason:"" });
                                    setError("");
                                }}
                            />
                        ) : (
                            <p style={{textAlign:"center",color:"#888"}}>Veuillez sélectionner un service pour voir les créneaux.</p>
                        )}

                        <button style={s.waitingBtn} onClick={()=>setShowWaiting(true)}>📋 S'inscrire sur la liste d'attente</button>
                    </div>
                )}

                {selectedSlot&&(
                    <div style={s.overlay}><div style={s.modal}>
                        <h3 style={s.modalTitle}>Confirmer le rendez-vous</h3>
                        <div style={s.recapBox}>
                            <div style={s.recapRow}>{selectedService?.icon} {selectedService?.name}</div>
                            {currentCat?.hasDoctor&&<div style={s.recapRow}>👨‍⚕️ {selectedDoctor?.fullName}</div>}
                            <div style={s.recapRow}>📅 {new Date(selectedSlot.startTime).toLocaleDateString("fr-FR",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}</div>
                            <div style={s.recapRow}>🕐 {new Date(selectedSlot.startTime).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})} – {new Date(selectedSlot.endTime).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</div>
                        </div>
                        {error&&<div style={s.error}>{error}</div>}
                        <form onSubmit={handleBook}>
                            {!isLoggedIn&&(<>
                                <input style={s.input} placeholder="Votre nom complet *" required value={form.patientName} onChange={e=>setForm({...form,patientName:e.target.value})}/>
                                <input style={s.input} type="email" placeholder="Votre email *" required value={form.patientEmail} onChange={e=>setForm({...form,patientEmail:e.target.value})}/>
                                <input style={s.input} placeholder="Votre téléphone" value={form.patientPhone} onChange={e=>setForm({...form,patientPhone:e.target.value})}/>
                            </>)}
                            <textarea style={s.textarea} placeholder="Motif (optionnel)" value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} rows={3}/>
                            <div style={s.modalBtns}>
                                <button type="button" style={s.cancelBtn} onClick={()=>setSelectedSlot(null)}>Annuler</button>
                                <button type="submit" style={s.confirmBtn} disabled={loading}>{loading?"Réservation...":"✅ Confirmer"}</button>
                            </div>
                        </form>
                    </div></div>
                )}

                {success&&(
                    <div style={s.overlay}><div style={s.modal}>
                        <div style={{textAlign:"center",fontSize:"56px",marginBottom:"8px"}}>✅</div>
                        <h3 style={{...s.modalTitle,color:"#16a34a"}}>Rendez-vous confirmé !</h3>
                        <div style={s.recapBox}>
                            <div style={s.recapRow}>{selectedService?.icon} {selectedService?.name}</div>
                            {currentCat?.hasDoctor&&<div style={s.recapRow}>👨‍⚕️ {selectedDoctor?.fullName}</div>}
                            <div style={s.recapRow}>📅 {new Date(success.startTime).toLocaleDateString("fr-FR",{weekday:"long",day:"2-digit",month:"long"})}</div>
                            <div style={s.recapRow}>🕐 {new Date(success.startTime).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</div>
                        </div>
                        <p style={{color:"#666",fontSize:"13px",textAlign:"center",marginBottom:"16px"}}>Pour annuler, rendez-vous dans <strong>Mes RDV</strong>.</p>
                        <button style={{...s.confirmBtn,width:"100%"}} onClick={resetAll}>Fermer</button>
                        {isLoggedIn&&user?.role==="Patient"&&(
                            <button style={{...s.cancelBtn,width:"100%",marginTop:"8px"}} onClick={()=>{resetAll();navigate("/patient");}}>Voir mes rendez-vous</button>
                        )}
                    </div></div>
                )}

                {showWaiting&&(
                    <div style={s.overlay}><div style={s.modal}>
                        <h3 style={s.modalTitle}>📋 Liste d'attente</h3>
                        <p style={{color:"#555",fontSize:"14px",marginBottom:"12px"}}>Vous serez notifié(e) par email dès qu'un créneau se libère.</p>
                        <form onSubmit={handleWaiting}>
                            <input style={s.input} placeholder="Votre nom *" required value={waitingForm.patientName} onChange={e=>setWaitingForm({...waitingForm,patientName:e.target.value})}/>
                            <input style={s.input} type="email" placeholder="Votre email *" required value={waitingForm.email} onChange={e=>setWaitingForm({...waitingForm,email:e.target.value})}/>
                            <input style={s.input} placeholder="Téléphone" value={waitingForm.phone} onChange={e=>setWaitingForm({...waitingForm,phone:e.target.value})}/>
                            <input style={s.input} type="date" required value={waitingForm.weekStart} onChange={e=>setWaitingForm({...waitingForm,weekStart:e.target.value})}/>
                            <p style={{fontSize:"12px",color:"#888",marginTop:"-6px",marginBottom:"10px"}}>Sélectionnez le lundi de la semaine souhaitée</p>
                            <div style={s.modalBtns}>
                                <button type="button" style={s.cancelBtn} onClick={()=>setShowWaiting(false)}>Annuler</button>
                                <button type="submit" style={s.confirmBtn} disabled={loading}>S'inscrire</button>
                            </div>
                        </form>
                    </div></div>
                )}
            </div>
        </div>
    );
}

const s = {
    page:{minHeight:"100vh",background:"#f0f4f8"},
    topbar:{background:"white",padding:"12px 32px",display:"flex",justifyContent:"space-between",alignItems:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.08)",flexWrap:"wrap",gap:"8px"},
    logo:{fontSize:"20px",fontWeight:"700",color:"#1e3a5f"},
    actions:{display:"flex",gap:"12px",alignItems:"center"},
    welcome:{color:"#2563eb",fontWeight:"600"},
    linkBtn:{padding:"8px 16px",background:"transparent",border:"2px solid #2563eb",color:"#2563eb",borderRadius:"8px",cursor:"pointer",fontWeight:"600"},
    selectUser:{padding:"8px 12px",border:"2px solid #2563eb",borderRadius:"8px",color:"#2563eb",fontWeight:"600",cursor:"pointer",fontSize:"14px",background:"white"},
    content:{maxWidth:"1100px",margin:"0 auto",padding:"32px 16px"},
    stepper:{display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"40px"},
    stepItem:{display:"flex",flexDirection:"column",alignItems:"center",gap:"6px"},
    stepCircle:{width:"40px",height:"40px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"700",fontSize:"16px"},
    stepLabel:{fontSize:"13px",fontWeight:"600"},
    stepLine:{width:"80px",height:"3px",margin:"0 8px",marginBottom:"20px",borderRadius:"2px"},
    stepTitle:{color:"#1e3a5f",fontSize:"24px",marginBottom:"8px"},
    stepSub:{color:"#666",marginBottom:"24px",fontSize:"15px"},
    loading:{textAlign:"center",color:"#888",padding:"40px",fontSize:"16px"},
    backBtn:{padding:"8px 18px",background:"#f3f4f6",color:"#374151",border:"none",borderRadius:"8px",cursor:"pointer",fontWeight:"600",marginBottom:"20px",fontSize:"14px"},
    backBtn2:{padding:"10px 20px",background:"#2563eb",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontWeight:"600",marginTop:"12px"},
    categoryGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:"20px"},
    categoryCard:{background:"white",border:"2px solid",borderRadius:"16px",padding:"32px 20px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"10px",textAlign:"center"},
    catIcon:{fontSize:"44px"},catLabel:{fontWeight:"700",fontSize:"18px"},catDesc:{fontSize:"12px",color:"#888",lineHeight:"1.5"},catArrow:{fontSize:"13px",fontWeight:"600",marginTop:"4px"},
    serviceGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"16px"},
    serviceCard:{background:"white",border:"2px solid #e5e7eb",borderRadius:"16px",padding:"24px 16px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"10px",textAlign:"center"},
    serviceIcon:{fontSize:"40px"},serviceName:{fontWeight:"700",color:"#1e3a5f",fontSize:"15px"},serviceDesc:{fontSize:"12px",color:"#888",lineHeight:"1.5"},
    doctorGrid:{display:"flex",flexDirection:"column",gap:"12px",maxWidth:"600px"},
    doctorCard:{background:"white",border:"2px solid #e5e7eb",borderRadius:"14px",padding:"18px 20px",cursor:"pointer",display:"flex",alignItems:"center",gap:"16px",textAlign:"left"},
    doctorAvatar:{width:"52px",height:"52px",borderRadius:"50%",background:"linear-gradient(135deg,#2563eb,#1e40af)",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px",fontWeight:"700",flexShrink:0},
    doctorInfo:{display:"flex",flexDirection:"column",gap:"3px",flex:1},
    doctorName:{fontWeight:"700",color:"#1e3a5f",fontSize:"16px"},doctorService:{color:"#2563eb",fontSize:"13px",fontWeight:"600"},doctorEmail:{color:"#888",fontSize:"12px"},doctorArrow:{color:"#2563eb",fontSize:"20px",fontWeight:"700"},
    emptyDoc:{textAlign:"center",padding:"60px",color:"#888"},
    selectionSummary:{background:"white",borderRadius:"14px",padding:"16px 24px",marginBottom:"24px",display:"flex",alignItems:"center",gap:"16px",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",flexWrap:"wrap"},
    summaryItem:{display:"flex",alignItems:"center",gap:"12px"},summaryLabel:{fontSize:"11px",color:"#888",fontWeight:"600",textTransform:"uppercase"},summaryValue:{fontSize:"15px",color:"#1e3a5f",fontWeight:"700"},summaryDivider:{width:"1px",height:"36px",background:"#e5e7eb"},
    waitingBtn:{marginTop:"20px",padding:"12px 24px",background:"#f59e0b",color:"white",border:"none",borderRadius:"10px",cursor:"pointer",fontWeight:"600",fontSize:"15px"},
    overlay:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000},
    modal:{background:"white",padding:"32px",borderRadius:"16px",maxWidth:"480px",width:"90%",boxShadow:"0 8px 32px rgba(0,0,0,0.2)",maxHeight:"90vh",overflowY:"auto"},
    modalTitle:{color:"#1e3a5f",fontSize:"20px",marginBottom:"16px",textAlign:"center"},
    recapBox:{background:"#f0f9ff",border:"1px solid #bfdbfe",borderRadius:"10px",padding:"14px 18px",marginBottom:"16px"},
    recapRow:{color:"#1e40af",fontSize:"14px",padding:"4px 0",fontWeight:"500"},
    input:{width:"100%",padding:"11px",border:"1px solid #ddd",borderRadius:"8px",marginBottom:"10px",fontSize:"14px",boxSizing:"border-box"},
    textarea:{width:"100%",padding:"11px",border:"1px solid #ddd",borderRadius:"8px",marginBottom:"12px",fontSize:"14px",boxSizing:"border-box",resize:"vertical"},
    modalBtns:{display:"flex",gap:"12px",justifyContent:"flex-end"},
    cancelBtn:{padding:"10px 20px",background:"#f3f4f6",color:"#374151",border:"none",borderRadius:"8px",cursor:"pointer",fontWeight:"600"},
    confirmBtn:{padding:"10px 24px",background:"#16a34a",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontWeight:"600"},
    error:{background:"#fee2e2",color:"#dc2626",padding:"10px",borderRadius:"8px",marginBottom:"12px",fontSize:"13px"},
};