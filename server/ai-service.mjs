import { createServer } from 'node:http';
import { designPrompt, parseProposal, proposalSchema } from '../lib/ai.ts';
import { parseFlow } from '../lib/graph.ts';
export function createAIService({
  apiKey = process.env.OPENAI_API_KEY,
  model = process.env.AI_MODEL,
  fetcher = fetch,
} = {}) {
  return createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    const reply = (status, value) => {
      res.writeHead(status);
      res.end(JSON.stringify(value));
    };
    if (req.method === 'GET' && req.url === '/api/ai/status') {
      reply(200, { configured: !!apiKey && !!model });
      return;
    }
    if (req.method !== 'POST' || req.url !== '/api/ai/propose') {
      reply(404, { error: 'Not found' });
      return;
    }
    if (
      !['http://127.0.0.1:5274', 'http://localhost:5274'].includes(
        req.headers.origin,
      ) ||
      !req.headers['content-type']?.startsWith('application/json')
    ) {
      reply(403, { error: 'Use the local First Thread app on port 5274.' });
      return;
    }
    if (!apiKey || !model) {
      reply(503, {
        error:
          'Set OPENAI_API_KEY and AI_MODEL in .env.local, then restart npm run dev:ai.',
      });
      return;
    }
    try {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (Buffer.byteLength(body) > 500000) {
          reply(413, { error: 'Keep the AI design context under 500 KB.' });
          return;
        }
      }
      const raw = JSON.parse(body);
      if (
        !['title', 'trigger', 'outcome', 'notes'].every(
          (k) => typeof raw[k] === 'string' && raw[k].length <= 80000,
        )
      )
        throw new Error('Invalid design context.');
      const input = {
        title: raw.title,
        trigger: raw.trigger,
        outcome: raw.outcome,
        notes: raw.notes,
        flow: parseFlow(raw.flow),
      };
      const response = await fetcher('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          store: false,
          input: designPrompt(input),
          max_output_tokens: 12000,
          text: {
            format: {
              type: 'json_schema',
              name: 'flow_proposal',
              strict: true,
              schema: proposalSchema,
            },
          },
        }),
        signal: AbortSignal.timeout(60000),
      });
      if (!response.ok) {
        reply(502, {
          error: `The AI provider returned status ${response.status}. Check model access and API configuration. Your flow is unchanged.`,
        });
        return;
      }
      const result = await response.json();
      if (result.status === 'incomplete')
        throw new Error(
          'The model response was incomplete. Reduce the source context and retry.',
        );
      const text = (result.output || [])
        .flatMap((item) => item.content || [])
        .filter((item) => item.type === 'output_text')
        .map((item) => item.text)
        .join('');
      if (!text)
        throw new Error(
          'The model returned no proposal, or declined the request.',
        );
      reply(200, { proposal: parseProposal(text) });
    } catch (error) {
      reply(400, {
        error:
          error instanceof Error
            ? error.message
            : 'Could not generate a valid proposal. Your flow is unchanged.',
      });
    }
  });
}
