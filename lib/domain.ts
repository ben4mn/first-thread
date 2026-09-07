import {
  parseWorkspace as parseLegacy,
  initialWorkspace as legacyInitial,
  newScenario as legacyScenario,
  newStep,
  moveStep,
  uid,
  defaultNotebook as oldDefaultNotebook,
  MAX_WORKSPACE_BYTES,
} from './legacy-domain.ts';
import type {
  Step,
  Notebook,
  Scenario as LegacyScenario,
} from './legacy-domain.ts';
import { emptyFlow, parseFlow, type Flow } from './graph.ts';
import { examples } from './examples.ts';
export { newStep, moveStep, uid, MAX_WORKSPACE_BYTES };
export const defaultNotebook: Notebook = {
  mission:
    'Help digital businesses understand how work flows, improve the outcomes it produces, and delegate the right actions to people, software, and AI.',
  vision:
    'People can see how their business works, shape how it should work, and continuously improve it with evidence.',
  notes: '',
};
export type { Step, Notebook };
export type Scenario = LegacyScenario & {
  industry: string;
  flow: Flow;
  proposed: Flow | null;
};
export type Workspace = {
  version: 2;
  scenarios: Scenario[];
  activeId: string;
  notebook: Notebook;
};
export function newScenario(
  title: string,
  trigger: string,
  outcome: string,
  context = '',
  notes = '',
): Scenario {
  return {
    ...legacyScenario(title, trigger, outcome, context, notes),
    industry: 'Custom business',
    flow: emptyFlow(),
    proposed: null,
  };
}
export function fromExample(id: string): Scenario {
  const ex = examples.find((e) => e.id === id);
  if (!ex) throw new Error('Example not found');
  return {
    ...newScenario(ex.title, ex.trigger, ex.outcome, ex.context),
    id: ex.id,
    industry: ex.industry,
    flow: structuredClone(ex.flow),
    sample: true,
    future: ex.future,
    measure: ex.measure,
  };
}
function migrate(s: LegacyScenario): Scenario {
  const flow: Flow = emptyFlow();
  flow.components = s.steps.map((t) => ({
    id: `component-${t.id}`,
    name: t.tool || t.owner || t.title,
    kind: 'person' as const,
    responsibility: t.owner,
  }));
  flow.nodes = s.steps.map((t, i) => ({
    id: t.id,
    title: t.title,
    kind: 'action' as const,
    componentId: `component-${t.id}`,
    capability: 'To define',
    state: '',
    result: 'met',
    inputs: [],
    outputs: [],
    surface: t.surface,
    channel: t.channel,
    friction: t.friction,
    evidence: t.evidence,
    source: t.source,
    column: i,
    lane: 1,
    minutes: 0,
    wait: 0,
    ai: false,
    instruction: '',
    outputContract: '',
    review: true,
    fallback: t.owner,
    proposedMinutes: 0,
  }));
  if (flow.nodes.length) {
    let endId = 'migrated-outcome';
    while (flow.nodes.some((n) => n.id === endId)) endId += '-';
    flow.components.push({
      id: 'outcome-owner',
      name: 'Outcome owner',
      kind: 'person',
      responsibility: 'Verify the intended result',
    });
    flow.nodes.push({
      id: endId,
      title: 'Verify intended outcome',
      kind: 'outcome',
      componentId: 'outcome-owner',
      capability: 'Observe',
      state: s.outcome,
      result: 'met',
      inputs: [],
      outputs: [],
      surface: '',
      channel: '',
      friction: '',
      evidence: 'Assumption',
      source: 'Added during migration; validate with the workshop.',
      column: s.steps.length,
      lane: 0,
      minutes: 0,
      wait: 0,
      ai: false,
      instruction: '',
      outputContract: '',
      review: true,
      fallback: '',
      proposedMinutes: 0,
    });
    flow.start = flow.nodes[0].id;
    flow.edges = flow.nodes.slice(0, -1).map((n, i) => ({
      id: `legacy-${i}`,
      from: n.id,
      to: flow.nodes[i + 1].id,
      signal: s.steps[i].outgoing || 'Handoff to define',
      when: 'always',
    }));
  }
  return { ...s, industry: 'Existing workshop', flow, proposed: null };
}
export function initialWorkspace(): Workspace {
  const scenarios = examples.map((e) => fromExample(e.id));
  return {
    version: 2,
    scenarios,
    activeId: scenarios[0].id,
    notebook: { ...defaultNotebook },
  };
}
export function serializeWorkspace(workspace: Workspace): string {
  const serialized = JSON.stringify(workspace);
  if (new TextEncoder().encode(serialized).byteLength > MAX_WORKSPACE_BYTES)
    throw new Error(
      'This change exceeds the 2 MB workspace limit. Your existing work is unchanged. Export a backup and shorten the draft.',
    );
  return serialized;
}
export function parseWorkspace(serialized: string): Workspace {
  if (new TextEncoder().encode(serialized).byteLength > MAX_WORKSPACE_BYTES)
    throw new Error('Choose a workspace under 2 MB.');
  let raw: unknown;
  try {
    raw = JSON.parse(serialized);
  } catch {
    throw new Error('Choose a valid First Thread JSON workspace.');
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    throw new Error('Unsupported workspace.');
  const data = raw as Record<string, unknown>;
  if (data.version === 1) {
    const old = parseLegacy(serialized);
    const notebook = {
      ...old.notebook,
      mission:
        old.notebook.mission === oldDefaultNotebook.mission
          ? defaultNotebook.mission
          : old.notebook.mission,
      vision:
        old.notebook.vision === oldDefaultNotebook.vision
          ? defaultNotebook.vision
          : old.notebook.vision,
    };
    const untouchedDemo =
      old.scenarios.length === 1 &&
      JSON.stringify(old.scenarios[0]) ===
        JSON.stringify(
          parseLegacy(JSON.stringify(legacyInitial())).scenarios[0],
        );
    return {
      version: 2,
      scenarios: [
        ...(untouchedDemo ? examples.map((e) => fromExample(e.id)) : []),
        ...old.scenarios.map(migrate),
      ],
      activeId: untouchedDemo ? examples[0].id : old.activeId,
      notebook,
    };
  }
  if (data.version !== 2 || !Array.isArray(data.scenarios))
    throw new Error('Unsupported workspace version.');
  // Validate all original fields, preserving every old note and business hypothesis.
  const legacy = parseLegacy(JSON.stringify({ ...data, version: 1 }));
  return {
    version: 2,
    activeId: legacy.activeId,
    notebook: legacy.notebook,
    scenarios: legacy.scenarios.map((s, i) => {
      const extended = data.scenarios as Record<string, unknown>[];
      const v = extended[i];
      if (typeof v.industry !== 'string' || v.industry.length > 40000)
        throw new Error('Industry label is invalid.');
      return {
        ...s,
        industry: v.industry,
        flow: parseFlow(v.flow),
        proposed: v.proposed === null ? null : parseFlow(v.proposed),
      };
    }),
  };
}
export function scenarioMarkdown(s: Scenario): string {
  return (
    `# ${s.title}\n\n${s.sample ? 'Fictional workshop example. Estimates and business facts are assumptions.\n\n' : ''}${s.context}\n\n## Scenario\n\n**Trigger:** ${s.trigger}\n\n**Intended outcome:** ${s.outcome}\n\n## Discovery notes\n\n${s.notes}\n\n## Future state and first move\n\n${s.future}\n\n${s.firstMove}\n\n**Hypothesis:** ${s.hypothesis}\n\n**Measure:** ${s.measure}\n\n**Owner:** ${s.owner}\n\n**Fallback:** ${s.guardrail}\n\n**Questions:** ${s.questions}\n` +
    `\n## Business case\n\n${s.flow.object} · identity: ${s.flow.identity}\n\n## Flow actions\n\n` +
    s.flow.nodes
      .map(
        (n) =>
          `### ${n.title}\n\n- Capability: ${n.capability}\n- Component: ${s.flow.components.find((c) => c.id === n.componentId)?.name}\n- Kind: ${n.kind}\n- State after: ${n.state}\n- Required context: ${n.inputs.join(', ')}\n- Produced context: ${n.outputs.join(', ')}\n- Friction: ${n.friction}\n- Evidence: ${n.evidence} — ${n.source}\n- Handling / waiting assumptions: ${n.minutes} / ${n.wait} minutes\n- AI task: ${n.instruction}\n- AI output contract: ${n.outputContract}\n- Human review: ${n.review}\n- Fallback: ${n.fallback}`,
      )
      .join('\n\n') +
    '\n\n## Signal routes\n\n' +
    s.flow.edges
      .map((e) => `- ${e.from} → ${e.to}: ${e.signal} [${e.when}]`)
      .join('\n') +
    (s.proposed
      ? '\n\n## Proposed flow\n\n```json\n' +
        JSON.stringify(s.proposed, null, 2) +
        '\n```\n'
      : '')
  );
}
export const originalExample = legacyInitial;
