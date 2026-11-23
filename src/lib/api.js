const API_URL = '/api/leads'

async function request(path = '', options = {}) {
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.')
  }

  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || 'Something went wrong. Please try again.')
  return result
}

export const leadsApi = {
  list: () => request(),
  create: (lead) => request('', { method: 'POST', body: JSON.stringify(lead) }),
  update: (id, lead) => request(`/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(lead) }),
  remove: (id) => request(`/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
