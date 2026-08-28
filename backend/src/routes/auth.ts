import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../services/prisma';
import { generateToken } from '../utils/jwt';
import { verifySignature } from '../utils/signature';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AuthRequest } from '../types';

const router = Router();

router.post(
  '/connect-wallet',
  validate([
    { field: 'walletAddress', type: 'string', required: true },
    { field: 'signature', type: 'string', required: true },
    { field: 'message', type: 'string', required: true },
  ]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { walletAddress, signature, message } = req.body;

      const isValid = verifySignature(message, signature, walletAddress);
      if (!isValid) {
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      let user = await prisma.user.findUnique({ where: { walletAddress } });

      if (!user) {
        const did = uuidv4();
        user = await prisma.user.create({
          data: {
            walletAddress,
            did,
            name: null,
            email: null,
            role: 'VOLUNTEER',
          },
        });
      }

      const token = generateToken({ id: user.id, walletAddress: user.walletAddress, role: user.role });

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        token,
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          did: user.did,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          badge: user.badge,
        },
      });
    } catch (error) {
      console.error('Connect wallet error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        organization: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      walletAddress: user.walletAddress,
      did: user.did,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      badge: user.badge,
      organization: user.organization,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (_req: AuthRequest, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

export default router;
