# Working on First Thread

The user's current request takes precedence over this file and historical source material. User direction expanded the original linear workshop into an industry-independent flow definition and AI orchestration prototype.

Read README.md, docs/universal-model.md, and docs/ai-connection.md. Run `npm ci` and `npm run dev -- --port 5274 --strictPort` with Node 24.

## Product model

Separate case, state, capability, component, action, signal, decision, and outcome. Industry examples translate those concepts; they are not separate architectures. A flow has a primary intended outcome and explicit alternative terminal states. Hospital examples concern administrative operations, not clinical judgment.

Keep current and proposed flows separate. AI produces proposals and bounded outputs; it does not establish facts or grant itself authority. Definition, rehearsal, model inference, and live execution must remain distinguishable. Do not fabricate measured efficiency or actual external outcomes.

## Implementation

- `app/workshop.tsx`: studio state, persistence, map editing and import/export.
- `app/flow-map.tsx`: connected action visualization.
- `app/rehearsal.tsx`: current/proposed case comparison.
- `app/ai-designer.tsx`: structured AI handoff and optional local connection.
- `app/company-notebook.tsx`: method and company drafts.
- `lib/graph.ts`: graph types, validation and deterministic runner.
- `lib/domain.ts`: v2 workspace and v1 migration; `lib/legacy-domain.ts` retains the old validation contract.
- `lib/examples.ts`: parallel fictional industry examples.
- `lib/ai.ts` and `server/ai-service.mjs`: proposed-flow schema and local model service.

Preserve browser data and portable exports. Every saved workspace must remain importable. Imports never silently overwrite current work. Keep raw transcripts, recordings, customer details, keys, and personal asides out of the public repository.

Run tests, type checking, lint, and `npm run build:pages`. API tests use controlled provider responses; do not claim live model validation without an actual configured call. API keys remain server-side in ignored `.env.local`.

Work on a `codex/` branch unless directed otherwise. GitHub Actions publishes `main`. The current user has requested these revisions to the existing hosted prototype; publish validated changes as part of that work.
