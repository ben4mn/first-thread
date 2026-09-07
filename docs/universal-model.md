# First Thread: a universal model for digital work

Research and product recommendations, September 7, 2026. Read `docs/source-notes.md`, `lib/domain.ts`, `README.md`, `docs/workshop-guide.md`, and `AGENTS.md`. Recommendations below are a synthesis for this prototype, not a claim of conformance to the cited standards. Both examples are fictional workshop fixtures.

## Product thesis

Model how a business object moves toward an outcome through people, systems, decisions, and information. Industry changes the vocabulary and operating constraints; it should not change the underlying model. An OTA has a booking, supplier notice, traveler, inventory system, and servicing policy. A hospital has a referral, referral packet, patient, intake system, and routing policy. Both have context gaps, ownership transfers, decisions, waits, exceptions, and evidence of completion.

The useful product progression is **describe → compare → rehearse → delegate → observe**. Map the current work, specify the better route, rehearse it on representative cases, delegate bounded steps, then compare actual outcomes with the baseline. A diagram alone does not define an executable workflow. HL7 explicitly separates shared workflow information from workflow execution and describes definitions, requests, and events as distinct categories. That distinction is a useful precedent even beyond healthcare. [HL7 FHIR workflow](https://hl7.org/fhir/R5/workflow.html)

## Ten concepts, in plain language

| Concept | Workshop question | Definition / examples |
| --- | --- | --- |
| Flow / scenario | What repeatable situation are we trying to improve? | The definition of a bounded route from an initiating condition to an intended result, including relevant exceptions. A **case** is one occurrence of that scenario, not the reusable definition. |
| Business object | What is this work about? | The item whose context and state must stay coherent across the route: booking, referral, order, claim, account, shipment. A case can refer to several objects; choose one primary object for this prototype. |
| Capability | What can the business do? | A reusable ability, such as identify a case, assess eligibility, allocate capacity, arrange fulfillment, or notify a participant. It remains meaningful if a vendor or team changes. |
| Component | Who or what participates? | A specific person/role, team, system, service, or agent that provides or supports a capability. Capture component kind and accountable owner separately. |
| Step | What happens here? | An action in this flow: “Match notice to booking,” “Review referral destination,” or “Send confirmation.” A step uses capabilities and components; it is neither a software box nor a whole capability. |
| Signal | What information crosses this boundary? | An event, request, response, document, or observation carrying context. Include subject/case reference, source, content, and time when known. Keep event facts (“booking changed”) distinct from action requests (“change booking”). |
| Trigger | Why does work start or resume? | A rule reacting to a signal, a timer, a manual request, or a changed condition. The notice is a signal; “open a servicing case when this notice affects an active booking” is its trigger rule. |
| State | What is true now? | The business object's condition, such as context incomplete, awaiting approval, committed, or confirmed. Keep business state distinct from the task's execution status and from the workshop's current/future design. |
| Decision | Which route is justified? | A question with required inputs, a decision owner, policy or criteria, named answers, and a destination per answer. An answer may be produced by a rule, a person, or bounded AI assistance. |
| Outcome | What useful result can we verify? | Value for a beneficiary, plus success evidence. “Traveler has an accepted, confirmed alternative” is an outcome; “email sent” is merely an output. Represent unsuccessful/escalated endings separately from successful completion. |

**Handoff is a relationship**, rather than another kind of participant. It connects two steps and names the signal transferred, the receiving owner, any condition, and expected acknowledgement. A surface is where interaction occurs (agent console, partner endpoint); a channel is the medium (API, phone, portal). Both belong in step/component detail, not the top-level diagram grammar.

BPMN distinguishes activities, events, control-flow branches, message exchanges, and human tasks. Preserve those semantic differences while giving founders a much smaller vocabulary; do not claim BPMN compatibility just because some shapes look similar. Conditional branching, parallel work, and a missing/default route have different semantics. [OMG BPMN 2.0.2](https://www.omg.org/spec/BPMN/2.0.2/PDF)

Decisions should be inspectable independently of the route: inputs → criteria/policy → answer. This follows DMN's separation of business decisions and business rules from process models, while the prototype can keep criteria as editable plain language. [OMG DMN overview](https://www.omg.org/dmn/)

## The visualization should explain the shared pattern

Use three synchronized perspectives on the same model:

1. **Business view:** primary object, trigger, target outcome, capabilities, owner, and success evidence. Show “Booking recovery,” “Referral coordination,” and “Order exception” as interchangeable scenario presets.
2. **Flow view:** editable steps and named handoffs, including explicit alternate routes, a human review point, and terminal states. Let selection expose context, friction, sources, and touched components. Group by capability or responsible participant; avoid showing every field on every node.
3. **Orchestration view:** execution mode per step, required inputs, bounded action, acceptance check, decision owner, fallback, and expected output. Rehearse a case and show what advanced, what waited, why the route changed, and what evidence is missing.

Always distinguish a selected route from the full flow. Reordering cards is useful for sketching a main route, but does not itself define edges when a flow branches. Decision nodes need visible named outputs, and every exceptional branch must land somewhere legible. A “human review” label without an owner, review object, and resume/reject behavior is insufficient for a useful rehearsal.

## Two fictional examples using exactly the same model

| Model element | OTA: recover a disrupted booking | Hospital: route an incoming referral |
| --- | --- | --- |
| Primary business object | Booking BK-DEMO-104 | Referral RF-DEMO-204 |
| Trigger | A supplier cancellation notice matches an active booking. | A new referral packet reaches the intake queue. |
| Intended outcome | The traveler accepts an available alternative and receives verified booking confirmation. | The referral reaches the appropriate accountable team with required information and acknowledgement. This is an operational outcome, not a clinical outcome. |
| Reusable capabilities | Capture → identify → assess → arrange → confirm | Capture → identify → assess → arrange → confirm |
| Components | Supplier feed, booking system, servicing team, option assistant, traveler portal | Referral inbox, patient index, intake team, document assistant, routing reviewer, destination work queue |
| Context step | Match notice and booking; retrieve constraints, traveler preferences, and available alternatives. | Match the referral subject and assemble the packet against the intake team's checklist. |
| Decision | Is there a matching booking and a policy-permitted option ready to propose? | Is the packet complete enough for the designated reviewer to determine destination? |
| Normal route | Draft options → operator reviews proposal → traveler chooses → commit via supplier → verify supplier confirmation → notify traveler. | Prepare summary → designated human reviews destination/urgency → submit to destination queue → verify acknowledgement → communicate next step. |
| Missing-context route | No booking match or stale supplier inventory → assigned servicing queue; obtain context before proposing. | Missing documents or ambiguous identity → intake resolution queue; obtain context before routing. |
| Failure / timeout route | Supplier rejects commit or response expires → recheck options and return to owner; do not claim confirmation. | Destination rejects or fails to acknowledge → intake owner resolves or redirects; do not mark accepted. |
| State progression | Disrupted → context ready → awaiting choice → commit requested → confirmed, or exception open | Received → context ready → awaiting reviewer → routing requested → acknowledged, or exception open |
| AI delegation candidate | Summarize disruption context and draft a ranked option explanation using supplied facts. | Extract administrative packet fields, flag missing checklist items, and draft a reviewer summary. |
| Human boundary | Operator and traveler authority over the proposed booking commitment, according to the modeled policy. | Designated professionals retain clinical assessment, urgency, and destination authorization in this fictional workflow. |
| Efficiency hypothesis | Less repeated lookup and fewer missing-context handoffs. | Less repeated document assembly and fewer incomplete packets returned. |
| Outcome evidence | Supplier confirmation tied to accepted option and booking. | Destination acknowledgement tied to the referral and responsible owner. |

These are deliberately parallel examples, not industry process specifications. A healthcare integration would need its own validated local workflow. FHIR's Task separates execution tracking from the resource a task acts on (`focus`), and defines inputs and outputs that can be handed between tasks. This supports keeping “the referral,” “the routing task,” and “the referral's destination decision” distinct. [HL7 FHIR Task](https://hl7.org/fhir/R5/task.html)

## Begin the AI layer as explicit delegation

Use three step modes: **Human**, **AI assisted**, and **Automated rule**. AI assisted means a model produces a proposed artifact; it does not inherently authorize downstream actions. Each candidate needs a small editable contract:

- Goal and accountable owner.
- Required inputs and their source references; missing input behavior.
- Allowed action and expected output shape.
- Acceptance check and any required human decision.
- Failure/timeout destination and retry policy.
- Evidence to retain: input references, output, chosen branch, reviewer, timestamp, and execution version.

Start with context assembly, classification against an explicit taxonomy, draft proposals, and coordination summaries. A useful next implementation can build/export the contract, accept a structured proposed result, let the founder inspect it, and rehearse its consequences. If no real model has been invoked, label the output “rule-based rehearsal” or “example proposal,” never “AI discovered” or “AI optimized.” Keep the actual runtime trace separate from the designed map and from model suggestions.

Give a real integration boundary a portable event envelope. CloudEvents provides event identity, source, type, optional subject, and time; `source + id` identifies duplicate events. For this product, keep an explicit case identifier as well: a case spans multiple events. This is a proposed adaptation, not a claim that the current app emits CloudEvents. [CloudEvents specification](https://github.com/cloudevents/spec/blob/main/cloudevents/spec.md)

Measure elapsed time, active work, waiting, returns for missing context, outcome completion, and exceptions. A rehearsal may calculate totals from the founder's entered estimates, but must label those as assumptions. An agent finishing a step is not proof of a business outcome. Operational traces can later correlate timed operations and causal links; they should be connected to the case and outcome evidence. OpenTelemetry describes spans as timed operations, trace context for correlation, and links for causally related work. [OpenTelemetry traces](https://opentelemetry.io/docs/concepts/signals/traces/)

## Highest-value implementation changes

1. Replace the single software-help preset with multiple fictional industry presets and a generic blank flow; preserve existing browser data through migration.
2. Introduce primary object, capability, step kind, state-in/state-out, named conditional handoffs, and human/AI/rule mode. Retain current evidence and source fields.
3. Add branching and a rehearsable decision/exception route before making the diagram visually denser.
4. Add orchestration contracts and a trace of the selected case; make drafts and execution claims visibly distinguishable.
5. Rewrite company copy around understanding and improving how work flows across teams and systems. Proposed mission: **Help any business make its work understandable, improve its outcomes, and delegate the right steps to people, software, and AI.** Proposed vision: **People can see how their business works, shape how it should work, and continuously improve it with evidence.**

The portable asset is a well-described flow with known evidence, decisions, and delegation boundaries. Industry templates speed up discovery; they should not dictate the product's architecture.
