import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  initialWorkspace,
  parseWorkspace,
  serializeWorkspace,
  MAX_WORKSPACE_BYTES,
  newScenario,
  newStep,
  moveStep,
  scenarioMarkdown,
  uid,
} from '../lib/legacy-domain.ts';

await test('a complete custom workshop survives export/import without losing its records', () => {
  const w = initialWorkspace();
  const s = newScenario(
    'An exception',
    'A request is rejected',
    'A reviewed decision reaches the customer',
    'Workshop',
    'Interview excerpt',
  );
  const step = {
    ...newStep(),
    title: 'Review decision',
    tool: 'Review queue',
    incoming: 'Rejection reason',
    outgoing: 'Decision',
    evidence: 'Observed' as const,
    source: 'Request 123',
    friction: 'Missing context',
    adjacent: 'Operations',
  };
  s.steps = [step];
  s.future = 'Context is retained';
  s.firstMove = 'Try ten requests';
  s.measure = 'Count repeat questions';
  s.guardrail = 'Manual review';
  s.owner = 'Workshop owner';
  s.hypothesis = 'Retaining context reduces repetition';
  s.questions = 'Who reviews exceptions?';
  w.scenarios.push(s);
  w.activeId = s.id;
  w.notebook.notes = 'Our next discussion';
  assert.deepEqual(parseWorkspace(JSON.stringify(w)), w);
});
await test('invalid imports fail atomically and do not alter the existing workspace', () => {
  const existing = initialWorkspace();
  const before = JSON.stringify(existing);
  for (const invalid of [
    '{',
    '{}',
    JSON.stringify({ ...existing, version: 2 }),
    JSON.stringify({ ...existing, activeId: 'missing' }),
    JSON.stringify({ ...existing, scenarios: [] }),
  ])
    assert.throws(() => parseWorkspace(invalid));
  assert.equal(JSON.stringify(existing), before);
});
await test('rejects duplicate IDs, missing fields, malformed evidence and oversized imports', () => {
  let w = initialWorkspace();
  w.scenarios.push(structuredClone(w.scenarios[0]));
  assert.throws(() => parseWorkspace(JSON.stringify(w)));
  w = initialWorkspace();
  w.scenarios[0].steps.push(structuredClone(w.scenarios[0].steps[0]));
  assert.throws(() => parseWorkspace(JSON.stringify(w)));
  const raw = JSON.parse(JSON.stringify(initialWorkspace()));
  delete raw.scenarios[0].steps[0].outgoing;
  assert.throws(() => parseWorkspace(JSON.stringify(raw)));
  const evidence = JSON.parse(JSON.stringify(initialWorkspace()));
  evidence.scenarios[0].steps[0].evidence = ['Observed'];
  assert.throws(() => parseWorkspace(JSON.stringify(evidence)));
  assert.throws(() => parseWorkspace(' '.repeat(2_000_001)));
});
await test('reordering preserves step content and obeys route boundaries', () => {
  const steps = initialWorkspace().scenarios[0].steps;
  const before = JSON.stringify(steps);
  assert.deepEqual(moveStep(steps, steps[0].id, -1), steps);
  assert.deepEqual(moveStep(steps, steps[2].id, 1), steps);
  const moved = moveStep(steps, steps[1].id, -1);
  assert.equal(moved[0].id, steps[1].id);
  assert.deepEqual(moved[0], steps[1]);
  assert.equal(JSON.stringify(steps), before);
});
await test('Markdown handoff includes source notes, evidence, first move and success measure', () => {
  const s = initialWorkspace().scenarios[0];
  const md = scenarioMarkdown(s);
  for (const expected of [
    s.trigger,
    s.outcome,
    s.notes,
    s.steps[1].friction,
    s.steps[1].source,
    s.future,
    s.firstMove,
    s.measure,
    s.guardrail,
    s.questions,
    'Fictional example',
  ])
    assert.ok(md.includes(expected));
});
await test('new scenarios are empty editable drafts, not fabricated discoveries', () => {
  const s = newScenario('  New  ', ' Start ', ' End ');
  assert.equal(s.title, 'New');
  assert.equal(s.trigger, 'Start');
  assert.equal(s.outcome, 'End');
  assert.equal(s.sample, false);
  assert.equal(s.steps.length, 0);
  assert.equal(s.future, '');
});
await test('ID creation works on plain HTTP origins without randomUUID', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: {
      getRandomValues: (bytes: Uint8Array) => {
        for (let i = 0; i < bytes.length; i++) bytes[i] = i;
        return bytes;
      },
    },
  });
  try {
    assert.match(
      uid(),
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'crypto', descriptor);
  }
});

await test('one UTF-8 byte limit protects saved work and exported backups', () => {
  const w = initialWorkspace();
  const source = '界'.repeat(40000);
  w.scenarios[0].steps = Array.from({ length: 16 }, () => ({
    ...newStep(),
    title: 'A step',
    source,
  }));
  const serialized = serializeWorkspace(w);
  assert.ok(
    new TextEncoder().encode(serialized).byteLength <= MAX_WORKSPACE_BYTES,
  );
  assert.deepEqual(parseWorkspace(serialized), w);
  w.scenarios[0].steps.push(
    ...Array.from({ length: 4 }, () => ({
      ...newStep(),
      title: 'A step',
      source,
    })),
  );
  assert.throws(() => serializeWorkspace(w), /2 MB/);
  assert.throws(() => parseWorkspace(JSON.stringify(w)), /2 MB/);
});
