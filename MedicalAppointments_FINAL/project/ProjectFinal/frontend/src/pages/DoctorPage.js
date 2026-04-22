import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "../components/Calendar";
import { getAllAppointments, createSlot, getSlots, blockSlot, unblockSlot } from "../services/api";
import { useAuth } from "../context/AuthContext";

const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

// ✅ FIX Bug 5 : helper pour calculer le lundi de la semaine d'une date donnée
function getMondayOf(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,"0");
    const dd = String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${dd}`;
}

function groupByYearMonthDay(appointments) {
    const grouped = {};
    appointments.forEach(appt => {
        const d = new Date(appt.startTime);
        const year = d.getFullYear();
        const month = d.getMonth();
        const day = d.toLocaleDateString("fr-FR",{weekday:"long",day:"2-digit",month:"long"});
        if (!grouped[year]) grouped[year]={};
        if (!grouped[year][month]) grouped[year][month]={};
        if (!grouped[year][month][day]) grouped[year][month][day]=[];
        grouped[year][month][day].push(appt);
    });
    return grouped;
}

export default function DoctorPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [tab, setTab] = useState("calendar");
    const [newSlot, setNewSlot] = useState({ startTime:"", endTime:"" });
    const [slotMsg, setSlotMsg] = useState("");
    const [slotError, setSlotError] = useState("");
    const [blockDate, setBlockDate] = useState("");
    const [blockSlots, setBlockSlots] = useState([]);
    const [blockLoading, setBlockLoading] = useState(false);
    const [blockMsg, setBlockMsg] = useState("");
    const [openYears, setOpenYears] = useState({});
    const [openMonths, setOpenMonths] = useState({});
    const [openDays, setOpenDays] = useState({});

    useEffect(() => {
        if (tab==="appointments") {
            getAllAppointments().then(res=>{
                setAppointments(res.data);
                const y=new Date().getFullYear();
                setOpenYears({[y]:true});
                setOpenMonths({[`${y}-${new Date().getMonth()}`]:true});
            }).catch(()=>{});
        }
    }, [tab]);

    // ✅ FIX Bug 5 : on calcule le lundi de la semaine de blockDate,
    // puis on filtre côté client pour ne garder que le jour exact demandé
    const handleLoadDaySlots = async () => {
        if (!blockDate) return;
        setBlockLoading(true); setBlockMsg("");
        try {
            const weekStart = getMondayOf(blockDate);
            const res = await getSlots(user?.id, weekStart);
            // Filtrer uniquement les créneaux du jour choisi
            const daySlots = res.data.filter(s => {
                const d = new Date(s.startTime);
                const y = d.getFullYear();
                const m = String(d.getMonth()+1).padStart(2,"0");
                const dd = String(d.getDate()).padStart(2,"0");
                return `${y}-${m}-${dd}` === blockDate;
            });
            setBlockSlots(daySlots);
        } catch { setBlockMsg("❌ Erreur lors du chargement des créneaux."); }
        finally { setBlockLoading(false); }
    };

    const handleBlockDay = async () => {
        if (!window.confirm(`Bloquer tous les créneaux du ${blockDate} ?`)) return;
        setBlockMsg("");
        const available = blockSlots.filter(s=>s.status==="Available");
        let success=0;
        for (const slot of available) { try { await blockSlot(slot.id); success++; } catch {} }
        setBlockMsg(`✅ ${success} créneau(x) bloqué(s) sur ${available.length}.`);
        handleLoadDaySlots();
    };

    const handleUnblockDay = async () => {
        if (!window.confirm(`Débloquer tous les créneaux du ${blockDate} ?`)) return;
        setBlockMsg("");
        const blocked = blockSlots.filter(s=>s.status==="Blocked");
        let success=0;
        for (const slot of blocked) { try { await unblockSlot(slot.id); success++; } catch {} }
        setBlockMsg(`✅ ${success} créneau(x) débloqué(s).`);
        handleLoadDaySlots();
    };

    const handleToggleSlot = async (slot) => {
        try {
            if (slot.status==="Blocked") await unblockSlot(slot.id);
            else if (slot.status==="Available") await blockSlot(slot.id);
            handleLoadDaySlots();
        } catch (err) { setBlockMsg("❌ "+(err.response?.data?.message||"Erreur")); }
    };

    const handleCreateSlot = async (e) => {
        e.preventDefault(); setSlotMsg(""); setSlotError("");
        try { await createSlot(newSlot); setSlotMsg("✅ Créneau créé avec succès !"); setNewSlot({startTime:"",endTime:""}); }
        catch (err) { setSlotError(err.response?.data?.message||"Erreur"); }
    };

    const getStatusStyle = (status) => {
        if (status==="Available") return {bg:"#dcfce7",color:"#16a34a",label:"Disponible"};
        if (status==="Blocked")   return {bg:"#f3f4f6",color:"#6b7280",label:"Bloqué"};
        if (status==="Reserved")  return {bg:"#fee2e2",color:"#dc2626",label:"Réservé"};
        return {bg:"#fef9c3",color:"#ca8a04",label:status};
    };

    const grouped = groupByYearMonthDay(appointments);
    const years = Object.keys(grouped).sort((a,b)=>b-a);

    return (
        <div style={styles.page}>
            <div style={styles.topbar}>
                <span style={styles.logo}>🏥 Espace Médecin</span>
                <div style={styles.actions}>
                    <span style={styles.name}>👨‍⚕️ {user?.fullName}</span>
                    <button style={styles.logoutBtn} onClick={()=>{logout();navigate("/book");}}>Déconnexion</button>
                </div>
            </div>
            <div style={styles.content}>
                <div style={styles.tabs}>
                    {[["calendar","📅 Calendrier"],["block","🔒 Bloquer créneaux"],["create","➕ Créer créneau"],["appointments","📋 Rendez-vous"]].map(([key,label])=>(
                        <button key={key} style={{...styles.tab,...(tab===key?styles.tabActive:{})}} onClick={()=>setTab(key)}>{label}</button>
                    ))}
                </div>

                {tab==="calendar"&&(<div><h2 style={styles.title}>Calendrier des créneaux</h2><Calendar doctorId={user?.id||1} role="Doctor"/></div>)}

                {tab==="block"&&(
                    <div>
                        <h2 style={styles.title}>🔒 Bloquer / Débloquer des créneaux</h2>
                        <p style={{color:"#666",marginBottom:"20px"}}>Choisissez une date pour voir vos créneaux et les bloquer individuellement ou en masse.</p>
                        <div style={styles.blockCard}>
                            <div style={{display:"flex",gap:"12px",alignItems:"flex-end",flexWrap:"wrap"}}>
                                <div>
                                    <label style={styles.label}>Choisissez une date</label>
                                    <input style={styles.input} type="date" value={blockDate} onChange={e=>{setBlockDate(e.target.value);setBlockSlots([]);setBlockMsg("");}}/>
                                </div>
                                <button style={styles.loadBtn} onClick={handleLoadDaySlots} disabled={!blockDate}>🔍 Charger les créneaux</button>
                            </div>
                            {blockMsg&&<div style={{...styles.msgBox,background:blockMsg.startsWith("✅")?"#dcfce7":"#fee2e2",color:blockMsg.startsWith("✅")?"#16a34a":"#dc2626"}}>{blockMsg}</div>}
                            {blockLoading&&<p style={{color:"#888",marginTop:"16px"}}>Chargement...</p>}
                            {blockSlots.length>0&&(
                                <>
                                    <div style={{display:"flex",gap:"12px",marginTop:"20px",flexWrap:"wrap"}}>
                                        <button style={styles.blockDayBtn} onClick={handleBlockDay}>🔒 Bloquer toute la journée</button>
                                        <button style={styles.unblockDayBtn} onClick={handleUnblockDay}>🔓 Débloquer toute la journée</button>
                                    </div>
                                    <div style={styles.slotGrid}>
                                        {blockSlots.map(slot=>{
                                            const st=getStatusStyle(slot.status);
                                            const isReserved=slot.status==="Reserved";
                                            return (
                                                <div key={slot.id} style={{...styles.slotItem,background:st.bg,border:`2px solid ${st.color}`}}>
                                                    <div style={{fontWeight:"700",color:st.color,fontSize:"14px"}}>{new Date(slot.startTime).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})} – {new Date(slot.endTime).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</div>
                                                    <div style={{fontSize:"12px",color:st.color,marginBottom:"8px"}}>{st.label}</div>
                                                    {/* ✅ FIX Bug 3 : afficher le nom du patient sur les créneaux réservés */}
                                                    {isReserved && slot.patientName && (
                                                        <div style={{fontSize:"11px",color:"#dc2626",marginBottom:"4px"}}>👤 {slot.patientName}</div>
                                                    )}
                                                    {!isReserved&&<button style={{padding:"5px 12px",background:slot.status==="Blocked"?"#16a34a":"#dc2626",color:"white",border:"none",borderRadius:"6px",cursor:"pointer",fontSize:"12px",fontWeight:"600"}} onClick={()=>handleToggleSlot(slot)}>{slot.status==="Blocked"?"🔓 Débloquer":"🔒 Bloquer"}</button>}
                                                    {isReserved&&<span style={{fontSize:"11px",color:"#dc2626",fontWeight:"600"}}>⛔ RDV confirmé</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                            {blockSlots.length===0&&blockDate&&!blockLoading&&(
                                <div style={{textAlign:"center",padding:"40px",color:"#888"}}><p style={{fontSize:"32px"}}>📭</p><p>Aucun créneau trouvé pour cette date.</p></div>
                            )}
                        </div>
                    </div>
                )}

                {tab==="create"&&(
                    <div style={styles.formCard}>
                        <h2 style={styles.title}>Créer un nouveau créneau</h2>
                        {slotMsg&&<div style={styles.success}>{slotMsg}</div>}
                        {slotError&&<div style={styles.error}>{slotError}</div>}
                        <form onSubmit={handleCreateSlot}>
                            <div style={styles.row}>
                                <div style={styles.field}><label style={styles.label}>Date et heure de début</label><input style={styles.input} type="datetime-local" required value={newSlot.startTime} onChange={e=>setNewSlot({...newSlot,startTime:e.target.value})}/></div>
                                <div style={styles.field}><label style={styles.label}>Date et heure de fin</label><input style={styles.input} type="datetime-local" required value={newSlot.endTime} onChange={e=>setNewSlot({...newSlot,endTime:e.target.value})}/></div>
                            </div>
                            <button style={styles.createBtn} type="submit">Créer le créneau</button>
                        </form>
                    </div>
                )}

                {tab==="appointments"&&(
                    <div>
                        <h2 style={styles.title}>📋 Tous les rendez-vous</h2>
                        {appointments.length===0&&<p style={styles.empty}>Aucun rendez-vous trouvé.</p>}
                        {years.map(year=>(
                            <div key={year} style={styles.yearBlock}>
                                <button style={styles.yearHeader} onClick={()=>setOpenYears(prev=>({...prev,[year]:!prev[year]}))}>
                                    <span style={styles.yearIcon}>{openYears[year]?"▼":"▶"}</span>
                                    <span>📆 {year}</span>
                                    <span style={styles.yearCount}>{Object.values(grouped[year]).reduce((acc,m)=>acc+Object.values(m).reduce((a,d)=>a+d.length,0),0)} RDV</span>
                                </button>
                                {openYears[year]&&Object.keys(grouped[year]).sort((a,b)=>b-a).map(monthIdx=>{
                                    const monthKey=`${year}-${monthIdx}`;
                                    const monthAppts=Object.values(grouped[year][monthIdx]).reduce((a,d)=>a+d.length,0);
                                    return (
                                        <div key={monthIdx} style={styles.monthBlock}>
                                            <button style={styles.monthHeader} onClick={()=>setOpenMonths(prev=>({...prev,[monthKey]:!prev[monthKey]}))}>
                                                <span style={styles.monthIcon}>{openMonths[monthKey]?"▼":"▶"}</span>
                                                <span>🗓 {MONTHS_FR[parseInt(monthIdx)]}</span>
                                                <span style={styles.monthCount}>{monthAppts} RDV</span>
                                            </button>
                                            {openMonths[monthKey]&&Object.keys(grouped[year][monthIdx]).sort().map(day=>{
                                                const dayKey=`${year}-${monthIdx}-${day}`;
                                                const dayAppts=grouped[year][monthIdx][day];
                                                return (
                                                    <div key={day} style={styles.dayBlock}>
                                                        <button style={styles.dayHeader} onClick={()=>setOpenDays(prev=>({...prev,[dayKey]:!prev[dayKey]}))}>
                                                            <span>{openDays[dayKey]?"▼":"▶"}</span>
                                                            <span>📅 {day}</span>
                                                            <span style={styles.dayCount}>{dayAppts.length} RDV</span>
                                                        </button>
                                                        {openDays[dayKey]&&(
                                                            <div style={styles.apptList}>
                                                                {dayAppts.map(appt=>(
                                                                    <div key={appt.id} style={styles.apptRow}>
                                                                        <div style={styles.apptTime}>🕐 {new Date(appt.startTime).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})} – {new Date(appt.endTime).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</div>
                                                                        <div style={styles.apptPatient}><strong>{appt.patientName}</strong><span style={styles.email}> — {appt.patientEmail}</span></div>
                                                                        {/* ✅ FIX Bug 2 : afficher le motif */}
                                                                        {appt.reason&&<div style={{fontSize:"12px",color:"#888",fontStyle:"italic"}}>📝 {appt.reason}</div>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    page:{minHeight:"100vh",background:"#f0f4f8"},
    topbar:{background:"white",padding:"12px 32px",display:"flex",justifyContent:"space-between",alignItems:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.08)"},
    logo:{fontSize:"20px",fontWeight:"700",color:"#1e3a5f"},
    actions:{display:"flex",gap:"12px",alignItems:"center"},
    name:{color:"#555"},
    logoutBtn:{padding:"8px 16px",background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:"8px",cursor:"pointer",fontWeight:"600"},
    content:{maxWidth:"1100px",margin:"0 auto",padding:"32px 16px"},
    tabs:{display:"flex",gap:"8px",marginBottom:"24px",flexWrap:"wrap"},
    tab:{padding:"10px 24px",background:"white",border:"2px solid #ddd",borderRadius:"10px",cursor:"pointer",fontWeight:"600",fontSize:"15px"},
    tabActive:{background:"#2563eb",color:"white",borderColor:"#2563eb"},
    title:{color:"#1e3a5f",fontSize:"22px",marginBottom:"20px"},
    formCard:{background:"white",borderRadius:"16px",padding:"28px",maxWidth:"600px",boxShadow:"0 2px 12px rgba(0,0,0,0.08)"},
    blockCard:{background:"white",borderRadius:"16px",padding:"28px",boxShadow:"0 2px 12px rgba(0,0,0,0.08)"},
    row:{display:"flex",gap:"16px",flexWrap:"wrap"},
    field:{flex:1,minWidth:"200px"},
    label:{display:"block",marginBottom:"6px",fontSize:"14px",fontWeight:"600",color:"#555"},
    input:{padding:"11px",border:"1px solid #ddd",borderRadius:"8px",fontSize:"14px"},
    loadBtn:{padding:"11px 20px",background:"#2563eb",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontWeight:"600",fontSize:"14px"},
    blockDayBtn:{padding:"10px 20px",background:"#dc2626",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontWeight:"600",fontSize:"14px"},
    unblockDayBtn:{padding:"10px 20px",background:"#16a34a",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontWeight:"600",fontSize:"14px"},
    slotGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"12px",marginTop:"20px"},
    slotItem:{borderRadius:"12px",padding:"14px",textAlign:"center"},
    msgBox:{padding:"12px",borderRadius:"8px",marginTop:"16px",fontWeight:"600"},
    createBtn:{padding:"12px 28px",background:"#16a34a",color:"white",border:"none",borderRadius:"10px",cursor:"pointer",fontWeight:"600",fontSize:"15px",marginTop:"16px"},
    success:{background:"#dcfce7",color:"#16a34a",padding:"12px",borderRadius:"8px",marginBottom:"16px"},
    error:{background:"#fee2e2",color:"#dc2626",padding:"12px",borderRadius:"8px",marginBottom:"16px"},
    empty:{color:"#888",textAlign:"center",padding:"40px"},
    yearBlock:{marginBottom:"12px"},
    yearHeader:{width:"100%",display:"flex",alignItems:"center",gap:"12px",padding:"14px 20px",background:"#1e3a5f",color:"white",border:"none",borderRadius:"10px",cursor:"pointer",fontWeight:"700",fontSize:"16px",textAlign:"left"},
    yearIcon:{fontSize:"12px"},
    yearCount:{marginLeft:"auto",background:"rgba(255,255,255,0.2)",padding:"2px 10px",borderRadius:"20px",fontSize:"13px"},
    monthBlock:{marginLeft:"20px",marginTop:"6px"},
    monthHeader:{width:"100%",display:"flex",alignItems:"center",gap:"10px",padding:"12px 18px",background:"#2563eb",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontWeight:"600",fontSize:"15px",textAlign:"left"},
    monthIcon:{fontSize:"11px"},
    monthCount:{marginLeft:"auto",background:"rgba(255,255,255,0.2)",padding:"2px 10px",borderRadius:"20px",fontSize:"12px"},
    dayBlock:{marginLeft:"20px",marginTop:"4px"},
    dayHeader:{width:"100%",display:"flex",alignItems:"center",gap:"10px",padding:"10px 16px",background:"#e0f2fe",color:"#0369a1",border:"none",borderRadius:"8px",cursor:"pointer",fontWeight:"600",fontSize:"14px",textAlign:"left"},
    dayCount:{marginLeft:"auto",background:"#bae6fd",padding:"2px 8px",borderRadius:"20px",fontSize:"12px"},
    apptList:{marginLeft:"20px",marginTop:"4px",display:"grid",gap:"6px"},
    apptRow:{background:"white",borderRadius:"8px",padding:"12px 16px",display:"flex",alignItems:"center",gap:"12px",flexWrap:"wrap",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"},
    apptTime:{color:"#2563eb",fontWeight:"700",fontSize:"14px",minWidth:"130px"},
    apptPatient:{flex:1},
    email:{color:"#888",fontSize:"13px"},
}; 