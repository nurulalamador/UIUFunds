import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/DashboardLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import About from './pages/About'
import Dashboard from './pages/Dashboard'
import Community from './pages/Community'
import CommunityPost from './pages/CommunityPost'
import LoanRequests from './pages/LoanRequests'
import NewLoan from './pages/NewLoan'
import MyLoans from './pages/MyLoans'
import LoanOffers from './pages/LoanOffers'
import ProvidedLoans from './pages/ProvidedLoans'
import ProvidedLoanDetails from './pages/ProvidedLoanDetails'
import Crowdfundings from './pages/Crowdfundings'
import MyCrowdfundings from './pages/MyCrowdfundings'
import NewCrowdfunding from './pages/NewCrowdfunding'
import ManageSpent from './pages/ManageSpent'
import CrowdfundingHistory from './pages/CrowdfundingHistory'
import SpentHistory from './pages/SpentHistory'
import Transactions from './pages/Transactions'
import Profile from './pages/Profile'
import PublicProfile from './pages/PublicProfile'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import Messages from './pages/Messages'
import AdminCrowdfundings from './pages/AdminCrowdfundings'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/about" element={<About />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="community" element={<Community />} />
          <Route path="community/posts/:postId" element={<CommunityPost />} />
          <Route path="loans" element={<LoanRequests />} />
          <Route path="loans/new" element={<NewLoan />} />
          <Route path="loans/:loanId/offers" element={<LoanOffers />} />
          <Route path="my-loans" element={<MyLoans />} />
          <Route path="provided-loans" element={<ProvidedLoans />} />
          <Route path="provided-loans/:id" element={<ProvidedLoanDetails />} />
          <Route path="crowdfundings" element={<Crowdfundings />} />
          <Route path="crowdfundings/new" element={<NewCrowdfunding />} />
          <Route path="crowdfundings-history" element={<CrowdfundingHistory />} />
          <Route path="crowdfundings/:id/manage-spent" element={<ManageSpent />} />
          <Route path="crowdfundings/:id/spent" element={<SpentHistory />} />
          <Route path="my-crowdfundings" element={<MyCrowdfundings />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="profile/:id" element={<PublicProfile />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="messages" element={<Messages />} />
          <Route path="settings" element={<Settings />} />
          <Route path="admin/crowdfundings" element={<AdminCrowdfundings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
