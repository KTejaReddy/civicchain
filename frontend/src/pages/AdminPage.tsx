import { useState, useEffect } from 'react';
import { Users, Activity, Shield, CheckCircle, XCircle, Search } from 'lucide-react';
import { User, Contribution } from '@/types';
import api from '@/services/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatusBadge from '@/components/StatusBadge';
import toast from 'react-hot-toast';

interface SystemStats {
  totalUsers: number;
  totalCampaigns: number;
  totalContributions: number;
  verifiedHours: number;
  pendingContributions: number;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalCampaigns: 0,
    totalContributions: 0,
    verifiedHours: 0,
    pendingContributions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [userTab, setUserTab] = useState<'users' | 'contributions'>('users');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, contribsRes] = await Promise.allSettled([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/contributions'),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.data);
      if (usersRes.status === 'fulfilled') setUsers(Array.isArray(usersRes.value.data.data) ? usersRes.value.data.data : []);
      if (contribsRes.status === 'fulfilled') setContributions(Array.isArray(contribsRes.value.data.data) ? contribsRes.value.data.data : []);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  const toggleVerification = async (userId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}`, {
        isVerified: !currentStatus,
      });
      toast.success(`User ${currentStatus ? 'unverified' : 'verified'}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isVerified: !currentStatus } : u))
      );
    } catch {
      // handled
    }
  };

  if (loading) return <LoadingSpinner text="Loading admin panel..." />;

  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.walletAddress?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage users, monitor contributions, and oversee the platform.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="card">
          <Users className="text-primary-600 mb-2" size={24} />
          <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
          <p className="text-xs text-gray-500">Total Users</p>
        </div>
        <div className="card">
          <Activity className="text-green-600 mb-2" size={24} />
          <p className="text-2xl font-bold text-gray-900">{stats.totalCampaigns}</p>
          <p className="text-xs text-gray-500">Campaigns</p>
        </div>
        <div className="card">
          <Shield className="text-purple-600 mb-2" size={24} />
          <p className="text-2xl font-bold text-gray-900">{stats.totalContributions}</p>
          <p className="text-xs text-gray-500">Contributions</p>
        </div>
        <div className="card">
          <CheckCircle className="text-secondary-600 mb-2" size={24} />
          <p className="text-2xl font-bold text-gray-900">{stats.verifiedHours}</p>
          <p className="text-xs text-gray-500">Verified Hours</p>
        </div>
        <div className="card">
          <XCircle className="text-yellow-600 mb-2" size={24} />
          <p className="text-2xl font-bold text-gray-900">{stats.pendingContributions}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setUserTab('users')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            userTab === 'users' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-600'
          }`}
        >
          Users ({users.length})
        </button>
        <button
          onClick={() => setUserTab('contributions')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            userTab === 'contributions' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-600'
          }`}
        >
          All Contributions ({contributions.length})
        </button>
      </div>

      {userTab === 'users' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Wallet</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Verified</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{u.name || 'Anonymous'}</td>
                    <td className="py-3 px-4 text-sm text-gray-500 font-mono">
                      {u.walletAddress.slice(0, 8)}...{u.walletAddress.slice(-6)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                        u.role === 'VALIDATOR' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'ORGANIZATION' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>{u.role}</span>
                    </td>
                    <td className="py-3 px-4">
                      {u.isVerified ? (
                        <CheckCircle className="text-green-500" size={18} />
                      ) : (
                        <XCircle className="text-gray-300" size={18} />
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => toggleVerification(u.id, u.isVerified)}
                        className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                          u.isVerified
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {u.isVerified ? 'Unverify' : 'Verify'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {userTab === 'contributions' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Campaign</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Hours</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{c.user?.name || 'Anonymous'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{c.campaign?.title || 'N/A'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{c.hours}h</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
