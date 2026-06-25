import { useEffect, useState } from "react";
import type { User } from "./types/api";
import { getStoredUser } from "./services/api";
import { currentPath, navigate } from "./services/navigation";
import { AdminPage } from "./pages/AdminPage";
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
    if (user && path === "/login") navigate("/admin");
  }, [user, path]);

  if (!user) return <LoginPage onLogin={setUser} />;

  return (
    <main className="main admin-shell">
      <AdminPage />
    </main>
  );
}
