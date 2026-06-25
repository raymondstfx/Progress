import { useEffect, useState } from "react";
import type { User } from "../types/api";
import type { Stats } from "../types/api";
import { api } from "../services/api";
import { navigate } from "../services/navigation";
import { Badge, Button, MaterialIcon, PageHead, Stat } from "../components/ui";
import { ResourceList } from "../components/ResourceCard";

export function DashboardPage({ user }: { user: User }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isAdmin = user.role === "admin";

  useEffect(() => {
    setLoading(true);
    setError("");
    api.stats()
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load dashboard statistics."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHead eyebrow="Dashboard" title="Repository overview.">
        Review repository activity, recent resources, and policy areas from live backend statistics.
      </PageHead>

      <section className="grid-3 stats-grid">
        <Stat label="Resources" value={stats?.total_resources} />
        <Stat label="Policy reports" value={stats?.policy_reports} />
        <Stat label="Indexed chunks" value={stats?.indexed_chunks} />
        <div className="card stat">
          <div className="meta" style={{ justifyContent: "space-between" }}>
            <Badge tone={isAdmin ? "danger" : "teal"}>{isAdmin ? "Admin queue" : "Uploads"}</Badge>
            <MaterialIcon name={isAdmin ? "warning" : "cloud_upload"} />
          </div>
          <strong>{isAdmin ? stats?.failed_ingestions ?? 0 : stats?.uploaded_documents ?? 0}</strong>
        </div>
      </section>

      {loading && <div className="notice" style={{ marginBottom: 24 }}>Loading dashboard statistics...</div>}
      {error && <div className="notice ingestion-notice" style={{ marginBottom: 24 }}>{error}</div>}

      <section className="grid-2">
        <div>
          <div className="page-head section-head">
            <h2 style={{ margin: 0 }}>Recent resources</h2>
          </div>
          <ResourceList resources={stats?.recent_resources || []} />
        </div>

        <div className="card result-card stack">
          <h2 style={{ margin: 0 }}>Popular policy areas</h2>
          <div className="meta">
            {(stats?.popular_policy_areas || []).length ? (
              stats?.popular_policy_areas.map((area) => <Badge key={area} tone="gold">{area}</Badge>)
            ) : (
              <Badge tone="gold">No policy areas yet</Badge>
            )}
          </div>
          <p className="muted-small">
            Policy-area summaries are refreshed from repository metadata.
          </p>
          {isAdmin && (
            <div className="action-row">
              <Button onClick={() => navigate("/admin")}>
                <MaterialIcon name="upload_file" />
                Upload document
              </Button>
              <Button variant="outline" onClick={() => navigate("/admin")}>
                Manage repository
              </Button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
