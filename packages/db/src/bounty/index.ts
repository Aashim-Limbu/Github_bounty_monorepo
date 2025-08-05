import { Prisma } from "../generated/prisma";
import { prisma } from "../index";

/**
 * Create a new bounty for a GitHub issue.
 * @param issueId GitHub issue ID
 * @param repo Repository name
 * @param amount Bounty amount
 * @returns Created bounty object
 */
export async function createBounty(
  issueId: number,
  repo: string,
  amount: number
): Promise<Prisma.BountyCreateInput> {
  try {
    // Check if bounty already exists
    const existing = await prisma.bounty.findUnique({ where: { issueId } });
    if (existing) {
      throw new Error("Bounty already exists for this issue.");
    }
    const bounty = await prisma.bounty.create({
      data: { issueId, repo, amount },
    });
    return bounty;
  } catch (err: any) {
    throw new Error(`Failed to create bounty: ${err.message}`);
  }
}

/**
 * Mark bounty as claimed and fill txHash and recipient.
 * @param issueId GitHub issue ID
 * @param recipient Wallet address of recipient
 * @param paidTxHash Transaction hash of payout
 * @returns Updated bounty object
 */
export async function claimBounty(
  issueId: number,
  recipient: string,
  paidTxHash: string
) {
  try {
    const bounty = await prisma.bounty.findUnique({ where: { issueId } });
    if (!bounty) {
      throw new Error("No bounty found for this issue.");
    }
    if (bounty.claimed) {
      throw new Error("Bounty already claimed.");
    }
    const updated = await prisma.bounty.update({
      where: { issueId },
      data: {
        recipient,
        paidTxHash,
        claimed: true,
      },
    });
    return updated;
  } catch (err: any) {
    throw new Error(`Failed to claim bounty: ${err.message}`);
  }
}

export async function getBountyByIssueId(
  issueId: number
): Promise<Prisma.BountyCreateInput | null> {
  try {
    const bounty = await prisma.bounty.findUnique({ where: { issueId } });
    return bounty;
  } catch (err: any) {
    throw new Error(`Failed to get bounty: ${err.message}`);
  }
}
