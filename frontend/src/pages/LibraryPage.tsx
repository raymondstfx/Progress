import { FormEvent, useEffect, useState } from "react";
import { api } from "../services/api";
import type { ResourceListItem, SearchFilters, SearchResult } from "../types/api";
import { Button, MaterialIcon, PageHead, Select, TextInput } from "../components/ui";
import { ResourceCard, ResourceList } from "../components/ResourceCard";

export function LibraryPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<SearchResult[]>([]);
  const [resources, setResources] = useState<ResourceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const searchMode = Boolean(query.trim());
  const resultCount = searchMode ? results.length : resources.length;

  async function loadLibrary(nextFilters = filters, nextQuery = query) {
    setLoading(true);
    setError("");
    try {
      if (nextQuery.trim()) {
        const data = await api.search({ query: nextQuery.trim(), filters: nextFilters, top_k: 10 });
        setResults(data.results);
        setResources(data.resources);
      } else {
        const items = await api.resources(nextFilters);
        setResources(items);
        setResults([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load library results.");
      setResources([]);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    void loadLibrary();
  }

  function clearFilters() {
    const emptyFilters: SearchFilters = {};
    setFilters(emptyFilters);
    void loadLibrary(emptyFilters);
  }

  useEffect(() => {
    void loadLibrary();
  }, []);

  return (
    <>
      <PageHead
        eyebrow="Policy Library"
        title="Search resource database"
        action={
          <Button variant="outline" onClick={() => void loadLibrary()} disabled={loading}>
            <MaterialIcon name="refresh" />
            Refresh
          </Button>
        }
      >
        Search seeded and uploaded resources, or leave the query empty to browse the repository.
      </PageHead>

      <section className="card result-card stack" style={{ marginBottom: 24 }}>
        <form onSubmit={applyFilters} className="stack">
          <div className="searchbar">
            <MaterialIcon name="search" style={{ color: "var(--primary)" }} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try: Renewable Energy Zone"
            />
            <Button type="submit" disabled={loading}>
              {query.trim() ? "Search" : "Browse"}
            </Button>
          </div>
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
            <span className="chip">{searchMode ? "Search mode" : "Browse mode"}</span>
          </div>
        </form>
      </section>

      <section className="card result-card stack">
        <div className="action-row" style={{ justifyContent: "space-between" }}>
          <strong>{resultCount} results</strong>
          <span className="muted-small">{searchMode ? `Search: ${query.trim()}` : "Browse mode"}</span>
        </div>

        {loading && <div className="notice">Loading library results...</div>}
        {!loading && error && <div className="notice ingestion-notice">{error}</div>}
        {!loading && !error && searchMode && !results.length && (
          <div className="notice">No search results found. Try a broader query or clear filters.</div>
        )}
        {!loading && !error && searchMode && results.length > 0 && (
          <div className="stack">
            {results.map((item) => (
              <ResourceCard
                key={item.resource_id}
                resource={{
                  id: item.resource_id,
                  title: item.title,
                  summary: item.summary,
                  policy_area: item.policy_area,
                  jurisdiction: item.jurisdiction,
                  resource_type: item.resource_type,
                }}
                score={item.score}
                matchedChunks={item.matched_chunks}
              />
            ))}
          </div>
        )}
        {!loading && !error && !searchMode && <ResourceList resources={resources} />}
      </section>
    </>
  );
}
