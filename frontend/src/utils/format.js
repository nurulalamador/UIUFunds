export function money(value = 0) {
  const n = Number(value || 0)
  return `৳${new Intl.NumberFormat('en-BD', { maximumFractionDigits: 2 }).format(n)}`
}

export function shortDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

export function timeAgo(value) {
  if (!value) return ''
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return shortDate(value)
}

export function pct(current, target) {
  if (!Number(target)) return 0
  return Math.min(100, Math.max(0, (Number(current || 0) / Number(target)) * 100))
}
