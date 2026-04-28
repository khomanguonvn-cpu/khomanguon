import crypto from "crypto";
import { getPayOSConfig } from "@/lib/payos-config";

type PayOSItem = {
  name: string;
  quantity: number;
  price: number;
};

type CreatePaymentLinkPayload = {
  orderCode: number;
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  items?: PayOSItem[];
};

type PayOSCreateResult = {
  checkoutUrl?: string;
  paymentLinkId?: string;
  [key: string]: unknown;
};

type PayOSResponseShape = {
  code?: string | number;
  desc?: string;
  message?: string;
  data?: PayOSCreateResult | null;
  [key: string]: unknown;
};

type FetchWithRetryOptions = {
  timeoutMs: number;
  retries: number;
  retryDelayMs: number;
};

type CircuitBreakerState = {
  failureCount: number;
  openedAt: number | null;
  openedCount: number;
  lastFailureAt: number | null;
};

const breakerState: CircuitBreakerState = {
  failureCount: 0,
  openedAt: null,
  openedCount: 0,
  lastFailureAt: null,
};

const BREAKER_FAILURE_THRESHOLD = 3;
const BREAKER_OPEN_MS = 15_000;

function isCircuitOpen() {
  if (!breakerState.openedAt) {
    return false;
  }

  const elapsed = Date.now() - breakerState.openedAt;
  if (elapsed > BREAKER_OPEN_MS) {
    breakerState.openedAt = null;
    breakerState.failureCount = 0;
    return false;
  }

  return true;
}

function registerFailure() {
  breakerState.failureCount += 1;
  breakerState.lastFailureAt = Date.now();

  if (breakerState.failureCount >= BREAKER_FAILURE_THRESHOLD) {
    breakerState.openedAt = Date.now();
    breakerState.openedCount += 1;
    console.warn("[PayOS][CircuitBreaker] OPEN", {
      openedCount: breakerState.openedCount,
      failureCount: breakerState.failureCount,
      openedAt: breakerState.openedAt,
    });
  }
}

function registerSuccess() {
  breakerState.failureCount = 0;
  breakerState.openedAt = null;
}

export function getPayOSCircuitBreakerSnapshot() {
  return {
    failureCount: breakerState.failureCount,
    openedAt: breakerState.openedAt,
    openedCount: breakerState.openedCount,
    lastFailureAt: breakerState.lastFailureAt,
    isOpen: isCircuitOpen(),
  };
}

function getPayOSHeaders({
  clientId,
  apiKey,
}: {
  clientId: string;
  apiKey: string;
}) {
  return {
    "Content-Type": "application/json",
    "x-client-id": clientId,
    "x-api-key": apiKey,
  };
}

function toSignableValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function normalizePayloadForSignature(payload: Record<string, unknown>) {
  return Object.keys(payload)
    .filter((key) => key !== "signature" && key !== "checksum")
    .sort()
    .map((key) => `${key}=${toSignableValue(payload[key])}`)
    .join("&");
}

function normalizeDescription(raw: string, orderCode: number) {
  const description = String(raw || "")
    .replace(/[^a-zA-Z0-9\s#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!description) {
    return `ORDER-${orderCode}`;
  }

  return description.slice(0, 25);
}

function buildCreatePaymentSignature(
  payload: {
    amount: number;
    cancelUrl: string;
    description: string;
    orderCode: number;
    returnUrl: string;
  },
  checksumKey: string
) {
  const signData = [
    `amount=${payload.amount}`,
    `cancelUrl=${payload.cancelUrl}`,
    `description=${payload.description}`,
    `orderCode=${payload.orderCode}`,
    `returnUrl=${payload.returnUrl}`,
  ].join("&");

  console.log("[PayOS] Signature debug:", {
    signData,
    checksumKeyLength: checksumKey.length,
    checksumKeyPrefix: checksumKey.slice(0, 8) + "...",
  });

  return crypto.createHmac("sha256", checksumKey).update(signData).digest("hex");
}

function normalizeCreatePaymentPayload(payload: CreatePaymentLinkPayload, checksumKey: string) {
  const orderCode = Number(payload.orderCode);
  const amount = Math.max(1, Math.round(Number(payload.amount || 0)));
  const description = normalizeDescription(payload.description, orderCode);
  const cancelUrl = String(payload.cancelUrl || "").trim();
  const returnUrl = String(payload.returnUrl || "").trim();
  const safeItems = Array.isArray(payload.items) && payload.items.length > 0
    ? payload.items
        .map((item) => ({
          name: normalizeDescription(String(item.name || "Sản phẩm"), orderCode),
          quantity: Math.max(1, Math.round(Number(item.quantity || 1))),
          price: Math.max(1, Math.round(Number(item.price || amount))),
        }))
        .slice(0, 100)
    : [
        {
          name: description,
          quantity: 1,
          price: amount,
        },
      ];

  const base = {
    orderCode,
    amount,
    description,
    cancelUrl,
    returnUrl,
    items: safeItems,
  };

  const signature = buildCreatePaymentSignature(base, checksumKey.trim());
  return {
    ...base,
    signature,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(status: number) {
  return status === 408 || status === 429 || status >= 500;
}

async function fetchWithRetry(
  input: RequestInfo | URL,
  init: RequestInit,
  options: FetchWithRetryOptions
) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= options.retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!shouldRetry(response.status) || attempt === options.retries) {
        return response;
      }

      await sleep(options.retryDelayMs * (attempt + 1));
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;

      if (attempt === options.retries) {
        throw error;
      }

      await sleep(options.retryDelayMs * (attempt + 1));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("PayOS request failed after retries");
}

export async function verifyPayOSWebhookSignature(
  payload: Record<string, unknown>,
  signature?: string | null
) {
  const payosConfig = await getPayOSConfig();
  const checksumKey = payosConfig.checksumKey;

  if (!checksumKey) {
    return false;
  }

  if (!signature) {
    return false;
  }

  const signData = normalizePayloadForSignature(payload);
  const expected = crypto
    .createHmac("sha256", checksumKey)
    .update(signData)
    .digest("hex");

  return expected === signature;
}

function resolvePayOSError(json: PayOSResponseShape, status: number) {
  const code = String(json?.code ?? "").trim();
  const desc = String(json?.desc || json?.message || "").trim();

  if (!code && !desc) {
    return `PayOS HTTP ${status}`;
  }

  if (!desc) {
    return `PayOS code ${code}`;
  }

  return code ? `[${code}] ${desc}` : desc;
}

export async function createPayOSPaymentLink(payload: CreatePaymentLinkPayload) {
  const payosConfig = await getPayOSConfig();
  const endpoint = payosConfig.apiEndpoint;

  if (!payosConfig.clientId || !payosConfig.apiKey) {
    return {
      checkoutUrl: null,
      paymentLinkId: null,
      raw: null,
      error: "Thiếu cấu hình PayOS clientId/apiKey",
    };
  }

  if (!payosConfig.checksumKey) {
    return {
      checkoutUrl: null,
      paymentLinkId: null,
      raw: null,
      error: "Thiếu cấu hình PAYOS_CHECKSUM_KEY",
    };
  }

  if (isCircuitOpen()) {
    return {
      checkoutUrl: null,
      paymentLinkId: null,
      raw: null,
      error: "PayOS tạm thời không khả dụng, vui lòng thử lại sau ít phút",
    };
  }

  try {
    console.log("[PayOS] Config source:", payosConfig.source, "| checksumKey len:", payosConfig.checksumKey.length);
    const requestPayload = normalizeCreatePaymentPayload(payload, payosConfig.checksumKey);

    const response = await fetchWithRetry(
      endpoint,
      {
        method: "POST",
        headers: getPayOSHeaders({
          clientId: payosConfig.clientId,
          apiKey: payosConfig.apiKey,
        }),
        body: JSON.stringify(requestPayload),
      },
      {
        timeoutMs: 12000,
        retries: 2,
        retryDelayMs: 500,
      }
    );

    const json = (await response.json().catch(() => ({}))) as PayOSResponseShape;
    const businessCode = String(json?.code ?? "").trim();
    const isBusinessSuccess = !businessCode || businessCode === "00";

    if (!response.ok || !isBusinessSuccess) {
      registerFailure();
      return {
        checkoutUrl: null,
        paymentLinkId: null,
        raw: json,
        error: resolvePayOSError(json, response.status),
      };
    }

    const data = (json?.data || json) as PayOSCreateResult;
    const checkoutUrl = String(data?.checkoutUrl || "").trim();
    const paymentLinkId = String(data?.paymentLinkId || "").trim();

    if (!checkoutUrl || !paymentLinkId) {
      registerFailure();
      return {
        checkoutUrl: null,
        paymentLinkId: null,
        raw: json,
        error: "PayOS không trả về checkoutUrl/paymentLinkId hợp lệ",
      };
    }

    registerSuccess();
    return {
      checkoutUrl,
      paymentLinkId,
      raw: json,
      error: null,
    };
  } catch (error) {
    registerFailure();
    return {
      checkoutUrl: null,
      paymentLinkId: null,
      raw: null,
      error: String(error),
    };
  }
}
