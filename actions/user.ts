import { eq } from "drizzle-orm";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { db } from "@/lib/db";
import { sellerProfiles, userBankAccounts, users } from "@/lib/schema";

export async function getUserById(id: string | undefined): Promise<any> {
  try {
    if (!id) {
      return null;
    }

    const userId = Number(id);
    if (!Number.isFinite(userId)) {
      return null;
    }

    await ensureDatabaseReady();

    const userRows = await db.select().from(users).where(eq(users.id, userId));
    const found = userRows[0];

    if (!found) {
      return null;
    }

    const sellerRows = await db
      .select()
      .from(sellerProfiles)
      .where(eq(sellerProfiles.userId, found.id));

    const bankRows = await db
      .select({
        id: userBankAccounts.id,
        bankName: userBankAccounts.bankName,
        bankAccount: userBankAccounts.bankAccount,
        bankAccountHolder: userBankAccounts.bankAccountHolder,
        isDefault: userBankAccounts.isDefault,
      })
      .from(userBankAccounts)
      .where(eq(userBankAccounts.userId, found.id));

    const seller = sellerRows[0] || null;
    const rawStatus = String(seller?.kycStatus || "").toLowerCase();

    let sellerStatus: "not_submitted" | "pending" | "approved" | "rejected" = "not_submitted";
    if (rawStatus === "verified" || rawStatus === "approved") {
      sellerStatus = "approved";
    } else if (rawStatus === "pending") {
      sellerStatus = "pending";
    } else if (rawStatus === "rejected") {
      sellerStatus = "rejected";
    }

    return {
      _id: String(found.id),
      name: found.name,
      email: found.email,
      image: "",
      role: String(found.role || "user").trim().toLowerCase(),
      emailVerified: Boolean(found.emailVerified),
      bankInfo: {
        bankName: found.bankName || "",
        bankAccount: found.bankAccount || "",
        bankAccountHolder: found.bankAccountHolder || "",
        isConfigured: Boolean(found.bankName && found.bankAccount && found.bankAccountHolder),
      },
      bankAccounts: bankRows.map((item) => ({
        id: String(item.id),
        bankName: item.bankName,
        bankAccount: item.bankAccount,
        bankAccountHolder: item.bankAccountHolder,
        isDefault: Boolean(item.isDefault),
      })),
      sellerVerification: {
        hasSellerAccount: Boolean(seller),
        status: sellerStatus,
        isVerified: sellerStatus === "approved",
        showWarning: sellerStatus !== "approved",
      },
      address: [],
    };
  } catch {
    return null;
  }
}
