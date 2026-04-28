
import { NextRequest } from "next/server";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import { baseAuthConfig } from "@/auth";
import { getOAuthConfig } from "@/lib/oauth-config";

async function createDynamicHandlers(req: NextRequest) {
  const dynamicConfig = await getOAuthConfig();

  const customConfig = {
    ...baseAuthConfig,
    providers: [
      Google({
        clientId: dynamicConfig.googleClientId,
        clientSecret: dynamicConfig.googleClientSecret,
      }),
      Facebook({
        clientId: dynamicConfig.facebookClientId,
        clientSecret: dynamicConfig.facebookClientSecret,
      }),
      ...(baseAuthConfig.providers?.filter(
        (p: any) => typeof p === "function" ? p.id === "credentials" : p.id === "credentials"
      ) || []),
    ],
  };

  return NextAuth(customConfig).handlers;
}

export const GET = async (req: NextRequest) => {
  const handlers = await createDynamicHandlers(req);
  return handlers.GET(req);
};

export const POST = async (req: NextRequest) => {
  const handlers = await createDynamicHandlers(req);
  return handlers.POST(req);
};
