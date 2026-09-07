export type ActorKind = 'system' | 'person' | 'agent';
export type Component = {
  id: string;
  name: string;
  kind: ActorKind;
  responsibility: string;
};
export type FlowNode = {
  id: string;
  title: string;
  kind: 'action' | 'decision' | 'outcome';
  componentId: string;
  capability: string;
  state: string;
  result: 'met' | 'pending' | 'not-met';
  inputs: string[];
  outputs: string[];
  surface: string;
  channel: string;
  friction: string;
  evidence: 'Observed' | 'Reported' | 'Assumption';
  source: string;
  column: number;
  lane: number;
  minutes: number;
  wait: number;
  ai: boolean;
  instruction: string;
  outputContract: string;
  review: boolean;
  fallback: string;
  proposedMinutes: number;
};
export type FlowEdge = {
  id: string;
  from: string;
  to: string;
  signal: string;
  when: 'always' | 'ready' | 'not-ready' | 'exception' | 'standard';
};
export type Flow = {
  object: string;
  identity: string;
  start: string;
  components: Component[];
  nodes: FlowNode[];
  edges: FlowEdge[];
};
export type CaseInput = {
  id: string;
  ready: boolean;
  exception: boolean;
  confidence: number;
  toolFailure: boolean;
  available: string[];
};
export type TraceEvent = {
  nodeId: string;
  title: string;
  status: 'done' | 'review' | 'fallback' | 'blocked';
  detail: string;
  signal: string;
  minutes: number;
  wait: number;
};
export type Run = {
  status: 'complete' | 'waiting' | 'review' | 'blocked';
  trace: TraceEvent[];
  terminal: string;
  minutes: number;
  wait: number;
  signals: string[];
  approvals: string[];
};
export const makeId = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};
export function emptyFlow(): Flow {
  return {
    object: 'Business case',
    identity: 'caseId',
    start: '',
    components: [],
    nodes: [],
    edges: [],
  };
}
export function blankNode(componentId: string, column = 0): FlowNode {
  return {
    id: makeId(),
    title: 'New action',
    kind: 'action',
    componentId,
    capability: '',
    state: '',
    result: 'met',
    inputs: [],
    outputs: [],
    surface: '',
    channel: '',
    friction: '',
    evidence: 'Assumption',
    source: '',
    column,
    lane: 1,
    minutes: 5,
    wait: 0,
    ai: false,
    instruction: '',
    outputContract: '',
    review: true,
    fallback: 'Responsible operator',
    proposedMinutes: 5,
  };
}
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown): v is string =>
  typeof v === 'string' && v.length <= 40000;
const strings = (v: unknown): v is string[] =>
  Array.isArray(v) &&
  v.length <= 100 &&
  v.every((x) => text(x) && /^[a-zA-Z][a-zA-Z0-9_.-]{0,79}$/.test(x));
const number = (v: unknown, max: number) =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max;
export function parseFlow(value: unknown): Flow {
  if (
    !record(value) ||
    !['object', 'identity', 'start'].every((k) => text(value[k])) ||
    !Array.isArray(value.components) ||
    !Array.isArray(value.nodes) ||
    !Array.isArray(value.edges) ||
    value.nodes.length > 150 ||
    value.components.length > 150 ||
    value.edges.length > 300
  )
    throw new Error(
      'The flow must include a case, components, actions, and signal connections.',
    );
  const components = new Set<string>();
  const nodes = new Set<string>();
  const edges = new Set<string>();
  for (const c of value.components) {
    if (
      !record(c) ||
      !['id', 'name', 'responsibility'].every((k) => text(c[k])) ||
      !c.id ||
      !c.name ||
      !['system', 'person', 'agent'].includes(String(c.kind)) ||
      typeof c.kind !== 'string' ||
      components.has(c.id as string)
    )
      throw new Error('A component is invalid or duplicated.');
    components.add(c.id as string);
  }
  for (const n of value.nodes) {
    if (
      !record(n) ||
      ![
        'id',
        'title',
        'componentId',
        'capability',
        'state',
        'surface',
        'channel',
        'friction',
        'source',
        'instruction',
        'outputContract',
        'fallback',
      ].every((k) => text(n[k])) ||
      !n.id ||
      !String(n.title).trim() ||
      typeof n.kind !== 'string' ||
      !['action', 'decision', 'outcome'].includes(n.kind) ||
      typeof n.evidence !== 'string' ||
      !['Observed', 'Reported', 'Assumption'].includes(n.evidence) ||
      !components.has(String(n.componentId)) ||
      nodes.has(n.id as string) ||
      !strings(n.inputs) ||
      !strings(n.outputs) ||
      !number(n.column, 150) ||
      !Number.isInteger(n.column) ||
      !number(n.lane, 2) ||
      !Number.isInteger(n.lane) ||
      !number(n.minutes, 100000) ||
      !number(n.proposedMinutes, 100000) ||
      !number(n.wait, 100000) ||
      typeof n.result !== 'string' ||
      !['met', 'pending', 'not-met'].includes(n.result) ||
      typeof n.ai !== 'boolean' ||
      typeof n.review !== 'boolean'
    )
      throw new Error(
        'An action has invalid fields, position, component, or estimates.',
      );
    nodes.add(n.id as string);
  }
  if (value.nodes.length && !nodes.has(value.start as string))
    throw new Error('The start action is missing.');
  for (const e of value.edges) {
    if (
      !record(e) ||
      !['id', 'from', 'to', 'signal'].every((k) => text(e[k])) ||
      !e.id ||
      !nodes.has(String(e.from)) ||
      !nodes.has(String(e.to)) ||
      typeof e.when !== 'string' ||
      !['always', 'ready', 'not-ready', 'exception', 'standard'].includes(
        e.when,
      ) ||
      edges.has(e.id as string)
    )
      throw new Error(
        'A signal has an invalid source, destination, or condition.',
      );
    edges.add(e.id as string);
  }
  // Rebuild from whitelisted fields, never retaining imported executable metadata.
  const ck = ['id', 'name', 'kind', 'responsibility'];
  const nk = [
    'id',
    'title',
    'kind',
    'componentId',
    'capability',
    'state',
    'result',
    'inputs',
    'outputs',
    'surface',
    'channel',
    'friction',
    'evidence',
    'source',
    'column',
    'lane',
    'minutes',
    'wait',
    'ai',
    'instruction',
    'outputContract',
    'review',
    'fallback',
    'proposedMinutes',
  ];
  const ek = ['id', 'from', 'to', 'signal', 'when'];
  const pick = (o: Record<string, unknown>, keys: string[]) =>
    Object.fromEntries(keys.map((k) => [k, o[k]]));
  return {
    object: value.object as string,
    identity: value.identity as string,
    start: value.start as string,
    components: value.components.map((c) => pick(c, ck)),
    nodes: value.nodes.map((n) => pick(n, nk)),
    edges: value.edges.map((e) => pick(e, ek)),
  } as Flow;
}
export function flowIssues(flow: Flow): string[] {
  if (!flow.nodes.length) return ['Add a first action to define the route.'];
  const issues: string[] = [];
  const visited = new Set<string>();
  const visit = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);
    flow.edges.filter((e) => e.from === id).forEach((e) => visit(e.to));
  };
  visit(flow.start);
  for (const n of flow.nodes) {
    const outgoing = flow.edges.filter((e) => e.from === n.id);
    if (!visited.has(n.id))
      issues.push(`${n.title}: not reachable from the trigger.`);
    if (n.kind !== 'outcome' && !outgoing.length)
      issues.push(`${n.title}: no next signal is connected.`);
    if (n.kind === 'outcome' && outgoing.length)
      issues.push(
        `${n.title}: terminal outcomes cannot send another route signal.`,
      );
    if (
      n.kind === 'decision' &&
      (outgoing.length < 2 || outgoing.some((e) => e.when === 'always'))
    )
      issues.push(`${n.title}: define explicit alternative conditions.`);
    if (
      n.ai &&
      (!n.instruction.trim() || !n.outputContract.trim() || !n.fallback.trim())
    )
      issues.push(
        `${n.title}: AI needs a task, output contract, and fallback.`,
      );
    if (n.kind !== 'outcome' && outgoing.length) {
      const combinations = [
        [true, true],
        [true, false],
        [false, true],
        [false, false],
      ];
      if (
        combinations.some(
          ([ready, exception]) =>
            outgoing.filter(
              (e) =>
                e.when === 'always' ||
                (e.when === 'ready' && ready) ||
                (e.when === 'not-ready' && !ready) ||
                (e.when === 'exception' && exception) ||
                (e.when === 'standard' && !exception),
            ).length !== 1,
        )
      )
        issues.push(
          `${n.title}: routes must be exclusive and cover every rehearsal case.`,
        );
    }
    if (!n.capability.trim())
      issues.push(`${n.title}: name the business capability.`);
  }
  if (!flow.nodes.some((n) => n.kind === 'outcome'))
    issues.push('Define at least one terminal outcome.');
  for (const ready of [true, false])
    for (const exception of [true, false]) {
      const run = runFlow(flow, {
        id: 'CONTRACT-CHECK',
        ready,
        exception,
        confidence: 1,
        toolFailure: false,
        available: flow.nodes.find((n) => n.id === flow.start)?.inputs || [],
      });
      const terminalNode = flow.nodes.find(
        (n) => n.id === run.trace.at(-1)?.nodeId,
      );
      const completedNegativeOutcome =
        terminalNode?.kind === 'outcome' &&
        terminalNode.result === 'not-met' &&
        run.trace.at(-1)?.status === 'done';
      if (run.status === 'blocked' && !completedNegativeOutcome)
        issues.push(
          `Case ${ready ? 'ready' : 'incomplete'}/${exception ? 'exception' : 'standard'}: ${run.terminal}.`,
        );
    }
  return [...new Set(issues)];
}
export function runFlow(
  flow: Flow,
  input: CaseInput,
  assisted = false,
  approved: string[] = [],
  rejected: string[] = [],
): Run {
  const result: Run = {
    status: 'blocked',
    trace: [],
    terminal: '',
    minutes: 0,
    wait: 0,
    signals: [],
    approvals: [],
  };
  if (!input.id.trim()) {
    result.terminal = 'A case identifier is required';
    return result;
  }
  const values = new Set(input.available);
  let current = flow.start;
  const seen = new Set<string>();
  for (let i = 0; i < 150; i++) {
    const node = flow.nodes.find((n) => n.id === current);
    if (!node) {
      result.terminal = 'No start action';
      return result;
    }
    if (seen.has(node.id)) {
      result.terminal = 'Cycle detected; rehearsal stopped';
      return result;
    }
    seen.add(node.id);
    const missing = node.inputs.filter((k) => !values.has(k));
    if (missing.length) {
      result.trace.push({
        nodeId: node.id,
        title: node.title,
        status: 'blocked',
        detail: `Missing required context: ${missing.join(', ')}`,
        signal: '',
        minutes: 0,
        wait: 0,
      });
      result.terminal = 'Input contract not satisfied';
      return result;
    }
    const useAI = assisted && node.ai;
    let minutes = node.minutes;
    let status: TraceEvent['status'] = 'done';
    let detail = 'Current action performed with the entered assumptions.';
    if (useAI) {
      if (rejected.includes(node.id)) {
        result.trace.push({
          nodeId: node.id,
          title: node.title,
          status: 'blocked',
          detail: 'Reviewer rejected this proposal. No output was emitted.',
          signal: '',
          minutes: 0,
          wait: 0,
        });
        result.terminal = 'Proposal rejected; return to the responsible owner';
        return result;
      }
      if (
        !node.instruction.trim() ||
        !node.outputContract.trim() ||
        !node.fallback.trim()
      ) {
        result.terminal = 'Incomplete AI delegation contract';
        return result;
      }
      if (input.toolFailure || input.confidence < 0.8) {
        if (!approved.includes(node.id)) {
          result.status = 'review';
          result.approvals = [node.id];
          result.trace.push({
            nodeId: node.id,
            title: node.title,
            status: 'review',
            detail: `${input.toolFailure ? 'Simulated AI tool failure' : 'Simulated confidence below 0.80'}. Waiting for ${node.fallback} to take over. Confirm simulated human completion before any output is emitted.`,
            signal: '',
            minutes: 0,
            wait: 0,
          });
          result.terminal = 'Waiting for human fallback';
          return result;
        }
        status = 'fallback';
        detail = `${input.toolFailure ? 'Simulated tool failure' : 'Simulated confidence below 0.80'} → ${node.fallback}. Simulated human fallback completion confirmed. Current handling time retained.`;
      } else if (node.review && !approved.includes(node.id)) {
        result.status = 'review';
        result.approvals = [node.id];
        result.trace.push({
          nodeId: node.id,
          title: node.title,
          status: 'review',
          detail: `Assume a proposed output satisfies this contract: ${node.outputContract}. Confirm simulated review before continuing. No actual model output is generated here.`,
          signal: '',
          minutes: 0,
          wait: 0,
        });
        result.terminal = 'Waiting for human review';
        return result;
      } else {
        minutes = node.proposedMinutes;
        detail = `Rehearsed AI task: ${node.instruction}. ${node.review ? 'Human approval recorded.' : 'No review gate configured.'}`;
      }
    }
    node.outputs.forEach((k) => values.add(k));
    result.minutes += minutes;
    result.wait += node.wait;
    const matches = flow.edges.filter(
      (e) =>
        e.from === node.id &&
        (e.when === 'always' ||
          (e.when === 'ready' && input.ready) ||
          (e.when === 'not-ready' && !input.ready) ||
          (e.when === 'exception' && input.exception) ||
          (e.when === 'standard' && !input.exception)),
    );
    const signal =
      node.kind === 'outcome'
        ? ''
        : matches.length === 1
          ? matches[0].signal
          : '';
    result.trace.push({
      nodeId: node.id,
      title: node.title,
      status,
      detail,
      signal,
      minutes,
      wait: node.wait,
    });
    if (signal) result.signals.push(signal);
    if (node.kind === 'outcome') {
      result.status =
        node.result === 'met'
          ? 'complete'
          : node.result === 'pending'
            ? 'waiting'
            : 'blocked';
      result.terminal = node.state || node.title;
      return result;
    }
    if (matches.length !== 1) {
      result.terminal = matches.length
        ? 'Ambiguous routes: more than one condition matched'
        : 'No route matches this case';
      return result;
    }
    current = matches[0].to;
  }
  result.terminal = 'Rehearsal step limit reached';
  return result;
}
export function caseInput(flow: Flow, variant = 'normal'): CaseInput {
  return {
    id: 'CASE-001',
    ready: variant !== 'missing',
    exception: variant === 'exception',
    confidence: variant === 'uncertain' ? 0.5 : 0.95,
    toolFailure: variant === 'failure',
    available: flow.nodes.find((n) => n.id === flow.start)?.inputs || [],
  };
}
export function connectedInputs(flow: Flow): string[] {
  return [...new Set(flow.nodes.flatMap((n) => n.inputs))];
}
export function assistedDraft(flow: Flow): Flow {
  return structuredClone(flow);
}
