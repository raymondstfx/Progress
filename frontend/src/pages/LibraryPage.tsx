import { FormEvent, useEffect, useState } from "react";
import { api } from "../services/api";
import type { ResourceListItem, SearchFilters } from "../types/api";
import { Button, MaterialIcon, PageHead, Select, TextInput } from "../components/ui";
import { ResourceList } from "../components/ResourceCard";

export function LibraryPage() {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [resources, setResources] = useState<ResourceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  async function loadResources(nextFilters = filters) {
    setLoading(true);
    setError("");
    try {
      const items = await api.resources(nextFilters);
      setResources(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load resources.");
      setResources([]);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    void loadResources();
  }

  function clearFilters() {
    const emptyFilters: SearchFilters = {};
    setFilters(emptyFilters);
    void loadResources(emptyFilters);
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
          <Button variant="outline" onClick={() => void loadResources()} disabled={loading}>
            <MaterialIcon name="refresh" />
            Refresh
          </Button>
        }
      >
        Review imported and uploaded resources from the repository.
      </PageHead>

      <section className="card result-card stack" style={{ marginBottom: 24 }}>
        <form onSubmit={applyFilters} className="stack">
          <div className="grid-2">
            <TextInput
              placeholder="Policy area"
              value={filters.policy_area || ""}
              onChange={(event) => setFilters({ ...filters, policy_area: event.target.value })}
            />
            <TextInput
              placeholder="Jurisdiction"
              value={filters.jurisdiction || ""}
              onChange={(event) => setFilters({ ...filters, jurisdiction: event.target.value })}
            />
            <TextInput
              placeholder="Sector"
              value={filters.sector || ""}
              onChange={(event) => setFilters({ ...filters, sector: event.target.value })}
            />
            <TextInput
              placeholder="Policy challenge"
              value={filters.policy_challenge || ""}
              onChange={(event) => setFilters({ ...filters, policy_challenge: event.target.value })}
            />
          </div>
          <Select
            value={filters.resource_type || ""}
            onChange={(event) => setFilters({ ...filters, resource_type: event.target.value })}
          >
            <option value="">All resource types</option>
            <option value="case_study">Case studies</option>
            <option value="policy_report">Policy reports</option>
            <option value="research_paper">Research papers</option>
            <option value="uploaded_document">Uploaded documents</option>
          </Select>
          <div className="action-row">
            <Button type="submit" disabled={loading}>
              <MaterialIcon name="filter_alt" />
              Apply filters
            </Button>
            <Button type="button" variant="ghost" onClick={clearFilters} disabled={loading || !activeFilterCount}>
              Clear filters
            </Button>
            <span className="chip">{activeFilterCount} active filters</span>
          </div>
        </form>
      </section>

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
