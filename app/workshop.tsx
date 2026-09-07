'use client';
/* eslint-disable react/react-compiler */
import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import {
  ArrowRight,
  Bot,
  Check,
  Download,
  GitBranch,
  Layers,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { NativeSelect } from '@/components/ui/native-select';
import {
  fromExample,
  initialWorkspace,
  newScenario,
  parseWorkspace,
  serializeWorkspace,
  scenarioMarkdown,
  uid,
  type Scenario,
  type Workspace,
} from '@/lib/domain';
import {
  blankNode,
  flowIssues,
  parseFlow,
  makeId,
  type Component,
  type Flow,
  type FlowEdge,
  type FlowNode,
} from '@/lib/graph';
import { examples } from '@/lib/examples';
import { FlowMap } from './flow-map';
import { Rehearsal } from './rehearsal';
import { AIDesigner } from './ai-designer';
import { CompanyNotebook, Method } from './company-notebook';
import { Field, formText, download, REPO } from './studio-ui';
const KEY = 'first-thread.workspace.v2';
const OLD_KEY = 'first-thread.workspace.v1';
const split = (s: string) =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
function Input({
  label,
  name,
  value = '',
  area = false,
  required = false,
  hint,
}: {
  label: string;
  name: string;
  value?: string;
  area?: boolean;
  required?: boolean;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      {area ? (
        <textarea
          name={name}
          defaultValue={value}
          rows={3}
          maxLength={40000}
          required={required}
        />
      ) : (
        <input
          name={name}
          defaultValue={value}
          maxLength={40000}
          required={required}
        />
      )}
    </Field>
  );
}
export default function Workshop() {
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace);
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState('');
  const [storageError, setStorageError] = useState('');
  const [view, setView] = useState('studio');
  const [tab, setTab] = useState('map');
  const [assisted, setAssisted] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [modal, setModal] = useState<
    'brief' | 'new' | 'node' | 'edge' | 'component' | null
  >(null);
  const [draftNode, setDraftNode] = useState<FlowNode | null>(null);
  const [draftEdge, setDraftEdge] = useState<FlowEdge | null>(null);
  const [draftComponent, setDraftComponent] = useState<Component | null>(null);
  const [pendingImport, setPendingImport] = useState<Workspace | null>(null);
  const [removeTarget, setRemoveTarget] = useState<
    'node' | 'edge' | 'scenario' | null
  >(null);
  const file = useRef<HTMLInputElement>(null);
  const scenario =
    workspace.scenarios.find((s) => s.id === workspace.activeId) ||
    workspace.scenarios[0];
  const flow =
    assisted && scenario.proposed ? scenario.proposed : scenario.flow;
  const node = flow.nodes.find((n) => n.id === selected);
  const issues = flowIssues(flow);
  useEffect(() => {
    try {
      const current = localStorage.getItem(KEY);
      const legacy = current ? null : localStorage.getItem(OLD_KEY);
      if (current || legacy) {
        setWorkspace(parseWorkspace(current || legacy!));
        if (legacy)
          setNotice(
            'Your previous workshop was preserved and migrated. Open an industry example to explore the new model.',
          );
      }
    } catch {
      setBlocked(true);
      setStorageError(
        'Saved work could not be loaded. The original data is preserved; export it before replacing it.',
      );
    }
    setReady(true);
    const route = () =>
      setView(
        location.hash === '#/company'
          ? 'company'
          : location.hash === '#/method'
            ? 'method'
            : 'studio',
      );
    route();
    window.addEventListener('hashchange', route);
    return () => window.removeEventListener('hashchange', route);
  }, []);
  useEffect(() => {
    if (!ready || blocked) return;
    try {
      localStorage.setItem(KEY, serializeWorkspace(workspace));
      setSaved(true);
      setStorageError('');
    } catch {
      setSaved(false);
      setStorageError(
        'Browser saving is unavailable. Export the workspace before closing this page.',
      );
    }
  }, [workspace, ready, blocked]);
  function commit(next: Workspace) {
    try {
      serializeWorkspace(next);
      setWorkspace(next);
      setSaved(false);
      return true;
    } catch (e) {
      setNotice(
        e instanceof Error ? e.message : 'This change could not be saved.',
      );
      return false;
    }
  }
  function update(patch: Partial<Scenario>) {
    return commit({
      ...workspace,
      scenarios: workspace.scenarios.map((s) =>
        s.id === scenario.id ? { ...s, ...patch } : s,
      ),
    });
  }
  function updateFlow(next: Flow) {
    try {
      const valid = parseFlow(next);
      return update(assisted ? { proposed: valid } : { flow: valid });
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Flow is invalid.');
      return false;
    }
  }
  function exportWorkspace() {
    download('first-thread-workspace-v2.json', serializeWorkspace(workspace));
    setNotice('Workspace exported, including current and proposed flows.');
  }
  function choose(id: string) {
    setWorkspace((w) => ({ ...w, activeId: id }));
    setAssisted(false);
    setSelected(null);
    setTab('map');
  }
  function loadExample(id: string) {
    const existing = workspace.scenarios.find((s) => s.id === id);
    if (existing) {
      choose(id);
      return;
    }
    if (workspace.scenarios.length >= 100) {
      setNotice(
        'This workspace supports 100 flows. Export and remove older drafts first.',
      );
      return;
    }
    const s = fromExample(id);
    if (
      commit({
        ...workspace,
        scenarios: [...workspace.scenarios, s],
        activeId: s.id,
      })
    ) {
      setAssisted(false);
      setTab('map');
    }
  }
  function duplicate() {
    if (workspace.scenarios.length >= 100) {
      setNotice('This workspace supports 100 flows.');
      return;
    }
    const copy = {
      ...structuredClone(scenario),
      id: uid(),
      title: `${scenario.title.slice(0, 39993)} (copy)`,
      sample: false,
    };
    if (
      commit({
        ...workspace,
        scenarios: [...workspace.scenarios, copy],
        activeId: copy.id,
      })
    ) {
      setSelected(null);
      setNotice('Independent flow copy created.');
    }
  }
  async function readFile(selectedFile?: File) {
    if (!selectedFile) return;
    try {
      if (selectedFile.size > 2000000)
        throw new Error('Choose a workspace under 2 MB.');
      setPendingImport(parseWorkspace(await selectedFile.text()));
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Import failed.');
    } finally {
      if (file.current) file.current.value = '';
    }
  }
  function openNode(n?: FlowNode) {
    setDraftNode(
      n ||
        blankNode(
          flow.components[0]?.id || '',
          Math.min(150, Math.max(-1, ...flow.nodes.map((x) => x.column)) + 1),
        ),
    );
    setSelected(null);
    setNotice('');
    setModal('node');
  }
  function openEdge(e?: FlowEdge) {
    setDraftEdge(
      e || {
        id: makeId(),
        from: flow.nodes[0]?.id || '',
        to: flow.nodes[1]?.id || '',
        signal: '',
        when: 'always',
      },
    );
    setNotice('');
    setModal('edge');
  }
  function saveBrief(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const title = formText(d, 'title').trim(),
      trigger = formText(d, 'trigger').trim(),
      outcome = formText(d, 'outcome').trim();
    if (!title || !trigger || !outcome) {
      setNotice('Name the flow, trigger, and intended outcome.');
      return;
    }
    const patch = {
      title,
      trigger,
      outcome,
      context: formText(d, 'context'),
      notes: formText(d, 'notes'),
      industry: formText(d, 'industry'),
      future: formText(d, 'future'),
      firstMove: formText(d, 'firstMove'),
      hypothesis: formText(d, 'hypothesis'),
      measure: formText(d, 'measure'),
      owner: formText(d, 'owner'),
      guardrail: formText(d, 'guardrail'),
      questions: formText(d, 'questions'),
    };
    let ok = false;
    if (modal === 'new') {
      const s = { ...newScenario(title, trigger, outcome), ...patch };
      s.flow.object = formText(d, 'object') || 'Business case';
      s.flow.identity = formText(d, 'identity') || 'caseId';
      ok = commit({
        ...workspace,
        scenarios: [...workspace.scenarios, s],
        activeId: s.id,
      });
      setAssisted(false);
    } else
      ok = update({
        ...patch,
        [assisted ? 'proposed' : 'flow']: {
          ...flow,
          object: formText(d, 'object'),
          identity: formText(d, 'identity'),
        },
      });
    if (ok) {
      setModal(null);
      setNotice('Flow brief saved.');
    }
  }
  function saveNode(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draftNode) return;
    const d = new FormData(e.currentTarget);
    const components = [...flow.components];
    let componentId = formText(d, 'componentId');
    if (!componentId) {
      const name = formText(d, 'componentName').trim();
      if (!name) {
        setNotice('Choose an existing component or name a new one.');
        return;
      }
      componentId = makeId();
      components.push({
        id: componentId,
        name,
        kind: formText(d, 'actorKind') as Component['kind'],
        responsibility: formText(d, 'fallback'),
      });
    }
    const next = { ...draftNode };
    for (const k of [
      'title',
      'capability',
      'state',
      'surface',
      'channel',
      'friction',
      'source',
      'instruction',
      'outputContract',
      'fallback',
    ] as const)
      next[k] = formText(d, k).trim();
    next.componentId = componentId;
    next.kind = formText(d, 'kind') as FlowNode['kind'];
    next.result = formText(d, 'result') as FlowNode['result'];
    next.evidence = formText(d, 'evidence') as FlowNode['evidence'];
    next.inputs = split(formText(d, 'inputs'));
    next.outputs = split(formText(d, 'outputs'));
    for (const k of [
      'minutes',
      'wait',
      'proposedMinutes',
      'column',
      'lane',
    ] as const)
      next[k] = Number(formText(d, k));
    next.ai = formText(d, 'ai') === 'true';
    next.review = formText(d, 'review') === 'true';
    const nodes = flow.nodes.some((n) => n.id === next.id)
      ? flow.nodes.map((n) => (n.id === next.id ? next : n))
      : [...flow.nodes, next];
    if (
      updateFlow({ ...flow, components, nodes, start: flow.start || next.id })
    ) {
      setModal(null);
      setSelected(next.id);
      setNotice('Action contract saved.');
    }
  }
  function saveEdge(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draftEdge) return;
    const d = new FormData(e.currentTarget);
    const next = {
      ...draftEdge,
      from: formText(d, 'from'),
      to: formText(d, 'to'),
      signal: formText(d, 'signal').trim(),
      when: formText(d, 'when') as FlowEdge['when'],
    };
    if (!next.signal) {
      setNotice('Name the signal carried by this connection.');
      return;
    }
    if (
      updateFlow({
        ...flow,
        edges: flow.edges.some((x) => x.id === next.id)
          ? flow.edges.map((x) => (x.id === next.id ? next : x))
          : [...flow.edges, next],
      })
    ) {
      setModal(null);
      setNotice('Signal connection saved.');
    }
  }
  function saveComponent(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draftComponent) return;
    const d = new FormData(e.currentTarget);
    const c = {
      ...draftComponent,
      name: formText(d, 'name').trim(),
      kind: formText(d, 'kind') as Component['kind'],
      responsibility: formText(d, 'responsibility'),
    };
    if (
      updateFlow({
        ...flow,
        components: flow.components.map((x) => (x.id === c.id ? c : x)),
      })
    )
      setModal(null);
  }
  function remove() {
    if (removeTarget === 'node' && node) {
      const nodes = flow.nodes.filter((n) => n.id !== node.id);
      if (
        updateFlow({
          ...flow,
          nodes,
          edges: flow.edges.filter(
            (e) => e.from !== node.id && e.to !== node.id,
          ),
          start: flow.start === node.id ? nodes[0]?.id || '' : flow.start,
        })
      )
        setSelected(null);
    } else if (removeTarget === 'edge' && draftEdge)
      updateFlow({
        ...flow,
        edges: flow.edges.filter((e) => e.id !== draftEdge.id),
      });
    else if (removeTarget === 'scenario' && workspace.scenarios.length > 1) {
      const remaining = workspace.scenarios.filter((s) => s.id !== scenario.id);
      commit({ ...workspace, scenarios: remaining, activeId: remaining[0].id });
      setAssisted(false);
    }
    setRemoveTarget(null);
    setModal(null);
  }
  return (
    <>
      <header className="topbar">
        <a className="brand" href="#/studio">
          <span className="brand-mark">
            <GitBranch size={20} />
          </span>
          First Thread
        </a>
        <nav aria-label="Main navigation">
          <a href="#/studio" className={view === 'studio' ? 'active' : ''}>
            Flow studio
          </a>
          <a href="#/method" className={view === 'method' ? 'active' : ''}>
            Model & method
          </a>
          <a href="#/company" className={view === 'company' ? 'active' : ''}>
            Company notebook
          </a>
        </nav>
        <div className="top-meta">
          <span className="pill">Industry independent · 0.2</span>
          <button className="btn" onClick={exportWorkspace}>
            <Download />
            Export
          </button>
          <button
            className="btn icon"
            aria-label="Import workspace"
            onClick={() => file.current?.click()}
          >
            <Upload />
          </button>
        </div>
      </header>
      <input
        ref={file}
        type="file"
        accept=".json"
        className="sr-only"
        onChange={(e) => void readFile(e.target.files?.[0])}
        aria-label="Workspace JSON"
      />
      {storageError && (
        <div className="status-banner" role="alert">
          {storageError}
          <button className="btn" onClick={exportWorkspace}>
            Export current work
          </button>
          {blocked && (
            <>
              <button
                className="btn"
                onClick={() => {
                  try {
                    download(
                      'first-thread-recovery.txt',
                      localStorage.getItem(KEY) ||
                        localStorage.getItem(OLD_KEY) ||
                        '',
                      'text/plain',
                    );
                  } catch {
                    setNotice('Stored data is inaccessible in this browser.');
                  }
                }}
              >
                Export stored data
              </button>
              <button
                className="btn"
                onClick={() => setPendingImport(workspace)}
              >
                Replace stored workspace
              </button>
            </>
          )}
        </div>
      )}
      {view === 'company' ? (
        <CompanyNotebook
          notebook={workspace.notebook}
          onChange={(notebook) => {
            commit({ ...workspace, notebook });
          }}
        />
      ) : view === 'method' ? (
        <Method />
      ) : (
        <div className="workspace studio-workspace">
          <aside className="rail">
            <div className="eyebrow">Business flows</div>
            <div className="scenario-list">
              {workspace.scenarios.map((s) => (
                <button
                  key={s.id}
                  className={`scenario-btn ${s.id === scenario.id ? 'selected' : ''}`}
                  onClick={() => choose(s.id)}
                >
                  <span>{s.industry}</span>
                  <strong>{s.title}</strong>
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
              Define a flow
            </button>
            <div className="example-picker">
              <div className="eyebrow">Try the same pattern</div>
              {examples.map((ex) => (
                <button key={ex.id} onClick={() => loadExample(ex.id)}>
                  {ex.industry}
                  <ArrowRight size={13} />
                </button>
              ))}
            </div>
            <div className="rail-bottom">
              <div className="save-state">
                <span className="dot" />
                {saved ? 'Saved in this browser' : 'Not yet saved'}
              </div>
              <p>
                One vocabulary.
                <br />
                Different business realities.
              </p>
              <a href="#/method" className="text-link small">
                Explore the shared model ↗
              </a>
            </div>
          </aside>
          <main id="main" className="main studio-main">
            <div className="heading">
              <div>
                <div className="eyebrow">
                  {scenario.industry} /{' '}
                  {scenario.sample ? 'Fictional example' : 'Workshop draft'}
                </div>
                <h1>{scenario.title}</h1>
                <p className="muted small">
                  <strong>{flow.object}</strong> · identified by{' '}
                  <code>{flow.identity}</code> · {flow.nodes.length} actions
                  across {flow.components.length} components
                </p>
              </div>
              <div className="actions">
                <button
                  className="btn"
                  onClick={() => {
                    setNotice('');
                    setModal('brief');
                  }}
                >
                  <Pencil />
                  Edit brief
                </button>
                <button
                  className="btn"
                  onClick={() =>
                    download(
                      'first-thread-flow-brief.md',
                      scenarioMarkdown(scenario),
                      'text/markdown',
                    )
                  }
                >
                  <Download />
                  Brief
                </button>
              </div>
            </div>
            <section className="contract">
              <div>
                <div className="eyebrow">Trigger / why work starts</div>
                <p>{scenario.trigger}</p>
              </div>
              <div className="contract-arrow">
                <ArrowRight />
              </div>
              <div>
                <div className="eyebrow">Outcome / what must be true</div>
                <p>{scenario.outcome}</p>
              </div>
            </section>
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(String(v))}
              className="work-tabs"
            >
              <TabsList aria-label="Flow studio views">
                <TabsTrigger value="map">Flow map</TabsTrigger>
                <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
                <TabsTrigger value="rehearsal">Rehearsal</TabsTrigger>
                <TabsTrigger value="ai">
                  <Bot size={14} />
                  AI designer
                </TabsTrigger>
              </TabsList>
              <TabsContent value="map">
                <div className="flow-toolbar">
                  <div className="mode-switch">
                    <button
                      className={!assisted ? 'active' : ''}
                      aria-pressed={!assisted}
                      onClick={() => {
                        setAssisted(false);
                        setSelected(null);
                      }}
                    >
                      Current flow
                    </button>
                    <button
                      className={assisted ? 'active' : ''}
                      aria-pressed={assisted}
                      onClick={() => {
                        if (
                          !scenario.proposed &&
                          !update({ proposed: structuredClone(scenario.flow) })
                        )
                          return;
                        setAssisted(true);
                        setSelected(null);
                      }}
                    >
                      Proposed flow <span>AI</span>
                    </button>
                  </div>
                  <div className="actions">
                    <button
                      className="btn"
                      disabled={flow.nodes.length >= 100}
                      onClick={() => openNode()}
                    >
                      <Plus />
                      Add action
                    </button>
                    <button
                      className="btn"
                      disabled={
                        flow.nodes.length < 2 || flow.edges.length >= 300
                      }
                      onClick={() => openEdge()}
                    >
                      <GitBranch />
                      Connect signal
                    </button>
                  </div>
                </div>
                {assisted && (
                  <div className="inline-note ai-note">
                    <Bot size={16} />A separate design draft. AI candidates have
                    contracts and review gates; business actions are not
                    executed.
                  </div>
                )}
                <FlowMap
                  flow={flow}
                  assisted={assisted}
                  onSelect={setSelected}
                />
                {issues.length > 0 && (
                  <details className="issues">
                    <summary>
                      {issues.length} definition{' '}
                      {issues.length === 1 ? 'gap' : 'gaps'} to resolve before
                      rehearsal
                    </summary>
                    <ul>
                      {issues.map((i) => (
                        <li key={i}>{i}</li>
                      ))}
                    </ul>
                  </details>
                )}
                <section className="signal-section">
                  <div className="section-heading">
                    <div>
                      <div className="eyebrow">
                        What travels between actions
                      </div>
                      <h2>Signals carry the context forward.</h2>
                    </div>
                    <span className="small muted">
                      Select a connection to edit its rule
                    </span>
                  </div>
                  <div className="signal-list">
                    {flow.edges.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => openEdge(e)}
                        className="signal-row"
                      >
                        <code>{e.signal}</code>
                        <span>
                          {flow.nodes.find((n) => n.id === e.from)?.title}
                          <ArrowRight size={13} />
                          {flow.nodes.find((n) => n.id === e.to)?.title}
                        </span>
                        <span className="pill">{e.when}</span>
                      </button>
                    ))}
                  </div>
                </section>
              </TabsContent>
              <TabsContent value="capabilities">
                <div className="capability-intro">
                  <div className="eyebrow">
                    Business ability → component → action
                  </div>
                  <h2>Keep the ability separate from the tool.</h2>
                  <p className="muted">
                    These capabilities can exist in any digital business. The
                    components below are this flow’s implementation.
                  </p>
                </div>
                <div className="capability-grid">
                  {[
                    ...new Set(
                      flow.nodes.map((n) => n.capability || 'To define'),
                    ),
                  ].map((cap) => (
                    <section className="paper capability-card" key={cap}>
                      <div className="eyebrow">
                        <Layers size={14} />
                        {cap}
                      </div>
                      {flow.nodes
                        .filter((n) => (n.capability || 'To define') === cap)
                        .map((n) => (
                          <button key={n.id} onClick={() => setSelected(n.id)}>
                            <strong>{n.title}</strong>
                            <span>
                              {
                                flow.components.find(
                                  (c) => c.id === n.componentId,
                                )?.name
                              }
                              <ArrowRight size={13} />
                            </span>
                          </button>
                        ))}
                    </section>
                  ))}
                </div>
                <div className="section-heading">
                  <div>
                    <div className="eyebrow">
                      Who or what can perform the work
                    </div>
                    <h2>Reusable components</h2>
                  </div>
                </div>
                <div className="component-grid">
                  {flow.components.map((c) => (
                    <button
                      className="component-card"
                      key={c.id}
                      onClick={() => {
                        setDraftComponent(c);
                        setModal('component');
                      }}
                    >
                      <span className="pill">{c.kind}</span>
                      <h3>{c.name}</h3>
                      <p>{c.responsibility || 'Responsibility to define'}</p>
                    </button>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="rehearsal">
                <Rehearsal
                  key={`${scenario.id}-${JSON.stringify(scenario.flow)}-${JSON.stringify(scenario.proposed)}`}
                  baseline={scenario.flow}
                  proposed={scenario.proposed}
                />
              </TabsContent>
              <TabsContent value="ai">
                <AIDesigner
                  key={scenario.id}
                  scenario={scenario}
                  onNotes={(notes) => {
                    update({ notes });
                  }}
                  onApply={(proposed) => {
                    const ok = update({ proposed });
                    if (ok) {
                      setAssisted(true);
                      setTab('map');
                      setNotice(
                        'AI proposal added as a separate draft. Current flow preserved.',
                      );
                    }
                    return ok;
                  }}
                />
              </TabsContent>
            </Tabs>
            <div className="workspace-footer">
              <span>
                {scenario.sample
                  ? 'All examples, timings, and outcome records are fictional workshop assumptions.'
                  : 'Validate this flow and its assumptions with the people responsible for the work.'}
              </span>
              <div className="actions">
                <button className="text-link" onClick={duplicate}>
                  Duplicate
                </button>
                <button
                  className="text-link"
                  disabled={workspace.scenarios.length <= 1}
                  onClick={() => setRemoveTarget('scenario')}
                >
                  Delete flow
                </button>
                <a href={REPO} target="_blank" rel="noreferrer">
                  GitHub ↗
                </a>
              </div>
            </div>
            <div className="mobile-transfers actions">
              <button className="btn" onClick={exportWorkspace}>
                <Download />
                Export workspace
              </button>
              <button className="btn" onClick={() => file.current?.click()}>
                <Upload />
                Import
              </button>
            </div>
          </main>
        </div>
      )}
      <output
        className={notice ? 'studio-notice' : 'sr-only'}
        aria-live="polite"
      >
        {notice}
        {notice && (
          <button aria-label="Dismiss notice" onClick={() => setNotice('')}>
            ×
          </button>
        )}
      </output>
      <Sheet
        open={!!node}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <SheetContent className="action-sheet">
          {node && (
            <>
              <div className="eyebrow">
                Action contract / {assisted ? 'proposed' : 'current'}
              </div>
              <SheetTitle>{node.title}</SheetTitle>
              <SheetDescription>
                {node.capability} ·{' '}
                {flow.components.find((c) => c.id === node.componentId)?.name}
              </SheetDescription>
              <div className="contract-detail">
                <dl>
                  {[
                    ['Case state after', node.state],
                    ['Required inputs', node.inputs.join(', ')],
                    ['Produced context', node.outputs.join(', ')],
                    ['Surface / channel', `${node.surface} / ${node.channel}`],
                    ['Friction', node.friction],
                    ['Evidence', `${node.evidence}: ${node.source}`],
                  ].map(([t, v]) => (
                    <div key={t}>
                      <dt>{t}</dt>
                      <dd>{v || 'Not yet defined'}</dd>
                    </div>
                  ))}
                </dl>
                <div className="timing-pair">
                  <span>
                    <strong>{node.minutes}</strong> handling min
                  </span>
                  <span>
                    <strong>{node.wait}</strong> waiting min
                  </span>
                </div>
                {node.ai && (
                  <div className="delegation-box">
                    <div className="eyebrow">
                      <Bot size={14} />
                      AI delegation candidate
                    </div>
                    <h3>{node.instruction || 'Define a specific AI task'}</h3>
                    <p>
                      <strong>Output contract</strong>
                      <br />
                      {node.outputContract || 'Not defined'}
                    </p>
                    <p>
                      <strong>Review</strong>
                      <br />
                      {node.review
                        ? 'Human approval before output is passed onward'
                        : 'No review gate configured'}
                    </p>
                    <p>
                      <strong>Fallback</strong>
                      <br />
                      {node.fallback || 'Not defined'}
                    </p>
                    <p className="small">
                      Proposed handling: {node.proposedMinutes} min, including
                      review. Assumption to validate.
                    </p>
                  </div>
                )}
              </div>
              <div className="actions">
                <button className="btn primary" onClick={() => openNode(node)}>
                  <Pencil />
                  Edit action
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    updateFlow({ ...flow, start: node.id });
                    setNotice('Trigger now enters this action.');
                  }}
                >
                  Set as start
                </button>
                <button
                  className="btn icon danger"
                  aria-label="Delete selected action"
                  onClick={() => setRemoveTarget('node')}
                >
                  <Trash2 />
                </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
      <Dialog
        open={modal !== null}
        onOpenChange={(open) => {
          if (!open) setModal(null);
        }}
      >
        <DialogContent className="modal studio-modal">
          <DialogTitle>
            {modal === 'new'
              ? 'Define a business flow'
              : modal === 'brief'
                ? 'Business flow brief'
                : modal === 'node'
                  ? 'Define the action contract'
                  : modal === 'edge'
                    ? 'Define the signal connection'
                    : 'Define the component'}
          </DialogTitle>
          <DialogDescription>
            {modal === 'node'
              ? 'Name the capability, the performer, and what must travel with the work.'
              : modal === 'edge'
                ? 'A signal connects two actions. Its condition determines which case follows it.'
                : 'Use the vocabulary of this business. The underlying model stays the same.'}
          </DialogDescription>
          {notice && <output className="notice">{notice}</output>}
          {(modal === 'new' || modal === 'brief') && (
            <form key={modal + scenario.id} onSubmit={saveBrief}>
              <div className="form-grid">
                <Input
                  label="Flow name"
                  name="title"
                  value={modal === 'brief' ? scenario.title : ''}
                  required
                />
                <Input
                  label="Industry / business context"
                  name="industry"
                  value={modal === 'brief' ? scenario.industry : ''}
                />
                <Input
                  label="Business case / object"
                  name="object"
                  value={modal === 'brief' ? flow.object : ''}
                  hint="Booking, referral, order, request…"
                />
                <Input
                  label="Identity field"
                  name="identity"
                  value={modal === 'brief' ? flow.identity : 'caseId'}
                />
              </div>
              <Input
                label="Trigger"
                name="trigger"
                value={modal === 'brief' ? scenario.trigger : ''}
                required
                area
              />
              <Input
                label="Intended outcome and its evidence"
                name="outcome"
                value={modal === 'brief' ? scenario.outcome : ''}
                required
                area
              />
              <Input
                label="Organization / context"
                name="context"
                value={modal === 'brief' ? scenario.context : ''}
              />
              <Input
                label="Discovery notes"
                name="notes"
                value={modal === 'brief' ? scenario.notes : ''}
                area
              />
              <details>
                <summary>Future state, pilot, and questions</summary>
                {[
                  ['Desired future state', 'future'],
                  ['First move', 'firstMove'],
                  ['Hypothesis', 'hypothesis'],
                  ['Success measure', 'measure'],
                  ['Accountable owner', 'owner'],
                  ['Fallback / guardrail', 'guardrail'],
                  ['Open questions', 'questions'],
                ].map(([label, name]) => (
                  <Input
                    key={name}
                    label={label}
                    name={name}
                    value={
                      modal === 'brief'
                        ? typeof scenario[name as keyof Scenario] === 'string'
                          ? (scenario[name as keyof Scenario] as string)
                          : ''
                        : ''
                    }
                    area
                  />
                ))}
              </details>
              <div className="actions">
                <button className="btn primary" type="submit">
                  Save flow
                  <ArrowRight />
                </button>
              </div>
            </form>
          )}
          {modal === 'node' && draftNode && (
            <form key={draftNode.id} onSubmit={saveNode}>
              <Input
                label="Action name"
                name="title"
                value={draftNode.title === 'New action' ? '' : draftNode.title}
                required
              />
              <div className="form-grid">
                <Input
                  label="Business capability"
                  name="capability"
                  value={draftNode.capability}
                  hint="For example: Understand, Arrange, Authorize"
                  required
                />
                <Field label="Action kind">
                  <NativeSelect name="kind" defaultValue={draftNode.kind}>
                    <option value="action">Action</option>
                    <option value="decision">Decision</option>
                    <option value="outcome">Terminal outcome</option>
                  </NativeSelect>
                </Field>
                <Field label="Component performing the action">
                  <NativeSelect
                    name="componentId"
                    defaultValue={draftNode.componentId}
                  >
                    <option value="">Create a new component below</option>
                    {flow.components.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="New component kind">
                  <NativeSelect name="actorKind" defaultValue="person">
                    <option value="person">Person / team</option>
                    <option value="system">System / service</option>
                    <option value="agent">AI agent</option>
                  </NativeSelect>
                </Field>
                <Input
                  label="New component name (if needed)"
                  name="componentName"
                />
                <Input
                  label="Case state after this action"
                  name="state"
                  value={draftNode.state}
                />
                <Field label="Terminal outcome status">
                  <NativeSelect name="result" defaultValue={draftNode.result}>
                    <option value="met">Intended outcome met</option>
                    <option value="pending">Waiting / not complete</option>
                    <option value="not-met">Outcome not met</option>
                  </NativeSelect>
                </Field>
                <Field label="Map lane">
                  <NativeSelect name="lane" defaultValue={draftNode.lane}>
                    <option value="0">Experience & fulfillment</option>
                    <option value="1">Systems & coordination</option>
                    <option value="2">People & exceptions</option>
                  </NativeSelect>
                </Field>
                <Field label="Map column (0–150)">
                  <input
                    type="number"
                    name="column"
                    min="0"
                    max="150"
                    step="1"
                    defaultValue={draftNode.column}
                  />
                </Field>
              </div>
              <div className="form-grid">
                <Input
                  label="Required input keys"
                  name="inputs"
                  value={draftNode.inputs.join(', ')}
                  hint="Comma-separated field keys; no spaces inside keys"
                />
                <Input
                  label="Produced context keys"
                  name="outputs"
                  value={draftNode.outputs.join(', ')}
                />
                <Input
                  label="Surface"
                  name="surface"
                  value={draftNode.surface}
                />
                <Input
                  label="Channel"
                  name="channel"
                  value={draftNode.channel}
                />
                <Field label="Handling minutes (assumed)">
                  <input
                    name="minutes"
                    type="number"
                    min="0"
                    max="100000"
                    step="any"
                    defaultValue={draftNode.minutes}
                  />
                </Field>
                <Field label="Waiting minutes (assumed)">
                  <input
                    name="wait"
                    type="number"
                    min="0"
                    max="100000"
                    step="any"
                    defaultValue={draftNode.wait}
                  />
                </Field>
              </div>
              <Input
                label="Friction"
                name="friction"
                value={draftNode.friction}
                area
              />
              <div className="form-grid">
                <Field label="Evidence status">
                  <NativeSelect
                    name="evidence"
                    defaultValue={draftNode.evidence}
                  >
                    <option>Assumption</option>
                    <option>Reported</option>
                    <option>Observed</option>
                  </NativeSelect>
                </Field>
                <Input
                  label="Evidence source"
                  name="source"
                  value={draftNode.source}
                />
              </div>
              <div className="delegation-form">
                <div className="eyebrow">AI delegation</div>
                <Field label="Use AI as a candidate for this action?">
                  <NativeSelect name="ai" defaultValue={String(draftNode.ai)}>
                    <option value="false">No — current performer</option>
                    <option value="true">Yes — define a bounded task</option>
                  </NativeSelect>
                </Field>
                <Input
                  label="Task for the AI"
                  name="instruction"
                  value={draftNode.instruction}
                  area
                />
                <Input
                  label="Expected output and acceptance check"
                  name="outputContract"
                  value={draftNode.outputContract}
                  area
                />
                <Input
                  label="Fallback owner / action"
                  name="fallback"
                  value={draftNode.fallback}
                />
                <div className="form-grid">
                  <Field label="Human review">
                    <NativeSelect
                      name="review"
                      defaultValue={String(draftNode.review)}
                    >
                      <option value="true">
                        Required before output is emitted
                      </option>
                      <option value="false">Not required in this draft</option>
                    </NativeSelect>
                  </Field>
                  <Field label="Proposed handling minutes, including review">
                    <input
                      name="proposedMinutes"
                      type="number"
                      min="0"
                      max="100000"
                      step="any"
                      defaultValue={draftNode.proposedMinutes}
                    />
                  </Field>
                </div>
              </div>
              <div className="actions">
                <button type="submit" className="btn primary">
                  Save action
                  <Check />
                </button>
              </div>
            </form>
          )}
          {modal === 'edge' && draftEdge && (
            <form key={draftEdge.id} onSubmit={saveEdge}>
              <div className="form-grid">
                <Field label="From action">
                  <NativeSelect name="from" defaultValue={draftEdge.from}>
                    {flow.nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.title}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="To action">
                  <NativeSelect name="to" defaultValue={draftEdge.to}>
                    {flow.nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.title}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              </div>
              <Input
                label="Signal / event name"
                name="signal"
                value={draftEdge.signal}
                required
                hint="For example: context.assembled, referral.acknowledged"
              />
              <Field label="Condition">
                <NativeSelect name="when" defaultValue={draftEdge.when}>
                  <option value="always">Always</option>
                  <option value="ready">Context is ready</option>
                  <option value="not-ready">Context is incomplete</option>
                  <option value="exception">
                    Case needs exception handling
                  </option>
                  <option value="standard">
                    Case follows the standard route
                  </option>
                </NativeSelect>
              </Field>
              <p className="small muted">
                These explicit conditions drive the rehearsal cases. They are a
                small prototype vocabulary, not a full policy language.
              </p>
              <div className="actions">
                <button className="btn primary" type="submit">
                  Save signal
                </button>
                {flow.edges.some((e) => e.id === draftEdge.id) && (
                  <button
                    type="button"
                    className="btn danger"
                    onClick={() => setRemoveTarget('edge')}
                  >
                    Delete signal
                  </button>
                )}
              </div>
            </form>
          )}
          {modal === 'component' && draftComponent && (
            <form key={draftComponent.id} onSubmit={saveComponent}>
              <Input
                label="Component name"
                name="name"
                value={draftComponent.name}
                required
              />
              <Field label="Component kind">
                <NativeSelect name="kind" defaultValue={draftComponent.kind}>
                  <option value="system">System / service</option>
                  <option value="person">Person / team</option>
                  <option value="agent">Agent</option>
                </NativeSelect>
              </Field>
              <Input
                label="Responsibility"
                name="responsibility"
                value={draftComponent.responsibility}
                area
              />
              <button className="btn primary" type="submit">
                Save component
              </button>
            </form>
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
          <AlertDialogTitle>Replace this browser’s workspace?</AlertDialogTitle>
          <AlertDialogDescription>
            The incoming workspace has {pendingImport?.scenarios.length} flows
            and company notes. Export current work first to keep a backup.
            Version 1 files are migrated without discarding their original
            notes.
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
                if (pendingImport && commit(pendingImport)) {
                  setPendingImport(null);
                  setBlocked(false);
                  setAssisted(false);
                  setSelected(null);
                  setNotice('Workspace imported.');
                }
              }}
            >
              Replace workspace
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Delete this {removeTarget}?</AlertDialogTitle>
          <AlertDialogDescription>
            {removeTarget === 'node'
              ? 'The action and its connected signals will be removed.'
              : 'This item will be removed from the workspace.'}{' '}
            Export a backup if you need to keep it.
          </AlertDialogDescription>
          <div className="actions">
            <button className="btn" onClick={() => setRemoveTarget(null)}>
              Cancel
            </button>
            <button className="btn danger" onClick={remove}>
              Delete
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
