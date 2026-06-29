import { FormEvent, useState } from "react";
import type { User } from "../types/api";
import { api, setSession } from "../services/api";
import { navigate } from "../services/navigation";
import { Badge, Button, Field, MaterialIcon, TextInput } from "../components/ui";

export function LoginPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api.login({ username, password });
      setSession(data.token, data.user);
      onLogin(data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-grid">
        <div>
          <Badge tone="gold">PolicyAI RAG MVP</Badge>
          <h1 className="page-title" style={{ marginTop: 28 }}>PPI Policy in Action Library</h1>
          <p className="lead">A role-based policy evidence platform for repository search, document ingestion, semantic retrieval, and cited AI synthesis.</p>
        </div>
        <form onSubmit={submit} className="card login-form">
          <div className="brand-wrap" style={{ marginBottom: 22 }}>
            <MaterialIcon name="policy" style={{ color: "var(--primary)" }} />
            <div>
              <h2 style={{ margin: 0 }}>Sign in</h2>
              <p className="muted-small" style={{ margin: 0 }}>Demo accounts: admin/admin123 or user/user123</p>
            </div>
          </div>
          <div className="stack">
            <Field label="Username"><TextInput value={username} onChange={(event) => setUsername(event.target.value)} /></Field>
            <Field label="Password"><TextInput type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></Field>
            {error && <div className="notice" style={{ borderColor: "var(--danger)", background: "#ffecec", color: "var(--danger)" }}>{error}</div>}
            <Button disabled={busy}>{busy ? "Signing in..." : "Login"}</Button>
          </div>
        </form>
      </section>
    </main>
  );
}
