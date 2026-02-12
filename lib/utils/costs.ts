// Token pricing (USD per 1M tokens) - as of early 2025
const PRICING = {
  'gpt-4o': {
    input: 2.5,
    output: 10,
    // Using blended rate for simplicity since we track total tokens
    blended: 6.25, // approximate average
  },
  'claude-sonnet': {
    input: 3,
    output: 15,
    blended: 9, // approximate average
  },
  'claude-opus': {
    input: 15,
    output: 75,
    blended: 45, // approximate average for premium model
  },
};

// Tavily search cost estimate per query
const TAVILY_COST_PER_SEARCH = 0.01;

export function calculateCost(
  gptTokens: number,
  claudeTokens: number,
  useOpus: boolean = false
): number {
  const claudeModel = useOpus ? 'claude-opus' : 'claude-sonnet';
  const gptCost = (gptTokens / 1_000_000) * PRICING['gpt-4o'].blended;
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
