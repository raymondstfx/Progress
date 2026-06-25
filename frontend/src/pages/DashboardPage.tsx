import type { User } from "../types/api";
import { navigate } from "../services/navigation";
import { Badge, Button, MaterialIcon, PageHead, Stat } from "../components/ui";
import { ResourceList } from "../components/ResourceCard";

export function DashboardPage({ user }: { user: User }) {
  const isAdmin = user.role === "admin";

  return (
    <>
      <PageHead eyebrow="Dashboard" title="Repository overview.">
        Review repository activity, recent resources, and policy areas from a stable dashboard shell.
      </PageHead>

      <section className="grid-3 stats-grid">
        <Stat label="Resources" value={0} />
        <Stat label="Policy reports" value={0} />
        <Stat label="Indexed chunks" value={0} />
        <div className="card stat">
          <div className="meta" style={{ justifyContent: "space-between" }}>
            <Badge tone={isAdmin ? "danger" : "teal"}>{isAdmin ? "Admin queue" : "Uploads"}</Badge>
            <MaterialIcon name={isAdmin ? "warning" : "cloud_upload"} />
          </div>
          <strong>0</strong>
        </div>
      </section>

      <div className="notice" style={{ marginBottom: 24 }}>
        Live dashboard statistics will be connected in a later integration task.
      </div>

      <section className="grid-2">
        <div>
          <div className="page-head section-head">
            <h2 style={{ margin: 0 }}>Recent resources</h2>
          </div>
          <ResourceList resources={[]} />
        </div>

        <div className="card result-card stack">
          <h2 style={{ margin: 0 }}>Popular policy areas</h2>
          <div className="meta">
            <Badge tone="gold">No policy areas yet</Badge>
          </div>
          <p className="muted-small">
            Policy-area summaries will appear once repository statistics are connected.
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
