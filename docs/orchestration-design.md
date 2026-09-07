# First Thread: industry-agnostic orchestration workshop

Design recommendation · September 7, 2026 · Proposed product choices, not founder commitments

## Main recommendation

Make the core product a **model of how a case becomes an outcome across a business**, with a reversible design workspace and an executable rehearsal. A case might concern a disrupted trip, an administrative referral, an invoice, a return, an incident, or onboarding. Industry changes the actors, records, rules, and acceptable evidence. It does not require a different modeling language.

The compelling product loop is: **describe the business situation → map actors and signals → inspect decisions and friction → design a change → rehearse the route → compare evidence and effort → export a bounded pilot**.

The present implementation is useful for recording a linear interview. Its structural limits prevent the next hypothesis: a step currently combines a tool, owner, incoming and outgoing strings, while the route is an ordered array. There are no explicit conditions, second graph, executable contracts, or run state. Merely changing the sample from SaaS to travel would leave these limits intact.

## A reusable language

| Concept | Meaning | Operational question |
| --- | --- | --- |
| Scenario | A bounded class of situations worth improving | What starts this work, and what result matters? |
| Case | One instance moving through the scenario | Which booking, referral, request, or invoice is this? |
| Trigger | An event or satisfied condition that creates a case | What happened, and how do we identify duplicates? |
| Component | A person, team, system, or AI capability | Who or what can do this work? |
| Step | An action or decision performed by a component | What changes here, and who owns it? |
| Signal | An explicit piece of information crossing a boundary | What does the receiver need to know, and what does this prove? |
| Surface | Where a participant encounters or acts on the work | Portal, inbox, queue, dashboard, API? |
| Channel | How the signal travels | Form submission, email, API, webhook, phone? |
| Rule | A condition controlling which route may proceed | What must be true before this action is allowed? |
| Outcome | A business result with evidence of completion | What observation establishes success? |
| Friction | An obstacle in a step or handoff | Waiting, missing context, ambiguous ownership, re-entry, failure? |

Keep the founding one-trigger/one-intended-outcome convention as a useful workshop boundary, while representing exceptions, abandoned cases, and unsuccessful terminal states. Avoid implying that real operations have only one possible ending.

**Important distinctions:** a component is not a step; one system can perform many steps. A requested action is not a completed action. A signal does not automatically establish its truth. An API success is not necessarily the intended business outcome. AI is a component capability, not a magical layer with implicit access to every system.

## Smallest convincing graph

Use a directed graph with five node roles: trigger, action, decision, human review, outcome. Give action nodes an execution mode: manual, system, AI assist, or AI action. Group by responsibility (customer/external participant, business team, systems), not by a mandatory industry funnel. A system map can later reuse component IDs across scenarios.

Make connections first-class. Each edge shows a signal label and a route condition. Node selection opens its component, owner, incoming requirements, produced facts, friction, evidence, and action boundary. Edge selection shows sender/receiver, required fields, classification, source, and trigger condition. Avoid using incoming/outgoing free text as the only contract.

Store baseline and proposed versions as separate graphs with stable node and edge IDs. Start proposed as a copy; accept explicit changes into it. A compact comparison should identify added/removed/changed steps, handoffs, AI opportunities, and approvals. Preserve existing work by migrating each old step into an action node and consecutive incoming/outgoing text into edges, with missing structured fields left unknown. Preserve every legacy field in the inspector/export.

## Rehearsal that really runs

Ship a deterministic browser engine that executes the actual graph data. Name it **Rehearsal**, with a persistent mode label: “Local rehearsal · sample data · no systems contacted.” Do not call it live AI, replay of a real process, or prediction. A model call can enhance parts later without changing this contract.

A case supplies input values such as `contextComplete`, `policyClear`, `requiresReview`, and `toolAvailable`. Each step tests requirements, produces declared fields, or pauses. Decisions evaluate saved branch conditions, not a hard-coded animation index. The runner traverses only satisfied edges and shows the active node. Trace rows explain input → rule/action → result → next signal.

Useful node states are ready, running, waiting-for-input, waiting-for-review, completed, failed, and skipped. Run endings are outcome-confirmed, escalated, blocked, cancelled, and failed. Do not paint a fallback ending as the original intended outcome unless its evidence rule is met.

The user can step forward, run to the next pause, approve/reject a review, inspect signals, and restart with the same inputs. Editing the graph invalidates any old comparison or visibly marks its trace as belonging to the previous version.

Provide these four test cases for every fictional scenario:

1. **Complete case:** all required context present; approved route reaches the intended outcome.
2. **Missing context:** required signal absent; request input or route to an owner; no downstream action.
3. **Judgment required:** ambiguous or out-of-policy case pauses at review; reject routes to a real alternative ending.
4. **System unavailable:** tool fails; apply bounded retry or fallback; no fabricated receipt or success.

Even without an API connection, this is useful executable work: the founders can discover missing rules, unowned exceptions, broken handoffs, and unreliable success criteria before buying integrations.

## AI contribution with a real boundary

Use AI first where inputs are messy and outputs can be checked: normalize a narrative into draft graph elements; classify a case; extract required fields; summarize a case for an owner; propose a response; propose flow changes. Keep dispatch, contract validation, permissions, approval state, retries, and outcome assertions in deterministic code.

For an action node, capture:

- Purpose: classify, extract, enrich, summarize, draft, or invoke a named tool.
- Allowed context: the specific input fields and sources it may read.
- Output contract: the fields/types that must be returned.
- Authority: suggest only, prepare for review, or execute within a bounded policy.
- Escalation: conditions requiring a named human owner; unknown facts stay unknown.
- Tool contract: allowed tool name and arguments, effect, receipt, time limit, retries, and fallback.

Prefer a genuinely optional server route for live model-assisted mapping and candidate suggestions. It takes selected scenario data plus a constrained request and returns a schema-validated list of patch proposals, assumptions, missing information, and rationale. The UI previews each patch before applying it to proposed state. The model cannot rename evidence as observed, approve its own action, grant tool permissions, or mutate baseline. Enforce these constraints after generation. Label the output “AI draft” with provider/model and source selection; keep deterministic advice labeled “Rule-based check.”

A local companion process can provide `POST /api/propose` with the API credential in the server environment. Include explicit request-size limits, bounded timeout, strict output validation, and a local-only default bind address. GitHub Pages remains a static workshop; it should not ask users to put an API key into a public site. Make the local UI automatically use the companion route when running locally, or provide a clear connection status. A failed or absent model connection does not break editing or rehearsal.

An AI layer is not proven just because a model produced a flow. Its output must be editable, source-linked, structurally valid, and evaluated against cases. A proposal that reduces nominal steps but loses evidence or exception ownership is worse.

## Minimal data contract

```ts
type RouteCondition =
  | { kind: 'always' }
  | { kind: 'field'; field: string; op: 'equals' | 'present'; value?: string | boolean }
  | { kind: 'result'; result: 'success' | 'failure' | 'approved' | 'rejected' };

type SignalContract = {
  id: string;
  name: string;
  requiredFields: string[];
  producedFields: string[];
  classification: 'public' | 'internal' | 'restricted';
};

type ActionBoundary = {
  authority: 'suggest' | 'prepare' | 'execute';
  allowedTools: string[];
  allowedFields: string[];
  approvalOwner: string;
  maxAttempts: number;
  timeoutSeconds: number;
  fallbackNodeId: string | null;
  successEvidence: string;
};

type TraceEvent = {
  runId: string;
  graphVersion: string;
  sequence: number;
  nodeId: string;
  state: string;
  inputs: Record<string, unknown>;
  result: Record<string, unknown>;
  explanation: string;
  mode: 'rehearsal' | 'live';
};
```

Avoid arbitrary expression evaluation in the browser. Use a small set of structured conditions. Validation should catch missing endpoints, unreachable outcomes, unowned review steps, missing fallback targets, and invalid cycles. Either reject cycles in the first version or bound visits explicitly. A diagram editor that can silently create an infinite rehearsal undermines the workshop.

## Cross-industry proof in the samples

| Pattern | OTA fictional scenario | Hospital fictional administrative scenario | B2B fictional scenario |
| --- | --- | --- | --- |
| Trigger | Supplier reports accommodation unavailable | Referral received | Invoice discrepancy received |
| Context | Booking, traveler preference, supplier availability | Referral fields, contact preference, appointment availability | Invoice, contract, delivery record |
| Decision | In-policy alternative or exception | Administratively complete or missing information | Match or unresolved discrepancy |
| AI assist | Assemble options and prepare explanation | Check required administrative fields and prepare handoff | Reconcile provided records and summarize differences |
| Human boundary | Traveler acceptance and exception approval | Staff validate administrative routing; clinical judgment remains with clinical staff | Owner approves adjustment |
| Action | Approved reservation change | Approved scheduling action | Approved invoice update |
| Evidence | Supplier confirmation and traveler acknowledgment | Confirmed appointment record and communicated instructions | Updated record plus acknowledgment |

These are invented examples for comparing the same grammar. They are not operational, clinical, legal, or financial advice. Hospital sample should stay administrative; do not imply a general graph can automatically determine clinical urgency or eligibility.

## Comparison that informs a workshop

Compare baseline and proposed using the same case inputs and visible assumptions. Show human handling minutes, elapsed waiting minutes, handoff count, review count, and outcome status. Separate handling from waiting. Derive totals from nodes actually traversed; do not count skipped nodes. Mark estimates as assumptions and display the per-step inputs so users can challenge them.

Use “estimated handling time for this case” rather than “efficiency gain” or revenue promises. For parallel work, either compute critical-path elapsed time or state that elapsed comparison is unavailable. Do not sum parallel durations and call it end-to-end latency. If AI introduces extra review, include it.

Export a pilot specification: graph version, changed step/signal, intended result, allowed action, data/tool access, owner, stop conditions, fallback, test cases, assumptions, and evidence plan. This is the bridge from consultation to controlled orchestration.

## What a live execution service eventually needs

Persist cases, action intents, results, approvals, and receipts server-side. Give each external operation a stable idempotency key across retries. Distinguish “request failed” from “result unknown after timeout”; reconcile unknown writes before trying again. Runtime authorization must validate action, scope, and resource. Rehearsal approval buttons are not an identity or permission system.

A workflow engine can persist waiting and recovery; it does not make a supplier API transactional or invent confirmation evidence. Keep fallible external calls separate from deterministic orchestration. Use durable message handling for late signals and approval decisions. No durable engine is necessary to make the current static rehearsal useful.

## Focused validation

Meaningful unit tests: v1 migration preserves text and stable order; imports reject dangling edges; conditions route distinct inputs differently; missing contract fields block actions; approval is required before the dependent step; rejection takes a defined route; retries stop at the configured limit; failure never fabricates outcome evidence; cycles stop; baseline/proposed run on identical inputs; generated patches cannot write baseline or self-approve; import/export preserves both graphs.

Browser checks: switch industry examples, edit a signal, follow an alternate branch, pause/approve/reject, see comparison change, reload local work, export/import, and inspect mobile graph navigation. An optional AI route should be tested against malformed responses and absent credentials even if a real paid call is unavailable.

## Research grounding

The design above is an inference from the founder context and these primary sources, not a claim that this architecture is already implemented.

- Anthropic distinguishes fixed workflow paths from agents that choose their own paths; it recommends simple composable patterns, clear tool interfaces, environmental feedback, evaluation, and bounded operation. These support putting model reasoning inside an explicit orchestration contract. [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents).
- Temporal describes persisted workflow state and recovery through recorded event history. This supports separating a business-process definition from an individual execution and keeping a visible trace. The browser rehearsal does not inherit Temporal's durability. [Workflow Execution](https://docs.temporal.io/workflow-execution).
- Temporal recommends idempotent external activities and explains the case where an action succeeds but completion is not recorded, leading to retry. This supports stable operation IDs and receipt reconciliation. [Activity Definition](https://docs.temporal.io/activity-definition).
- Temporal's retry policy separates delay, backoff, attempt limits, and non-retryable errors. This supports explicitly modeled failure handling rather than retrying every exception. [Retry Policies](https://docs.temporal.io/encyclopedia/retry-policies).
- Temporal distinguishes messages that change workflow state from read-only queries and validated updates. This supports separating signals, observations, and decisions in a future live service. [Workflow message passing](https://docs.temporal.io/encyclopedia/workflow-message-passing).
