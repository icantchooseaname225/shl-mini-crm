import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import handler from '../netlify/functions/leads.mjs'

const initialRows = [
  { id: '11111111-1111-4111-8111-111111111111', name: 'Jamie Morgan', email: 'jamie@example.test', phone: '+1 202-555-0101', business_name: 'Northstar Studio', status: 'New', created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' },
  { id: '22222222-2222-4222-8222-222222222222', name: 'Taylor Reed', email: 'taylor@example.test', phone: '+1 202-555-0102', business_name: 'Moss & Maple Goods', status: 'Contacted', created_at: '2025-12-31T00:00:00.000Z', updated_at: '2025-12-31T00:00:00.000Z' },
]
let rows = []
let nextId = 3
let originalFetch
let originalUrl
let originalKey
let originalSecretKey
let capturedHeaders = {}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })
}

function eqId(url) {
  return url.searchParams.get('id')?.replace(/^eq\./, '')
}

async function call(method, path = '/api/leads', body) {
  const result = await handler({
    httpMethod: method,
    path,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: result.statusCode, body: JSON.parse(result.body) }
}

before(() => {
  originalFetch = globalThis.fetch
  originalUrl = process.env.SUPABASE_URL
  originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  originalSecretKey = process.env.SUPABASE_SECRET_KEY
  process.env.SUPABASE_URL = 'https://crm-test.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'unit-test-only-key'
  delete process.env.SUPABASE_SECRET_KEY
  rows = structuredClone(initialRows)
  globalThis.fetch = async (input, options = {}) => {
    const url = new URL(input)
    const method = options.method || 'GET'
    const id = eqId(url)
    capturedHeaders = options.headers || {}

    if (url.pathname !== '/rest/v1/leads') return jsonResponse({ message: 'not found' }, 404)
    if (method === 'GET') return jsonResponse([...rows].sort((a, b) => b.created_at.localeCompare(a.created_at)))
    if (method === 'POST') {
      const now = new Date().toISOString()
      const lead = { ...JSON.parse(options.body), id: `33333333-3333-4333-8333-${String(nextId++).padStart(12, '0')}`, created_at: now, updated_at: now }
      rows.unshift(lead)
      return jsonResponse([lead], 201)
    }
    if (method === 'PATCH') {
      const lead = rows.find((item) => item.id === id)
      if (!lead) return jsonResponse([])
      Object.assign(lead, JSON.parse(options.body), { updated_at: new Date().toISOString() })
      return jsonResponse([lead])
    }
    if (method === 'DELETE') {
      const index = rows.findIndex((item) => item.id === id)
      if (index < 0) return jsonResponse([])
      const [deleted] = rows.splice(index, 1)
      return jsonResponse([{ id: deleted.id }])
    }
    return jsonResponse({ message: 'unsupported method' }, 405)
  }
})

after(() => {
  globalThis.fetch = originalFetch
  if (originalUrl === undefined) delete process.env.SUPABASE_URL
  else process.env.SUPABASE_URL = originalUrl
  if (originalKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY
  else process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey
  if (originalSecretKey === undefined) delete process.env.SUPABASE_SECRET_KEY
  else process.env.SUPABASE_SECRET_KEY = originalSecretKey
})

test('lead API validates input and completes a CRUD flow against a mocked Supabase HTTP API', async (t) => {
  await t.test('lists database records', async () => {
    const result = await call('GET')
    assert.equal(result.status, 200)
    assert.equal(result.body.leads.length, 2)
    assert.equal(result.body.leads[0].name, 'Jamie Morgan')
    assert.equal(capturedHeaders.authorization, 'Bearer unit-test-only-key')
  })

  await t.test('rejects missing, malformed, and unsupported values', async () => {
    assert.equal((await call('POST', '/api/leads', { name: 'Jamie' })).status, 400)
    assert.match((await call('POST', '/api/leads', { name: 'Jamie', email: 'bad', phone: '1234567', business_name: 'Studio', status: 'New' })).body.error, /valid email/i)
    assert.match((await call('POST', '/api/leads', { name: 'Jamie', email: 'jamie@example.test', phone: '123', business_name: 'Studio', status: 'New' })).body.error, /phone number/i)
    assert.match((await call('PATCH', `/api/leads/${initialRows[0].id}`, { status: 'Archived' })).body.error, /status must/i)
    assert.equal((await call('DELETE', '/api/leads/not-a-uuid')).status, 400)
  })

  await t.test('creates, updates status, deletes, and persists across list requests', async () => {
    const created = await call('POST', '/api/leads', { name: 'Avery Chen', email: 'avery@example.test', phone: '+1 202-555-0103', business_name: 'Brightline Events', status: 'New' })
    assert.equal(created.status, 201)
    assert.equal(rows.length, 3)

    const updated = await call('PATCH', `/api/leads/${created.body.lead.id}`, { status: 'Converted' })
    assert.equal(updated.status, 200)
    assert.equal(updated.body.lead.status, 'Converted')
    assert.equal((await call('GET')).body.leads[0].status, 'Converted')

    const removed = await call('DELETE', `/api/leads/${created.body.lead.id}`)
    assert.equal(removed.status, 200)
    assert.equal(rows.length, 2)
    assert.equal((await call('GET')).body.leads.length, 2)
  })
})

test('supports Netlify Request and Response calls through a mocked Supabase HTTP API', async () => {
  const base = 'https://crm.local/api/leads'
  const legacyKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  process.env.SUPABASE_SECRET_KEY = 'sb_secret_unit_test'
  delete process.env.SUPABASE_SERVICE_ROLE_KEY

  const listResponse = await handler(new Request(base))
  assert.ok(listResponse instanceof Response)
  assert.equal(listResponse.status, 200)
  assert.equal((await listResponse.json()).leads.length, 2)
  assert.equal(capturedHeaders.apikey, 'sb_secret_unit_test')
  assert.equal(capturedHeaders.authorization, undefined)

  const createdResponse = await handler(new Request(base, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Casey Rivera', email: 'casey@example.test', phone: '+1 202-555-0199', business_name: 'Harborlight Studio', status: 'New' }),
  }))
  assert.equal(createdResponse.status, 201)
  const { lead } = await createdResponse.json()

  const updatedResponse = await handler(new Request(`${base}/${lead.id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status: 'Contacted' }),
  }))
  assert.equal((await updatedResponse.json()).lead.status, 'Contacted')

  const deletedResponse = await handler(new Request(`${base}/${lead.id}`, { method: 'DELETE' }))
  assert.equal(deletedResponse.status, 200)
  assert.deepEqual(await deletedResponse.json(), { deleted: true })

  delete process.env.SUPABASE_SECRET_KEY
  if (legacyKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY
  else process.env.SUPABASE_SERVICE_ROLE_KEY = legacyKey
})
