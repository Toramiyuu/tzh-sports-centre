"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, ArrowRight } from "lucide-react";
import { LessonTypeData } from "@/lib/hooks/useLessonTypes";
import { useTranslations } from "next-intl";

interface LessonDetailsModalProps {
  lesson: LessonTypeData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestTrial?: () => void;
}

export function LessonDetailsModal({
  lesson,
  open,
  onOpenChange,
  onRequestTrial,
}: LessonDetailsModalProps) {
  const t = useTranslations("lessons");

  if (!lesson) return null;

  const isMonthly = lesson.billingType === "monthly";
  const durations = lesson.pricingTiers.map((t) => t.duration);

  const firstTier = lesson.pricingTiers[0];
  const firstPerPerson =
    lesson.maxStudents > 1 && firstTier
      ? Math.round(firstTier.price / lesson.maxStudents)
      : null;

  const handleRequestTrial = () => {
    onOpenChange(false);
    onRequestTrial?.();
  };

  const lessonLabel = t(`types.${lesson.slug}`);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{lessonLabel}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Description */}
          <p className="text-muted-foreground">
            {lesson.detailedDescription || lesson.description}
          </p>

          {/* Duration & Students */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              {isMonthly ? (
                <span>
                  {lesson.sessionsPerMonth} {t("modal.sessionsPerMonth")}
                </span>
              ) : (
                <span>
                  {durations.length === 1
                    ? `${durations[0]} ${t("packages.hours")}`
                    : `${durations.join(" / ")} ${t("packages.hours")}`}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>
                {t("packages.maxStudents", { count: lesson.maxStudents })}
              </span>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-secondary rounded-lg p-4 border border-border">
            <h4 className="font-semibold text-foreground mb-3">
              {t("modal.pricing")}
            </h4>

            {isMonthly ? (
              <div className="text-2xl font-bold text-primary">
                RM{lesson.price}
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  / {t("packages.perMonth")}
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {lesson.pricingTiers.map((tier) => {
                  const ppPrice =
                    lesson.maxStudents > 1
                      ? Math.round(tier.price / lesson.maxStudents)
                      : null;
                  return (
                    <div
                      key={tier.duration}
                      className="flex items-center justify-between"
                    >
                      <span className="text-muted-foreground">
                        {tier.duration} {t("packages.hours")}
                      </span>
                      <div className="text-right">
                        {ppPrice && lesson.maxStudents > 1 ? (
                          <div>
                            <span className="text-lg font-bold text-primary">
                              RM{ppPrice}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {" "}
                              / {t("modal.perPerson")}
                            </span>
                            <div className="text-xs text-muted-foreground">
                              ({t("modal.total")}: RM{tier.price})
                            </div>
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-primary">
                            RM{tier.price}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Per-person highlight for group lessons */}
            {firstPerPerson && lesson.maxStudents > 1 && !isMonthly && (
              <div className="mt-3 pt-3 border-t border-border">
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-700"
                >
                  {t("modal.perPersonValue", { price: firstPerPerson })}
                </Badge>
              </div>
            )}
          </div>

          {/* Trial Request Button */}
          {onRequestTrial && (
            <Button
              onClick={handleRequestTrial}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              {t("modal.requestTrial")}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
