import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, ArrowLeft, Users, Clock } from 'lucide-react';
import { Campaign, Contribution, User } from '@/types';
import api from '@/services/api';
import ContributionCard from '@/components/ContributionCard';
import StatusBadge from '@/components/StatusBadge';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import toast from 'react-hot-toast';
import { useWallet } from '@/hooks/useWallet';

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { account } = useWallet();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [campaignRes, contribsRes, userRes] = await Promise.allSettled([
        api.get(`/campaigns/${id}`),
        api.get(`/contributions?campaignId=${id}`),
        api.get('/auth/me'),
      ]);

      if (campaignRes.status === 'fulfilled') {
        setCampaign(campaignRes.value.data.data);
      }
      if (contribsRes.status === 'fulfilled') {
        setContributions(Array.isArray(contribsRes.value.data.data) ? contribsRes.value.data.data : []);
      }
      if (userRes.status === 'fulfilled') {
        setCurrentUser(userRes.value.data.data);
      }
    } catch {
      toast.error('Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setJoining(true);
    try {
      await api.post(`/campaigns/${id}/join`);
      toast.success('Joined campaign successfully!');
      fetchData();
    } catch {
      // handled by interceptor
    } finally {
      setJoining(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    setEditingStatus(true);
    try {
      await api.patch(`/campaigns/${id}`, { status });
      toast.success(`Campaign marked as ${status.toLowerCase()}`);
      fetchData();
    } catch {
      // handled
    } finally {
      setEditingStatus(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading campaign..." />;
  if (!campaign) {
    return <EmptyState title="Campaign not found" description="The campaign you're looking for doesn't exist." actionText="Back to Campaigns" actionLink="/campaigns" />;
  }

  const hasJoined = contributions.some((c) => c.userId === currentUser?.id);

  return (
    <div>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="card p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{campaign.title}</h1>
            {campaign.organization && (
              <p className="text-primary-600 font-medium">Organized by {campaign.organization.name}</p>
            )}
          </div>
          <StatusBadge status={campaign.status} size="md" />
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
          <span className="flex items-center gap-1">
            <Calendar size={16} />
            {new Date(campaign.date).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={16} />
            {campaign.location}
          </span>
          <span className="flex items-center gap-1">
            <Users size={16} />
            {contributions.length} participant{contributions.length !== 1 ? 's' : ''}
          </span>
        </div>

        <p className="text-gray-700 leading-relaxed mb-6">{campaign.description}</p>

        <div className="flex flex-wrap gap-3">
          {campaign.status === 'ACTIVE' && currentUser?.role === 'VOLUNTEER' && !hasJoined && (
            <button onClick={handleJoin} disabled={joining || !account} className="btn-primary flex items-center gap-2">
              <Users size={18} />
              {joining ? 'Joining...' : 'Join Campaign'}
            </button>
          )}
          {(currentUser?.role === 'ORGANIZATION' || currentUser?.role === 'ADMIN') && (
            <div className="flex gap-2">
              {campaign.status === 'ACTIVE' && (
                <button onClick={() => handleStatusChange('COMPLETED')} disabled={editingStatus} className="btn-success text-sm">
                  Mark Completed
                </button>
              )}
              {campaign.status !== 'CANCELLED' && (
                <button onClick={() => handleStatusChange('CANCELLED')} disabled={editingStatus} className="btn-danger text-sm">
                  Cancel Campaign
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Contributions ({contributions.length})</h2>
        {contributions.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contributions.map((c) => (
              <ContributionCard key={c.id} contribution={c} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No contributions yet"
            description="Be the first to contribute to this campaign."
            actionText="Submit Contribution"
            actionLink="/contributions/new"
          />
        )}
      </div>
    </div>
  );
}
