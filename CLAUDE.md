# AI Council — Project Context

## What This Project Is
AI Council is a web-based decision-support tool that sends a user's
query to multiple AI models independently (blind), then merges their
responses into a structured decision artifact using a dedicated merge
prompt. It is NOT a chatbot. It is a decision engine for an
infrastructure systems architect working in oil & gas field operations.

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Hosting**: Vercel
- **Database**: Vercel Postgres + Prisma
- **Models**: OpenAI GPT-4o + Anthropic Claude Sonnet
- **Merge model**: Claude Sonnet (runs merge and arbiter passes)
- **Styling**: Tailwind CSS v4
- **Fonts**: JetBrains Mono (data/output) + IBM Plex Sans (UI/labels)

## Project Structure
```
council-chat/
  app/
    page.tsx
    layout.tsx
    globals.css
    components/
      Header.tsx
      Sidebar.tsx
      ConsensusCard.tsx
      DeltasCard.tsx
      AssumptionsCard.tsx
      NextStepsCard.tsx
      DecisionFiltersCard.tsx
      ArbiterCard.tsx
      RawResponses.tsx
      InputArea.tsx
      LoadingState.tsx
      MetaBar.tsx
      StickyNav.tsx
    api/
      health/route.ts
      threads/route.ts
      threads/[threadId]/route.ts
      chat/route.ts
  lib/
    types.ts
    providers/
      openai.ts
      anthropic.ts
    merge/
      mergeCouncil.ts
      arbiterReview.ts
      prompts.ts
    storage/
      db.ts
      threadsRepo.ts
    utils/
      costs.ts
  prisma/
    schema.prisma
  CLAUDE.md
  .env.local
  package.json
```

## How It Works
1. User sends a message with mode: "council", "gpt-only", or "claude-only"
2. In council mode:
   a. Message + thread history sent to GPT (blind)
   b. Message + thread history sent to Claude (blind)
   c. Both responses sent to merge step (Claude Sonnet LLM call)
   d. Merge returns structured JSON
   e. If arbiter enabled, fourth LLM call attacks the synthesis → returns PROCEED/REVISE/ESCALATE
3. Thread history passes only user messages and prior consensus — never raw individual model responses (prevents cross-contamination)

## Merge Output Schema
```json
{
  "consensus": "direct actionable recommendation",
  "confidence": "high | medium | low",
  "deltas": [
    {
      "topic": "point of disagreement",
      "gpt_position": "what GPT recommends and why",
      "claude_position": "what Claude recommends and why",
      "recommended": "gpt | claude | neither",
      "reasoning": "why this position wins"
    }
  ],
  "unverified_assumptions": ["assumptions made without evidence"],
  "next_steps": ["actionable items, max 5"],
  "decision_filter_notes": "scores against: scalability, friction reduction, field reliability, standardization potential, operational ROI"
}
```

## API Endpoints
- GET  /api/health → { ok: true }
- POST /api/threads → { thread_id }
- GET  /api/threads/:threadId → { thread_id, messages[], created_at }
- POST /api/chat → { thread_id, message, mode, arbiter?, images? }

## UI Features
- Desktop-first, dark theme, industrial-utilitarian
- Two-panel: thread sidebar (left) + main response area (right)
- Consensus most prominent, raw responses collapsed
- Confidence badges, delta cards, arbiter verdict badges
- Side-by-side comparison view for raw responses
- Sticky navigation header with quick-jump buttons
- Drag-and-drop image upload with visual feedback
- Clipboard paste support for images
- Running session cost totals
- Input pinned to bottom, meta bar showing cost/version/mode

## Key Design Principles
- Blind independence: models never see each other's responses
- Structured output: merge produces JSON, not conversational text
- Decision filters on every recommendation
- Degraded mode if one API fails
- No chatbot filler in outputs

## Current Status
MVP is fully functional and deployed to Vercel. UI redesign complete with
industrial dark theme, component-based architecture, and all core features
implemented including image upload, sticky navigation, and side-by-side
response comparison.

## Recent Changes
- Initial scaffold generated via Claude Code
- Merge prompt replaced with strict structured JSON version
- Arbiter prompt verified and implemented
- UI redesign completed (dark theme, two-panel layout, industrial aesthetic)
- Added image upload support with drag-and-drop and clipboard paste
- Implemented side-by-side comparison view for raw responses
- Added running session cost totals with per-query breakdown
- Improved contrast ratios for WCAG AA compliance
- Added sticky navigation header with quick-jump buttons
- Fixed error handling to display errors visibly in UI
- CLAUDE.md created as master context file

## Planned Next
- Add prompt versioning and iteration tracking
- Implement thread persistence and history loading
- Add export functionality for decisions
- Evaluate against Perplexity Model Council for comparison
- Add keyboard shortcuts for navigation
