# First Thread

A small scenario workshop for Ben and Paul. Start with one trigger and one intended outcome, map the route between them, inspect the handoffs, and choose a first move toward a better state.

**[Open the prototype](https://ben4mn.github.io/first-thread/)** · **[Company notebook](https://ben4mn.github.io/first-thread/#/company)** · **[Workshop guide](docs/workshop-guide.md)**

First Thread is a temporary name. This is a new distribution; the earlier SignalBraid and Atlas projects were context, not the starting codebase.

## The useful loop

1. Start with the fictional example, or create a scenario with one trigger and one intended outcome.
2. Add the people, teams, and tools along its route. Record ownership, incoming/outgoing signals, surfaces, channels, and friction.
3. Select a step for its detailed view; edit and reorder it as the conversation changes your understanding.
4. Distinguish observed evidence, reported information, and assumptions. Capture supporting notes and adjacent dependencies.
5. Describe State B, a first move, the hypothesis, success evidence, an owner, and a fallback.
6. Export a Markdown brief or a JSON workspace. Paul can import the workspace on his device and continue.

The company notebook contains editable mission and vision statements, working principles, provisional vocabulary, open business questions, and workshop notes. The fuller source-controlled drafts live in [`docs/`](docs/).

## Run locally

Use **Node 22.13 or newer** (Node 24 recommended) and npm. No API key or paid service is needed.

```bash
npm ci
npm run dev -- --port 5274
```

Open `http://localhost:5274`. The development server also listens on the local network so a workshop participant can open the printed Network address. Local network access depends on the computers' firewall and VPN settings.

To ask a coding agent to help, open this repository in your editor and say: “Read AGENTS.md and run First Thread locally.”

## What saves, and where

- Changes save immediately to this browser's local storage under `first-thread.workspace.v1`.
- Work is device- and origin-specific. The local app and GitHub Pages have separate storage.
- **Export workspace** includes every scenario and the edited company statements/notes. **Import workspace** validates the file and asks before replacing the current workspace. Export a backup first.
- **Export brief** creates a readable Markdown record of the selected scenario. Company notes have their own Markdown export.
- There is no account, shared database, live collaboration, analytics, or background network submission of workshop notes. Clearing browser storage clears local work.
- The public demo includes only fictional operational data and curated company synthesis. Do not commit private customer information, raw meeting transcripts, recordings, or credentials to this public repository.

## Deliberate limits

This is a manual workshop prototype. It does not transcribe audio, extract a map with AI, discover systems, verify evidence, estimate ROI, or execute operational changes. A future state is a written hypothesis and first experiment, not a second executable graph.

A scenario has a linear ordered route; one trigger and one intended outcome is a **working convention**, not a claim about all business processes. Record branches and adjacent dependencies in notes, or split distinct outcomes into separate scenarios. Shared components and branched maps are future workshop decisions.

Exports support up to 100 scenarios, 100 steps per scenario, 40,000 characters per text field, and 2 MB total in UTF-8. Edits that would exceed the total are rejected before changing the workspace, so an exported backup remains importable. If storage is blocked or full, the app reports that changes are only in memory and offers export. One active editing tab is recommended; simultaneous browser tabs do not merge changes.

## Validate and publish

```bash
npm test
npm run typecheck
npm run lint
npm run build:pages
npm run preview:pages
```

The production preview runs at `http://localhost:5275/first-thread/`. GitHub Actions runs the checks, builds a static browser app, and deploys `dist/client` to GitHub Pages after a push to `main`. The app uses hash navigation so company notebook links survive refresh on static hosting.

`npm run build` makes a root-path build. `npm run build:pages` sets `/first-thread` as the repository base path. If the repository is renamed, update this script, source links in `app/workshop.tsx`, and the preview script.

The scaffold uses React, TypeScript, Vinext/Vite, and the supplied UI primitives. Local development uses Vinext; the Pages build compiles the same React workshop directly with Vite so the public app needs no server or React Server Component runtime. No server code or credentials are deployed. Lint covers application, domain, and test code; generated UI primitives are kept intact. See [validation notes](docs/validation.md).

## Why this scope

The **September 6, 2026** call takes precedence: V1 is for the founders; onboard one scenario; make its route legible; refine one useful piece. The earlier conversation supplies the longer ambition. [Source notes](docs/source-notes.md) distinguish source statements from proposed language and implementation choices.
