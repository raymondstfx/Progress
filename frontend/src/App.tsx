import { useEffect, useState } from "react";
import type { User } from "./types/api";
import { getStoredUser } from "./services/api";
import { currentPath, navigate } from "./services/navigation";
import { AppShell } from "./layout/AppShell";
import { AdminPage } from "./pages/AdminPage";
import { LibraryPage } from "./pages/LibraryPage";
import { LoginPage } from "./pages/LoginPage";

export default function App() {
  const [path, setPath] = useState(currentPath());
  const [user, setUser] = useState<User | null>(getStoredUser());

  useEffect(() => {
    const onPop = () => setPath(currentPath());
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (!user && path !== "/login") navigate("/login");
    if (user && path === "/login") navigate("/dashboard");
  }, [user, path]);

  if (!user) return <LoginPage onLogin={setUser} />;

  return (
    <AppShell user={user} onLogout={() => setUser(null)}>
      {path === "/library" ? (
        <LibraryPage />
      ) : path === "/admin" && user.role === "admin" ? (
        <AdminPage />
      ) : (
        <section className="card result-card stack">
          <h1 className="page-title">Dashboard</h1>
          <p className="lead">Dashboard shell is being prepared.</p>
        </section>
      )}
    </AppShell>
  );
}
