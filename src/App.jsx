import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BriefcaseBusiness,
  Check,
  ChevronDown,
  CircleHelp,
  ContactRound,
  LayoutDashboard,
  LoaderCircle,
  Plus,
  Search,
  UsersRound,
  X,
} from 'lucide-react'
import { leadsApi } from './lib/api.js'
import LeadDialog from './components/LeadDialog.jsx'

const filters = ['All leads', 'New', 'Contacted', 'Converted']

function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function StatCard({ label, value, detail, icon: Icon, tone }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`} aria-hidden="true">
        <Icon size={18} strokeWidth={1.8} />
      </div>
      <p className="stat-label">{label}</p>
      <div className="stat-bottom">
        <strong>{value}</strong>
        <span>{detail}</span>
      </div>
    </article>
  )
}

function StatusSelect({ lead, onChange }) {
  return (
    <label className="status-select-wrap">
      <span className="sr-only">Change status for {lead.name}</span>
      <select
        className={`status-select ${lead.status.toLowerCase()}`}
        value={lead.status}
        onChange={(event) => onChange(lead, event.target.value)}
      >
        <option>New</option>
        <option>Contacted</option>
        <option>Converted</option>
      </select>
      <ChevronDown size={12} aria-hidden="true" />
    </label>
  )
}

function LeadRow({ lead, onEdit, onDelete, onStatus }) {
  return (
    <tr>
      <td>
        <div className="person-cell">
          <span className="avatar" aria-hidden="true">{getInitials(lead.name)}</span>
          <span className="person-name">{lead.name}</span>
        </div>
      </td>
      <td><a className="email-text" href={`mailto:${lead.email}`}>{lead.email}</a></td>
      <td><a className="phone-text" href={`tel:${lead.phone}`}>{lead.phone}</a></td>
      <td>{lead.business_name}</td>
      <td><StatusSelect lead={lead} onChange={onStatus} /></td>
      <td className="actions-cell">
        <div className="row-actions">
          <button className="text-action" type="button" onClick={() => onEdit(lead)}>
            Edit
          </button>
          <button className="text-action danger-text" type="button" onClick={() => onDelete(lead)}>
            Delete
          </button>
        </div>
      </td>
    </tr>
  )
}

function MobileLeadCard({ lead, onEdit, onDelete, onStatus }) {
  return (
    <article className="mobile-lead-card">
      <div className="mobile-card-top">
        <div className="person-cell">
          <span className="avatar" aria-hidden="true">{getInitials(lead.name)}</span>
          <span>
            <strong className="person-name">{lead.name}</strong>
            <small>{lead.business_name}</small>
          </span>
        </div>
        <StatusSelect lead={lead} onChange={onStatus} />
      </div>
      <a href={`mailto:${lead.email}`}>{lead.email}</a>
      <div className="mobile-card-bottom">
        <a href={`tel:${lead.phone}`}>{lead.phone}</a>
        <div>
          <button className="text-action" type="button" onClick={() => onEdit(lead)}>
            Edit
          </button>
          <button className="text-action danger-text" type="button" onClick={() => onDelete(lead)}>
            Delete
          </button>
        </div>
      </div>
    </article>
  )
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

  useEffect(() => {
    loadLeads()
  }, [loadLeads])

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

  const counts = {
    total: leads.length,
    new: leads.filter((lead) => lead.status === 'New').length,
    converted: leads.filter((lead) => lead.status === 'Converted').length,
  }
  const searchTerm = query.trim().toLocaleLowerCase()
  const visibleLeads = leads.filter((lead) => {
    const matchesStatus = filter === 'All leads' || lead.status === filter
    const matchesSearch = !searchTerm
      || lead.name.toLocaleLowerCase().includes(searchTerm)
      || lead.email.toLocaleLowerCase().includes(searchTerm)

    return matchesStatus && matchesSearch
  })

  function openNewLead() {
    setDialogLead(null)
    setDialogOpen(true)
  }

  function openEditLead(lead) {
    setDialogLead(lead)
    setDialogOpen(true)
  }

  function closeDialog() {
    if (!saving) setDialogOpen(false)
  }

  async function saveLead(payload) {
    setSaving(true)

    try {
      if (dialogLead) {
        const { lead } = await leadsApi.update(dialogLead.id, payload)
        setLeads((currentLeads) => currentLeads.map((item) => (item.id === lead.id ? lead : item)))
        setToast({ type: 'success', message: 'Lead updated successfully.' })
      } else {
        const { lead } = await leadsApi.create(payload)
        setLeads((currentLeads) => [lead, ...currentLeads])
        setToast({ type: 'success', message: 'Lead added successfully.' })
      }

      setDialogOpen(false)
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(lead, status) {
    try {
      const { lead: updatedLead } = await leadsApi.update(lead.id, { status })
      setLeads((currentLeads) => currentLeads.map((item) => (
        item.id === updatedLead.id ? updatedLead : item
      )))
      setToast({ type: 'success', message: `${lead.name}'s status changed to ${status}.` })
    } catch (error) {
      setToast({ type: 'error', message: error.message })
    }
  }

  async function deleteLead(lead) {
    if (!window.confirm(`Delete ${lead.name} from your leads? This cannot be undone.`)) return

    try {
      await leadsApi.remove(lead.id)
      setLeads((currentLeads) => currentLeads.filter((item) => item.id !== lead.id))
      setToast({ type: 'success', message: 'Lead deleted.' })
    } catch (error) {
      setToast({ type: 'error', message: error.message })
    }
  }

  function clearFilters() {
    setQuery('')
    setFilter('All leads')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="Mini CRM home">
          <span className="brand-mark"><BriefcaseBusiness size={18} /></span>
          <span className="brand-name">Mini CRM<small>Social House Learning</small></span>
        </a>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <a className="nav-link active" href="#dashboard">
            <LayoutDashboard size={17} />Overview
          </a>
          <a className="nav-link" href="#leads">
            <UsersRound size={17} />Leads<span className="nav-count">{counts.total}</span>
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="workspace-card">
            <span className="workspace-dot">S</span>
            <div>
              <strong>Social House Learning</strong>
              <span>Internship task 1</span>
            </div>
          </div>
          <span className="sidebar-note">A simple place to keep enquiries moving.</span>
        </div>
      </aside>

      <main id="top" className="main-content">
        <header className="topbar">
          <div className="breadcrumbs">Workspace <span>/</span> <strong>Overview</strong></div>
          <span className="project-pill">SHL Tech Internship</span>
        </header>

        <div className="page-wrap">
          <section id="dashboard" className="welcome-row">
            <div>
              <p className="eyebrow">SOCIAL HOUSE LEARNING</p>
              <h1>Lead dashboard</h1>
              <p className="subheading">See new enquiries, follow up, and keep track of conversions.</p>
            </div>
            <button className="button button-primary add-main" type="button" onClick={openNewLead}>
              <Plus size={17} />Add a lead
            </button>
          </section>

          <section className="stats-grid" aria-label="Lead overview">
            <StatCard label="Total leads" value={counts.total} detail="Across every status" icon={UsersRound} tone="blue" />
            <StatCard label="New leads" value={counts.new} detail="Ready for a first touch" icon={ContactRound} tone="amber" />
            <StatCard label="Converted" value={counts.converted} detail="Marked as successful" icon={Check} tone="green" />
          </section>

          <section id="leads" className="leads-panel">
            <div className="panel-heading">
              <div>
                <h2>Leads</h2>
                <p>Manage the enquiries your team is following up.</p>
              </div>
              <span className="lead-total">{counts.total} {counts.total === 1 ? 'lead' : 'leads'}</span>
            </div>

            <div className="toolbar">
              <div className="filter-tabs" role="group" aria-label="Filter leads by status">
                {filters.map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={filter === item}
                    className={`filter-tab ${filter === item ? 'selected' : ''}`}
                    onClick={() => setFilter(item)}
                  >
                    {item}
                    {item === 'All leads' && <span>{counts.total}</span>}
                  </button>
                ))}
              </div>

              <label className="search-box">
                <Search size={16} aria-hidden="true" />
                <span className="sr-only">Search by name or email</span>
                <input
                  ref={searchInput}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search leads…"
                />
                <kbd>Ctrl / ⌘ K</kbd>
                {query && (
                  <button type="button" aria-label="Clear search" onClick={() => setQuery('')}>
                    <X size={14} />
                  </button>
                )}
              </label>
            </div>

            {loadError ? (
              <div className="state-panel error-state">
                <div className="state-icon error"><CircleHelp size={20} /></div>
                <h3>We couldn’t load your leads</h3>
                <p>{loadError}</p>
                <button className="button button-muted" type="button" onClick={loadLeads}>Try again</button>
              </div>
            ) : loading ? (
              <div className="state-panel" role="status">
                <LoaderCircle size={24} className="spinner" />
                <p>Loading your leads…</p>
              </div>
            ) : visibleLeads.length === 0 ? (
              <div className="state-panel">
                <div className="state-icon"><BriefcaseBusiness size={20} /></div>
                <h3>{leads.length === 0 ? 'Start with your first enquiry' : 'No leads found'}</h3>
                <p>{leads.length === 0
                  ? 'Add a lead and your enquiry list will start to take shape.'
                  : 'Try another search or status filter.'}</p>
                {leads.length === 0 ? (
                  <button className="button button-primary" type="button" onClick={openNewLead}>
                    <Plus size={16} />Add your first lead
                  </button>
                ) : (
                  <button className="button button-muted" type="button" onClick={clearFilters}>
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="table-scroll">
                  <table className="leads-table">
                    <thead>
                      <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Email</th>
                        <th scope="col">Phone</th>
                        <th scope="col">Business</th>
                        <th scope="col">Status</th>
                        <th scope="col"><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleLeads.map((lead) => (
                        <LeadRow
                          key={lead.id}
                          lead={lead}
                          onEdit={openEditLead}
                          onDelete={deleteLead}
                          onStatus={updateStatus}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mobile-leads">
                  {visibleLeads.map((lead) => (
                    <MobileLeadCard
                      key={lead.id}
                      lead={lead}
                      onEdit={openEditLead}
                      onDelete={deleteLead}
                      onStatus={updateStatus}
                    />
                  ))}
                </div>

                <div className="table-footer">
                  <span>Showing <strong>{visibleLeads.length}</strong> of <strong>{leads.length}</strong> leads</span>
                  <span>Sorted by newest first</span>
                </div>
              </>
            )}
          </section>

          <footer className="page-footer">
            <span>Built for keeping good conversations moving.</span>
            <span>SHL Tech Internship Task 1</span>
          </footer>
        </div>
      </main>

      {dialogOpen && (
        <LeadDialog lead={dialogLead} onClose={closeDialog} onSave={saveLead} saving={saving} />
      )}
      {toast && (
        <div className={`toast ${toast.type}`} role="status">
          <span>{toast.type === 'success' ? <Check size={17} /> : <CircleHelp size={17} />}</span>
          {toast.message}
          <button type="button" aria-label="Dismiss notification" onClick={() => setToast(null)}>
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  )
}

export default App
