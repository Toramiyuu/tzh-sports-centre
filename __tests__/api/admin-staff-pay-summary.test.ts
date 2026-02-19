import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockNextRequest, fixtures } from "../helpers/api-helpers";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/admin", () => ({ isAdmin: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    lessonSession: { findMany: vi.fn() },
    teacher: { findMany: vi.fn() },
  },
}));

import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/admin/staff/pay-summary/route";

describe("GET /api/admin/staff/pay-summary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for unauthenticated requests", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    vi.mocked(isAdmin).mockReturnValue(false);
    const req = createMockNextRequest({
      url: "http://localhost:3000/api/admin/staff/pay-summary",
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid month format", async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never);
    vi.mocked(isAdmin).mockReturnValue(true);
    const req = createMockNextRequest({
      url: "http://localhost:3000/api/admin/staff/pay-summary",
      searchParams: { month: "invalid" },
    });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("calculates pay summary for a month", async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never);
    vi.mocked(isAdmin).mockReturnValue(true);

    vi.mocked(prisma.teacher.findMany).mockResolvedValue([
      {
        id: "teacher-1",
        name: "Coach Lee",
        payRates: [
          { lessonType: "1-to-1", rate: 50 },
          { lessonType: "1-to-2", rate: 60 },
        ],
      },
    ] as never);

    vi.mocked(prisma.lessonSession.findMany).mockResolvedValue([
      {
        id: "ls-1",
        teacherId: "teacher-1",
        lessonType: "1-to-1",
        lessonDate: new Date("2026-02-10"),
        startTime: "10:00",
        endTime: "11:30",
        duration: 1.5,
        status: "completed",
      },
      {
        id: "ls-2",
        teacherId: "teacher-1",
        lessonType: "1-to-2",
        lessonDate: new Date("2026-02-12"),
        startTime: "14:00",
        endTime: "15:30",
        duration: 1.5,
        status: "completed",
      },
    ] as never);

    const req = createMockNextRequest({
      url: "http://localhost:3000/api/admin/staff/pay-summary",
      searchParams: { month: "2026-02" },
    });
    const res = await GET(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.summary).toHaveLength(1);
    expect(json.summary[0].teacherName).toBe("Coach Lee");
    expect(json.summary[0].totalSessions).toBe(2);
    expect(json.summary[0].totalPay).toBe(110);
  });

  it("defaults to current month when no month param", async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never);
    vi.mocked(isAdmin).mockReturnValue(true);
    vi.mocked(prisma.teacher.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.lessonSession.findMany).mockResolvedValue([] as never);

    const req = createMockNextRequest({
      url: "http://localhost:3000/api/admin/staff/pay-summary",
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.summary).toEqual([]);
  });
});
