import { useEffect, useState } from 'react'
import { ArrowLeft, Download } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, fetchBlob } from '../api/client'
import { Alert, LoadingBlock, PageTitle } from '../components/UI'
import { money, pct } from '../utils/format'

function img(c){return(c?.name||'').toLowerCase().includes('cancer')?'/assets/cancer.jpg':'/assets/history-flood.jpg'}
export default function SpentHistory(){
 const{id}=useParams();const navigate=useNavigate();const[data,setData]=useState(null);const[error,setError]=useState('')
 useEffect(()=>{api(`/crowdfundings/${id}`).then(setData).catch(e=>setError(e.message))},[id])
 const proof=async(item)=>{try{const blob=await fetchBlob(`/crowdfundings/spend/${item.id}/proof`);const url=URL.createObjectURL(blob);window.open(url,'_blank');setTimeout(()=>URL.revokeObjectURL(url),10000)}catch(e){setError(e.message)}}
 if(!data&&!error)return <LoadingBlock text="Loading spent history..."/>
 const c=data?.crowdfunding;const items=data?.spend_items||[];const total=items.reduce((s,x)=>s+Number(x.total_amount||0),0)
 return <><PageTitle title="Spent History" back={<button className="icon-button plain" onClick={()=>navigate(-1)}><ArrowLeft/></button>}/><Alert>{error}</Alert>{c&&<div className="campaign-hero-card"><img src={img(c)} alt=""/><div><h2>{c.name}</h2><p>{c.description}</p><div className="campaign-meta"><span>Total Donor</span><strong>{data.donations?.length||0}</strong></div><div className="fund-row"><div><small>Donation Received</small><b>{money(c.raised_amount)}</b></div><div className="right"><small>Fund Goal</small><b>{money(c.target_amount)}</b></div></div><div className="progress"><span style={{width:`${pct(c.raised_amount,c.target_amount)}%`}}/></div></div></div>}
 <div className="table-card"><div className="table-scroll"><table><thead><tr><th>SL</th><th>Item Name</th><th>Price Per Unit</th><th>Quantity</th><th>Proof Type</th><th>Proof</th><th>Final Price</th></tr></thead><tbody>{items.map((x,i)=><tr key={x.id}><td>{i+1}</td><td>{x.name}</td><td>{money(x.price_per_unit)}</td><td>{x.quantity}</td><td>{x.proof_type||'—'}</td><td>{x.has_proof?<button className="text-button" onClick={()=>proof(x)}><Download size={14}/>Download</button>:'—'}</td><td>{money(x.total_amount)}</td></tr>)}</tbody><tfoot><tr><td colSpan="6" className="right">Total</td><td>{money(total)}</td></tr></tfoot></table></div></div></>
}
