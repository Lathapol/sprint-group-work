import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

type User = { id: number; username: string; role: 'REQUESTER' | 'REVIEWER' };
type Row = {
  id: number; title: string; category: string; amount: string; justification: string;
  state: 'PENDING' | 'IN_REVIEW' | 'RETURNED' | 'APPROVED' | 'REJECTED';
  reviewerId: number | null; reviewer: { username: string } | null; decisionReason: string | null;
  updatedAt: string;
};
type HistoryRow = {
  id: number; actor: User; fromState: Row['state'] | null; toState: Row['state'];
  reason: string | null; createdAt: string;
};
type Summary = {
  total: number; byState: { state: Row['state']; count: number }[];
  byCategory: { category: string; count: number }[];
  byReviewer: { reviewer: { id: number; username: string }; approved: number; rejected: number; total: number }[];
  unattributedDecisions: number;
};

class ApiError extends Error {
  constructor(readonly status: number, message: string, readonly fields: Record<string, string> = {}) {
    super(message);
  }
}

async function api<T>(path: string, body?: object, signal?: AbortSignal, method = 'POST'): Promise<T> {
  const response = await fetch('/api' + path, {
    method: body === undefined ? 'GET' : method,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
  const payload = await response.json();
  if (!response.ok) throw new ApiError(response.status, payload.error.message, payload.error.fields);
  return payload.data;
}

function useRead<T>(path: string, refresh = 0) {
  const [result, setResult] = useState<{ path: string; refresh: number; data?: T; error?: unknown }>();
  useEffect(() => {
    const controller = new AbortController();
    api<T>(path, undefined, controller.signal).then(
      (data) => { if (!controller.signal.aborted) setResult({ path, refresh, data }); },
      (error: unknown) => { if (!controller.signal.aborted) setResult({ path, refresh, error }); },
    );
    return () => controller.abort();
  }, [path, refresh]);
  return result?.path === path && result.refresh === refresh ? result : undefined;
}

function ErrorMessage({ error }: { error: unknown }) {
  if (!error) return null;
  return <p className="alert alert-danger" role="alert">
    {error instanceof Error ? error.message : 'Unable to complete the request.'}
  </p>;
}

const labels: Record<Row['state'], string> = {
  PENDING: 'Pending', IN_REVIEW: 'In review', RETURNED: 'Returned', APPROVED: 'Approved', REJECTED: 'Rejected',
};

function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setBusy(true);
    try {
      onLogin(await api<User>('/auth/login', Object.fromEntries(new FormData(event.currentTarget))));
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  return <section className="card p-4 mx-auto" style={{ maxWidth: 440 }}>
    <h1 className="h3">Sign in</h1>
    <ErrorMessage error={error} />
    <form onSubmit={submit}>
      <label className="form-label" htmlFor="username">Username</label>
      <input className="form-control mb-3" id="username" name="username" autoComplete="username" required />
      <label className="form-label" htmlFor="password">Password</label>
      <input className="form-control mb-3" id="password" name="password" type="password" autoComplete="current-password" required />
      <button className="btn btn-primary" disabled={busy}>Sign in</button>
    </form>
  </section>;
}

function RequestList({ reviewer }: { reviewer: boolean }) {
  const [tab, setTab] = useState('all');
  const empty = { state: '', category: '', from: '', to: '', q: '' };
  const [draft, setDraft] = useState(empty);
  const [applied, setApplied] = useState(empty);
  const [refresh, setRefresh] = useState(0);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(applied)) if (value) params.set(key, value);
  if (tab === 'queue') params.set('state', 'PENDING');
  if (tab === 'mine') params.set('mine', 'true');
  const query = params.toString();
  const result = useRead<Row[]>('/requests' + (query ? '?' + query : ''), refresh);
  const fields = result?.error instanceof ApiError ? result.error.fields : {};
  function apply(event: FormEvent) {
    event.preventDefault();
    setApplied({ ...draft });
    setRefresh(value => value + 1);
  }
  function chooseTab(next: string) {
    setTab(next);
    setDraft(value => ({ ...value, state: '' }));
    setApplied(value => ({ ...value, state: '' }));
    setRefresh(value => value + 1);
  }
  function control(name: keyof typeof draft, label: string, input: ReactNode) {
    return <div className="col-sm-6 col-lg-4">
      <label className="form-label" htmlFor={'filter-' + name}>{label}</label>
      {input}{fields[name] && <div id={'filter-' + name + '-error'} className="text-danger">{fields[name]}</div>}
    </div>;
  }
  function attributes(name: keyof typeof draft) {
    return { id: 'filter-' + name, value: draft[name], 'aria-invalid': !!fields[name],
      'aria-describedby': fields[name] ? 'filter-' + name + '-error' : undefined,
      onChange: (event: { target: { value: string } }) => setDraft(value => ({ ...value, [name]: event.target.value })) };
  }
  return <>
    <div className="d-flex justify-content-between align-items-center mb-3">
      <h1 className="h3 mb-0">{reviewer ? 'Review requests' : 'My requests'}</h1>
      {!reviewer && <Link className="btn btn-primary" to="/new">New request</Link>}
      {reviewer && <Link className="btn btn-outline-primary" to="/summary">Decision summary</Link>}
    </div>
    {reviewer && <div className="btn-group mb-3" aria-label="Request filters">
      {['All', 'Queue', 'Mine'].map((name) => <button key={name} type="button"
        className={'btn ' + (tab === name.toLowerCase() ? 'btn-primary' : 'btn-outline-primary')}
        aria-pressed={tab === name.toLowerCase()} onClick={() => chooseTab(name.toLowerCase())}>{name}</button>)}
    </div>}
    <form className="card p-3 mb-3" onSubmit={apply} aria-label="Filter requests">
      <div className="row g-3">
        {control('state', 'Filter state', <select className="form-select" {...attributes('state')}
          value={tab === 'queue' ? 'PENDING' : draft.state} disabled={tab === 'queue'}>
          <option value="">All states</option>
          {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>)}
        {control('category', 'Filter category', <select className="form-select" {...attributes('category')}>
          <option value="">All categories</option>
          {['Funding', 'Purchase', 'Travel', 'Reimbursement'].map(name => <option key={name} value={name.toUpperCase()}>{name}</option>)}
        </select>)}
        {control('q', 'Search title or justification', <input className="form-control" {...attributes('q')} />)}
        {control('from', 'Created from (UTC)', <input className="form-control" type="date" {...attributes('from')} />)}
        {control('to', 'Created through (UTC)', <input className="form-control" type="date" {...attributes('to')} />)}
      </div>
      <p className="text-body-secondary mt-3 mb-2">Dates include the whole UTC day. Search matches literal text, ignoring case.</p>
      <div className="d-flex gap-2">
        <button className="btn btn-primary" disabled={!result}>Apply filters</button>
        <button className="btn btn-outline-secondary" type="button" onClick={() => {
          setDraft(empty); setApplied(empty); setRefresh(value => value + 1);
        }}>Clear filters</button>
      </div>
    </form>
    {!result && <p role="status">Loading requests…</p>}
    <ErrorMessage error={result?.error} />
    {result?.data?.length === 0 && <p>No requests in this view.</p>}
    <ul className="list-group">
      {result?.data?.map((row) => <li key={row.id} className="list-group-item d-flex justify-content-between">
        <Link to={'/requests/' + row.id}>{row.title}</Link><span className="badge text-bg-secondary">{labels[row.state]}</span>
      </li>)}
    </ul>
  </>;
}

function DecisionSummary() {
  const [attempt, setAttempt] = useState(0);
  const result = useRead<Summary>('/reports/summary', attempt);
  const data = result?.data;
  const refresh = () => setAttempt(value => value + 1);
  const categoryLabel = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();
  return <>
    <Link to="/">Back to requests</Link>
    <h1 className="h3 mt-3">Decision summary</h1>
    <p className="text-body-secondary">Current requests across all requesters. Reviewer totals follow final decision history.</p>
    {!result && <p role="status">Loading summary…</p>}
    {result?.error ? <>
      <ErrorMessage error={result.error} />
      <button className="btn btn-outline-primary" type="button" onClick={refresh}>Retry summary</button>
    </> : null}
    {data && <>
      <section className="card p-3 mb-3" aria-label="Summary totals">
        <h2 className="h5">Total requests</h2>
        <p className="display-6 mb-0" data-testid="summary-total">{data.total}</p>
        {data.total === 0 && <p className="mb-0">No requests yet.</p>}
      </section>
      <div className="row g-3">
        <section className="col-md-6">
          <h2 className="h5">Requests by state</h2>
          <table className="table table-striped" aria-label="Requests by state">
            <thead><tr><th scope="col">State</th><th scope="col">Count</th></tr></thead>
            <tbody>{data.byState.map(row => <tr key={row.state}><td>{labels[row.state]}</td><td>{row.count}</td></tr>)}</tbody>
          </table>
        </section>
        <section className="col-md-6">
          <h2 className="h5">Requests by category</h2>
          <table className="table table-striped" aria-label="Requests by category">
            <thead><tr><th scope="col">Category</th><th scope="col">Count</th></tr></thead>
            <tbody>{data.byCategory.map(row => <tr key={row.category}><td>{categoryLabel(row.category)}</td><td>{row.count}</td></tr>)}</tbody>
          </table>
        </section>
      </div>
      <section className="mt-3">
        <h2 className="h5">Decisions by reviewer</h2>
        <div className="table-responsive">
          <table className="table table-striped" aria-label="Decisions by reviewer">
            <thead><tr><th scope="col">Reviewer</th><th scope="col">Approved</th><th scope="col">Rejected</th><th scope="col">Total</th></tr></thead>
            <tbody>{data.byReviewer.map(row => <tr key={row.reviewer.id}>
              <td>{row.reviewer.username}</td><td>{row.approved}</td><td>{row.rejected}</td><td>{row.total}</td>
            </tr>)}</tbody>
          </table>
        </div>
        {data.byReviewer.length === 0 && <p>No attributed decisions yet.</p>}
        <p>Unattributed decisions: <strong>{data.unattributedDecisions}</strong></p>
        <p className="text-body-secondary">Terminal requests without an attributable Reviewer decision history remain in the totals above.</p>
      </section>
      <button className="btn btn-outline-primary" type="button" onClick={refresh}>Refresh summary</button>
    </>}
  </>;
}

function NewRequest() {
  const navigate = useNavigate();
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setBusy(true);
    try {
      const row = await api<Row>('/requests', Object.fromEntries(new FormData(event.currentTarget)));
      navigate('/requests/' + row.id);
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  function field(name: string, label: string, input: ReactNode) {
    const message = error instanceof ApiError ? error.fields[name] : undefined;
    return <div className="mb-3">
      <label className="form-label" htmlFor={name}>{label}</label>
      {input}{message && <div className="text-danger">{message}</div>}
    </div>;
  }
  return <section className="card p-4">
    <h1 className="h3">New request</h1>
    <ErrorMessage error={error} />
    <form onSubmit={submit}>
      {field('title', 'Title', <input className="form-control" id="title" name="title" />)}
      {field('category', 'Category', <select className="form-select" id="category" name="category" defaultValue="">
        <option value="">Choose a category</option>
        {['Funding', 'Purchase', 'Travel', 'Reimbursement'].map((name) => <option key={name} value={name.toUpperCase()}>{name}</option>)}
      </select>)}
      {field('amount', 'Amount (THB)', <input className="form-control" id="amount" name="amount" inputMode="decimal" />)}
      {field('justification', 'Justification', <textarea className="form-control" id="justification" name="justification" />)}
      <button className="btn btn-primary" disabled={busy}>Submit request</button>
    </form>
  </section>;
}

function HistoryContent({ id, retry }: { id: number; retry: () => void }) {
  const history = useRead<HistoryRow[]>('/requests/' + id + '/history');
  if (!history) return <p role="status">Loading history…</p>;
  if (history.error) return <>
    <ErrorMessage error={history.error} />
    <button type="button" className="btn btn-outline-primary" onClick={retry}>Retry history</button>
  </>;
  if (!history.data?.length) return <p>No history recorded for this request.</p>;
  return <ol className="list-group list-group-numbered">
    {history.data.map((entry) => <li className="list-group-item" key={entry.id}>
      <p className="fw-semibold mb-1">{entry.fromState === 'RETURNED' && entry.toState === 'RETURNED'
        ? 'Edited' : `${entry.fromState ? labels[entry.fromState] : 'Created'} → ${labels[entry.toState]}`}</p>
      <p className="mb-1">{entry.actor.username} ({entry.actor.role})</p>
      <time className="text-body-secondary" dateTime={entry.createdAt}>
        {new Date(entry.createdAt).toLocaleString(undefined, { timeZone: 'UTC' })} UTC
      </time>
      {entry.reason && <p className="mb-0 mt-1">{'Reason: ' + entry.reason}</p>}
    </li>)}
  </ol>;
}

function RequestHistory({ id }: { id: number }) {
  const [attempt, setAttempt] = useState(0);
  return <section className="card p-4 mt-3" aria-label="Request history">
    <h2 className="h4">History</h2>
    <HistoryContent key={attempt} id={id} retry={() => setAttempt(value => value + 1)} />
  </section>;
}

function ReturnedEditor({ row, onSaved }: { row: Row; onSaved: (row: Row) => void }) {
  const values = (record: Row) => ({ title: record.title, category: record.category, amount: record.amount, justification: record.justification });
  const [draft, setDraft] = useState(() => values(row));
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [conflict, setConflict] = useState<Row>();
  const dirty = Object.entries(draft).some(([name, value]) => value !== values(row)[name as keyof typeof draft]);
  async function update(resubmit: boolean) {
    setError(undefined); setSaved(false); setBusy(true);
    try {
      const next = await api<Row>('/requests/' + row.id + (resubmit ? '/resubmit' : ''),
        resubmit ? {} : draft, undefined, resubmit ? 'POST' : 'PATCH');
      setDraft(values(next)); setSaved(!resubmit); onSaved(next);
    } catch (failure) {
      setError(failure);
      if (failure instanceof ApiError && failure.status === 409) {
        try { setConflict(await api<Row>('/requests/' + row.id)); } catch { /* Keep original conflict and unsaved inputs. */ }
      }
    } finally { setBusy(false); }
  }
  function field(name: keyof typeof draft, label: string, multiline = false) {
    const message = error instanceof ApiError ? error.fields[name] : undefined;
    const props = { id: 'edit-' + name, className: 'form-control', value: draft[name],
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setDraft(current => ({ ...current, [name]: event.target.value })); setSaved(false);
      } };
    return <div className="mb-3">
      <label className="form-label" htmlFor={props.id}>{label}</label>
      {multiline ? <textarea {...props} /> : <input {...props} inputMode={name === 'amount' ? 'decimal' : undefined} />}
      {message && <div className="text-danger">{message}</div>}
    </div>;
  }
  return <section className="card p-4 mt-3" aria-label="Returned request editor">
    <h2 className="h4">Edit returned request</h2>
    <p>Save any changes, then resubmit to the same reviewer.</p>
    <ErrorMessage error={error} />
    {conflict && <div role="status">
      <p>Latest state: {labels[conflict.state]}. Your unsaved input is retained below.</p>
      <button type="button" className="btn btn-outline-primary mb-3" onClick={() => onSaved(conflict)}>Refresh request</button>
    </div>}
    {saved && <p role="status">Changes saved. Resubmit when ready.</p>}
    <form onSubmit={event => { event.preventDefault(); void update(false); }}>
      <fieldset disabled={busy || Boolean(conflict)}>
        {field('title', 'Title')}
        <div className="mb-3">
          <label className="form-label" htmlFor="edit-category">Category</label>
          <select className="form-select" id="edit-category" value={draft.category}
            onChange={event => { setDraft(current => ({ ...current, category: event.target.value })); setSaved(false); }}>
            {['Funding', 'Purchase', 'Travel', 'Reimbursement'].map(name => <option key={name} value={name.toUpperCase()}>{name}</option>)}
          </select>
          {error instanceof ApiError && error.fields.category && <div className="text-danger">{error.fields.category}</div>}
        </div>
        {field('amount', 'Amount (THB)')}
        {field('justification', 'Justification', true)}
        <div className="d-flex gap-2">
          <button className="btn btn-primary" disabled={!dirty}>Save changes</button>
          <button type="button" className="btn btn-outline-primary" disabled={dirty}
            onClick={() => void update(true)}>Resubmit request</button>
        </div>
        {dirty && <p className="mt-2 mb-0">Save your changes before resubmitting.</p>}
      </fieldset>
    </form>
  </section>;
}

function RequestDetail({ user }: { user: User }) {
  const { id } = useParams();
  const path = '/requests/' + id;
  const result = useRead<Row>(path);
  const [updated, setUpdated] = useState<Row>();
  const [error, setError] = useState<unknown>();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const row = updated ?? result?.data;

  async function act(action: 'claim' | 'approve' | 'reject' | 'return') {
    setError(undefined);
    setBusy(true);
    try {
      setUpdated(await api<Row>(path + '/' + action, action === 'claim' ? {} : { reason }));
    } catch (failure) {
      setError(failure);
      if (failure instanceof ApiError && failure.status === 409) {
        try { setUpdated(await api<Row>(path)); } catch { /* Preserve the conflict message. */ }
      }
    } finally {
      setBusy(false);
    }
  }

  return <>
    <Link to="/">Back to requests</Link>
    {!result && <p role="status">Loading request…</p>}
    <ErrorMessage error={result?.error ?? error} />
    {row && <section className="card p-4 mt-3">
      <h1 className="h3">{row.title}</h1>
      <dl className="row">
        <dt className="col-sm-3">Status</dt><dd className="col-sm-9">{labels[row.state]}</dd>
        <dt className="col-sm-3">Category</dt><dd className="col-sm-9">{row.category}</dd>
        <dt className="col-sm-3">Amount (THB)</dt><dd className="col-sm-9">{row.amount}</dd>
        <dt className="col-sm-3">Justification</dt><dd className="col-sm-9">{row.justification}</dd>
        <dt className="col-sm-3">Reviewer</dt><dd className="col-sm-9">{row.reviewer?.username ?? 'Unassigned'}</dd>
        {row.decisionReason && <><dt className="col-sm-3">Decision reason</dt><dd className="col-sm-9">{row.decisionReason}</dd></>}
      </dl>
      {user.role === 'REVIEWER' && row.state === 'PENDING' &&
        <button className="btn btn-primary align-self-start" disabled={busy} onClick={() => void act('claim')}>Claim request</button>}
      {user.role === 'REVIEWER' && row.state === 'IN_REVIEW' && row.reviewerId === user.id && <>
        <label className="form-label" htmlFor="reason">Decision reason (required for rejection or return)</label>
        <textarea className="form-control mb-3" id="reason" value={reason} onChange={(event) => setReason(event.target.value)} />
        <div className="d-flex gap-2">
          <button className="btn btn-success" disabled={busy} onClick={() => void act('approve')}>Approve</button>
          <button className="btn btn-outline-danger" disabled={busy} onClick={() => void act('reject')}>Reject</button>
          <button className="btn btn-outline-warning" disabled={busy} onClick={() => void act('return')}>Return request</button>
        </div>
      </>}
    </section>}
    {row?.state === 'RETURNED' && user.role === 'REQUESTER' && <ReturnedEditor row={row} onSaved={setUpdated} />}
    {row && <RequestHistory key={row.id + ':' + row.updatedAt} id={row.id} />}
  </>;
}

function App() {
  const current = useRead<User>('/auth/me');
  const [override, setOverride] = useState<User | null>();
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const user = override === undefined ? current?.data : override;
  async function logout() {
    setError(undefined);
    setBusy(true);
    try {
      await api('/auth/logout', {});
      setOverride(null);
      navigate('/');
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === 401) {
        setOverride(null);
        navigate('/');
      } else setError(failure);
    } finally {
      setBusy(false);
    }
  }
  const currentError = current?.error;
  return <>
    <header className="bg-dark text-white py-3">
      <div className="container d-flex justify-content-between align-items-center">
        <div>
          <Link className="text-white text-decoration-none fw-semibold" to="/">Department Requests</Link>
          <small className="d-block text-white-50">Team approvals · Cloud release</small>
        </div>
        {user && <div className="d-flex gap-3 align-items-center">
          <span>{user.username}</span>
          <button className="btn btn-sm btn-outline-light" disabled={busy} onClick={() => void logout()}>Sign out</button>
        </div>}
      </div>
    </header>
    <main className="container py-4" style={{ maxWidth: 960 }}>
      <ErrorMessage error={error} />
      {override === undefined && !current ? <p role="status">Checking session…</p> : user ?
        <Routes>
          <Route path="/" element={<RequestList reviewer={user.role === 'REVIEWER'} />} />
          {user.role === 'REQUESTER' && <Route path="/new" element={<NewRequest />} />}
          {user.role === 'REVIEWER' && <Route path="/summary" element={<DecisionSummary />} />}
          <Route path="/requests/:id" element={<DetailRoute user={user} />} />
          <Route path="*" element={<p>Page unavailable. <Link to="/">Back to requests</Link></p>} />
        </Routes> : <>
          {override === undefined && !(currentError instanceof ApiError && currentError.status === 401) &&
            <ErrorMessage error={currentError} />}
          <Login onLogin={(account) => { setOverride(account); navigate('/'); }} />
        </>}
    </main>
  </>;
}

function DetailRoute({ user }: { user: User }) {
  const { id } = useParams();
  return <RequestDetail key={id} user={user} />;
}

createRoot(document.getElementById('root')!).render(<BrowserRouter><App /></BrowserRouter>);
