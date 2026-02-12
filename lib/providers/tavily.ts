// Tavily Search API integration for AI-optimized web search

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilyAPIResponse {
  results: {
    title: string;
    url: string;
    content: string;
    score: number;
  }[];
  answer?: string;
  query: string;
}

/**
 * Search using Tavily API for AI-optimized results
 * Returns top 5 relevant results with title, URL, and content snippet
 */
export async function searchTavily(query: string): Promise<TavilySearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    console.warn('TAVILY_API_KEY not set, skipping web search');
    return [];
  }

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'advanced',
        include_answer: false,
        include_raw_content: false,
        max_results: 5,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error('Tavily API error:', error);
      return [];
    }

    const data: TavilyAPIResponse = await res.json();

    return data.results.map((result) => ({
      title: result.title,
      url: result.url,
      content: result.content,
      score: result.score,
    }));
  } catch (error) {
    console.error('Tavily search failed:', error);
    return [];
  }
}

/**
 * Format search results for inclusion in LLM prompts
 */
export function formatSearchContext(results: TavilySearchResult[]): string {
  if (results.length === 0) {
    return '';
  }

  const formatted = results
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content}`
    )
    .join('\n\n');

  return `### Web Search Results (Real-Time Context)\n\n${formatted}\n\n---\n`;
}
