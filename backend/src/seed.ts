import dotenv from 'dotenv';
dotenv.config();

import prisma from './services/prisma';
import { v4 as uuidv4 } from 'uuid';

async function main() {
  console.log('Seeding database...');

  await prisma.proposalVote.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.validatorAssignment.deleteMany();
  await prisma.contribution.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      id: uuidv4(),
      walletAddress: '0x1111111111111111111111111111111111111111',
      did: uuidv4(),
      name: 'Admin User',
      email: 'admin@civicchain.io',
      role: 'ADMIN',
      isVerified: true,
      badge: 'admin',
    },
  });
  console.log(`Created admin: ${admin.name}`);

  const org1 = await prisma.user.create({
    data: {
      id: uuidv4(),
      walletAddress: '0x2222222222222222222222222222222222222222',
      did: uuidv4(),
      name: 'Green Earth Org',
      email: 'contact@greenearth.org',
      role: 'ORGANIZATION',
      isVerified: true,
      badge: 'organization',
    },
  });

  const org2 = await prisma.user.create({
    data: {
      id: uuidv4(),
      walletAddress: '0x3333333333333333333333333333333333333333',
      did: uuidv4(),
      name: 'Tech For Good',
      email: 'hello@techforgood.io',
      role: 'ORGANIZATION',
      isVerified: true,
      badge: 'organization',
    },
  });

  const orgProfile1 = await prisma.organization.create({
    data: {
      name: 'Green Earth Organization',
      description: 'Environmental conservation and sustainability initiatives',
      walletAddress: org1.walletAddress,
      userId: org1.id,
    },
  });

  const orgProfile2 = await prisma.organization.create({
    data: {
      name: 'Tech For Good Foundation',
      description: 'Leveraging technology for social impact',
      walletAddress: org2.walletAddress,
      userId: org2.id,
    },
  });
  console.log('Created organizations');

  const volunteersData = [
    { name: 'Alice Johnson', wallet: '0x4444444444444444444444444444444444444444' },
    { name: 'Bob Smith', wallet: '0x5555555555555555555555555555555555555555' },
    { name: 'Charlie Brown', wallet: '0x6666666666666666666666666666666666666666' },
    { name: 'Diana Prince', wallet: '0x7777777777777777777777777777777777777777' },
    { name: 'Eve Davis', wallet: '0x8888888888888888888888888888888888888888' },
  ];

  const volunteers: any[] = [];
  for (const v of volunteersData) {
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        walletAddress: v.wallet,
        did: uuidv4(),
        name: v.name,
        role: 'VOLUNTEER',
        isVerified: true,
        badge: 'volunteer',
      },
    });
    volunteers.push(user);
  }
  console.log('Created volunteers');

  const validatorsData = [
    { name: 'Frank Castle', wallet: '0x9999999999999999999999999999999999999999' },
    { name: 'Grace Hopper', wallet: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
  ];

  const validators: any[] = [];
  for (const v of validatorsData) {
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        walletAddress: v.wallet,
        did: uuidv4(),
        name: v.name,
        role: 'VALIDATOR',
        isVerified: true,
        badge: 'validator',
      },
    });
    validators.push(user);
  }
  console.log('Created validators');

  const campaign1 = await prisma.campaign.create({
    data: {
      title: 'Beach Cleanup Drive',
      description: 'Help clean the local beach and preserve marine life',
      date: new Date('2026-08-15'),
      location: 'Santa Monica Beach',
      organizationId: orgProfile1.id,
      status: 'ACTIVE',
    },
  });

  const campaign2 = await prisma.campaign.create({
    data: {
      title: 'Code for Community',
      description: 'Build open-source tools for local nonprofits',
      date: new Date('2026-09-01'),
      location: 'Downtown Tech Hub',
      organizationId: orgProfile2.id,
      status: 'ACTIVE',
    },
  });

  const campaign3 = await prisma.campaign.create({
    data: {
      title: 'Tree Planting Initiative',
      description: 'Plant 1000 trees across the city',
      date: new Date('2026-07-20'),
      location: 'City Park',
      organizationId: orgProfile1.id,
      status: 'COMPLETED',
    },
  });
  console.log('Created campaigns');

  const contribution1 = await prisma.contribution.create({
    data: {
      campaignId: campaign1.id,
      userId: volunteers[0].id,
      hours: 4.5,
      description: 'Collected trash from the north shore',
      proofUrl: uuidv4(),
      status: 'APPROVED',
    },
  });

  const contribution2 = await prisma.contribution.create({
    data: {
      campaignId: campaign1.id,
      userId: volunteers[1].id,
      hours: 3.0,
      description: 'Helped sort recyclable materials',
      proofUrl: uuidv4(),
      status: 'APPROVED',
    },
  });

  const contribution3 = await prisma.contribution.create({
    data: {
      campaignId: campaign2.id,
      userId: volunteers[2].id,
      hours: 6.0,
      description: 'Developed the donation tracking module',
      proofUrl: uuidv4(),
      status: 'PENDING',
    },
  });

  const contribution4 = await prisma.contribution.create({
    data: {
      campaignId: campaign3.id,
      userId: volunteers[3].id,
      hours: 5.0,
      description: 'Planted 50 trees in the eastern sector',
      proofUrl: uuidv4(),
      status: 'APPROVED',
    },
  });

  const contribution5 = await prisma.contribution.create({
    data: {
      campaignId: campaign3.id,
      userId: volunteers[4].id,
      hours: 2.5,
      description: 'Watered and mulched newly planted trees',
      proofUrl: uuidv4(),
      status: 'APPROVED',
    },
  });
  console.log('Created contributions');

  for (const contribution of [contribution1, contribution2, contribution4, contribution5]) {
    for (const validator of validators) {
      await prisma.validatorAssignment.create({
        data: {
          contributionId: contribution.id,
          validatorId: validator.id,
        },
      });
    }
  }

  for (const contribution of [contribution1, contribution2, contribution4]) {
    for (const validator of validators) {
      await prisma.vote.create({
        data: {
          contributionId: contribution.id,
          validatorId: validator.id,
          vote: 'APPROVE',
        },
      });
    }
  }

  const proposal = await prisma.proposal.create({
    data: {
      title: 'Increase Validator Reward',
      description: 'Proposal to increase validator rewards from 1% to 2% per validation',
      createdById: admin.id,
      status: 'ACTIVE',
      endDate: new Date('2026-12-31'),
    },
  });

  for (const volunteer of volunteers.slice(0, 3)) {
    await prisma.proposalVote.create({
      data: {
        proposalId: proposal.id,
        userId: volunteer.id,
        vote: 'FOR',
      },
    });
  }

  for (const validator of validators) {
    await prisma.proposalVote.create({
      data: {
        proposalId: proposal.id,
        userId: validator.id,
        vote: 'FOR',
      },
    });
  }

  console.log('Created votes and assignments');
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
