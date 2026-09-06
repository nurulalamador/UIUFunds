import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { EmptyState, LoadingBlock, StatCard } from '../components/UI'
import { useAuth } from '../contexts/AuthContext'
import { money, pct } from '../utils/format'

function campaignImage(c, index) {
  const name = (c?.name || '').toLowerCase()
  if (name.includes('cancer')) return '/assets/cancer.jpg'
  if (name.includes('winter')) return '/assets/winter.jpg'
  return index % 2 ? '/assets/cancer.jpg' : '/assets/flood.jpg'
}

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState({ transactions: [], loans: [], borrowed: [], provided: [], crowdfundings: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      api('/transactions?limit=100'),
      api('/loans/mine/requests'),
      api('/loans/mine/borrowed'),
      api('/loans/mine/provided'),
      api('/crowdfundings'),
    ]).then(([tx, loans, borrowed, provided, crowd]) => {
      setData({
        transactions: tx.status === 'fulfilled' ? tx.value.transactions || [] : [],
        loans: loans.status === 'fulfilled' ? loans.value.loans || [] : [],
        borrowed: borrowed.status === 'fulfilled' ? borrowed.value.provided_loans || [] : [],
        provided: provided.status === 'fulfilled' ? provided.value.provided_loans || [] : [],
        crowdfundings: crowd.status === 'fulfilled' ? crowd.value.crowdfundings || [] : [],
      })
    }).finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => {
    const donation = data.transactions.filter(t => t.transaction_type === 'crowdfunding_donation').reduce((a, t) => a + Number(t.amount || 0), 0)
    const received = data.borrowed.reduce((a, l) => a + Number(l.principal_amount || 0), 0)
    const provided = data.provided.reduce((a, l) => a + Number(l.principal_amount || 0), 0)
    return { donation, received, provided }
  }, [data])

  if (loading) return <LoadingBlock text="Loading dashboard..." />

  return <div className="content-container">
    <div className="dashboard-welcome-grid">
      <div className="welcome-card"><span>Welcome Back</span><h2>{user?.name || 'UIU Student'}!</h2></div>
      <div className="balance-card"><div><span>Current Balance</span><strong>{money(user?.balance)}</strong></div><Link to="/app/transactions" className="button primary">Add Balance</Link></div>
    </div>
    <div className="stats-grid four">
      <StatCard label="Total Donations" value={money(stats.donation)} />
      <StatCard label="Total Loan Received" value={money(stats.received)} />
      <StatCard label="Total Loan Provided" value={money(stats.provided)} />
      <StatCard label="Overall Points" value={`★ ${Math.round((stats.donation + stats.provided) / 200 || 0)}`} />
    </div>

    <div className="dashboard-columns">
      <section>
        <div className="section-row"><h2>Current Crowdfundings</h2><Link to="/app/crowdfundings">See All Crowdfundings <ArrowRight size={15} /></Link></div>
        {data.crowdfundings.length ? <div className="campaign-list compact">
          {data.crowdfundings.slice(0, 2).map((c, i) => <article className="campaign-card" key={c.id}>
            <img src={campaignImage(c, i)} alt="" />
            <div className="campaign-body"><div className="campaign-title-row"><h3>{c.name}</h3><Link className="button primary small" to="/app/crowdfundings">Donate</Link></div>
              <p>{c.description}</p>
              <div className="campaign-meta"><span>Maintaining By</span><strong>{c.poster_name}</strong></div>
              <div className="fund-row"><div><small>Donation Received</small><b>{money(c.raised_amount)}</b></div><div className="right"><small>Fund Goal</small><b>{money(c.target_amount)}</b></div></div>
              <div className="progress"><span style={{ width: `${pct(c.raised_amount, c.target_amount)}%` }} /></div>
            </div>
          </article>)}
        </div> : <EmptyState title="No active crowdfunding" text="Approved crowdfunding campaigns will appear here." action={<Link className="button primary" to="/app/crowdfundings/new"><Plus size={16}/> Create Campaign</Link>} />}
      </section>
      <aside className="leaderboard">
        <div className="section-row"><h2>Leaderboard</h2><span className="tiny-tag">This Month</span></div>
        {[['Nahin Intesher',350],['Moqbul Alam',230],['Nurul Alam Ador',160],['Ali Arman Joyed',150],['Shadhin Nandi',150]].map(([name, points], i) => <div className="leader-row" key={name}><b>{i+1}</b><img src="/assets/avatar.jpg" alt="" /><div><strong>{name}</strong><span>View Profile</span></div><em>★ {points}</em></div>)}
      </aside>
    </div>
  </div>
}
