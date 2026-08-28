import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, MessageSquare, ExternalLink, Clock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { Contribution } from '@/types';
import api from '@/services/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';

export default function VotingDashboardPage() {
  const [pending, setPending] = useState<Contribution[]>([]);
  const [voted, setVoted] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPendingVotes();
  }, []);

  const fetchPendingVotes = async () => {
    try {
      const [pendingRes, votedRes] = await Promise.allSettled([
        api.get('/contributions/pending'),
        api.get('/contributions/voted'),
      ]);

      if (pendingRes.status === 'fulfilled') {
        setPending(Array.isArray(pendingRes.value.data.data) ? pendingRes.value.data.data : []);
      }
      if (votedRes.status === 'fulfilled') {
        setVoted(Array.isArray(votedRes.value.data.data) ? votedRes.value.data.data : []);
      }
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (contributionId: string, vote: 'APPROVE' | 'REJECT') => {
    setVotingId(contributionId);
    try {
      await api.post(`/contributions/${contributionId}/vote`, {
        vote,
        comment: comments[contributionId] || '',
      });
      toast.success(`Contribution ${vote.toLowerCase()}d!`);
      setComments((prev) => {
        const next = { ...prev };
        delete next[contributionId];
        return next;
      });
      fetchPendingVotes();
    } catch {
      // handled
    } finally {
      setVotingId(null);
    }
  };

  if (loading) return <LoadingSpinner text="Loading voting dashboard..." />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Voting Dashboard</h1>
        <p className="text-gray-500 mt-1">Review and validate pending contributions.</p>
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          Pending Review
          <span className="text-sm font-normal text-gray-500">({pending.length})</span>
        </h2>

        {pending.length > 0 ? (
          <div className="space-y-4">
            {pending.map((contribution) => (
              <div key={contribution.id} className="card p-6 border-l-4 border-l-yellow-400">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {contribution.user?.name || 'Anonymous'}
                      </h3>
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <User size={14} />
                        {(contribution.user?.walletAddress || '').slice(0, 6)}...
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Campaign: {contribution.campaign?.title || 'N/A'}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                    <Clock size={14} />
                    {contribution.hours}h
                  </span>
                </div>

                <p className="text-sm text-gray-700 mb-3">{contribution.description}</p>

                {contribution.proofUrl && (
                  <a
                    href={contribution.proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 mb-4"
                  >
                    <ExternalLink size={14} />
                    View Evidence
                  </a>
                )}

                <div className="mb-4">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">
                    Comment (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={comments[contribution.id] || ''}
                    onChange={(e) => setComments((prev) => ({ ...prev, [contribution.id]: e.target.value }))}
                    className="input-field text-sm"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleVote(contribution.id, 'APPROVE')}
                    disabled={votingId === contribution.id}
                    className="btn-success flex items-center gap-2 text-sm"
                  >
                    <CheckCircle size={16} />
                    {votingId === contribution.id ? 'Voting...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleVote(contribution.id, 'REJECT')}
                    disabled={votingId === contribution.id}
                    className="btn-danger flex items-center gap-2 text-sm"
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No pending reviews"
            description="All contributions have been reviewed. Check back later for new submissions."
          />
        )}
      </div>

      {voted.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Already Voted ({voted.length})</h2>
          <div className="space-y-3">
            {voted.map((contribution) => (
              <div key={contribution.id} className="card p-4 opacity-60">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {contribution.user?.name || 'Anonymous'}
                    </p>
                    <p className="text-sm text-gray-500">{contribution.campaign?.title}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{contribution.hours}h</span>
                    {contribution.status === 'APPROVED' ? (
                      <CheckCircle className="text-green-500" size={18} />
                    ) : (
                      <XCircle className="text-red-500" size={18} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
