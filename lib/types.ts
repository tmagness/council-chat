// Confidence level type
export type ConfidenceLevel = 'high' | 'medium' | 'low';

// Disagreement type classification
export type DisagreementType = 'FACTUAL' | 'CONFIDENCE' | 'INTERPRETIVE' | 'HALLUCINATION';

// Delta represents a point of disagreement between models
export interface Delta {
  topic: string;
  gpt_position: string;
  gpt_confidence: ConfidenceLevel;
  claude_position: string;
  claude_confidence: ConfidenceLevel;
  disagreementType: DisagreementType;
  recommended: 'gpt' | 'claude' | 'neither';
  reasoning: string;
  calibration_warning?: string;
}

// Context update for CLAUDE.md (optional, only for platform-related queries)
export interface ClaudeMdUpdate {
  current_status: string;
  recent_changes: string[];
  planned_next: string[];
}

// Result of merging GPT and Claude responses
export interface MergeResult {
  consensus: string;
  confidence: ConfidenceLevel;
  consensus_strength: number;
  gpt_overall_confidence: ConfidenceLevel;
  claude_overall_confidence: ConfidenceLevel;
  confidence_reasoning: string;
  deltas: Delta[];
  unverified_assumptions: string[];
  next_steps: string[];
  decision_filter_notes: string;
  claude_md_update?: ClaudeMdUpdate;
}

// Image attachment type
export interface ImageAttachment {
  data: string; // base64 encoded
  media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
}

// Document attachment type — text extracted client-side, sent to both providers
export interface DocumentAttachment {
  filename: string;
  type: 'docx' | 'pdf' | 'txt';
  size: number; // bytes (original file)
  text: string; // extracted UTF-8 text
}

// Client-only wrapper for thread-level stacked document state.
// Carries an id (for stable React keys + remove targeting) and isNew flag
// (true = added since last submit; false = carried over from a prior turn).
// Stripped before sending to the server.
export interface ClientDocument extends DocumentAttachment {
  id: string;
  isNew: boolean;
}

// Tavily search result type
export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

// API request/response types
export interface ChatRequest {
  thread_id: string;
  message: string;
  mode: 'council' | 'gpt-only' | 'claude-only' | 'supercharged';
  arbiter: boolean;
  images?: ImageAttachment[];
  documents?: DocumentAttachment[];
}

export interface ChatResponse {
  thread_id: string;
  message_id: string;
  gpt_response: string | null;
  claude_response: string | null;
  merge_result: MergeResult | null;
  arbiter_review: string | null;
  mode: 'council' | 'gpt-only' | 'claude-only' | 'supercharged' | 'degraded';
  tokens_used: number;
  estimated_cost: string;
  search_results?: TavilySearchResult[];
  passes_used?: number;
}

// Provider response type
export interface ProviderResponse {
  response: string;
  tokens_used: number;
}

// Message type for frontend state
export interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  images?: ImageAttachment[];
  documents?: DocumentAttachment[];
  gpt_response?: string | null;
  claude_response?: string | null;
  merge_result?: MergeResult | null;
  arbiter_review?: string | null;
  mode?: string;
  estimated_cost?: string;
  search_results?: TavilySearchResult[];
  passes_used?: number;
}

// Thread history message format for API calls
export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  images?: ImageAttachment[];
}
