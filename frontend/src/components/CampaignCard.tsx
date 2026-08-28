import { Calendar, MapPin, Users } from 'lucide-react';
import { Campaign } from '@/types';
import StatusBadge from './StatusBadge';
import { useNavigate } from 'react-router-dom';

interface CampaignCardProps {
  campaign: Campaign;
}

export default function CampaignCard({ campaign }: CampaignCardProps) {
  const navigate = useNavigate();

  return (
    <div className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/campaigns/${campaign.id}`)}>
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-lg">{campaign.title}</h3>
        <StatusBadge status={campaign.status} />
      </div>
      {campaign.organization && (
        <p className="text-sm text-primary-600 font-medium mb-2">{campaign.organization.name}</p>
      )}
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{campaign.description}</p>
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <Calendar size={14} />
          {new Date(campaign.date).toLocaleDateString()}
        </span>
        <span className="flex items-center gap-1">
          <MapPin size={14} />
          {campaign.location}
        </span>
        {campaign.contributions && (
          <span className="flex items-center gap-1">
            <Users size={14} />
            {campaign.contributions.length}
          </span>
        )}
      </div>
    </div>
  );
}
