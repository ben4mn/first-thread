import { useState } from 'react';
import { Play, Check, X, Download, ArrowRight } from 'lucide-react';
import { NativeSelect } from '@/components/ui/native-select';
import { caseInput, runFlow, type Flow, type Run } from '@/lib/graph';
import { Field, download } from './studio-ui';
export function Rehearsal({
  baseline,
  proposed,
}: {
  baseline: Flow;
  proposed: Flow | null;
}) {
  const [variant, setVariant] = useState('normal');
  const [caseId, setCaseId] = useState('CASE-001');
  const [approved, setApproved] = useState<string[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  const [started, setStarted] = useState(false);
  const target = proposed || baseline;
  const input = { ...caseInput(baseline, variant), id: caseId };
  const current = runFlow(baseline, input, false);
  const next = runFlow(target, input, true, approved, rejected);
  const reset = () => {
    setApproved([]);
    setRejected([]);
    setStarted(true);
  };
  const trace = (run: Run, title: string, canReview: boolean) => (
    <section className="trace-column">
      <div className="trace-header">
        <div className="eyebrow">{title}</div>
        <h3>{run.terminal}</h3>
        <div className="trace-stats">
          <span>
            <strong>{run.minutes}</strong> handling min
          </span>
          <span>
            <strong>{run.wait}</strong> waiting min
          </span>
          <span>
            <strong>{run.signals.length}</strong> handoffs
          </span>
        </div>
      </div>
      <ol className="trace-list">
        {run.trace.map((e, i) => (
          <li className={`trace-event ${e.status}`} key={`${e.nodeId}-${i}`}>
            <span className="trace-number">{i + 1}</span>
            <div>
              <strong>{e.title}</strong>
              <p>{e.detail}</p>
              {e.signal && <code>↳ {e.signal}</code>}
              {e.status === 'review' && canReview && (
                <div className="actions" style={{ marginTop: 12 }}>
                  <button
                    className="btn primary"
                    onClick={() => setApproved((a) => [...a, e.nodeId])}
                  >
                    <Check />
                    Approve for rehearsal
                  </button>
                  <button
                    className="btn danger"
                    onClick={() => setRejected((a) => [...a, e.nodeId])}
                  >
                    <X />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
  return (
    <div className="rehearsal">
      <div className="paper rehearsal-intro">
        <div>
          <div className="eyebrow">Test the operating logic</div>
          <h2>Follow a case, including the awkward parts.</h2>
          <p className="muted small">
            A deterministic rehearsal of your graph. No model or business system
            runs here. Times, confidence, and completions are test assumptions.
          </p>
        </div>
        <div className="rehearsal-controls">
          <Field label="Case identifier">
            <input
              value={caseId}
              onChange={(e) => {
                setCaseId(e.target.value);
                setStarted(false);
              }}
              maxLength={80}
            />
          </Field>
          <Field label="Test conditions">
            <NativeSelect
              value={variant}
              onChange={(e) => {
                setVariant(e.target.value);
                setStarted(false);
                setApproved([]);
                setRejected([]);
              }}
            >
              <option value="normal">Complete context / standard case</option>
              <option value="missing">Missing context</option>
              <option value="exception">Exception requires a person</option>
              <option value="uncertain">Uncertain AI output</option>
              <option value="failure">AI tool failure</option>
            </NativeSelect>
          </Field>
          <button className="btn primary" onClick={reset}>
            <Play />
            Rehearse case
          </button>
        </div>
      </div>
      {!proposed && (
        <div className="inline-note">
          The comparison activates the AI candidates already described in the
          current map. Create a separate proposed flow to edit those contracts
          independently.
        </div>
      )}
      {started && (
        <>
          <div className="comparison-banner">
            <span>
              {input.id || 'Unnamed case'} · same inputs for both routes
            </span>
            <strong>
              {next.status === 'review'
                ? 'Proposed flow is paused for review'
                : next.status === 'complete' && current.status === 'complete'
                  ? `${Math.abs(current.minutes - next.minutes)} ${current.minutes >= next.minutes ? 'fewer' : 'more'} assumed handling minutes`
                  : `Rehearsal status: ${next.status}`}
            </strong>
            <button
              className="btn"
              onClick={() =>
                download(
                  'first-thread-rehearsal.json',
                  JSON.stringify(
                    {
                      type: 'deterministic-rehearsal',
                      case: input,
                      assumptions:
                        'Illustrative handling/wait minutes; no live model or external execution',
                      baseline: current,
                      proposed: next,
                      approved,
                      rejected,
                    },
                    null,
                    2,
                  ),
                )
              }
            >
              <Download />
              Export trace
            </button>
          </div>
          <div className="trace-grid">
            {trace(current, 'Current flow', false)}
            {trace(next, 'With proposed AI delegation', true)}
          </div>
          <div className="inline-note">
            <ArrowRight size={16} />
            Completion means the modeled path reached its terminal state. Real
            outcome evidence still needs to come from the business.
          </div>
        </>
      )}
    </div>
  );
}
