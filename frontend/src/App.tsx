import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { WalletProvider } from '@/hooks/useWallet';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import CampaignsPage from '@/pages/CampaignsPage';
import CreateCampaignPage from '@/pages/CreateCampaignPage';
import CampaignDetailPage from '@/pages/CampaignDetailPage';
import SubmitContributionPage from '@/pages/SubmitContributionPage';
import LeaderboardPage from '@/pages/LeaderboardPage';
import GovernancePage from '@/pages/GovernancePage';
import ProfilePage from '@/pages/ProfilePage';
import VotingDashboardPage from '@/pages/VotingDashboardPage';
import AdminPage from '@/pages/AdminPage';

function App() {
  return (
    <WalletProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '12px',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Layout><LandingPage /></Layout>} />
        <Route path="/login" element={<Layout><LoginPage /></Layout>} />
        <Route path="/dashboard" element={<Layout><ProtectedRoute><DashboardPage /></ProtectedRoute></Layout>} />
        <Route path="/campaigns" element={<Layout><CampaignsPage /></Layout>} />
        <Route path="/campaigns/new" element={<Layout><ProtectedRoute><CreateCampaignPage /></ProtectedRoute></Layout>} />
        <Route path="/campaigns/:id" element={<Layout><CampaignDetailPage /></Layout>} />
        <Route path="/contributions/new" element={<Layout><ProtectedRoute><SubmitContributionPage /></ProtectedRoute></Layout>} />
        <Route path="/leaderboard" element={<Layout><LeaderboardPage /></Layout>} />
        <Route path="/governance" element={<Layout><GovernancePage /></Layout>} />
        <Route path="/profile" element={<Layout><ProtectedRoute><ProfilePage /></ProtectedRoute></Layout>} />
        <Route path="/voting" element={<Layout><ProtectedRoute><VotingDashboardPage /></ProtectedRoute></Layout>} />
        <Route path="/admin" element={<Layout><ProtectedRoute><AdminPage /></ProtectedRoute></Layout>} />
      </Routes>
    </WalletProvider>
  );
}

export default App;
