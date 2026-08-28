import { Router, Response } from 'express';
import prisma from '../services/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { checkConsensus } from '../services/consensus';
import { AuthRequest } from '../types';

const router = Router();

router.post(
  '/',
  authenticate,
  requireRole('VALIDATOR'),
  validate([
    { field: 'contributionId', type: 'string', required: true },
    { field: 'vote', type: 'string', required: true },
    { field: 'comment', type: 'string', required: false },
  ]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { contributionId, vote, comment } = req.body;

      if (!['APPROVE', 'REJECT'].includes(vote)) {
        res.status(400).json({ error: 'Vote must be APPROVE or REJECT' });
        return;
      }

      const assignment = await prisma.validatorAssignment.findUnique({
        where: {
          contributionId_validatorId: {
            contributionId,
            validatorId: req.user!.userId,
          },
        },
      });

      if (!assignment) {
        res.status(403).json({ error: 'You are not assigned to validate this contribution' });
        return;
      }

      const existingVote = await prisma.vote.findUnique({
        where: {
          contributionId_validatorId: {
            contributionId,
            validatorId: req.user!.userId,
          },
        },
      });

      if (existingVote) {
        res.status(400).json({ error: 'You have already voted on this contribution' });
        return;
      }

      const newVote = await prisma.vote.create({
        data: {
          contributionId,
          validatorId: req.user!.userId,
          vote: vote as 'APPROVE' | 'REJECT',
          comment: comment || null,
        },
      });

      await checkConsensus(contributionId);

      res.status(201).json(newVote);
    } catch (error) {
      console.error('Submit vote error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.get('/pending', authenticate, requireRole('VALIDATOR'), async (req: AuthRequest, res: Response) => {
  try {
    const pendingAssignments = await prisma.validatorAssignment.findMany({
      where: {
        validatorId: req.user!.userId,
        contribution: {
          status: 'PENDING',
        },
      },
      include: {
        contribution: {
          include: {
            user: { select: { id: true, name: true, walletAddress: true } },
            campaign: { select: { id: true, title: true } },
            votes: true,
          },
        },
      },
    });

    const pending = pendingAssignments
      .filter((a) => {
        return !a.contribution.votes.some((v) => v.validatorId === req.user!.userId);
      })
      .map((a) => a.contribution);

    res.json(pending);
  } catch (error) {
    console.error('Get pending votes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
