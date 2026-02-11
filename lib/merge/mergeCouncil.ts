import { callClaude } from '../providers/anthropic';
import { MergeResult, HistoryMessage } from '../types';
import { MERGE_PROMPT, buildMergeMessages } from './prompts';

function extractJSON(text: string): string {
  // First try to parse as-is
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) {
    return trimmed;
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

function validateMergeResult(obj: unknown): obj is MergeResult {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;

  if (typeof o.consensus !== 'string') return false;
  if (!Array.isArray(o.deltas)) return false;
  if (typeof o.confidence !== 'number') return false;
  if (typeof o.summary !== 'string') return false;

  // Validate deltas
  for (const delta of o.deltas) {
    if (!delta || typeof delta !== 'object') return false;
    const d = delta as Record<string, unknown>;
    if (typeof d.topic !== 'string') return false;
    if (typeof d.gpt_position !== 'string') return false;
    if (typeof d.claude_position !== 'string') return false;
    if (typeof d.resolution !== 'string') return false;
  }

  return true;
}

export interface MergeOutput {
  result: MergeResult;
  tokens_used: number;
}

export async function mergeCouncil(
  userQuery: string,
  gptResponse: string,
  claudeResponse: string,
  _threadHistory: HistoryMessage[]
): Promise<MergeOutput | null> {
  const mergeMessage = buildMergeMessages(userQuery, gptResponse, claudeResponse);

  const response = await callClaude(MERGE_PROMPT, [
    { role: 'user', content: mergeMessage },
  ]);

  if (!response) {
    console.error('Merge call failed');
    return null;
  }

  try {
    const jsonStr = extractJSON(response.response);
    const parsed = JSON.parse(jsonStr);

    if (!validateMergeResult(parsed)) {
      console.error('Invalid merge result schema');
      return null;
    }

    return {
      result: parsed,
      tokens_used: response.tokens_used,
    };
  } catch (error) {
    console.error('Failed to parse merge response:', error);
    console.error('Raw response:', response.response);
    return null;
  }
}
