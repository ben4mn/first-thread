import type { Flow, FlowNode } from './graph.ts';
export type Example = {
  id: string;
  industry: string;
  title: string;
  trigger: string;
  outcome: string;
  context: string;
  flow: Flow;
  future: string;
  measure: string;
};
function example(
  id: string,
  industry: string,
  object: string,
  title: string,
  trigger: string,
  outcome: string,
  systems: [string, string, string],
  labels: [string, string, string, string],
  reviewer: string,
): Example {
  const components: Flow['components'] = [
    {
      id: 'intake',
      name: systems[0],
      kind: 'system',
      responsibility: 'Capture the event and identify the case',
    },
    {
      id: 'context',
      name: systems[1],
      kind: 'system',
      responsibility: 'Resolve case context and constraints',
    },
    {
      id: 'operations',
      name: reviewer,
      kind: 'person',
      responsibility: 'Own exceptions and authorize the next action',
    },
    {
      id: 'delivery',
      name: systems[2],
      kind: 'system',
      responsibility: 'Record fulfillment and confirm the result',
    },
  ];
  const node = (
    nid: string,
    t: string,
    c: string,
    col: number,
    lane: number,
    extra: Partial<FlowNode> = {},
  ): FlowNode => ({
    id: nid,
    title: t,
    kind: 'action',
    componentId: c,
    capability: 'Capture',
    state: '',
    result: 'met',
    inputs: [],
    outputs: [],
    surface: 'Operations workspace',
    channel: 'API / work queue',
    friction: '',
    evidence: 'Assumption',
    source: 'Fictional workshop example. Validate with a real operator.',
    column: col,
    lane,
    minutes: 3,
    wait: 0,
    ai: false,
    instruction: '',
    outputContract: '',
    review: true,
    fallback: reviewer,
    proposedMinutes: 3,
    ...extra,
  });
  const nodes: FlowNode[] = [
    node('capture', labels[0], 'intake', 0, 0, {
      capability: 'Capture',
      state: 'Received',
      inputs: ['caseId', 'request'],
      outputs: ['caseRecord'],
      surface: 'Intake surface',
      channel: 'Event / form',
      minutes: 2,
    }),
    node('context', labels[1], 'context', 1, 1, {
      capability: 'Understand',
      state: 'Context assembled',
      inputs: ['caseRecord'],
      outputs: ['context'],
      minutes: 12,
      wait: 20,
      friction:
        'Context is copied between tools; the next team cannot see what was already collected.',
      ai: true,
      instruction: `Summarize the ${object.toLowerCase()} context using only the supplied records. List missing information and cite each source field.`,
      outputContract:
        'Summary, source-field references, missing information; no invented facts.',
      proposedMinutes: 4,
    }),
    node('ready', 'Enough context?', 'context', 2, 1, {
      kind: 'decision',
      capability: 'Decide',
      inputs: ['context'],
      outputs: ['routeDecision'],
      minutes: 1,
    }),
    node('missing', 'Request missing context', 'operations', 2, 2, {
      capability: 'Resolve',
      state: 'Waiting for information',
      inputs: ['context'],
      outputs: ['informationRequest'],
      minutes: 6,
      wait: 60,
      friction: 'A missing field creates a second conversation.',
    }),
    node('waiting', 'Waiting for information', 'operations', 3, 2, {
      kind: 'outcome',
      capability: 'Observe',
      state: 'Pending information',
      result: 'pending',
      inputs: ['informationRequest'],
      minutes: 0,
    }),
    node('arrange', labels[2], 'operations', 3, 1, {
      capability: 'Arrange',
      state: 'Proposal ready',
      inputs: ['context', 'routeDecision'],
      outputs: ['proposal'],
      minutes: 15,
      wait: 15,
      ai: true,
      instruction: `Draft the next administrative action for this ${object.toLowerCase()}, within the supplied constraints. Explain the choice and identify exceptions for a person.`,
      outputContract:
        'A proposed next action, rationale, and unresolved constraints. Responsible person approves before any commitment.',
      proposedMinutes: 6,
    }),
    node('exception', 'Needs exception review?', 'operations', 4, 1, {
      kind: 'decision',
      capability: 'Decide',
      inputs: ['proposal'],
      outputs: ['checkedProposal'],
      minutes: 2,
    }),
    node('review', 'Resolve the exception', 'operations', 4, 2, {
      capability: 'Authorize',
      inputs: ['checkedProposal'],
      outputs: ['exceptionResolution'],
      minutes: 20,
      wait: 30,
      friction:
        'Exceptions need an accountable owner; automation cannot remove this responsibility.',
    }),
    node(
      'accept',
      id === 'example-ota'
        ? 'Traveler accepts the option'
        : id === 'example-hospital'
          ? 'Staff authorizes routing'
          : 'Customer agrees to resolution',
      'acceptor',
      5,
      2,
      {
        capability: 'Authorize',
        state: 'Accepted and authorized',
        inputs: ['checkedProposal'],
        outputs: ['authorization'],
        minutes: 5,
        wait: 10,
      },
    ),
    node('confirm', labels[3], 'delivery', 6, 0, {
      capability: 'Fulfill',
      state: 'Confirmed',
      inputs: ['authorization'],
      outputs: ['confirmation'],
      minutes: 3,
    }),
    node('complete', 'Outcome recorded', 'delivery', 7, 0, {
      kind: 'outcome',
      capability: 'Observe',
      state: 'Completed and confirmed',
      inputs: ['confirmation'],
      minutes: 0,
    }),
  ];
  components.push({
    id: 'acceptor',
    name:
      id === 'example-ota'
        ? 'Traveler + servicing owner'
        : id === 'example-hospital'
          ? 'Authorized referral staff'
          : 'Customer + operations owner',
    kind: 'person',
    responsibility:
      'Accept or authorize the proposed next action before commitment.',
  });
  const edge = (
    from: string,
    to: string,
    signal: string,
    when: Flow['edges'][0]['when'] = 'always',
  ) => ({ id: `${from}-${to}`, from, to, signal, when });
  return {
    id,
    industry,
    title,
    trigger,
    outcome,
    context: `Fictional ${industry.toLowerCase()} example · administrative operations`,
    flow: {
      object,
      identity: 'caseId',
      start: 'capture',
      components,
      nodes,
      edges: [
        edge('capture', 'context', 'case.received'),
        edge('context', 'ready', 'context.assembled'),
        edge('ready', 'arrange', 'context.ready', 'ready'),
        edge('ready', 'missing', 'context.incomplete', 'not-ready'),
        edge('missing', 'waiting', 'information.requested'),
        edge('arrange', 'exception', 'proposal.created'),
        edge('exception', 'accept', 'proposal.standard', 'standard'),
        edge('exception', 'review', 'proposal.exception', 'exception'),
        edge('review', 'accept', 'exception.resolved'),
        edge('accept', 'confirm', 'proposal.authorized'),
        edge('confirm', 'complete', 'fulfillment.confirmed'),
      ],
    },
    future:
      'Preserve context across every handoff, use AI to prepare bounded work, and keep ownership and outcome evidence visible.',
    measure:
      'Measure handling time, waiting time, repeat contact, completion rate, and exception quality against real cases. The example times are workshop assumptions.',
  };
}
export const examples: Example[] = [
  example(
    'example-ota',
    'Travel / OTA',
    'Booking disruption',
    'Recover a disrupted booking',
    'A supplier signals that a booked service is unavailable.',
    'The traveler receives an accepted alternative and an updated confirmation.',
    ['Supplier event feed', 'Booking + traveler context', 'Booking platform'],
    [
      'Receive disruption',
      'Assemble booking context',
      'Prepare alternatives',
      'Record accepted resolution',
    ],
    'Travel operations',
  ),
  example(
    'example-hospital',
    'Hospital operations',
    'Referral request',
    'Route a referral to the right team',
    'A referral arrives for administrative intake.',
    'The referral reaches the accountable team with complete administrative context and an acknowledgement.',
    ['Referral intake', 'Referral + scheduling records', 'Referral work queue'],
    [
      'Receive referral',
      'Check administrative context',
      'Prepare routing recommendation',
      'Record acknowledged handoff',
    ],
    'Referral coordinator',
  ),
  example(
    'example-commerce',
    'Digital commerce',
    'Order exception',
    'Resolve a delivery exception',
    'An order receives a failed-delivery event.',
    'The customer receives an agreed resolution and the order record reflects it.',
    ['Delivery event feed', 'Order + customer records', 'Order platform'],
    [
      'Receive delivery exception',
      'Assemble order context',
      'Prepare resolution options',
      'Confirm agreed resolution',
    ],
    'Customer operations',
  ),
];
