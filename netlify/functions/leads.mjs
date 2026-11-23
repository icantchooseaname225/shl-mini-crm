const statuses = new Set(['New', 'Contacted', 'Converted'])
const fields = ['name', 'email', 'phone', 'business_name', 'status']
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const response = (statusCode, body, webRequest = false) => {
  const headers = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  const serialized = JSON.stringify(body)
  return webRequest
    ? new Response(statusCode === 204 ? null : serialized, { status: statusCode, headers })
    : { statusCode, headers, body: serialized }
}

function validate(input, { partial = false } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return 'Send lead details as a JSON object.'
  const keys = Object.keys(input)
  if (keys.some((key) => !fields.includes(key))) return 'The request contains an unsupported field.'
  if (!partial && fields.some((key) => !(key in input))) return 'Name, email, phone, business name, and status are required.'
  if (partial && keys.length === 0) return 'Add at least one field to update.'

  for (const key of keys) {
    const value = input[key]
    if (typeof value !== 'string') return `${key.replace('_', ' ')} must be text.`
    const trimmed = value.trim()
    if (!trimmed) return `${key.replace('_', ' ')} cannot be empty.`
    const max = key === 'name' ? 100 : key === 'email' ? 254 : key === 'phone' ? 30 : key === 'business_name' ? 120 : 20
    if (trimmed.length > max) return `${key.replace('_', ' ')} must be ${max} characters or fewer.`
    if (key === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Enter a valid email address.'
    if (key === 'phone') {
      const digits = trimmed.replace(/\D/g, '')
      if (!/^\+?[\d\s().-]+$/.test(trimmed) || digits.length < 7 || digits.length > 15) return 'Enter a phone number with 7 to 15 digits.'
    }
    if (key === 'status' && !statuses.has(trimmed)) return 'Status must be New, Contacted, or Converted.'
    input[key] = trimmed
  }
  return null
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Server configuration is incomplete. Add SUPABASE_URL and SUPABASE_SECRET_KEY.')
  return { endpoint: `${url.replace(/\/$/, '')}/rest/v1/leads`, key, isSecretKey: key.startsWith('sb_secret_') }
}

async function supabaseRequest(config, query, { method = 'GET', body } = {}) {
  const result = await fetch(`${config.endpoint}${query}`, {
    method,
    headers: {
      apikey: config.key,
      ...(!config.isSecretKey ? { authorization: `Bearer ${config.key}` } : {}),
      accept: 'application/json',
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(method !== 'GET' ? { prefer: 'return=representation' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const data = await result.json().catch(() => null)
  if (!result.ok) throw new Error(data?.message || `Supabase returned HTTP ${result.status}.`)
  return data
}

export default async (requestEvent) => {
  const webRequest = typeof requestEvent?.url === 'string' && typeof requestEvent?.method === 'string' && typeof requestEvent?.headers?.get === 'function'
  const method = String(requestEvent.httpMethod || requestEvent.method || 'GET').toUpperCase()
  const requestUrl = requestEvent.path || requestEvent.rawUrl || requestEvent.url || '/api/leads'
  const pathname = new URL(requestUrl, 'http://localhost').pathname
  const path = pathname.replace(/^\/api\/leads/, '').replace(/^\/\.netlify\/functions\/leads/, '')
  const id = path.split('/').filter(Boolean)[0]
  const requestBody = webRequest && !['GET', 'HEAD', 'OPTIONS'].includes(method)
    ? await requestEvent.text()
    : requestEvent.body

  if (!['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'].includes(method)) return response(405, { error: 'Method not allowed.' }, webRequest)
  if (method === 'OPTIONS') return response(204, null, webRequest)
  if (id && !uuidPattern.test(id)) return response(400, { error: 'Lead ID must be a valid UUID.' }, webRequest)

  try {
    const config = getSupabaseConfig()
    if (method === 'GET') {
      const data = await supabaseRequest(config, '?select=*&order=created_at.desc')
      return response(200, { leads: data }, webRequest)
    }

    if (method === 'POST') {
      let body
      try { body = JSON.parse(requestBody || '{}') } catch { return response(400, { error: 'Request body must be valid JSON.' }, webRequest) }
      const validationError = validate(body)
      if (validationError) return response(400, { error: validationError }, webRequest)
      const data = await supabaseRequest(config, '?select=*', { method: 'POST', body })
      if (!data?.[0]) throw new Error('Supabase did not return the created lead.')
      return response(201, { lead: data[0] }, webRequest)
    }

    if (!id) return response(400, { error: 'A lead ID is required for this request.' }, webRequest)
    if (method === 'PATCH') {
      let body
      try { body = JSON.parse(requestBody || '{}') } catch { return response(400, { error: 'Request body must be valid JSON.' }, webRequest) }
      const validationError = validate(body, { partial: true })
      if (validationError) return response(400, { error: validationError }, webRequest)
      const data = await supabaseRequest(config, `?id=eq.${id}&select=*`, { method: 'PATCH', body })
      if (!data?.[0]) return response(404, { error: 'That lead could not be found.' }, webRequest)
      return response(200, { lead: data[0] }, webRequest)
    }

    if (method === 'DELETE') {
      const data = await supabaseRequest(config, `?id=eq.${id}&select=id`, { method: 'DELETE' })
      if (!data?.[0]) return response(404, { error: 'That lead could not be found.' }, webRequest)
      return response(200, { deleted: true }, webRequest)
    }
  } catch (error) {
    console.error('Leads API error:', error.message)
    return response(500, { error: error.message.includes('Server configuration') ? error.message : 'The database request failed. Please try again.' }, webRequest)
  }
}
