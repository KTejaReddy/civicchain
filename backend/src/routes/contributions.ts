import { Router, Response } from 'express';
import multer from 'multer';
import prisma from '../services/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { uploadToIPFS } from '../services/ipfs';
import { assignValidators } from '../services/consensus';
import { AuthRequest } from '../types';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.post(
  '/',
  authenticate,
  requireRole('VOLUNTEER'),
  upload.single('proof'),
  validate([
    { field: 'campaignId', type: 'string', required: true },
    { field: 'hours', type: 'number', required: true, min: 0 },
    { field: 'description', type: 'string', required: false },
    { field: 'location', type: 'string', required: false },
  ]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { campaignId, hours, description, location } = req.body;

      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      if (campaign.status !== 'ACTIVE') {
        res.status(400).json({ error: 'Campaign is not active' });
        return;
      }

      let proofUrl: string | null = null;
      if (req.file) {
        proofUrl = await uploadToIPFS(req.file);
      }

      const contribution = await prisma.contribution.create({
        data: {
          campaignId,
          userId: req.user!.userId,
          hours: parseFloat(hours),
          description: description || null,
          proofUrl,
          location: location || null,
          status: 'PENDING',
        },
      });

      await assignValidators(contribution.id);

      res.status(201).json(contribution);
    } catch (error) {
      console.error('Submit contribution error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.userId) where.userId = req.query.userId;
    if (req.query.campaignId) where.campaignId = req.query.campaignId;

    const [contributions, total] = await Promise.all([
      prisma.contribution.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, walletAddress: true } },
          campaign: { select: { id: true, title: true } },
          _count: { select: { votes: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contribution.count({ where }),
    ]);

    res.json({
      contributions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List contributions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const contribution = await prisma.contribution.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, walletAddress: true } },
        campaign: true,
        votes: {
          include: { validator: { select: { id: true, name: true } } },
        },
        validatorAssignments: {
          include: { validator: { select: { id: true, name: true } } },
        },
      },
    });

    if (!contribution) {
      res.status(404).json({ error: 'Contribution not found' });
      return;
    }

    res.json(contribution);
  } catch (error) {
    console.error('Get contribution error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
