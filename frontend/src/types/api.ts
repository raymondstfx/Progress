export type Role = "user" | "admin";

export interface User {
  id: string;
  username: string;
  role: Role;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface SearchFilters {
  policy_area?: string;
  jurisdiction?: string;
  sector?: string;
  policy_challenge?: string;
  resource_type?: string;
}

export interface Chunk {
  id: string;
  resource_id: string;
  document_id?: string | null;
  chunk_index: number;
  text: string;
  page_start?: number | null;
  page_end?: number | null;
  section_title?: string;
  token_count?: number;
  score?: number;
  citation_label?: string;
}

export interface DocumentRecord {
  id: string;
  resource_id: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  parse_status: string;
  parse_error: string;
  uploaded_at: string;
}

export interface ResourceListItem {
  id: string;
  title: string;
  resource_type: string;
  policy_area: string;
  jurisdiction: string;
  sector: string;
  policy_challenge: string;
  stakeholder_type: string;
  summary: string;
  source_type: string;
  source: string;
  citation: string;
  year?: number;
  tags: string[];
  chunk_count?: number;
  document_status?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResourceDetail extends ResourceListItem {
  chunks: Chunk[];
  documents: DocumentRecord[];
}

export interface Stats {
  total_resources: number;
  case_studies: number;
  policy_reports: number;
  uploaded_documents: number;
  failed_ingestions: number;
  indexed_chunks: number;
  total_embeddings: number;
  popular_policy_areas: string[];
  recent_resources: ResourceListItem[];
}

export interface SearchResult {
  resource_id: string;
  title: string;
  score: number;
  summary: string;
  policy_area: string;
  jurisdiction: string;
  resource_type: string;
  matched_chunks: Chunk[];
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  resources: ResourceListItem[];
}

export interface Citation {
  citation_id: string;
  chunk_id: string;
  resource_id: string;
  title: string;
  page_start?: number | null;
  page_end?: number | null;
  supporting_text: string;
}

export interface CitedPoint {
  point?: string;
  lesson?: string;
  risk?: string;
  consideration?: string;
  recommendation?: string;
  citations: string[];
}

export interface SynthesisAnswer {
  overview: string;
  relevant_examples: CitedPoint[];
  lessons_learned: CitedPoint[];
  risks: CitedPoint[];
  implementation_considerations: CitedPoint[];
  recommendations: CitedPoint[];
}

export interface SynthesisResponse {
  query: string;
  answer: SynthesisAnswer;
  citations: Citation[];
  llm: Record<string, any>;
}
