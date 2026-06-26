import type { Chunk, ResourceListItem } from "../types/api";
import { navigate } from "../services/navigation";
import { Badge, Button, MaterialIcon } from "./ui";
import { EvidencePreview } from "./EvidencePreview";

type CardResource = Pick<
  ResourceListItem,
  "id" | "title" | "summary" | "policy_area" | "jurisdiction" | "resource_type"
>;

interface ResourceCardProps {
  resource: CardResource;
  score?: number;
  matchedChunks?: Chunk[];
}

export function ResourceCard({ resource, score, matchedChunks }: ResourceCardProps) {
  const firstMatch = matchedChunks?.[0];

  return (
    <article className="card result-card">
      <div className="meta">
        <Badge tone="gold">{resource.policy_area || "Unspecified"}</Badge>
        <Badge>{resource.jurisdiction || "Unknown jurisdiction"}</Badge>
        <Badge>{resource.resource_type || "resource"}</Badge>
        {score !== undefined ? <Badge tone="teal">score {score.toFixed(2)}</Badge> : null}
      </div>
      <h3>{resource.title || "Untitled resource"}</h3>
      <p>{resource.summary || "No summary is available yet."}</p>
      {firstMatch ? (
        <EvidencePreview
          label="Matching evidence"
          meta={`Chunk ${firstMatch.chunk_index}`}
          text={firstMatch.text}
        />
      ) : null}
      <div className="action-row">
        <Button variant="outline" onClick={() => navigate(`/resources/${resource.id}`)}>
          <MaterialIcon name="article" />
          View detail
        </Button>
      </div>
    </article>
  );
}

export function ResourceList({ resources }: { resources: ResourceListItem[] }) {
  if (!resources.length) {
    return <div className="notice">No resources found.</div>;
  }
  return <div className="stack">{resources.map((item) => <ResourceCard key={item.id} resource={item} />)}</div>;
}
