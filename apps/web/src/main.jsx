import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

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

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
