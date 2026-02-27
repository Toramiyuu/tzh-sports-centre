import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockNextRequest, fixtures } from "../helpers/api-helpers";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/admin", () => ({ isAdmin: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    teacher: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    teacherPayRate: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    user: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { GET, POST } from "@/app/api/admin/staff/route";

const mockTeacher = {
  id: "teacher-1",
  name: "Coach Lee",
  phone: "0123456789",
  userId: null,
  role: "TEACHER",
  hourlyRate: 50,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  payRates: [],
  user: null,
};

describe("GET /api/admin/staff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for unauthenticated requests", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    vi.mocked(isAdmin).mockReturnValue(false);
    const req = createMockNextRequest({
      url: "http://localhost:3000/api/admin/staff",
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin users", async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never);
    vi.mocked(isAdmin).mockReturnValue(false);
    const req = createMockNextRequest({
      url: "http://localhost:3000/api/admin/staff",
    });
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("returns active teachers by default", async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never);
    vi.mocked(isAdmin).mockReturnValue(true);
    vi.mocked(prisma.teacher.findMany).mockResolvedValue([
      mockTeacher,
    ] as never);

    const req = createMockNextRequest({
      url: "http://localhost:3000/api/admin/staff",
    });
    const res = await GET(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.teachers).toHaveLength(1);
    expect(json.teachers[0].name).toBe("Coach Lee");
    expect(prisma.teacher.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } }),
    );
  });

  it("returns all teachers when active=false", async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never);
    vi.mocked(isAdmin).mockReturnValue(true);
    vi.mocked(prisma.teacher.findMany).mockResolvedValue([] as never);

    const req = createMockNextRequest({
      url: "http://localhost:3000/api/admin/staff",
      searchParams: { active: "false" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(prisma.teacher.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined }),
    );
  });
});

describe("POST /api/admin/staff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for unauthenticated requests", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    vi.mocked(isAdmin).mockReturnValue(false);
    const req = createMockNextRequest({
      method: "POST",
      url: "http://localhost:3000/api/admin/staff",
      body: { name: "Coach Lee" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for missing name", async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never);
    vi.mocked(isAdmin).mockReturnValue(true);
    const req = createMockNextRequest({
      method: "POST",
      url: "http://localhost:3000/api/admin/staff",
      body: { name: "" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid phone", async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never);
    vi.mocked(isAdmin).mockReturnValue(true);
    const req = createMockNextRequest({
      method: "POST",
      url: "http://localhost:3000/api/admin/staff",
      body: { name: "Coach Lee", phone: "invalid" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("phone");
  });

  it("returns 400 for invalid role", async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never);
    vi.mocked(isAdmin).mockReturnValue(true);
    const req = createMockNextRequest({
      method: "POST",
      url: "http://localhost:3000/api/admin/staff",
      body: { name: "Coach Lee", role: "INVALID" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("role");
  });

  it("returns 400 when userId not found", async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never);
    vi.mocked(isAdmin).mockReturnValue(true);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const req = createMockNextRequest({
      method: "POST",
      url: "http://localhost:3000/api/admin/staff",
      body: { name: "Coach Lee", userId: "nonexistent" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("User not found");
  });

  it("creates teacher with role and hourly rate", async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never);
    vi.mocked(isAdmin).mockReturnValue(true);
    vi.mocked(prisma.teacher.create).mockResolvedValue(mockTeacher as never);

    const req = createMockNextRequest({
      method: "POST",
      url: "http://localhost:3000/api/admin/staff",
      body: {
        name: "Coach Lee",
        phone: "0123456789",
        role: "TEACHER",
        hourlyRate: 50,
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.teacher.name).toBe("Coach Lee");
    expect(prisma.teacher.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: "TEACHER",
          hourlyRate: 50,
        }),
      }),
    );
  });

  it("creates coach assistant", async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never);
    vi.mocked(isAdmin).mockReturnValue(true);
    const coachAssistant = { ...mockTeacher, role: "COACH_ASSISTANT" };
    vi.mocked(prisma.teacher.create).mockResolvedValue(
      coachAssistant as never,
    );

    const req = createMockNextRequest({
      method: "POST",
      url: "http://localhost:3000/api/admin/staff",
      body: {
        name: "Assistant Kim",
        role: "COACH_ASSISTANT",
        hourlyRate: 30,
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(prisma.teacher.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: "COACH_ASSISTANT",
          hourlyRate: 30,
        }),
      }),
    );
  });
});
