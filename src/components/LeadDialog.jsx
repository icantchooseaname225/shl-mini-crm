import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const emptyLead = { name: '', email: '', phone: '', business_name: '', status: 'New' }

export default function LeadDialog({ lead, onClose, onSave, saving }) {
  const [form, setForm] = useState(lead ? { ...lead } : emptyLead)
  const [error, setError] = useState('')

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape' && !saving) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, saving])

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setError('')
  }

  async function submit(event) {
    event.preventDefault()
    const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()]))
    if (!payload.name || !payload.email || !payload.phone || !payload.business_name) {
      setError('Please fill in every field before saving.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      setError('Enter an email address in the format name@example.com.')
      return
    }
    const digits = payload.phone.replace(/\D/g, '')
    if (digits.length < 7 || digits.length > 15) {
      setError('Enter a phone number with 7 to 15 digits.')
      return
    }
    try {
      await onSave(payload)
    } catch (saveError) {
      setError(saveError.message)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !saving && onClose()}>
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div className="dialog-head">
          <div>
            <p className="eyebrow">LEAD DETAILS</p>
            <h2 id="dialog-title">{lead ? 'Edit lead' : 'Add a new lead'}</h2>
          </div>
          <button className="icon-button" type="button" aria-label="Close form" onClick={onClose} disabled={saving}><X size={19} /></button>
        </div>
        <form onSubmit={submit} noValidate className="lead-form">
          <label>Full name<input autoFocus value={form.name} onChange={(e) => update('name', e.target.value)} maxLength={100} placeholder="e.g. Jamie Morgan" /></label>
          <label>Email address<input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} maxLength={254} placeholder="jamie@example.com" /></label>
          <label>Phone number<input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} maxLength={30} placeholder="+1 555 010 0101" /></label>
          <label>Business name<input value={form.business_name} onChange={(e) => update('business_name', e.target.value)} maxLength={120} placeholder="e.g. Northstar Studio" /></label>
          <label>Status
            <select value={form.status} onChange={(e) => update('status', e.target.value)}>
              <option>New</option><option>Contacted</option><option>Converted</option>
            </select>
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="dialog-actions">
            <button className="button button-muted" type="button" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : lead ? 'Save changes' : 'Add lead'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
