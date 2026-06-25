import { EvidencePreview } from "../components/EvidencePreview";
import { Badge, Button, MaterialIcon, PageHead } from "../components/ui";
import { navigate } from "../services/navigation";
import type { User } from "../types/api";

interface ResourceDetailPageProps {
  resourceId: string;
  user: User;
}

interface StaticDetail {
  title: string;
  summary: string;
  resourceType: string;
  policyArea: string;
  jurisdiction: string;
  sector: string;
  challenge: string;
  source: string;
  citation: string;
  status: string;
  evidence: string[];
}

const staticDetail: StaticDetail = {
  title: "Central-West Orana Renewable Energy Zone",
  summary:
    "A static Sprint 1 preview for the resource detail layout. The final page will load metadata, documents, and indexed chunks from the backend resource detail API.",
  resourceType: "Case study",
  policyArea: "Energy transition",
  jurisdiction: "NSW, Australia",
  sector: "Energy",
  challenge: "Community benefit sharing",
  source: "Policy case study",
  citation: "NSW Department of Planning and Environment (2024). Central-West Orana REZ Implementation Update.",
  status: "Detail API integration pending",
  evidence: [
    "Coordinated transmission planning helps align new renewable generation, access rights, and local infrastructure delivery.",
    "Community benefit schemes are highlighted as a practical mechanism for responding to landholder and regional concerns.",
  ],
};

function detailForRoute(resourceId: string): StaticDetail | null {
  if (!resourceId || resourceId === "not-a-real-id") return null;
  if (resourceId === "rez-nsw-2024") return staticDetail;
  return {
    ...staticDetail,
    title: `Static detail preview for ${resourceId}`,
    summary:
      "This placeholder confirms the detail route and layout before Task 17 connects the page to live resource metadata.",
    citation: "Citation will be loaded from the resource detail API in Task 17.",
    status: "Static preview",
  };
}

export function ResourceDetailPage({ resourceId, user }: ResourceDetailPageProps) {
  const detail = detailForRoute(resourceId);

  if (!detail) {
    return (
      <>
        <PageHead eyebrow="Resource detail" title="Resource not available yet">
          This static shell could not find a preview for this route. Real missing-resource handling will be connected in Task 17.
        </PageHead>
        <div className="notice">Resource ID: {resourceId || "missing"}</div>
        <div className="action-row" style={{ marginTop: 18 }}>
          <Button variant="outline" onClick={() => navigate("/library")}>
            <MaterialIcon name="arrow_back" />
            Back to library
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHead
        eyebrow="Resource detail"
        title={detail.title}
        action={
          user.role === "admin" ? (
            <Button variant="outline" type="button">
              <MaterialIcon name="edit" />
              Edit metadata
            </Button>
          ) : null
        }
      >
        {detail.summary}
      </PageHead>

      <section className="detail-layout">
        <div className="stack">
          <article className="card result-card">
            <div className="section-title-row">
              <h2>Metadata</h2>
              <Badge tone="teal">{detail.status}</Badge>
            </div>
            <div className="meta">
              <Badge tone="gold">{detail.policyArea}</Badge>
              <Badge>{detail.jurisdiction}</Badge>
              <Badge>{detail.resourceType}</Badge>
              <Badge>{detail.sector}</Badge>
              <Badge>{detail.challenge}</Badge>
            </div>
          </article>

          <article className="card result-card">
            <div className="section-title-row">
              <h2>Evidence chunks</h2>
              <span className="muted-small">Static shell preview</span>
            </div>
            <div className="stack">
              {detail.evidence.map((text, index) => (
                <EvidencePreview
                  key={text}
                  label={`Evidence chunk ${index + 1}`}
                  meta="Indexed excerpt placeholder"
                  text={text}
                />
              ))}
            </div>
          </article>
        </div>

        <aside className="source-card">
          <div className="section-title-row">
            <h2>Source</h2>
            <Badge>{resourceId}</Badge>
          </div>
          <dl className="source">
            <dt>Source type</dt>
            <dd>{detail.source}</dd>
            <dt>Citation</dt>
            <dd>{detail.citation}</dd>
            <dt>Document status</dt>
            <dd>{detail.status}</dd>
          </dl>
          <div className="chunk-controls">
            <Button variant="outline" type="button" disabled>
              <MaterialIcon name="download" />
              Download pending
            </Button>
            {user.role === "admin" ? (
              <Button variant="ghost" type="button" disabled>
                <MaterialIcon name="sync" />
                Reprocess pending
              </Button>
            ) : null}
          </div>
        </aside>
      </section>
    </>
  );
}
