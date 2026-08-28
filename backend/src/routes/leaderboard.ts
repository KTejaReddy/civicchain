import { Router, Response } from 'express';
import prisma from '../services/prisma';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.get('/volunteers', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const topVolunteers = await prisma.contribution.groupBy({
      by: ['userId'],
      where: { status: 'APPROVED' },
      _sum: { hours: true },
      _count: { id: true },
      orderBy: { _sum: { hours: 'desc' } },
      take: 50,
    });

    const userIds = topVolunteers.map((v) => v.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, badge: true, walletAddress: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const leaderboard = topVolunteers.map((entry) => {
      const user = userMap.get(entry.userId);
      return {
        id: entry.userId,
        name: user?.name || 'Anonymous',
        walletAddress: user?.walletAddress,
        badge: user?.badge || null,
        verifiedHours: entry._sum.hours || 0,
        contributions: entry._count.id,
      };
    });

    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/organizations', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const orgRankings = await prisma.organization.findMany({
      include: {
        user: { select: { name: true, walletAddress: true } },
        _count: { select: { campaigns: true } },
        campaigns: {
          include: {
            _count: { select: { contributions: true } },
            contributions: {
              where: { status: 'APPROVED' },
              select: { hours: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rankings = orgRankings.map((org) => {
      const totalHours = org.campaigns.reduce(
        (sum, c) => sum + c.contributions.reduce((s, co) => s + co.hours, 0),
        0
      );
      const totalContributions = org.campaigns.reduce(
        (sum, c) => sum + c._count.contributions,
        0
      );

      return {
        id: org.id,
        name: org.name,
        walletAddress: org.walletAddress,
        ownerName: org.user.name,
        campaigns: org._count.campaigns,
        volunteers: totalContributions, // mapping totalContributions as volunteers for now
        verifiedHours: totalHours,
      };
    });

    rankings.sort((a, b) => b.verifiedHours - a.verifiedHours);

    res.json(rankings);
  } catch (error) {
    console.error('Org leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
