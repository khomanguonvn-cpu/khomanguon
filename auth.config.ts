import type { NextAuthConfig } from "next-auth";

const normalizeRole = (role: unknown) => String(role ?? "user").trim().toLowerCase();

export default {
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-local-secret-change-me",
  session: { strategy: "jwt" },
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async authorized({ auth, request }) {
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = normalizeRole((user as any).role);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = String(token.id || "");
        (session.user as any).role = normalizeRole(token.role);
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
