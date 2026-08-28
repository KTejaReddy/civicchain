import { Router, Response } from 'express';
import prisma from '../services/prisma';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AuthRequest } from '../types';

const router = Router();

router.post(
  '/',
  authenticate,
  validate([
    { field: 'title', type: 'string', required: true, min: 3, max: 200 },
    { field: 'description', type: 'string', required: false },
  ]),
  async (req: AuthRequest, res: Response) => {
    try {
      const proposal = await prisma.proposal.create({
        data: {
          title: req.body.title,
          description: req.body.description || null,
          createdById: req.user!.userId,
          endDate: req.body.endDate ? new Date(req.body.endDate) : null,
        },
      });

      res.status(201).json(proposal);
    } catch (error) {
      console.error('Create proposal error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [proposals, total] = await Promise.all([
      prisma.proposal.findMany({
        skip,
        take: limit,
        include: {
          createdBy: { select: { id: true, name: true, walletAddress: true } },
          _count: { select: { proposalVotes: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.proposal.count(),
    ]);

    res.json({
      proposals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List proposals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/vote', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const proposalId = req.params.id as string;
    const { vote } = req.body;

    if (!['FOR', 'AGAINST'].includes(vote)) {
      res.status(400).json({ error: 'Vote must be FOR or AGAINST' });
      return;
    }

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) {
      res.status(404).json({ error: 'Proposal not found' });
      return;
    }

    if (proposal.status !== 'ACTIVE') {
      res.status(400).json({ error: 'Proposal is not active' });
      return;
    }

    if (proposal.endDate && new Date() > proposal.endDate) {
      await prisma.proposal.update({
        where: { id: proposal.id },
        data: { status: 'REJECTED' },
      });
      res.status(400).json({ error: 'Proposal voting period has ended' });
      return;
    }

    const existingVote = await prisma.proposalVote.findUnique({
      where: {
        proposalId_userId: {
          proposalId,
          userId: req.user!.userId,
        },
      },
    });

    if (existingVote) {
      res.status(400).json({ error: 'You have already voted on this proposal' });
      return;
    }

    const proposalVote = await prisma.proposalVote.create({
      data: {
        proposalId,
        userId: req.user!.userId,
        vote: vote as 'FOR' | 'AGAINST',
      },
    });

    res.status(201).json(proposalVote);
  } catch (error) {
    console.error('Vote on proposal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/execute', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        proposalVotes: true,
      },
    });

    if (!proposal) {
      res.status(404).json({ error: 'Proposal not found' });
      return;
    }

    if (proposal.status !== 'APPROVED') {
      res.status(400).json({ error: 'Proposal must be approved before execution' });
      return;
    }

    const updated = await prisma.proposal.update({
      where: { id },
      data: { status: 'EXECUTED' },
    });

    res.json({ message: 'Proposal executed successfully', proposal: updated });
  } catch (error) {
    console.error('Execute proposal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
