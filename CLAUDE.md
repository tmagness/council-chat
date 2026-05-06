# AI Council — Multi-Model GAI Pipeline

## Stack
- Next.js + React (frontend)
- Anthropic API (Claude) + OpenAI API (GPT-5.4)
- Generate → Attack → Improve (GAI) pipeline
- Halo-inspired UI theme

## How It Works
1. **Generate** — GPT-5.4 produces initial response
2. **Attack** — Claude critiques it
3. **Improve** — GPT-5.4 or Claude refines based on critique
4. **Arbiter** — synthesizes final output

## Active Backlog
- **Consensus Quality Indicator** — evaluates whether 100% model consensus is meaningful or both models are confidently wrong
  - Needs: reasoning quality score, calibration source flag, knowledge-cutoff-risk flag
  - Trigger: build after first real beta users provide feedback data
  - Do NOT build this yet — wait for beta feedback

## Key Rules
- The GAI loop order (Generate → Attack → Improve) is intentional — do not reorder without discussion
- Model selection (which model does which role) is a deliberate design decision — ask before changing
- UI theme is Halo-inspired — maintain aesthetic consistency on any frontend changes

## Off-Limits
- Do not change which model handles which pipeline stage without explicit instruction
- Do not add new API providers without discussion (cost + key management implications)

## Build Commands
- `npm run dev`
- `npm run build`
- `npm run lint`
