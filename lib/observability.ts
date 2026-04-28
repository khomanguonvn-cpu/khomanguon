export function getRequestId(request: Request) {
  const incoming = request.headers.get("x-request-id")?.trim();
  if (incoming) {
    return incoming;
  }

  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${randomPart}`;
}

type BaseLogInput = {
  requestId: string;
  route: string;
  message: string;
  meta?: Record<string, unknown>;
};

type LogErrorInput = BaseLogInput & {
  error?: unknown;
};

function basePayload(input: BaseLogInput) {
  return {
    route: input.route,
    requestId: input.requestId,
    message: input.message,
    ...(input.meta || {}),
    at: new Date().toISOString(),
  };
}

export function logApiError(input: LogErrorInput) {
  const payload = {
    level: "error",
    ...basePayload(input),
    error: input.error instanceof Error ? input.error.message : String(input.error),
  };

  console.error("[api:error]", payload);
}

export function logApiWarn(input: BaseLogInput) {
  const payload = {
    level: "warn",
    ...basePayload(input),
  };

  console.warn("[api:warn]", payload);
}
