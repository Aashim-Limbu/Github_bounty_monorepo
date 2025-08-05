import { prisma } from "../index";

/**
 * Get wallet address from GitHub providerAccountId (GitHub numeric ID as string).
 *
 * @param providerAccountId - GitHub user ID as string (from PR event payload).
 * @returns walletAddress (string) or null if not found
 */
export async function getWalletAddressByGithubId(
  providerAccountId: string
): Promise<string | null> {
  // Find the Account record for this GitHub user
  const account = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: "github",
        providerAccountId,
      },
    },
    include: {
      user: {
        include: {
          Profile: true,
        },
      },
    },
  });
  console.log(account)
  return account?.user?.Profile?.walletAddress ?? null;
}
