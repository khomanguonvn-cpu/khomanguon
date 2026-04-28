import { describe, expect, test, jest, beforeEach } from "@jest/globals";

jest.mock("@/lib/bootstrap", () => ({
  ensureDatabaseReady: jest.fn(async () => undefined),
}));

jest.mock("@/lib/api-auth", () => ({
  requireSessionUser: jest.fn(async () => null),
  requireAdminUser: jest.fn(async () => null),
}));

describe("API smoke tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("POST /api/order returns unauthorized when no session", async () => {
    const { POST } = await import("@/app/api/order/route");

    const request = new Request("http://localhost/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.code).toBe("UNAUTHORIZED");
  });

  test("POST /api/coupon returns validation error on bad payload", async () => {
    const { requireSessionUser } = await import("@/lib/api-auth");
    (requireSessionUser as jest.Mock).mockResolvedValue({
      id: "1",
      role: "user",
    });

    const { POST } = await import("@/app/api/coupon/route");

    const request = new Request("http://localhost/api/coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coupon: "", user: "abc" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.code).toBe("BAD_REQUEST");
    expect(Array.isArray(body.details)).toBe(true);
  });

  test("GET /api/payos/health denies non-admin", async () => {
    const { GET } = await import("@/app/api/payos/health/route");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.code).toBe("UNAUTHORIZED");
  });

  test("POST /api/otp/send returns bad request for invalid email", async () => {
    const { POST } = await import("@/app/api/otp/send/route");

    const request = new Request("http://localhost/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.code).toBe("BAD_REQUEST");
    expect(Array.isArray(body.details)).toBe(true);
  });

  test("POST /api/otp/verify returns bad request for invalid payload", async () => {
    const { POST } = await import("@/app/api/otp/verify/route");

    const request = new Request("http://localhost/api/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@a.com", code: "1" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.code).toBe("BAD_REQUEST");
    expect(Array.isArray(body.details)).toBe(true);
  });

  test("POST /api/shipping returns validation details for invalid shipping payload", async () => {
    const { requireSessionUser } = await import("@/lib/api-auth");
    (requireSessionUser as jest.Mock).mockResolvedValue({
      id: "1",
      role: "user",
    });

    const { POST } = await import("@/app/api/shipping/route");

    const request = new Request("http://localhost/api/shipping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: 1,
        shipping: {
          firstName: "",
          lastName: "A",
          phoneNumber: "",
          state: "",
          city: "",
          zipCode: "",
          address: "",
          country: "",
        },
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.code).toBe("BAD_REQUEST");
    expect(Array.isArray(body.details)).toBe(true);
  });

  test("POST /api/order returns validation details for bad payload", async () => {
    const { requireSessionUser } = await import("@/lib/api-auth");
    (requireSessionUser as jest.Mock).mockResolvedValue({
      id: "1",
      role: "user",
    });

    const { POST } = await import("@/app/api/order/route");

    const request = new Request("http://localhost/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: 1,
        products: [],
        paymentMethod: "",
        total: -1,
        totalBeforeDiscount: -1,
        shippingPrice: -1,
        idempotencyKey: "",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.code).toBe("BAD_REQUEST");
    expect(Array.isArray(body.details)).toBe(true);
  });
});
