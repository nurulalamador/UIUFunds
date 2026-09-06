import { Link } from 'react-router-dom'

export default function Brand({ to = '/' }) {
  return (
    <Link className="brand" to={to} aria-label="UIUFund home">
      <span className="brand-uiu">UIU</span><span className="brand-fund">Fund</span>
    </Link>
  )
}
