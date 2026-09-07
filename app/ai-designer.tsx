/* eslint-disable react/react-compiler */
import { useEffect, useState } from 'react';
import { ArrowRight, Bot, Download, Sparkles } from 'lucide-react';
import { designPrompt, parseProposal, type Proposal } from '@/lib/ai';
import { flowIssues, type Flow } from '@/lib/graph';
import type { Scenario } from '@/lib/domain';
import { Field, download, REPO } from './studio-ui';
export function AIDesigner({
  scenario,
  onApply,
  onNotes,
}: {
  scenario: Scenario;
  onNotes: (notes: string) => void;
  onApply: (flow: Flow) => boolean;
}) {
  const [notes, setNotes] = useState(scenario.notes);
  const [response, setResponse] = useState('');
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [connection, setConnection] = useState(false);
  useEffect(() => {
    if (!['localhost', '127.0.0.1'].includes(location.hostname)) return;
    let canceled = false;
    fetch('/api/ai/status')
      .then((r) => r.json())
      .then((v: unknown) => {
        if (!canceled)
          setConnection(
            !!v &&
              typeof v === 'object' &&
              'configured' in v &&
              v.configured === true,
          );
      })
      .catch(() => {});
    return () => {
      canceled = true;
    };
  }, []);
  const input = {
    title: scenario.title,
    trigger: scenario.trigger,
    outcome: scenario.outcome,
    notes,
    flow: scenario.flow,
  };
  const review = (text: string) => {
    try {
      const parsed = parseProposal(text);
      const issues = flowIssues(parsed.flow);
      if (issues.length)
        throw new Error(`Resolve these flow issues first: ${issues.join(' ')}`);
      setProposal(parsed);
      setError('');
    } catch (e) {
      setProposal(null);
      setError(
        e instanceof Error ? e.message : 'Could not validate this proposal.',
      );
    }
  };
  const generate = async () => {
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/ai/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(70000),
      });
      const result = (await r.json()) as {
        proposal?: Proposal;
        error?: string;
      };
      if (!r.ok || !result.proposal)
        throw new Error(
          result.error || 'The model did not return a complete proposal.',
        );
      const text = JSON.stringify(result.proposal, null, 2);
      setResponse(text);
      review(text);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'The AI connection failed. Your flow is unchanged.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="ai-studio">
      <section className="paper">
        <div className="eyebrow">
          <Bot size={14} /> AI design layer
        </div>
        <h2>Describe the business. Review the proposal.</h2>
        <p className="muted small">
          Use AI to translate discovery notes into this shared model and
          identify bounded delegation opportunities. A proposal is kept separate
          from the current flow.
        </p>
        <Field
          label="Discovery context for the AI"
          hint="Include the case, steps, tools, decisions, friction, and outcome evidence. These notes are sent only when you request a proposal or export a brief."
        >
          <textarea
            rows={9}
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              onNotes(e.target.value);
            }}
            maxLength={40000}
            placeholder="When this event happens, we look up… then the team decides…"
          />
        </Field>
        <div className="actions">
          <button
            className="btn primary"
            onClick={() =>
              download(
                'first-thread-ai-brief.md',
                designPrompt(input),
                'text/markdown',
              )
            }
          >
            <Download />
            Export AI brief
          </button>
          <button
            className="btn"
            disabled={!connection || busy}
            onClick={() => void generate()}
          >
            <Sparkles />
            {busy ? 'Preparing proposal…' : 'Generate with local AI'}
          </button>
        </div>
        <div className="connection-note">
          <span className={`live-dot ${connection ? '' : 'off'}`} />
          {connection
            ? 'Local AI connection available. Generating sends this context to OpenAI.'
            : 'Public demo: use the brief with your AI tool, then paste its JSON below.'}
          <a
            href={`${REPO}/blob/main/docs/ai-connection.md`}
            target="_blank"
            rel="noreferrer"
          >
            Local connection setup ↗
          </a>
        </div>
      </section>
      <section className="paper">
        <div className="eyebrow">Structured handoff</div>
        <h2>Check it before changing the flow.</h2>
        <Field label="AI proposal JSON">
          <textarea
            className="json-area"
            rows={7}
            value={response}
            onChange={(e) => {
              setResponse(e.target.value);
              setProposal(null);
            }}
            maxLength={500000}
            placeholder='{"summary": "…", "assumptions": […], "flow": {…}}'
          />
        </Field>
        <button className="btn" onClick={() => review(response)}>
          Validate proposal
          <ArrowRight />
        </button>
        {error && (
          <p className="notice" role="alert">
            {error}
          </p>
        )}
        {proposal && (
          <div className="proposal-review">
            <h3>{proposal.summary}</h3>
            <p>
              {proposal.flow.nodes.length} actions ·{' '}
              {proposal.flow.edges.length} signal routes ·{' '}
              {proposal.flow.nodes.filter((n) => n.ai).length} AI candidates
            </p>
            <ul>
              {proposal.assumptions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
            <p className="small muted">
              AI candidates require human review. All generated claims remain
              assumptions. Applying replaces only the proposed flow.
            </p>
            <button
              className="btn primary"
              onClick={() => {
                if (onApply(proposal.flow)) {
                  setError('');
                  setProposal(null);
                  setResponse('');
                }
              }}
            >
              Use as proposed flow
              <ArrowRight />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
