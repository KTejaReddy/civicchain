import { useState, useEffect } from 'react';
import { Plus, ThumbsUp, ThumbsDown, Clock, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { Proposal, User } from '@/types';
import api from '@/services/api';
import StatusBadge from '@/components/StatusBadge';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { useWallet } from '@/hooks/useWallet';

export default function GovernancePage() {
  const { account } = useWallet();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [voting, setVoting] = useState<string | null>(null);
  const [newProposal, setNewProposal] = useState({ title: '', description: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [propRes, userRes] = await Promise.allSettled([
        api.get('/proposals'),
        api.get('/auth/me'),
      ]);
      if (propRes.status === 'fulfilled') {
        setProposals(Array.isArray(propRes.value.data.data) ? propRes.value.data.data : []);
      }
      if (userRes.status === 'fulfilled') {
        setUser(userRes.value.data.data);
      }
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (proposalId: string, vote: 'FOR' | 'AGAINST') => {
    setVoting(proposalId);
    try {
      await api.post(`/proposals/${proposalId}/vote`, { vote });
      toast.success(`Voted ${vote.toLowerCase()}!`);
      fetchData();
    } catch {
      // handled
    } finally {
      setVoting(null);
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProposal.title || !newProposal.description) {
      toast.error('All fields are required');
      return;
    }
    setCreating(true);
    try {
      await api.post('/proposals', newProposal);
      toast.success('Proposal created!');
      setShowCreate(false);
      setNewProposal({ title: '', description: '' });
      fetchData();
    } catch {
      // handled
    } finally {
      setCreating(false);
    }
  };

  const getTimeRemaining = (endDate: string) => {
    const now = Date.now();
    const end = new Date(endDate).getTime();
    const diff = end - now;
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h remaining`;
  };

  if (loading) return <LoadingSpinner text="Loading governance..." />;

  const totalVotes = (p: Proposal) => p.forVotes + p.againstVotes;
  const forPercent = (p: Proposal) => totalVotes(p) > 0 ? Math.round((p.forVotes / totalVotes(p)) * 100) : 0;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Governance</h1>
          <p className="text-gray-500 mt-1">Vote on proposals that shape the future of CivicChain.</p>
        </div>
        {user?.isVerified && (
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            Create Proposal
          </button>
        )}
      </div>

      {showCreate && (
        <div className="card p-6 mb-8 border-primary-200 bg-primary-50">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">New Proposal</h2>
          <form onSubmit={handleCreateProposal} className="space-y-4">
            <input
              type="text"
              placeholder="Proposal title"
              value={newProposal.title}
              onChange={(e) => setNewProposal((p) => ({ ...p, title: e.target.value }))}
              className="input-field"
            />
            <textarea
              placeholder="Describe your proposal..."
              value={newProposal.description}
              onChange={(e) => setNewProposal((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              className="input-field resize-none"
            />
            <div className="flex gap-3">
              <button type="submit" disabled={creating} className="btn-primary">
                {creating ? 'Submitting...' : 'Submit Proposal'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {proposals.length > 0 ? (
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <div key={proposal.id} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">{proposal.title}</h3>
                    <StatusBadge status={proposal.status} />
                  </div>
                  <p className="text-sm text-gray-600">{proposal.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {getTimeRemaining(proposal.endDate)}
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp size={14} className="text-green-500" />
                  {proposal.forVotes}
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsDown size={14} className="text-red-500" />
                  {proposal.againstVotes}
                </span>
              </div>

              {totalVotes(proposal) > 0 && (
                <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${forPercent(proposal)}%` }}
                  />
                </div>
              )}

              {proposal.status === 'ACTIVE' && account && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleVote(proposal.id, 'FOR')}
                    disabled={voting === proposal.id}
                    className="btn-success flex items-center gap-2 text-sm"
                  >
                    <ThumbsUp size={16} />
                    {voting === proposal.id ? 'Voting...' : 'For'}
                  </button>
                  <button
                    onClick={() => handleVote(proposal.id, 'AGAINST')}
                    disabled={voting === proposal.id}
                    className="btn-danger flex items-center gap-2 text-sm"
                  >
                    <ThumbsDown size={16} />
                    Against
                  </button>
                </div>
              )}

              {!account && (
                <p className="text-sm text-gray-400">Connect wallet to vote</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No proposals"
          description="There are no active proposals. Verified users can create one."
          actionText={user?.isVerified ? 'Create Proposal' : undefined}
          onAction={user?.isVerified ? () => setShowCreate(true) : undefined}
        />
      )}
    </div>
  );
}
