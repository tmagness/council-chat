// Delta represents a point of disagreement between models
export interface Delta {
  topic: string;
  gpt_position: string;
  claude_position: string;
  recommended: 'gpt' | 'claude' | 'neither';
  reasoning: string;
}

// Result of merging GPT and Claude responses
export interface MergeResult {
  consensus: string;
  confidence: 'high' | 'medium' | 'low';
  deltas: Delta[];
  unverified_assumptions: string[];
  next_steps: string[];
  decision_filter_notes: string;
}

// API request/response types
export interface ChatRequest {
  thread_id: string;
  message: string;
  mode: 'council' | 'gpt-only' | 'claude-only';
  arbiter: boolean;
}

export interface ChatResponse {
  thread_id: string;
  message_id: string;
  gpt_response: string | null;
  claude_response: string | null;
  merge_result: MergeResult | null;
  arbiter_review: string | null;
  mode: 'council' | 'gpt-only' | 'claude-only' | 'degraded';
  tokens_used: number;
  estimated_cost: string;
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
  gpt_response?: string | null;
  claude_response?: string | null;
  merge_result?: MergeResult | null;
  arbiter_review?: string | null;
  mode?: string;
  estimated_cost?: string;
}

// Thread history message format for API calls
export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}
