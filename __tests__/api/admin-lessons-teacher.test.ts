import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockNextRequest, fixtures } from "../helpers/api-helpers";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/admin", () => ({ isAdmin: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    lessonSession: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    booking: { findFirst: vi.fn() },
    recurringBooking: { findFirst: vi.fn() },
    timeSlot: { findMany: vi.fn() },
    teacher: { findUnique: vi.fn() },
  },
}));

import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { GET, POST, PATCH } from "@/app/api/admin/lessons/route";

describe("Lesson API teacher support", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/admin/lessons", () => {
    it("includes teacher in response", async () => {
      vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never);
      vi.mocked(isAdmin).mockReturnValue(true);
      vi.mocked(prisma.lessonSession.findMany).mockResolvedValue([
        {
          id: "ls-1",
          teacherId: "teacher-1",
          teacher: { id: "teacher-1", name: "Coach Lee" },
          court: { id: 1, name: "Court 1" },
          students: [],
        },
      ] as never);

      const req = createMockNextRequest({
        url: "http://localhost:3000/api/admin/lessons",
        searchParams: { date: "2026-02-20" },
      });
      const res = await GET(req);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(prisma.lessonSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            teacher: expect.any(Object),
          }),
        }),
      );
    });
  });

  describe("POST /api/admin/lessons with teacherId", () => {
    it("rejects non-existent teacher", async () => {
      vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never);
      vi.mocked(isAdmin).mockReturnValue(true);
      vi.mocked(prisma.teacher.findUnique).mockResolvedValue(null);

      const req = createMockNextRequest({
        method: "POST",
        url: "http://localhost:3000/api/admin/lessons",
        body: {
          courtId: 1,
          lessonDate: "2026-02-20",
          startTime: "10:00",
          lessonType: "1-to-1",
          studentIds: ["user-1"],
          teacherId: "nonexistent",
        },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Teacher");
    });

    it("rejects inactive teacher", async () => {
      vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never);
      vi.mocked(isAdmin).mockReturnValue(true);
      vi.mocked(prisma.teacher.findUnique).mockResolvedValue({
        id: "teacher-1",
        isActive: false,
      } as never);

      const req = createMockNextRequest({
        method: "POST",
        url: "http://localhost:3000/api/admin/lessons",
        body: {
          courtId: 1,
          lessonDate: "2026-02-20",
          startTime: "10:00",
          lessonType: "1-to-1",
          studentIds: ["user-1"],
          teacherId: "teacher-1",
        },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("active");
    });

    it("creates lesson with teacherId when teacher is valid", async () => {
      vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never);
      vi.mocked(isAdmin).mockReturnValue(true);
      vi.mocked(prisma.teacher.findUnique).mockResolvedValue({
        id: "teacher-1",
        isActive: true,
      } as never);
      vi.mocked(prisma.booking.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.timeSlot.findMany).mockResolvedValue([]);
      vi.mocked(prisma.recurringBooking.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.lessonSession.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.lessonSession.create).mockResolvedValue({
        id: "ls-new",
        teacherId: "teacher-1",
        teacher: { id: "teacher-1", name: "Coach Lee" },
        court: { id: 1 },
        students: [],
      } as never);

      const req = createMockNextRequest({
        method: "POST",
        url: "http://localhost:3000/api/admin/lessons",
        body: {
          courtId: 1,
          lessonDate: "2026-02-20",
          startTime: "10:00",
          lessonType: "1-to-1",
          studentIds: ["user-1"],
          teacherId: "teacher-1",
        },
      });
      const res = await POST(req);
      expect(res.status).toBe(201);
      expect(prisma.lessonSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            teacherId: "teacher-1",
          }),
        }),
      );
    });
  });

  describe("PATCH /api/admin/lessons with teacherId", () => {
    it("updates teacherId on a lesson", async () => {
      vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never);
      vi.mocked(isAdmin).mockReturnValue(true);
      vi.mocked(prisma.teacher.findUnique).mockResolvedValue({
        id: "teacher-2",
        isActive: true,
      } as never);
      vi.mocked(prisma.lessonSession.update).mockResolvedValue({
        id: "ls-1",
        teacherId: "teacher-2",
      } as never);

      const req = createMockNextRequest({
        method: "PATCH",
        url: "http://localhost:3000/api/admin/lessons",
        body: { lessonId: "ls-1", teacherId: "teacher-2" },
      });
      const res = await PATCH(req);
      expect(res.status).toBe(200);
      expect(prisma.lessonSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ teacherId: "teacher-2" }),
        }),
      );
    });

    it("allows clearing teacherId with null", async () => {
      vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never);
      vi.mocked(isAdmin).mockReturnValue(true);
      vi.mocked(prisma.lessonSession.update).mockResolvedValue({
        id: "ls-1",
        teacherId: null,
      } as never);

      const req = createMockNextRequest({
        method: "PATCH",
        url: "http://localhost:3000/api/admin/lessons",
        body: { lessonId: "ls-1", teacherId: null },
      });
      const res = await PATCH(req);
      expect(res.status).toBe(200);
    });
  });
});
