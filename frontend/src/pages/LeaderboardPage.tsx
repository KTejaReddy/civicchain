import { useState, useEffect } from 'react';
import { Search, Trophy, Award, Medal, Building2, Users } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import api from '@/services/api';

interface LeaderboardEntry {
  id: string;
  name: string;
  walletAddress: string;
  verifiedHours: number;
  badge: string | null;
  contributions: number;
}

interface OrgLeaderboardEntry {
  id: string;
  name: string;
  verifiedHours: number;
  campaigns: number;
  volunteers: number;
}

const badgeIcons: Record<string, any> = {
  PLATINUM: Trophy,
  GOLD: Medal,
  SILVER: Award,
  BRONZE: Award,
};

const badgeColors: Record<string, string> = {
  PLATINUM: 'text-gray-400',
  GOLD: 'text-yellow-500',
  SILVER: 'text-gray-500',
  BRONZE: 'text-amber-700',
};

export default function LeaderboardPage() {
  const [volunteers, setVolunteers] = useState<LeaderboardEntry[]>([]);
  const [orgs, setOrgs] = useState<OrgLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'volunteers' | 'organizations'>('volunteers');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const [volRes, orgRes] = await Promise.allSettled([
        api.get('/leaderboard/volunteers'),
        api.get('/leaderboard/organizations'),
      ]);

      if (volRes.status === 'fulfilled') {
        setVolunteers(Array.isArray(volRes.value.data.data) ? volRes.value.data.data : []);
      }
      if (orgRes.status === 'fulfilled') {
        setOrgs(Array.isArray(orgRes.value.data.data) ? orgRes.value.data.data : []);
      }
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  const filteredVols = volunteers.filter((v) =>
    v.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner text="Loading leaderboard..." />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Leaderboard</h1>
        <p className="text-gray-500 mt-1">Top contributors and organizations in the CivicChain community.</p>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('volunteers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'volunteers' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users size={16} />
          Volunteers
        </button>
        <button
          onClick={() => setActiveTab('organizations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'organizations' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Building2 size={16} />
          Organizations
        </button>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder={activeTab === 'volunteers' ? 'Search volunteers...' : 'Search organizations...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {activeTab === 'volunteers' && (
        filteredVols.length > 0 ? (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Rank</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Verified Hours</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Contributions</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Badge</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVols.map((vol, index) => {
                    const BadgeIcon = vol.badge ? badgeIcons[vol.badge] : null;
                    return (
                      <tr key={vol.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-700' :
                            index === 1 ? 'bg-gray-100 text-gray-600' :
                            index === 2 ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-50 text-gray-500'
                          }`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{vol.name || 'Anonymous'}</p>
                            <p className="text-xs text-gray-400 font-mono">{vol.walletAddress.slice(0, 6)}...{vol.walletAddress.slice(-4)}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">{vol.verifiedHours}</td>
                        <td className="py-3 px-4 text-right text-gray-600">{vol.contributions}</td>
                        <td className="py-3 px-4 text-right">
                          {BadgeIcon && vol.badge ? (
                            <BadgeIcon className={`inline-block ${badgeColors[vol.badge]}`} size={20} />
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            title="No volunteers found"
            description={search ? 'Try a different search term.' : 'No volunteers on the leaderboard yet.'}
          />
        )
      )}

      {activeTab === 'organizations' && (
        orgs.length > 0 ? (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Rank</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Organization</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Verified Hours</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Campaigns</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Volunteers</th>
                  </tr>
                </thead>
                <tbody>
                  {orgs.map((org, index) => (
                    <tr key={org.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-600' :
                          index === 2 ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{org.name}</p>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">{org.verifiedHours}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{org.campaigns}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{org.volunteers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            title="No organizations found"
            description="No organizations on the leaderboard yet."
          />
        )
      )}
    </div>
  );
}
