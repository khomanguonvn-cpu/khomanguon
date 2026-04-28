import { NextResponse } from "next/server";

type ApiSuccessBase = {
  success: true;
  code: string;
};

type ApiErrorBase = {
  success: false;
  code: string;
  message: string;
  details: unknown | null;
};

function toObjectPayload<T>(payload: T): Record<string, unknown> {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }

  return { data: payload };
}

export function ok<T>(data: T, init?: ResponseInit) {
  const payload = toObjectPayload(data);
  const body: ApiSuccessBase & Record<string, unknown> = {
    success: true,
    code: "OK",
    ...payload,
  };

  return NextResponse.json(body, { status: 200, ...init });
}

export function badRequest(message: string, details?: unknown) {
  const body: ApiErrorBase = {
    success: false,
    code: "BAD_REQUEST",
    message,
    details: details ?? null,
  };

  return NextResponse.json(body, { status: 400 });
}

export function unauthorized(message = "Không được phép truy cập", details?: unknown) {
  const body: ApiErrorBase = {
    success: false,
    code: "UNAUTHORIZED",
    message,
    details: details ?? null,
  };

  return NextResponse.json(body, { status: 401 });
}

export function serverError(message = "Lỗi máy chủ nội bộ", details?: unknown) {
  const body: ApiErrorBase = {
    success: false,
    code: "INTERNAL_SERVER_ERROR",
    message,
    details: details ?? null,
  };

  return NextResponse.json(body, { status: 500 });
}

export function forbidden(message = "Truy cập bị từ chối", details?: unknown) {
  const body: ApiErrorBase = {
    success: false,
    code: "FORBIDDEN",
    message,
    details: details ?? null,
  };

  return NextResponse.json(body, { status: 403 });
}

export function notFound(message = "Không tìm thấy dữ liệu", details?: unknown) {
  const body: ApiErrorBase = {
    success: false,
    code: "NOT_FOUND",
    message,
    details: details ?? null,
  };

  return NextResponse.json(body, { status: 404 });
}
