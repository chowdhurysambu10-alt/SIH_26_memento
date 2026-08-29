// Momento — Team SIH26043
// Backend: NestJS + Supabase
// Login endpoint: POST /api/v1/auth/login
// Token stored in localStorage as 'supabase_access_token'

import { useState, useEffect } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api/v1";

// Role display config — maps backend role strings to UI labels
const ROLE_CONFIG = {
  citizen:          { label: "Citizen / Public",      icon: "👥", color: "#5f5e5a", bg: "#f1efe8" },
  pri_ulb_official: { label: "Panchayat / ULB",       icon: "🏛️", color: "#0f6e56", bg: "#e1f5ee" },
  university_admin: { label: "University Admin",       icon: "🎓", color: "#1d6ed8", bg: "#e8f0fe" },
  faculty:          { label: "Faculty",                icon: "👨‍🏫", color: "#0369a1", bg: "#e0f2fe" },
  student:          { label: "Student",                icon: "📚", color: "#6d28d9", bg: "#ede9fe" },
  industry_partner: { label: "Industry Partner",       icon: "🏢", color: "#b45309", bg: "#fef3c7" },
  govt_viewer:      { label: "Govt. Authority",        icon: "🛡️", color: "#991b1b", bg: "#fee2e2" },
  super_admin:      { label: "Super Admin",            icon: "⚙️", color: "#374151", bg: "#f3f4f6" },
};

export default function MomentoLogin() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [user, setUser]         = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // On mount: check if user already logged in
  useEffect(() => {
    const token = localStorage.getItem("supabase_access_token");
    if (token) {
      fetch(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((res) => {
          if (res?.data) setUser(res.data);
          else localStorage.removeItem("supabase_access_token");
        })
        .catch(() => localStorage.removeItem("supabase_access_token"))
        .finally(() => setCheckingSession(false));
    } else {
      setCheckingSession(false);
    }
  }, []);

  function validate() {
    const e = {};
    if (!email.trim())   e.email    = "Email daalo.";
    if (!password)       e.password = "Password daalo.";
    return e;
  }

  async function handleLogin() {
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }

    setLoading(true);
    setErrors({});

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Backend error codes se sahi message dikhao
        if (res.status === 401 || data?.errorCode === "INVALID_CREDENTIALS") {
          setErrors({ auth: "Invalid email ya password. Dobara try karo." });
        } else {
          setErrors({ auth: data?.message || "Login failed. Backend se error aaya." });
        }
        return;
      }

      // Success — JWT token save karo
      const { session, user: userData } = data.data;
      localStorage.setItem("supabase_access_token",  session.access_token);
      localStorage.setItem("supabase_refresh_token", session.refresh_token);
      localStorage.setItem("supabase_expires_at",    String(session.expires_at));
      setUser(userData);

    } catch (err) {
      setErrors({ auth: "Backend se connect nahi ho pa raha. Server chal raha hai? (localhost:3000)" });
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("supabase_access_token");
    localStorage.removeItem("supabase_refresh_token");
    localStorage.removeItem("supabase_expires_at");
    setUser(null);
    setEmail("");
    setPassword("");
    setErrors({});
  }

  // ─── Loading state (session check) ────────────────────────
  if (checkingSession) {
    return (
      <div style={styles.page}>
        <div style={{ color: "#888", fontSize: 14 }}>⏳ Session check ho raha hai…</div>
      </div>
    );
  }

  // ─── Success / Dashboard Screen ───────────────────────────
  if (user) {
    const rc = ROLE_CONFIG[user.role] || ROLE_CONFIG.citizen;
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          {/* Header */}
          <div style={styles.cardHeader}>
            <div style={styles.logoRow}>
              <div style={styles.logoBox}>🌐</div>
              <div>
                <div style={styles.platformName}>Momento</div>
                <div style={styles.platformSub}>by Team Momento · SIH26043</div>
              </div>
            </div>
          </div>

          {/* User info */}
          <div style={{ ...styles.cardBody, textAlign: "center", paddingTop: 28 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: rc.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 14px", fontSize: 28 }}>
              {rc.icon}
            </div>

            <div style={{ fontSize: 19, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>
              Login successful!
            </div>
            <div style={{ fontSize: 14, color: "#555", marginBottom: 4 }}>
              Welcome, <span style={{ color: rc.color, fontWeight: 600 }}>{user.name}</span>
            </div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>{user.email}</div>

            {/* Role badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 14px", borderRadius: 20, background: rc.bg, color: rc.color,
                fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              {rc.icon} {rc.label}
            </div>

            {/* Verified status */}
            <div style={{ marginBottom: 20 }}>
              {user.verified ? (
                <span style={{ fontSize: 12, color: "#16a34a", background: "#dcfce7",
                    padding: "3px 10px", borderRadius: 12 }}>✅ Verified Account</span>
              ) : (
                <span style={{ fontSize: 12, color: "#d97706", background: "#fef3c7",
                    padding: "3px 10px", borderRadius: 12 }}>⏳ Pending Verification</span>
              )}
            </div>

            {/* User details */}
            <div style={styles.detailBox}>
              {user.district && (
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>📍 District</span>
                  <span style={styles.detailVal}>{user.district}</span>
                </div>
              )}
              {user.org_id && (
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>🏛️ Institution</span>
                  <span style={styles.detailVal}>{user.institutions?.name || user.org_id}</span>
                </div>
              )}
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>🔑 Role</span>
                <span style={{ ...styles.detailVal, fontFamily: "monospace", fontSize: 11 }}>{user.role}</span>
              </div>
            </div>

            <button onClick={handleLogout} style={styles.logoutBtn}>← Sign out</button>
          </div>
        </div>
        <div style={styles.demoNote}>Momento · Connected to NestJS + Supabase backend</div>
      </div>
    );
  }

  // ─── Login Screen ─────────────────────────────────────────
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.cardHeader}>
          <div style={styles.logoRow}>
            <div style={styles.logoBox}>🌐</div>
            <div>
              <div style={styles.platformName}>Momento</div>
              <div style={styles.platformSub}>by Team Momento · SIH26043</div>
            </div>
          </div>
        </div>

        <div style={styles.cardBody}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>
              Sign in to your account
            </div>
            <div style={{ fontSize: 13, color: "#666" }}>
              Societal Innovation Collaboration Portal — Jharkhand
            </div>
          </div>

          {/* Email */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: null, auth: null })); }}
              placeholder="you@example.com"
              style={{ ...styles.input, ...(errors.email ? styles.inputError : {}) }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            {errors.email && <div style={styles.errMsg}>{errors.email}</div>}
          </div>

          {/* Password */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: null, auth: null })); }}
                placeholder="Min. 6 characters"
                style={{ ...styles.input, paddingRight: 44, ...(errors.password || errors.auth ? styles.inputError : {}) }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <button onClick={() => setShowPass(!showPass)} style={styles.eyeBtn} aria-label="Toggle password">
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.password && <div style={styles.errMsg}>{errors.password}</div>}
          </div>

          {/* Auth / network error */}
          {errors.auth && (
            <div style={{ ...styles.errMsg, background: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: 8, padding: "10px 12px", marginBottom: 12, fontSize: 13 }}>
              ⚠️ {errors.auth}
            </div>
          )}

          {/* Login button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{ ...styles.loginBtn, opacity: loading ? 0.75 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          {/* Roles info */}
          <div style={{ marginTop: 20, padding: "12px 14px", background: "#f8f9fa",
              border: "1px solid #e2e8f0", borderRadius: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#555", marginBottom: 8 }}>
              Supported roles on this platform:
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {Object.entries(ROLE_CONFIG).map(([key, r]) => (
                <span key={key} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10,
                    background: r.bg, color: r.color, fontWeight: 500 }}>
                  {r.icon} {r.label}
                </span>
              ))}
            </div>
          </div>

          <div style={styles.demoNote}>
            🔒 Connected to <code style={{ fontSize: 10, background: "#f1f5f9", padding: "1px 5px", borderRadius: 4 }}>
              POST /api/v1/auth/login
            </code> · JWT stored in localStorage
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#f3f0ff",
    padding: "1.5rem 1rem",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
  },
  card: {
    background: "#ffffff",
    borderRadius: 16,
    boxShadow: "0 4px 24px rgba(109,40,217,.12), 0 1px 4px rgba(0,0,0,.06)",
    width: "100%",
    maxWidth: 440,
    overflow: "hidden",
  },
  cardHeader: {
    background: "linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)",
    padding: "20px 24px 16px",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
  },
  platformName: {
    fontSize: 17,
    fontWeight: 700,
    color: "#ffffff",
    letterSpacing: "-0.3px",
  },
  platformSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },
  cardBody: {
    padding: "22px 24px 24px",
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    color: "#374151",
    marginBottom: 5,
  },
  input: {
    width: "100%",
    padding: "9px 12px",
    border: "1px solid #d0d5dd",
    borderRadius: 8,
    fontSize: 14,
    color: "#111",
    background: "#fff",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    transition: "border-color 0.15s, box-shadow 0.15s",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  eyeBtn: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 16,
    padding: 2,
  },
  errMsg: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 4,
  },
  loginBtn: {
    width: "100%",
    padding: "11px",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    background: "linear-gradient(135deg, #6d28d9, #4f46e5)",
    transition: "opacity 0.15s",
    fontFamily: "inherit",
  },
  logoutBtn: {
    padding: "8px 22px",
    background: "none",
    border: "1px solid #d0d5dd",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    color: "#555",
    fontFamily: "inherit",
  },
  detailBox: {
    background: "#f8f9fa",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "12px 14px",
    marginBottom: 20,
    textAlign: "left",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "4px 0",
    borderBottom: "1px solid #f0f0f0",
  },
  detailLabel: {
    fontSize: 12,
    color: "#888",
  },
  detailVal: {
    fontSize: 13,
    fontWeight: 500,
    color: "#333",
  },
  demoNote: {
    fontSize: 11,
    color: "#888",
    textAlign: "center",
    marginTop: 14,
  },
};
