import type { ResourceListItem } from "../types/api";
import { navigate } from "../services/navigation";
import { Badge, Button, MaterialIcon } from "./ui";

type CardResource = Pick<
  ResourceListItem,
  "id" | "title" | "summary" | "policy_area" | "jurisdiction" | "resource_type"
>;

export function ResourceCard({ resource }: { resource: CardResource }) {
  return (
    <article className="card result-card">
      <div className="meta">
        <Badge tone="gold">{resource.policy_area || "Unspecified"}</Badge>
        <Badge>{resource.jurisdiction || "Unknown jurisdiction"}</Badge>
        <Badge>{resource.resource_type || "resource"}</Badge>
      </div>
      <h3>{resource.title || "Untitled resource"}</h3>
      <p>{resource.summary || "No summary is available yet."}</p>
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
