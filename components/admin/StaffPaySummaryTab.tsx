"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, RefreshCw } from "lucide-react";

export interface PaySummaryEntry {
  teacherId: string;
  teacherName: string;
  hourlyRate: number;
  totalSessions: number;
  totalHours: number;
  totalPay: number;
  lessons: {
    id: string;
    lessonType: string;
    lessonDate: string;
    startTime: string;
    endTime: string;
    duration: number;
    pay: number;
  }[];
}

interface PaySummaryTabProps {
  summary: PaySummaryEntry[];
  month: string;
  onMonthChange: (m: string) => void;
  onRefresh: () => void;
  loading: boolean;
  t: (key: string) => string;
}

export default function StaffPaySummaryTab({
  summary,
  month,
  onMonthChange,
  onRefresh,
  loading,
  t,
}: PaySummaryTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div>
          <Label>{t("month")}</Label>
          <Input
            type="month"
            value={month}
            onChange={(e) => onMonthChange(e.target.value)}
            className="w-48"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="mt-5"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {summary.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <DollarSign className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">{t("noData")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {summary.map((entry) => (
            <Card key={entry.teacherId}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{entry.teacherName}</CardTitle>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      RM{entry.totalPay.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.totalSessions} {t("totalSessions").toLowerCase()}{" "}
                      &middot; {entry.totalHours}hr &middot; RM
                      {entry.hourlyRate}/hr
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2 font-medium">Date</th>
                        <th className="text-left py-2 font-medium">
                          {t("lessonType")}
                        </th>
                        <th className="text-left py-2 font-medium">Time</th>
                        <th className="text-right py-2 font-medium">
                          {t("duration")}
                        </th>
                        <th className="text-right py-2 font-medium">
                          {t("pay")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {entry.lessons.map((lesson) => (
                        <tr
                          key={lesson.id}
                          className="border-b border-border/50"
                        >
                          <td className="py-2">
                            {new Date(lesson.lessonDate).toLocaleDateString()}
                          </td>
                          <td className="py-2">
                            <Badge variant="outline" className="text-xs">
                              {lesson.lessonType}
                            </Badge>
                          </td>
                          <td className="py-2">
                            {lesson.startTime} - {lesson.endTime}
                          </td>
                          <td className="py-2 text-right">
                            {lesson.duration}hr
                          </td>
                          <td className="py-2 text-right font-medium">
                            RM{lesson.pay.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
