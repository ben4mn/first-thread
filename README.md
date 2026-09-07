# First Thread · Flow studio

An industry-independent workshop for understanding how digital work moves between people, systems, and AI.

**[Open the studio](https://ben4mn.github.io/first-thread/)** · **[Model & method](https://ben4mn.github.io/first-thread/#/method)** · **[Company notebook](https://ben4mn.github.io/first-thread/#/company)**

The first version mapped a linear scenario. Version 0.2 models a **business case moving through states**, with reusable capabilities, components, actions, signal contracts, decisions, exceptions, authorization, and outcome evidence. Fictional OTA, hospital-administration, and commerce flows use the same grammar.

## What works

- Define and edit your own flow; capture the case, trigger, outcome, discovery notes, future state, and first pilot.
- Add actions and reusable components, edit their contracts, position them on a swimlane map, and connect named conditional signals.
- Inspect capabilities independently of the software or teams providing them.
- Keep separate current and proposed flows. Describe bounded AI tasks, expected outputs, review, and fallback.
- Rehearse normal, incomplete, exception, uncertain-AI, and failed-tool cases. Review/reject before proceeding; inspect the path and export a trace.
- Compare entered handling/waiting assumptions for the route actually traversed. No measured efficiency or ROI is claimed.
- Export an AI design brief and validate a structured proposal, or use the optional local API connection to generate proposals directly.
- Edit company mission, vision, and workshop notes. Export/import complete workspaces and readable Markdown briefs.

## Run locally

Use **Node 24** and npm:

```bash
npm ci
npm run dev -- --port 5274 --strictPort
```

Open `http://127.0.0.1:5274`. The public studio needs no API key. To expose a normal local workshop to your LAN, explicitly add `--host 0.0.0.0`; local AI remains loopback-only.

For direct AI drafting, configure `.env.local` and run `npm run dev:ai`. See [AI connection](docs/ai-connection.md). No API key or model was configured during this build; provider behavior was tested with controlled responses.

## Where work lives

Workspaces save in browser storage under `first-thread.workspace.v2`. Existing v1 workspaces and exports migrate with their original notes and linear route preserved. The original v1 browser value is retained as a recovery source. If only the untouched stock demo existed, the new examples open first and the original demo is retained.

Current and proposed graphs are saved independently. Imports validate before a replacement confirmation. Export before changing devices, switching local/hosted origins, or replacing a workspace. One editing tab is recommended; concurrent tabs do not merge changes.

The workspace limit is 2 MB UTF-8. Text fields support 40,000 characters. The UI supports 100 flows and 100 actions per flow; migration accepts additional terminal nodes needed to preserve legacy maps. Invalid or oversized changes are rejected before replacement.

Public assets contain only fictional examples and curated company synthesis. Workshop input is not sent anywhere by the public site. Local AI sends the selected design context to OpenAI only when explicitly requested. Raw private transcripts, recordings, and credentials are not included in this public repository.

## Deliberate runtime boundary

**Definition:** a map of what should happen. **Rehearsal:** a deterministic trace of a hypothetical case. **AI design:** a structured model proposal. **Live operation:** a future execution service with real connectors, durable state, authorization, and outcome receipts.

The public prototype and optional local AI service do not execute business actions. AI review in rehearsal confirms an assumption that a contract was satisfied; it does not review an actual generated artifact. Failure/uncertainty pauses for human fallback rather than fabricating completion.

Branching supports explicit context-ready and exception flags. Parallel joins, arbitrary policy expressions, timed retries, shared cross-flow components, external event ingestion, and durable live execution remain future work.

## Learn and workshop

- [Workshop guide](docs/workshop-guide.md)
- [Universal model research and primary sources](docs/universal-model.md)
- [Orchestration design and research](docs/orchestration-design.md)
- [Company direction](docs/company-direction.md)
- [Original conversation synthesis](docs/source-notes.md)
- [Validation and known limits](docs/validation.md)

## Validate and deploy

```bash
npm test
npm run typecheck
npm run lint
npm run build:pages
npm run preview:pages
```

The production preview runs under `http://localhost:5275/first-thread/`. GitHub Actions repeats checks and publishes the static `dist/client` artifact after a push to `main`. No server or API credential is published. Local development and Pages now use the same Vite browser entry.

`npm run build` creates a root-path build. If the repository is renamed, update the Pages base path, preview prefix, and repository links.

The scaffold uses React, TypeScript, Vite, and supplied UI primitives. Generated components and the dependency lockfile are retained. Start a coding agent with “Read AGENTS.md and run First Thread locally.”
