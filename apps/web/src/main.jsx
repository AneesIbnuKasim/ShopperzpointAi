import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const sampleObservation = [{ productName: 'Cute floral sticker pack', category: 'Cute stationery', provider: 'amazon_india', sourceUrl: 'https://www.amazon.in/', observedPriceInr: 149, rating: 4.4, reviewCount: 128, salesRank: 42, salesRankCategory: 'Office Products', trendDirection: 'rising', evidence: 'Captured from Amazon India Best Sellers/product details', dataStatus: 'verified', observedAt: new Date().toISOString() }];

async function api(path, options = {}, token) {
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { 'content-type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Request failed');
  return body;
}

const navItems = ['Overview', 'Daily Top 20', 'Trending Products', 'Supplier Research', 'Profit Calculator', 'Listing Generator', 'Research History', 'Settings'];
const categories = ['Craft supplies', 'Hamper materials', 'Artificial flowers', 'Kawaii & stationery', 'Balloon & party'];

function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">✦</span><span>CraftTrend <b>AI</b></span></div>
        <nav>{navItems.map((item, index) => <a className={index === 0 ? 'active' : ''} href={`#${item.toLowerCase().replaceAll(' ', '-')}`} key={item}>{item}</a>)}</nav>
        <div className="worker-status"><span className="status-dot" />Research worker offline<div>Connect local worker to begin</div></div>
      </aside>
      <main className="main-content">
        <header className="topbar"><div><p className="eyebrow">Saturday, 7 November 2026</p><h1>Good morning, owner</h1></div><button className="avatar">O</button></header>
        <section className="hero"><div><p className="eyebrow accent">BUSINESS INTELLIGENCE</p><h2>Find your next winning product.</h2><p>Research, compare and prepare profitable products for your Meesho store.</p></div><button className="primary-button">Start research <span>→</span></button></section>
        <section className="metric-grid">{[['Products researched', '0', 'Today'], ['Top opportunities', '0', 'Score 65+'], ['Average opportunity', '—', 'Awaiting data'], ['Estimated profit', '₹0', 'Today']].map(([label, value, note]) => <article className="metric-card" key={label}><p>{label}</p><strong>{value}</strong><span>{note}</span></article>)}</section>
        <div className="content-grid"><section className="panel opportunities"><div className="panel-heading"><div><p className="eyebrow">OPPORTUNITY PIPELINE</p><h3>Top opportunities</h3></div><a href="#daily-top-20">View all →</a></div><div className="empty-state"><div className="empty-icon">⌁</div><h4>Your opportunity feed is ready</h4><p>Run your first research job to discover products with evidence-backed demand, competition and profitability data.</p><button className="secondary-button">Configure research</button></div></section><section className="panel categories"><div className="panel-heading"><div><p className="eyebrow">RESEARCH CONFIGURATION</p><h3>Active categories</h3></div><a href="#settings">Manage</a></div>{categories.map((category, index) => <div className="category-row" key={category}><span className={`category-icon icon-${index}`} />{category}<span className="chevron">›</span></div>)}</section></div>
      </main>
    </div>
  );
}

function Login({ onLogin }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const submit = async (event) => { event.preventDefault(); setError(''); try { const result = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); localStorage.setItem('crafttrend-token', result.token); onLogin(result.token); } catch (err) { setError(err.message); } };
  return <main className="auth-page"><form className="auth-card" onSubmit={submit}><div className="brand auth-brand"><span className="brand-mark">✦</span><span>CraftTrend <b>AI</b></span></div><p className="eyebrow">ADMIN ACCESS</p><h1>Welcome back</h1><p className="muted">Sign in to manage product research.</p><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{error && <p className="form-error">{error}</p>}<button className="primary-button full-width">Sign in</button></form></main>;
}

function ResearchPanel({ token }) {
  const [category, setCategory] = React.useState('Cute stationery');
  const [keywords, setKeywords] = React.useState('cute stationery, stickers, washi tape');
  const [selectedProviders, setSelectedProviders] = React.useState(['meesho', 'amazon_india', 'flipkart']);
  const [json, setJson] = React.useState(JSON.stringify(sampleObservation, null, 2));
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const toggleProvider = (provider) => setSelectedProviders((current) => current.includes(provider) ? current.filter((item) => item !== provider) : [...current, provider]);
  const submit = async (event) => { event.preventDefault(); setMessage(''); setError(''); try { if (!selectedProviders.length) throw new Error('Select at least one marketplace'); const observations = JSON.parse(json); const { run } = await api('/research/runs', { method: 'POST', body: JSON.stringify({ category, keywords: keywords.split(',').map((item) => item.trim()).filter(Boolean), providers: selectedProviders, mode: 'manual_import' }) }, token); const result = await api('/research/import', { method: 'POST', body: JSON.stringify({ runId: run._id, observations }) }, token); setMessage(`${result.count} marketplace observation${result.count === 1 ? '' : 's'} imported.`); } catch (err) { setError(err.message); } };
  return <section className="research-layout"><div className="panel"><div className="panel-heading"><div><p className="eyebrow">MULTI-MARKETPLACE</p><h3>Import research evidence</h3></div><span className="pill">Meesho · Amazon · Flipkart</span></div><p className="muted panel-copy">Select the marketplaces covered by this run, then paste normalized observations from permitted sources. Exact sales must include an authorized source.</p><form onSubmit={submit}><div className="provider-grid">{[['meesho', 'Meesho'], ['amazon_india', 'Amazon India'], ['flipkart', 'Flipkart']].map(([value, label]) => <label className="provider-option" key={value}><input type="checkbox" checked={selectedProviders.includes(value)} onChange={() => toggleProvider(value)} />{label}</label>)}</div><div className="form-grid"><label>Category<input value={category} onChange={(event) => setCategory(event.target.value)} required /></label><label>Keywords<input value={keywords} onChange={(event) => setKeywords(event.target.value)} required /></label></div><label>Observation JSON<textarea className="json-input" value={json} onChange={(event) => setJson(event.target.value)} spellCheck="false" required /></label>{error && <p className="form-error">{error}</p>}{message && <p className="form-success">{message}</p>}<button className="primary-button">Import marketplace data <span>→</span></button></form></div><div className="panel guidance"><p className="eyebrow">CAPTURE CHECKLIST</p><h3>What to record</h3><ul><li>Product and marketplace</li><li>Price, rating and review count</li><li>Rank or trend signal</li><li>Source URL and capture time</li><li>Units/revenue only when authorized</li><li>Evidence and limitations</li></ul></div></section>;
}

function TopTwentyPanel({ token }) {
  const [products, setProducts] = React.useState([]);
  React.useEffect(() => { api('/research/top-opportunities', {}, token).then((result) => setProducts(result.products)).catch(() => {}); }, [token]);
  return <section className="panel history-panel"><div className="panel-heading"><div><p className="eyebrow">CROSS-MARKETPLACE RANKING</p><h3>Daily Top 20</h3></div><span className="pill">Meesho · Amazon · Flipkart</span></div><p className="muted panel-copy">Ranked from the latest observed evidence across all selected marketplaces. Missing data lowers confidence.</p>{products.length === 0 ? <div className="empty-state"><div className="empty-icon">⌁</div><h4>Import marketplace evidence first</h4><p>Products will be combined here once Meesho, Amazon India, or Flipkart observations are available.</p></div> : <div className="table-wrap"><table><thead><tr><th>#</th><th>Product</th><th>Marketplaces</th><th>Score</th><th>Confidence</th></tr></thead><tbody>{products.map((item, index) => <tr key={item.productName}><td>{index + 1}</td><td><strong>{item.productName}</strong><small>{item.category}</small></td><td>{item.providers.map((provider) => provider === 'amazon_india' ? 'Amazon' : provider[0].toUpperCase() + provider.slice(1)).join(' · ')}</td><td><strong>{item.opportunityScore}/100</strong></td><td><span className="trend">{item.confidence}</span></td></tr>)}</tbody></table></div>}</section>;
}

function HistoryPanel({ token }) {
  const [data, setData] = React.useState({ observations: [] });
  React.useEffect(() => { api('/research/history', {}, token).then(setData).catch(() => {}); }, [token]);
  return <section className="panel history-panel"><div className="panel-heading"><div><p className="eyebrow">EVIDENCE LOG</p><h3>Research history</h3></div><span className="pill">{data.observations.length} observations</span></div>{data.observations.length === 0 ? <div className="empty-state"><div className="empty-icon">⌁</div><h4>No research imported yet</h4><p>Amazon observations will appear here with their source and capture time.</p></div> : <div className="table-wrap"><table><thead><tr><th>Product</th><th>Source</th><th>BSR</th><th>Trend</th><th>Observed</th></tr></thead><tbody>{data.observations.map((item) => <tr key={item._id}><td><strong>{item.productName}</strong><small>{item.category}</small></td><td>{item.provider}</td><td>{item.salesRank ? `#${item.salesRank}` : '—'}</td><td><span className="trend">{item.trendDirection}</span></td><td>{new Date(item.observedAt).toLocaleDateString()}</td></tr>)}</tbody></table></div>}</section>;
}

function ResearchApp() {
  const [token, setToken] = React.useState(localStorage.getItem('crafttrend-token'));
  const [view, setView] = React.useState('Overview');
  if (!token) return <Login onLogin={setToken} />;
  const logout = () => { localStorage.removeItem('crafttrend-token'); setToken(null); };
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><span className="brand-mark">✦</span><span>CraftTrend <b>AI</b></span></div><nav>{['Overview', 'Research', 'Daily Top 20', 'Research History', 'Settings'].map((item) => <button className={view === item ? 'active' : ''} onClick={() => setView(item)} key={item}>{item}</button>)}</nav><WorkerStatus token={token} /><button className="logout" onClick={logout}>Sign out</button></aside><main className="main-content"><header className="topbar"><div><p className="eyebrow">Sunday, 8 November 2026</p><h1>{view === 'Research' ? 'Marketplace research' : view === 'Daily Top 20' ? 'Daily Top 20' : view === 'Research History' ? 'Research history' : 'Good morning, owner'}</h1></div><button className="avatar">O</button></header>{view === 'Research' ? <ResearchPanel token={token} /> : view === 'Daily Top 20' ? <TopTwentyPanel token={token} /> : view === 'Research History' ? <HistoryPanel token={token} /> : <Overview onResearch={() => setView('Research')} />}</main></div>;
}

function WorkerStatus({ token }) {
  const [status, setStatus] = React.useState(null);
  React.useEffect(() => { let active = true; const refresh = () => api('/worker/status', {}, token).then((result) => active && setStatus(result)).catch(() => active && setStatus(null)); refresh(); const timer = setInterval(refresh, 30000); return () => { active = false; clearInterval(timer); }; }, [token]);
  const worker = status?.worker;
  return <div className="worker-status"><span className={`status-dot ${status?.online ? 'online' : ''}`} />Worker {status?.online ? 'online' : 'offline'}<div>{worker?.model || 'No model connected'}</div><div>{status ? `${status.completedJobs} completed · ${status.failedJobs} failed` : 'Connect local worker to begin'}</div></div>;
}

function Overview({ onResearch }) {
  return <>
    <section className="hero"><div><p className="eyebrow accent">BUSINESS INTELLIGENCE</p><h2>Find your next winning product.</h2><p>Research, compare and prepare profitable products for your Meesho store.</p></div><button className="primary-button" onClick={onResearch}>Start Amazon research <span>→</span></button></section>
    <section className="metric-grid">{[['Products researched', '0', 'Today'], ['Top opportunities', '0', 'Score 65+'], ['Average opportunity', '—', 'Awaiting data'], ['Estimated profit', '₹0', 'Today']].map(([label, value, note]) => <article className="metric-card" key={label}><p>{label}</p><strong>{value}</strong><span>{note}</span></article>)}</section>
    <div className="content-grid"><section className="panel opportunities"><div className="panel-heading"><div><p className="eyebrow">OPPORTUNITY PIPELINE</p><h3>Top opportunities</h3></div></div><div className="empty-state"><div className="empty-icon">⌁</div><h4>Your opportunity feed is ready</h4><p>Import Amazon evidence to begin comparing demand, competition and profitability.</p><button className="secondary-button" onClick={onResearch}>Import research</button></div></section><section className="panel categories"><div className="panel-heading"><div><p className="eyebrow">RESEARCH CONFIGURATION</p><h3>Active categories</h3></div></div>{categories.map((category, index) => <div className="category-row" key={category}><span className={`category-icon icon-${index}`} />{category}<span className="chevron">›</span></div>)}</section></div>
  </>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><ResearchApp /></React.StrictMode>);
