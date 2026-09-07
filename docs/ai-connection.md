# The AI layer

First Thread separates **AI-assisted design**, **deterministic rehearsal**, and **live business execution**.

## Use AI from the public site

Open **AI designer**, add discovery context, and export the AI brief. Give the brief to your AI tool. It includes the shared vocabulary, current graph, and expected JSON schema. Paste the returned JSON into the designer and validate it.

The application checks the graph and route conditions, marks generated evidence as assumptions, and requires review on AI actions. Applying the result creates or replaces the **proposed** flow. The current flow is preserved.

The proposal is still a hypothesis. Read its assumptions and inspect its actions, signal contracts, decision routes, and estimated handling times.

## Generate proposals directly with a local connection

The repository includes a local Node service that calls the OpenAI Responses API with structured outputs. GitHub Pages hosts only the public browser app; API credentials never belong in that app or in a workspace export.

1. Use Node 24 and run `npm ci`.
2. Copy `.env.example` to `.env.local`.
3. Set `OPENAI_API_KEY` to your API key and `AI_MODEL` to a model available in your API account that supports structured outputs. Keep `.env.local` out of Git.
4. Run `npm run dev:ai`.
5. Open `http://127.0.0.1:5274`. **Generate with local AI** is enabled when the service has both configuration values.

Generating sends the selected flow, its trigger/outcome, and the entered discovery notes to OpenAI. It can incur API usage. The request uses `store: false`, a strict JSON schema, a response-token bound, and a timeout. It supplies no execution tools. The service binds to loopback and accepts browser proposal requests only from the local app on port 5274.

The key remains in the Node process. There is no field for entering or saving it in the public site. The configured model is deliberately not hardcoded.

Reference: [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

## What rehearsal does

The rehearsal engine follows the current and proposed graph using the same explicit case inputs. It checks required context, selects one matching signal route, pauses at review gates, and records the modeled actions and signals.

AI confidence and tool failure are **test inputs**, not measured model behavior. Confirming review means assuming an output met its contract; no model output is generated in the rehearsal. A failed or uncertain AI action requires explicit simulated human takeover. A rejection emits no downstream output.

The handling-minute comparison uses entered assumptions for the traversed route. Proposed handling time includes review. Waiting is shown separately and is not automatically reduced. There are no measured ROI or efficiency claims.

## What live orchestration still needs

Real connectors, authenticated reviewers, durable case and event storage, action-level permissions, idempotency keys, retry and timeout handling, reconciliation of uncertain writes, actual outcome receipts, and evaluation against business evidence.

The current local AI service produces design proposals only. Neither it nor the public rehearsal makes bookings, routes actual referrals, updates orders, or takes other business actions.

## Validation boundary

The local service is tested with controlled provider responses, including absent credentials, foreign origins, invalid output, and incomplete output. No paid live model call was made during this revision because no API key/model was configured in the environment.
