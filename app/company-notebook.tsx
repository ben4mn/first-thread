import type { Notebook } from '@/lib/domain';
import { Field, download, REPO } from './studio-ui';
const principles = [
  [
    'Describe the business, not the vendor.',
    'Capabilities endure when software changes. Use industry language as a translation of the shared model.',
  ],
  [
    'Carry context with the case.',
    'A handoff should preserve identity, sources, constraints, and the state reached so far.',
  ],
  [
    'Keep decisions explicit.',
    'Make conditions, exceptions, accountable owners, and outcome evidence visible on the same flow.',
  ],
  [
    'Delegate bounded work.',
    'Give AI a specific task, known inputs, a checkable output, and a fallback. Separate a proposal from authorization.',
  ],
  [
    'Improve outcomes with evidence.',
    'Measure handling, waiting, rework, quality, and completion. A quicker step is useful only if the whole outcome improves.',
  ],
  [
    'Learn from one real case.',
    'Use a small pilot to challenge the map. Connect related scenarios as evidence accumulates.',
  ],
];
export function CompanyNotebook({
  notebook,
  onChange,
}: {
  notebook: Notebook;
  onChange: (value: Notebook) => void;
}) {
  return (
    <main id="main" className="company">
      <div className="company-title">
        <div>
          <div className="eyebrow">Company notebook / draft 02</div>
          <h1>
            Make business operations understandable. Then make them better.
          </h1>
          <p>
            One shared language for people, software, and AI working toward a
            business outcome.
          </p>
        </div>
        <div className="company-note">
          <div className="eyebrow">A broader frame</div>
          <p>
            The September 6 conversation established the workshop. This revision
            tests its model across digital industries and makes AI delegation
            explicit. The company direction remains open for Ben and Paul.
          </p>
        </div>
      </div>
      <section className="statements">
        <div className="statement">
          <label className="eyebrow" htmlFor="mission">
            Mission / editable draft
          </label>
          <textarea
            id="mission"
            value={notebook.mission}
            maxLength={40000}
            onChange={(e) => onChange({ ...notebook, mission: e.target.value })}
          />
          <small>Saved in this browser; export to share.</small>
        </div>
        <div className="statement vision">
          <label className="eyebrow" htmlFor="vision">
            Vision / editable draft
          </label>
          <textarea
            id="vision"
            value={notebook.vision}
            maxLength={40000}
            onChange={(e) => onChange({ ...notebook, vision: e.target.value })}
          />
          <small>Direction, not a claim about present capabilities.</small>
        </div>
      </section>
      <section className="notebook-section">
        <div>
          <div className="eyebrow">The thesis</div>
          <h2>
            The industry varies.
            <br />
            The operating questions repeat.
          </h2>
        </div>
        <div>
          <p>
            A booking, referral, order, or account request is a case with
            identity and changing state. People and systems act on it, passing
            signals and context across boundaries. A shared model makes those
            relationships visible without requiring every business to use the
            same tools.
          </p>
          <p style={{ marginTop: 16 }}>
            That model becomes the foundation for orchestration: determine what
            is needed next, delegate an appropriate action, verify its result,
            and retain the evidence. AI can help interpret context and propose
            work inside that structure.
          </p>
        </div>
      </section>
      <section className="notebook-section">
        <div>
          <div className="eyebrow">Working principles</div>
          <h2>What should hold across industries.</h2>
        </div>
        <div className="principles">
          {principles.map(([t, p]) => (
            <div key={t}>
              <h3>{t}</h3>
              <p>{p}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="notebook-section">
        <div>
          <div className="eyebrow">Still to decide</div>
          <h2>Prove the pattern in practice.</h2>
        </div>
        <div className="questions">
          {[
            'Which initial customer gives us both a complete scenario and authority to improve it?',
            'Which concepts stay universal, and which belong in an industry-specific vocabulary or policy?',
            'What outcome is valuable enough to pay for, beyond a clearer diagram?',
            'What evidence would justify moving an AI task from suggestion to supervised execution?',
            'How should we connect cases that share capabilities, components, and constraints?',
          ].map((q, i) => (
            <div className="question" key={q}>
              <span>0{i + 1}</span>
              <p>{q}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="notebook-section">
        <div>
          <div className="eyebrow">Workshop notes</div>
          <h2>What changed our minds?</h2>
        </div>
        <div>
          <Field label="Decisions, disagreements, and next tests">
            <textarea
              rows={6}
              value={notebook.notes}
              maxLength={40000}
              onChange={(e) => onChange({ ...notebook, notes: e.target.value })}
            />
          </Field>
          <button
            className="btn primary"
            onClick={() =>
              download(
                'first-thread-company-notes.md',
                `# First Thread company workshop\n\n## Mission\n${notebook.mission}\n\n## Vision\n${notebook.vision}\n\n## Notes\n${notebook.notes}\n\n## Principles\n${principles.map(([a, b]) => `### ${a}\n${b}`).join('\n\n')}`,
                'text/markdown',
              )
            }
          >
            Export company notes
          </button>
        </div>
      </section>
      <div className="company-links">
        <a
          className="btn"
          href={`${REPO}/blob/main/docs/universal-model.md`}
          target="_blank"
          rel="noreferrer"
        >
          Model research & sources ↗
        </a>
        <a
          className="btn"
          href={`${REPO}/blob/main/docs/orchestration-design.md`}
          target="_blank"
          rel="noreferrer"
        >
          Orchestration direction ↗
        </a>
        <a
          className="btn"
          href={`${REPO}/blob/main/docs/company-direction.md`}
          target="_blank"
          rel="noreferrer"
        >
          Company draft ↗
        </a>
      </div>
    </main>
  );
}
export function Method() {
  return (
    <main id="main" className="company method">
      <div className="eyebrow">One model / many industries</div>
      <h1>Map the work behind the tools.</h1>
      <p className="method-lead">
        A capability describes what the business can do. A component supplies
        that capability. An action applies it to a particular case. Signals
        connect the actions; evidence tells us whether the outcome happened.
      </p>
      <div className="grammar">
        <span>Trigger</span>
        <b>→</b>
        <span>Case + context</span>
        <b>→</b>
        <span>Actions + decisions</span>
        <b>→</b>
        <span>Verified outcome</span>
      </div>
      <div className="paper">
        <table className="method-table">
          <thead>
            <tr>
              <th>Shared concept</th>
              <th>Travel / OTA</th>
              <th>Hospital administration</th>
              <th>Digital commerce</th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                'Case',
                'Booking disruption',
                'Referral request',
                'Delivery exception',
              ],
              [
                'Trigger',
                'Supplier cancellation event',
                'Referral arrives',
                'Failed-delivery event',
              ],
              [
                'Understand',
                'Assemble booking constraints',
                'Assemble administrative packet',
                'Assemble order context',
              ],
              [
                'Arrange',
                'Prepare alternatives',
                'Prepare a routing recommendation',
                'Prepare resolution options',
              ],
              [
                'Authorize',
                'Operator / traveler accepts',
                'Responsible staff reviews',
                'Customer / operator accepts',
              ],
              [
                'Outcome evidence',
                'Accepted alternative + confirmation',
                'Destination acknowledgement',
                'Agreed resolution + updated order',
              ],
            ].map((row) => (
              <tr key={row[0]}>
                {row.map((v, i) =>
                  i === 0 ? <th key={v}>{v}</th> : <td key={i}>{v}</td>,
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="notebook-section">
        <div>
          <div className="eyebrow">Working vocabulary</div>
          <h2>Each term has a job.</h2>
        </div>
        <dl className="glossary">
          {[
            [
              'Case',
              'One instance of work with a stable identity, such as a booking or referral.',
            ],
            [
              'State',
              'A condition of the case after an action: received, awaiting information, confirmed.',
            ],
            [
              'Capability',
              'A reusable business ability: understand context, decide, arrange, fulfill, observe.',
            ],
            [
              'Component',
              'A person, team, system, or agent able to perform work.',
            ],
            ['Action', 'One application of a capability to this case.'],
            [
              'Signal',
              'An event or context handoff connecting actions; different from the stored state.',
            ],
            [
              'Decision',
              'An explicit rule or accountable judgment that determines the next route.',
            ],
            [
              'Surface / channel',
              'Where an interaction happens / the medium carrying it.',
            ],
            [
              'Outcome',
              'The intended business result, with evidence that it occurred.',
            ],
            [
              'Delegation contract',
              'The AI task, permitted context, expected output, review requirement, and fallback.',
            ],
          ].map(([t, d]) => (
            <div key={t}>
              <dt>{t}</dt>
              <dd>{d}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="notebook-section">
        <div>
          <div className="eyebrow">Three distinct layers</div>
          <h2>
            Understand.
            <br />
            Rehearse.
            <br />
            Operate.
          </h2>
        </div>
        <div className="principles">
          <div>
            <h3>Definition</h3>
            <p>
              The map expresses what should happen. Context and evidence
              describe how confident we are in that model.
            </p>
          </div>
          <div>
            <h3>Rehearsal</h3>
            <p>
              Test a case against the conditions and contracts. Challenge
              missing context, review gates, failures, and effort assumptions.
            </p>
          </div>
          <div>
            <h3>AI design</h3>
            <p>
              A model can turn notes into a structured proposal. Review it
              separately from the current map before adopting a draft.
            </p>
          </div>
          <div>
            <h3>Live operation · next stage</h3>
            <p>
              A durable execution service must authenticate actors, call
              connected systems, reconcile results, and retain actual outcome
              evidence. The public prototype does not execute business actions.
            </p>
          </div>
        </div>
      </section>
      <p className="small muted">
        The model is a synthesis informed by BPMN/DMN, FHIR workflow,
        CloudEvents, and durable workflow patterns. It is not an implementation
        or certification of those standards.{' '}
        <a
          href={`${REPO}/blob/main/docs/universal-model.md`}
          target="_blank"
          rel="noreferrer"
        >
          Read the research and sources ↗
        </a>
      </p>
    </main>
  );
}
