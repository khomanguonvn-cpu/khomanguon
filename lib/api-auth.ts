import auth from "@/auth";

type SessionUser = {
  id: string;
  email?: string | null;
  role?: string | null;
};

const normalizeRole = (role?: string | null) => String(role ?? "user").trim().toLowerCase();

export async function requireSessionUser() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user?.id) {
    return null;
  }

  return {
    ...user,
    role: normalizeRole(user.role),
  };
}

export async function requireAdminUser() {
  const user = await requireSessionUser();

  if (!user) {
    return null;
  }

  if (normalizeRole(user.role) !== "admin") {
    return null;
  }

  return user;
}
