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
  const [visitedPages, setVisitedPages] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const onPop = () => setPath(currentPath());
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (!user && path !== "/login") navigate("/login");
    if (user && path === "/login") navigate("/dashboard");
  }, [user, path]);

  useEffect(() => {
    if (!user) return;
    if (!["/dashboard", "/library", "/admin"].includes(path)) return;
    setVisitedPages((current) => {
      if (current.has(path)) return current;
      const next = new Set(current);
      next.add(path);
      return next;
    });
  }, [user, path]);

  if (!user) return <LoginPage onLogin={setUser} />;

  const showResourceDetail = path.startsWith("/resources/");
  const showDashboard = !showResourceDetail && path !== "/library" && !(path === "/admin" && user.role === "admin");
  const shouldMountDashboard = showDashboard || visitedPages.has("/dashboard");
  const shouldMountLibrary = path === "/library" || visitedPages.has("/library");
  const shouldMountAdmin = user.role === "admin" && (path === "/admin" || visitedPages.has("/admin"));

  return (
    <AppShell
      user={user}
      onLogout={() => {
        setUser(null);
        setVisitedPages(new Set());
      }}
    >
      {showResourceDetail ? (
        <ResourceDetailPage user={user} resourceId={decodeURIComponent(path.replace("/resources/", ""))} />
      ) : null}
      {shouldMountDashboard ? (
        <div hidden={!showDashboard}>
          <DashboardPage user={user} />
        </div>
      ) : null}
      {shouldMountLibrary ? (
        <div hidden={path !== "/library"}>
          <LibraryPage />
        </div>
      ) : null}
      {shouldMountAdmin ? (
        <div hidden={path !== "/admin"}>
          <AdminPage />
        </div>
      ) : null}
    </AppShell>
  );
}
