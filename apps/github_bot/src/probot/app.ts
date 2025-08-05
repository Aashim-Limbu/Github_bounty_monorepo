import { Context, Probot } from "probot";
import { createBounty, getBountyByIssueId } from "@repo/db/bounty";
import { prisma } from "@repo/db/prisma";
import { getWalletAddressByGithubId } from "@repo/db/user";

export default (app: Probot) => {
  app.on(
    "issue_comment.created",
    async (context: Context<"issue_comment.created">) => {
      const body = context.payload.comment.body;
      console.log("body: ", body);
      if (!body) return;
      const match = body.match(
        /\/bounty\s+([0-9]+(?:\.[0-9]+)?)\s+([a-zA-Z]+)/
      );
      if (match) {
        const amount = match[1];
        const token = match[2] as string;
        // database logic here
        /**
         * Create a new bounty for a GitHub issue.
         * @param issueId GitHub issue ID
         * @param repo Repository name
         * @param amount Bounty amount
         * @returns Created bounty object
         */
        if (!amount) return;
        const issueId = context.payload.issue.id;
        const repoName = context.payload.repository.name;
        try {
          const bounty = await createBounty(issueId, repoName, Number(amount));
          (console.log("Bounty Created: ", bounty),
            await context.octokit.issues.createComment(
              context.issue({
                body: `Bounty of ${amount} ${token.toUpperCase()} registered!`,
              })
            ));
        } catch (error) {
          console.error("Error while sending bounty", error);
        }
      }
    }
  );
  app.on("issues.opened", async (context: Context<"issues.opened">) => {
    const body = context.payload.issue.body;
    if (!body) return;
    const match = body.match(/\/bounty\s+([0-9]+(?:\.[0-9]+)?)\s+([a-zA-Z]+)/);
    if (match) {
      const amount = match[1];
      const token = match[2] as string; // ETH or DAI
      // database logic here
      await context.octokit.issues.createComment(
        context.issue({
          body: `Bounty of ${amount} ${token.toUpperCase()} registered!`,
        })
      );
    }
  });
  app.on(
    "pull_request.closed",
    async (context: Context<"pull_request.closed">) => {
      const pr = context.payload.pull_request;
      if (!pr.merged) return; // Only process merged PRs

      const contributor = pr.user.login;
      const merger = pr.merged_by?.login;

      // 1. Parse PR title or body for #<issueNumber>
      const title = pr.title || "";
      const body = pr.body || "";
      const match = title.match(/#(\d+)/) || body.match(/#(\d+)/);
      const issueNumber = match ? parseInt(match[1]!) : null;
      if (!issueNumber) {
        context.log.info("No issue number found in PR title/body.");
        await context.octokit.issues.createComment(
          context.issue({
            issue_number: pr.number,
            body: `✅ PR merged by @${merger}. Great work @${contributor}! (No bounty issue detected)`,
          })
        );
        return;
      }

      const { owner, repo } = context.repo();
      const issueResponse = await context.octokit.issues.get({
        owner,
        repo,
        issue_number: issueNumber,
      });
      const issueId = issueResponse.data.id;

      const bounty = await getBountyByIssueId(issueId);
      if (!bounty) {
        context.log.info(`No bounty found for issueId ${issueId}`);
        await context.octokit.issues.createComment(
          context.issue({
            issue_number: pr.number,
            body: `✅ PR merged by @${merger}. Great work @${contributor}! (No bounty found for referenced issue)`,
          })
        );
        return;
      }

      // 4. Release bounty (call smart contract, mark as claimed, etc.)
      // Example: call your smart contract and then mark as claimed in DB
      // NOTE: You must have the contributor's wallet address mapped somewhere,
      // e.g., in your database or as part of the bounty record!
      const recipientAddress =
        bounty.recipient || "<CONTRIBUTOR_WALLET_ADDRESS>";
      try {
        // Call your smart contract (pseudo-code, implement as needed)
        // const tx = await bountyContract.releaseBounty(issueId, recipientAddress);
        // await tx.wait();
        // await claimBounty(issueId, recipientAddress, tx.hash);

        context.log.info(
          `Bounty released for issueId ${issueId} to ${recipientAddress}`
        );
        await context.octokit.issues.createComment(
          context.issue({
            issue_number: pr.number,
            body: `✅ PR merged by @${merger}. Bounty released to ${recipientAddress}. Great work @${contributor}!`,
          })
        );
      } catch (error) {
        context.log.error("Bounty release failed", error);
        await context.octokit.issues.createComment(
          context.issue({
            issue_number: pr.number,
            body: `⚠️ PR merged by @${merger}. Bounty release failed. Please contact maintainers.`,
          })
        );
      }
    }
  );
  app.on(
    "pull_request.opened",
    async (context: Context<"pull_request.opened">) => {
      const pr = context.payload.pull_request;
      const contributor = pr.user.login;
      const title = pr.title || "";
      const match = title.match(/#(\d+)/);

      const issueNumber = match ? parseInt(match[1]!) : null;
      if (!issueNumber) throw new Error("Cannot parse the issue Number");
      const { owner, repo } = context.repo();
      const issueResponse = await context.octokit.issues.get({
        owner,
        repo,
        issue_number: issueNumber,
      });
      const issueId = issueResponse.data.id;
      const bounty = await getBountyByIssueId(issueId);
      const contributor_id = pr.user.id;
      console.log("contributor id: ", contributor_id);
      const wallet_address = await getWalletAddressByGithubId(
        `${contributor_id}`
      );
      console.log("Wallet Address: ", wallet_address);
      console.log("Bounty reached: ", bounty);
      console.log("Bounty to be released");
      await context.octokit.issues.createComment(
        context.issue({
          issue_number: pr.number,
          body: `👋 Thanks for the pull request, @${contributor}! Our maintainers will review it shortly.`,
        })
      );
    }
  );
};
