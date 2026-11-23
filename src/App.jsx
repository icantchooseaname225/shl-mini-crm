import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BriefcaseBusiness, Check, ChevronDown, CircleHelp, ContactRound, LayoutDashboard, LoaderCircle, MoreHorizontal, Plus, Search, UsersRound, X } from 'lucide-react'
import { leadsApi } from './lib/api.js'
import LeadDialog from './components/LeadDialog.jsx'

const filters = ['All leads', 'New', 'Contacted', 'Converted']
const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')

function StatCard({ label, value, detail, icon: Icon, tone }) {
  return <article className="stat-card">
    <div className={`stat-icon ${tone}`}><Icon size={18} strokeWidth={1.8} /></div>
    <p className="stat-label">{label}</p>
    <div className="stat-bottom"><strong>{value}</strong><span>{detail}</span></div>
  </article>
}

function StatusBadge({ status }) {
  return <span className={`status-badge ${status.toLowerCase()}`}><i />{status}</span>
}

function LeadRow({ lead, onEdit, onDelete, onStatus }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return <tr>
    <td><div className="person-cell"><span className="avatar">{initials(lead.name)}</span><span className="person-name">{lead.name}</span></div></td>
    <td><span className="email-text">{lead.email}</span></td>
    <td>{lead.phone}</td>
    <td>{lead.business_name}</td>
    <td><label className="status-select-wrap"><span className="sr-only">Change status for {lead.name}</span><select className={`status-select ${lead.status.toLowerCase()}`} value={lead.status} onChange={(event) => onStatus(lead, event.target.value)}><option>New</option><option>Contacted</option><option>Converted</option></select><ChevronDown size={12} /></label></td>
    <td className="actions-cell"><div className="row-actions">
      <button className="text-action" onClick={() => onEdit(lead)}>Edit</button>
      <div className="more-wrap"><button className="icon-button small" aria-label={`More actions for ${lead.name}`} onClick={() => setMenuOpen((open) => !open)}><MoreHorizontal size={18} /></button>
        {menuOpen && <div className="row-menu"><button onClick={() => { setMenuOpen(false); onDelete(lead) }}>Delete lead</button></div>}
      </div>
    </div></td>
  </tr>
}

function App() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All leads')
  const [dialogLead, setDialogLead] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const searchInput = useRef(null)

  const loadLeads = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const data = await leadsApi.list()
      setLeads(data.leads)
    } catch (error) {
      setLoadError(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadLeads() }, [loadLeads])
  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(null), 3500)
    return () => window.clearTimeout(timer)
  }, [toast])
  useEffect(() => {
    function focusSearch(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchInput.current?.focus()
      }
    }
    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  const counts = useMemo(() => ({ total: leads.length, new: leads.filter((lead) => lead.status === 'New').length, converted: leads.filter((lead) => lead.status === 'Converted').length }), [leads])
  const visibleLeads = useMemo(() => {
    const term = query.trim().toLocaleLowerCase()
    return leads.filter((lead) => (filter === 'All leads' || lead.status === filter) && (!term || lead.name.toLocaleLowerCase().includes(term) || lead.email.toLocaleLowerCase().includes(term)))
  }, [leads, query, filter])

  function openNew() { setDialogLead(null); setDialogOpen(true) }
  function openEdit(lead) { setDialogLead(lead); setDialogOpen(true) }

  async function saveLead(payload) {
    setSaving(true)
    try {
      if (dialogLead) {
        const { lead } = await leadsApi.update(dialogLead.id, payload)
        setLeads((existing) => existing.map((item) => item.id === lead.id ? lead : item))
        setToast({ type: 'success', message: 'Lead updated successfully.' })
      } else {
        const { lead } = await leadsApi.create(payload)
        setLeads((existing) => [lead, ...existing])
        setToast({ type: 'success', message: 'Lead added successfully.' })
      }
      setDialogOpen(false)
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(lead, status) {
    try {
      const { lead: updated } = await leadsApi.update(lead.id, { status })
      setLeads((existing) => existing.map((item) => item.id === updated.id ? updated : item))
      setToast({ type: 'success', message: `${lead.name}'s status changed to ${status}.` })
    } catch (error) {
      setToast({ type: 'error', message: error.message })
    }
  }

  async function deleteLead(lead) {
    if (!window.confirm(`Delete ${lead.name} from your leads? This cannot be undone.`)) return
    try {
      await leadsApi.remove(lead.id)
      setLeads((existing) => existing.filter((item) => item.id !== lead.id))
      setToast({ type: 'success', message: 'Lead deleted.' })
    } catch (error) {
      setToast({ type: 'error', message: error.message })
    }
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#top" aria-label="Mini CRM home"><span className="brand-mark"><ContactRound size={18} /></span><span>little<span className="brand-light">desk</span><small>MINI CRM</small></span></a>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="side-nav" aria-label="Main navigation"><a className="nav-link active" href="#dashboard"><LayoutDashboard size={17} />Overview</a><a className="nav-link" href="#leads"><UsersRound size={17} />Leads<span className="nav-count">{counts.total}</span></a></nav>
      <div className="sidebar-bottom"><div className="workspace-card"><div className="workspace-dot">S</div><div><strong>Social House</strong><span>Internship workspace</span></div><ChevronDown size={15} /></div><a className="help-link" href="mailto:hello@example.test"><CircleHelp size={16} />Help & feedback</a></div>
    </aside>

    <main id="top" className="main-content">
      <header className="topbar"><div className="breadcrumbs">Workspace <span>/</span> <strong>Overview</strong></div><div className="topbar-right"><span className="demo-pill"><i />Demo workspace</span><span className="top-avatar">JD</span></div></header>
      <div className="page-wrap">
        <section id="dashboard" className="welcome-row"><div><p className="eyebrow">MONDAY, YOUR LEADS AT A GLANCE</p><h1>Good to see you <span>👋</span></h1><p className="subheading">A little overview of what’s happening with your enquiries.</p></div><button className="button button-primary add-main" onClick={openNew}><Plus size={17} /> Add a lead</button></section>

        <section className="stats-grid" aria-label="Lead overview">
          <StatCard label="Total leads" value={counts.total} detail="all time" icon={UsersRound} tone="blue" />
          <StatCard label="New leads" value={counts.new} detail="need a first touch" icon={ContactRound} tone="amber" />
          <StatCard label="Converted" value={counts.converted} detail="great work" icon={Check} tone="green" />
        </section>

        <section id="leads" className="leads-panel">
          <div className="panel-heading"><div><h2>Your leads</h2><p>Keep every conversation moving forward.</p></div><span className="lead-total">{counts.total} {counts.total === 1 ? 'lead' : 'leads'}</span></div>
          <div className="toolbar"><div className="filter-tabs" role="tablist" aria-label="Filter by status">{filters.map((item) => <button key={item} role="tab" aria-selected={filter === item} className={`filter-tab ${filter === item ? 'selected' : ''}`} onClick={() => setFilter(item)}>{item}{item === 'All leads' && <span>{counts.total}</span>}</button>)}</div><label className="search-box"><Search size={16} /><span className="sr-only">Search by name or email</span><input ref={searchInput} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search leads…" /><kbd>Ctrl K</kbd>{query && <button aria-label="Clear search" onClick={() => setQuery('')}><X size={14} /></button>}</label></div>

          {loadError ? <div className="state-panel error-state"><div className="state-icon error"><CircleHelp size={20} /></div><h3>We couldn’t load your leads</h3><p>{loadError}</p><button className="button button-muted" onClick={loadLeads}>Try again</button></div> : loading ? <div className="state-panel"><LoaderCircle size={24} className="spinner" /><p>Loading your leads…</p></div> : visibleLeads.length === 0 ? <div className="state-panel"><div className="state-icon"><BriefcaseBusiness size={20} /></div><h3>{leads.length === 0 ? 'A fresh start' : 'No leads found'}</h3><p>{leads.length === 0 ? 'Add your first enquiry to start building your list.' : 'Try a different search or status filter.'}</p>{leads.length === 0 ? <button className="button button-primary" onClick={openNew}><Plus size={16} /> Add your first lead</button> : <button className="button button-muted" onClick={() => { setQuery(''); setFilter('All leads') }}>Clear filters</button>}</div> : <>
            <div className="table-scroll"><table className="leads-table"><thead><tr><th>NAME</th><th>EMAIL ADDRESS</th><th>PHONE</th><th>BUSINESS</th><th>STATUS</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visibleLeads.map((lead) => <LeadRow key={lead.id} lead={lead} onEdit={openEdit} onDelete={deleteLead} onStatus={updateStatus} />)}</tbody></table></div>
            <div className="mobile-leads">{visibleLeads.map((lead) => <article key={lead.id} className="mobile-lead-card"><div className="mobile-card-top"><div className="person-cell"><span className="avatar">{initials(lead.name)}</span><span><strong className="person-name">{lead.name}</strong><small>{lead.business_name}</small></span></div><StatusBadge status={lead.status} /></div><a href={`mailto:${lead.email}`}>{lead.email}</a><div className="mobile-card-bottom"><a href={`tel:${lead.phone}`}>{lead.phone}</a><div><button className="text-action" onClick={() => openEdit(lead)}>Edit</button><button className="text-action danger-text" onClick={() => deleteLead(lead)}>Delete</button></div></div></article>)}</div>
            <div className="table-footer"><span>Showing <strong>{visibleLeads.length}</strong> of <strong>{leads.length}</strong> leads</span><span className="footer-note"><span className="online-dot" /> Up to date</span></div>
          </>}
        </section>
        <footer className="page-footer"><span>Made for keeping good conversations going.</span><span>Mini CRM <b>·</b> SHL Tech Internship</span></footer>
      </div>
    </main>

    {dialogOpen && <LeadDialog lead={dialogLead} onClose={() => !saving && setDialogOpen(false)} onSave={saveLead} saving={saving} />}
    {toast && <div className={`toast ${toast.type}`} role="status"><span>{toast.type === 'success' ? <Check size={17} /> : <CircleHelp size={17} />}</span>{toast.message}<button aria-label="Dismiss notification" onClick={() => setToast(null)}><X size={15} /></button></div>}
  </div>
}

export default App
