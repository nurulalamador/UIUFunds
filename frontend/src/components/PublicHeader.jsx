import { Link, NavLink } from 'react-router-dom'
import { Moon, Search } from 'lucide-react'
import Brand from './Brand'

export default function PublicHeader() {
  return (
    <header className="public-header">
      <Brand />
      <nav className="public-nav">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/about">About Us</NavLink>
      </nav>
      <div className="public-actions">
        {/* <button className="icon-button soft" type="button" aria-label="Theme"><Moon size={17} /></button>
        <button className="icon-button plain" type="button" aria-label="Search"><Search size={17} /></button> */}
        <Link className="button primary" to="/signup">Get Started</Link>
      </div>
      
    </header>
  )
}
