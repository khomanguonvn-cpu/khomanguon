import NextAuth, { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";

const normalizeRole = (role: unknown) => String(role ?? "user").trim().toLowerCase();

// Custom logger to suppress CredentialsSignin error spam in production
const logger = {
  error: (error: Error) => {
    // Suppress CredentialsSignin errors in production (normal when wrong password)
    if (error.message === "CredentialsSignin" && process.env.NODE_ENV === "production") {
      return;
    }
    console.error("[auth][error]", error);
  },
  warn: (code: string, ...message: unknown[]) => {
    console.warn(`[auth][warn] ${code}`, ...message);
  },
  debug: (code: string, ...message: unknown[]) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[auth][debug] ${code}`, ...message);
    }
  },
};

export const baseAuthConfig: NextAuthConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-local-secret-change-me",
  session: { strategy: "jwt" },
  logger,
  pages: {
    signIn: "/signin",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "").trim().toLowerCase();
        const password = String(credentials?.password || "");

        if (!email || !password) {
          return null;
        }

        const found = await db.select().from(users).where(eq(users.email, email));
        const user = found[0];

        if (!user) {
          return null;
        }

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
          return null;
        }

        if (!user.emailVerified) {
          throw new Error("EmailNotVerified");
        }

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: normalizeRole(user.role),
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = normalizeRole((user as any).role);
      }

      const tokenEmail = String(token.email || "").trim().toLowerCase();
      if (tokenEmail) {
        try {
          const found = await db
            .select({ id: users.id, role: users.role })
            .from(users)
            .where(eq(users.email, tokenEmail));

          const dbUser = found[0];
          if (dbUser) {
            token.id = String(dbUser.id);
            token.role = normalizeRole(dbUser.role);
          }
        } catch {}
      }

      if (!token.role) {
        token.role = "user";
      } else {
        token.role = normalizeRole(token.role);
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
    async signIn({ user, account }) {
      if (!account || account.provider === "credentials") {
        return true;
      }

      const email = String(user.email || "").trim().toLowerCase();
      if (!email) return false;

      const existed = await db.select().from(users).where(eq(users.email, email));
      if (existed.length === 0) {
        const now = new Date().toISOString();
        await db.insert(users).values({
          name: user.name || email.split("@")[0],
          email,
          password: "oauth-login",
          role: "user",
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        });
      }

      return true;
    },
  },
};

const { auth, handlers, signIn, signOut } = NextAuth(baseAuthConfig);

export default auth as (typeof auth);

export { auth, handlers, signIn, signOut };
