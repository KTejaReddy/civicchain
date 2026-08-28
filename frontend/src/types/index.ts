export interface User {
  id: string;
  walletAddress: string;
  did: string;
  name: string;
  email: string;
  role: 'VOLUNTEER' | 'ORGANIZATION' | 'VALIDATOR' | 'ADMIN';
  isVerified: boolean;
  badge: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | null;
  createdAt: string;
}

export interface Campaign {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  date: string;
  location: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'DRAFT';
  organization?: User;
  contributions?: Contribution[];
}

export interface Contribution {
  id: string;
  campaignId: string;
  userId: string;
  hours: number;
  description: string;
  proofUrl: string;
  location: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  blockHash: string;
  createdAt: string;
  user?: User;
  campaign?: Campaign;
}

export interface Vote {
  id: string;
  contributionId: string;
  validatorId: string;
  vote: 'APPROVE' | 'REJECT';
  comment: string;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  status: 'ACTIVE' | 'PASSED' | 'REJECTED' | 'PENDING';
  createdBy: string;
  endDate: string;
  forVotes: number;
  againstVotes: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
