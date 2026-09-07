import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';
import { createAIService } from '../server/ai-service.mjs';
import { examples } from '../lib/examples.ts';
async function using(options, fn) {
  const server = createAIService(options);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    await fn(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}
const headers = {
  'Content-Type': 'application/json',
  Origin: 'http://127.0.0.1:5274',
};
const context = {
  title: 'Demo',
  trigger: 'Event',
  outcome: 'Confirmed',
  notes: 'Source notes',
  flow: examples[0].flow,
};
await test('AI server requires configuration and rejects foreign browser origins', async () => {
  await using({ apiKey: '', model: '' }, async (base) => {
    assert.deepEqual(await (await fetch(base + '/api/ai/status')).json(), {
      configured: false,
    });
    assert.equal(
      (
        await fetch(base + '/api/ai/propose', {
          method: 'POST',
          headers,
          body: '{}',
        })
      ).status,
      503,
    );
    assert.equal(
      (
        await fetch(base + '/api/ai/propose', {
          method: 'POST',
          headers: { ...headers, Origin: 'https://unrelated.example' },
          body: '{}',
        })
      ).status,
      403,
    );
  });
});
await test('AI server sends bounded structured output request and validates proposal before returning it', async () => {
  let request;
  const fetcher = async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    request = JSON.parse(options.body);
    return new Response(
      JSON.stringify({
        output: [
          {
            content: [
              {
                type: 'output_text',
                text: JSON.stringify({
                  summary: 'Review draft',
                  assumptions: ['Example'],
                  flow: examples[0].flow,
                }),
              },
            ],
          },
        ],
      }),
      { status: 200 },
    );
  };
  await using(
    { apiKey: 'test-only', model: 'test-model', fetcher },
    async (base) => {
      const r = await fetch(base + '/api/ai/propose', {
        method: 'POST',
        headers,
        body: JSON.stringify(context),
      });
      assert.equal(r.status, 200);
      const result = await r.json();
      assert.equal(result.proposal.summary, 'Review draft');
      assert.equal(request.store, false);
      assert.equal(request.text.format.strict, true);
      assert.equal(request.tools, undefined);
    },
  );
});
await test('malformed or incomplete provider output never becomes an applied flow', async () => {
  for (const output of [
    { output: [] },
    { status: 'incomplete' },
    {
      output: [{ content: [{ type: 'output_text', text: '{"wrong":true}' }] }],
    },
  ]) {
    await using(
      {
        apiKey: 'test-only',
        model: 'test-model',
        fetcher: async () => new Response(JSON.stringify(output)),
      },
      async (base) => {
        const r = await fetch(base + '/api/ai/propose', {
          method: 'POST',
          headers,
          body: JSON.stringify(context),
        });
        assert.equal(r.status, 400);
        assert.ok((await r.json()).error);
      },
    );
  }
});
