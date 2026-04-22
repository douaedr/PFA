import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const [form, setForm] = useState({ fullName:"", email:"", password:"", phone:"" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await register(form);
      loginUser(res.data.token, { fullName: res.data.fullName, role: res.data.role });
      navigate("/patient");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>🏥</div>
        <h2 style={styles.title}>Créer un compte</h2>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          {[
            { key:"fullName", label:"Nom complet", type:"text", placeholder:"Jean Dupont" },
            { key:"email", label:"Email", type:"email", placeholder:"email@exemple.com" },
            { key:"phone", label:"Téléphone", type:"tel", placeholder:"0612345678" },
            { key:"password", label:"Mot de passe", type:"password", placeholder:"••••••••" },
          ].map(f => (
            <div style={styles.field} key={f.key}>
              <label style={styles.label}>{f.label}</label>
              <input style={styles.input} type={f.type} placeholder={f.placeholder}
                value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})}
                required={f.key !== "phone"} />
            </div>
          ))}
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? "Inscription..." : "S'inscrire"}
          </button>
        </form>
        <p style={styles.link}>Déjà un compte ? <Link to="/login">Se connecter</Link></p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f0f4f8" },
  card: { background:"white", padding:"40px", borderRadius:"16px", boxShadow:"0 4px 24px rgba(0,0,0,0.1)", width:"100%", maxWidth:"420px" },
  logo: { textAlign:"center", fontSize:"48px", marginBottom:"8px" },
  title: { textAlign:"center", color:"#1e3a5f", marginBottom:"24px", fontSize:"24px" },
  field: { marginBottom:"14px" },
  label: { display:"block", marginBottom:"5px", color:"#555", fontSize:"14px", fontWeight:"600" },
  input: { width:"100%", padding:"11px", border:"1px solid #ddd", borderRadius:"8px", fontSize:"14px", boxSizing:"border-box" },
  btn: { width:"100%", padding:"13px", background:"#2563eb", color:"white", border:"none", borderRadius:"8px", fontSize:"16px", fontWeight:"600", cursor:"pointer", marginTop:"8px" },
  error: { background:"#fee2e2", color:"#dc2626", padding:"12px", borderRadius:"8px", marginBottom:"16px", fontSize:"14px" },
  link: { textAlign:"center", marginTop:"16px", fontSize:"14px", color:"#555" },
};
