import { useState } from "react";

interface EvidencePreviewProps {
  text?: string | null;
  label?: string;
  meta?: string;
}

const PREVIEW_LIMIT = 260;

export function EvidencePreview({
  text,
  label = "Evidence preview",
  meta,
}: EvidencePreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const cleanText = text?.trim() || "";
  const hasText = cleanText.length > 0;
  const canToggle = cleanText.length > PREVIEW_LIMIT;
  const visibleText =
    expanded || !canToggle ? cleanText : `${cleanText.slice(0, PREVIEW_LIMIT).trim()}...`;

  return (
    <article className="panel evidence-preview">
      <div className="section-title-row">
        <h3>{label}</h3>
        {meta ? <span className="evidence-meta">{meta}</span> : null}
      </div>
      <p className={hasText ? "" : "muted-small"}>
        {hasText ? visibleText : "No evidence text is available yet."}
      </p>
      {canToggle ? (
        <button
          className="evidence-toggle"
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </article>
  );
}
