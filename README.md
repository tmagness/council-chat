# AI Council

A "two-model council" web app that sends user messages to GPT-4o and Claude independently, then merges their responses into a structured decision artifact.

## Features

- **Council Mode**: Query both GPT-4o and Claude simultaneously, then merge responses into a consensus
- **Blind Independence**: Models don't see each other's responses; only prior consensus is shared
- **Disagreement Tracking**: Identifies and documents points where models disagree
- **Arbiter Review**: Optional third-party review of the merged consensus
- **Degraded Mode**: Gracefully handles single-provider failures
- **Cost Tracking**: Estimates API costs for each query

## Setup

1. Clone the repository and install dependencies:

```bash
cd council-chat
npm install
```

2. Create `.env` file with your API keys:

```bash
cp .env.example .env
# Edit .env with your actual keys
```

3. Initialize the database:

```bash
npx prisma generate
npx prisma db push
```

4. Start the development server:

```bash
npm run dev
```

5. Open http://localhost:3000

## Environment Variables

- `OPENAI_API_KEY` - Your OpenAI API key
- `ANTHROPIC_API_KEY` - Your Anthropic API key
- `DATABASE_URL` - Database connection string (SQLite for dev, PostgreSQL for production)
- `PROMPT_VERSION` - Version string for prompt tracking

## API Endpoints

### Health Check
```
GET /api/health
Response: { "ok": true }
```

### Create Thread
```
POST /api/threads
Response: { "thread_id": "..." }
```

### Get Thread
```
GET /api/threads/[threadId]
Response: { "thread_id": "...", "messages": [...] }
```

### Chat
```
POST /api/chat
Body: {
  "thread_id": "...",
  "message": "What VPN solution for remote oil sites?",
  "mode": "council" | "gpt-only" | "claude-only",
  "arbiter": true | false
}
Response: {
  "thread_id": "...",
  "message_id": "...",
  "gpt_response": "...",
  "claude_response": "...",
  "merge_result": {
    "consensus": "...",
    "deltas": [...],
    "confidence": 0.85,
    "summary": "..."
  },
  "arbiter_review": "...",
  "mode": "council",
  "tokens_used": 1234,
  "estimated_cost": "$0.0123"
}
```

## Deployment (Vercel)

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. For production, use a PostgreSQL database (update `DATABASE_URL` and `prisma/schema.prisma` provider)

## Architecture

### Blind Independence
Both models are called via `Promise.all()` - neither waits for the other. Thread history contains only user messages and prior consensus, never raw model responses.

### Degraded Mode
- If both providers fail → return error
- If one provider fails → return available response, skip merge
- If merge fails → return both raw responses
- If arbiter fails → return everything else without arbiter review

### Thread History Format
```typescript
// Prior turns
{ role: "user", content: userMessage }
{ role: "assistant", content: priorConsensus }
// Current turn
{ role: "user", content: currentMessage }
```
