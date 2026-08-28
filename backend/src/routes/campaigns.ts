import { Router, Response } from 'express';
import prisma from '../services/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AuthRequest } from '../types';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        skip,
        take: limit,
        include: {
          organization: {
            include: { user: { select: { name: true, walletAddress: true } } },
          },
          _count: { select: { contributions: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.campaign.count(),
    ]);

    res.json({
      campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List campaigns error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post(
  '/',
  authenticate,
  requireRole('ORGANIZATION'),
  validate([
    { field: 'title', type: 'string', required: true, min: 3, max: 200 },
    { field: 'description', type: 'string', required: false },
    { field: 'date', type: 'string', required: false },
    { field: 'location', type: 'string', required: false },
  ]),
  async (req: AuthRequest, res: Response) => {
    try {
      const organization = await prisma.organization.findUnique({
        where: { userId: req.user!.userId },
      });

      if (!organization) {
        res.status(400).json({ error: 'Organization profile not found. Please create an organization first.' });
        return;
      }

      const campaign = await prisma.campaign.create({
        data: {
          organizationId: organization.id,
          title: req.body.title,
          description: req.body.description || null,
          date: req.body.date ? new Date(req.body.date) : null,
          location: req.body.location || null,
        },
      });

      res.status(201).json(campaign);
    } catch (error) {
      console.error('Create campaign error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        organization: {
          include: { user: { select: { name: true, walletAddress: true } } },
        },
        contributions: {
          include: {
            user: { select: { id: true, name: true, walletAddress: true } },
            votes: {
              include: { validator: { select: { id: true, name: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    res.json(campaign);
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put(
  '/:id',
  authenticate,
  requireRole('ORGANIZATION'),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const campaign = await prisma.campaign.findUnique({
        where: { id },
      });

      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      const organization = await prisma.organization.findUnique({
        where: { userId: req.user!.userId },
      });

      if (!organization || campaign.organizationId !== organization.id) {
        res.status(403).json({ error: 'Not authorized to update this campaign' });
        return;
      }

      const updated = await prisma.campaign.update({
        where: { id },
        data: {
          title: req.body.title ?? campaign.title,
          description: req.body.description ?? campaign.description,
          date: req.body.date ? new Date(req.body.date) : campaign.date,
          location: req.body.location ?? campaign.location,
          status: req.body.status ?? campaign.status,
        },
      });

      res.json(updated);
    } catch (error) {
      console.error('Update campaign error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.delete('/:id', authenticate, requireRole('ORGANIZATION'), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const campaign = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const organization = await prisma.organization.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!organization || campaign.organizationId !== organization.id) {
      res.status(403).json({ error: 'Not authorized to delete this campaign' });
      return;
    }

    await prisma.campaign.delete({ where: { id } });
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
