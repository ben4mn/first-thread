export type Evidence = 'Observed' | 'Reported' | 'Assumption';
export type Step = {
  id: string;
  title: string;
  tool: string;
  owner: string;
  surface: string;
  channel: string;
  incoming: string;
  outgoing: string;
  friction: string;
  evidence: Evidence;
  source: string;
  adjacent: string;
};
export type Scenario = {
  id: string;
  title: string;
  context: string;
  trigger: string;
  outcome: string;
  notes: string;
  steps: Step[];
  future: string;
  firstMove: string;
  hypothesis: string;
  measure: string;
  owner: string;
  guardrail: string;
  questions: string;
  sample: boolean;
};
export type Notebook = { mission: string; vision: string; notes: string };
export type Workspace = {
  version: 1;
  scenarios: Scenario[];
  activeId: string;
  notebook: Notebook;
};
export const uid = () => {
  if (globalThis.crypto.randomUUID) return globalThis.crypto.randomUUID();
  // getRandomValues remains available on plain HTTP for local-network workshops.
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  return [...bytes]
    .map(
      (b, i) =>
        ([4, 6, 8, 10].includes(i) ? '-' : '') +
        b.toString(16).padStart(2, '0'),
    )
    .join('');
};
export const defaultNotebook: Notebook = {
  mission:
    'Help teams understand how work really happens, define a better future state, and move toward it one scenario at a time.',
  vision:
    'A world where the people closest to a business outcome can understand and improve the systems that produce it.',
  notes: '',
};
export function newStep(): Step {
  return {
    id: uid(),
    title: 'New step',
    tool: '',
    owner: '',
    surface: '',
    channel: '',
    incoming: '',
    outgoing: '',
    friction: '',
    evidence: 'Assumption',
    source: '',
    adjacent: '',
  };
}
export function newScenario(
  title: string,
  trigger: string,
  outcome: string,
  context = '',
  notes = '',
): Scenario {
  return {
    id: uid(),
    title: title.trim(),
    trigger: trigger.trim(),
    outcome: outcome.trim(),
    context,
    notes,
    steps: [],
    future: '',
    firstMove: '',
    hypothesis: '',
    measure: '',
    owner: '',
    guardrail: '',
    questions: '',
    sample: false,
  };
}
export function moveStep(steps: Step[], id: string, direction: -1 | 1) {
  const next = [...steps];
  const i = next.findIndex((s) => s.id === id);
  const target = i + direction;
  if (i < 0 || target < 0 || target >= next.length) return steps;
  [next[i], next[target]] = [next[target], next[i]];
  return next;
}
const sample: Scenario = {
  id: 'sample-request',
  title: 'A request without an owner',
  context: 'Fictional example · A small B2B software company',
  trigger: 'A self-serve customer asks for help choosing a plan.',
  outcome:
    'The customer receives a useful recommendation within one working day.',
  notes:
    'Illustrative workshop notes, not a customer interview.\n\nA request arrives through the website. Support sees it, but the customer has no account owner. A spreadsheet is used to find someone who can help. We do not yet know how often this happens or how long each handoff takes.',
  steps: [
    {
      id: 'step-1',
      title: 'Capture the request',
      tool: 'Website form',
      owner: 'Customer experience',
      surface: 'Help page',
      channel: 'Web',
      incoming: 'Customer question + account email',
      outgoing: 'Support ticket',
      friction: '',
      evidence: 'Assumption',
      source: 'Fictional example. Validate with a real request.',
      adjacent: 'Account profile; consent preferences',
    },
    {
      id: 'step-2',
      title: 'Find someone to help',
      tool: 'Support inbox + spreadsheet',
      owner: 'Support team',
      surface: 'Support workspace',
      channel: 'Internal handoff',
      incoming: 'Support ticket',
      outgoing: 'Request for an owner',
      friction:
        'No assigned owner for self-serve accounts. The request waits while someone asks around.',
      evidence: 'Assumption',
      source:
        'Fictional example. Ask support to walk through the last request.',
      adjacent: 'Sales; account routing; product usage',
    },
    {
      id: 'step-3',
      title: 'Make a recommendation',
      tool: 'Email + product guide',
      owner: 'Available specialist',
      surface: 'Customer inbox',
      channel: 'Email',
      incoming: 'Request + account context',
      outgoing: 'Plan recommendation',
      friction:
        'The specialist asks the customer to repeat context already provided.',
      evidence: 'Assumption',
      source: 'Fictional example. Review the handoff and reply together.',
      adjacent: 'Pricing guidance; product expertise',
    },
  ],
  future:
    'A customer without an account owner still reaches someone equipped to help. Their question and context travel together, and the response is visible to the team.',
  firstMove:
    'Pilot a named daily owner for self-serve plan questions and include the original request in the handoff.',
  hypothesis:
    'If we make ownership explicit and preserve context, fewer requests will wait between teams.',
  measure:
    'Record time to useful response for the next 10 requests. Compare with 10 recent requests before setting a target.',
  owner: 'Choose a pilot owner in the workshop',
  guardrail:
    'Keep the existing support queue as the fallback. Review every pilot request before expanding.',
  questions:
    'How often does this happen?\nWhere is ownership actually decided?\nWhat makes a recommendation useful to the customer?',
  sample: true,
};
export function initialWorkspace(): Workspace {
  return {
    version: 1,
    scenarios: [structuredClone(sample)],
    activeId: sample.id,
    notebook: { ...defaultNotebook },
  };
}
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function str(value: unknown, max = 40000): value is string {
  return typeof value === 'string' && value.length <= max;
}
function fields(obj: Record<string, unknown>, names: string[]) {
  return names.every((k) => str(obj[k]));
}
export const MAX_WORKSPACE_BYTES = 2_000_000;
export function serializeWorkspace(workspace: Workspace): string {
  const text = JSON.stringify(workspace);
  if (new TextEncoder().encode(text).byteLength > MAX_WORKSPACE_BYTES) {
    throw new Error(
      'This change would exceed the 2 MB workspace limit. Your existing work is unchanged. Shorten these notes or export a backup and remove older scenarios.',
    );
  }
  return text;
}
export function parseWorkspace(text: string): Workspace {
  if (new TextEncoder().encode(text).byteLength > MAX_WORKSPACE_BYTES)
    throw new Error(
      'This file is too large. Choose a First Thread export under 2 MB.',
    );
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error(
      'This file is not valid JSON. Choose a First Thread workspace export.',
    );
  }
  if (
    !record(value) ||
    value.version !== 1 ||
    !Array.isArray(value.scenarios) ||
    value.scenarios.length < 1 ||
    value.scenarios.length > 100 ||
    !record(value.notebook) ||
    !fields(value.notebook, ['mission', 'vision', 'notes'])
  )
    throw new Error(
      'This is not a supported First Thread workspace (version 1).',
    );
  const ids = new Set<string>();
  for (const item of value.scenarios) {
    if (
      !record(item) ||
      !fields(item, [
        'id',
        'title',
        'context',
        'trigger',
        'outcome',
        'notes',
        'future',
        'firstMove',
        'hypothesis',
        'measure',
        'owner',
        'guardrail',
        'questions',
      ]) ||
      !String(item.id).trim() ||
      !String(item.title).trim() ||
      !String(item.trigger).trim() ||
      !String(item.outcome).trim() ||
      typeof item.sample !== 'boolean' ||
      !Array.isArray(item.steps) ||
      item.steps.length > 100 ||
      ids.has(String(item.id))
    )
      throw new Error(
        'A scenario is incomplete or has duplicate identifiers. No changes were made.',
      );
    ids.add(String(item.id));
    const stepIds = new Set<string>();
    for (const step of item.steps) {
      if (
        !record(step) ||
        !fields(step, [
          'id',
          'title',
          'tool',
          'owner',
          'surface',
          'channel',
          'incoming',
          'outgoing',
          'friction',
          'source',
          'adjacent',
        ]) ||
        !String(step.id).trim() ||
        !String(step.title).trim() ||
        typeof step.evidence !== 'string' ||
        !['Observed', 'Reported', 'Assumption'].includes(step.evidence) ||
        stepIds.has(String(step.id))
      )
        throw new Error('A map step is invalid. No changes were made.');
      stepIds.add(String(step.id));
    }
  }
  if (!str(value.activeId) || !ids.has(value.activeId))
    throw new Error('The active scenario is missing from this workspace.');
  // Copy validated fields only. Imported content is rendered as text, never HTML.
  const scenarioKeys = [
    'id',
    'title',
    'context',
    'trigger',
    'outcome',
    'notes',
    'future',
    'firstMove',
    'hypothesis',
    'measure',
    'owner',
    'guardrail',
    'questions',
    'sample',
  ] as const;
  const stepKeys = [
    'id',
    'title',
    'tool',
    'owner',
    'surface',
    'channel',
    'incoming',
    'outgoing',
    'friction',
    'evidence',
    'source',
    'adjacent',
  ] as const;
  return {
    version: 1,
    activeId: value.activeId,
    notebook: {
      mission: value.notebook.mission as string,
      vision: value.notebook.vision as string,
      notes: value.notebook.notes as string,
    },
    scenarios: value.scenarios.map((s) => ({
      ...Object.fromEntries(scenarioKeys.map((k) => [k, s[k]])),
      steps: s.steps.map((t: Record<string, unknown>) =>
        Object.fromEntries(stepKeys.map((k) => [k, t[k]])),
      ),
    })) as Scenario[],
  };
}
export function scenarioMarkdown(s: Scenario) {
  return `# ${s.title}\n\n${s.sample ? 'Fictional example — all claims need validation.\n\n' : ''}${s.context}\n\n## Scenario\n\n**Trigger:** ${s.trigger}\n\n**Intended outcome:** ${s.outcome}\n\n## Discovery notes\n\n${s.notes || 'Not yet captured.'}\n\n## Today’s thread\n\n${s.steps.map((t, i) => `### ${i + 1}. ${t.title}\n\n- Tool / component: ${t.tool || 'Unknown'}\n- Owner: ${t.owner || 'Unknown'}\n- Surface: ${t.surface || 'Unknown'}\n- Channel: ${t.channel || 'Unknown'}\n- Signal in: ${t.incoming || 'Unknown'}\n- Signal out: ${t.outgoing || 'Unknown'}\n- Friction: ${t.friction || 'None recorded'}\n- Evidence: ${t.evidence}\n- Source / validation: ${t.source || 'Not recorded'}\n- Also touches: ${t.adjacent || 'Not explored'}`).join('\n\n')}\n\n## Future state\n\n${s.future || 'Not yet defined.'}\n\n## First move\n\n${s.firstMove || 'Not yet chosen.'}\n\n**Hypothesis:** ${s.hypothesis}\n\n**Measure:** ${s.measure}\n\n**Owner:** ${s.owner}\n\n**Guardrail / fallback:** ${s.guardrail}\n\n## Open questions\n\n${s.questions}\n`;
}
