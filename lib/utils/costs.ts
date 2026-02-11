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
};

export function calculateCost(
  gptTokens: number,
  claudeTokens: number
): number {
  const gptCost = (gptTokens / 1_000_000) * PRICING['gpt-4o'].blended;
  const claudeCost = (claudeTokens / 1_000_000) * PRICING['claude-sonnet'].blended;
  return gptCost + claudeCost;
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
