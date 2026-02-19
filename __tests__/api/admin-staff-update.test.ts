import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockNextRequest, fixtures } from "../helpers/api-helpers";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/admin", () => ({ isAdmin: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    teacher: { findUnique: vi.fn(), update: vi.fn() },
    teacherPayRate: { deleteMany: vi.fn(), createMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { PATCH } from "@/app/api/admin/staff/[id]/route";

const mockContext = { params: Promise.resolve({ id: "teacher-1" }) };

const mockTeacher = {
  id: "teacher-1",
  name: "Coach Lee",
  phone: "0123456789",
  userId: null,
  isActive: true,
  payRates: [
    { id: "pr-1", teacherId: "teacher-1", lessonType: "1-to-1", rate: 50 },
  ],
  user: null,
};

describe("PATCH /api/admin/staff/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for unauthenticated requests", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    vi.mocked(isAdmin).mockReturnValue(false);
    const req = createMockNextRequest({
      method: "PATCH",
      url: "http://localhost:3000/api/admin/staff/teacher-1",
      body: { name: "Updated Name" },
    });
    const res = await PATCH(req, mockContext);
    expect(res.status).toBe(401);
  });

  it("returns 404 when teacher not found", async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never);
    vi.mocked(isAdmin).mockReturnValue(true);
    vi.mocked(prisma.teacher.findUnique).mockResolvedValue(null);
    const req = createMockNextRequest({
      method: "PATCH",
      url: "http://localhost:3000/api/admin/staff/teacher-1",
      body: { name: "Updated Name" },
    });
    const res = await PATCH(req, mockContext);
    expect(res.status).toBe(404);
  });

  it("updates teacher name and pay rates", async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never);
    vi.mocked(isAdmin).mockReturnValue(true);
    vi.mocked(prisma.teacher.findUnique).mockResolvedValue(
      mockTeacher as never,
    );

    const updatedTeacher = { ...mockTeacher, name: "Coach Lee Updated" };
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      return (fn as Function)({
        teacher: {
          update: vi.fn().mockResolvedValue(updatedTeacher),
          findUnique: vi.fn().mockResolvedValue(updatedTeacher),
        },
        teacherPayRate: {
          deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
          createMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      });
    });

    const req = createMockNextRequest({
      method: "PATCH",
      url: "http://localhost:3000/api/admin/staff/teacher-1",
      body: {
        name: "Coach Lee Updated",
        payRates: [{ lessonType: "1-to-1", rate: 60 }],
      },
    });
    const res = await PATCH(req, mockContext);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.teacher.name).toBe("Coach Lee Updated");
  });

  it("returns 400 for invalid pay rate", async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never);
    vi.mocked(isAdmin).mockReturnValue(true);
    vi.mocked(prisma.teacher.findUnique).mockResolvedValue(
      mockTeacher as never,
    );
    const req = createMockNextRequest({
      method: "PATCH",
      url: "http://localhost:3000/api/admin/staff/teacher-1",
      body: { payRates: [{ lessonType: "1-to-1", rate: -10 }] },
    });
    const res = await PATCH(req, mockContext);
    expect(res.status).toBe(400);
  });
});
