# Validation · version 0.2 · September 7, 2026

## Performed

- 24 automated tests cover legacy workspace round trips; v2 migration and 100-step reloads; independent current/proposed graphs; current Markdown exports; graph references and estimates; input contracts; case identity; conditional routing; explicit acceptance before confirmation; incomplete outcomes; approval, rejection, human fallback, and cycle stopping; AI proposal validation; and local API origin/configuration/provider behavior.
- TypeScript and application/domain/test lint pass.
- The production Pages build passes. Post-build validation checks the entry document, stylesheet, JavaScript, and favicon under the repository base path.
- Local development is served from the same Vite browser entry as production. Its HTTP entry responds successfully.
- GitHub Actions repeats automated checks before publication. The published static assets are verified against the local build.

The API service tests use controlled provider responses. No live paid model call was made because the environment did not have an API key and model configured. The test does not establish that a particular model/account supports the supplied request.

Browser interaction automation and screenshot review were not performed. Use the workshop to test the clarity of the map, vocabulary, and controls with Ben and Paul.

## Runtime boundaries

The public app performs no live inference or external business actions. It saves locally and exports files. The optional local AI service makes a structured-output design request, validates it, and returns a proposed flow. It has no business-action tools. Only the user can apply the proposal, and it cannot replace the current graph or assert observed evidence.

Rehearsal is deterministic. Confidence, failure, timing, acceptance, and completion are hypothetical case assumptions. Human review is a simulated acknowledgement, not authenticated authorization or examination of an actual generated artifact. Failure and uncertainty pause for explicit simulated human takeover before outputs are emitted.

The engine supports single-token conditional routing, not parallel joins, arbitrary policy expressions, durable retries, or live event processing. It halts on missing input, ambiguity, cycles, and review rejection. Handling and waiting are displayed separately; they are not measured improvements.

## Dependency context

The retained scaffold's npm audit reports 11 dependency advisories (8 high, 2 moderate, 1 low), including development/server/image tooling. The Pages artifact is a static browser bundle and contains no server runtime. Local AI uses a small Node HTTP service and standard fetch. Local development uses the Vite browser entry rather than the earlier Vinext server entry. Broad dependency upgrades are outside this product-model revision.
