import { FormEvent, useEffect, useState } from "react";
import type { ResourceListItem } from "../types/api";
import { api } from "../services/api";
import { navigate } from "../services/navigation";
import { Button, Field, MaterialIcon, PageHead, Textarea, TextInput } from "../components/ui";

type UploadStatus = "idle" | "selected" | "uploading" | "uploaded" | "failed";

function titleFromFileName(fileName: string): string {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function AdminPage() {
  const [tab, setTab] = useState<"upload" | "manage">("upload");
  const [resources, setResources] = useState<ResourceListItem[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [form, setForm] = useState<Record<string, string>>({
    policy_area: "Cyber Security",
    jurisdiction: "Australia",
    sector: "Cyber security and digital government",
    policy_challenge: "Improving cyber resilience, incident response, and secure digital service delivery",
    stakeholder_type: "Government agencies, businesses, critical infrastructure operators, and community organisations",
  });

  async function refresh() {
    setRefreshing(true);
    try {
      const items = await api.resources();
      setResources(items);
      return items;
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void refresh().catch((err) => setMessage(err instanceof Error ? err.message : "Unable to load repository activity."));
  }, []);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fileInput = event.currentTarget.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) return setMessage("Choose a TXT, PDF, or DOCX file first.");
    setBusy(true);
    setUploadStatus("uploading");
    setMessage(`Uploading and indexing ${file.name}...`);
    const formData = new FormData();
    formData.append("file", file);
    Object.entries(form).forEach(([key, value]) => formData.append(key, value || ""));
    try {
      const saved = await api.upload(formData);
      setResources((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      await refresh();
      setMessage(`Uploaded "${saved.title}" and indexed ${saved.chunks.length} chunks. It is listed in Repository Activity below.`);
      setUploadStatus("uploaded");
      fileInput.value = "";
      setSelectedFileName("");
    } catch (err) {
      setUploadStatus("failed");
      setMessage(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this resource, chunks, embeddings, citations, and uploaded files?")) return;
    await api.deleteResource(id);
    await refresh();
  }

  return (
    <>
      <PageHead eyebrow="Admin Repository" title="Upload and manage policy evidence.">Admin-only tools for ingestion status, metadata edits, deletion, download, and reprocessing.</PageHead>
      <div className="action-row" style={{ marginBottom: 24 }}>
        <Button type="button" variant={tab === "upload" ? "primary" : "outline"} onClick={() => setTab("upload")}>
          New Upload
        </Button>
        <Button type="button" variant={tab === "manage" ? "primary" : "outline"} onClick={() => setTab("manage")}>
          Manage Resources
        </Button>
      </div>
      {tab === "upload" ? (
        <>
          <form id="uploadForm" onSubmit={upload}>
            <section className="grid-2" style={{ alignItems: "start", marginBottom: 24 }}>
              <div className="card result-card">
                <h2>Choose Policy File</h2>
                <div className="dropzone">
                  <MaterialIcon name="upload_file" style={{ fontSize: 48, color: "var(--primary)" }} />
                  <h3>Drop or choose a policy file</h3>
                  <p>FastAPI stores files locally, extracts TXT/PDF/DOCX text, creates chunks, and indexes them in ChromaDB.</p>
                  <Field label="File">
                    <TextInput
                      name="file"
                      type="file"
                      accept=".txt,.pdf,.doc,.docx"
                      onChange={(event) => {
                        const fileName = event.target.files?.[0]?.name || "";
                        setSelectedFileName(fileName);
                        setUploadStatus(fileName ? "selected" : "idle");
                        if (fileName && !form.title) setForm({ ...form, title: titleFromFileName(fileName) });
                        setMessage("");
                      }}
                    />
                  </Field>
                  <p className="muted-small">Supported: TXT, PDF, DOCX.</p>
                </div>
                <div className="notice ingestion-notice" style={{ marginTop: 16 }}>
                  {message ||
                    (uploadStatus === "selected" && selectedFileName
                      ? `Ready to upload: ${selectedFileName}`
                      : "Choose a file, complete the metadata, then press Upload file and index.")}
                </div>
              </div>
              <div className="card result-card">
                <h2>Optional Metadata</h2>
                <p className="muted-small" style={{ marginTop: -6 }}>These fields help search and filtering. Empty fields use safe defaults from the uploaded file.</p>
                <div className="stack">
                  <Field label="Document title (optional)"><TextInput value={form.title || ""} placeholder="Auto-filled from file name if left blank" onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field>
                  <Field label="Policy area (optional)"><TextInput value={form.policy_area || ""} onChange={(event) => setForm({ ...form, policy_area: event.target.value })} /></Field>
                  <Field label="Jurisdiction (optional)"><TextInput value={form.jurisdiction || ""} onChange={(event) => setForm({ ...form, jurisdiction: event.target.value })} /></Field>
                  <Field label="Sector (optional)"><TextInput value={form.sector || ""} onChange={(event) => setForm({ ...form, sector: event.target.value })} /></Field>
                  <Field label="Implementation challenge (optional)"><TextInput value={form.policy_challenge || ""} onChange={(event) => setForm({ ...form, policy_challenge: event.target.value })} /></Field>
                  <Field label="Stakeholder type (optional)"><TextInput value={form.stakeholder_type || ""} onChange={(event) => setForm({ ...form, stakeholder_type: event.target.value })} /></Field>
                  <Field label="Summary (optional)"><Textarea rows={4} value={form.summary || ""} placeholder="Leave blank to use the default uploaded-resource summary." onChange={(event) => setForm({ ...form, summary: event.target.value })} /></Field>
                  <Button type="submit" variant="secondary" disabled={busy}>
                    <MaterialIcon name="cloud_upload" />
                    {busy ? "Uploading and indexing..." : "Upload file and index"}
                  </Button>
                </div>
              </div>
            </section>
          </form>
          <RepositoryTable resources={resources} remove={remove} refresh={refresh} refreshing={refreshing} />
        </>
      ) : (
        <RepositoryTable resources={resources} remove={remove} refresh={refresh} refreshing={refreshing} />
      )}
    </>
  );
}

function RepositoryTable({
  resources,
  remove,
  refresh,
  refreshing,
}: {
  resources: ResourceListItem[];
  remove: (id: string) => void;
  refresh: () => Promise<ResourceListItem[]>;
  refreshing: boolean;
}) {
  return (
    <section className="card">
      <div className="page-head" style={{ padding: "20px 22px 0", marginBottom: 14 }}>
        <h2 style={{ margin: 0 }}>Repository Activity</h2>
        <div className="action-row">
          <span className="chip">imported + manually uploaded resources</span>
          <Button type="button" variant="outline" onClick={() => void refresh()} disabled={refreshing}>
            <MaterialIcon name="refresh" />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Document</th><th>Metadata</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {resources.map((resource) => (
              <tr key={resource.id}>
                <td><strong>{resource.title}</strong><br /><span className="muted-small">{resource.source || resource.resource_type}</span></td>
                <td><div className="meta"><span className="chip gold">{resource.policy_area}</span><span className="chip">{resource.jurisdiction}</span><span className="chip">{resource.policy_challenge}</span></div></td>
                <td><span className="chip teal">{resource.document_status || "Indexed"}</span></td>
                <td>
                  <div className="action-row">
                    <Button variant="outline" onClick={() => navigate(`/resources/${resource.id}`)}><MaterialIcon name="article" />Detail</Button>
                    <Button variant="danger" onClick={() => remove(resource.id)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
