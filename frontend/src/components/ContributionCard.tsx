import { Clock, MapPin, FileText } from 'lucide-react';
import { Contribution } from '@/types';
import StatusBadge from './StatusBadge';
import { useNavigate } from 'react-router-dom';

interface ContributionCardProps {
  contribution: Contribution;
}

export default function ContributionCard({ contribution }: ContributionCardProps) {
  const navigate = useNavigate();

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">
            {contribution.campaign?.title || 'Campaign'}
          </h4>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date(contribution.createdAt).toLocaleDateString()}
          </p>
        </div>
        <StatusBadge status={contribution.status} />
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
        <span className="flex items-center gap-1">
          <Clock size={14} />
          {contribution.hours}h
        </span>
        <span className="flex items-center gap-1">
          <MapPin size={14} />
          {contribution.location}
        </span>
      </div>
      <p className="text-sm text-gray-600 line-clamp-2 mb-4">
        {contribution.description}
      </p>
      <button
        onClick={() => navigate(`/contributions/${contribution.id}`)}
        className="text-primary-600 text-sm font-medium hover:text-primary-700 flex items-center gap-1"
      >
        <FileText size={14} />
        View Details
      </button>
    </div>
  );
}
