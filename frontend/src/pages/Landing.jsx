import { ArrowRight, HandCoins, HeartHandshake, ShieldCheck, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import PublicHeader from '../components/PublicHeader'

export default function Landing() {
  return (
    <div className="public-page">
      <PublicHeader />
      <section className="hero">
        <div className="hero-copy">
          <p className="hero-kicker">Welcome to</p>
          <h1><strong>UIU</strong><em>Fund</em></h1>
          <p className="hero-subtitle">Crowdfunding and Loans<br />Platform for UIU Students</p>
          <div className="hero-buttons">
            <Link className="button light" to="/signup">Get Started</Link>
            <Link className="button outline-light" to="/login">Sign In</Link>
          </div>
        </div>
      </section>

      <section className="public-section" id="services">
        <div className="section-heading">
          <span>OUR SERVICES</span>
          <h2>Financial help, built around the UIU community</h2>
          <p>Request a loan, fund someone directly, raise an approved crowdfunding campaign, or share a problem with the community.</p>
        </div>
        <div className="service-grid">
          <div className="service-card"><HandCoins /><h3>Student Loans</h3><p>Post a loan request without admin approval and receive offers from other users.</p></div>
          <div className="service-card"><HeartHandshake /><h3>Crowdfunding</h3><p>Create a transparent campaign, collect donations, and report where funds were spent.</p></div>
          <div className="service-card"><UsersRound /><h3>Community Feed</h3><p>Share problems, react, comment, and connect people who can help.</p></div>
          <div className="service-card"><ShieldCheck /><h3>Transparent Ledger</h3><p>Track wallet movements, repayments, donations, and financial history in one place.</p></div>
        </div>
      </section>

      <section className="public-cta" id="contact">
        <div><span>UIU COMMUNITY</span><h2>Ready to join UIUFund?</h2><p>Create your account and start using the platform.</p></div>
        <Link to="/signup" className="button primary large">Create Account <ArrowRight size={18} /></Link>
      </section>
    </div>
  )
}
