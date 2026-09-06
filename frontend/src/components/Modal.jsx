import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function Modal({ open, title, children, onClose, width = 620 }) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" style={{ maxWidth: width }}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-button" onClick={onClose}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
