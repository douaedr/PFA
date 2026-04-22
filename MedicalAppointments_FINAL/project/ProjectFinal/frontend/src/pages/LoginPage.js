import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await login(form);
      loginUser(res.data.token, { fullName: res.data.fullName, role: res.data.role });
      if (res.data.role === "Doctor") navigate("/doctor");
      else if (res.data.role === "Secretary") navigate("/secretary");
      else navigate("/patient");
    } catch (err) {
      setError(err.response?.data?.message || "Identifiants invalides");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>🏥</div>
        <h2 style={styles.title}>Connexion</h2>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="email@exemple.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Mot de passe</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
        <p style={styles.link}>
          Pas de compte ? <Link to="/register">S'inscrire</Link>
        </p>
        <p style={styles.link}>
          <Link to="/book">Prendre RDV sans compte →</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f0f4f8" },
  card: { background:"white", padding:"40px", borderRadius:"16px", boxShadow:"0 4px 24px rgba(0,0,0,0.1)", width:"100%", maxWidth:"400px" },
  logo: { textAlign:"center", fontSize:"48px", marginBottom:"8px" },
  title: { textAlign:"center", color:"#1e3a5f", marginBottom:"24px", fontSize:"24px" },
  field: { marginBottom:"16px" },
  label: { display:"block", marginBottom:"6px", color:"#555", fontSize:"14px", fontWeight:"600" },
  input: { width:"100%", padding:"12px", border:"1px solid #ddd", borderRadius:"8px", fontSize:"15px", boxSizing:"border-box" },
  btn: { width:"100%", padding:"13px", background:"#2563eb", color:"white", border:"none", borderRadius:"8px", fontSize:"16px", fontWeight:"600", cursor:"pointer", marginTop:"8px" },
  error: { background:"#fee2e2", color:"#dc2626", padding:"12px", borderRadius:"8px", marginBottom:"16px", fontSize:"14px" },
  link: { textAlign:"center", marginTop:"16px", fontSize:"14px", color:"#555" },
};
