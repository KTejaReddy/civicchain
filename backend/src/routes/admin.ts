import { Router, Response } from 'express';
import prisma from '../services/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.get('/users', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        include: {
          organization: { select: { id: true, name: true } },
          _count: { select: { contributions: true, votes: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin list users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/users/:id/verify', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { role, isVerified } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(role !== undefined && { role }),
        ...(isVerified !== undefined && { isVerified }),
      },
    });

    res.json({
      id: updated.id,
      walletAddress: updated.walletAddress,
      name: updated.name,
      role: updated.role,
      isVerified: updated.isVerified,
    });
  } catch (error) {
    console.error('Admin verify user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/stats', authenticate, requireRole('ADMIN'), async (_req: AuthRequest, res: Response) => {
  try {
    const [
      totalUsers,
      totalOrganizations,
      totalCampaigns,
      totalContributions,
      approvedContributions,
      pendingContributions,
      totalVotes,
      totalProposals,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.organization.count(),
      prisma.campaign.count(),
      prisma.contribution.count(),
      prisma.contribution.count({ where: { status: 'APPROVED' } }),
      prisma.contribution.count({ where: { status: 'PENDING' } }),
      prisma.vote.count(),
      prisma.proposal.count(),
    ]);

    const totalHoursResult = await prisma.contribution.aggregate({
      where: { status: 'APPROVED' },
      _sum: { hours: true },
    });

    res.json({
      totalUsers,
      totalOrganizations,
      totalCampaigns,
      totalContributions,
      approvedContributions,
      pendingContributions,
      rejectedContributions: totalContributions - approvedContributions - pendingContributions,
      totalVotes,
      totalProposals,
      totalVerifiedHours: totalHoursResult._sum.hours || 0,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
