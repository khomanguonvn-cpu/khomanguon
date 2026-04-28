import crypto from "crypto";

export function generateOtpCode() {
  return String(100000 + crypto.randomInt(900000));
}

export function hashOtp(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export function isExpired(isoDate: string) {
  return new Date(isoDate).getTime() < Date.now();
}
