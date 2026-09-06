import { AlertCircle, CheckCircle2, Inbox } from 'lucide-react'

export function PageTitle({ title, back, children }) {
  return (
    <div className="page-title-row">
      <div className="page-title-left">
        {back}
        <h1>{title}</h1>
      </div>
      {children && <div className="page-title-actions">{children}</div>}
    </div>
  )
}

export function StatCard({ label, value, tone = 'orange' }) {
  return (
    <div className={`stat-card ${tone}`}>
      <div className='stat-card-title'>{label}</div>
      <div className='stat-card-count'>{value}</div>
    </div>
  )
}

export function EmptyState({ title = 'Nothing here yet', text = 'Data will appear here when available.', action }) {
  return (
    <div className="empty-state">
      <Inbox size={38} />
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  )
}

export function Alert({ type = 'error', children }) {
  if (!children) return null
  return (
    <div className={`alert ${type}`}>
      {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      <span>{children}</span>
    </div>
  )
}

export function LoadingBlock({ text = 'Loading...' }) {
  return <div className="loading-block"><span className="spinner" />{text}</div>
}

export function Badge({ children, tone = 'orange' }) {
  return <span className={`badge ${tone}`}>{children}</span>
}
