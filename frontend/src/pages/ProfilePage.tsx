import { useState, useEffect } from 'react';
import { Wallet, Award, BadgeCheck, Edit3, Save, X, Clock, TrendingUp, User as UserIcon, Shield } from 'lucide-react';
import type { User } from '@/types';
import api from '@/services/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useWallet } from '@/hooks/useWallet';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalContributions: number;
  verifiedHours: number;
  campaignsJoined: number;
  rank: number;
}

export default function ProfilePage() {
  const { account } = useWallet();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalContributions: 0,
    verifiedHours: 0,
    campaignsJoined: 0,
    rank: 0,
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const [userRes, statsRes] = await Promise.allSettled([
        api.get('/auth/me'),
        api.get('/dashboard/stats'),
      ]);

      if (userRes.status === 'fulfilled') {
        const u = userRes.value.data.data;
        setUser(u);
        setForm({ name: u.name || '', email: u.email || '' });
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data.data);
      }
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const res = await api.patch('/auth/profile', form);
      setUser(res.data.data);
      setEditing(false);
      toast.success('Profile updated!');
    } catch {
      // handled
    }
  };

  if (loading) return <LoadingSpinner text="Loading profile..." />;
  if (!user) return null;

  const statCards = [
    { icon: Clock, label: 'Contributions', value: stats.totalContributions },
    { icon: Award, label: 'Verified Hours', value: stats.verifiedHours },
    { icon: TrendingUp, label: 'Campaigns', value: stats.campaignsJoined },
    { icon: Shield, label: 'Rank', value: `#${stats.rank || '-'}` },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center shrink-0">
            <UserIcon className="text-primary-600" size={36} />
          </div>

          <div className="flex-1 w-full">
            <div className="flex items-start justify-between gap-4">
              <div>
                {editing ? (
                  <div className="space-y-3 mb-3">
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Your name"
                      className="input-field"
                    />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="Your email"
                      className="input-field"
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {user.name || 'Anonymous User'}
                    </h1>
                    {user.email && (
                      <p className="text-gray-500">{user.email}</p>
                    )}
                  </>
                )}
              </div>
              <button
                onClick={() => editing ? handleSave() : setEditing(true)}
                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {editing ? <Save size={20} /> : <Edit3 size={20} />}
              </button>
            </div>

            {editing && (
              <button onClick={() => { setEditing(false); setForm({ name: user.name || '', email: user.email || '' }); }} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mt-1">
                <X size={14} /> Cancel
              </button>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-4">
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
                  <BadgeCheck size={12} /> Verified
                </span>
              )}
              {user.badge && (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                  <Award size={12} /> {user.badge}
                </span>
              )}
            </div>

            {user.did && (
              <p className="text-xs text-gray-400 font-mono mt-3 truncate">
                DID: {user.did}
              </p>
            )}

            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
              <Wallet size={14} />
              <span className="font-mono">
                {account?.slice(0, 8)}...{account?.slice(-6)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="card text-center">
            <stat.icon className="mx-auto text-primary-600 mb-2" size={24} />
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h2>
        <dl className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <dt className="text-sm text-gray-500">Member Since</dt>
            <dd className="text-sm text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</dd>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <dt className="text-sm text-gray-500">Role</dt>
            <dd className="text-sm text-gray-900">{user.role}</dd>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <dt className="text-sm text-gray-500">Verification Status</dt>
            <dd className="text-sm">
              <span className={user.isVerified ? 'text-green-600' : 'text-yellow-600'}>
                {user.isVerified ? 'Verified' : 'Unverified'}
              </span>
            </dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-sm text-gray-500">Badge</dt>
            <dd className="text-sm text-gray-900">{user.badge || 'No badge'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
