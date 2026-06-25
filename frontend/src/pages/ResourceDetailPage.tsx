import { useEffect, useState } from "react";
import { EvidencePreview } from "../components/EvidencePreview";
import { Badge, Button, MaterialIcon, PageHead } from "../components/ui";
import { api } from "../services/api";
import { navigate } from "../services/navigation";
import type { DocumentRecord, ResourceDetail, User } from "../types/api";

interface ResourceDetailPageProps {
  resourceId: string;
  user: User;
}

function documentTone(status: string): "default" | "teal" | "danger" {
  if (status === "completed") return "teal";
  if (status === "failed") return "danger";
  return "default";
}

function latestDocument(documents: DocumentRecord[]): DocumentRecord | null {
  return documents[0] || null;
}

export function ResourceDetailPage({ resourceId, user }: ResourceDetailPageProps) {
  const [resource, setResource] = useState<ResourceDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAllChunks, setShowAllChunks] = useState(false);
  const [reprocessingId, setReprocessingId] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    setShowAllChunks(false);
    api
      .resource(resourceId)
      .then(setResource)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Resource could not be loaded."))
      .finally(() => setLoading(false));
  }, [resourceId]);

  async function reprocess(documentId: string) {
    setReprocessingId(documentId);
    setError("");
    try {
      setResource(await api.reprocess(documentId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Document reprocess failed.");
    } finally {
      setReprocessingId("");
    }
  }

  if (loading) {
    return <div className="notice">Loading resource detail...</div>;
  }

  if (error || !resource) {
    return (
      <>
        <PageHead eyebrow="Resource detail" title="Resource not available">
          {error || "The selected resource could not be loaded."}
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

  const visibleChunks = showAllChunks ? resource.chunks : resource.chunks.slice(0, 3);
  const primaryDocument = latestDocument(resource.documents);

  return (
    <>
      <PageHead eyebrow="Resource detail" title={resource.title}>
        {resource.summary || "No summary is available yet."}
      </PageHead>

      <section className="detail-layout">
        <div className="stack">
          <article className="card result-card">
            <div className="section-title-row">
              <h2>Metadata</h2>
              {primaryDocument ? (
                <Badge tone={documentTone(primaryDocument.parse_status)}>{primaryDocument.parse_status}</Badge>
              ) : (
                <Badge>No uploaded document</Badge>
              )}
            </div>
            <div className="meta">
              <Badge tone="gold">{resource.policy_area || "Unspecified"}</Badge>
              <Badge>{resource.jurisdiction || "Unknown jurisdiction"}</Badge>
              <Badge>{resource.resource_type || "resource"}</Badge>
              <Badge>{resource.sector || "Unspecified sector"}</Badge>
              <Badge>{resource.policy_challenge || "No challenge tagged"}</Badge>
            </div>
          </article>

          <article className="card result-card">
            <div className="section-title-row">
              <h2>Evidence chunks</h2>
              <span className="muted-small">Showing {visibleChunks.length} of {resource.chunks.length}</span>
            </div>
            {visibleChunks.length ? (
              <div className="stack">
                {visibleChunks.map((chunk) => (
                  <EvidencePreview
                    key={chunk.id}
                    label={`Evidence chunk ${chunk.chunk_index}`}
                    meta={`p. ${chunk.page_start || "n/a"}${chunk.page_end && chunk.page_end !== chunk.page_start ? `-${chunk.page_end}` : ""} | ${chunk.token_count || 0} tokens`}
                    text={chunk.text}
                  />
                ))}
              </div>
            ) : (
              <div className="notice">No evidence chunks are available for this resource yet.</div>
            )}
            {resource.chunks.length > 3 ? (
              <div className="chunk-controls">
                <Button variant="outline" type="button" onClick={() => setShowAllChunks((current) => !current)}>
                  <MaterialIcon name={showAllChunks ? "expand_less" : "expand_more"} />
                  {showAllChunks ? "Show fewer chunks" : `Show all ${resource.chunks.length} chunks`}
                </Button>
              </div>
            ) : null}
          </article>
        </div>

        <aside className="source-card">
          <div className="section-title-row">
            <h2>Source</h2>
            <Badge>{resource.id}</Badge>
          </div>
          <dl className="source">
            <dt>Source type</dt>
            <dd>{resource.source_type || resource.source || "Unknown"}</dd>
            <dt>Citation</dt>
            <dd>{resource.citation || resource.source || "No citation available."}</dd>
            <dt>Document status</dt>
            <dd>{primaryDocument?.parse_status || resource.document_status || "No uploaded document"}</dd>
          </dl>

          {resource.documents.length ? (
            <div className="stack">
              {resource.documents.map((document) => (
                <article key={document.id} className="panel">
                  <div className="meta">
                    <Badge tone={documentTone(document.parse_status)}>{document.parse_status}</Badge>
                    <Badge>{Math.max(1, Math.round(document.file_size / 1024))} KB</Badge>
                  </div>
                  <p>
                    <strong>{document.original_filename}</strong>
                  </p>
                  {document.parse_error ? <p className="notice">{document.parse_error}</p> : null}
                  <div className="chunk-controls">
                    <a className="btn btn-outline" href={api.fileUrl(document.id)}>
                      <MaterialIcon name="download" />
                      Download original
                    </a>
                    {user.role === "admin" ? (
                      <Button
                        variant="ghost"
                        type="button"
                        disabled={reprocessingId === document.id}
                        onClick={() => reprocess(document.id)}
                      >
                        <MaterialIcon name="sync" />
                        {reprocessingId === document.id ? "Reprocessing..." : "Reprocess document"}
                      </Button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="notice">No uploaded source document is attached to this resource.</div>
          )}
        </aside>
      </section>
    </>
  );
}
