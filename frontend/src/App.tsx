import { useEffect, useState } from "react";
import type { User } from "./types/api";
import { getStoredUser } from "./services/api";
import { currentPath, navigate } from "./services/navigation";
import { AppShell } from "./layout/AppShell";
import { AdminPage } from "./pages/AdminPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LibraryPage } from "./pages/LibraryPage";
import { LoginPage } from "./pages/LoginPage";
import { ResourceDetailPage } from "./pages/ResourceDetailPage";

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
      ) : path.startsWith("/resources/") ? (
        <ResourceDetailPage user={user} resourceId={decodeURIComponent(path.replace("/resources/", ""))} />
      ) : (
        <DashboardPage user={user} />
      )}
    </AppShell>
  );
}
