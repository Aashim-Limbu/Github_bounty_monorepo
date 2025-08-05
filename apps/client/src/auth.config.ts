import GitHub from "next-auth/providers/github";
import type { NextAuthConfig } from "next-auth";
// Any prisma implementation is not supported since it not tied to edge runtime.
export default {
  providers: [GitHub],
} satisfies NextAuthConfig;
