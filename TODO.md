# TODO — Known follow-ups

- Fix `[Image attachment]` fallback string in `app/api/chat/route.ts:240` — should distinguish doc-only vs image-only submits in thread sidebar display.
- Add redaction logic to merge prompt template (lib/merge/prompts.ts) so synthesis does not reproduce sensitive content from documents marked "do not share" or similar in the consensus field. Surfaced by arbiter critique on commit d948726 smoke test.
- Add token/cost warning UI when user prompt + attached docs exceed ~30k tokens. Heavy Council queries now run $0.30-$0.60 vs typical $0.02-$0.04. Prevents surprise bills if platform shared with beta users. Existing tokens_used field in the response can drive the warning.
