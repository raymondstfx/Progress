import { useEffect, useState } from "react";
import { api } from "../services/api";
import type { ResourceListItem } from "../types/api";
import { Button, MaterialIcon, PageHead } from "../components/ui";
import { ResourceList } from "../components/ResourceCard";

export function LibraryPage() {
  const [resources, setResources] = useState<ResourceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadResources() {
    setLoading(true);
    setError("");
    try {
      const items = await api.resources();
      setResources(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load resources.");
      setResources([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadResources();
  }, []);

  return (
    <>
      <PageHead
        eyebrow="Policy Library"
        title="Browse policy resources"
        action={
          <Button variant="outline" onClick={loadResources} disabled={loading}>
            <MaterialIcon name="refresh" />
            Refresh
          </Button>
        }
      >
        Review imported and uploaded resources from the repository.
      </PageHead>

      <section className="card result-card stack">
        <div className="action-row" style={{ justifyContent: "space-between" }}>
          <strong>{resources.length} resources</strong>
          <span className="muted-small">Browse mode</span>
        </div>

        {loading && <div className="notice">Loading policy resources...</div>}
        {!loading && error && <div className="notice ingestion-notice">{error}</div>}
        {!loading && !error && <ResourceList resources={resources} />}
      </section>
    </>
  );
}
