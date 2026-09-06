import { API_URL } from '../config'

function getToken() {
  return localStorage.getItem('uiufund_token')
}

export async function api(path, options = {}) {
  const token = getToken()
  const headers = new Headers(options.headers || {})
  const isFormData = options.body instanceof FormData

  if (!isFormData && options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('uiufund_token')
      localStorage.removeItem('uiufund_user')
    }
    const error = new Error(payload?.message || payload || `Request failed (${response.status})`)
    error.status = response.status
    error.payload = payload
    throw error
  }

  return payload
}

export function jsonBody(data) {
  return JSON.stringify(data)
}

export async function fetchBlob(path) {
  const token = getToken()
  const response = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) throw new Error('Unable to load file')
  return response.blob()
}
