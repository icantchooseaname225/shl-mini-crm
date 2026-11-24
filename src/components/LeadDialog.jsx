import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const emptyLead = {
  name: '',
  email: '',
  phone: '',
  business_name: '',
  status: 'New',
}

export default function LeadDialog({ lead, onClose, onSave, saving }) {
  const [form, setForm] = useState(lead ? { ...lead } : emptyLead)
  const [error, setError] = useState('')

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !saving) onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, saving])

  function updateField(field, value) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }))
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const payload = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value.trim()]),
    )

    if (!payload.name || !payload.email || !payload.phone || !payload.business_name) {
      setError('Please fill in every field before saving.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      setError('Enter an email address in the format name@example.com.')
      return
    }

    const phoneDigits = payload.phone.replace(/\D/g, '')
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
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
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose()
      }}
    >
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div className="dialog-head">
          <div>
            <p className="eyebrow">LEAD DETAILS</p>
            <h2 id="dialog-title">{lead ? 'Edit lead' : 'Add a new lead'}</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Close form"
            onClick={onClose}
            disabled={saving}
          >
            <X size={19} />
          </button>
        </div>

        <form
          className="lead-form"
          noValidate
          onSubmit={handleSubmit}
          aria-describedby={error ? 'lead-form-error' : undefined}
        >
          <label>
            Full name
            <input
              autoFocus
              autoComplete="name"
              maxLength={100}
              placeholder="e.g. Jamie Morgan"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
            />
          </label>

          <label>
            Email address
            <input
              type="email"
              autoComplete="email"
              maxLength={254}
              placeholder="jamie@example.com"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
            />
          </label>

          <label>
            Phone number
            <input
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              maxLength={30}
              placeholder="+1 555 010 0101"
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value)}
            />
          </label>

          <label>
            Business name
            <input
              autoComplete="organization"
              maxLength={120}
              placeholder="e.g. Northstar Studio"
              value={form.business_name}
              onChange={(event) => updateField('business_name', event.target.value)}
            />
          </label>

          <label>
            Status
            <select value={form.status} onChange={(event) => updateField('status', event.target.value)}>
              <option>New</option>
              <option>Contacted</option>
              <option>Converted</option>
            </select>
          </label>

          {error && <p id="lead-form-error" className="form-error" role="alert">{error}</p>}

          <div className="dialog-actions">
            <button className="button button-muted" type="button" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button className="button button-primary" type="submit" disabled={saving}>
              {saving ? 'Saving…' : lead ? 'Save changes' : 'Add lead'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
