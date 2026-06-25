import React from "react";
import { createRoot } from "react-dom/client";
import { AdminPage } from "./pages/AdminPage";
import "./styles.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <main className="main admin-shell">
      <AdminPage />
    </main>
  </React.StrictMode>,
);
