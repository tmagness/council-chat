// Token pricing (USD per 1M tokens). Council tier rates verified May 2026.
// Supercharged tier rates retained at legacy values (out of scope this PR).
const PRICING = {
  // Council tier (current)
  // Source: https://developers.openai.com/api/docs/pricing
  'gpt-5.4': {
    input: 2.5,
    output: 15,
    blended: 8.75, // (2.5 + 15) / 2
  },
  // Source: https://platform.claude.com/docs/en/docs/about-claude/models
  'claude-sonnet-4-6': {
    input: 3,
    output: 15,
    blended: 9, // (3 + 15) / 2
  },

  // Supercharged tier + legacy references (do not bump in this PR)
  'gpt-4o': {
    input: 2.5,
    output: 10,
    blended: 6.25,
  },
  'claude-sonnet': {
    input: 3,
    output: 15,
    blended: 9,
  },
  'claude-opus': {
    input: 15,
    output: 75,
    blended: 45,
  },
};

// Tavily search cost estimate per query
const TAVILY_COST_PER_SEARCH = 0.01;

export function calculateCost(
  gptTokens: number,
  claudeTokens: number,
  useOpus: boolean = false
): number {
  const claudeModel = useOpus ? 'claude-opus' : 'claude-sonnet-4-6';
  const gptCost = (gptTokens / 1_000_000) * PRICING['gpt-5.4'].blended;
  const claudeCost = (claudeTokens / 1_000_000) * PRICING[claudeModel].blended;
  return gptCost + claudeCost;
}

export function calculateSuperchargedCost(
  gptTokens: number,
  claudeTokens: number,
  includeSearch: boolean = true
): number {
  const gptCost = (gptTokens / 1_000_000) * PRICING['gpt-4o'].blended;
  const claudeCost = (claudeTokens / 1_000_000) * PRICING['claude-opus'].blended;
  const searchCost = includeSearch ? TAVILY_COST_PER_SEARCH : 0;
  return gptCost + claudeCost + searchCost;
}

export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(2)}`;
}

export function calculateAndFormat(
  gptTokens: number,
  claudeTokens: number
): string {
  const cost = calculateCost(gptTokens, claudeTokens);
  return formatCost(cost);
}
