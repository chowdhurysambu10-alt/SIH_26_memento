<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Momento — National Collaboration Portal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body style="margin: 0; padding: 0; background: #f3f0ff; font-family: 'Inter', sans-serif;">
  <div id="root"></div>

  <script type="text/babel">
    const { useState, useEffect } = React;
    const API_BASE_URL = "http://localhost:3000/api/v1";

    const ROLES = [
      { id: "student", label: "Student", icon: "🎓" },
      { id: "institution", label: "Institution", icon: "🏛️" },
      { id: "admin", label: "Admin", icon: "🛡️" },
      { id: "citizen", label: "Public", icon: "👥" }
    ];

    function App() {
      const [isSignUp, setIsSignUp] = useState(false);
      const [activeRole, setActiveRole] = useState(ROLES[0]);
      
      const [name, setName] = useState("");
      const [orgName, setOrgName] = useState(""); 
      const [email, setEmail] = useState("");
      const [password, setPassword] = useState("");
      const [confirmPassword, setConfirmPassword] = useState("");
      const [showPass, setShowPass] = useState(false);
      
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState("");
      const [user, setUser] = useState(null);

      useEffect(() => {
        const token = localStorage.getItem("supabase_access_token");
        const savedUser = localStorage.getItem("user_data");
        if (token && savedUser) {
          try { setUser(JSON.parse(savedUser)); } catch (e) {}
        }
      }, []);

      const resetForm = () => {
        setError("");
        setPassword("");
        setConfirmPassword("");
      };

      const handleAuth = async (e) => {
        e?.preventDefault();
        setError("");

        if (!email.trim() || !password) {
          return setError("All credentials are required.");
        }

        if (isSignUp) {
          if (!name.trim()) return setError("Full Name is required.");
          if (activeRole.id !== "citizen" && !orgName.trim()) {
            return setError("Institution/Organization Name is required for this role.");
          }
          if (password.length < 6) return setError("Password must be at least 6 characters.");
          if (password !== confirmPassword) return setError("Passwords do not match!");
        }

        setLoading(true);

        try {
          const endpoint = isSignUp ? `${API_BASE_URL}/auth/signup` : `${API_BASE_URL}/auth/login`;
          const payload = isSignUp 
            ? { 
                email: email.trim(), 
                password, 
                name: name.trim(), 
                role: activeRole.id,
                organization: orgName.trim()
              }
            : { email: email.trim(), password };

          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          const data = await res.json();

          if (!res.ok) {
            setError(data?.message || (isSignUp ? "Registration failed. Email might exist." : "Invalid credentials."));
            return;
          }

          const session = data?.data?.session;
          const userData = data?.data?.user;

          if (session?.access_token) {
            localStorage.setItem("supabase_access_token", session.access_token);
            localStorage.setItem("supabase_refresh_token", session.refresh_token || "");
          }
          if (userData) {
            localStorage.setItem("user_data", JSON.stringify(userData));
            setUser(userData);
          }
        } catch (err) {
          setError("Backend unreachable. Ensure NestJS is running on localhost:3000.");
        } finally {
          setLoading(false);
        }
      };

      const handleLogout = () => {
        localStorage.clear();
        setUser(null);
        setName("");
        setOrgName("");
        setEmail("");
        resetForm();
      };

      if (user) {
        return (
          <div style={styles.container}>
            <div style={styles.card}>
              <div style={styles.header}>
                <div style={styles.logoBox}>🌐</div>
                <div>
                  <div style={styles.title}>Momento</div>
                  <div style={styles.sub}>by Team Momento · SIH26043</div>
                </div>
              </div>
              <div style={{ padding: "30px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🎉</div>
                <h3 style={{ margin: "0 0 8px" }}>Welcome, {user.name || "User"}!</h3>
                <p style={{ color: "#666", fontSize: 13, margin: "0 0 16px" }}>{user.email}</p>
                <div style={styles.badge}>Role: {user.role || activeRole.label}</div>
                <div style={{ marginTop: 24 }}>
                  <button onClick={handleLogout} style={styles.logoutBtn}>← Sign out</button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div style={styles.container}>
          <div style={styles.card}>
            {/* Header */}
            <div style={styles.header}>
              <div style={styles.logoBox}>🌐</div>
              <div>
                <div style={styles.title}>Momento</div>
                <div style={styles.sub}>by Team Momento · SIH26043</div>
              </div>
            </div>

            <div style={{ padding: "24px 28px" }}>
              {/* Login / Signup Toggle */}
              <div style={styles.toggleContainer}>
                <button
                  type="button"
                  onClick={() => { setIsSignUp(false); resetForm(); }}
                  style={{ ...styles.toggleBtn, background: !isSignUp ? "#fff" : "transparent", boxShadow: !isSignUp ? "0 2px 4px rgba(0,0,0,0.1)" : "none", color: !isSignUp ? "#111" : "#666" }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); resetForm(); }}
                  style={{ ...styles.toggleBtn, background: isSignUp ? "#fff" : "transparent", boxShadow: isSignUp ? "0 2px 4px rgba(0,0,0,0.1)" : "none", color: isSignUp ? "#111" : "#666" }}
                >
                  Register
                </button>
              </div>

              {/* Role Tabs */}
              <div style={styles.roleGrid}>
                {ROLES.map((r) => {
                  const isActive = activeRole.id === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => { setActiveRole(r); setError(""); }}
                      style={{
                        ...styles.roleBtn,
                        background: isActive ? "#1a1a1a" : "transparent",
                        color: isActive ? "#ffffff" : "#a1a1aa",
                        opacity: isActive ? 1 : 0.45
                      }}
                    >
                      <div style={{ fontSize: 24 }}>{r.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{r.label}</div>
                    </button>
                  );
                })}
              </div>

              {/* Form */}
              <form onSubmit={handleAuth}>
                {isSignUp && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={styles.label}>Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter legal name"
                      style={styles.darkInput}
                      required
                    />
                  </div>
                )}

                {isSignUp && activeRole.id !== "citizen" && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={styles.label}>Institution / Organization Name</label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="e.g. NIT Durgapur / Tata Steel"
                      style={styles.darkInput}
                      required
                    />
                  </div>
                )}

                <div style={{ marginBottom: 14 }}>
                  <label style={styles.label}>Email / User ID</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    style={styles.darkInput}
                    required
                  />
                </div>

                <div style={{ marginBottom: isSignUp ? 14 : 20 }}>
                  <label style={styles.label}>Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      style={{ ...styles.darkInput, paddingRight: 45 }}
                      required
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                      {showPass ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                {isSignUp && (
                  <div style={{ marginBottom: 20 }}>
                    <label style={styles.label}>Confirm Password</label>
                    <input
                      type={showPass ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      style={styles.darkInput}
                      required
                    />
                  </div>
                )}

                {error && <div style={styles.errorBanner}>⚠️ {error}</div>}

                <button type="submit" disabled={loading} style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Processing..." : isSignUp ? `Register as ${activeRole.label}` : `Sign in as ${activeRole.label}`}
                </button>
              </form>
              
              <div style={styles.footerNote}>
                🔒 SHA-256 hashed · Connected to NestJS Backend
              </div>
            </div>
          </div>
        </div>
      );
    }

    const styles = {
      container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" },
      card: { width: "100%", maxWidth: 460, background: "#ffffff", borderRadius: 20, overflow: "hidden", boxShadow: "0 10px 30px rgba(91, 54, 245, 0.12)" },
      header: { background: "#5b36f5", padding: "20px 24px", display: "flex", alignItems: "center", gap: 14 },
      logoBox: { width: 44, height: 44, background: "rgba(255,255,255,0.2)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 },
      title: { fontSize: 20, fontWeight: 700, color: "#fff" },
      sub: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 },
      toggleContainer: { display: "flex", background: "#f3f4f6", padding: 4, borderRadius: 10, marginBottom: 20 },
      toggleBtn: { flex: 1, padding: "8px 0", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "0.2s" },
      roleGrid: { display: "flex", justifyContent: "space-between", marginBottom: 24, padding: "0 10px" },
      roleBtn: { flex: 1, border: "none", borderRadius: 12, padding: "12px 0", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", transition: "0.2s" },
      label: { display: "block", fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 6 },
      darkInput: { width: "100%", padding: "12px 14px", background: "#1e1e1e", color: "#f1f1f1", border: "none", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" },
      eyeBtn: { position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "#2a2a2a", border: "none", borderRadius: 6, cursor: "pointer", padding: "4px 8px" },
      submitBtn: { width: "100%", padding: "12px", background: "#f3f4f6", border: "none", color: "#333", fontSize: 15, fontWeight: 600, cursor: "pointer", borderRadius: 8, transition: "0.2s" },
      badge: { display: "inline-block", padding: "6px 16px", borderRadius: 20, background: "#ede9fe", color: "#5b36f5", fontWeight: 600, fontSize: 13 },
      logoutBtn: { padding: "8px 20px", border: "1px solid #ddd", background: "#fff", borderRadius: 8, cursor: "pointer" },
      errorBanner: { background: "#fee2e2", color: "#b91c1c", padding: "10px", borderRadius: 8, fontSize: 13, marginBottom: 14 },
      footerNote: { textAlign: "center", fontSize: 11, color: "#888", marginTop: 20 }
    };

    ReactDOM.createRoot(document.getElementById("root")).render(<App />);
  </script>
</body>
</html>
