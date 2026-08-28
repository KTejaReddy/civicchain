import { Router, Response } from 'express';
import prisma from '../services/prisma';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const totalContributions = await prisma.contribution.count({ where: { userId } });
    
    const approvedContribs = await prisma.contribution.findMany({ 
      where: { userId, status: 'APPROVED' } 
    });
    const verifiedHours = approvedContribs.reduce((sum: number, c: any) => sum + c.hours, 0);

    const campaignsJoined = await prisma.contribution.groupBy({
      by: ['campaignId'],
      where: { userId },
    });

    const pendingVotes = await prisma.validatorAssignment.count({
      where: { validatorId: userId, contribution: { status: 'PENDING' } }
    });

    const totalCampaigns = await prisma.campaign.count();
    const totalVolunteers = await prisma.user.count({ where: { role: 'VOLUNTEER' } });

    res.json({
      totalContributions,
      verifiedHours,
      campaignsJoined: campaignsJoined.length,
      rank: 1, // Simple mock for now
      pendingVotes,
      totalCampaigns,
      totalVolunteers
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
