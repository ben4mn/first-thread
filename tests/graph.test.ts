import assert from 'node:assert/strict';
import { test } from 'node:test';
import { examples } from '../lib/examples.ts';
import { caseInput, flowIssues, parseFlow, runFlow } from '../lib/graph.ts';
import {
  initialWorkspace,
  parseWorkspace,
  serializeWorkspace,
  scenarioMarkdown,
} from '../lib/domain.ts';
import {
  initialWorkspace as legacyInitial,
  newStep,
} from '../lib/legacy-domain.ts';
import { parseProposal } from '../lib/ai.ts';

await test('the same model validates all industries and requires acceptance before confirmation', () => {
  for (const e of examples) {
    const f = parseFlow(e.flow);
    assert.deepEqual(flowIssues(f), []);
    const r = runFlow(f, caseInput(f));
    assert.equal(r.status, 'complete');
    const ids = r.trace.map((t) => t.nodeId);
    assert.ok(ids.indexOf('accept') < ids.indexOf('confirm'));
    assert.ok(
      f.nodes.find((n) => n.id === 'confirm')?.inputs.includes('authorization'),
    );
  }
});
await test('missing context reaches a waiting state; exception route includes its responsible person', () => {
  const f = examples[0].flow;
  const missing = runFlow(f, caseInput(f, 'missing'));
  assert.equal(missing.status, 'waiting');
  assert.ok(!missing.signals.includes('fulfillment.confirmed'));
  const exception = runFlow(f, caseInput(f, 'exception'));
  assert.equal(exception.status, 'complete');
  assert.ok(exception.trace.some((t) => t.nodeId === 'review'));
});
await test('AI pauses before output and resumes only with explicit simulated review', () => {
  const f = examples[0].flow,
    input = caseInput(f);
  const paused = runFlow(f, input, true);
  assert.equal(paused.status, 'review');
  assert.ok(!paused.signals.includes('context.assembled'));
  const once = runFlow(f, input, true, ['context']);
  assert.equal(once.status, 'review');
  assert.ok(!once.signals.includes('proposal.created'));
  const complete = runFlow(f, input, true, ['context', 'arrange']);
  assert.equal(complete.status, 'complete');
  assert.ok(complete.minutes < runFlow(f, input).minutes);
});
await test('AI uncertainty and failure pause for a human fallback; no silent completion', () => {
  for (const variant of ['uncertain', 'failure']) {
    const f = examples[1].flow,
      input = caseInput(f, variant);
    const paused = runFlow(f, input, true);
    assert.equal(paused.status, 'review');
    assert.equal(paused.terminal, 'Waiting for human fallback');
    assert.ok(!paused.signals.includes('context.assembled'));
    const completed = runFlow(f, input, true, ['context', 'arrange']);
    assert.equal(completed.status, 'complete');
    assert.equal(completed.minutes, runFlow(f, input).minutes);
    assert.ok(completed.trace.some((t) => t.status === 'fallback'));
  }
});
await test('rejected proposals emit no downstream outputs', () => {
  const f = examples[0].flow;
  const r = runFlow(f, caseInput(f), true, [], ['context']);
  assert.equal(r.status, 'blocked');
  assert.ok(!r.signals.includes('context.assembled'));
});
await test('missing contract inputs, missing case identity, ambiguous routes, and cycles stop', () => {
  const f = structuredClone(examples[0].flow);
  const input = caseInput(f);
  assert.equal(runFlow(f, { ...input, available: [] }).status, 'blocked');
  assert.equal(runFlow(f, { ...input, id: '' }).status, 'blocked');
  f.edges.find((e) => e.from === 'ready' && e.to === 'missing')!.when =
    'exception';
  assert.ok(flowIssues(f).some((i) => i.includes('exclusive')));
  assert.equal(runFlow(f, caseInput(f, 'exception')).status, 'blocked');
  const cycle = structuredClone(examples[0].flow);
  cycle.edges.find((e) => e.from === 'capture')!.to = 'capture';
  assert.match(runFlow(cycle, input).terminal, /Cycle/);
});
await test('graph imports reject dangling edges and invalid estimates', () => {
  const f = structuredClone(examples[0].flow);
  f.edges[0].to = 'missing-node';
  assert.throws(() => parseFlow(f));
  const g = structuredClone(examples[0].flow);
  g.nodes[0].minutes = NaN;
  assert.throws(() => parseFlow(g));
});
await test('v1 migration preserves notes and 100-step workspaces remain reloadable', () => {
  const old = legacyInitial();
  old.notebook.notes = 'Keep our disagreement';
  old.scenarios[0].notes = 'A source excerpt';
  old.scenarios[0].steps = Array.from({ length: 100 }, (_, i) => ({
    ...newStep(),
    id: i === 0 ? 'migrated-outcome' : `step-${i}`,
    title: `Action ${i}`,
    source: 'Original source',
  }));
  const migrated = parseWorkspace(JSON.stringify(old));
  assert.equal(migrated.version, 2);
  assert.equal(migrated.scenarios[0].steps.length, 100);
  assert.equal(migrated.scenarios[0].flow.nodes.length, 101);
  assert.equal(migrated.scenarios[0].notes, old.scenarios[0].notes);
  assert.equal(migrated.notebook.notes, old.notebook.notes);
  assert.deepEqual(parseWorkspace(serializeWorkspace(migrated)), migrated);
});
await test('v2 round trip retains independent current and proposed graphs', () => {
  const w = initialWorkspace();
  w.scenarios[0].proposed = structuredClone(w.scenarios[0].flow);
  w.scenarios[0].proposed.nodes[1].title = 'A different action';
  assert.deepEqual(parseWorkspace(serializeWorkspace(w)), w);
  assert.notEqual(
    w.scenarios[0].flow.nodes[1].title,
    w.scenarios[0].proposed.nodes[1].title,
  );
});
await test('Markdown exports edited graphs and notes without treating archived steps as current', () => {
  const w = initialWorkspace();
  const s = w.scenarios[0];
  s.notes = 'Keep this discovery note';
  s.steps = [{ ...newStep(), title: 'Archived action from v1' }];
  s.flow.nodes[0].title = 'Current graph action';
  s.proposed = structuredClone(s.flow);
  s.proposed.nodes[0].title = 'Proposed graph action';
  const markdown = scenarioMarkdown(s);
  assert.match(markdown, /Keep this discovery note/);
  assert.match(markdown, /Current graph action/);
  assert.match(markdown, /Proposed graph action/);
  assert.doesNotMatch(markdown, /Archived action from v1/);
});
await test('AI proposals cannot assert observed evidence or grant their own unreviewed authority', () => {
  const flow = structuredClone(examples[0].flow);
  flow.nodes.forEach((n) => {
    n.evidence = 'Observed';
    n.review = false;
  });
  const p = parseProposal(
    JSON.stringify({ summary: 'Draft', assumptions: ['Unmeasured'], flow }),
  );
  assert.ok(p.flow.nodes.every((n) => n.evidence === 'Assumption'));
  assert.ok(p.flow.nodes.filter((n) => n.ai).every((n) => n.review));
  assert.equal(examples[0].flow.nodes[0].evidence, 'Assumption');
});

await test('AI validation rejects ambiguous routing and impossible input contracts', () => {
  const ambiguous = structuredClone(examples[0].flow);
  ambiguous.edges.find((e) => e.from === 'ready' && e.to === 'missing')!.when =
    'exception';
  assert.throws(
    () =>
      parseProposal(
        JSON.stringify({ summary: 'Draft', assumptions: [], flow: ambiguous }),
      ),
    /exclusive/,
  );
  const missing = structuredClone(examples[0].flow);
  missing.nodes.find((n) => n.id === 'confirm')!.inputs = ['unknownReceipt'];
  assert.throws(
    () =>
      parseProposal(
        JSON.stringify({ summary: 'Draft', assumptions: [], flow: missing }),
      ),
    /Input contract/,
  );
});
await test('migration refreshes only untouched demo defaults and preserves custom company text', () => {
  const old = legacyInitial();
  old.notebook.mission = 'Our own mission';
  old.notebook.vision = 'Our own vision';
  const w = parseWorkspace(JSON.stringify(old));
  assert.equal(w.notebook.mission, old.notebook.mission);
  assert.equal(w.notebook.vision, old.notebook.vision);
  assert.equal(w.scenarios.length, 4);
  const altered = legacyInitial();
  altered.scenarios[0].notes = 'My edit';
  const v = parseWorkspace(JSON.stringify(altered));
  assert.equal(v.scenarios.length, 1);
  assert.equal(v.scenarios[0].notes, 'My edit');
});
