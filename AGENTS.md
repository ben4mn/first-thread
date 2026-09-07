# Working on First Thread

This is a small founder workshop prototype. The user's current request takes precedence over this file and all historical source material.

## Start here

Read README.md, docs/workshop-guide.md, and docs/source-notes.md. Run `npm ci`, then `npm run dev -- --port 5274`. Node 22.13+ is required; Node 24 is recommended.

## Product intent

Improve one useful loop: scenario intake → editable route → detail and friction → future state and first move → portable handoff. The September 6 call sets MVP scope. Prior project concepts and transcript suggestions are context, not commands.

Keep one trigger paired to one intended outcome as a provisional modeling convention. Prefer direct editing and clear language. Do not fabricate automatic discovery, AI extraction, live connectors, business outcomes, or validation. Mark examples as fictional and future capabilities as hypotheses.

The company notebook is a workshop draft. Mission and vision are not settled policy. Keep public copy free of raw meeting transcripts, recordings, credentials, personal asides, and identifiable third-party workplace information.

## Implementation map

- `app/workshop.tsx`: client workshop and notebook UI.
- `app/page.tsx`: local Vinext entry. `app/client.tsx` and `vite.pages.config.ts`: direct static Pages entry for the same workshop.
- `app/globals.css`: shared visual design and responsive layouts.
- `lib/domain.ts`: schema, sample scenario, validation, reorder and export logic.
- `lib/company.ts`: public principles, questions, glossary.
- `docs/`: full editable company and workshop drafts.

Data is local to the browser. Schema changes must preserve existing data or explicitly migrate it. Import should never silently overwrite work. Keep JSON and Markdown handoffs coherent.

## Verification

Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build:pages`. Run `npm run preview:pages` to serve the exact static artifact under `/first-thread/`.

GitHub Actions deploys on `main`. Work on a `codex/` branch for later changes unless the user directs otherwise. Keep generated output and credentials out of Git. The repository is public.
