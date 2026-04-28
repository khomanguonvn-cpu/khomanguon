import crypto from "crypto";

export type SellerAccountCredential = {
  id: string;
  accountType: string;
  username: string;
  password: string;
  note?: string;
};

export type SellerSourceDownload = {
  id: string;
  label: string;
  url: string;
  note?: string;
  passwordHint?: string;
};

export type SellerSecureDelivery = {
  accountCredentials: SellerAccountCredential[];
  sourceDownloads: SellerSourceDownload[];
};

const EMPTY_SECURE_DELIVERY: SellerSecureDelivery = {
  accountCredentials: [],
  sourceDownloads: [],
};

function normalizeText(value: unknown, maxLength = 500) {
  return String(value || "").trim().slice(0, maxLength);
}

function normalizeId(value: unknown) {
  const input = normalizeText(value, 80);
  if (input) {
    return input;
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeSellerSecureDelivery(input: unknown): SellerSecureDelivery {
  const raw = (input || {}) as Partial<SellerSecureDelivery>;
  const accountCredentialsRaw = Array.isArray(raw.accountCredentials) ? raw.accountCredentials : [];
  const sourceDownloadsRaw = Array.isArray(raw.sourceDownloads) ? raw.sourceDownloads : [];

  const accountCredentials = accountCredentialsRaw
    .map((item) => ({
      id: normalizeId(item?.id),
      accountType: normalizeText(item?.accountType, 120),
      username: normalizeText(item?.username, 200),
      password: normalizeText(item?.password, 200),
      note: normalizeText(item?.note, 500),
    }))
    .filter((item) => item.accountType && item.username && item.password)
    .slice(0, 500);

  const sourceDownloads = sourceDownloadsRaw
    .map((item) => ({
      id: normalizeId(item?.id),
      label: normalizeText(item?.label, 120),
      url: normalizeText(item?.url, 2000),
      note: normalizeText(item?.note, 500),
      passwordHint: normalizeText(item?.passwordHint, 200),
    }))
    .filter((item) => item.label && item.url)
    .slice(0, 500);

  return {
    accountCredentials,
    sourceDownloads,
  };
}

export function hasSecureDeliveryData(data: SellerSecureDelivery) {
  return data.accountCredentials.length > 0 || data.sourceDownloads.length > 0;
}

function getEncryptionSecret() {
  const secret =
    process.env.SELLER_DELIVERY_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "";
  return String(secret).trim();
}

function getEncryptionKey() {
  const secret = getEncryptionSecret();
  if (!secret) {
    return null;
  }
  return crypto.createHash("sha256").update(secret).digest();
}

function toBase64Url(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  return Buffer.from(padded, "base64");
}

export function encryptSellerSecureDelivery(input: unknown) {
  const normalized = normalizeSellerSecureDelivery(input);
  if (!hasSecureDeliveryData(normalized)) {
    return "";
  }

  const key = getEncryptionKey();
  if (!key) {
    return "";
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(normalized), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${toBase64Url(iv)}.${toBase64Url(tag)}.${toBase64Url(encrypted)}`;
}

export function decryptSellerSecureDelivery(value: unknown): SellerSecureDelivery {
  const token = String(value || "").trim();
  if (!token) {
    return { ...EMPTY_SECURE_DELIVERY };
  }

  const key = getEncryptionKey();
  if (!key) {
    return { ...EMPTY_SECURE_DELIVERY };
  }

  try {
    const [ivPart, tagPart, dataPart] = token.split(".");
    if (!ivPart || !tagPart || !dataPart) {
      return { ...EMPTY_SECURE_DELIVERY };
    }

    const iv = fromBase64Url(ivPart);
    const tag = fromBase64Url(tagPart);
    const encrypted = fromBase64Url(dataPart);

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    const parsed = JSON.parse(decrypted.toString("utf8"));
    return normalizeSellerSecureDelivery(parsed);
  } catch {
    return { ...EMPTY_SECURE_DELIVERY };
  }
}
