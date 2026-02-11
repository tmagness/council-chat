import { callClaude } from '../providers/anthropic';
import { MergeResult, HistoryMessage } from '../types';
import { MERGE_PROMPT, buildMergeMessages } from './prompts';

/**
 * Extract JSON from LLM response, handling markdown fences and extra text
 */
function extractJSON(text: string): string {
  const trimmed = text.trim();

  // If it starts with {, assume it's raw JSON
  if (trimmed.startsWith('{')) {
    // Find the matching closing brace
    let depth = 0;
    let end = 0;
    for (let i = 0; i < trimmed.length; i++) {
      if (trimmed[i] === '{') depth++;
      if (trimmed[i] === '}') depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
    return trimmed.substring(0, end);
  }

  // Try to extract from markdown code blocks
  const jsonBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim();
  }

  // Try to find JSON object in text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  return trimmed;
}

/**
 * Validate that parsed object matches MergeResult schema
 */
function validateMergeResult(obj: unknown): obj is MergeResult {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;

  // Required string fields
  if (typeof o.consensus !== 'string') return false;
  if (typeof o.decision_filter_notes !== 'string') return false;

  // Confidence must be one of the allowed values
  if (!['high', 'medium', 'low'].includes(o.confidence as string)) return false;

  // Arrays must exist
  if (!Array.isArray(o.deltas)) return false;
  if (!Array.isArray(o.unverified_assumptions)) return false;
  if (!Array.isArray(o.next_steps)) return false;

  // Validate each delta
  for (const delta of o.deltas) {
    if (!delta || typeof delta !== 'object') return false;
    const d = delta as Record<string, unknown>;
    if (typeof d.topic !== 'string') return false;
    if (typeof d.gpt_position !== 'string') return false;
    if (typeof d.claude_position !== 'string') return false;
    if (!['gpt', 'claude', 'neither'].includes(d.recommended as string)) return false;
    if (typeof d.reasoning !== 'string') return false;
  }

  // Validate array contents are strings
  for (const item of o.unverified_assumptions as unknown[]) {
    if (typeof item !== 'string') return false;
  }
  for (const item of o.next_steps as unknown[]) {
    if (typeof item !== 'string') return false;
  }

  return true;
}

export interface MergeOutput {
  result: MergeResult;
  tokens_used: number;
}

/**
 * Merge GPT and Claude responses into a structured decision artifact.
 * Uses an LLM call (not string manipulation) to synthesize the responses.
 * Includes retry logic if JSON parsing fails.
 */
export async function mergeCouncil(
  userQuery: string,
  gptResponse: string,
  claudeResponse: string,
  threadHistory: HistoryMessage[]
): Promise<MergeOutput | null> {
  // Build thread context string for the merge prompt
  const historyContext = threadHistory
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  const mergeMessage = buildMergeMessages(
    userQuery,
    gptResponse,
    claudeResponse,
    historyContext
  );

  // First attempt
  let response = await callClaude(MERGE_PROMPT, [
    { role: 'user', content: mergeMessage },
  ]);

  if (!response) {
    console.error('Merge call failed');
    return null;
  }

  let totalTokens = response.tokens_used;

  // Try to parse the response
  let parsed: unknown;
  try {
    const jsonStr = extractJSON(response.response);
    parsed = JSON.parse(jsonStr);
  } catch (error) {
    console.error('First JSON parse attempt failed:', error);
    parsed = null;
  }

  // If first attempt failed, retry with explicit instruction
  if (!parsed || !validateMergeResult(parsed)) {
    console.log('Retrying merge with stricter instruction...');

    const retryMessage = `Your previous response was not valid JSON or did not match the required schema. Return ONLY the JSON object with these exact fields:
- consensus (string)
- confidence ("high" | "medium" | "low")
- deltas (array)
- unverified_assumptions (array of strings)
- next_steps (array of strings)
- decision_filter_notes (string)

No markdown, no explanation, no preamble. Just the JSON object.

Original request:
${mergeMessage}`;

    response = await callClaude(MERGE_PROMPT, [
      { role: 'user', content: retryMessage },
    ]);

    if (!response) {
      console.error('Merge retry call failed');
      return null;
    }

    totalTokens += response.tokens_used;

    try {
      const jsonStr = extractJSON(response.response);
      parsed = JSON.parse(jsonStr);
    } catch (error) {
      console.error('Second JSON parse attempt failed:', error);
      console.error('Raw response:', response.response);
      return null;
    }
  }

  // Final validation
  if (!validateMergeResult(parsed)) {
    console.error('Invalid merge result schema after retry');
    console.error('Parsed object:', JSON.stringify(parsed, null, 2));
    return null;
  }

  return {
    result: parsed,
    tokens_used: totalTokens,
  };
}
