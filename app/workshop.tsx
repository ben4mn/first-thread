'use client';

// Browser storage and URL state are synchronized after hydration; these effects
// deliberately update state once the external, browser-only sources are available.
/* eslint-disable react/react-compiler */

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type SyntheticEvent,
} from 'react';
import {
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Plus,
  Download,
  Upload,
  Pencil,
  GitBranch,
  CircleDot,
  Check,
  AlertTriangle,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import { NativeSelect } from '@/components/ui/native-select';
import {
  initialWorkspace,
  newScenario,
  newStep,
  moveStep,
  parseWorkspace,
  serializeWorkspace,
  MAX_WORKSPACE_BYTES,
  scenarioMarkdown,
  uid,
  type Step,
  type Scenario,
  type Workspace,
} from '@/lib/domain';
import { principles, questions, glossary } from '@/lib/company';

const STORAGE_KEY = 'first-thread.workspace.v1';
function formText(data: FormData, key: string) {
  const value = data.get(key);
  return typeof value === 'string' ? value : '';
}
const REPO = 'https://github.com/ben4mn/first-thread';
function download(name: string, content: string, type = 'application/json') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Field({
  label,
  hint,
  children,
  full = false,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`field ${full ? 'full' : ''}`}>
      {label}
      {hint && <span className="hint">{hint}</span>}
      {children}
    </label>
  );
}
function FormInput({
  label,
  name,
  value = '',
  multiline = false,
  required = false,
  hint,
  full = false,
}: {
  label: string;
  name: string;
  value?: string;
  multiline?: boolean;
  required?: boolean;
  hint?: string;
  full?: boolean;
}) {
  return (
    <Field label={label} hint={hint} full={full}>
      {multiline ? (
        <textarea
          name={name}
          defaultValue={value}
          required={required}
          maxLength={40000}
          rows={3}
        />
      ) : (
        <input
          name={name}
          defaultValue={value}
          required={required}
          maxLength={40000}
        />
      )}
    </Field>
  );
}
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="fact">
      <dt>{label}</dt>
      <dd>{value || 'Not yet captured'}</dd>
    </div>
  );
}

export default function Home() {
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [storageBlocked, setStorageBlocked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [view, setView] = useState('workshop');
  const [tab, setTab] = useState('today');
  const [selected, setSelected] = useState<string | null>('step-2');
  const [modal, setModal] = useState<'new' | 'brief' | 'step' | null>(null);
  const [stepDraft, setStepDraft] = useState<Step | null>(null);
  const [pendingImport, setPendingImport] = useState<Workspace | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<'step' | 'scenario' | null>(
    null,
  );
  const [notice, setNotice] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const scenario =
    workspace.scenarios.find((s) => s.id === workspace.activeId) ||
    workspace.scenarios[0];
  const step = scenario.steps.find((s) => s.id === selected);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = parseWorkspace(stored);
        setWorkspace(data);
        setSelected(
          data.scenarios.find((s) => s.id === data.activeId)?.steps[0]?.id ||
            null,
        );
      }
    } catch {
      setStorageError(
        'We could not load the saved workspace. It has been preserved. Export the saved data before starting a fresh copy.',
      );
      setStorageBlocked(true);
    }
    setReady(true);
    const route = () =>
      setView(location.hash === '#/company' ? 'company' : 'workshop');
    route();
    window.addEventListener('hashchange', route);
    return () => window.removeEventListener('hashchange', route);
  }, []);
  useEffect(() => {
    if (!ready || storageBlocked) return;
    setSaved(false);
    try {
      const serialized = serializeWorkspace(workspace);
      localStorage.setItem(STORAGE_KEY, serialized);
      setSaved(true);
      setStorageError('');
    } catch {
      setStorageError(
        'Changes are in memory, but this browser could not save them. Export your workspace before closing this page.',
      );
    }
  }, [workspace, ready, storageBlocked]);

  function commitWorkspace(candidate: Workspace): boolean {
    try {
      serializeWorkspace(candidate);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : 'This change could not be saved.',
      );
      return false;
    }
    setWorkspace(candidate);
    return true;
  }
  function updateScenario(patch: Partial<Scenario>) {
    return commitWorkspace({
      ...workspace,
      scenarios: workspace.scenarios.map((s) =>
        s.id === workspace.activeId ? { ...s, ...patch } : s,
      ),
    });
  }
  function updateNotebook(
    field: 'mission' | 'vision' | 'notes',
    value: string,
  ) {
    commitWorkspace({
      ...workspace,
      notebook: { ...workspace.notebook, [field]: value },
    });
  }
  function switchScenario(id: string) {
    setWorkspace((w) => ({ ...w, activeId: id }));
    setSelected(
      workspace.scenarios.find((s) => s.id === id)?.steps[0]?.id || null,
    );
    setTab('today');
    setNotice('');
  }
  function exportWorkspace() {
    download('first-thread-workspace.json', serializeWorkspace(workspace));
    setNotice(
      'Workspace exported. Import this file on another device to continue.',
    );
  }
  function exportBrief() {
    download(
      `${
        scenario.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .slice(0, 60) || 'scenario'
      }.md`,
      scenarioMarkdown(scenario),
      'text/markdown',
    );
    setNotice('Workshop brief exported as Markdown.');
  }
  function duplicate() {
    if (workspace.scenarios.length >= 100) {
      setNotice(
        'This workspace supports up to 100 scenarios. Export a copy before starting another workspace.',
      );
      return;
    }
    const copy = {
      ...structuredClone(scenario),
      id: uid(),
      title: `${scenario.title.slice(0, 39993)} (copy)`,
      steps: scenario.steps.map((s) => ({ ...s, id: uid() })),
    };
    if (
      !commitWorkspace({
        ...workspace,
        scenarios: [...workspace.scenarios, copy],
        activeId: copy.id,
      })
    )
      return;
    setSelected(copy.steps[0]?.id || null);
    setNotice('Scenario duplicated.');
  }
  async function readImport(file?: File) {
    if (!file) return;
    try {
      if (file.size > MAX_WORKSPACE_BYTES)
        throw new Error('Choose a First Thread export under 2 MB.');
      setPendingImport(parseWorkspace(await file.text()));
      setNotice('');
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : 'Could not read this file.',
      );
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }
  function saveBrief(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const title = formText(data, 'title').trim();
    const trigger = formText(data, 'trigger').trim();
    const outcome = formText(data, 'outcome').trim();
    if (!title || !trigger || !outcome) {
      setNotice(
        'Give the scenario a name, one trigger, and one intended outcome.',
      );
      return;
    }
    const patch = {
      title,
      trigger,
      outcome,
      context: formText(data, 'context'),
      notes: formText(data, 'notes'),
    };
    if (modal === 'new') {
      const created = newScenario(
        title,
        trigger,
        outcome,
        patch.context,
        patch.notes,
      );
      if (
        !commitWorkspace({
          ...workspace,
          scenarios: [...workspace.scenarios, created],
          activeId: created.id,
        })
      )
        return;
      setSelected(null);
      setTab('today');
    } else if (!updateScenario(patch)) return;
    setModal(null);
    setNotice('Scenario saved.');
  }
  function editStep(target?: Step) {
    setNotice('');
    setStepDraft(target || newStep());
    setModal('step');
  }
  function saveStep(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!stepDraft) return;
    const data = new FormData(e.currentTarget);
    const title = formText(data, 'title').trim();
    if (!title) {
      setNotice('Give this step a name.');
      return;
    }
    const next = { ...stepDraft };
    for (const key of [
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
    ] as const)
      next[key] = formText(data, key).trim();
    next.evidence = formText(data, 'evidence') as Step['evidence'];
    if (
      !updateScenario({
        steps: scenario.steps.some((s) => s.id === next.id)
          ? scenario.steps.map((s) => (s.id === next.id ? next : s))
          : [...scenario.steps, next],
      })
    )
      return;
    setSelected(next.id);
    setModal(null);
    setNotice('Step saved.');
  }
  function remove() {
    if (deleteTarget === 'step' && step) {
      const remaining = scenario.steps.filter((s) => s.id !== step.id);
      updateScenario({ steps: remaining });
      setSelected(remaining[0]?.id || null);
    } else if (deleteTarget === 'scenario' && workspace.scenarios.length > 1) {
      const remaining = workspace.scenarios.filter((s) => s.id !== scenario.id);
      setWorkspace((w) => ({
        ...w,
        scenarios: remaining,
        activeId: remaining[0].id,
      }));
      setSelected(remaining[0].steps[0]?.id || null);
    }
    setDeleteTarget(null);
    setNotice('Removed from this workspace.');
  }
  const frictionCount = scenario.steps.filter((s) => s.friction).length;
  return (
    <>
      <a className="sr-only focus:not-sr-only" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <a href="#/workshop" className="brand">
          <span className="brand-mark">
            <GitBranch size={20} />
          </span>
          First Thread<span className="sr-only"> home</span>
        </a>
        <nav aria-label="Main navigation">
          <a
            href="#/workshop"
            className={view === 'workshop' ? 'active' : ''}
            aria-current={view === 'workshop' ? 'page' : undefined}
          >
            Scenario workshop
          </a>
          <a
            href="#/company"
            className={view === 'company' ? 'active' : ''}
            aria-current={view === 'company' ? 'page' : undefined}
          >
            Company notebook
          </a>
        </nav>
        <div className="top-meta">
          <span className="pill">Working prototype · 0.1</span>
          <div className="avatars" aria-label="Built for Ben and Paul">
            <span className="avatar">B</span>
            <span className="avatar">P</span>
          </div>
        </div>
      </header>
      {storageError && (
        <div className="status-banner" role="alert">
          <AlertTriangle size={18} />
          <span>{storageError}</span>
          <button className="btn" onClick={exportWorkspace}>
            Export current work
          </button>
          {storageBlocked && (
            <>
              <button
                className="btn"
                onClick={() => {
                  try {
                    download(
                      'first-thread-recovery.txt',
                      localStorage.getItem(STORAGE_KEY) || '',
                      'text/plain',
                    );
                  } catch {
                    setNotice(
                      'This browser is blocking storage access. Current work can still be exported.',
                    );
                  }
                }}
              >
                Export saved data
              </button>
              <button
                className="btn"
                onClick={() => {
                  setStorageBlocked(false);
                  setStorageError('');
                }}
              >
                Use current workspace
              </button>
            </>
          )}
        </div>
      )}
      <input
        type="file"
        ref={fileRef}
        accept=".json,application/json"
        className="sr-only"
        tabIndex={-1}
        aria-label="Import workspace file"
        onChange={(e) => void readImport(e.target.files?.[0])}
      />
      {view === 'company' ? (
        <main id="main" className="company">
          <div className="company-title">
            <div>
              <div className="eyebrow">Company notebook / draft 01</div>
              <h1>Make the path to better outcomes visible.</h1>
              <p>
                A starting point for Ben and Paul. The company name, language,
                customer, and business model are still open.
              </p>
            </div>
            <div className="company-note">
              <div className="eyebrow">From the conversations</div>
              <p>
                The September 6 call sets the scope of the first prototype. The
                first conversation supplies the larger ambition. These
                statements are proposed language for discussion.
              </p>
            </div>
          </div>
          <section
            className="statements"
            aria-label="Editable mission and vision"
          >
            <div className="statement">
              <label htmlFor="mission" className="eyebrow">
                01 / Our mission
              </label>
              <textarea
                id="mission"
                value={workspace.notebook.mission}
                onChange={(e) => updateNotebook('mission', e.target.value)}
                maxLength={40000}
              />
              <small>
                Click the statement to workshop it. Saved in this browser.
              </small>
            </div>
            <div className="statement vision">
              <label htmlFor="vision" className="eyebrow">
                02 / Our vision
              </label>
              <textarea
                id="vision"
                value={workspace.notebook.vision}
                onChange={(e) => updateNotebook('vision', e.target.value)}
                maxLength={40000}
              />
              <small>
                A direction to work toward, not a claim of present capability.
              </small>
            </div>
          </section>
          <section className="notebook-section">
            <div>
              <div className="eyebrow">The thesis</div>
              <h2>Value lives between the boxes.</h2>
            </div>
            <div>
              <p>
                An organization is more than its collection of tools. A request,
                decision, or piece of context passes between people and systems.
                When that path is hard to see, improving a single component can
                leave the larger problem intact.
              </p>
              <p style={{ marginTop: 15 }}>
                Start with one real situation. Make the route understandable,
                define a better state, and choose a practical first move. Over
                time, connected scenarios could become a living picture of how
                the organization works.
              </p>
            </div>
          </section>
          <section className="notebook-section">
            <div>
              <div className="eyebrow">Working principles</div>
              <h2>How we want to work.</h2>
            </div>
            <div className="principles">
              {principles.map(([title, text]) => (
                <div key={title}>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="notebook-section">
            <div>
              <div className="eyebrow">The first useful thing</div>
              <h2>
                One conversation.
                <br />
                One clear thread.
              </h2>
            </div>
            <div>
              <p>
                A founder-led workshop that ends with a map the person doing the
                work recognizes, a clearer outcome, and one change worth
                testing.
              </p>
              <div className="principles" style={{ marginTop: 24 }}>
                <div>
                  <h3>Now</h3>
                  <p>
                    Manual scenario capture, an editable route, visible
                    uncertainty, and a future-state hypothesis.
                  </p>
                </div>
                <div>
                  <h3>Later, if useful</h3>
                  <p>
                    Connect scenarios and operational evidence. Support better
                    decisions and, eventually, coordination across the system.
                  </p>
                </div>
              </div>
            </div>
          </section>
          <section className="notebook-section">
            <div>
              <div className="eyebrow">Still to decide</div>
              <h2>Questions worth keeping open.</h2>
            </div>
            <div className="questions">
              {questions.map((q, i) => (
                <div className="question" key={q}>
                  <span>0{i + 1}</span>
                  <p>{q}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="notebook-section">
            <div>
              <div className="eyebrow">Shared language</div>
              <h2>A small vocabulary.</h2>
              <p className="small muted" style={{ marginTop: 12 }}>
                Provisional definitions. Surface and channel especially need
                testing.
              </p>
            </div>
            <dl className="glossary">
              {glossary.map(([term, definition]) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{definition}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="notebook-section">
            <div>
              <div className="eyebrow">For the next session</div>
              <h2>
                Keep one sentence.
                <br />
                Change one sentence.
              </h2>
            </div>
            <div>
              <Field
                label="Workshop notes"
                hint="What do we agree with? What needs rewriting? What assumption should we test next?"
              >
                <textarea
                  className="note-area"
                  value={workspace.notebook.notes}
                  onChange={(e) => updateNotebook('notes', e.target.value)}
                  maxLength={40000}
                  placeholder="Capture your disagreements, decisions, and next questions…"
                />
              </Field>
              <div className="actions">
                <button
                  className="btn primary"
                  onClick={() =>
                    download(
                      'first-thread-company-notes.md',
                      `# Company direction — workshop draft\n\n## Mission\n\n${workspace.notebook.mission}\n\n## Vision\n\n${workspace.notebook.vision}\n\n## Workshop notes\n\n${workspace.notebook.notes}\n\n## Working principles\n\n${principles.map(([a, b]) => `### ${a}\n\n${b}`).join('\n\n')}\n\n## Open questions\n\n${questions.map((q) => `- ${q}`).join('\n')}\n`,
                      'text/markdown',
                    )
                  }
                >
                  <Download />
                  Export company notes
                </button>
                <button className="btn" onClick={exportWorkspace}>
                  Export workspace
                </button>
                <button
                  className="btn"
                  onClick={() => fileRef.current?.click()}
                >
                  Import workspace
                </button>
              </div>
            </div>
          </section>
          <div className="company-links">
            <a
              className="btn"
              href={`${REPO}/blob/main/docs/company-direction.md`}
              target="_blank"
              rel="noreferrer"
            >
              Full company draft
              <ExternalLink />
            </a>
            <a
              className="btn"
              href={`${REPO}/blob/main/docs/source-notes.md`}
              target="_blank"
              rel="noreferrer"
            >
              Sources & interpretation
              <ExternalLink />
            </a>
            <a
              className="btn"
              href={`${REPO}/blob/main/docs/workshop-guide.md`}
              target="_blank"
              rel="noreferrer"
            >
              Workshop guide
              <ExternalLink />
            </a>
          </div>
          <div className="workspace-footer">
            <span>
              {saved
                ? 'Changes saved in this browser.'
                : 'Changes are not yet saved.'}{' '}
              Export to share them or open on another device.
            </span>
            <span>First Thread is a working name.</span>
          </div>
        </main>
      ) : (
        <div className="workspace">
          <aside className="rail" aria-label="Scenarios">
            <div className="rail-label eyebrow">
              <span>Your scenarios</span>
              <span>
                {workspace.scenarios.length.toString().padStart(2, '0')}
              </span>
            </div>
            <div className="scenario-list">
              {workspace.scenarios.map((s) => (
                <button
                  className={`scenario-btn ${scenario.id === s.id ? 'selected' : ''}`}
                  key={s.id}
                  aria-pressed={scenario.id === s.id}
                  onClick={() => switchScenario(s.id)}
                >
                  <strong>{s.title}</strong>
                  <span>
                    {s.sample ? 'Example' : 'Workshop draft'} · {s.steps.length}{' '}
                    steps
                  </span>
                </button>
              ))}
            </div>
            <button
              className="btn"
              disabled={!ready || workspace.scenarios.length >= 100}
              onClick={() => {
                setNotice('');
                setModal('new');
              }}
            >
              <Plus />
              New scenario
            </button>
            <div className="rail-bottom">
              <div className="save-state">
                <span className="dot" />
                {!ready
                  ? 'Loading workspace…'
                  : saved
                    ? 'Saved in this browser'
                    : 'Not saved to this browser'}
              </div>
              <p>
                Take the workshop with you. Export a file, then import it on
                another device.
              </p>
              <div className="actions">
                <button className="btn quiet" onClick={exportWorkspace}>
                  <Download />
                  Export
                </button>
                <button
                  className="btn quiet"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload />
                  Import
                </button>
              </div>
            </div>
          </aside>
          <main id="main" className="main">
            <div className="heading">
              <div>
                <div className="eyebrow">
                  Scenario workshop /{' '}
                  {scenario.sample ? 'Fictional example' : 'Working draft'}
                </div>
                <h1>{scenario.title}</h1>
                <p className="muted small">
                  {scenario.context ||
                    'Start with the people who know this work.'}
                </p>
              </div>
              <div className="actions">
                <button className="btn" onClick={exportBrief}>
                  <Download />
                  Export brief
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    setNotice('');
                    setModal('brief');
                  }}
                >
                  <Pencil />
                  Edit scenario
                </button>
              </div>
            </div>
            <section className="contract" aria-label="Scenario boundaries">
              <div>
                <div className="eyebrow">
                  <CircleDot size={13} />
                  One trigger
                </div>
                <p>{scenario.trigger}</p>
              </div>
              <div className="contract-arrow">
                <ArrowRight size={22} />
              </div>
              <div>
                <div className="eyebrow">
                  <Check size={14} />
                  Intended outcome
                </div>
                <p>{scenario.outcome}</p>
              </div>
            </section>
            <Tabs
              className="work-tabs"
              value={tab}
              onValueChange={(value) => setTab(String(value))}
            >
              <TabsList aria-label="Workshop views">
                <TabsTrigger value="today">
                  <span>01</span>Map today
                </TabsTrigger>
                <TabsTrigger value="future">
                  <span>02</span>A better state
                </TabsTrigger>
                <TabsTrigger value="notes">
                  <span>03</span>Discovery notes
                </TabsTrigger>
              </TabsList>
              <TabsContent value="today">
                <div className="map-layout">
                  <div>
                    <section
                      className="map-panel"
                      aria-label="Current scenario map"
                    >
                      <div className="panel-toolbar">
                        <div>
                          <h2>Follow the thread</h2>
                          <span className="muted">
                            {scenario.steps.length} steps · {frictionCount}{' '}
                            friction {frictionCount === 1 ? 'point' : 'points'}
                          </span>
                        </div>
                        <button
                          className="btn"
                          disabled={scenario.steps.length >= 100}
                          onClick={() => editStep()}
                        >
                          <Plus />
                          Add step
                        </button>
                      </div>
                      <div className="canvas">
                        <div className="route">
                          <div className="endpoint">
                            <span className="endpoint-symbol">
                              <CircleDot size={11} />
                            </span>
                            <span>Trigger / the work begins</span>
                          </div>
                          <div className="connector" />
                          {scenario.steps.length === 0 ? (
                            <div className="empty-map">
                              <h3>What happens first?</h3>
                              <p className="muted">
                                Add the first person, team, or tool that
                                responds to the trigger. Then follow what gets
                                passed along.
                              </p>
                              <button
                                className="btn primary"
                                onClick={() => editStep()}
                              >
                                <Plus />
                                Add the first step
                              </button>
                            </div>
                          ) : (
                            scenario.steps.map((s, i) => (
                              <div key={s.id}>
                                <button
                                  aria-pressed={selected === s.id}
                                  className={`step-card ${selected === s.id ? 'selected' : ''}`}
                                  onClick={() => setSelected(s.id)}
                                >
                                  <span className="step-number">
                                    {String(i + 1).padStart(2, '0')}
                                  </span>
                                  <div>
                                    <h3>{s.title}</h3>
                                    <p>{s.tool || 'Component not yet named'}</p>
                                    {s.friction && (
                                      <span className="friction-tag">
                                        <AlertTriangle size={11} />
                                        Friction to explore
                                      </span>
                                    )}
                                  </div>
                                  <ArrowRight size={15} color="#7d8b90" />
                                </button>
                                <span className="signal-label">
                                  ↓{' '}
                                  {s.outgoing ||
                                    'Outgoing signal not yet captured'}
                                </span>
                                <div className="connector" />
                              </div>
                            ))
                          )}
                          <div className="endpoint">
                            <span className="endpoint-symbol end">
                              <Check size={12} />
                            </span>
                            <span>
                              Intended outcome / validate what actually happens
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="map-footer">
                        <span>
                          <CircleDot size={12} />
                          Select a step to see the detail
                        </span>
                        <span>
                          <AlertTriangle size={12} />
                          Friction recorded in the workshop
                        </span>
                      </div>
                    </section>
                    <div className="prompt-box">
                      <h3>What else touches this part of the work?</h3>
                      <p>
                        Ask about the teams, information, and experiences just
                        outside the route. Capture them on the relevant step.
                      </p>
                    </div>
                  </div>
                  <aside
                    className="inspector"
                    aria-label="Selected step details"
                  >
                    {step ? (
                      <>
                        <div className="inspector-head">
                          <div className="eyebrow">
                            Street view / step{' '}
                            {scenario.steps.indexOf(step) + 1}
                          </div>
                          <h2>{step.title}</h2>
                          <p className="muted">
                            The people, tools, and context behind the box.
                          </p>
                        </div>
                        <div className="inspector-body">
                          <dl>
                            <Fact label="Tool / component" value={step.tool} />
                            <Fact label="Who owns it?" value={step.owner} />
                            <div className="fact-grid">
                              <Fact label="Surface" value={step.surface} />
                              <Fact label="Channel" value={step.channel} />
                            </div>
                            <Fact label="Signal in" value={step.incoming} />
                            <Fact label="Signal out" value={step.outgoing} />
                          </dl>
                          {step.friction && (
                            <div className="friction-box">
                              <strong>Where it gets difficult</strong>
                              <p>{step.friction}</p>
                            </div>
                          )}
                          <dl>
                            <Fact
                              label="What else touches this?"
                              value={step.adjacent}
                            />
                          </dl>
                          <div className="evidence-note">
                            <span className="pill">{step.evidence}</span>
                            <p>
                              {step.source ||
                                'No supporting source recorded yet.'}
                            </p>
                          </div>
                        </div>
                        <div className="inspector-foot">
                          <button
                            className="btn"
                            onClick={() => editStep(step)}
                          >
                            <Pencil />
                            Edit step
                          </button>
                          <div className="actions">
                            <button
                              className="btn icon"
                              aria-label="Move step earlier"
                              disabled={scenario.steps.indexOf(step) === 0}
                              onClick={() =>
                                updateScenario({
                                  steps: moveStep(scenario.steps, step.id, -1),
                                })
                              }
                            >
                              <ArrowUp />
                            </button>
                            <button
                              className="btn icon"
                              aria-label="Move step later"
                              disabled={
                                scenario.steps.indexOf(step) ===
                                scenario.steps.length - 1
                              }
                              onClick={() =>
                                updateScenario({
                                  steps: moveStep(scenario.steps, step.id, 1),
                                })
                              }
                            >
                              <ArrowDown />
                            </button>
                            <button
                              className="btn icon danger"
                              aria-label="Delete step"
                              onClick={() => setDeleteTarget('step')}
                            >
                              <Trash2 />
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="inspector-body">
                        <div className="eyebrow">Street view</div>
                        <h2 style={{ margin: '12px 0' }}>
                          Start with one step.
                        </h2>
                        <p className="muted small">
                          Select a step to explore its owner, signals, evidence,
                          and friction.
                        </p>
                      </div>
                    )}
                  </aside>
                </div>
              </TabsContent>
              <TabsContent value="future">
                <div className="future-grid">
                  <section className="paper">
                    <div className="eyebrow">
                      State B / define the destination
                    </div>
                    <h2>What should be different?</h2>
                    <p className="muted small">
                      Describe the way this scenario should work. Treat it as a
                      hypothesis you can challenge together.
                    </p>
                    <Field label="Desired future state">
                      <textarea
                        rows={5}
                        value={scenario.future}
                        onChange={(e) =>
                          updateScenario({ future: e.target.value })
                        }
                        maxLength={40000}
                        placeholder="When this trigger happens, what should people experience instead?"
                      />
                    </Field>
                    <Field label="Why do we think this would help?">
                      <textarea
                        rows={3}
                        value={scenario.hypothesis}
                        onChange={(e) =>
                          updateScenario({ hypothesis: e.target.value })
                        }
                        maxLength={40000}
                        placeholder="If we change… we expect… because…"
                      />
                    </Field>
                    <Field label="Open questions">
                      <textarea
                        rows={4}
                        value={scenario.questions}
                        onChange={(e) =>
                          updateScenario({ questions: e.target.value })
                        }
                        maxLength={40000}
                        placeholder="What would we need to learn before committing?"
                      />
                    </Field>
                  </section>
                  <section className="paper">
                    <div className="eyebrow">A → B / one first move</div>
                    <h2>Choose a change we can test.</h2>
                    <p className="muted small">
                      A proposal for a workshop experiment. No changes are made
                      to any live system.
                    </p>
                    <Field label="Smallest useful change">
                      <textarea
                        value={scenario.firstMove}
                        onChange={(e) =>
                          updateScenario({ firstMove: e.target.value })
                        }
                        maxLength={40000}
                        placeholder="What is one handoff, signal, or unserved need we could start with?"
                      />
                    </Field>
                    <Field
                      label="Evidence of success"
                      hint="Name the measure, baseline to check, and how you will review the result."
                    >
                      <textarea
                        value={scenario.measure}
                        onChange={(e) =>
                          updateScenario({ measure: e.target.value })
                        }
                        maxLength={40000}
                      />
                    </Field>
                    <Field label="Who will own the next step?">
                      <input
                        value={scenario.owner}
                        onChange={(e) =>
                          updateScenario({ owner: e.target.value })
                        }
                        maxLength={40000}
                      />
                    </Field>
                    <Field label="Guardrail / fallback">
                      <textarea
                        value={scenario.guardrail}
                        onChange={(e) =>
                          updateScenario({ guardrail: e.target.value })
                        }
                        maxLength={40000}
                        placeholder="Keep the pilot bounded. What happens if it does not help?"
                      />
                    </Field>
                  </section>
                </div>
              </TabsContent>
              <TabsContent value="notes">
                <section className="paper">
                  <div className="eyebrow">
                    Discovery / listen before solving
                  </div>
                  <h2>What did we hear?</h2>
                  <p className="muted small">
                    Paste relevant interview excerpts or type notes. Use them to
                    build the map manually; this prototype does not extract
                    steps with AI. Notes stay in this browser and in files you
                    export.
                  </p>
                  <Field label="Source notes">
                    <textarea
                      rows={12}
                      value={scenario.notes}
                      onChange={(e) =>
                        updateScenario({ notes: e.target.value })
                      }
                      maxLength={40000}
                      placeholder="Walk me through the last time this happened…"
                    />
                  </Field>
                  <div className="prompt-box">
                    <h3>Prompts for the conversation</h3>
                    <p>
                      What starts the work? Who receives it next? What context
                      travels with it? Where does it wait? What happens in an
                      exception? How do you know the outcome was achieved?
                    </p>
                  </div>
                </section>
              </TabsContent>
            </Tabs>
            <div className="workspace-footer">
              <span>
                {scenario.sample
                  ? 'Illustrative data. All example details are assumptions.'
                  : 'Workshop draft. Validate the map with someone who does this work.'}
              </span>
              <div className="actions">
                <button className="text-link" onClick={duplicate}>
                  Duplicate scenario
                </button>
                <button
                  className="text-link"
                  disabled={workspace.scenarios.length <= 1}
                  onClick={() => setDeleteTarget('scenario')}
                >
                  Delete scenario
                </button>
                <a href={REPO} target="_blank" rel="noreferrer">
                  GitHub ↗
                </a>
              </div>
            </div>
            <div className="actions mobile-transfer" style={{ marginTop: 15 }}>
              <button className="btn quiet" onClick={exportWorkspace}>
                <Download />
                Export workspace
              </button>
              <button
                className="btn quiet"
                onClick={() => fileRef.current?.click()}
              >
                <Upload />
                Import workspace
              </button>
            </div>
          </main>
        </div>
      )}
      <output
        aria-live="polite"
        className={notice ? 'status-banner' : 'sr-only'}
      >
        {notice}
      </output>
      <Dialog
        open={modal !== null}
        onOpenChange={(open) => {
          if (!open) setModal(null);
        }}
      >
        <DialogContent className="modal">
          <DialogTitle>
            {modal === 'step'
              ? scenario.steps.some((s) => s.id === stepDraft?.id)
                ? 'Edit this step'
                : 'Add a step to the thread'
              : modal === 'new'
                ? 'Start with one scenario'
                : 'Edit the scenario'}
          </DialogTitle>
          <DialogDescription>
            {modal === 'step'
              ? 'Capture what happens and what gets passed along. Leave unknown details blank.'
              : 'Pair one trigger with one intended outcome. Add the route after you have agreed on those boundaries.'}
          </DialogDescription>
          {notice && <output className="notice">{notice}</output>}
          {modal === 'step' && stepDraft ? (
            <form key={stepDraft.id} onSubmit={saveStep}>
              <div className="form-grid">
                <FormInput
                  label="What happens?"
                  name="title"
                  value={stepDraft.title === 'New step' ? '' : stepDraft.title}
                  required
                  full
                />
                <FormInput
                  label="Tool / component"
                  name="tool"
                  value={stepDraft.tool}
                />
                <FormInput label="Owner" name="owner" value={stepDraft.owner} />
                <FormInput
                  label="Surface"
                  name="surface"
                  value={stepDraft.surface}
                  hint="Where the interaction takes place"
                />
                <FormInput
                  label="Channel"
                  name="channel"
                  value={stepDraft.channel}
                  hint="For example: email, phone, web"
                />
                <FormInput
                  label="Signal in"
                  name="incoming"
                  value={stepDraft.incoming}
                />
                <FormInput
                  label="Signal out"
                  name="outgoing"
                  value={stepDraft.outgoing}
                />
                <FormInput
                  label="Where does it get difficult?"
                  name="friction"
                  value={stepDraft.friction}
                  multiline
                  full
                />
                <FormInput
                  label="What else touches this?"
                  name="adjacent"
                  value={stepDraft.adjacent}
                  hint="Adjacent teams, data, or experiences"
                  full
                />
                <Field label="Evidence status" full>
                  <NativeSelect
                    name="evidence"
                    defaultValue={stepDraft.evidence}
                    className="w-full"
                  >
                    <option>Assumption</option>
                    <option>Reported</option>
                    <option>Observed</option>
                  </NativeSelect>
                </Field>
                <FormInput
                  label="Source / what to validate"
                  name="source"
                  value={stepDraft.source}
                  multiline
                  full
                />
              </div>
              <div className="actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  Save step
                  <ArrowRight />
                </button>
              </div>
            </form>
          ) : (
            (modal === 'new' || modal === 'brief') && (
              <form key={modal + scenario.id} onSubmit={saveBrief}>
                <FormInput
                  label="Scenario name"
                  name="title"
                  value={modal === 'brief' ? scenario.title : ''}
                  required
                />
                <FormInput
                  label="Who / where is this happening?"
                  name="context"
                  value={modal === 'brief' ? scenario.context : ''}
                />
                <FormInput
                  label="One trigger"
                  name="trigger"
                  value={modal === 'brief' ? scenario.trigger : ''}
                  hint="The specific event or condition that starts the work"
                  required
                  multiline
                />
                <FormInput
                  label="One intended outcome"
                  name="outcome"
                  value={modal === 'brief' ? scenario.outcome : ''}
                  hint="The result you want this scenario to achieve"
                  required
                  multiline
                />
                <FormInput
                  label="Discovery notes (optional)"
                  name="notes"
                  value={modal === 'brief' ? scenario.notes : ''}
                  hint="Manual notes or relevant excerpts; no automatic extraction"
                  multiline
                />
                <div className="actions">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setModal(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn primary">
                    {modal === 'new' ? 'Create scenario' : 'Save scenario'}
                    <ArrowRight />
                  </button>
                </div>
              </form>
            )
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={!!pendingImport}
        onOpenChange={(open) => {
          if (!open) setPendingImport(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Open this workspace?</AlertDialogTitle>
          <AlertDialogDescription>
            This file contains {pendingImport?.scenarios.length} scenarios and
            company notes. It will replace the workspace in this browser. Export
            your current work first if you want to keep it.
          </AlertDialogDescription>
          <div className="actions">
            <button className="btn" onClick={exportWorkspace}>
              Export current work
            </button>
            <button className="btn" onClick={() => setPendingImport(null)}>
              Cancel
            </button>
            <button
              className="btn primary"
              onClick={() => {
                if (!pendingImport) return;
                setWorkspace(pendingImport);
                setSelected(
                  pendingImport.scenarios.find(
                    (s) => s.id === pendingImport.activeId,
                  )?.steps[0]?.id || null,
                );
                setStorageBlocked(false);
                setPendingImport(null);
                setNotice('Workspace imported.');
              }}
            >
              Replace workspace
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Delete this {deleteTarget}?</AlertDialogTitle>
          <AlertDialogDescription>
            {deleteTarget === 'step'
              ? `“${step?.title}” will be removed from this route.`
              : `“${scenario.title}” and its notes will be removed.`}{' '}
            This cannot be undone. An exported workspace keeps a backup.
          </AlertDialogDescription>
          <div className="actions">
            <button className="btn" onClick={() => setDeleteTarget(null)}>
              Cancel
            </button>
            <button className="btn danger" onClick={remove}>
              Delete {deleteTarget}
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
