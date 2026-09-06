import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { Alert, EmptyState, LoadingBlock, PageTitle } from '../components/UI'

export default function LoanOffers(){
  const {loanId}=useParams(); const navigate=useNavigate(); const [offers,setOffers]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(''); const [busy,setBusy]=useState(null)
  const load=()=>api(`/loans/${loanId}/offers`).then(d=>setOffers(d.offers||[])).catch(e=>setError(e.message)).finally(()=>setLoading(false))
  useEffect(()=>{load()},[loanId])
  const accept=async(id)=>{if(!window.confirm('Accept this offer? The loan will be funded immediately from the provider wallet.'))return;setBusy(id);setError('');try{await api(`/loans/offers/${id}/accept`,{method:'PATCH'});navigate('/app/my-loans')}catch(e){setError(e.message)}finally{setBusy(null)}}
  if(loading)return <LoadingBlock text="Loading offers..."/>
  return <><PageTitle title="Provided Offers" back={<button className="icon-button plain" onClick={()=>navigate(-1)}><ArrowLeft/></button>}/><Alert>{error}</Alert>{offers.length?<div className="offer-list">{offers.map((o,i)=><div className="offer-list-row" key={o.id}><b className="offer-rank">{i+1}.</b><img src="/assets/avatar.jpg" alt=""/><div className="offer-person"><strong>{o.offeror_name}</strong><span>View Profile →</span></div><div className="offer-meta"><small>Interest Rate</small><strong>{o.interest_rate}%</strong></div><div className="offer-meta"><small>Proposed Duration</small><strong>{o.asked_duration_months} Months</strong></div><button className="button primary" disabled={busy===o.id||o.status!=='pending'} onClick={()=>accept(o.id)}>{o.status==='pending'?(busy===o.id?'Accepting...':'Accept'):o.status}</button></div>)}</div>:<EmptyState title="No offers yet" text="Loan offers will be shown here when another user sends one."/>}</>
}
