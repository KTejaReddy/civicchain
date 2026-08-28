import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Users, Award, PlusCircle, ListChecks, TrendingUp, UserCheck } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import ContributionCard from '@/components/ContributionCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { Contribution, Campaign, User } from '@/types';
import api from '@/services/api';

interface DashboardStats {
  totalContributions: number;
  verifiedHours: number;
  campaignsJoined: number;
  rank: number;
  pendingVotes: number;
  totalCampaigns: number;
  totalVolunteers: number;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { account } = useWallet();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalContributions: 0,
    verifiedHours: 0,
    campaignsJoined: 0,
    rank: 0,
    pendingVotes: 0,
    totalCampaigns: 0,
    totalVolunteers: 0,
  });
  const [recentContributions, setRecentContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [userRes, contribsRes] = await Promise.allSettled([
        api.get('/auth/me'),
        api.get('/contributions?limit=5'),
      ]);

      if (userRes.status === 'fulfilled') {
        setUser(userRes.value.data.data);
      }

      if (contribsRes.status === 'fulfilled') {
        const data = contribsRes.value.data.data;
        setRecentContributions(Array.isArray(data) ? data : []);
      }

      try {
        const statsRes = await api.get('/dashboard/stats');
        setStats(statsRes.data.data);
      } catch {
        // Use defaults
      }
    } catch (err) {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  const statCards = [
    { icon: Clock, label: 'Contributions', value: stats.totalContributions, color: 'text-blue-600', bg: 'bg-blue-100' },
    { icon: Award, label: 'Verified Hours', value: stats.verifiedHours, color: 'text-green-600', bg: 'bg-green-100' },
    { icon: Users, label: 'Campaigns Joined', value: stats.campaignsJoined, color: 'text-purple-600', bg: 'bg-purple-100' },
    { icon: TrendingUp, label: 'Rank', value: `#${stats.rank || '-'}`, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Welcome{user?.name ? `, ${user.name}` : ' Back'}!
        </h1>
        <p className="text-gray-500 mt-1">Here's your civic contribution overview.</p>
      </div>

      {user && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            user.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
            user.role === 'VALIDATOR' ? 'bg-purple-100 text-purple-700' :
            user.role === 'ORGANIZATION' ? 'bg-blue-100 text-blue-700' :
            'bg-green-100 text-green-700'
          }`}>
            {user.role}
          </span>
          {user.isVerified && (
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-secondary-100 text-secondary-700 text-xs font-medium">
              <UserCheck size={12} /> Verified
            </span>
          )}
          {user.badge && (
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
              <Award size={12} /> {user.badge}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="card">
            <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center mb-3`}>
              <stat.icon className={stat.color} size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {(user?.role === 'ORGANIZATION' || user?.role === 'ADMIN') && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="card bg-gradient-to-br from-primary-50 to-blue-50 border-primary-200">
            <p className="text-2xl font-bold text-primary-700">{stats.totalCampaigns}</p>
            <p className="text-sm text-primary-600">Total Campaigns</p>
          </div>
          <div className="card bg-gradient-to-br from-secondary-50 to-green-50 border-secondary-200">
            <p className="text-2xl font-bold text-secondary-700">{stats.totalVolunteers}</p>
            <p className="text-sm text-secondary-600">Total Volunteers</p>
          </div>
        </div>
      )}

      {user?.role === 'VALIDATOR' && stats.pendingVotes > 0 && (
        <div className="card bg-purple-50 border-purple-200 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <ListChecks className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="font-semibold text-purple-900">{stats.pendingVotes} Pending Votes</p>
              <p className="text-sm text-purple-700">Contributions awaiting your validation</p>
            </div>
          </div>
          <button onClick={() => navigate('/voting')} className="btn-primary text-sm">
            Review Now
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <button onClick={() => navigate('/campaigns/new')} className="card border-2 border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50 transition-all flex items-center justify-center gap-2 py-8">
          <PlusCircle className="text-primary-600" size={24} />
          <span className="font-medium text-primary-600">Submit Contribution</span>
        </button>
        <button onClick={() => navigate('/campaigns')} className="card border-2 border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50 transition-all flex items-center justify-center gap-2 py-8">
          <ListChecks className="text-primary-600" size={24} />
          <span className="font-medium text-primary-600">Browse Campaigns</span>
        </button>
        <button onClick={() => navigate('/leaderboard')} className="card border-2 border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50 transition-all flex items-center justify-center gap-2 py-8">
          <TrendingUp className="text-primary-600" size={24} />
          <span className="font-medium text-primary-600">View Leaderboard</span>
        </button>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Contributions</h2>
        {recentContributions.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentContributions.map((c) => (
              <ContributionCard key={c.id} contribution={c} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No contributions yet"
            description="Start contributing to campaigns to see your activity here."
            actionText="Browse Campaigns"
            actionLink="/campaigns"
          />
        )}
      </div>
    </div>
  );
}
