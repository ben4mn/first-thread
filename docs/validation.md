# Validation · September 7, 2026

## Checks performed

- Eight automated domain tests pass: custom workspace round trip; invalid import rejection; duplicate identifiers, malformed evidence, and size constraints; reorder boundaries and immutability; complete Markdown handoff; empty real-scenario creation; UUID generation on plain HTTP local-network origins; and consistent UTF-8 byte limits across saved work and exports.
- TypeScript checking passes.
- Application, domain, and test lint passes. Generated UI primitives remain unchanged and are outside the lint command.
- The Pages production build passes. A post-build check verifies the entry document, JavaScript, stylesheet, and favicon at the correct `/first-thread/` asset paths.
- The local development route returns HTTP 200. The production static build is also checked over HTTP at its repository subpath.
- The public deployment is published by the repository's GitHub Actions workflow, which repeats tests, type checking, lint, and the Pages build.

Browser interaction automation and screenshot-based visual review were not performed in this build. The first workshop remains the test of whether the workflow and vocabulary fit real discovery.

## Runtime boundary

GitHub Pages receives the static browser bundle only. It uses the same `Workshop` React component as local development. It has no server endpoints, system connectors, AI calls, or shared persistence. Input text is rendered as React text, not inserted as HTML. Imported workspaces are validated before the user can replace current work.

The supplied scaffold's npm audit reports 11 dependency advisories (8 high, 2 moderate, 1 low), affecting development/server/image-processing packages including Vinext, Vite, React Server DOM, and Cloudflare tooling. Those server and image-processing runtimes are not deployed to Pages. The lockfile is retained rather than applying broad breaking upgrades. Review and update the scaffold dependencies before turning this workshop into a server-backed product.

## Limits to exercise together

Use one editing tab per browser. Export before moving between local and hosted versions, changing devices, or replacing a workspace. Persistence is not a shared collaboration service.

The map records a single ordered route. Handoff signal names are entered independently so missing or inconsistent context remains visible. There is no automatic inference or connectivity validation. “A better state” is a written hypothesis and first-move plan.
