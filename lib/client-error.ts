type ErrorLike = {
  response?: {
    data?: {
      message?: string;
      requestId?: string;
      details?: {
        requestId?: string;
      };
    };
  };
  message?: string;
};

export function getClientErrorMessage(error: unknown, fallback: string) {
  const err = error as ErrorLike;
  const data = err?.response?.data;

  const message = data?.message || fallback;
  const requestId = data?.requestId || data?.details?.requestId;

  if (!requestId) {
    return message;
  }

  return `${message} (Mã: ${requestId})`;
}
