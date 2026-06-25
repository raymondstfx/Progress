import type { ReactNode } from "react";
import type { User } from "../types/api";
import { api, clearSession } from "../services/api";
import { currentPath, navigate } from "../services/navigation";
import { classNames, MaterialIcon } from "../components/ui";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { path: "/library", label: "Library", icon: "search" },
  { path: "/admin", label: "Admin", icon: "admin_panel_settings", admin: true },
];

export function AppShell({ user, onLogout, children }: { user: User; onLogout: () => void; children: ReactNode }) {
  function logout() {
    api.logout().catch(() => undefined);
    clearSession();
    onLogout();
    navigate("/login");
  }

  const visibleItems = navItems.filter((item) => !item.admin || user.role === "admin");

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <button onClick={() => navigate("/dashboard")} className="brand-wrap">
            <MaterialIcon name="policy" style={{ color: "var(--primary)" }} />
            <div>
              <div className="brand">Policy in Action Library</div>
              <div className="brand-subtitle">UNSW Knowledge Hub</div>
            </div>
          </button>
          <nav className="topnav" aria-label="Primary navigation">
            {visibleItems.map((item) => (
              <button key={item.path} onClick={() => navigate(item.path)} className={currentPath() === item.path ? "active" : ""}>
                {item.label}
              </button>
            ))}
          </nav>
          <button className="btn btn-outline logout-btn" onClick={logout}>
            <MaterialIcon name="logout" />
            Logout
          </button>
        </div>
      </header>
      <div className="shell">
        <aside className="sidebar">
          <h2>Policy Explorer</h2>
          <nav className="sidenav" aria-label="Section navigation">
            {visibleItems.map((item) => (
              <button key={item.path} onClick={() => navigate(item.path)} className={classNames(currentPath() === item.path && "active")}>
                <MaterialIcon name={item.icon} />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>
        <main className="main">{children}</main>
      </div>
    </>
  );
}
