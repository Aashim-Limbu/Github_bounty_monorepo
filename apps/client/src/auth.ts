import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import { prisma } from "@repo/db/prisma";
import authConfig from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),

  // 🟢 Tells NextAuth to use JWT-based sessions, not DB sessions
  session: { strategy: "jwt" },

  // 🔄 Runs when an OAuth account is linked to a user
  events: {
    async linkAccount({ user }) {
      // ✅ Manually marks email as verified when account is linked
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },

  callbacks: {
    // 📤 Adds `user.id` from JWT to the session object on the client
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      return session;
    },

    // 🔁 You could inject extra user data into the JWT here if needed
    async jwt({ token }) {
      return token;
    },
  },

  // 🧩 External config, likely includes `providers: [GitHubProvider(...)]`
  ...authConfig,
});
