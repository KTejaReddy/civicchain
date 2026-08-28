import prisma from './prisma';

export async function assignValidators(contributionId: string): Promise<void> {
  const validators = await prisma.user.findMany({
    where: {
      role: 'VALIDATOR',
      isVerified: true,
    },
  });

  const shuffled = validators.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 5);

  for (const validator of selected) {
    await prisma.validatorAssignment.create({
      data: {
        contributionId,
        validatorId: validator.id,
      },
    });
  }
}

export async function checkConsensus(contributionId: string): Promise<void> {
  const contribution = await prisma.contribution.findUnique({
    where: { id: contributionId },
    include: {
      votes: true,
      validatorAssignments: true,
    },
  });

  if (!contribution) return;

  const approveCount = contribution.votes.filter((v) => v.vote === 'APPROVE').length;
  const totalVotes = contribution.votes.length;
  const totalAssignments = contribution.validatorAssignments.length;

  if (approveCount >= 3) {
    await prisma.contribution.update({
      where: { id: contributionId },
      data: { status: 'APPROVED' },
    });
  } else if (totalVotes >= totalAssignments && totalAssignments > 0) {
    const allRejected = contribution.votes.every((v) => v.vote === 'REJECT');
    if (allRejected || totalVotes === totalAssignments) {
      await prisma.contribution.update({
        where: { id: contributionId },
        data: { status: 'REJECTED' },
      });
    }
  }
}
