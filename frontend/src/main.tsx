import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";

function App() {
  return (
    <main className="shell">
      <section className="panel">
        <p className="eyebrow">Sprint 1 Repository Setup</p>
        <h1>Policy in Action Library</h1>
        <p>
          The repository scaffold is ready for the React frontend, FastAPI backend,
          PostgreSQL database, and ChromaDB vector store.
        </p>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
